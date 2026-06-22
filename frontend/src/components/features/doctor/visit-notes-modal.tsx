'use client';

import { useState, useEffect } from 'react';
import {
  createVisitRecord,
  getVisitRecord,
  getAppointmentPrescriptions,
  type VisitRecordCreate,
  type VisitRecordResponse,
  type PrescriptionResponse,
} from '@/lib/api/doctor';
import { useToast } from '@/hooks/use-toast';

interface VisitNotesModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointmentId: string;
  isReadOnly?: boolean;
}

export default function VisitNotesModal({
  isOpen,
  onClose,
  appointmentId,
  isReadOnly = false,
}: VisitNotesModalProps) {
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [existingRecord, setExistingRecord] = useState<VisitRecordResponse | null>(null);
  const [prescriptions, setPrescriptions] = useState<PrescriptionResponse[]>([]);
  const toast = useToast();

  // Load existing notes + the prescriptions given to this patient on open.
  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    (async () => {
      try {
        const record = await getVisitRecord(appointmentId);
        if (!cancelled) {
          setExistingRecord(record);
          setNotes(record.notes);
        }
      } catch {
        // 404 means no record exists yet
        if (!cancelled) {
          setExistingRecord(null);
          setNotes('');
        }
      }
      try {
        const pres = await getAppointmentPrescriptions(appointmentId);
        if (!cancelled) setPrescriptions(pres);
      } catch {
        if (!cancelled) setPrescriptions([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isOpen, appointmentId]);

  async function handleSubmit() {
    if (!notes.trim()) {
      toast.error('Please enter some notes');
      return;
    }

    setLoading(true);
    try {
      const payload: VisitRecordCreate = {
        appointment_id: appointmentId,
        notes: notes.trim(),
      };

      await createVisitRecord(payload);
      toast.success('Visit notes saved successfully');
      onClose();
    } catch (error) {
      toast.error('Failed to save visit notes');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">
            {isReadOnly || existingRecord ? 'View Visit Notes' : 'Add Visit Notes'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        <div className="mb-6">
          <label htmlFor="notes" className="mb-2 block text-sm font-medium text-gray-700">
            Notes
          </label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            readOnly={isReadOnly}
            rows={8}
            className={`w-full rounded-lg border border-gray-300 p-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 ${
              isReadOnly ? 'bg-gray-50 text-gray-600' : 'bg-white'
            }`}
            placeholder="Enter visit notes..."
          />
        </div>

        {prescriptions.length > 0 && (
          <div className="mb-6">
            <h3 className="mb-2 text-sm font-medium text-gray-700">
              Prescriptions you gave this patient
            </h3>
            <ul className="space-y-2">
              {prescriptions.map((p) => (
                <li
                  key={p.id}
                  className="flex items-start gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3"
                >
                  <span className="mt-0.5 text-blue-600">℞</span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900">
                      {p.medication}
                    </p>
                    <p className="text-xs text-gray-600">
                      {p.dosage} · {p.duration_days} day
                      {p.duration_days === 1 ? '' : 's'}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {!isReadOnly && (
          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Notes'}
            </button>
          </div>
        )}

        {isReadOnly && (
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}