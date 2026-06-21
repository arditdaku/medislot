import type { AppointmentStatus } from "@/types/api";

/**
 * Pill-shaped, color-coded status indicator for an appointment.
 * Colors are driven entirely by brand tokens defined in globals.css.
 */

type StatusStyle = { label: string; className: string };

const STATUS_STYLES: Record<AppointmentStatus, StatusStyle> = {
  // confirmed → blue (brand primary)
  confirmed: {
    label: "Confirmed",
    className: "bg-[var(--color-primary-50)] text-[var(--color-primary-700)]",
  },
  // cancelled → red (brand danger)
  cancelled: {
    label: "Cancelled",
    className: "bg-[var(--color-danger-light)] text-[var(--color-danger)]",
  },
  // completed → green (brand success)
  completed: {
    label: "Completed",
    className: "bg-[var(--color-success-light)] text-[var(--color-success)]",
  },
  // waiting → yellow (brand warning)
  waiting: {
    label: "Waiting",
    className: "bg-[var(--color-warning-light)] text-[var(--color-warning)]",
  },
  // in_progress → purple (brand purple)
  in_progress: {
    label: "In progress",
    className: "bg-[var(--color-purple-light)] text-[var(--color-purple)]",
  },
  // no_show → neutral (not in the spec's color list, sane fallback)
  no_show: {
    label: "No show",
    className: "bg-[var(--color-bg-muted)] text-[var(--color-text-muted)]",
  },
};

type StatusBadgeProps = {
  status: AppointmentStatus;
  className?: string;
};

export default function StatusBadge({ status, className = "" }: StatusBadgeProps) {
  const style = STATUS_STYLES[status] ?? STATUS_STYLES.no_show;

  return (
    <span
      className={`inline-flex shrink-0 items-center whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${style.className} ${className}`}
    >
      {style.label}
    </span>
  );
}
