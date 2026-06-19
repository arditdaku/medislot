"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Check, Loader2, Stethoscope } from "lucide-react";
import { getProviders, deactivateProvider } from "@/lib/api/providers";
import type { Provider } from "@/types/api";

/* ------------------------------------------------------------------ *
 * All Doctors (Admin)
 *
 * Grid of doctor cards backed by real data:
 *   - getProviders()         loads the provider list
 *   - deactivateProvider(id) toggles a provider's `is_active` flag
 *
 * NOTE ON DATA: GET /providers returns ONLY active providers, and the
 * deactivate endpoint is a *toggle* (is_active = !is_active). So a card that
 * is switched off stays on screen for the rest of the session — its checkbox
 * reflects the value the server returns, letting the admin switch it back on —
 * but once the page is reloaded, deactivated doctors no longer come back from
 * the API. Listing inactive doctors needs a backend change (see ticket notes).
 * ------------------------------------------------------------------ */

// Brand gradient pairs for the avatar, picked deterministically per name so a
// given doctor always gets the same colors.
const AVATAR_GRADIENTS = [
  "from-primary-500 to-primary-700",
  "from-primary-400 to-purple",
  "from-info to-primary-600",
  "from-purple to-primary-800",
  "from-primary-600 to-navy",
];

function initials(name: string): string {
  const parts = name.replace(/^Dr\.?\s*/i, "").trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "?";
}

function gradientFor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  }
  return AVATAR_GRADIENTS[hash % AVATAR_GRADIENTS.length];
}

export default function DoctorsPage() {
  const [doctors, setDoctors] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  // Ids currently mid-toggle, so each card shows its own pending state.
  const [pendingIds, setPendingIds] = useState<Set<number>>(new Set());
  // Transient banner shown when a toggle request fails.
  const [actionError, setActionError] = useState<string | null>(null);

  // Reusable fetch for the retry button (an event-handler context, where a
  // synchronous setState is fine).
  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    try {
      setDoctors(await getProviders());
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load. setState is only called from async callbacks (never
  // synchronously in the effect body) to avoid cascading-render churn.
  useEffect(() => {
    let cancelled = false;
    getProviders()
      .then((data) => {
        if (!cancelled) setDoctors(data);
      })
      .catch(() => {
        if (!cancelled) setLoadError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleToggle(doctor: Provider) {
    setActionError(null);
    setPendingIds((prev) => new Set(prev).add(doctor.id));
    // Optimistically flip the card so the checkbox feels instant.
    setDoctors((prev) =>
      prev.map((d) => (d.id === doctor.id ? { ...d, is_active: !d.is_active } : d))
    );
    try {
      const updated = await deactivateProvider(doctor.id);
      // Reconcile with the server's authoritative record.
      setDoctors((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
    } catch {
      // Revert the optimistic change and tell the admin.
      setDoctors((prev) =>
        prev.map((d) =>
          d.id === doctor.id ? { ...d, is_active: doctor.is_active } : d
        )
      );
      setActionError(`Could not update ${doctor.full_name}. Please try again.`);
    } finally {
      setPendingIds((prev) => {
        const next = new Set(prev);
        next.delete(doctor.id);
        return next;
      });
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-primary">Admin</p>
          <h1 className="mt-1 text-3xl font-bold text-text-primary">All Doctors</h1>
          <p className="mt-2 text-text-secondary">
            Manage the clinic&rsquo;s doctors and their availability.
          </p>
        </div>
        <Link
          href="/staff/providers/new"
          className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-600"
        >
          Add doctor
        </Link>
      </div>

      {actionError && (
        <div className="mb-6 rounded-xl border border-danger/30 bg-danger-light px-4 py-3 text-sm font-medium text-danger">
          {actionError}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <SkeletonGrid />
      ) : loadError ? (
        <ErrorState onRetry={load} />
      ) : doctors.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {doctors.map((doctor) => (
            <DoctorCard
              key={doctor.id}
              doctor={doctor}
              pending={pendingIds.has(doctor.id)}
              onToggle={() => handleToggle(doctor)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function DoctorCard({
  doctor,
  pending,
  onToggle,
}: {
  doctor: Provider;
  pending: boolean;
  onToggle: () => void;
}) {
  const active = doctor.is_active;

  return (
    <article className="flex flex-col rounded-2xl border border-border bg-white p-5 shadow-sm transition hover:border-primary/40 hover:shadow-md">
      <div className="flex items-center gap-4">
        <div
          className={`grid h-14 w-14 shrink-0 place-items-center rounded-full bg-gradient-to-br ${gradientFor(
            doctor.full_name
          )} text-base font-bold text-white`}
          aria-hidden="true"
        >
          {initials(doctor.full_name)}
        </div>
        <div className="min-w-0">
          <h2 className="truncate font-semibold text-text-primary">
            {doctor.full_name}
          </h2>
          <p className="mt-0.5 flex items-center gap-1.5 text-sm text-text-muted">
            <Stethoscope size={14} className="shrink-0" />
            <span className="truncate">{doctor.specialty}</span>
          </p>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between border-t border-border-light pt-4">
        <label className="inline-flex cursor-pointer select-none items-center gap-2">
          <input
            type="checkbox"
            className="peer sr-only"
            checked={active}
            disabled={pending}
            onChange={onToggle}
            aria-label={`${doctor.full_name} available`}
          />
          <span
            className={`grid h-5 w-5 place-items-center rounded-md border transition peer-focus-visible:ring-2 peer-focus-visible:ring-primary/40 ${
              active ? "border-primary bg-primary" : "border-border bg-white"
            } ${pending ? "opacity-60" : ""}`}
          >
            {pending ? (
              <Loader2
                size={14}
                className={`animate-spin ${active ? "text-white" : "text-text-muted"}`}
              />
            ) : active ? (
              <Check size={14} strokeWidth={3} className="text-white" />
            ) : null}
          </span>
          <span className="text-sm font-medium text-text-secondary">Available</span>
        </label>

        <span
          className={`h-2.5 w-2.5 rounded-full ${
            active ? "bg-success" : "bg-text-muted"
          }`}
          aria-hidden="true"
        />
      </div>
    </article>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="rounded-2xl border border-border bg-white p-5 shadow-sm"
        >
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 shrink-0 animate-pulse rounded-full bg-bg-muted" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-3/4 animate-pulse rounded bg-bg-muted" />
              <div className="h-3 w-1/2 animate-pulse rounded bg-bg-muted" />
            </div>
          </div>
          <div className="mt-5 border-t border-border-light pt-4">
            <div className="h-4 w-24 animate-pulse rounded bg-bg-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-white py-16 text-center">
      <p className="font-semibold text-text-primary">Couldn&rsquo;t load doctors</p>
      <p className="mt-1 text-sm text-text-muted">
        Something went wrong while fetching the list.
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-5 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-600"
      >
        Try again
      </button>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-white py-16 text-center">
      <div className="grid h-12 w-12 place-items-center rounded-full bg-primary-50 text-primary">
        <Stethoscope size={22} />
      </div>
      <p className="mt-4 font-semibold text-text-primary">No doctors yet</p>
      <p className="mt-1 text-sm text-text-muted">
        Add your first doctor to get started.
      </p>
      <Link
        href="/staff/providers/new"
        className="mt-5 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-600"
      >
        Add doctor
      </Link>
    </div>
  );
}
