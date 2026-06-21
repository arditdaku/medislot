'use client';

import { useState, useEffect } from 'react';
import { createVisitRecord, getVisitRecord, type VisitRecordCreate, type VisitRecordResponse } from '@/lib/api/doctor';
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
  const toast = useToast();

  // Fetch existing notes when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchExistingNotes();
    }
  }, [isOpen, appointmentId]);

  async function fetchExistingNotes() {
    try {
      const record = await getVisitRecord(appointmentId);
      setExistingRecord(record);
      setNotes(record.notes);
    } catch (error) {
      // 404 means no record exists yet
      setExistingRecord(null);
      setNotes('');
    }
  }

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