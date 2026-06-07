export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        fontFamily: "system-ui",
        background: "#f9fafb",
      }}
    >
      <div style={{ width: 360 }}>{children}</div>
    </div>
  );
}
