"use client";

import { useEffect, useMemo, useState } from "react";
import { isAxiosError } from "axios";
import {
  Layers,
  Search,
  Plus,
  Pencil,
  Trash2,
  Clock,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  X,
} from "lucide-react";

import {
  getServices,
  createService,
  updateService,
  deleteService,
} from "@/lib/api/services";
import type {
  Service,
  ServiceCreatePayload,
  ServiceUpdatePayload,
} from "@/types/api";
import Skeleton from "@/components/ui/skeleton";
import Select from "@/components/ui/select";

type Toast = { type: "success" | "error"; message: string } | null;

const TABLE_HEADERS = ["#", "Service", "Department", "Duration", "Actions"];

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState<Toast>(null);

  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");

  // `null` = closed; an object = open. A service with id 0 is treated as "new".
  const [editing, setEditing] = useState<Service | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<Service | null>(null);

  async function load() {
    setIsLoading(true);
    setError("");
    try {
      const data = await getServices();
      setServices(data);
    } catch {
      setError("Could not load services. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await getServices();
        if (!cancelled) setServices(data);
      } catch {
        if (!cancelled) setError("Could not load services. Please try again.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  const departments = useMemo(
    () => [...new Set(services.map((s) => s.department))].sort(),
    [services],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return services.filter((s) => {
      const matchesSearch =
        !q ||
        s.name.toLowerCase().includes(q) ||
        s.department.toLowerCase().includes(q);
      const matchesDept =
        departmentFilter === "all" || s.department === departmentFilter;
      return matchesSearch && matchesDept;
    });
  }, [services, search, departmentFilter]);

  function handleCreated(created: Service) {
    setServices((prev) =>
      [...prev, created].sort((a, b) => a.name.localeCompare(b.name)),
    );
    setCreating(false);
    setToast({ type: "success", message: "Service created successfully." });
  }

  function handleUpdated(updated: Service) {
    setServices((prev) =>
      prev
        .map((s) => (s.id === updated.id ? updated : s))
        .sort((a, b) => a.name.localeCompare(b.name)),
    );
    setEditing(null);
    setToast({ type: "success", message: "Service updated successfully." });
  }

  async function handleDelete() {
    if (!deleting) return;
    const target = deleting;
    try {
      await deleteService(target.id);
      setServices((prev) => prev.filter((s) => s.id !== target.id));
      setToast({ type: "success", message: `“${target.name}” was deleted.` });
    } catch (err) {
      setToast({
        type: "error",
        message:
          isAxiosError(err) && err.response?.status === 409
            ? "This service is in use by appointments and can't be deleted."
            : "Could not delete this service.",
      });
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Admin</p>
          <h1 className="mt-1 text-3xl font-bold text-text-primary">Services</h1>
          <p className="mt-1 text-sm text-text-muted">
            {isLoading
              ? "Loading services…"
              : `${services.length} service${services.length === 1 ? "" : "s"}`}
          </p>
        </div>

        <button
          onClick={() => setCreating(true)}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-600"
        >
          <Plus size={16} />
          Add service
        </button>
      </div>

      {/* Toast */}
      {toast && (
        <div
          className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium ${
            toast.type === "success"
              ? "border-success/30 bg-success-light text-success"
              : "border-danger/30 bg-danger-light text-danger"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle2 size={16} />
          ) : (
            <AlertTriangle size={16} />
          )}
          {toast.message}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search
            size={16}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-text-muted"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or department…"
            className="min-h-11 w-full rounded-xl border border-border bg-bg-primary pl-11 pr-4 text-sm text-text-primary outline-none transition focus:border-primary"
          />
        </div>
        <Select
          className="w-full sm:w-56"
          ariaLabel="Filter by department"
          icon={<Layers size={15} />}
          value={departmentFilter}
          onChange={(v) => setDepartmentFilter(v)}
          options={[
            { value: "all", label: "All departments" },
            ...departments.map((d) => ({ value: d, label: d })),
          ]}
        />
      </div>

      {/* Content */}
      {isLoading ? (
        <Skeleton className="h-72" />
      ) : error ? (
        <div className="rounded-2xl border border-danger/30 bg-danger-light px-4 py-8 text-center">
          <p className="text-sm font-medium text-danger">{error}</p>
          <button
            onClick={load}
            className="mt-3 rounded-full border border-border bg-white px-4 py-2 text-sm font-semibold text-text-secondary transition hover:bg-bg-muted"
          >
            Retry
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-border bg-bg-primary px-4 py-16 text-center">
          <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-bg-muted text-text-muted">
            <Layers size={22} />
          </div>
          <p className="font-semibold text-text-primary">No services found</p>
          <p className="mt-1 text-sm text-text-muted">
            {services.length === 0
              ? "Create your first service to get started."
              : "Try adjusting your search or filter."}
          </p>
        </div>
      ) : (
        <section className="overflow-hidden rounded-2xl border border-border bg-bg-primary shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] border-collapse text-left text-sm">
              <thead className="border-b border-border bg-bg-muted/60 text-xs uppercase text-text-muted">
                <tr>
                  {TABLE_HEADERS.map((h) => (
                    <th key={h} className="px-4 py-3 font-semibold">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((service, index) => (
                  <tr
                    key={service.id}
                    className="border-t border-border-light transition-colors hover:bg-bg-muted/40"
                  >
                    <td className="px-4 py-4 font-medium text-text-secondary">
                      {index + 1}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <span className="grid h-9 w-9 flex-none place-items-center rounded-xl bg-primary-50 text-primary">
                          <Layers size={16} />
                        </span>
                        <span className="font-medium text-text-primary">
                          {service.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="inline-flex items-center rounded-full bg-bg-muted px-3 py-1 text-xs font-semibold text-text-secondary">
                        {service.department}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="inline-flex items-center gap-1.5 text-text-secondary">
                        <Clock size={14} className="text-text-muted" />
                        {formatDuration(service.duration_minutes)}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setEditing(service)}
                          aria-label={`Edit ${service.name}`}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-white text-text-secondary transition hover:bg-bg-muted hover:text-primary"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => setDeleting(service)}
                          aria-label={`Delete ${service.name}`}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-danger/30 bg-danger-light text-danger transition hover:bg-danger hover:text-white"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Create / Edit modal */}
      {(creating || editing) && (
        <ServiceModal
          service={editing}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
          onCreated={handleCreated}
          onUpdated={handleUpdated}
        />
      )}

      {/* Delete confirmation */}
      {deleting && (
        <ConfirmDelete
          service={deleting}
          onCancel={() => setDeleting(null)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}

/* -------------------------------------------------------------- Modal */

function ServiceModal({
  service,
  onClose,
  onCreated,
  onUpdated,
}: {
  service: Service | null;
  onClose: () => void;
  onCreated: (s: Service) => void;
  onUpdated: (s: Service) => void;
}) {
  const isEdit = service != null;
  const [name, setName] = useState(service?.name ?? "");
  const [department, setDepartment] = useState(service?.department ?? "");
  const [duration, setDuration] = useState(
    service ? String(service.duration_minutes) : "30",
  );
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState("");

  async function handleSubmit() {
    setFormError("");
    if (!name.trim()) {
      setFormError("Service name is required.");
      return;
    }
    if (!department.trim()) {
      setFormError("Department is required.");
      return;
    }
    const minutes = Number(duration);
    if (!duration.trim() || !Number.isInteger(minutes) || minutes <= 0) {
      setFormError("Duration must be a whole number of minutes greater than 0.");
      return;
    }

    setIsSaving(true);
    try {
      if (isEdit && service) {
        const payload: ServiceUpdatePayload = {
          name: name.trim(),
          department: department.trim(),
          duration_minutes: minutes,
        };
        onUpdated(await updateService(service.id, payload));
      } else {
        const payload: ServiceCreatePayload = {
          name: name.trim(),
          department: department.trim(),
          duration_minutes: minutes,
        };
        onCreated(await createService(payload));
      }
    } catch (err) {
      setFormError(
        isAxiosError(err) && err.response?.status === 409
          ? "A service with this name already exists."
          : "Could not save the service. Please try again.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  const fieldClass =
    "mt-2 min-h-11 w-full rounded-xl border border-border bg-bg-secondary px-4 text-sm text-text-primary outline-none transition focus:border-primary focus:bg-white";
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
          <h3 className="text-lg font-bold text-text-primary">
            {isEdit ? "Edit service" : "Add service"}
          </h3>
          <button
            onClick={onClose}
            aria-label="Close"
            className="grid h-8 w-8 place-items-center rounded-lg text-text-muted transition hover:bg-bg-muted"
          >
            <X size={18} />
          </button>
        </div>

        {formError && (
          <div className="mb-4 rounded-xl border border-danger/30 bg-danger-light px-4 py-3 text-sm font-medium text-danger">
            {formError}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className={labelClass} htmlFor="svc-name">
              Service name
            </label>
            <input
              id="svc-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. General Consultation"
              className={fieldClass}
            />
          </div>

          <div>
            <label className={labelClass} htmlFor="svc-department">
              Department
            </label>
            <input
              id="svc-department"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              placeholder="e.g. Cardiology"
              className={fieldClass}
            />
            <p className="mt-1 text-xs text-text-muted">
              Doctors are matched to patients by this department.
            </p>
          </div>

          <div>
            <label className={labelClass} htmlFor="svc-duration">
              Duration (minutes)
            </label>
            <input
              id="svc-duration"
              inputMode="numeric"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="e.g. 30"
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
            disabled={isSaving}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSaving && <Loader2 size={16} className="animate-spin" />}
            {isSaving ? "Saving…" : isEdit ? "Save changes" : "Create service"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------- Confirm dialog */

function ConfirmDelete({
  service,
  onCancel,
  onConfirm,
}: {
  service: Service;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const [working, setWorking] = useState(false);
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-navy/40 p-4"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 grid h-12 w-12 place-items-center rounded-full bg-danger-light text-danger">
          <Trash2 size={22} />
        </div>
        <h3 className="text-lg font-bold text-text-primary">Delete service?</h3>
        <p className="mt-1 text-sm text-text-secondary">
          “{service.name}” will be permanently removed. Services already used by
          appointments can’t be deleted.
        </p>
        <div className="mt-6 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 rounded-full border border-border bg-white py-2.5 text-sm font-semibold text-text-secondary transition hover:bg-bg-muted"
          >
            Cancel
          </button>
          <button
            disabled={working}
            onClick={() => {
              setWorking(true);
              onConfirm();
            }}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-danger py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-70"
          >
            {working && <Loader2 size={16} className="animate-spin" />}
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
