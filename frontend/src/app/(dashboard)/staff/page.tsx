"use client";

import { useEffect, useState } from "react";
import { CalendarDays, DollarSign, Stethoscope, Users } from "lucide-react";

import { getAdminStats } from "@/lib/api/admin";
import { getAllAppointments } from "@/lib/api/appointments";
import type { AdminAppointment, AdminStats } from "@/types/api";
import StatusBadge from "@/components/shared/status-badge";
import Skeleton from "@/components/ui/skeleton";

function initials(name: string | null): string {
  if (!name) return "–";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "–";
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase();
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatCurrency(value: number): string {
  return `$${value.toLocaleString("en-US")}`;
}

export default function StaffDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [bookings, setBookings] = useState<AdminAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        setError(null);
        const [statsResult, appointmentsResult] = await Promise.all([
          getAdminStats(),
          getAllAppointments({ limit: 4 }),
        ]);
        if (!cancelled) {
          setStats(statsResult);
          setBookings(appointmentsResult.items);
        }
      } catch {
        // apiClient already redirects to /login on 401; this covers other failures.
        if (!cancelled) setError("Couldn't load the dashboard. Please try again.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const cards = stats
    ? [
        {
          label: "Doctors",
          value: stats.total_doctors,
          Icon: Stethoscope,
          iconClass: "bg-[var(--color-primary-50)] text-[var(--color-primary)]",
        },
        {
          label: "Appointments",
          value: stats.appointments_today,
          Icon: CalendarDays,
          iconClass: "bg-[var(--color-success-light)] text-[var(--color-success)]",
        },
        {
          label: "Patients",
          value: stats.total_patients,
          Icon: Users,
          iconClass: "bg-[var(--color-purple-light)] text-[var(--color-purple)]",
        },
        {
          label: "Earnings",
          value: formatCurrency(stats.earnings_total),
          Icon: DollarSign,
          iconClass: "bg-[var(--color-warning-light)] text-[var(--color-warning)]",
        },
      ]
    : [];

  return (
    <div className="space-y-6">
      {/* Hero */}
      <section className="rounded-2xl bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-purple)] p-8 text-white">
        <h1 className="text-2xl font-bold sm:text-3xl">Welcome back</h1>
        <p className="mt-2 text-sm text-white/85">
          Your clinic command center — appointments, doctors, and earnings at a glance.
        </p>
      </section>

      {error && (
        <div className="rounded-xl border border-[var(--color-danger)]/30 bg-[var(--color-danger-light)] px-4 py-3 text-sm font-medium text-[var(--color-danger)]">
          {error}
        </div>
      )}

      {loading ? (
        <>
          {/* Stat card skeletons */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
          {/* Bookings skeleton */}
          <div className="rounded-2xl border border-border bg-bg-primary p-5 sm:p-6">
            <Skeleton className="mb-4 h-6 w-40" />
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-14" />
              ))}
            </div>
          </div>
        </>
      ) : (
        !error && (
          <>
            {/* Stat cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {cards.map((card) => (
                <div
                  key={card.label}
                  className="rounded-2xl border border-border bg-bg-primary p-5"
                >
                  <div
                    className={`mb-4 grid h-11 w-11 place-items-center rounded-xl ${card.iconClass}`}
                  >
                    <card.Icon size={20} />
                  </div>
                  <p className="text-3xl font-bold text-text-primary">{card.value}</p>
                  <p className="mt-1 text-sm text-text-muted">{card.label}</p>
                </div>
              ))}
            </div>

            {/* Latest bookings */}
            <div className="rounded-2xl border border-border bg-bg-primary p-5 sm:p-6">
              <h2 className="mb-4 text-lg font-semibold text-text-primary">
                Latest bookings
              </h2>

              {bookings.length === 0 ? (
                <p className="text-sm text-text-muted">No bookings yet.</p>
              ) : (
                <ul className="divide-y divide-border-light">
                  {bookings.map((b) => (
                    <li key={b.id} className="flex items-center gap-4 py-3">
                      <span className="grid h-10 w-10 flex-none place-items-center rounded-full bg-bg-muted text-sm font-semibold text-text-secondary">
                        {initials(b.patient_name)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-text-primary">
                          {b.patient_name ?? "Unknown patient"}
                        </p>
                        <p className="truncate text-xs text-text-muted">
                          {[b.service_name, b.doctor_name].filter(Boolean).join(" · ") ||
                            "—"}{" "}
                          · Booking on {formatDate(b.appointment_datetime)}
                        </p>
                      </div>
                      <StatusBadge status={b.status} className="flex-none" />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        )
      )}
    </div>
  );
}
