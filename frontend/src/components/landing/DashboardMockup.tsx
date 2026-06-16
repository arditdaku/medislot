"use client";

import { useEffect, useState } from "react";
import { CalendarCheck, LineChart, ShieldCheck } from "lucide-react";
import Card from "../ui/card";
import Skeleton from "../ui/skeleton";

const dashboardStats = [
  { label: "Appointments", value: "1,284", icon: CalendarCheck },
  { label: "No-show rate", value: "4.8%", icon: ShieldCheck },
  { label: "Patient growth", value: "+18%", icon: LineChart },
];

const tableRows = [
  ["09:00", "Mia Carter", "Annual checkup", "Confirmed"],
  ["10:30", "Owen Patel", "Dermatology consult", "Reminder sent"],
  ["12:15", "Ava Brooks", "Follow-up visit", "Pending"],
  ["14:00", "Noah Kim", "Physical therapy", "Confirmed"],
];

const statusColors = {
  Confirmed:
    "bg-[var(--color-success-light)] text-[var(--navy-color)]",

  Pending:
    "bg-[var(--color-warning-light)] text-[var(--navy-color)]",

  "Reminder sent":
    "bg-[var(--color-info-light)] text-[var(--navy-color)]",
};

type DashboardMockupProps = {
  compact?: boolean;
};

export default function DashboardMockup({
  compact = false,
}: DashboardMockupProps) {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setLoaded(true), 700);
    return () => window.clearTimeout(timer);
  }, []);

  if (!loaded) {
    return (
      <Card className="p-4">
        <Skeleton className="h-8 w-40" />
        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <Skeleton className="mt-5 h-56" />
      </Card>
    );
  }

  const sectionGap = compact ? "mt-4" : "mt-6";
  const barHeight = compact ? 92 : 128;
  const rows = compact ? tableRows.slice(0, 3) : tableRows;

  return (
    <Card className={`overflow-hidden p-4 sm:p-6 ${compact ? "" : "lg:p-7"}`}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-[var(--color-navy)]">
            Clinic command center
          </p>
          <h3 className="mt-1 text-xl font-bold text-[var(--color-text-primary)]">
            Today&apos;s schedule
          </h3>
        </div>
        <span className="rounded-full bg-[var(--color-success-light)] px-3 py-1 text-xs font-semibold text-[var(--color-navy)]">
          Live sync
        </span>
      </div>

      <div className={`${sectionGap} grid gap-4 sm:grid-cols-3`}>
        {dashboardStats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="rounded-2xl border border-[var(--color-border-light)] bg-[var(--color-bg-secondary)] p-4"
            >
                <Icon className="h-5 w-5 text-[var(--color-primary)]" />
                <p className="mt-3 text-2xl font-bold text-[var(--color-text-primary)]">
                {stat.value}
              </p>
                <p className="text-sm text-[var(--color-text-muted)]">
                {stat.label}
              </p>
            </div>
          );
        })}
      </div>

      <div className={`${sectionGap} grid gap-5 lg:grid-cols-[1.1fr_0.9fr]`}>
        <div className="rounded-2xl border border-[var(--color-border-light)] bg-white p-4">
          <div className="flex items-end gap-2">
            {[52, 74, 46, 88, 68, 94, 78].map((height, index) => (
              <div
                key={height + index}
                className="flex flex-1 items-end rounded-full bg-[var(--color-border-light)] p-1"
                style={{ height: barHeight }}
              >
                <div
                  className="w-full rounded-full bg-[var(--color-primary)]"
                  style={{ height: `${height}%` }}
                />
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm font-medium text-[var(--color-text-secondary)]">
            Weekly booking volume
          </p>
        </div>
        <div className="rounded-2xl border border-[var(--color-border-light)] bg-white p-4">
          <div className="grid grid-cols-7 gap-1 text-center text-xs text-[var(--color-text-muted)]">
            {["M", "T", "W", "T", "F", "S", "S"].map((day, index) => (
              <span key={day + index}>{day}</span>
            ))}
            {Array.from({ length: 28 }, (_, index) => (
              <span
                key={index}
                className={`grid aspect-square place-items-center rounded-full text-xs ${
                  [5, 11, 12, 18, 21].includes(index)
                    ? "bg-[var(--color-primary-100)] font-semibold text-[var(--color-primary)]"
                    : "text-[var(--color-text-muted)]"
                }`}
              >
                {index + 1}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className={`${sectionGap} overflow-hidden rounded-2xl border border-[var(--color-border-light)]`}>
        <table className="w-full text-left text-sm">
          <thead className="bg-[var(--color-bg-secondary)] text-xs uppercase text-[var(--color-text-muted)]">
            <tr>
              <th className="px-4 py-3 font-semibold">Time</th>
              <th className="px-4 py-3 font-semibold">Patient</th>
              <th className="hidden px-4 py-3 font-semibold sm:table-cell">
                Visit
              </th>
              <th className="px-4 py-3 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border-light)]">
            {rows.map(([time, patient, visit, status]) => (
              <tr key={`${time}-${patient}`} className="bg-white">
                <td className="px-4 py-3 font-medium text-[var(--color-text-primary)]">
                  {time}
                </td>
                <td className="px-4 py-3 text-[var(--color-text-secondary)]">
                  {patient}
                </td>
                <td className="hidden px-4 py-3 text-[var(--color-text-muted)] sm:table-cell">
                  {visit}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                      statusColors[status as keyof typeof statusColors]
                    }`}
                  >
                    {status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
