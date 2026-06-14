"use client";

import type { AppointmentStatus } from "@/types/api";
import Button from "@/components/ui/button";
import Card from "@/components/ui/card";
import StatusBadge from "@/components/shared/status-badge";

/**
 * Reusable card for displaying a single appointment: provider, service,
 * date/time, a status badge, and a cancel action.
 *
 * Display fields are passed in directly (rather than a raw Appointment) so the
 * card stays decoupled from how provider/service/slot data is assembled.
 */

type AppointmentCardProps = {
  providerName: string;
  serviceName: string;
  /** Slot start time as an ISO 8601 string. */
  startTime: string;
  status: AppointmentStatus;
  /** Invoked when the user clicks Cancel. Omit to hide the cancel button. */
  onCancel?: () => void;
  /** Disables the cancel button and shows a pending label while in flight. */
  isCancelling?: boolean;
  className?: string;
};

/** Statuses for which a patient can still cancel the appointment. */
const CANCELLABLE: AppointmentStatus[] = ["confirmed", "waiting"];

function formatDateTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export default function AppointmentCard({
  providerName,
  serviceName,
  startTime,
  status,
  onCancel,
  isCancelling = false,
  className = "",
}: AppointmentCardProps) {
  const showCancel = Boolean(onCancel) && CANCELLABLE.includes(status);

  return (
    <Card className={`flex flex-col gap-4 p-6 ${className}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="truncate text-base font-semibold text-[var(--color-text-primary)]">
            {providerName}
          </p>
          <p className="mt-0.5 truncate text-sm text-[var(--color-text-secondary)]">
            {serviceName}
          </p>
        </div>
        <StatusBadge status={status} />
      </div>

      <div className="flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
        <CalendarIcon />
        <time dateTime={startTime} suppressHydrationWarning>
          {formatDateTime(startTime)}
        </time>
      </div>

      {showCancel && (
        <div className="flex justify-end">
          <Button
            variant="secondary"
            onClick={onCancel}
            disabled={isCancelling}
            aria-label="Cancel appointment"
          >
            {isCancelling ? "Cancelling…" : "Cancel"}
          </Button>
        </div>
      )}
    </Card>
  );
}

function CalendarIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="shrink-0"
    >
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  );
}
