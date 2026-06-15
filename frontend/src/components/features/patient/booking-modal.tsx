"use client";

import { ArrowRight, Calendar, Clock, Heart, User } from "lucide-react";

export type BookingReview = {
  service: { name: string; department: string };
  doctor: { name: string; specialty: string };
  date: string;
  time: string;
  durationMinutes: number;
  patient: { name: string; email: string };
  /** Hardcoded until `services.price` exists in the schema. */
  fee: number;
};

type BookingModalProps = BookingReview & {
  submitting: boolean;
  error?: string | null;
  onBackToEdit: () => void;
  onConfirm: () => void;
};

function initials(name: string): string {
  const parts = name.replace(/^Dr\.?\s*/i, "").trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "?";
}

function Row({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-4">
      <span className="grid h-10 w-10 flex-none place-items-center rounded-xl bg-[var(--color-primary-50)] text-[var(--color-primary)]">
        {icon}
      </span>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">{label}</p>
        {children}
      </div>
    </div>
  );
}

export default function BookingModal({
  service,
  doctor,
  date,
  time,
  durationMinutes,
  patient,
  fee,
  submitting,
  error,
  onBackToEdit,
  onConfirm,
}: BookingModalProps) {
  return (
    <div>
      <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">Review &amp; confirm</h2>
      <p className="mt-1 text-sm text-[var(--color-text-muted)]">
        Double-check the details below before confirming.
      </p>

      <div className="mt-6 rounded-2xl border border-[var(--color-border)] bg-white p-6 shadow-sm">
        <div className="space-y-5">
          <Row icon={<Heart size={18} />} label="Service">
            <p className="font-semibold text-[var(--color-text-primary)]">{service.name}</p>
            <p className="text-sm text-[var(--color-text-secondary)]">{service.department}</p>
          </Row>

          <Row icon={<span className="text-xs font-bold">{initials(doctor.name)}</span>} label="Doctor">
            <p className="font-semibold text-[var(--color-text-primary)]">{doctor.name}</p>
            <p className="text-sm text-[var(--color-text-secondary)]">{doctor.specialty}</p>
          </Row>

          <Row icon={<Calendar size={18} />} label="Date">
            <p className="font-semibold text-[var(--color-text-primary)]">{date}</p>
          </Row>

          <Row icon={<Clock size={18} />} label="Time">
            <p className="font-semibold text-[var(--color-text-primary)]">
              {time} ({durationMinutes} min)
            </p>
          </Row>

          <hr className="border-dashed border-[var(--color-border)]" />

          <Row icon={<User size={18} />} label="Patient">
            <p className="font-semibold text-[var(--color-text-primary)]">{patient.name}</p>
            <p className="text-sm text-[var(--color-text-secondary)]">{patient.email}</p>
          </Row>

          <div className="flex items-end justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">Status</p>
              <p className="font-semibold text-[var(--color-text-primary)]">Will be confirmed</p>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-warning-light)] px-3 py-1 text-xs font-semibold text-[var(--color-warning)]">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-warning)]" />
              Pending
            </span>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">Consultation fee</p>
            <p className="text-xl font-bold text-[var(--color-text-primary)]">${fee}</p>
          </div>
        </div>

        <p className="mt-6 text-xs text-[var(--color-text-muted)]">
          Free cancellation up to 24 hours before your appointment. By confirming, you agree to MediSlot&apos;s
          clinic policies.
        </p>
      </div>

      {error && (
        <p className="mt-4 rounded-xl border border-[var(--color-danger-light)] bg-[var(--color-danger-light)] px-4 py-3 text-sm font-medium text-[var(--color-danger)]">
          {error}
        </p>
      )}

      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={onBackToEdit}
          disabled={submitting}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-[var(--color-border)] bg-white px-5 py-2.5 text-sm font-semibold text-[var(--color-text-secondary)] transition hover:bg-[var(--color-bg-muted)] disabled:opacity-50"
        >
          Back to Edit
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={submitting}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[var(--color-primary)] px-6 py-2.5 text-sm font-semibold text-[var(--color-white)] transition hover:bg-[var(--color-primary-600)] disabled:opacity-60"
        >
          {submitting ? "Confirming…" : "Confirm Booking"}
          {!submitting && <ArrowRight size={16} />}
        </button>
      </div>
    </div>
  );
}
