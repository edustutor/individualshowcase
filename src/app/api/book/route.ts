import { NextResponse } from "next/server";
import { mergePhoneNumbers } from "@/lib/phone";

/**
 * Booking → EDUS CRM bridge.
 *
 * Flow (per spec):
 *   1. Search CRM for an existing lead by phone:
 *        GET {BASE}/leads/search/{phone}
 *      The CRM returns 400 when no lead matches — that's our "create" signal.
 *   2a. No existing lead → POST {BASE}/leads with the full payload.
 *   2b. Existing lead → PUT {BASE}/leads/{id}:
 *        - overwrite `name` with the new name
 *        - append the new phone to the existing `phonenumber` as "X / Y"
 *          (skipped if the new number is already in the field)
 *        - add `email` only if the existing lead has none (don't overwrite)
 *        - overwrite `description` with the new full booking summary
 *        - set status = 12; assigned + source untouched
 *
 * The phone supplied to this route is ALREADY normalized client-side (digits
 * only, includes country code). The client uses libphonenumber-js to do that.
 */

type CrmLead = {
  id?: string | number;
  name?: string;
  email?: string;
  phonenumber?: string;
  description?: string;
  status?: string;
  source?: string;
  assigned?: string;
  [k: string]: unknown;
};

type BookingPayload = {
  studentName: string;
  studentPhone: string; // pre-normalized E.164-without-plus, e.g. 94707072525
  studentEmail?: string;
  description: string; // pre-composed by the client (every step's selections)
};

const BASE = process.env.EDUS_CRM_BASE_URL;
const TOKEN = process.env.EDUS_CRM_AUTHTOKEN;
const SOURCE = process.env.EDUS_CRM_DEFAULT_SOURCE || "15";
const STATUS = process.env.EDUS_CRM_DEFAULT_STATUS || "12";
const ASSIGNED = process.env.EDUS_CRM_DEFAULT_ASSIGNED || "1";

// Dev-only structured logger. NODE_ENV is set automatically by Next.js
// ("development" via `npm run dev`, "production" for built deploys), so these
// lines print to the dev terminal but stay silent on Vercel production builds.
// Errors always log (via console.error in the POST handler) so prod failures
// remain visible in Vercel's runtime logs.
const IS_DEV = process.env.NODE_ENV !== "production";
function devLog(tag: string, payload?: unknown) {
  if (!IS_DEV) return;
  if (payload === undefined) {
    console.log(`[CRM] ${tag}`);
  } else {
    console.log(`[CRM] ${tag}`, payload);
  }
}

// The CRM is a CodeIgniter / Perfex-style PHP API with an asymmetric body
// requirement that we verified live with curl:
//   - POST /leads        → application/x-www-form-urlencoded  (rejects JSON with 404 "field required")
//   - PUT  /leads/{id}   → application/json                   (rejects form bodies with 406 "Data Not Acceptable")
//   - GET  /leads/...    → headers only
// This asymmetry is a known PHP/CodeIgniter quirk: PHP only populates $_POST
// for POSTs, so PUT handlers in Perfex read php://input as JSON instead.
// Success in all cases: HTTP 200 + {"status": true, ...}.
// Search not-found: HTTP 404 + {"status": false, "message": "No data were found"}.
function crmHeadersForm(): HeadersInit {
  return {
    "Content-Type": "application/x-www-form-urlencoded",
    Accept: "application/json",
    authtoken: TOKEN!,
  };
}
function crmHeadersJson(): HeadersInit {
  return {
    "Content-Type": "application/json",
    Accept: "application/json",
    authtoken: TOKEN!,
  };
}

// Encode a flat object as form data, skipping undefined/empty values.
function toFormBody(obj: Record<string, unknown>): string {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === null || v === "") continue;
    params.set(k, String(v));
  }
  return params.toString();
}

// Lookup. Returns the lead if found, null on 404 (CRM's "no match" code),
// throws on any other failure so callers see a real error.
async function findLeadByPhone(phone: string): Promise<CrmLead | null> {
  devLog("SEARCH → GET /leads/search/" + phone);
  const res = await fetch(`${BASE}/leads/search/${encodeURIComponent(phone)}`, {
    method: "GET",
    headers: { authtoken: TOKEN!, Accept: "application/json" },
    cache: "no-store",
  });
  devLog(`SEARCH ← HTTP ${res.status}`);

  // 404 = "No data were found" — explicit not-found signal from the CRM.
  if (res.status === 404) {
    devLog("SEARCH = not found (will CREATE)");
    return null;
  }
  if (!res.ok) {
    throw new Error(`CRM search failed (${res.status}): ${await res.text()}`);
  }

  const data = await res.json().catch(() => null);
  if (!data) return null;
  // CRM responses observed in two shapes: bare object OR {status, data: [...]}.
  if (data.status === false) {
    devLog("SEARCH = not found via status:false (will CREATE)");
    return null;
  }
  const lead = Array.isArray(data) ? data[0] : (data.data?.[0] ?? data);
  if (!lead || typeof lead !== "object" || Object.keys(lead).length === 0) {
    devLog("SEARCH = empty body (will CREATE)");
    return null;
  }
  devLog("SEARCH = found existing lead", { id: lead.id, name: lead.name, phonenumber: lead.phonenumber });
  return lead as CrmLead;
}

async function createLead(payload: BookingPayload) {
  // POST → form-encoded body (verified live; JSON returns 404 "field required").
  const body = toFormBody({
    name: payload.studentName,
    phonenumber: payload.studentPhone,
    email: payload.studentEmail,
    description: payload.description,
    source: SOURCE,
    status: STATUS,
    assigned: ASSIGNED,
  });
  devLog("CREATE → POST /leads", {
    name: payload.studentName,
    phonenumber: payload.studentPhone,
    email: payload.studentEmail || "(omitted)",
    descriptionChars: payload.description.length,
    source: SOURCE,
    status: STATUS,
    assigned: ASSIGNED,
  });
  const res = await fetch(`${BASE}/leads`, {
    method: "POST",
    headers: crmHeadersForm(),
    body,
  });
  const data = await res.json().catch(() => null);
  devLog(`CREATE ← HTTP ${res.status}`, data);
  if (!res.ok || data?.status === false) {
    throw new Error(
      `CRM create failed (${res.status}): ${data?.message || JSON.stringify(data) || "(no body)"}`
    );
  }
  return data;
}

// Compose the description for an updated lead by APPENDING the new booking
// below the existing description, with a horizontal separator. We never lose
// the history of past bookings — the coordinator sees every booking the
// student has made, oldest at the top, newest at the bottom.
function appendDescription(existing: string | null | undefined, addition: string): string {
  const prior = (existing || "").trim();
  if (!prior) return addition;
  // Don't double-append if the latest booking is byte-identical to the tail
  // (defensive against accidental double-submits within the same minute).
  if (prior.endsWith(addition.trim())) return prior;
  const separator = "\n\n" + "═".repeat(50) + "\n\n";
  return prior + separator + addition;
}

async function updateLead(existing: CrmLead, payload: BookingPayload) {
  const merged = mergePhoneNumbers(existing.phonenumber, payload.studentPhone);
  const fields: Record<string, unknown> = {
    name: payload.studentName, // overwrite
    phonenumber: merged, // append (slash) if new, else keep
    description: appendDescription(existing.description, payload.description), // append, preserving history
    status: STATUS, // re-set per spec
    // assigned + source intentionally NOT touched on update
  };
  // Only fill email if the existing lead has none.
  const existingEmail = (existing.email || "").trim();
  if (!existingEmail && payload.studentEmail) {
    fields.email = payload.studentEmail;
  }

  // PUT → JSON body (verified live; form-encoded returns 406 "Data Not
  // Acceptable" because PHP doesn't populate $_POST for PUT and Perfex's
  // PUT handler reads php://input as JSON).
  devLog(`UPDATE → PUT /leads/${existing.id}`, {
    name: fields.name,
    phonenumber: fields.phonenumber,
    descriptionChars: typeof fields.description === "string" ? fields.description.length : null,
    emailAdded: "email" in fields ? fields.email : "(kept existing)",
    status: fields.status,
  });
  const res = await fetch(`${BASE}/leads/${existing.id}`, {
    method: "PUT",
    headers: crmHeadersJson(),
    body: JSON.stringify(fields),
  });
  const data = await res.json().catch(() => null);
  devLog(`UPDATE ← HTTP ${res.status}`, data);
  if (!res.ok || data?.status === false) {
    throw new Error(
      `CRM update failed (${res.status}): ${data?.message || JSON.stringify(data) || "(no body)"}`
    );
  }
  return data;
}

export async function POST(request: Request) {
  if (!BASE || !TOKEN) {
    console.error("CRM env vars missing — set EDUS_CRM_BASE_URL + EDUS_CRM_AUTHTOKEN.");
    return NextResponse.json({ success: false, message: "Server misconfigured." }, { status: 500 });
  }

  let payload: BookingPayload;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ success: false, message: "Invalid JSON." }, { status: 400 });
  }

  const studentName = (payload.studentName || "").trim();
  const studentPhone = (payload.studentPhone || "").trim();
  const description = (payload.description || "").trim();
  if (!studentName || !studentPhone || !description) {
    return NextResponse.json(
      { success: false, message: "studentName, studentPhone, and description are required." },
      { status: 400 }
    );
  }

  devLog("───────── booking received ─────────");
  devLog("PAYLOAD", {
    studentName,
    studentPhone,
    studentEmail: payload.studentEmail || "(omitted)",
    descriptionChars: description.length,
  });

  try {
    const existing = await findLeadByPhone(studentPhone);
    const result = existing
      ? await updateLead(existing, { studentName, studentPhone, studentEmail: payload.studentEmail, description })
      : await createLead({ studentName, studentPhone, studentEmail: payload.studentEmail, description });

    const leadId = existing?.id ?? result?.id ?? null;
    devLog(`DONE: ${existing ? "UPDATED" : "CREATED"} lead`, { leadId });
    return NextResponse.json({
      success: true,
      mode: existing ? "updated" : "created",
      leadId,
    });
  } catch (err) {
    console.error("CRM booking error:", err);
    return NextResponse.json(
      { success: false, message: err instanceof Error ? err.message : "CRM request failed." },
      { status: 502 }
    );
  }
}
