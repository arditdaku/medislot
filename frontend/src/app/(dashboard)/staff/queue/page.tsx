"use client";

import { useCallback, useEffect, useState } from "react";
import { isAxiosError } from "axios";
import {
  ListChecks,
  RefreshCw,
  Play,
  CheckCircle2,
  XCircle,
  UserX,
  Loader2,
  AlertTriangle,
  CalendarDays,
} from "lucide-react";

import { getAdminQueue } from "@/lib/api/admin";
import { updateAppointmentStatus } from "@/lib/api/appointments";
import type { AdminQueueAppointment, AppointmentStatus } from "@/types/api";
import StatusBadge from "@/components/shared/status-badge";

type Toast = { type: "success" | "error"; message: string } | null;
type QueueFilter = "all" | AppointmentStatus;

const FILTERS: { label: string; value: QueueFilter }[] = [
  { label: "All", value: "all" },
  { label: "Waiting", value: "waiting" },
  { label: "In progress", value: "in_progress" },
  { label: "Completed", value: "completed" },
  { label: "Cancelled", value: "cancelled" },
  { label: "No show", value: "no_show" },
];

// Mirrors the backend VALID_STATUS_TRANSITIONS map so we only offer actions the
// server will accept.
const ACTIONS: Record<
  AppointmentStatus,
  { label: string; to: AppointmentStatus; icon: typeof Play; tone: string }[]
> = {
  waiting: [
    { label: "Start", to: "in_progress", icon: Play, tone: "primary" },
    { label: "No-show", to: "no_show", icon: UserX, tone: "muted" },
    { label: "Cancel", to: "cancelled", icon: XCircle, tone: "danger" },
  ],
  in_progress: [
    { label: "Complete", to: "completed", icon: CheckCircle2, tone: "success" },
    { label: "No-show", to: "no_show", icon: UserX, tone: "muted" },
    { label: "Cancel", to: "cancelled", icon: XCircle, tone: "danger" },
  ],
  confirmed: [],
  completed: [],
  cancelled: [],
  no_show: [],
};

const TONE_CLASSES: Record<string, string> = {
  primary:
    "border-primary/30 bg-primary-50 text-primary hover:bg-primary hover:text-white",
  success:
    "border-success/30 bg-success-light text-success hover:bg-success hover:text-white",
  danger:
    "border-danger/30 bg-danger-light text-danger hover:bg-danger hover:text-white",
  muted: "border-border bg-white text-text-secondary hover:bg-bg-muted",
};

function todayISO(): string {
  // Local YYYY-MM-DD (not UTC) so the picker matches the user's calendar day.
  const d = new Date();
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60_000).toISOString().slice(0, 10);
}

function formatDay(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

function initials(name: string | null): string {
  if (!name) return "–";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "–";
}

export default function QueuePage() {
  const [items, setItems] = useState<AdminQueueAppointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<QueueFilter>("all");
  const [date, setDate] = useState<string>(todayISO());
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [toast, setToast] = useState<Toast>(null);

  const loadQueue = useCallback(async () => {
    const data = await getAdminQueue(filter === "all" ? undefined : filter, date);
    setItems(data);
  }, [filter, date]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setIsLoading(true);
      setError("");
      try {
        const data = await getAdminQueue(
          filter === "all" ? undefined : filter,
          date,
        );
        if (!cancelled) setItems(data);
      } catch {
        if (!cancelled) setError("Could not load the queue. Please try again.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [filter, date]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  async function changeStatus(id: string, to: AppointmentStatus) {
    setPendingId(id);
    try {
      await updateAppointmentStatus(id, to);
      await loadQueue();
    } catch (err) {
      const detail =
        isAxiosError(err) && typeof err.response?.data?.detail === "string"
          ? err.response.data.detail
          : "Could not update the appointment.";
      setToast({ type: "error", message: detail });
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Admin</p>
          <h1 className="mt-1 flex items-center gap-2 text-3xl font-bold text-text-primary">
            <ListChecks size={26} className="text-primary" />
            {date === todayISO() ? "Today’s Queue" : "Queue"}
          </h1>
          <p className="mt-1 text-sm text-text-muted">
            Manage patient flow for {formatDay(date)}.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <label className="relative">
            <CalendarDays
              size={15}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
            />
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value || todayISO())}
              className="min-h-11 rounded-full border border-border bg-white pl-9 pr-3 text-sm text-text-primary outline-none transition focus:border-primary"
            />
          </label>
          <button
            onClick={() => {
              setIsLoading(true);
              loadQueue().finally(() => setIsLoading(false));
            }}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-white px-4 py-2.5 text-sm font-semibold text-text-secondary transition hover:bg-bg-muted"
          >
            <RefreshCw size={15} />
            Refresh
          </button>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div
          className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium ${
            toast.type === "success"
              ? "border-success/30 bg-success-light text-success"
              : "border-danger/30 bg-danger-light text-danger"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle2 size={16} />
          ) : (
            <AlertTriangle size={16} />
          )}
          {toast.message}
        </div>
      )}

      {/* Filter pills */}
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
              filter === f.value
                ? "bg-primary text-white"
                : "border border-border bg-white text-text-secondary hover:bg-bg-muted"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-20 animate-pulse rounded-2xl bg-[var(--color-border)]"
            />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-danger/30 bg-danger-light px-4 py-8 text-center">
          <p className="text-sm font-medium text-danger">{error}</p>
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-border bg-bg-primary px-4 py-16 text-center">
          <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-bg-muted text-text-muted">
            <ListChecks size={22} />
          </div>
          <p className="font-semibold text-text-primary">Queue is empty</p>
          <p className="mt-1 text-sm text-text-muted">
            No appointments for {formatDay(date)}
            {filter === "all" ? "" : ` with status “${filter}”`}.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map((item, idx) => {
            const actions = ACTIONS[item.status] ?? [];
            const isPending = pendingId === item.appointment_id;
            return (
              <li
                key={item.appointment_id}
                className="flex flex-col gap-4 rounded-2xl border border-border bg-bg-primary p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex min-w-0 items-center gap-4">
                  <span className="grid h-7 w-7 flex-none place-items-center rounded-full bg-bg-muted text-xs font-bold text-text-muted">
                    {idx + 1}
                  </span>
                  <span className="grid h-11 w-11 flex-none place-items-center rounded-full bg-primary-50 text-sm font-bold text-primary">
                    {initials(item.patient_name)}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-text-primary">
                      {item.patient_name ?? "Unknown patient"}
                    </p>
                    <p className="truncate text-xs text-text-muted">
                      {[
                        formatTime(item.start_time),
                        item.service_name,
                        item.age != null ? `${item.age} yrs` : null,
                        item.fee != null ? `$${item.fee}` : null,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </div>
                </div>

                <div className="flex flex-none items-center gap-2 sm:gap-3">
                  <StatusBadge status={item.status} />
                  {actions.length > 0 && (
                    <div className="flex items-center gap-2">
                      {actions.map((a) => (
                        <button
                          key={a.to}
                          disabled={isPending}
                          onClick={() => changeStatus(item.appointment_id, a.to)}
                          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${TONE_CLASSES[a.tone]}`}
                        >
                          {isPending ? (
                            <Loader2 size={13} className="animate-spin" />
                          ) : (
                            <a.icon size={13} />
                          )}
                          {a.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
