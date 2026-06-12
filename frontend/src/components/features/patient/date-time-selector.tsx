"use client";

import { useEffect, useState } from "react";

import Card from "@/components/ui/card";

// Local mirror of the backend SlotResponse schema (backend/app/schemas/slot.py).
// Kept local on purpose so this component doesn't depend on a shared types file
// owned by another ticket. start_time / end_time are ISO datetime strings.
type SlotStatus = "available" | "booked" | "blocked";

type Slot = {
  id: string;
  provider_id: number;
  start_time: string;
  end_time: string;
  status: SlotStatus;
};

// Build a naive local ISO datetime string (no timezone shift), e.g.
// "2026-06-12T08:30:00" — matching what the API serializes for a slot.
function toLocalIso(year: number, month: number, day: number, hours: number, minutes: number): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${year}-${pad(month + 1)}-${pad(day)}T${pad(hours)}:${pad(minutes)}:00`;
}

// TEMPORARY MOCK DATA. Replace this function body with the SCRUM-77 API client call to GET /slots when it lands. Do not move this into lib/api-client.ts.
async function fetchSlots(date: Date): Promise<Slot[]> {
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();
  const daySeed = day; // deterministic-but-varied statuses per date

  const slots: Slot[] = [];
  let index = 0;
  // 30-minute slots from 08:00 up to (but not including) 17:00.
  for (let minutesOfDay = 8 * 60; minutesOfDay < 17 * 60; minutesOfDay += 30) {
    const startHours = Math.floor(minutesOfDay / 60);
    const startMinutes = minutesOfDay % 60;
    const endMinutesOfDay = minutesOfDay + 30;
    const endHours = Math.floor(endMinutesOfDay / 60);
    const endMinutes = endMinutesOfDay % 60;

    // Most available, with a few booked/blocked so every visual state shows.
    const cycle = (index + daySeed) % 7;
    const status: SlotStatus = cycle === 2 ? "booked" : cycle === 5 ? "blocked" : "available";

    slots.push({
      id: `${year}-${month + 1}-${day}-${index}`,
      provider_id: 1,
      start_time: toLocalIso(year, month, day, startHours, startMinutes),
      end_time: toLocalIso(year, month, day, endHours, endMinutes),
      status,
    });
    index += 1;
  }

  return slots;
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

export default function DateTimeSelector() {
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

    fetchSlots(selectedDate)
      .then((result) => {
        if (!cancelled) setSlots(result);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedDate]);

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
