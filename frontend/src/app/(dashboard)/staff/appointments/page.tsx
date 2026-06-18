"use client";

import { useEffect, useState } from "react";
import { Check, X } from "lucide-react";

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

const tableHeaders = [
  "#",
  "Patient",
  "Age",
  "Date & Time",
  "Doctor",
  "Fees",
  "Action",
];

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

  const response = await fetch(
    `${apiUrl}/appointments?${searchParams.toString()}`,
  );

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

function getStatusClassName(status: AppointmentStatus) {
  if (status === "completed") {
    return "text-primary";
  }

  if (status === "cancelled") {
    return "text-destructive";
  }

  return "text-muted-foreground";
}

export default function StaffAppointmentsPage() {
  const [filter, setFilter] = useState<AppointmentFilter>("all");
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchAppointments = async () => {
      setIsLoading(true);
      setError("");

      try {
        const data = await getAllAppointments(filter);
        setAppointments(data);
      } catch {
        setError("Could not load appointments.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchAppointments();
  }, [filter]);

  const handleStatusUpdate = async (
    id: string,
    status: AppointmentStatus,
  ) => {
    try {
      await updateAppointmentStatus(id, status);
      const data = await getAllAppointments(filter);
      setAppointments(data);
    } catch {
      setError("Could not update appointment status.");
    }
  };

  return (
    <main className="min-h-screen bg-background px-6 py-8 text-foreground">
      <section className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Admin</p>
          <h1 className="mt-2 text-3xl font-bold">All Appointments</h1>
        </div>

        <select
          value={filter}
          onChange={(event) =>
            setFilter(event.target.value as AppointmentFilter)
          }
          className="min-h-11 rounded-md border border-input bg-background px-4 text-sm outline-none focus:border-primary"
        >
          {appointmentFilters.map((appointmentFilter) => (
            <option
              key={appointmentFilter.value}
              value={appointmentFilter.value}
            >
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
              {isLoading && (
                <tr>
                  <td className="px-4 py-4" colSpan={tableHeaders.length}>
                    Loading appointments...
                  </td>
                </tr>
              )}

              {!isLoading && error && (
                <tr>
                  <td
                    className="px-4 py-4 text-destructive"
                    colSpan={tableHeaders.length}
                  >
                    {error}
                  </td>
                </tr>
              )}

              {!isLoading && !error && appointments.length === 0 && (
                <tr>
                  <td
                    className="px-4 py-4 text-muted-foreground"
                    colSpan={tableHeaders.length}
                  >
                    No appointments found.
                  </td>
                </tr>
              )}

              {!isLoading &&
                !error &&
                appointments.map((appointment, index) => (
                  <tr
                    key={appointment.id}
                    className="border-t border-border transition-colors hover:bg-muted/40"
                  >
                    <td className="px-4 py-4 font-medium">{index + 1}</td>
                    <td className="px-4 py-4">{appointment.patientName}</td>
                    <td className="px-4 py-4">{appointment.patientAge}</td>
                    <td className="px-4 py-4">{appointment.dateTime}</td>
                    <td className="px-4 py-4">{appointment.doctorName}</td>
                    <td className="px-4 py-4">${appointment.fees}</td>
                    <td className="px-4 py-4">
                      {appointment.status === "pending" ? (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              handleStatusUpdate(appointment.id, "completed")
                            }
                            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-primary/30 bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground"
                            aria-label="Mark appointment as completed"
                          >
                            <Check className="h-4 w-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleStatusUpdate(appointment.id, "cancelled")
                            }
                            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                            aria-label="Cancel appointment"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <span
                          className={`font-semibold capitalize ${getStatusClassName(
                            appointment.status,
                          )}`}
                        >
                          {appointment.status}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}