"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Play,
  CheckCircle2,
  UserX,
  XCircle,
  Loader2,
  AlertTriangle,
  CalendarClock,
  Activity,
  History,
  Pill,
  FileText,
} from "lucide-react";
import {
  getDoctorAppointments,
  updateAppointmentStatus,
  type QueueAppointment,
} from "@/lib/api/appointments";
import { getVisitRecord } from "@/lib/api/doctor";
import { useToast } from "@/hooks/use-toast";
import type { AppointmentStatus } from "@/types/api";
import StatusBadge from "@/components/shared/status-badge";
import VisitNotesModal from "@/components/features/doctor/visit-notes-modal";
import PrescriptionModal from "@/components/features/doctor/prescription-modal";

// Mirrors the backend VALID_STATUS_TRANSITIONS map so we only offer actions the
// server accepts. Same set the admin Queue uses.
const ACTIONS: Record<
  AppointmentStatus,
  { label: string; to: AppointmentStatus; icon: typeof Play; tone: string }[]
> = {
  waiting: [
    { label: "Start", to: "in_progress", icon: Play, tone: "primary" },
    { label: "No-show", to: "no_show", icon: UserX, tone: "muted" },
    { label: "Cancel", to: "cancelled", icon: XCircle, tone: "danger" },
  ],
  in_progress: [
    { label: "Complete", to: "completed", icon: CheckCircle2, tone: "success" },
    { label: "No-show", to: "no_show", icon: UserX, tone: "muted" },
    { label: "Cancel", to: "cancelled", icon: XCircle, tone: "danger" },
  ],
  confirmed: [],
  completed: [],
  cancelled: [],
  no_show: [],
};

const TONE_CLASSES: Record<string, string> = {
  primary:
    "border-primary/30 bg-primary-50 text-primary hover:bg-primary hover:text-white",
  success:
    "border-success/30 bg-success-light text-success hover:bg-success hover:text-white",
  danger:
    "border-danger/30 bg-danger-light text-danger hover:bg-danger hover:text-white",
  muted: "border-border bg-white text-text-secondary hover:bg-bg-muted",
};

const PAST_STATUSES: AppointmentStatus[] = ["completed", "cancelled", "no_show"];

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

export default function DoctorAppointmentsPage() {
  const [appointments, setAppointments] = useState<QueueAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null);
  const [hasExistingNotes, setHasExistingNotes] = useState<Record<string, boolean>>({});
  const [prescribeFor, setPrescribeFor] = useState<{
    id: string;
    name: string | null;
  } | null>(null);
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
      .catch(() => {
        if (!cancelled) setError("Could not load appointments.");
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

  async function changeStatus(id: string, status: AppointmentStatus) {
    setPendingId(id);
    setError("");
    try {
      await updateAppointmentStatus(id, status);
      const refreshed = await getDoctorAppointments();
      setAppointments(refreshed);
      checkExistingNotes(refreshed);
      
      if (status === "completed") {
        toast.success("Appointment marked as completed");
      } else if (status === "cancelled") {
        toast.success("Appointment cancelled successfully");
      }
    } catch {
      toast.error("Could not update the appointment.");
      setError("Could not update the appointment.");
    } finally {
      setPendingId(null);
    }
  }

  function handleAddNotes(appointmentId: string) {
    setSelectedAppointmentId(appointmentId);
    setModalOpen(true);
  }

  function handleCloseModal() {
    setModalOpen(false);
    setSelectedAppointmentId(null);
    // Refresh appointments to update notes status
    getDoctorAppointments().then((data) => {
      setAppointments(data);
      checkExistingNotes(data);
    });
  }

  function handlePrescribe(appointmentId: string, patientName: string | null) {
    setPrescribeFor({ id: appointmentId, name: patientName });
  }

  const { upcoming, ongoing, past } = useMemo(() => {
    const byTimeAsc = (a: QueueAppointment, b: QueueAppointment) =>
      a.start_time.localeCompare(b.start_time);
    return {
      // Soonest first.
      upcoming: appointments
        .filter((a) => a.status === "waiting" || a.status === "confirmed")
        .sort(byTimeAsc),
      ongoing: appointments
        .filter((a) => a.status === "in_progress")
        .sort(byTimeAsc),
      // Most recent first.
      past: appointments
        .filter((a) => PAST_STATUSES.includes(a.status))
        .sort((a, b) => b.start_time.localeCompare(a.start_time)),
    };
  }, [appointments]);

  function renderRows(items: QueueAppointment[]) {
    return items.map((appt, idx) => {
      const actions = ACTIONS[appt.status] ?? [];
      const isPending = pendingId === appt.appointment_id;
      const hasNotes = hasExistingNotes[appt.appointment_id];
      
      return (
        <tr
          key={appt.appointment_id}
          className="border-b border-border last:border-0"
        >
          <td className="px-6 py-4 text-text-secondary">{idx + 1}</td>
          <td className="px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-50 text-xs font-bold text-primary">
                {initials(appt.patient_name)}
              </div>
              <span className="font-medium text-text-primary">
                {appt.patient_name ?? "—"}
              </span>
            </div>
          </td>
          <td className="px-6 py-4 text-text-secondary">
            {appt.service_name ?? "—"}
          </td>
          <td className="px-6 py-4 text-text-secondary">{appt.age ?? "—"}</td>
          <td className="px-6 py-4 text-text-secondary">
            {formatDateTime(appt.start_time)}
          </td>
          <td className="px-6 py-4 text-text-secondary">
            {appt.fee != null ? `$${appt.fee}` : "—"}
          </td>
          <td className="px-6 py-4">
            <div className="flex items-center gap-3">
              <StatusBadge status={appt.status} />
              {appt.status === "completed" && (
                <button
                  type="button"
                  onClick={() => handleAddNotes(appt.appointment_id)}
                  className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-primary hover:bg-bg-muted"
                >
                  <FileText size={13} />
                  {hasNotes ? "View Notes" : "Add Notes"}
                </button>
              )}
              {appt.status === "completed" && (
                <button
                  type="button"
                  onClick={() =>
                    handlePrescribe(appt.appointment_id, appt.patient_name)
                  }
                  className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-primary hover:bg-bg-muted"
                >
                  <Pill size={13} />
                  Prescription
                </button>
              )}
              {actions.length > 0 && (
                <div className="flex items-center gap-2">
                  {actions.map((a) => (
                    <button
                      key={a.to}
                      type="button"
                      disabled={isPending}
                      onClick={() => changeStatus(appt.appointment_id, a.to)}
                      className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${TONE_CLASSES[a.tone]}`}
                    >
                      {isPending ? (
                        <Loader2 size={13} className="animate-spin" />
                      ) : (
                        <a.icon size={13} />
                      )}
                      {a.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </td>
        </tr>
      );
    });
  }

  function renderSection({
    title,
    icon,
    accent,
    items,
    emptyText,
  }: {
    title: string;
    icon: React.ReactNode;
    accent: string;
    items: QueueAppointment[];
    emptyText: string;
  }) {
    return (
      <section className="overflow-hidden rounded-2xl border border-border bg-white">
        <div className="flex items-center gap-2 border-b border-border px-6 py-4">
          <span className={`grid h-7 w-7 place-items-center rounded-lg ${accent}`}>
            {icon}
          </span>
          <h2 className="font-semibold text-text-primary">{title}</h2>
          <span className="ml-1 rounded-full bg-bg-muted px-2 py-0.5 text-xs font-semibold text-text-secondary">
            {items.length}
          </span>
        </div>

        {items.length === 0 ? (
          <p className="px-6 py-8 text-center text-sm text-text-muted">
            {emptyText}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[960px] text-left text-sm">
              <thead className="border-b border-border text-text-muted">
                <tr>
                  <th className="px-6 py-3 font-semibold">#</th>
                  <th className="px-6 py-3 font-semibold">Patient</th>
                  <th className="px-6 py-3 font-semibold">Service</th>
                  <th className="px-6 py-3 font-semibold">Age</th>
                  <th className="px-6 py-3 font-semibold">Date &amp; Time</th>
                  <th className="px-6 py-3 font-semibold">Fees</th>
                  <th className="px-6 py-3 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>{renderRows(items)}</tbody>
            </table>
          </div>
        )}
      </section>
    );
  }

  return (
    <div className="min-h-screen space-y-6">
      <h1 className="text-3xl font-bold text-text-primary">My Appointments</h1>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-danger/30 bg-danger-light px-4 py-3 text-sm font-medium text-danger">
          <AlertTriangle size={16} />
          {error}
        </div>
      )}

      {loading ? (
        <div className="rounded-2xl border border-border bg-white px-6 py-12 text-center text-text-muted">
          Loading appointments…
        </div>
      ) : (
        <>
          {renderSection({
            title: "Ongoing",
            icon: <Activity size={15} className="text-purple" />,
            accent: "bg-purple-light",
            items: ongoing,
            emptyText: "No appointment in progress right now.",
          })}
          {renderSection({
            title: "Upcoming",
            icon: <CalendarClock size={15} className="text-primary" />,
            accent: "bg-primary-50",
            items: upcoming,
            emptyText: "No upcoming appointments.",
          })}
          {renderSection({
            title: "Past",
            icon: <History size={15} className="text-text-muted" />,
            accent: "bg-bg-muted",
            items: past,
            emptyText: "No past appointments yet.",
          })}
        </>
      )}

      {selectedAppointmentId && (
        <VisitNotesModal
          isOpen={modalOpen}
          onClose={handleCloseModal}
          appointmentId={selectedAppointmentId}
          isReadOnly={hasExistingNotes[selectedAppointmentId] || false}
        />
      )}

      {prescribeFor && (
        <PrescriptionModal
          appointmentId={prescribeFor.id}
          patientName={prescribeFor.name}
          onClose={() => setPrescribeFor(null)}
          onSaved={() => toast.success("Prescription saved successfully")}
        />
      )}
    </div>
  );
}