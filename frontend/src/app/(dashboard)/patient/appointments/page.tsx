"use client";

import { useEffect, useMemo, useState } from "react";
import {
  getMyAppointments,
  cancelAppointment,
  rescheduleAppointment,
} from "@/lib/api/appointments";
import DateTimeSelector from "@/components/features/patient/date-time-selector";
import type { Appointment, AppointmentStatus, Slot } from "@/types/api";

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
  /** Provider id — needed to load the doctor's slots when rescheduling. */
  providerId: number | null;
  /** Slot start time as an ISO 8601 string. */
  startTime: string;
  /** The doctor's clinic address (provider.address). */
  location: string;
  /** The doctor's consultation fee (provider.fees), or null if unset. */
  fee: number | null;
  status: AppointmentStatus;
};

// Terminal statuses: a finished/closed appointment always belongs to "Past",
// regardless of its scheduled time (e.g. a future visit that was cancelled).
const DONE_STATUSES: AppointmentStatus[] = ["completed", "cancelled", "no_show"];

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
    provider?: {
      full_name?: string;
      specialty?: string;
      address?: string | null;
      fees?: number | null;
    };
    slot?: { provider_id?: number; start_time?: string };
  };
  if (!raw.provider?.full_name || !raw.slot?.start_time) return null;
  return {
    id: appt.id,
    doctorName: raw.provider.full_name,
    specialty: raw.provider.specialty ?? "—",
    providerId: raw.slot.provider_id ?? null,
    startTime: raw.slot.start_time,
    location: raw.provider.address ?? "—",
    fee: raw.provider.fees ?? null,
    status: appt.status,
  };
}

// ─── Page ───────────────────────────────────────────────────────────
export default function MyAppointmentsPage() {
  const [appointments, setAppointments] = useState<AppointmentView[]>([]);
  const [loading, setLoading] = useState(true);
  // "now" is captured at load time (not during render) so the upcoming/past
  // split stays a pure computation.
  const [now, setNow] = useState(0);
  const [view, setView] = useState<"list" | "calendar">("list");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterKey>("all");
  const [detailsTarget, setDetailsTarget] = useState<AppointmentView | null>(null);
  const [cancelTarget, setCancelTarget] = useState<AppointmentView | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [rescheduleTarget, setRescheduleTarget] = useState<AppointmentView | null>(null);

  function applyAppointments(data: Appointment[]) {
    const mapped = data.map(toView).filter((v): v is AppointmentView => v !== null);
    setAppointments(mapped);
    setNow(Date.now());
  }

  function handleLoadError() {
    setAppointments([]);
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
        if (!cancelled) handleLoadError();
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
      handleLoadError();
    }
  }

  const activeFilter = STATUS_FILTERS.find((f) => f.key === filter) ?? STATUS_FILTERS[0];

  const { upcoming, past } = useMemo(() => {
    const q = search.trim().toLowerCase();
    const matches = appointments.filter((a) => {
      const matchesSearch =
        !q || a.doctorName.toLowerCase().includes(q) || a.specialty.toLowerCase().includes(q);
      const matchesStatus = !activeFilter.status || a.status === activeFilter.status;
      return matchesSearch && matchesStatus;
    });
    // Upcoming = still active (not finished) AND scheduled in the future.
    // Anything finished (completed/cancelled/no-show) — or whose time has
    // already passed — falls into Past.
    const isUpcoming = (a: AppointmentView) =>
      !DONE_STATUSES.includes(a.status) &&
      new Date(a.startTime).getTime() > now;
    return {
      upcoming: matches
        .filter(isUpcoming)
        .sort((a, b) => +new Date(a.startTime) - +new Date(b.startTime)),
      past: matches
        .filter((a) => !isUpcoming(a))
        .sort((a, b) => +new Date(b.startTime) - +new Date(a.startTime)),
    };
  }, [appointments, search, activeFilter, now]);

  const hasResults = upcoming.length + past.length > 0;

  async function confirmCancel() {
    if (!cancelTarget) return;
    setCancelling(true);
    try {
      await cancelAppointment(cancelTarget.id); // DELETE /appointments/{id}
      await refresh(); // refresh list
    } finally {
      setCancelling(false);
      setCancelTarget(null);
    }
  }

  return (
    <div className="min-h-screen">
      {/* Header + view toggle */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[var(--color-text-primary)]">My appointments</h1>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            Manage your upcoming visits and review past appointments.
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

      {/* Search + filter pills */}
      <div className="mt-6 flex flex-col gap-4 rounded-2xl border border-[var(--color-border)] bg-white p-4 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-[var(--color-text-muted)]">
            <SearchIcon />
          </span>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by doctor or specialty"
            className="min-h-11 w-full rounded-full border border-[var(--color-border)] bg-[var(--color-bg-secondary)] pl-10 pr-4 text-sm outline-none transition focus:border-[var(--color-primary)]"
          />
        </div>

        <div className="flex flex-wrap gap-2">
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
                  onOpenDetails={() => setDetailsTarget(a)}
                />
              ))}
              {upcoming.length === 0 && <EmptyHint text="No upcoming appointments." />}
            </Section>

            <Section title="Past" count={past.length}>
              {past.map((a) => (
                <AppointmentItem
                  key={a.id}
                  appt={a}
                  onOpenDetails={() => setDetailsTarget(a)}
                />
              ))}
              {past.length === 0 && <EmptyHint text="No past appointments." />}
            </Section>
          </div>
        )}
      </div>

      {detailsTarget && (
        <DetailsDrawer
          appt={detailsTarget}
          onClose={() => setDetailsTarget(null)}
          onCancel={() => {
            const target = detailsTarget;
            setDetailsTarget(null);
            setCancelTarget(target);
          }}
          onReschedule={() => {
            const target = detailsTarget;
            setDetailsTarget(null);
            setRescheduleTarget(target);
          }}
        />
      )}

      {rescheduleTarget && rescheduleTarget.providerId != null && (
        <RescheduleModal
          appt={rescheduleTarget}
          providerId={rescheduleTarget.providerId}
          onClose={() => setRescheduleTarget(null)}
          onSuccess={() => {
            setRescheduleTarget(null);
            refresh();
          }}
        />
      )}

      {cancelTarget && (
        <ConfirmDialog
          appt={cancelTarget}
          busy={cancelling}
          onConfirm={confirmCancel}
          onClose={() => (cancelling ? undefined : setCancelTarget(null))}
        />
      )}
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────

function Section({ title, count, children }: { title: string; count: number; children: React.ReactNode }) {
  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">{title}</h2>
        <span className="inline-flex min-w-6 items-center justify-center rounded-full bg-[var(--color-bg-muted)] px-2 py-0.5 text-xs font-semibold text-[var(--color-text-secondary)]">
          {count}
        </span>
      </div>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function AppointmentItem({
  appt,
  onOpenDetails,
}: {
  appt: AppointmentView;
  onOpenDetails: () => void;
}) {
  const badge = STATUS_BADGE[appt.status] ?? STATUS_BADGE.no_show;

  return (
    <article
      onClick={onOpenDetails}
      className="relative cursor-pointer rounded-2xl border border-[var(--color-border)]/80 bg-white p-5 shadow-sm transition hover:border-[var(--color-primary)] hover:shadow-md"
    >
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
            <div className="flex min-w-0 flex-wrap items-baseline gap-x-2">
              <p className="truncate font-semibold text-[var(--color-text-primary)]">{appt.doctorName}</p>
              <span className="truncate text-sm text-[var(--color-text-muted)]">· {appt.specialty}</span>
            </div>

            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${badge.className}`}>
                {badge.label}
              </span>

              <button
                type="button"
                aria-label="Appointment details"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenDetails();
                }}
                className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--color-text-muted)] hover:bg-[var(--color-bg-muted)]"
              >
                <DotsIcon />
              </button>
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
              {appt.location}
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}

// ─── Details slide-over drawer ──────────────────────────────────────
function DetailsDrawer({
  appt,
  onClose,
  onCancel,
  onReschedule,
}: {
  appt: AppointmentView;
  onClose: () => void;
  onCancel: () => void;
  onReschedule: () => void;
}) {
  const badge = STATUS_BADGE[appt.status] ?? STATUS_BADGE.no_show;
  // Only active appointments can be acted on.
  const actionable = appt.status === "confirmed" || appt.status === "waiting";
  const canReschedule = actionable && appt.providerId != null;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-[var(--color-navy)]/40"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <aside
        className="flex h-full w-full max-w-md flex-col overflow-y-auto bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between p-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
              Appointment
            </p>
            <h2 className="text-xl font-bold text-[var(--color-text-primary)]">Details</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid h-9 w-9 place-items-center rounded-full text-[var(--color-text-muted)] hover:bg-[var(--color-bg-muted)]"
          >
            <CloseIcon />
          </button>
        </div>

        <div className="px-6">
          <div className="flex items-center gap-4">
            <div
              className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-base font-bold text-[var(--color-white)] ${avatarColor(
                appt.doctorName,
              )}`}
              aria-hidden="true"
            >
              {initials(appt.doctorName)}
            </div>
            <div>
              <p className="text-lg font-semibold text-[var(--color-text-primary)]">{appt.doctorName}</p>
              <p className="text-sm text-[var(--color-text-secondary)]">{appt.specialty}</p>
            </div>
          </div>

          <span className={`mt-4 inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${badge.className}`}>
            {badge.label}
          </span>

          <dl className="mt-6 space-y-4">
            <DetailRow icon={<CalendarIcon />} label="Date" value={formatDate(appt.startTime)} />
            <DetailRow icon={<ClockIcon />} label="Time" value={formatTime(appt.startTime)} />
            <DetailRow icon={<PinIcon />} label="Location" value={appt.location} />
          </dl>

          <div className="mt-6 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-[var(--color-text-muted)]">Consultation fee</span>
              <span className="font-semibold text-[var(--color-text-primary)]">
                {appt.fee != null ? `$${appt.fee}` : "—"}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-auto space-y-3 p-6">
          <button
            type="button"
            disabled={!canReschedule}
            onClick={onReschedule}
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full border border-[var(--color-border)] bg-white px-5 py-2.5 text-sm font-semibold text-[var(--color-text-secondary)] transition enabled:hover:border-[var(--color-primary)] enabled:hover:text-[var(--color-primary)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            Reschedule
          </button>
          <button
            type="button"
            disabled={!actionable}
            onClick={onCancel}
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-[var(--color-danger-light)] px-5 py-2.5 text-sm font-semibold text-[var(--color-danger)] transition enabled:hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel appointment
          </button>
        </div>
      </aside>
    </div>
  );
}

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="inline-flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
        {icon}
        {label}
      </span>
      <span className="text-sm font-semibold text-[var(--color-text-primary)]">{value}</span>
    </div>
  );
}

// ─── Reschedule modal — pick a new date & time for the same doctor ───
function RescheduleModal({
  appt,
  providerId,
  onClose,
  onSuccess,
}: {
  appt: AppointmentView;
  providerId: number;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [slot, setSlot] = useState<Slot | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  async function submit() {
    if (!slot) return;
    setSubmitting(true);
    setError(null);
    try {
      await rescheduleAppointment(appt.id, slot.id);
      onSuccess();
    } catch (err) {
      const code = (err as { response?: { status?: number } })?.response?.status;
      if (code === 409) {
        setError("That time was just taken. Please pick another slot.");
        setSlot(null);
        setReloadKey((k) => k + 1);
      } else {
        setError("Could not reschedule. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--color-navy)]/40 p-4"
      role="dialog"
      aria-modal="true"
      onClick={() => (submitting ? undefined : onClose())}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-[var(--color-border)] p-6">
          <div>
            <h3 className="text-xl font-bold text-[var(--color-text-primary)]">Reschedule appointment</h3>
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">
              {appt.doctorName} · currently {formatDate(appt.startTime)} at {formatTime(appt.startTime)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid h-9 w-9 place-items-center rounded-full text-[var(--color-text-muted)] hover:bg-[var(--color-bg-muted)]"
          >
            <CloseIcon />
          </button>
        </div>

        <div className="overflow-y-auto p-6">
          <DateTimeSelector
            providerId={providerId}
            selectedSlot={slot}
            onSelectSlot={setSlot}
            reloadKey={reloadKey}
          />
          {error && (
            <p className="mt-4 rounded-xl border border-[var(--color-danger-light)] bg-[var(--color-danger-light)] px-4 py-3 text-sm font-medium text-[var(--color-danger)]">
              {error}
            </p>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-[var(--color-border)] p-6">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-[var(--color-border)] bg-white px-5 py-2.5 text-sm font-semibold text-[var(--color-text-secondary)] transition hover:bg-[var(--color-bg-muted)] disabled:opacity-50"
          >
            Keep current
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={!slot || submitting}
            className="inline-flex min-h-11 items-center justify-center rounded-full bg-[var(--color-primary)] px-6 py-2.5 text-sm font-semibold text-[var(--color-white)] transition hover:bg-[var(--color-primary-600)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "Rescheduling…" : "Confirm new time"}
          </button>
        </div>
      </div>
    </div>
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

function CloseIcon() {
  return (
    <svg {...iconProps} strokeWidth={2.5}>
      <path d="M18 6 6 18M6 6l12 12" />
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
