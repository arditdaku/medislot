"use client";

import { useState } from "react";

const getTodayDate = () => new Date().toISOString().split("T")[0];

export default function DoctorSchedulePage() {
  const [selectedDate, setSelectedDate] = useState(getTodayDate);

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
    </main>
  );
}