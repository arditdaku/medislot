"use client";

import { useEffect, useState } from "react";

type SlotStatus = "available" | "blocked" | "booked";

type SlotPeriod = "Morning" | "Afternoon";

type ScheduleSlot = {
  id: string;
  time: string;
  period: SlotPeriod;
  status: SlotStatus;
  patientName?: string;
  service?: string;
};

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

const getTodayDate = () => new Date().toISOString().split("T")[0];

async function getDoctorSchedule(date: string): Promise<ScheduleSlot[]> {
  const response = await fetch(`${apiUrl}/doctor/schedule?date=${date}`);

  if (!response.ok) {
    throw new Error("Failed to fetch doctor schedule");
  }

  return response.json();
}

async function blockSlot(id: string) {
  const response = await fetch(`${apiUrl}/doctor/schedule/${id}/block`, {
    method: "PUT",
  });

  if (!response.ok) {
    throw new Error("Failed to block slot");
  }

  return response.json();
}

async function unblockSlot(id: string) {
  const response = await fetch(`${apiUrl}/doctor/schedule/${id}/unblock`, {
    method: "PUT",
  });

  if (!response.ok) {
    throw new Error("Failed to unblock slot");
  }

  return response.json();
}

function getStatusClassName(status: SlotStatus) {
  if (status === "available") {
    return "bg-primary/10 text-primary";
  }

  if (status === "blocked") {
    return "bg-destructive/10 text-destructive";
  }

  return "bg-muted text-muted-foreground";
}

export default function DoctorSchedulePage() {
  const [selectedDate, setSelectedDate] = useState(getTodayDate);
  const [slots, setSlots] = useState<ScheduleSlot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingSlotId, setUpdatingSlotId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const groupedSlots: Record<SlotPeriod, ScheduleSlot[]> = {
    Morning: slots.filter((slot) => slot.period === "Morning"),
    Afternoon: slots.filter((slot) => slot.period === "Afternoon"),
  };

  const fetchSchedule = async () => {
    setIsLoading(true);
    setError("");

    try {
      const data = await getDoctorSchedule(selectedDate);
      setSlots(data);
    } catch {
      setError("Could not load the schedule for this day.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedule();
  }, [selectedDate]);

  const handleBlockSlot = async (slotId: string) => {
    setUpdatingSlotId(slotId);
    setError("");

    try {
      await blockSlot(slotId);
      await fetchSchedule();
    } catch {
      setError("Could not block this slot.");
    } finally {
      setUpdatingSlotId(null);
    }
  };

  const handleUnblockSlot = async (slotId: string) => {
    setUpdatingSlotId(slotId);
    setError("");

    try {
      await unblockSlot(slotId);
      await fetchSchedule();
    } catch {
      setError("Could not unblock this slot.");
    } finally {
      setUpdatingSlotId(null);
    }
  };

  return (
    <main className="min-h-screen bg-background px-6 py-8 text-foreground">
      <section className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Doctor</p>
          <h1 className="mt-2 text-3xl font-bold">Schedule</h1>
          <p className="mt-2 text-muted-foreground">
            Review daily slots and manage your availability.
          </p>
        </div>

        <label className="flex flex-col gap-2 text-sm font-medium">
          Select day
          <input
            type="date"
            value={selectedDate}
            onChange={(event) => setSelectedDate(event.target.value)}
            className="min-h-11 rounded-md border border-input bg-background px-4 text-sm outline-none focus:border-primary"
          />
        </label>
      </section>

      {error && (
        <div className="mb-6 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
          {error}
        </div>
      )}

      {isLoading ? (
        <section className="rounded-lg border border-border bg-card p-6 text-card-foreground shadow-sm">
          <p className="text-sm text-muted-foreground">Loading schedule...</p>
        </section>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {(["Morning", "Afternoon"] as const).map((period) => (
            <section
              key={period}
              className="rounded-lg border border-border bg-card p-5 text-card-foreground shadow-sm"
            >
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold">{period}</h2>
                <span className="text-sm text-muted-foreground">
                  {groupedSlots[period].length} slots
                </span>
              </div>

              {groupedSlots[period].length === 0 ? (
                <p className="rounded-md border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
                  No slots available for this period.
                </p>
              ) : (
                <div className="space-y-3">
                  {groupedSlots[period].map((slot) => (
                    <article
                      key={slot.id}
                      className="rounded-md border border-border bg-background p-4"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-semibold">{slot.time}</p>
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${getStatusClassName(
                                slot.status,
                              )}`}
                            >
                              {slot.status}
                            </span>
                          </div>

                          {slot.status === "booked" && (
                            <p className="mt-2 text-sm text-muted-foreground">
                              {slot.patientName} · {slot.service}
                            </p>
                          )}
                        </div>

                        {slot.status === "available" && (
                          <button
                            type="button"
                            disabled={updatingSlotId === slot.id}
                            onClick={() => handleBlockSlot(slot.id)}
                            className="rounded-md border border-destructive/30 px-4 py-2 text-sm font-semibold text-destructive hover:bg-destructive hover:text-destructive-foreground disabled:cursor-not-allowed disabled:opacity-70"
                          >
                            {updatingSlotId === slot.id ? "Blocking..." : "Block"}
                          </button>
                        )}

                        {slot.status === "blocked" && (
                          <button
                            type="button"
                            disabled={updatingSlotId === slot.id}
                            onClick={() => handleUnblockSlot(slot.id)}
                            className="rounded-md border border-primary/30 px-4 py-2 text-sm font-semibold text-primary hover:bg-primary hover:text-primary-foreground disabled:cursor-not-allowed disabled:opacity-70"
                          >
                            {updatingSlotId === slot.id
                              ? "Unblocking..."
                              : "Unblock"}
                          </button>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          ))}
        </div>
      )}
    </main>
  );
}