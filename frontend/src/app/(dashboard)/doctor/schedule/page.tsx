"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Clock,
  CalendarDays,
  Lock,
  Unlock,
  Loader2,
  AlertTriangle,
} from "lucide-react";

import { getDoctorSchedule } from "@/lib/api/doctor";
import { blockSlot, unblockSlot } from "@/lib/api/slots";
import type { Slot, SlotStatus } from "@/types/api";
import Skeleton from "@/components/ui/skeleton";

// /doctor/schedule returns booked slots enriched with the patient & service.
type ScheduleSlot = Slot & {
  patient_name?: string | null;
  service_name?: string | null;
};

function todayISO(): string {
  const d = new Date();
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60_000).toISOString().slice(0, 10);
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

function formatDay(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

const STATUS_META: Record<
  SlotStatus,
  { label: string; dot: string; chip: string }
> = {
  available: {
    label: "Available",
    dot: "bg-success",
    chip: "border-success/30 bg-success-light text-success",
  },
  booked: {
    label: "Booked",
    dot: "bg-primary",
    chip: "border-primary/30 bg-primary-50 text-primary",
  },
  blocked: {
    label: "Blocked",
    dot: "bg-danger",
    chip: "border-danger/30 bg-danger-light text-danger",
  },
};

export default function DoctorSchedulePage() {
  const [date, setDate] = useState<string>(todayISO());
  const [slots, setSlots] = useState<ScheduleSlot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setIsLoading(true);
      setError("");
      try {
        const data = await getDoctorSchedule(date);
        if (!cancelled) setSlots(data);
      } catch {
        if (!cancelled) setError("Could not load the schedule for this day.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [date]);

  async function reload() {
    try {
      setSlots(await getDoctorSchedule(date));
    } catch {
      setError("Could not refresh the schedule.");
    }
  }

  async function toggleSlot(slot: ScheduleSlot) {
    setPendingId(slot.id);
    setError("");
    try {
      if (slot.status === "blocked") {
        await unblockSlot(slot.id);
      } else {
        await blockSlot(slot.id);
      }
      await reload();
    } catch {
      setError(
        slot.status === "blocked"
          ? "Could not unblock this slot."
          : "Could not block this slot.",
      );
    } finally {
      setPendingId(null);
    }
  }

  const counts = useMemo(
    () =>
      slots.reduce(
        (acc, s) => {
          acc[s.status] += 1;
          return acc;
        },
        { available: 0, booked: 0, blocked: 0 } as Record<SlotStatus, number>,
      ),
    [slots],
  );

  const sorted = useMemo(
    () => [...slots].sort((a, b) => a.start_time.localeCompare(b.start_time)),
    [slots],
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Doctor</p>
          <h1 className="mt-1 text-3xl font-bold text-text-primary">Schedule</h1>
          <p className="mt-1 text-sm text-text-muted">
            Review your slots for the day and block times you’re unavailable.
          </p>
        </div>

        <label className="relative">
          <CalendarDays
            size={15}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
          />
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value || todayISO())}
            className="min-h-11 rounded-full border border-border bg-bg-primary pl-9 pr-3 text-sm text-text-primary outline-none transition focus:border-primary"
          />
        </label>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-danger/30 bg-danger-light px-4 py-3 text-sm font-medium text-danger">
          <AlertTriangle size={16} />
          {error}
        </div>
      )}

      <h2 className="text-lg font-semibold text-text-primary">
        Slots for {formatDay(date)}
      </h2>

      {/* Legend / counts */}
      {!isLoading && slots.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 text-sm text-text-secondary">
          {(Object.keys(STATUS_META) as SlotStatus[]).map((s) => (
            <span
              key={s}
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 ${STATUS_META[s].chip}`}
            >
              <span className={`h-2 w-2 rounded-full ${STATUS_META[s].dot}`} />
              {STATUS_META[s].label}: {counts[s]}
            </span>
          ))}
        </div>
      )}

      {/* Slots grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      ) : slots.length === 0 ? (
        <div className="rounded-2xl border border-border bg-bg-primary px-4 py-16 text-center">
          <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-bg-muted text-text-muted">
            <Clock size={22} />
          </div>
          <p className="font-semibold text-text-primary">No slots for this day</p>
          <p className="mt-1 text-sm text-text-muted">
            Try another day. New availability is generated by your admin.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {sorted.map((slot) => {
            const meta = STATUS_META[slot.status];
            const isBooked = slot.status === "booked";
            const isPending = pendingId === slot.id;
            return (
              <div
                key={slot.id}
                className="flex flex-col gap-2 rounded-2xl border border-border bg-bg-primary p-4 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-text-primary">
                    {formatTime(slot.start_time)}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-semibold ${meta.chip}`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
                    {meta.label}
                  </span>
                </div>

                <span className="text-xs text-text-muted">
                  until {formatTime(slot.end_time)}
                </span>

                {isBooked && slot.patient_name && (
                  <span className="truncate text-xs text-text-secondary">
                    {slot.patient_name}
                    {slot.service_name ? ` · ${slot.service_name}` : ""}
                  </span>
                )}

                <button
                  type="button"
                  onClick={() => toggleSlot(slot)}
                  disabled={isBooked || isPending}
                  className={`mt-1 inline-flex items-center justify-center gap-1.5 rounded-full border py-1.5 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                    slot.status === "blocked"
                      ? "border-success/30 bg-success-light text-success hover:bg-success hover:text-white"
                      : "border-border bg-white text-text-secondary hover:bg-bg-muted"
                  }`}
                >
                  {isPending ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : slot.status === "blocked" ? (
                    <Unlock size={13} />
                  ) : (
                    <Lock size={13} />
                  )}
                  {isBooked
                    ? "Booked"
                    : slot.status === "blocked"
                      ? "Unblock"
                      : "Block"}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
