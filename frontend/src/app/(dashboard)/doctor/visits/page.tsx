"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ClipboardList,
  Loader2,
  Search,
  FileText,
} from "lucide-react";
import { getDoctorVisits, type DoctorVisit } from "@/lib/api/doctor";
import VisitNotesModal from "@/components/features/doctor/visit-notes-modal";

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

function notesPreview(notes: string, max = 120) {
  const trimmed = notes.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max)}…`;
}

function initials(name: string | null) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function DoctorVisitsPage() {
  const [visits, setVisits] = useState<DoctorVisit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<
    string | null
  >(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");

    getDoctorVisits(search.trim() || undefined)
      .then((data) => {
        if (!cancelled) setVisits(data);
      })
      .catch(() => {
        if (!cancelled) setError("Could not load visit records.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [search]);

  const visitCountLabel = useMemo(() => {
    if (loading) return "Loading…";
    return `${visits.length} record${visits.length === 1 ? "" : "s"}`;
  }, [loading, visits.length]);

  function openVisit(appointmentId: string) {
    setSelectedAppointmentId(appointmentId);
  }

  function closeModal() {
    setSelectedAppointmentId(null);
  }

  return (
    <div className="min-h-screen space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Visit Records</h1>
          <p className="mt-1 text-sm text-text-muted">
            Review all documented visits in one place.
          </p>
        </div>

        <label className="relative block w-full sm:max-w-xs">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
          />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by patient name"
            className="w-full rounded-xl border border-border bg-white py-2.5 pl-9 pr-3 text-sm text-text-primary outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </label>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-danger/30 bg-danger-light px-4 py-3 text-sm font-medium text-danger">
          <AlertTriangle size={16} />
          {error}
        </div>
      )}

      <section className="overflow-hidden rounded-2xl border border-border bg-white">
        <div className="flex items-center gap-2 border-b border-border px-6 py-4">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-primary-50">
            <ClipboardList size={15} className="text-primary" />
          </span>
          <h2 className="font-semibold text-text-primary">Documented visits</h2>
          <span className="ml-1 rounded-full bg-bg-muted px-2 py-0.5 text-xs font-semibold text-text-secondary">
            {visitCountLabel}
          </span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 px-6 py-12 text-text-muted">
            <Loader2 size={18} className="animate-spin" />
            Loading visit records…
          </div>
        ) : visits.length === 0 ? (
          <p className="px-6 py-12 text-center text-sm text-text-muted">
            {search.trim()
              ? "No visit records match that patient name."
              : "No visit records yet. Add notes from a completed appointment."}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[880px] text-left text-sm">
              <thead className="border-b border-border text-text-muted">
                <tr>
                  <th className="px-6 py-3 font-semibold">Patient</th>
                  <th className="px-6 py-3 font-semibold">Date &amp; Time</th>
                  <th className="px-6 py-3 font-semibold">Service</th>
                  <th className="px-6 py-3 font-semibold">Notes preview</th>
                  <th className="px-6 py-3 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {visits.map((visit) => (
                  <tr
                    key={visit.id}
                    className="border-b border-border last:border-0"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-50 text-xs font-bold text-primary">
                          {initials(visit.patient_name)}
                        </div>
                        <span className="font-medium text-text-primary">
                          {visit.patient_name ?? "—"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-text-secondary">
                      {formatDateTime(visit.appointment_date)}
                    </td>
                    <td className="px-6 py-4 text-text-secondary">
                      {visit.service_name ?? "—"}
                    </td>
                    <td className="max-w-md px-6 py-4 text-text-secondary">
                      <p className="line-clamp-2">{notesPreview(visit.notes)}</p>
                      {visit.ai_summary && (
                        <p className="mt-1 text-xs text-text-muted">
                          AI summary available
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        type="button"
                        onClick={() => openVisit(visit.appointment_id)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-primary hover:bg-bg-muted"
                      >
                        <FileText size={13} />
                        View notes
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {selectedAppointmentId && (
        <VisitNotesModal
          isOpen={Boolean(selectedAppointmentId)}
          onClose={closeModal}
          appointmentId={selectedAppointmentId}
          isReadOnly
        />
      )}
    </div>
  );
}