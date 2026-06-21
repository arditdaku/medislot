"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, CheckCircle2, Moon, Sun } from "lucide-react";

import Skeleton from "@/components/ui/skeleton";
import { getSlots } from "@/lib/api/slots";
import type { Slot } from "@/types/api";

const WEEKDAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

/** "YYYY-MM-DD" from local Y/M/D (never toISOString — avoids UTC day shift). */
function toLocalDateStr(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** "10:30" from an ISO datetime string (slice avoids timezone reinterpretation). */
function formatTime(iso: string): string {
  return iso.slice(11, 16);
}

function startHourOf(slot: Slot): number {
  return Number(slot.start_time.slice(11, 13));
}

function dayKeyOf(slot: Slot): string {
  return slot.start_time.slice(0, 10);
}

function formatDateLabel(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

interface DateTimeSelectorProps {
  providerId: number;
  selectedSlot: Slot | null;
  onSelectSlot: (slot: Slot | null) => void;
  /** Bump to force a re-fetch (e.g. after a slot was taken by someone else). */
  reloadKey?: number;
}

export default function DateTimeSelector({
  providerId,
  selectedSlot,
  onSelectSlot,
  reloadKey = 0,
}: DateTimeSelectorProps) {
  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  const [viewMonth, setViewMonth] = useState(
    () => new Date(today.getFullYear(), today.getMonth(), 1),
  );
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  // Captured once: slots whose start time is at/before this are in the past and
  // can't be booked (their status is still "available" until acted on).
  const [nowMs] = useState(() => Date.now());

  const isPast = (slot: Slot) => new Date(slot.start_time).getTime() <= nowMs;
  const isBookable = (slot: Slot) => slot.status === "available" && !isPast(slot);

  // Fetch ALL available slots for the provider once (no date filter), then
  // group them client-side. One request powers both the calendar and times.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        // Keep ALL statuses — booked/blocked are shown disabled, not hidden.
        const result = await getSlots(providerId);
        if (!cancelled) setSlots(result);
      } catch {
        if (!cancelled) setSlots([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [providerId, reloadKey]);

  // day key -> slots
  const byDay = useMemo(() => {
    const map = new Map<string, Slot[]>();
    for (const s of slots) {
      const key = dayKeyOf(s);
      (map.get(key) ?? map.set(key, []).get(key)!).push(s);
    }
    return map;
  }, [slots]);

  // Days that have at least one bookable (available + not past) slot — drive the
  // dot + enabled state.
  const availableDays = useMemo(() => {
    const set = new Set<string>();
    for (const [key, list] of byDay) {
      if (list.some(isBookable)) set.add(key);
    }
    return set;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [byDay, nowMs]);

  const year = viewMonth.getFullYear();
  const month = viewMonth.getMonth();
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const daySlots = selectedDate ? byDay.get(toLocalDateStr(selectedDate)) ?? [] : [];
  const morning = daySlots
    .filter((s) => startHourOf(s) < 12)
    .sort((a, b) => a.start_time.localeCompare(b.start_time));
  const afternoon = daySlots
    .filter((s) => startHourOf(s) >= 12)
    .sort((a, b) => a.start_time.localeCompare(b.start_time));

  const canGoPrev = year > today.getFullYear() || month > today.getMonth();

  function renderSlot(slot: Slot) {
    const isSelected = slot.id === selectedSlot?.id;
    const past = isPast(slot);
    const isDisabled = slot.status !== "available" || past;

    let style: string;
    if (isDisabled) {
      style =
        "cursor-not-allowed border-[var(--color-border)] bg-[var(--color-bg-muted)] text-[var(--color-text-muted)] line-through";
    } else if (isSelected) {
      style = "border-[var(--color-primary)] bg-[var(--color-primary)] text-[var(--color-white)]";
    } else {
      style =
        "border-[var(--color-border)] bg-white text-[var(--color-text-secondary)] hover:border-[var(--color-primary)] hover:bg-[var(--color-primary-50)]";
    }

    return (
      <button
        key={slot.id}
        type="button"
        disabled={isDisabled}
        aria-pressed={isSelected}
        title={past ? "This time has passed" : isDisabled ? "Already booked" : undefined}
        onClick={() => onSelectSlot(isSelected ? null : slot)}
        className={`min-h-10 rounded-full border px-4 py-2 text-sm font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)] ${style}`}
      >
        {formatTime(slot.start_time)}
      </button>
    );
  }

  function renderGroup(title: string, icon: React.ReactNode, range: string, group: Slot[]) {
    if (group.length === 0) return null;
    return (
      <div className="flex flex-col gap-3">
        <h4 className="flex items-center gap-2 text-sm font-semibold text-[var(--color-text-primary)]">
          {icon}
          {title}
          <span className="font-normal text-[var(--color-text-muted)]">{range}</span>
        </h4>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{group.map(renderSlot)}</div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* Left: month calendar */}
      <div className="rounded-2xl border border-[var(--color-border)] bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-semibold text-[var(--color-text-primary)]">
            {viewMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
          </h3>
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={!canGoPrev}
              onClick={() => setViewMonth(new Date(year, month - 1, 1))}
              aria-label="Previous month"
              className="grid h-8 w-8 place-items-center rounded-full text-[var(--color-text-secondary)] transition hover:bg-[var(--color-bg-muted)] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              onClick={() => setViewMonth(new Date(year, month + 1, 1))}
              aria-label="Next month"
              className="grid h-8 w-8 place-items-center rounded-full text-[var(--color-text-secondary)] transition hover:bg-[var(--color-bg-muted)]"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center">
          {WEEKDAYS.map((d) => (
            <div key={d} className="py-2 text-xs font-semibold text-[var(--color-text-muted)]">
              {d}
            </div>
          ))}

          {loading
            ? Array.from({ length: 35 }, (_, i) => <Skeleton key={i} className="m-1 h-9 rounded-full" />)
            : cells.map((day, i) => {
                if (day === null) return <div key={`blank-${i}`} />;
                const date = new Date(year, month, day);
                const hasSlots = availableDays.has(toLocalDateStr(date));
                const isPast = date < todayStart;
                const disabled = isPast || !hasSlots;
                const isSelected =
                  selectedDate !== null && toLocalDateStr(selectedDate) === toLocalDateStr(date);

                return (
                  <button
                    key={day}
                    type="button"
                    disabled={disabled}
                    aria-pressed={isSelected}
                    onClick={() => {
                      setSelectedDate(date);
                      onSelectSlot(null);
                    }}
                    className={`relative flex min-h-11 items-center justify-center rounded-xl text-sm transition ${
                      isSelected
                        ? "bg-[var(--color-primary)] font-semibold text-[var(--color-white)]"
                        : disabled
                          ? "text-[var(--color-text-muted)]/50 cursor-not-allowed"
                          : "font-medium text-[var(--color-text-primary)] hover:bg-[var(--color-primary-50)]"
                    }`}
                  >
                    {day}
                    {hasSlots && !isSelected && (
                      <span className="absolute bottom-1.5 h-1 w-1 rounded-full bg-[var(--color-primary)]" />
                    )}
                  </button>
                );
              })}
        </div>
      </div>

      {/* Right: time slots */}
      <div className="rounded-2xl border border-[var(--color-border)] bg-white p-6">
        {!selectedDate ? (
          <p className="text-sm text-[var(--color-text-muted)]">Select a date to see available times.</p>
        ) : (
          <div className="flex flex-col gap-6">
            <p className="text-sm font-medium text-[var(--color-text-secondary)]">
              {formatDateLabel(selectedDate)}
            </p>
            {daySlots.length === 0 ? (
              <p className="text-sm text-[var(--color-text-muted)]">No times available for this date.</p>
            ) : (
              <>
                {renderGroup("Morning", <Sun size={15} className="text-[var(--color-warning)]" />, "08:00 — 12:00", morning)}
                {renderGroup("Afternoon", <Moon size={15} className="text-[var(--color-primary)]" />, "12:00 — 17:00", afternoon)}
              </>
            )}

            {selectedSlot && (
              <div className="flex items-center gap-2 rounded-2xl bg-[var(--color-primary-50)] px-4 py-3 text-sm font-semibold text-[var(--color-primary-700)]">
                <CheckCircle2 size={16} />
                Selected: {formatDateLabel(selectedDate)} at {formatTime(selectedSlot.start_time)}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
