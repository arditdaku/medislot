const patient = {
  name: "Ereza",
};

const summaryCards = [
  {
    title: "Upcoming appointments",
    value: "2",
    description: "Scheduled visits",
  },
  {
    title: "Total visits",
    value: "8",
    description: "Completed appointments",
  },
  {
    title: "Loyalty status",
    value: "Gold",
    description: "Priority booking enabled",
  },
];

const upcomingAppointments = [
  {
    doctor: "Dr. Arben Krasniqi",
    department: "Dentist",
    date: "18 Jun 2026",
    time: "10:30",
  },
  {
    doctor: "Dr. Elira Berisha",
    department: "General Medicine",
    date: "24 Jun 2026",
    time: "09:00",
  },
];

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

      <section className="mb-8 grid gap-4 md:grid-cols-3">
        {summaryCards.map((card) => (
          <article
            key={card.title}
            className="rounded-lg border border-border bg-card p-5 text-card-foreground shadow-sm"
          >
            <p className="text-sm font-medium text-muted-foreground">
              {card.title}
            </p>
            <p className="mt-3 text-3xl font-bold text-primary">{card.value}</p>
            <p className="mt-2 text-sm text-muted-foreground">
              {card.description}
            </p>
          </article>
        ))}
      </section>

      <section className="mb-8 rounded-lg border border-border bg-card p-5 text-card-foreground shadow-sm">
        <div className="mb-4">
          <h2 className="text-xl font-semibold">Try AI booking</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Describe your symptoms or preferred doctor and we will suggest a booking option.
          </p>
        </div>

        <div className="flex flex-col gap-3 md:flex-row">
          <input
            className="min-h-11 flex-1 rounded-md border border-input bg-background px-4 text-sm outline-none focus:border-primary"
            placeholder="e.g. tooth pain next Tuesday morning"
            type="text"
          />
          <button className="rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground">
            Try AI booking
          </button>
        </div>
      </section>

      <section className="rounded-lg border border-border bg-card p-5 text-card-foreground shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Upcoming Appointments</h2>
          <span className="text-sm text-muted-foreground">
            {upcomingAppointments.length} scheduled
          </span>
        </div>

        <div className="space-y-3">
          {upcomingAppointments.map((appointment) => (
            <article
              key={`${appointment.doctor}-${appointment.date}`}
              className="rounded-md border border-border bg-background p-4"
            >
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-semibold">{appointment.doctor}</p>
                  <p className="text-sm text-muted-foreground">
                    {appointment.department}
                  </p>
                </div>
                <p className="text-sm font-medium text-primary">
                  {appointment.date} · {appointment.time}
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}