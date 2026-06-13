"use client";

import { useEffect, useState } from "react";

import Card from "@/components/ui/card";
import { getSlots } from "@/lib/api/slots";
import type { Slot } from "@/types/api";

// Format a Date as "YYYY-MM-DD" using LOCAL year/month/day (not toISOString,
// which would shift across the UTC day boundary).
function toLocalDateStr(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

// "10:30" from an ISO datetime string (slice avoids any timezone reinterpretation).
function formatTime(iso: string): string {
  return iso.slice(11, 16);
}

function formatDateLabel(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function startHourOf(slot: Slot): number {
  return Number(slot.start_time.slice(11, 13));
}

interface DateTimeSelectorProps {
  providerId: number;
}

export default function DateTimeSelector({ providerId }: DateTimeSelectorProps) {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);

  // Swapping to the real API later is a one-function change (fetchSlots).
  useEffect(() => {
    if (!selectedDate) return;

    let cancelled = false;
    setLoading(true);
    setSelectedSlotId(null);

    const dateStr = toLocalDateStr(selectedDate);

    getSlots(providerId, dateStr)
      .then((result) => {
        if (!cancelled) setSlots(result);
      })
      .catch(() => {
        // On error, fall back to an empty state rather than crashing.
        if (!cancelled) setSlots([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedDate, providerId]);

  // Calendar grid for the current month.
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const morning = slots.filter((s) => {
    const h = startHourOf(s);
    return h >= 8 && h <= 11;
  });
  const afternoon = slots.filter((s) => {
    const h = startHourOf(s);
    return h >= 12 && h <= 16;
  });

  const selectedSlot = slots.find((s) => s.id === selectedSlotId) ?? null;

  function renderSlot(slot: Slot) {
    const isSelected = slot.id === selectedSlotId;
    const isDisabled = slot.status === "booked" || slot.status === "blocked";

    let className =
      "min-h-11 rounded-full border px-4 py-2 text-sm font-medium transition duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)] ";
    if (isDisabled) {
      className +=
        "border-[var(--color-border)] bg-[var(--color-bg-muted)] text-[var(--color-text-muted)] line-through cursor-not-allowed";
    } else if (isSelected) {
      className += "border-[var(--color-primary)] bg-[var(--color-primary)] text-[var(--color-white)]";
    } else {
      className +=
        "border-[var(--color-border)] bg-white text-[var(--color-text-secondary)] hover:border-[var(--color-primary)] hover:bg-[var(--color-primary-50)]";
    }

    return (
      <button
        key={slot.id}
        type="button"
        disabled={isDisabled}
        aria-pressed={isSelected}
        onClick={() => setSelectedSlotId(slot.id)}
        className={className}
      >
        {formatTime(slot.start_time)}
      </button>
    );
  }

  function renderGroup(title: string, groupSlots: Slot[]) {
    if (groupSlots.length === 0) return null;
    return (
      <div className="flex flex-col gap-3">
        <h4 className="text-sm font-semibold text-[var(--color-text-secondary)]">{title}</h4>
        <div className="flex flex-wrap gap-2">{groupSlots.map(renderSlot)}</div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      {/* Left: month calendar */}
      <Card className="p-6">
        <h3 className="mb-4 text-base font-semibold text-[var(--color-text-primary)]">
          {today.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
        </h3>
        <div className="grid grid-cols-7 gap-1 text-center">
          {WEEKDAYS.map((day) => (
            <div key={day} className="py-2 text-xs font-semibold text-[var(--color-text-muted)]">
              {day}
            </div>
          ))}
          {cells.map((day, i) => {
            if (day === null) return <div key={`blank-${i}`} />;
            const isSelected =
              selectedDate !== null &&
              selectedDate.getFullYear() === year &&
              selectedDate.getMonth() === month &&
              selectedDate.getDate() === day;
            const isToday = day === today.getDate();

            let className =
              "flex min-h-11 items-center justify-center rounded-full text-sm transition duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)] ";
            if (isSelected) {
              className += "bg-[var(--color-primary)] font-semibold text-[var(--color-white)]";
            } else if (isToday) {
              className +=
                "border border-[var(--color-primary)] text-[var(--color-primary)] hover:bg-[var(--color-primary-50)]";
            } else {
              className += "text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-muted)]";
            }

            return (
              <button
                key={day}
                type="button"
                aria-pressed={isSelected}
                onClick={() => setSelectedDate(new Date(year, month, day))}
                className={className}
              >
                {day}
              </button>
            );
          })}
        </div>
      </Card>

      {/* Right: time slots for the selected date */}
      <Card className="p-6">
        {!selectedDate ? (
          <p className="text-sm text-[var(--color-text-muted)]">Select a date to see available times.</p>
        ) : loading ? (
          <p className="text-sm text-[var(--color-text-muted)]">Loading times…</p>
        ) : slots.length === 0 ? (
          <p className="text-sm text-[var(--color-text-muted)]">No times available for this date.</p>
        ) : (
          <div className="flex flex-col gap-6">
            <h3 className="text-base font-semibold text-[var(--color-text-primary)]">
              {formatDateLabel(selectedDate)}
            </h3>
            {renderGroup("Morning", morning)}
            {renderGroup("Afternoon", afternoon)}

            {selectedSlot && (
              <div className="rounded-2xl bg-[var(--color-primary-50)] px-4 py-3 text-sm font-semibold text-[var(--color-primary-700)]">
                Selected: {formatDateLabel(selectedDate)} at {formatTime(selectedSlot.start_time)}
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
