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
      className="bg-[var(--color-bg-secondary)] py-10"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <p className="text-center text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-secondary)]">
          Trusted by clinics and care teams
        </p>
        <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 ">
          {trustedLogos.map((logo) => (
            <div
              key={logo}
              className="border-b border-[var(--color-border)] px-4 py-5 text-center text-sm font-bold text-[var(--color-secondary)] transition duration-300 hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
            >
              {logo}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
