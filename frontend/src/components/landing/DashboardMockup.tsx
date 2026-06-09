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

  return (
    <Card className={`overflow-hidden p-4 sm:p-6 ${compact ? "" : "lg:p-7"}`}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-teal-600">
            Clinic command center
          </p>
          <h3 className="mt-1 text-xl font-bold text-slate-950">
            Today&apos;s schedule
          </h3>
        </div>
        <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700">
          Live sync
        </span>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {dashboardStats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="rounded-2xl border border-slate-100 bg-slate-50 p-4"
            >
                <Icon className="h-5 w-5 text-[var(--color-primary)]" />
                <p className="mt-3 text-2xl font-bold text-slate-950">
                {stat.value}
              </p>
                <p className="text-sm text-slate-500">
                {stat.label}
              </p>
            </div>
          );
        })}
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-2xl border border-slate-100 bg-white p-4">
          <div className="flex items-end gap-2">
            {[52, 74, 46, 88, 68, 94, 78].map((height, index) => (
              <div
                key={height + index}
                className="flex flex-1 items-end rounded-full bg-slate-100 p-1"
                style={{ height: 128 }}
              >
                <div
                  className="w-full rounded-full bg-[var(--color-primary)]"
                  style={{ height: `${height}%` }}
                />
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm font-medium text-slate-600">
            Weekly booking volume
          </p>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-white p-4">
          <div className="grid grid-cols-7 gap-1 text-center text-xs text-slate-400">
            {["M", "T", "W", "T", "F", "S", "S"].map((day, index) => (
              <span key={day + index}>{day}</span>
            ))}
            {Array.from({ length: 28 }, (_, index) => (
              <span
                key={index}
                className={`grid aspect-square place-items-center rounded-full text-xs ${
                  [5, 11, 12, 18, 21].includes(index)
                    ? "bg-sky-100 font-semibold text-[var(--color-primary)]"
                    : "text-slate-500"
                }`}
              >
                {index + 1}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-slate-100">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3 font-semibold">Time</th>
              <th className="px-4 py-3 font-semibold">Patient</th>
              <th className="hidden px-4 py-3 font-semibold sm:table-cell">
                Visit
              </th>
              <th className="px-4 py-3 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {tableRows.map(([time, patient, visit, status]) => (
              <tr key={`${time}-${patient}`} className="bg-white">
                <td className="px-4 py-3 font-medium text-slate-900">
                  {time}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {patient}
                </td>
                <td className="hidden px-4 py-3 text-slate-500 sm:table-cell">
                  {visit}
                </td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
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
