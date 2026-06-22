"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  Bell,
  Calendar,
  CalendarPlus,
  Clock,
  type LucideIcon,
  MapPin,
  Pill,
  Search,
  Stethoscope,
  User,
  
} from "lucide-react";
import { getUser } from "@/lib/auth";
import { getPatientDashboard, clearRecentActivity } from "@/lib/api/dashboard";
import type {
  ActivityItem,
  DashboardAppointment,
  PatientDashboard,
  PrescriptionItem,
} from "@/lib/api/dashboard";
import type { AppointmentStatus } from "@/types/api";
import Skeleton from "@/components/ui/skeleton";

const QUICK_ACTIONS = [
  { label: "Book appointment", href: "/patient/book", icon: CalendarPlus, tint: "bg-primary-50 text-primary" },
  { label: "View appointments", href: "/patient/appointments", icon: Calendar, tint: "bg-success-light text-success" },
  { label: "Update profile", href: "/patient/profile", icon: User, tint: "bg-warning-light text-warning" },
] as const;

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  confirmed: { label: "Confirmed", className: "bg-success-light text-success" },
  waiting: { label: "Pending", className: "bg-warning-light text-warning" },
  completed: { label: "Completed", className: "bg-primary-50 text-primary-700" },
  cancelled: { label: "Cancelled", className: "bg-danger-light text-danger" },
};

// Activity type → icon + colour tint.
const ACTIVITY_STYLE: Record<string, { icon: LucideIcon; tint: string }> = {
  confirmation: { icon: Calendar, tint: "bg-primary-50 text-primary" },
  reminder: { icon: Bell, tint: "bg-warning-light text-warning" },
  prescription: { icon: Pill, tint: "bg-success-light text-success" },
  visit_completed: { icon: Stethoscope, tint: "bg-info-light text-info" },
  info: { icon: Bell, tint: "bg-primary-50 text-primary" },
};

function initials(name: string): string {
  const parts = name.replace(/^Dr\.?\s*/i, "").trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "U";
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("en-US", { day: "numeric", month: "short", year: "numeric" }).format(d);
}

function formatTime(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit" }).format(d);
}

function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const mins = Math.round((Date.now() - then) / 60000);
  if (mins < 60) return `${Math.max(mins, 1)}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days === 1) return "Yesterday";
  return `${days} days ago`;
}

export default function PatientDashboardPage() {
  const [name] = useState(() => {
    const user = getUser() as { full_name?: string; name?: string; email?: string } | null;
    return user?.full_name ?? user?.name ?? "";
  });
  const [email] = useState(() => {
    const user = getUser() as { full_name?: string; name?: string; email?: string } | null;
    return user?.email ?? "";
  });
  const [data, setData] = useState<PatientDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);

  async function handleClearActivity() {
    setClearing(true);
    try {
      await clearRecentActivity();
      setData((d) =>
        d ? { ...d, recent_activity: [], stats: { ...d.stats, new_notifications: 0 } } : d,
      );
    } finally {
      setClearing(false);
    }
  }

  // name/email initialized from auth sync function to avoid effect-setState lint rule

  useEffect(() => {
    let cancelled = false;
    getPatientDashboard()
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch(() => {
        if (!cancelled) setData(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const displayName = name || email.split("@")[0] || "there";
  const firstName = displayName.split(/\s+/)[0];

  const statCards = useMemo(() => {
    const s = data?.stats;
    return [
      { label: "Upcoming appointments", value: s?.upcoming_appointments ?? 0, icon: Calendar, tint: "bg-primary-50 text-primary" },
      { label: "Completed visits", value: s?.completed_visits ?? 0, icon: Stethoscope, tint: "bg-success-light text-success" },
      { label: "Active prescriptions", value: s?.active_prescriptions ?? 0, icon: Pill, tint: "bg-warning-light text-warning" },
      { label: "New notifications", value: s?.new_notifications ?? 0, icon: Bell, tint: "bg-info-light text-info" },
    ];
  }, [data]);

  const next = data?.next_appointment ?? null;
  const others = data?.upcoming ?? [];
  const prescriptions = data?.prescriptions ?? [];
  const activity = data?.recent_activity ?? [];
  const health = data?.health_summary;

  return (
    <div className="space-y-6">
      {/* ── Top bar ─────────────────────────────────────────────── */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Dashboard</h1>
          <p className="text-sm text-text-muted" suppressHydrationWarning>
            Welcome back, {firstName}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative hidden sm:block">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="search"
              placeholder="Search doctors, appointments…"
              className="h-11 w-72 rounded-full border border-border bg-white pl-9 pr-4 text-sm outline-none transition focus:border-primary"
            />
          </div>
          <button
            type="button"
            aria-label="Notifications"
            className="relative grid h-11 w-11 flex-none place-items-center rounded-full border border-border bg-white text-text-secondary transition hover:border-primary hover:text-primary"
          >
            <Bell size={18} />
            {(data?.stats.new_notifications ?? 0) > 0 && (
              <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-danger" />
            )}
          </button>
          <span className="grid h-11 w-11 flex-none place-items-center rounded-full bg-primary-100 text-sm font-bold text-primary" suppressHydrationWarning>
            {initials(displayName)}
          </span>
        </div>
      </header>

      {/* ── Hero banner ─────────────────────────────────────────── */}
      <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-primary-600 via-primary to-primary-400 p-7 text-white shadow-lg shadow-primary/20 sm:p-9">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-white" />
              Welcome back
            </span>
            <h2 className="mt-4 text-3xl font-bold sm:text-4xl" suppressHydrationWarning>
              Hello, {firstName}
            </h2>
            <p className="mt-2 max-w-xl text-sm text-white/85">
              {loading
                ? "Loading your appointments…"
                : next
                  ? `You have an appointment with ${next.doctor} on ${formatDate(next.start_time)} at ${formatTime(next.start_time)}.`
                  : "You have no upcoming appointments. Book one to get started."}
            </p>
          </div>
          <div className="flex flex-none items-center gap-3">
            <Link
              href="/patient/book"
              className="inline-flex min-h-11 items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-primary transition hover:bg-white/90"
            >
              Book appointment
              <ArrowRight size={16} />
            </Link>
            <Link
              href="/patient/appointments"
              className="inline-flex min-h-11 items-center rounded-full border border-white/40 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              View all
            </Link>
          </div>
        </div>
      </section>

      {/* ── Stat cards ──────────────────────────────────────────── */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {loading
          ? Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-32" />)
          : statCards.map(({ label, value, icon: Icon, tint }) => (
              <article key={label} className="rounded-2xl border border-border bg-white p-5 shadow-sm">
                <span className={`grid h-11 w-11 place-items-center rounded-xl ${tint}`}>
                  <Icon size={20} />
                </span>
                <p className="mt-4 text-3xl font-bold text-text-primary">{value}</p>
                <p className="mt-1 text-sm text-text-muted">{label}</p>
              </article>
            ))}
      </section>

      {/* ── Main grid ───────────────────────────────────────────── */}
      <div className="grid gap-6 xl:grid-cols-3">
        {/* Left column */}
        <div className="space-y-6 xl:col-span-2">
          {/* Next appointment */}
          <section className="rounded-2xl border border-border bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-text-primary">Next appointment</h3>
                <p className="text-sm text-text-muted">Your most recent confirmed visit</p>
              </div>
              <Link href="/patient/appointments" className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
                View all <ArrowUpRight size={15} />
              </Link>
            </div>

            {loading ? (
              <Skeleton className="h-28" />
            ) : next ? (
              <div className="flex flex-col gap-4 rounded-2xl border border-border-light bg-bg-secondary p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <span className="grid h-12 w-12 flex-none place-items-center rounded-full bg-primary-100 text-sm font-bold text-primary">
                    {initials(next.doctor)}
                  </span>
                  <div>
                    <p className="font-semibold text-text-primary">{next.doctor}</p>
                    <p className="text-sm text-text-secondary">{next.specialty}</p>
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-text-muted">
                      <span className="inline-flex items-center gap-1.5"><Calendar size={13} /> {formatDate(next.start_time)}</span>
                      <span className="inline-flex items-center gap-1.5"><Clock size={13} /> {formatTime(next.start_time)}</span>
                      <span className="inline-flex items-center gap-1.5"><MapPin size={13} /> {next.clinic ?? "—"}</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-start gap-2 sm:items-end">
                  <StatusBadge status={next.status} />
                </div>
              </div>
            ) : (
              <p className="text-sm text-text-muted">No upcoming appointments yet.</p>
            )}
          </section>

          {/* Other upcoming visits */}
          <section className="rounded-2xl border border-border bg-white p-6 shadow-sm">
            <h3 className="mb-5 text-lg font-semibold text-text-primary">Other upcoming visits</h3>
            <div className="space-y-3">
              {loading ? (
                <Skeleton className="h-16" />
              ) : others.length === 0 ? (
                <p className="text-sm text-text-muted">Nothing else on the calendar.</p>
              ) : (
                others.map((v) => <UpcomingRow key={v.id} appt={v} />)
              )}
            </div>
          </section>

          {/* Prescriptions */}
          <section className="rounded-2xl border border-border bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-text-primary">Prescriptions</h3>
              <span className="text-xs text-text-muted">Active</span>
            </div>
            <div className="space-y-3">
              {loading ? (
                <Skeleton className="h-16" />
              ) : prescriptions.length === 0 ? (
                <p className="text-sm text-text-muted">No active prescriptions.</p>
              ) : (
                prescriptions.map((p) => <PrescriptionRow key={p.id} item={p} />)
              )}
            </div>
          </section>

          {/* Quick actions */}
          <section className="rounded-2xl border border-border bg-white p-6 shadow-sm">
            <h3 className="mb-5 text-lg font-semibold text-text-primary">Quick actions</h3>
            <div className="grid gap-4 sm:grid-cols-3">
              {QUICK_ACTIONS.map(({ label, href, icon: Icon, tint }) => (
                <Link
                  key={label}
                  href={href}
                  className="group flex items-center justify-between gap-3 rounded-2xl border border-border-light bg-bg-secondary p-4 transition hover:border-primary hover:bg-primary-50"
                >
                  <span className="flex items-center gap-3">
                    <span className={`grid h-10 w-10 place-items-center rounded-xl shadow-sm ${tint}`}>
                      <Icon size={18} />
                    </span>
                    <span className="text-sm font-semibold text-text-primary">{label}</span>
                  </span>
                  <ArrowUpRight size={16} className="text-text-muted transition group-hover:text-primary" />
                </Link>
              ))}
            </div>
          </section>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Recent activity */}
          <section className="rounded-2xl border border-border bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-text-primary">Recent activity</h3>
              {activity.length > 0 ? (
                <button
                  type="button"
                  onClick={handleClearActivity}
                  disabled={clearing}
                  className="text-xs font-semibold text-primary transition hover:underline disabled:opacity-50"
                >
                  {clearing ? "Clearing…" : "Clear"}
                </button>
              ) : (
                <span className="text-xs text-text-muted">Last 7 days</span>
              )}
            </div>
            {loading ? (
              <Skeleton className="h-40" />
            ) : activity.length === 0 ? (
              <p className="text-sm text-text-muted">No recent activity.</p>
            ) : (
              <ol className="space-y-5">
                {activity.map((a, i) => (
                  <ActivityRow key={i} item={a} />
                ))}
              </ol>
            )}
          </section>

          {/* Health summary */}
          <section className="rounded-2xl border border-border bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-2">
              <Activity size={18} className="text-primary" />
              <div>
                <h3 className="text-lg font-semibold text-text-primary">Health summary</h3>
                <p className="text-sm text-text-muted">Snapshot of your records</p>
              </div>
            </div>
            <div className="space-y-3">
              {[
                { label: "Recent visits", value: health?.recent_visits ?? 0, icon: Stethoscope },
                { label: "Total appointments", value: health?.total_appointments ?? 0, icon: Calendar },
                { label: "Prescriptions", value: health?.prescriptions ?? 0, icon: Pill },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="flex items-center justify-between rounded-2xl border border-border-light bg-bg-secondary px-4 py-3">
                  <span className="flex items-center gap-3 text-sm font-medium text-text-secondary">
                    <span className="grid h-9 w-9 place-items-center rounded-xl bg-white text-primary shadow-sm">
                      <Icon size={16} />
                    </span>
                    {label}
                  </span>
                  <span className="text-lg font-bold text-text-primary">{loading ? "—" : value}</span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: AppointmentStatus }) {
  const badge = STATUS_BADGE[status] ?? { label: status, className: "bg-bg-muted text-text-muted" };
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${badge.className}`}>
      {badge.label}
    </span>
  );
}

function UpcomingRow({ appt }: { appt: DashboardAppointment }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-border-light p-4">
      <div className="flex items-center gap-3">
        <span className="grid h-11 w-11 flex-none place-items-center rounded-full bg-bg-muted text-sm font-bold text-text-secondary">
          {initials(appt.doctor)}
        </span>
        <div>
          <p className="font-semibold text-text-primary">{appt.doctor}</p>
          <p className="text-sm text-text-muted">
            {appt.specialty} · {formatDate(appt.start_time)} at {formatTime(appt.start_time)}
          </p>
        </div>
      </div>
      <StatusBadge status={appt.status} />
    </div>
  );
}

function PrescriptionRow({ item }: { item: PrescriptionItem }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-border-light p-4">
      <div className="flex items-center gap-3">
        <span className="grid h-11 w-11 flex-none place-items-center rounded-xl bg-warning-light text-warning">
          <Pill size={18} />
        </span>
        <div>
          <p className="font-semibold text-text-primary">
            {item.medication} <span className="font-normal text-text-muted">· {item.dosage}</span>
          </p>
          <p className="text-sm text-text-muted">
            {item.prescribed_by ?? "—"} · {formatDate(item.created_at)}
          </p>
        </div>
      </div>
      <span className="inline-flex items-center rounded-full bg-success-light px-3 py-1 text-xs font-semibold text-success">
        Active
      </span>
    </div>
  );
}

function ActivityRow({ item }: { item: ActivityItem }) {
  const style = ACTIVITY_STYLE[item.type] ?? ACTIVITY_STYLE.info;
  const Icon = style.icon;
  return (
    <li className="flex gap-3">
      <span className={`grid h-9 w-9 flex-none place-items-center rounded-full ${style.tint}`}>
        <Icon size={16} />
      </span>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-text-primary">{item.title}</p>
        <p className="truncate text-sm text-text-muted">{item.message}</p>
        <p className="mt-0.5 text-xs text-text-muted">{relativeTime(item.created_at)}</p>
      </div>
    </li>
  );
}
