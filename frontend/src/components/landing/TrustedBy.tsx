const trustedLogos = [
  "Northwell Clinic",
  "CareBridge",
  "Metro Health",
  "Aster Medical",
  "Medora Group",
];

export default function TrustedBy() {
  return (
    <section
      aria-label="Trusted by healthcare organizations"
      className="bg-white py-10"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <p className="text-center text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-secondary)]">
          Trusted by clinics and care teams
        </p>
        <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {trustedLogos.map((logo) => (
            <div
              key={logo}
              className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-5 text-center text-sm font-bold text-[var(--color-secondary)] grayscale transition duration-300 hover:border-[var(--color-primary)] hover:bg-white hover:text-[var(--color-primary)] hover:grayscale-0"
            >
              {logo}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
