import { getCountries, getCountryCallingCode, parsePhoneNumberFromString, type CountryCode } from "libphonenumber-js";

/**
 * Strip every non-digit (drops +, spaces, dashes, parens) — then prepend the
 * country calling code. Matches the CRM's "digits only, starts with country
 * code" requirement (94707072525, 919876543210, etc.).
 *
 * If the user already typed the country code (e.g. they pasted "94707072525"
 * with Sri Lanka selected), we don't double it — strip a leading copy first.
 */
export function normalizePhone(rawInput: string, country: CountryCode): string | null {
  const digits = rawInput.replace(/\D/g, "");
  if (!digits) return null;

  const callingCode = getCountryCallingCode(country);

  // If the user input already starts with the calling code, trust that.
  let national = digits;
  if (national.startsWith(callingCode)) {
    national = national.slice(callingCode.length);
  } else if (national.startsWith("0")) {
    // Sri Lanka users often type 0707072525 — drop the trunk-prefix 0.
    national = national.replace(/^0+/, "");
  }

  if (!national) return null;

  const candidate = callingCode + national;
  // Validate using libphonenumber so we don't ship obvious nonsense to the CRM.
  const parsed = parsePhoneNumberFromString("+" + candidate, country);
  if (parsed && parsed.isValid()) {
    return parsed.number.replace(/\D/g, ""); // E.164 minus the +
  }
  // Fall back to digits-only concat even if libphonenumber is skeptical —
  // some valid corporate / new-allocation numbers fail its strict check.
  return candidate;
}

export type CountryOption = {
  code: CountryCode;
  name: string;
  callingCode: string;
};

// Resolve every supported country once. ~240 entries, ~3 KB of strings.
const displayNames = new Intl.DisplayNames(["en"], { type: "region" });

export function listCountries(): CountryOption[] {
  const result: CountryOption[] = [];
  for (const code of getCountries()) {
    const name = displayNames.of(code);
    if (!name) continue;
    result.push({ code, name, callingCode: getCountryCallingCode(code) });
  }
  return result.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Append a new phone number to an existing phonenumber field using the
 * slash-separated convention ("94771178292 / 94774598000"). Returns the
 * existing value untouched if the new number is already present.
 */
export function mergePhoneNumbers(existing: string | null | undefined, addition: string): string {
  const current = (existing || "").trim();
  if (!current) return addition;
  const parts = current.split("/").map((p) => p.trim()).filter(Boolean);
  if (parts.includes(addition)) return current;
  return [...parts, addition].join(" / ");
}
