"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { isAxiosError } from "axios";
import {
  UserPlus,
  Search,
  Stethoscope,
  MapPin,
  Award,
  Pencil,
  Trash2,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  X,
} from "lucide-react";

import {
  getProviders,
  updateProvider,
  deleteProvider,
} from "@/lib/api/providers";
import type { Provider, ProviderUpdatePayload } from "@/types/api";
import Skeleton from "@/components/ui/skeleton";
import Select from "@/components/ui/select";

type Toast = { type: "success" | "error"; message: string } | null;

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "Dr";
}

export default function ProvidersPage() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState<Toast>(null);

  const [search, setSearch] = useState("");
  const [specialtyFilter, setSpecialtyFilter] = useState("all");

  const [editing, setEditing] = useState<Provider | null>(null);
  const [deleting, setDeleting] = useState<Provider | null>(null);

  async function load() {
    setIsLoading(true);
    setError("");
    try {
      const data = await getProviders();
      setProviders(data);
    } catch {
      setError("Could not load providers. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await getProviders();
        if (!cancelled) setProviders(data);
      } catch {
        if (!cancelled) setError("Could not load providers. Please try again.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Auto-dismiss toasts.
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  const specialties = useMemo(
    () => [...new Set(providers.map((p) => p.specialty))].sort(),
    [providers],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return providers.filter((p) => {
      const matchesSearch =
        !q ||
        p.full_name.toLowerCase().includes(q) ||
        p.specialty.toLowerCase().includes(q);
      const matchesSpecialty =
        specialtyFilter === "all" || p.specialty === specialtyFilter;
      return matchesSearch && matchesSpecialty;
    });
  }, [providers, search, specialtyFilter]);

  function handleSaved(updated: Provider) {
    setProviders((prev) =>
      prev.map((p) => (p.id === updated.id ? updated : p)),
    );
    setEditing(null);
    setToast({ type: "success", message: "Provider updated successfully." });
  }

  async function handleDelete() {
    if (!deleting) return;
    const target = deleting;
    try {
      await deleteProvider(target.id);
      setProviders((prev) => prev.filter((p) => p.id !== target.id));
      setToast({
        type: "success",
        message: `${target.full_name} was deleted.`,
      });
    } catch (err) {
      // Surface the backend reason (e.g. the doctor has appointments on
      // record) instead of a generic message.
      const detail =
        isAxiosError(err) && typeof err.response?.data?.detail === "string"
          ? err.response.data.detail
          : "Could not delete this provider.";
      setToast({ type: "error", message: detail });
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
          <h1 className="mt-1 text-3xl font-bold text-text-primary">Providers</h1>
          <p className="mt-1 text-sm text-text-muted">
            {isLoading
              ? "Loading doctors…"
              : `${providers.length} active doctor${providers.length === 1 ? "" : "s"}`}
          </p>
        </div>

        <Link
          href="/staff/providers/new"
          className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-600"
        >
          <UserPlus size={16} />
          Add Doctor
        </Link>
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
            placeholder="Search by name or specialty…"
            className="min-h-11 w-full rounded-xl border border-border bg-bg-primary pl-11 pr-4 text-sm text-text-primary outline-none transition focus:border-primary"
          />
        </div>
        <Select
          className="w-full sm:w-56"
          ariaLabel="Filter by specialty"
          icon={<Stethoscope size={15} />}
          value={specialtyFilter}
          onChange={(v) => setSpecialtyFilter(v)}
          options={[
            { value: "all", label: "All specialties" },
            ...specialties.map((s) => ({ value: s, label: s })),
          ]}
        />
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-56" />
          ))}
        </div>
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
            <Stethoscope size={22} />
          </div>
          <p className="font-semibold text-text-primary">No providers found</p>
          <p className="mt-1 text-sm text-text-muted">
            {providers.length === 0
              ? "Add your first doctor to get started."
              : "Try adjusting your search or filter."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((p) => (
            <ProviderCard
              key={p.id}
              provider={p}
              onEdit={() => setEditing(p)}
              onDelete={() => setDeleting(p)}
            />
          ))}
        </div>
      )}

      {/* Edit modal */}
      {editing && (
        <EditProviderModal
          provider={editing}
          onClose={() => setEditing(null)}
          onSaved={handleSaved}
        />
      )}

      {/* Delete confirmation */}
      {deleting && (
        <ConfirmDelete
          provider={deleting}
          onCancel={() => setDeleting(null)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}

/* ---------------------------------------------------------------- Card */

function ProviderCard({
  provider,
  onEdit,
  onDelete,
}: {
  provider: Provider;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex flex-col rounded-2xl border border-border bg-bg-primary p-5 shadow-sm transition hover:shadow-md">
      <div className="flex items-start gap-4">
        <span className="grid h-14 w-14 flex-none place-items-center rounded-2xl bg-primary-50 text-base font-bold text-primary">
          {initials(provider.full_name)}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-semibold text-text-primary">
            {provider.full_name}
          </h3>
          <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-primary-50 px-2.5 py-0.5 text-xs font-semibold text-primary">
            <Stethoscope size={12} />
            {provider.specialty}
          </span>
        </div>
      </div>

      <dl className="mt-4 space-y-2 text-sm">
        <div className="flex items-center gap-2 text-text-secondary">
          <span className="w-[15px] flex-none text-center text-sm font-semibold text-text-muted">
            $
          </span>
          <span>{provider.fees != null ? `${provider.fees} fee` : "No fee set"}</span>
        </div>
        <div className="flex items-center gap-2 text-text-secondary">
          <Award size={15} className="flex-none text-text-muted" />
          <span>{provider.experience ?? "Experience not set"}</span>
        </div>
        <div className="flex items-center gap-2 text-text-secondary">
          <MapPin size={15} className="flex-none text-text-muted" />
          <span className="truncate">{provider.address ?? "No address"}</span>
        </div>
      </dl>

      {provider.about && (
        <p className="mt-3 line-clamp-2 text-sm text-text-muted">{provider.about}</p>
      )}

      <div className="mt-5 flex gap-2 border-t border-border-light pt-4">
        <button
          onClick={onEdit}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-border bg-white py-2 text-sm font-semibold text-text-secondary transition hover:bg-bg-muted"
        >
          <Pencil size={15} />
          Edit
        </button>
        <button
          onClick={onDelete}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-danger/30 bg-danger-light py-2 text-sm font-semibold text-danger transition hover:bg-danger hover:text-white"
        >
          <Trash2 size={15} />
          Delete
        </button>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------- Modal */

function EditProviderModal({
  provider,
  onClose,
  onSaved,
}: {
  provider: Provider;
  onClose: () => void;
  onSaved: (updated: Provider) => void;
}) {
  const [specialty, setSpecialty] = useState(provider.specialty);
  const [fees, setFees] = useState(provider.fees != null ? String(provider.fees) : "");
  const [address, setAddress] = useState(provider.address ?? "");
  const [about, setAbout] = useState(provider.about ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState("");

  async function handleSubmit() {
    setFormError("");
    if (!specialty.trim()) {
      setFormError("Specialty is required.");
      return;
    }
    if (fees.trim() && (Number.isNaN(Number(fees)) || Number(fees) < 0)) {
      setFormError("Fees must be a non-negative number.");
      return;
    }

    setIsSaving(true);
    try {
      const payload: ProviderUpdatePayload = {
        specialty: specialty.trim(),
        fees: fees.trim() ? Number(fees) : null,
        address: address.trim() || null,
        about: about.trim() || null,
      };
      const updated = await updateProvider(provider.id, payload);
      onSaved(updated);
    } catch (err) {
      setFormError(
        isAxiosError(err) && err.response?.status === 403
          ? "You are not allowed to edit this provider."
          : "Could not save changes. Please try again.",
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
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-start justify-between">
          <div>
            <h3 className="text-lg font-bold text-text-primary">Edit provider</h3>
            <p className="mt-1 text-sm text-text-muted">{provider.full_name}</p>
          </div>
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
            <label className={labelClass} htmlFor="edit-specialty">
              Specialty
            </label>
            <input
              id="edit-specialty"
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
              className={fieldClass}
            />
          </div>

          <div>
            <label className={labelClass} htmlFor="edit-fees">
              Fees ($)
            </label>
            <input
              id="edit-fees"
              inputMode="numeric"
              value={fees}
              onChange={(e) => setFees(e.target.value)}
              placeholder="e.g. 120"
              className={fieldClass}
            />
          </div>

          <div>
            <label className={labelClass} htmlFor="edit-address">
              Address
            </label>
            <input
              id="edit-address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Clinic / practice address"
              className={fieldClass}
            />
          </div>

          <div>
            <label className={labelClass} htmlFor="edit-about">
              About
            </label>
            <textarea
              id="edit-about"
              value={about}
              onChange={(e) => setAbout(e.target.value)}
              rows={4}
              placeholder="Short bio shown to patients"
              className={`${fieldClass} resize-y py-3`}
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
            {isSaving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------- Confirm dialog */

function ConfirmDelete({
  provider,
  onCancel,
  onConfirm,
}: {
  provider: Provider;
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
        <h3 className="text-lg font-bold text-text-primary">Delete doctor?</h3>
        <p className="mt-1 text-sm text-text-secondary">
          {provider.full_name} and their login account will be permanently
          removed. A doctor can only be deleted once all their appointments are
          finished (completed, cancelled or no-show).
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
