"use client";

import { useEffect, useState } from "react";
import { getDoctorAppointments, updateAppointmentStatus, type QueueAppointment } from "@/lib/api/appointments";
import { getVisitRecord } from "@/lib/api/doctor";
import { useToast } from "@/hooks/use-toast";
import VisitNotesModal from "@/components/features/doctor/visit-notes-modal";

export default function DoctorAppointmentsPage() {
  const [appointments, setAppointments] = useState<QueueAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null);
  const [hasExistingNotes, setHasExistingNotes] = useState<Record<string, boolean>>({});
  const toast = useToast();

  useEffect(() => {
    let cancelled = false;
    getDoctorAppointments()
      .then((data) => {
        if (!cancelled) {
          setAppointments(data);
          // Check which appointments have existing notes
          checkExistingNotes(data);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function checkExistingNotes(appts: QueueAppointment[]) {
    const completedAppts = appts.filter(a => a.status === "completed");
    const notesStatus: Record<string, boolean> = {};
    
    await Promise.all(
      completedAppts.map(async (appt) => {
        try {
          await getVisitRecord(appt.appointment_id);
          notesStatus[appt.appointment_id] = true;
        } catch {
          notesStatus[appt.appointment_id] = false;
        }
      })
    );
    
    setHasExistingNotes(notesStatus);
  }

  async function handleStatusUpdate(id: string, status: "completed" | "cancelled") {
    try {
      await updateAppointmentStatus(id, status);
      const refreshed = await getDoctorAppointments();
      setAppointments(refreshed);
      
      if (status === "completed") {
        toast.success("Appointment marked as completed");
      } else if (status === "cancelled") {
        toast.success("Appointment cancelled successfully");
      }
    } catch (error) {
      toast.error("Failed to update appointment status");
      console.error(error);
    }
  }

  function handleAddNotes(appointmentId: string) {
    setSelectedAppointmentId(appointmentId);
    setModalOpen(true);
  }

  function handleCloseModal() {
    setModalOpen(false);
    setSelectedAppointmentId(null);
    // Refresh appointments to update status
    getDoctorAppointments().then(setAppointments);
  }

  function formatDateTime(iso: string) {
    const d = new Date(iso);
    return d.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function initials(name: string | null) {
    if (!name) return "?";
    return name
      .split(" ")
      .map((p) => p[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  }

  return (
    <div className="min-h-screen">
      <h1 className="text-3xl font-bold text-[var(--color-text-primary)]">All Appointments</h1>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-[var(--color-border)] bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-[var(--color-border)] text-[var(--color-text-muted)]">
            <tr>
              <th className="px-6 py-4 font-semibold">#</th>
              <th className="px-6 py-4 font-semibold">Patient</th>
              <th className="px-6 py-4 font-semibold">Payment</th>
              <th className="px-6 py-4 font-semibold">Age</th>
              <th className="px-6 py-4 font-semibold">Date &amp; Time</th>
              <th className="px-6 py-4 font-semibold">Fees</th>
              <th className="px-6 py-4 font-semibold">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-[var(--color-text-muted)]">
                  Loading appointments…
                </td>
              </tr>
            ) : appointments.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-[var(--color-text-muted)]">
                  No appointments found.
                </td>
              </tr>
            ) : (
              appointments.map((appt, idx) => (
                <tr key={appt.appointment_id} className="border-b border-[var(--color-border)] last:border-0">
                  <td className="px-6 py-4 text-[var(--color-text-secondary)]">{idx + 1}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary-50)] text-xs font-bold text-[var(--color-primary)]">
                        {initials(appt.patient_name)}
                      </div>
                      <span className="font-medium text-[var(--color-text-primary)]">
                        {appt.patient_name ?? "—"}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {appt.payment_method ? (
                      <span className="inline-flex items-center rounded-full border border-[var(--color-border)] px-3 py-1 text-xs font-semibold uppercase text-[var(--color-text-secondary)]">
                        {appt.payment_method}
                      </span>
                    ) : (
                      <span className="text-[var(--color-text-muted)]">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-[var(--color-text-secondary)]">
                    {appt.age ?? "—"}
                  </td>
                  <td className="px-6 py-4 text-[var(--color-text-secondary)]">
                    {formatDateTime(appt.start_time)}
                  </td>
                  <td className="px-6 py-4 text-[var(--color-text-secondary)]">
                    {appt.fee != null ? `€${appt.fee}` : "—"}
                  </td>
                  <td className="px-6 py-4">
                    {appt.status === "completed" ? (
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-[var(--color-success)]">Completed</span>
                        <button
                          type="button"
                          onClick={() => handleAddNotes(appt.appointment_id)}
                          className="ml-2 rounded-lg border border-[var(--color-border)] px-3 py-1 text-xs font-medium text-[var(--color-primary)] hover:bg-[var(--color-bg-muted)]"
                        >
                          {hasExistingNotes[appt.appointment_id] ? "View Notes" : "Add Notes"}
                        </button>
                      </div>
                    ) : appt.status === "cancelled" ? (
                      <span className="font-semibold text-[var(--color-danger)]">Cancelled</span>
                    ) : (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          aria-label="Mark completed"
                          onClick={() => handleStatusUpdate(appt.appointment_id, "completed")}
                          className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--color-border)] text-[var(--color-success)] hover:bg-[var(--color-bg-muted)]"
                        >
                          ✓
                        </button>
                        <button
                          type="button"
                          aria-label="Cancel appointment"
                          onClick={() => handleStatusUpdate(appt.appointment_id, "cancelled")}
                          className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--color-border)] text-[var(--color-danger)] hover:bg-[var(--color-bg-muted)]"
                        >
                          ✕
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {selectedAppointmentId && (
        <VisitNotesModal
          isOpen={modalOpen}
          onClose={handleCloseModal}
          appointmentId={selectedAppointmentId}
          isReadOnly={hasExistingNotes[selectedAppointmentId] || false}
        />
      )}
    </div>
  );
}