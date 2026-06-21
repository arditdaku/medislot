"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { isAxiosError } from "axios";
import {
  Clock,
  CalendarDays,
  Stethoscope,
  Sparkles,
  Lock,
  Unlock,
  Loader2,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

import { getProviders } from "@/lib/api/providers";
import {
  getSlots,
  generateSlotsRange,
  blockSlot,
  unblockSlot,
} from "@/lib/api/slots";
import type { Provider, Slot, SlotStatus } from "@/types/api";
import Skeleton from "@/components/ui/skeleton";
import Select from "@/components/ui/select";

type Toast = { type: "success" | "error"; message: string } | null;

const DURATIONS = [15, 20, 30, 45, 60];

function todayISO(): string {
  // Local YYYY-MM-DD (not UTC) so the picker matches the user's calendar day.
  const d = new Date();
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60_000).toISOString().slice(0, 10);
}

/** Add `days` to a local YYYY-MM-DD string, returning YYYY-MM-DD. */
function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + days);
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60_000).toISOString().slice(0, 10);
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

function formatDay(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
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

export default function SlotsPage() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [providersLoading, setProvidersLoading] = useState(true);

  const [providerId, setProviderId] = useState<number | null>(null);
  // Generation range (e.g. Mon→Fri). Defaults to the next 5 days.
  const [fromDate, setFromDate] = useState<string>(todayISO());
  const [toDate, setToDate] = useState<string>(addDays(todayISO(), 4));
  const [duration, setDuration] = useState(30);
  // The single day whose slots are shown in the grid below.
  const [date, setDate] = useState<string>(todayISO());

  const [slots, setSlots] = useState<Slot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [pendingSlotId, setPendingSlotId] = useState<string | null>(null);
  const [toast, setToast] = useState<Toast>(null);

  // Load providers for the picker.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await getProviders();
        if (cancelled) return;
        setProviders(data);
        if (data.length > 0) setProviderId(data[0].id);
      } catch {
        if (!cancelled)
          setToast({ type: "error", message: "Could not load providers." });
      } finally {
        if (!cancelled) setProvidersLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  const loadSlots = useCallback(async () => {
    if (providerId == null) return;
    setSlotsLoading(true);
    try {
      const data = await getSlots(providerId, date);
      setSlots(data);
    } catch {
      setToast({ type: "error", message: "Could not load slots." });
    } finally {
      setSlotsLoading(false);
    }
  }, [providerId, date]);

  useEffect(() => {
    if (providerId == null) return;
    let cancelled = false;
    (async () => {
      setSlotsLoading(true);
      try {
        const data = await getSlots(providerId, date);
        if (!cancelled) setSlots(data);
      } catch {
        if (!cancelled)
          setToast({ type: "error", message: "Could not load slots." });
      } finally {
        if (!cancelled) setSlotsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [providerId, date]);

  async function handleGenerate() {
    if (providerId == null) return;
    if (toDate < fromDate) {
      setToast({ type: "error", message: "“To” date must be on or after “From”." });
      return;
    }
    setIsGenerating(true);
    try {
      const created = await generateSlotsRange({
        provider_id: providerId,
        start_date: fromDate,
        end_date: toDate,
        slot_duration_minutes: duration,
      });
      // Jump the grid to the first day of the range so results are visible.
      setDate(fromDate);
      if (date === fromDate) await loadSlots();
      setToast({
        type: "success",
        message:
          created.length > 0
            ? `Generated ${created.length} slot${created.length === 1 ? "" : "s"} across the selected days.`
            : "No new slots — they already exist for this range.",
      });
    } catch (err) {
      // The backend returns helpful 400 messages (no working hours, range too
      // large, invalid range); surface them directly.
      const detail =
        isAxiosError(err) && typeof err.response?.data?.detail === "string"
          ? err.response.data.detail
          : "Could not generate slots. Please try again.";
      setToast({ type: "error", message: detail });
    } finally {
      setIsGenerating(false);
    }
  }

  async function toggleSlot(slot: Slot) {
    setPendingSlotId(slot.id);
    try {
      const updated =
        slot.status === "blocked"
          ? await unblockSlot(slot.id)
          : await blockSlot(slot.id);
      setSlots((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
    } catch (err) {
      const detail =
        isAxiosError(err) && typeof err.response?.data?.detail === "string"
          ? err.response.data.detail
          : "Could not update the slot.";
      setToast({ type: "error", message: detail });
    } finally {
      setPendingSlotId(null);
    }
  }

  const counts = useMemo(() => {
    return slots.reduce(
      (acc, s) => {
        acc[s.status] += 1;
        return acc;
      },
      { available: 0, booked: 0, blocked: 0 } as Record<SlotStatus, number>,
    );
  }, [slots]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="text-sm font-medium text-primary">Admin</p>
        <h1 className="mt-1 text-3xl font-bold text-text-primary">Slots</h1>
        <p className="mt-1 text-sm text-text-muted">
          Generate slots across a date range (e.g. Mon–Fri) and manage them day
          by day.
        </p>
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

      {/* Controls */}
      <div className="rounded-2xl border border-border bg-bg-primary p-5 shadow-sm">
        {providersLoading ? (
          <Skeleton className="h-12" />
        ) : providers.length === 0 ? (
          <p className="text-sm text-text-muted">
            No doctors yet. Add a doctor first to generate their slots.
          </p>
        ) : (
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
            {/* Doctor */}
            <div className="flex-1">
              <span className="flex items-center gap-2 text-sm font-medium text-text-secondary">
                <Stethoscope size={15} /> Doctor
              </span>
              <Select
                className="mt-2"
                ariaLabel="Doctor"
                icon={<Stethoscope size={15} />}
                value={providerId ?? 0}
                onChange={(v) => setProviderId(v)}
                options={providers.map((p) => ({
                  value: p.id,
                  label: p.full_name,
                  hint: p.specialty,
                }))}
              />
            </div>

            {/* From date */}
            <label className="flex-1">
              <span className="flex items-center gap-2 text-sm font-medium text-text-secondary">
                <CalendarDays size={15} /> From
              </span>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => {
                  const v = e.target.value;
                  setFromDate(v);
                  if (toDate < v) setToDate(v);
                }}
                className="mt-2 min-h-11 w-full rounded-xl border border-border bg-bg-secondary px-4 text-sm text-text-primary outline-none transition focus:border-primary focus:bg-white"
              />
            </label>

            {/* To date */}
            <label className="flex-1">
              <span className="flex items-center gap-2 text-sm font-medium text-text-secondary">
                <CalendarDays size={15} /> To
              </span>
              <input
                type="date"
                value={toDate}
                min={fromDate}
                onChange={(e) => setToDate(e.target.value)}
                className="mt-2 min-h-11 w-full rounded-xl border border-border bg-bg-secondary px-4 text-sm text-text-primary outline-none transition focus:border-primary focus:bg-white"
              />
            </label>

            {/* Duration */}
            <div className="flex-1">
              <span className="flex items-center gap-2 text-sm font-medium text-text-secondary">
                <Clock size={15} /> Slot length
              </span>
              <Select
                className="mt-2"
                ariaLabel="Slot length"
                icon={<Clock size={15} />}
                value={duration}
                onChange={(v) => setDuration(v)}
                options={DURATIONS.map((d) => ({ value: d, label: `${d} min` }))}
              />
            </div>

            <button
              onClick={handleGenerate}
              disabled={isGenerating || providerId == null}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-primary px-6 text-sm font-semibold text-white transition hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isGenerating ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Sparkles size={16} />
              )}
              {isGenerating ? "Generating…" : "Generate slots"}
            </button>
          </div>
        )}
      </div>

      {/* View-day selector */}
      {providers.length > 0 && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold text-text-primary">
            Slots for {formatDay(date)}
          </h2>
          <label className="flex items-center gap-2">
            <span className="text-sm font-medium text-text-secondary">
              View day
            </span>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="min-h-10 rounded-xl border border-border bg-bg-primary px-3 text-sm text-text-primary outline-none transition focus:border-primary"
            />
          </label>
        </div>
      )}

      {/* Legend / counts */}
      {!slotsLoading && slots.length > 0 && (
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
      {slotsLoading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : slots.length === 0 ? (
        <div className="rounded-2xl border border-border bg-bg-primary px-4 py-16 text-center">
          <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-bg-muted text-text-muted">
            <Clock size={22} />
          </div>
          <p className="font-semibold text-text-primary">No slots for this day</p>
          <p className="mt-1 text-sm text-text-muted">
            Pick a date and click “Generate slots” to create the doctor’s
            schedule.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {slots.map((slot) => {
            const meta = STATUS_META[slot.status];
            const isBooked = slot.status === "booked";
            const isPending = pendingSlotId === slot.id;
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

                <button
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
