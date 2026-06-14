"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { getMyAppointments, cancelAppointment } from "@/lib/api/appointments";
import type { Appointment, AppointmentStatus } from "@/types/api";

/* ------------------------------------------------------------------ *
 * My Appointments (SCRUM-82)
 *
 * NOTE ON DATA: the page fetches getMyAppointments() on load as required,
 * but the current /appointments/me endpoint returns IDs only — it does not
 * expose doctor name, slot date/time, or clinic/location (no clinic model
 * exists in the backend yet). Until a follow-up backend ticket enriches that
 * response, the page falls back to MOCK data so it is fully demonstrable.
 *
 * `toView()` already reads the enriched (nested) shape if/when the backend
 * provides it, so this page becomes live with no UI changes — same pattern
 * the team used for the date/time selector (SCRUM-79).
 * ------------------------------------------------------------------ */

type AppointmentView = {
  id: string;
  doctorName: string;
  specialty: string;
  /** Slot start time as an ISO 8601 string. */
  startTime: string;
  clinicName: string;
  status: AppointmentStatus;
};

// ─── Status filter pills ────────────────────────────────────────────
// "Pending" maps to the backend `waiting` status (there is no `pending`).
type FilterKey = "all" | "confirmed" | "pending" | "completed" | "cancelled";

const STATUS_FILTERS: { key: FilterKey; label: string; status?: AppointmentStatus }[] = [
  { key: "all", label: "All" },
  { key: "confirmed", label: "Confirmed", status: "confirmed" },
  { key: "pending", label: "Pending", status: "waiting" },
  { key: "completed", label: "Completed", status: "completed" },
  { key: "cancelled", label: "Cancelled", status: "cancelled" },
];

// ─── Status badge styling (per SCRUM-82 spec) ───────────────────────
// confirmed=green, waiting/pending=yellow, completed=blue, cancelled=red.
// NOTE: this intentionally differs from the shared StatusBadge component
// (SCRUM-83), which uses confirmed=blue / completed=green. The two tickets
// specify opposite colors — flagged for the team to reconcile.
const STATUS_BADGE: Record<AppointmentStatus, { label: string; className: string }> = {
  confirmed: { label: "Confirmed", className: "bg-[var(--color-success-light)] text-[var(--color-success)]" },
  waiting: { label: "Pending", className: "bg-[var(--color-warning-light)] text-[var(--color-warning)]" },
  completed: { label: "Completed", className: "bg-[var(--color-primary-50)] text-[var(--color-primary-700)]" },
  cancelled: { label: "Cancelled", className: "bg-[var(--color-danger-light)] text-[var(--color-danger)]" },
  in_progress: { label: "In progress", className: "bg-[var(--color-info-light)] text-[var(--color-info)]" },
  no_show: { label: "No show", className: "bg-[var(--color-bg-muted)] text-[var(--color-text-muted)]" },
};

// Avatar circle colors — brand tokens only (deterministic per name).
const AVATAR_COLORS = [
  "bg-[var(--color-primary)]",
  "bg-[var(--color-success)]",
  "bg-[var(--color-warning)]",
  "bg-[var(--color-info)]",
  "bg-[var(--color-danger)]",
];

// ─── Helpers ────────────────────────────────────────────────────────
function initials(name: string): string {
  const parts = name.replace(/^Dr\.?\s*/i, "").trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "?";
}

function avatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(d);
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit" }).format(d);
}

/**
 * Map a raw API appointment to the view model. Reads the enriched nested
 * shape if the backend provides it; returns null when the appointment is not
 * yet enriched (IDs only), which triggers the mock fallback.
 */
function toView(appt: Appointment): AppointmentView | null {
  const raw = appt as Appointment & {
    provider?: { full_name?: string; specialty?: string };
    slot?: { start_time?: string };
    clinic?: { name?: string };
  };
  if (!raw.provider?.full_name || !raw.slot?.start_time) return null;
  return {
    id: appt.id,
    doctorName: raw.provider.full_name,
    specialty: raw.provider.specialty ?? "—",
    startTime: raw.slot.start_time,
    clinicName: raw.clinic?.name ?? "—",
    status: appt.status,
  };
}

/** Demo data — remove once /appointments/me returns enriched appointments. */
function buildMockAppointments(): AppointmentView[] {
  const DAY = 24 * 60 * 60 * 1000;
  const now = Date.now();
  const iso = (offset: number) => new Date(now + offset).toISOString();
  return [
    { id: "mock-1", doctorName: "Dr. Arben Krasniqi", specialty: "Cardiology", startTime: iso(2 * DAY), clinicName: "MediSlot Central Clinic", status: "confirmed" },
    { id: "mock-2", doctorName: "Dr. Elira Berisha", specialty: "General Medicine", startTime: iso(5 * DAY), clinicName: "Sunrise Family Health", status: "waiting" },
    { id: "mock-3", doctorName: "Dr. Driton Hoxha", specialty: "Dermatology", startTime: iso(9 * DAY), clinicName: "MediSlot Central Clinic", status: "confirmed" },
    { id: "mock-4", doctorName: "Dr. Vesa Gashi", specialty: "Pediatrics", startTime: iso(-3 * DAY), clinicName: "Sunrise Family Health", status: "completed" },
    { id: "mock-5", doctorName: "Dr. Arben Krasniqi", specialty: "Cardiology", startTime: iso(-12 * DAY), clinicName: "MediSlot Central Clinic", status: "completed" },
    { id: "mock-6", doctorName: "Dr. Leon Rexha", specialty: "Orthopedics", startTime: iso(-20 * DAY), clinicName: "Riverside Medical Center", status: "cancelled" },
  ];
}

// ─── Page ───────────────────────────────────────────────────────────
export default function MyAppointmentsPage() {
  const [appointments, setAppointments] = useState<AppointmentView[]>([]);
  const [loading, setLoading] = useState(true);
  const [usingMock, setUsingMock] = useState(false);
  // "now" is captured at load time (not during render) so the upcoming/past
  // split stays a pure computation.
  const [now, setNow] = useState(0);
  const [view, setView] = useState<"list" | "calendar">("list");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterKey>("all");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [cancelTarget, setCancelTarget] = useState<AppointmentView | null>(null);
  const [cancelling, setCancelling] = useState(false);

  function applyAppointments(data: Appointment[]) {
    const mapped = data.map(toView).filter((v): v is AppointmentView => v !== null);
    if (mapped.length > 0) {
      setUsingMock(false);
      setAppointments(mapped);
    } else {
      // IDs-only response (or empty) → demo with mock data.
      setUsingMock(true);
      setAppointments(buildMockAppointments());
    }
    setNow(Date.now());
  }

  function fallbackToMock() {
    setUsingMock(true);
    setAppointments(buildMockAppointments());
    setNow(Date.now());
  }

  // Fetch on load. setState is only called from async callbacks (never
  // synchronously in the effect body) to avoid cascading-render churn.
  useEffect(() => {
    let cancelled = false;
    getMyAppointments()
      .then((data) => {
        if (!cancelled) applyAppointments(data);
      })
      .catch(() => {
        if (!cancelled) fallbackToMock();
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Re-fetch after a real cancellation (called from an event handler).
  async function refresh() {
    try {
      applyAppointments(await getMyAppointments());
    } catch {
      fallbackToMock();
    }
  }

  // Close the open three-dots menu on any outside click.
  useEffect(() => {
    if (!openMenuId) return;
    const close = () => setOpenMenuId(null);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [openMenuId]);

  const activeFilter = STATUS_FILTERS.find((f) => f.key === filter) ?? STATUS_FILTERS[0];

  const { upcoming, past } = useMemo(() => {
    const q = search.trim().toLowerCase();
    const matches = appointments.filter((a) => {
      const matchesSearch =
        !q || a.doctorName.toLowerCase().includes(q) || a.specialty.toLowerCase().includes(q);
      const matchesStatus = !activeFilter.status || a.status === activeFilter.status;
      return matchesSearch && matchesStatus;
    });
    return {
      upcoming: matches
        .filter((a) => new Date(a.startTime).getTime() > now)
        .sort((a, b) => +new Date(a.startTime) - +new Date(b.startTime)),
      past: matches
        .filter((a) => new Date(a.startTime).getTime() <= now)
        .sort((a, b) => +new Date(b.startTime) - +new Date(a.startTime)),
    };
  }, [appointments, search, activeFilter, now]);

  const hasResults = upcoming.length + past.length > 0;

  async function confirmCancel() {
    if (!cancelTarget) return;
    setCancelling(true);
    try {
      if (usingMock) {
        // Demo mode: reflect the cancellation locally.
        setAppointments((prev) =>
          prev.map((a) => (a.id === cancelTarget.id ? { ...a, status: "cancelled" } : a)),
        );
      } else {
        await cancelAppointment(cancelTarget.id); // DELETE /appointments/{id}
        await refresh(); // refresh list
      }
    } finally {
      setCancelling(false);
      setCancelTarget(null);
    }
  }

  return (
    <main className="min-h-screen px-6 py-8">
      {/* Header + view toggle */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-medium text-[var(--color-primary)]">Patient</p>
          <h1 className="mt-1 text-3xl font-bold text-[var(--color-text-primary)]">My Appointments</h1>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            View and manage your upcoming and past visits.
          </p>
        </div>

        <div className="inline-flex rounded-full border border-[var(--color-border)] bg-white p-1">
          <button
            type="button"
            onClick={() => setView("list")}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
              view === "list"
                ? "bg-[var(--color-primary)] text-[var(--color-white)]"
                : "text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-muted)]"
            }`}
          >
            List
          </button>
          <button
            type="button"
            disabled
            title="Coming soon"
            className="cursor-not-allowed rounded-full px-4 py-1.5 text-sm font-semibold text-[var(--color-text-muted)] opacity-60"
          >
            Calendar
          </button>
        </div>
      </div>

      {usingMock && (
        <p className="mt-4 rounded-xl border border-[var(--color-warning-light)] bg-[var(--color-warning-light)] px-4 py-2 text-xs font-medium text-[var(--color-text-secondary)]">
          Showing sample data — live appointments will appear once the
          <code className="mx-1">/appointments/me</code>
          endpoint returns provider, slot and clinic details.
        </p>
      )}

      {/* Search */}
      <div className="mt-6">
        <div className="relative max-w-md">
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-[var(--color-text-muted)]">
            <SearchIcon />
          </span>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by doctor name or specialty"
            className="min-h-11 w-full rounded-full border border-[var(--color-border)] bg-white pl-10 pr-4 text-sm outline-none transition focus:border-[var(--color-primary)]"
          />
        </div>
      </div>

      {/* Status filter pills */}
      <div className="mt-4 flex flex-wrap gap-2">
        {STATUS_FILTERS.map((f) => {
          const active = f.key === filter;
          return (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
                active
                  ? "bg-[var(--color-primary)] text-[var(--color-white)]"
                  : "border border-[var(--color-border)] bg-white text-[var(--color-text-secondary)] hover:border-[var(--color-primary)] hover:bg-[var(--color-primary-50)]"
              }`}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="mt-8">
        {loading ? (
          <p className="text-sm text-[var(--color-text-muted)]">Loading your appointments…</p>
        ) : !hasResults ? (
          <EmptyState />
        ) : (
          <div className="space-y-10">
            <Section title="Upcoming" count={upcoming.length}>
              {upcoming.map((a) => (
                <AppointmentItem
                  key={a.id}
                  appt={a}
                  menuOpen={openMenuId === a.id}
                  onToggleMenu={() => setOpenMenuId((id) => (id === a.id ? null : a.id))}
                  onCancel={() => {
                    setOpenMenuId(null);
                    setCancelTarget(a);
                  }}
                />
              ))}
              {upcoming.length === 0 && <EmptyHint text="No upcoming appointments." />}
            </Section>

            <Section title="Past" count={past.length}>
              {past.map((a) => (
                <AppointmentItem
                  key={a.id}
                  appt={a}
                  menuOpen={openMenuId === a.id}
                  onToggleMenu={() => setOpenMenuId((id) => (id === a.id ? null : a.id))}
                  onCancel={() => {
                    setOpenMenuId(null);
                    setCancelTarget(a);
                  }}
                />
              ))}
              {past.length === 0 && <EmptyHint text="No past appointments." />}
            </Section>
          </div>
        )}
      </div>

      {cancelTarget && (
        <ConfirmDialog
          appt={cancelTarget}
          busy={cancelling}
          onConfirm={confirmCancel}
          onClose={() => (cancelling ? undefined : setCancelTarget(null))}
        />
      )}
    </main>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────

function Section({ title, count, children }: { title: string; count: number; children: React.ReactNode }) {
  return (
    <section>
      <div className="mb-4 flex items-center gap-2">
        <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">{title}</h2>
        <span className="inline-flex min-w-6 items-center justify-center rounded-full bg-[var(--color-bg-muted)] px-2 py-0.5 text-xs font-semibold text-[var(--color-text-secondary)]">
          {count}
        </span>
      </div>
      <div className="grid gap-4 md:grid-cols-2">{children}</div>
    </section>
  );
}

function AppointmentItem({
  appt,
  menuOpen,
  onToggleMenu,
  onCancel,
}: {
  appt: AppointmentView;
  menuOpen: boolean;
  onToggleMenu: () => void;
  onCancel: () => void;
}) {
  const menuRef = useRef<HTMLDivElement>(null);
  const badge = STATUS_BADGE[appt.status] ?? STATUS_BADGE.no_show;
  const cancellable = appt.status === "confirmed" || appt.status === "waiting";

  return (
    <article className="relative rounded-3xl border border-[var(--color-border)]/80 bg-white p-5 shadow-sm">
      <div className="flex items-start gap-4">
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-sm font-bold text-[var(--color-white)] ${avatarColor(
            appt.doctorName,
          )}`}
          aria-hidden="true"
        >
          {initials(appt.doctorName)}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate font-semibold text-[var(--color-text-primary)]">{appt.doctorName}</p>
              <p className="truncate text-sm text-[var(--color-text-secondary)]">{appt.specialty}</p>
            </div>

            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${badge.className}`}>
                {badge.label}
              </span>

              {/* Three-dots menu */}
              <div className="relative" ref={menuRef}>
                <button
                  type="button"
                  aria-label="Appointment actions"
                  aria-haspopup="menu"
                  aria-expanded={menuOpen}
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleMenu();
                  }}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--color-text-muted)] hover:bg-[var(--color-bg-muted)]"
                >
                  <DotsIcon />
                </button>
                {menuOpen && (
                  <div
                    role="menu"
                    className="absolute right-0 z-10 mt-1 w-40 overflow-hidden rounded-xl border border-[var(--color-border)] bg-white py-1 shadow-lg"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      role="menuitem"
                      disabled={!cancellable}
                      onClick={onCancel}
                      className="flex w-full items-center px-4 py-2 text-left text-sm text-[var(--color-danger)] enabled:hover:bg-[var(--color-danger-light)] disabled:cursor-not-allowed disabled:text-[var(--color-text-muted)]"
                    >
                      Cancel appointment
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-[var(--color-text-muted)]">
            <span className="inline-flex items-center gap-1.5">
              <CalendarIcon />
              <time dateTime={appt.startTime} suppressHydrationWarning>
                {formatDate(appt.startTime)}
              </time>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <ClockIcon />
              <span suppressHydrationWarning>{formatTime(appt.startTime)}</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <PinIcon />
              {appt.clinicName}
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}

function ConfirmDialog({
  appt,
  busy,
  onConfirm,
  onClose,
}: {
  appt: AppointmentView;
  busy: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--color-navy)]/40 p-4"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Cancel appointment?</h3>
        <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
          This will cancel your appointment with{" "}
          <span className="font-medium text-[var(--color-text-primary)]">{appt.doctorName}</span> on{" "}
          {formatDate(appt.startTime)} at {formatTime(appt.startTime)}. This cannot be undone.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="rounded-full px-4 py-2 text-sm font-semibold text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-muted)] disabled:opacity-50"
          >
            Keep appointment
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className="rounded-full bg-[var(--color-danger)] px-4 py-2 text-sm font-semibold text-[var(--color-white)] hover:opacity-90 disabled:opacity-50"
          >
            {busy ? "Cancelling…" : "Yes, cancel"}
          </button>
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-[var(--color-border)] bg-white py-16 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-bg-muted)] text-[var(--color-text-muted)]">
        <CalendarIcon />
      </div>
      <p className="mt-4 font-semibold text-[var(--color-text-primary)]">No appointments found</p>
      <p className="mt-1 text-sm text-[var(--color-text-muted)]">
        Try adjusting your search or filters.
      </p>
    </div>
  );
}

function EmptyHint({ text }: { text: string }) {
  return <p className="text-sm text-[var(--color-text-muted)]">{text}</p>;
}

// ─── Icons ──────────────────────────────────────────────────────────
const iconProps = {
  width: 16,
  height: 16,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
  className: "shrink-0",
};

function CalendarIcon() {
  return (
    <svg {...iconProps}>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg {...iconProps}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg {...iconProps}>
      <path d="M12 21s7-6.5 7-11a7 7 0 0 0-14 0c0 4.5 7 11 7 11Z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg {...iconProps}>
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

function DotsIcon() {
  return (
    <svg {...iconProps} strokeWidth={2.5}>
      <circle cx="12" cy="5" r="0.5" />
      <circle cx="12" cy="12" r="0.5" />
      <circle cx="12" cy="19" r="0.5" />
    </svg>
  );
}
