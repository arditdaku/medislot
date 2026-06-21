"use client";

import { useCallback, useEffect, useState } from "react";

import { getAllAppointments } from "@/lib/api/appointments";
import type {
  AdminAppointment,
  AppointmentStatus,
} from "@/types/api";
import StatusBadge from "@/components/shared/status-badge";
import Select from "@/components/ui/select";

type AppointmentFilter = "all" | AppointmentStatus;

const TABLE_HEADERS = [
  "#",
  "Patient",
  "Age",
  "Date & Time",
  "Doctor",
  "Service",
  "Fees",
  "Status",
];

const APPOINTMENT_FILTERS: { label: string; value: AppointmentFilter }[] = [
  { label: "All appointments", value: "all" },
  { label: "Waiting", value: "waiting" },
  { label: "In progress", value: "in_progress" },
  { label: "Completed", value: "completed" },
  { label: "Cancelled", value: "cancelled" },
  { label: "No show", value: "no_show" },
];

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function initials(name: string | null): string {
  if (!name) return "–";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "–";
}

export default function StaffAppointmentsPage() {
  const [filter, setFilter] = useState<AppointmentFilter>("all");
  const [appointments, setAppointments] = useState<AdminAppointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadAppointments = useCallback(async () => {
    // Bug fix: send a typed filters object (not a bare string), and read the
    // paginated `items` array off the response instead of treating the whole
    // payload as an array.
    const data = await getAllAppointments(
      filter === "all" ? { limit: 100 } : { status: filter, limit: 100 },
    );
    setAppointments(data.items);
  }, [filter]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setIsLoading(true);
      setError("");
      try {
        await loadAppointments();
      } catch {
        if (!cancelled) setError("Could not load appointments.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadAppointments]);

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Admin</p>
          <h1 className="mt-1 text-3xl font-bold text-text-primary">
            All Appointments
          </h1>
        </div>

        <Select
          className="w-full sm:w-56"
          ariaLabel="Filter by status"
          value={filter}
          onChange={(v) => setFilter(v)}
          options={APPOINTMENT_FILTERS.map((f) => ({
            value: f.value,
            label: f.label,
          }))}
        />
      </section>

      <section className="overflow-hidden rounded-2xl border border-border bg-bg-primary shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] border-collapse text-left text-sm">
            <thead className="border-b border-border bg-bg-muted/60 text-xs uppercase text-text-muted">
              <tr>
                {TABLE_HEADERS.map((header) => (
                  <th key={header} className="px-4 py-3 font-semibold">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {isLoading && (
                <tr>
                  <td
                    className="px-4 py-8 text-center text-text-muted"
                    colSpan={TABLE_HEADERS.length}
                  >
                    Loading appointments…
                  </td>
                </tr>
              )}

              {!isLoading && error && (
                <tr>
                  <td
                    className="px-4 py-8 text-center text-danger"
                    colSpan={TABLE_HEADERS.length}
                  >
                    {error}
                  </td>
                </tr>
              )}

              {!isLoading && !error && appointments.length === 0 && (
                <tr>
                  <td
                    className="px-4 py-8 text-center text-text-muted"
                    colSpan={TABLE_HEADERS.length}
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
                    className="border-t border-border-light transition-colors hover:bg-bg-muted/40"
                  >
                    <td className="px-4 py-4 font-medium text-text-secondary">
                      {index + 1}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <span className="grid h-9 w-9 flex-none place-items-center rounded-full bg-primary-50 text-xs font-bold text-primary">
                          {initials(appointment.patient_name)}
                        </span>
                        <span className="font-medium text-text-primary">
                          {appointment.patient_name ?? "—"}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-text-secondary">
                      {appointment.patient_age ?? "—"}
                    </td>
                    <td className="px-4 py-4 text-text-secondary">
                      {formatDateTime(appointment.appointment_datetime)}
                    </td>
                    <td className="px-4 py-4 text-text-secondary">
                      {appointment.doctor_name ?? "—"}
                    </td>
                    <td className="px-4 py-4 text-text-secondary">
                      {appointment.service_name ?? "—"}
                    </td>
                    <td className="px-4 py-4 text-text-secondary">
                      {appointment.fee != null ? `$${appointment.fee}` : "—"}
                    </td>
                    <td className="px-4 py-4">
                      <StatusBadge status={appointment.status} />
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
