"use client";

import { useState } from "react";
import { Pill, X, Loader2 } from "lucide-react";
import { isAxiosError } from "axios";
import { createPrescription, type PrescriptionCreate } from "@/lib/api/doctor";

interface PrescriptionModalProps {
  appointmentId: string;
  patientName?: string | null;
  onClose: () => void;
  onSaved: () => void;
}

export default function PrescriptionModal({
  appointmentId,
  patientName,
  onClose,
  onSaved,
}: PrescriptionModalProps) {
  const [medication, setMedication] = useState("");
  const [dosage, setDosage] = useState("");
  const [durationDays, setDurationDays] = useState("7");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit() {
    setError("");
    if (!medication.trim()) {
      setError("Medication is required.");
      return;
    }
    if (!dosage.trim()) {
      setError("Dosage is required.");
      return;
    }
    const days = Number(durationDays);
    if (!Number.isInteger(days) || days <= 0) {
      setError("Duration must be a whole number of days greater than 0.");
      return;
    }

    setLoading(true);
    try {
      const payload: PrescriptionCreate = {
        appointment_id: appointmentId,
        medication: medication.trim(),
        dosage: dosage.trim(),
        duration_days: days,
      };
      await createPrescription(payload);
      onSaved();
      onClose();
    } catch (err) {
      setError(
        isAxiosError(err) && typeof err.response?.data?.detail === "string"
          ? err.response.data.detail
          : "Could not save the prescription. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  const fieldClass =
    "mt-1.5 min-h-11 w-full rounded-xl border border-border bg-bg-secondary px-4 text-sm text-text-primary outline-none transition focus:border-primary focus:bg-white";
  const labelClass = "text-sm font-medium text-text-secondary";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-navy/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary-50 text-primary">
              <Pill size={20} />
            </span>
            <div>
              <h3 className="text-lg font-bold text-text-primary">
                New prescription
              </h3>
              {patientName && (
                <p className="text-sm text-text-muted">For {patientName}</p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="grid h-8 w-8 place-items-center rounded-lg text-text-muted transition hover:bg-bg-muted"
          >
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-danger/30 bg-danger-light px-4 py-3 text-sm font-medium text-danger">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className={labelClass} htmlFor="medication">
              Medication
            </label>
            <input
              id="medication"
              value={medication}
              onChange={(e) => setMedication(e.target.value)}
              placeholder="e.g. Amoxicillin 500mg"
              className={fieldClass}
            />
          </div>

          <div>
            <label className={labelClass} htmlFor="dosage">
              Dosage
            </label>
            <input
              id="dosage"
              value={dosage}
              onChange={(e) => setDosage(e.target.value)}
              placeholder="e.g. 1 tablet, 3 times a day"
              className={fieldClass}
            />
          </div>

          <div>
            <label className={labelClass} htmlFor="duration">
              Duration (days)
            </label>
            <input
              id="duration"
              inputMode="numeric"
              value={durationDays}
              onChange={(e) => setDurationDays(e.target.value)}
              placeholder="e.g. 7"
              className={fieldClass}
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3 border-t border-border-light pt-5">
          <button
            onClick={onClose}
            className="rounded-full border border-border bg-white px-5 py-2.5 text-sm font-semibold text-text-secondary transition hover:bg-bg-muted"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            {loading ? "Saving…" : "Save prescription"}
          </button>
        </div>
      </div>
    </div>
  );
}
