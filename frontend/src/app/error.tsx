"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div style={{ padding: "2rem", fontFamily: "system-ui" }}>
      <h2>Diçka shkoi keq</h2>
      <p style={{ color: "#6b7280" }}>{error.message}</p>
      <button onClick={reset} style={{ marginTop: 12 }}>
        Provo përsëri
      </button>
    </div>
  );
}
