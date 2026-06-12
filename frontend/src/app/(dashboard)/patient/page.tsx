const patient = {
  name: "Ereza",
};

export default function Page() {
  return (
    <main className="min-h-screen bg-background px-6 py-8 text-foreground">
      <section className="mb-8">
        <p className="text-sm font-medium text-primary">Patient Dashboard</p>
        <h1 className="mt-2 text-3xl font-bold">Welcome back, {patient.name}</h1>
        <p className="mt-2 text-muted-foreground">
          Track your appointments, visits, and booking options in one place.
        </p>
      </section>
    </main>
  );
}