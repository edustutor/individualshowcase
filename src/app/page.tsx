import FilterForm from "@/components/FilterForm";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-white relative overflow-hidden" style={{ fontFeatureSettings: '"calt"' }}>
      {/* Main Content */}
      <main className="flex-grow flex flex-col items-center justify-center px-4 py-6 sm:p-12 z-10 w-full max-w-7xl mx-auto">

        <div className="flex flex-col items-center text-center max-w-4xl mb-10 sm:mb-16 mt-8 md:mt-20">
          {/* Badge — pill style */}
          <div
            className="inline-flex items-center px-4 py-2 mb-8 text-sm font-semibold text-primary"
            style={{
              borderRadius: "9999px",
              background: "rgba(37, 99, 235, 0.08)",
              boxShadow: "rgba(16,32,51,0.12) 0px 0px 0px 1px",
              fontFeatureSettings: '"calt"',
            }}
          >
            <span className="flex w-2 h-2 rounded-full bg-cta mr-2.5 animate-pulse" />
            Over 10,000 students enrolled
          </div>

          {/* Billboard headline — weight 900, tight line-height.
             Accent words use the brand blue→violet gradient (matches EDUS marketing site). */}
          <h1
            className="text-ink mb-6"
            style={{
              fontSize: "clamp(2.25rem, 8vw, 5.5rem)",
              fontWeight: 900,
              lineHeight: 0.95,
              letterSpacing: "-0.02em",
              fontFeatureSettings: '"calt"',
            }}
          >
            Find Your{" "}
            <span className="brand-gradient-text">Perfect</span>
            <br />
            <span className="brand-gradient-text">Tutor</span>
          </h1>

          <p
            className="text-muted max-w-2xl mb-10"
            style={{
              fontSize: "1.125rem",
              fontWeight: 600,
              lineHeight: 1.44,
              letterSpacing: "-0.108px",
              fontFeatureSettings: '"calt"',
            }}
          >
            Connect with expert educators across all grades, subjects, and mediums.
            Filter and book the best tutor tailored to your specific syllabus requirements.
          </p>
        </div>

        <div className="w-full mb-10 sm:mb-16 px-0 sm:px-0">
          <FilterForm />
        </div>

        {/* Trust indicators — each badge takes one of the three brand cool colors
           (Primary Blue → Violet → Cyan), echoing the EDUS palette card */}
        <div className="flex flex-wrap justify-center gap-4 sm:gap-8 mb-12">
          {[
            { label: "Verified Tutors", icon: "shield", tint: "rgba(37, 99, 235, 0.10)", ink: "#2563eb" },
            { label: "All Syllabuses", icon: "book", tint: "rgba(139, 92, 246, 0.10)", ink: "#8b5cf6" },
            { label: "Flexible Scheduling", icon: "clock", tint: "rgba(6, 182, 212, 0.12)", ink: "#06b6d4" },
          ].map((item) => (
            <div
              key={item.label}
              className="flex items-center gap-2.5 text-sm font-semibold text-muted"
              style={{ fontFeatureSettings: '"calt"' }}
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: item.tint }}
              >
                {item.icon === "shield" && (
                  <svg className="w-4 h-4" style={{ color: item.ink }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                )}
                {item.icon === "book" && (
                  <svg className="w-4 h-4" style={{ color: item.ink }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                )}
                {item.icon === "clock" && (
                  <svg className="w-4 h-4" style={{ color: item.ink }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
              </div>
              {item.label}
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer
        className="w-full z-10 py-8 mt-auto"
        style={{ boxShadow: "rgba(16,32,51,0.12) 0px 0px 0px 1px inset" }}
      >
        <div
          className="max-w-7xl mx-auto px-6 text-center text-muted text-sm font-semibold"
          style={{ fontFeatureSettings: '"calt"' }}
        >
          &copy; {new Date().getFullYear()} EDUS. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
