// DEMO layout — vetëm për testim. Zëvendësoje me sidebar/topbar reale më vonë.
// Kujto: kjo është vetëm UX. Auth + kontrollet e rolit bëhen nga FastAPI.
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "system-ui" }}>
      <aside
        style={{
          width: 220,
          background: "#111827",
          color: "#e5e7eb",
          padding: "1.5rem 1rem",
        }}
      >
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 24 }}>
          MediSlot · DEMO
        </h2>

        <nav style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <DemoSection title="Patient" links={[
            ["Dashboard", "/patient"],
            ["Book", "/patient/book"],
            ["Appointments", "/patient/appointments"],
            ["Profile", "/patient/profile"],
          ]} />

          <DemoSection title="Doctor" links={[
            ["Dashboard", "/doctor"],
            ["Schedule", "/doctor/schedule"],
            ["Visits", "/doctor/visits"],
          ]} />

          <DemoSection title="Staff" links={[
            ["Dashboard", "/staff"],
            ["Providers", "/staff/providers"],
            ["Services", "/staff/services"],
            ["Slots", "/staff/slots"],
            ["Appointments", "/staff/appointments"],
            ["Queue", "/staff/queue"],
          ]} />
        </nav>
      </aside>

      <main style={{ flex: 1, padding: "2rem" }}>{children}</main>
    </div>
  );
}

function DemoSection({
  title,
  links,
}: {
  title: string;
  links: [string, string][];
}) {
  return (
    <div>
      <p style={{ fontSize: 11, textTransform: "uppercase", opacity: 0.5, marginBottom: 8 }}>
        {title}
      </p>
      <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 6 }}>
        {links.map(([label, href]) => (
          <li key={href}>
            <a href={href} style={{ color: "#93c5fd", textDecoration: "none", fontSize: 14 }}>
              {label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
