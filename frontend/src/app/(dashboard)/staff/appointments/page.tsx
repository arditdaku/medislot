"use client";

const tableHeaders = ["#", "Patient", "Age", "Date & Time", "Doctor", "Fees", "Action"];

export default function StaffAppointmentsPage() {
  return (
    <main className="min-h-screen bg-background px-6 py-8 text-foreground">
      <section className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Admin</p>
          <h1 className="mt-2 text-3xl font-bold">All Appointments</h1>
        </div>
      </section>

      <section className="overflow-hidden rounded-lg border border-border bg-card text-card-foreground shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] border-collapse text-left text-sm">
            <thead className="bg-muted/60 text-xs uppercase text-muted-foreground">
              <tr>
                {tableHeaders.map((header) => (
                  <th key={header} className="px-4 py-3 font-semibold">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="px-4 py-4" colSpan={tableHeaders.length}>
                  Loading appointments...
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}