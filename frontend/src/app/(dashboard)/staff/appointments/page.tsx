"use client";

import { useState } from "react";

type AppointmentStatus = "pending" | "completed" | "cancelled";

type AppointmentFilter = "all" | AppointmentStatus;

type Appointment = {
  id: string;
  patientName: string;
  patientAge: number;
  dateTime: string;
  doctorName: string;
  fees: number;
  status: AppointmentStatus;
};

const tableHeaders = ["#", "Patient", "Age", "Date & Time", "Doctor", "Fees", "Action"];

const appointmentFilters: { label: string; value: AppointmentFilter }[] = [
  { label: "All appointments", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Completed", value: "completed" },
  { label: "Cancelled", value: "cancelled" },
];

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

async function getAllAppointments(filter: AppointmentFilter) {
  const searchParams = new URLSearchParams();

  if (filter !== "all") {
    searchParams.set("status", filter);
  }

  const response = await fetch(`${apiUrl}/appointments?${searchParams.toString()}`);

  if (!response.ok) {
    throw new Error("Failed to fetch appointments");
  }

  return response.json();
}

async function updateAppointmentStatus(id: string, status: AppointmentStatus) {
  const response = await fetch(`${apiUrl}/appointments/${id}/status`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ status }),
  });

  if (!response.ok) {
    throw new Error("Failed to update appointment status");
  }

  return response.json();
}

export default function StaffAppointmentsPage() {
  const [filter, setFilter] = useState<AppointmentFilter>("all");

  return (
    <main className="min-h-screen bg-background px-6 py-8 text-foreground">
      <section className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Admin</p>
          <h1 className="mt-2 text-3xl font-bold">All Appointments</h1>
        </div>

        <select
          value={filter}
          onChange={(event) => setFilter(event.target.value as AppointmentFilter)}
          className="min-h-11 rounded-md border border-input bg-background px-4 text-sm outline-none focus:border-primary"
        >
          {appointmentFilters.map((appointmentFilter) => (
            <option key={appointmentFilter.value} value={appointmentFilter.value}>
              {appointmentFilter.label}
            </option>
          ))}
        </select>
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
