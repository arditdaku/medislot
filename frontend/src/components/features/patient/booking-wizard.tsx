"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Baby,
  Bone,
  Brain,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Heart,
  Search,
  Sparkles,
  Stethoscope,
  Wand2,
} from "lucide-react";

import DateTimeSelector from "@/components/features/patient/date-time-selector";
import BookingModal from "@/components/features/patient/booking-modal";
import Skeleton from "@/components/ui/skeleton";
import { getServices } from "@/lib/api/services";
import { getProviders } from "@/lib/api/providers";
import { getSlots } from "@/lib/api/slots";
import { bookAppointment } from "@/lib/api/appointments";
import { getUser } from "@/lib/auth";
import type { Appointment, Provider, Service, Slot } from "@/types/api";

/** Hardcoded until `services.price` exists in the DB schema. */
const CONSULTATION_FEE = 50;

const STEP_LABELS = ["Service", "Doctor", "Date & Time", "Confirm"] as const;

const DEPARTMENT_ICONS: { match: RegExp; icon: typeof Heart }[] = [
  { match: /cardio|heart/i, icon: Heart },
  { match: /derma|skin/i, icon: Sparkles },
  { match: /neuro|brain|nerve/i, icon: Brain },
  { match: /pediatr|child/i, icon: Baby },
  { match: /ortho|bone|joint/i, icon: Bone },
];

function iconForDepartment(name: string): typeof Heart {
  return DEPARTMENT_ICONS.find((d) => d.match.test(name))?.icon ?? Stethoscope;
}

function errorStatus(err: unknown): number | undefined {
  return (err as { response?: { status?: number } })?.response?.status;
}

function formatNextAvailable(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function formatTime(iso: string): string {
  return iso.slice(11, 16);
}

function initials(name: string): string {
  const parts = name.replace(/^Dr\.?\s*/i, "").trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "?";
}

type Step = 1 | 2 | 3 | 4;

export default function BookingWizard() {
  const [step, setStep] = useState<Step>(1);

  // Data
  const [services, setServices] = useState<Service[]>([]);
  const [servicesLoading, setServicesLoading] = useState(true);
  const [servicesError, setServicesError] = useState(false);

  const [providers, setProviders] = useState<Provider[]>([]);
  const [providersLoading, setProvidersLoading] = useState(false);
  const [nextAvailable, setNextAvailable] = useState<Record<number, string | null>>({});

  // Selections
  const [service, setService] = useState<Service | null>(null);
  const [department, setDepartment] = useState<string | null>(null);
  const [provider, setProvider] = useState<Provider | null>(null);
  const [slot, setSlot] = useState<Slot | null>(null);

  // Step 2 search + Step 1 symptom assistant (static placeholder)
  const [doctorSearch, setDoctorSearch] = useState("");
  const [symptom, setSymptom] = useState("");
  const [suggestion, setSuggestion] = useState<string | null>(null);

  // Submission
  const [submitting, setSubmitting] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [result, setResult] = useState<Appointment | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const patient = useMemo(() => {
    const u = getUser() as { full_name?: string; name?: string; email?: string } | null;
    const email = u?.email ?? "";
    const name = u?.full_name ?? u?.name ?? (email ? email.split("@")[0] : "You");
    return { name, email };
  }, []);

  // ── Step 1 data: services grouped into distinct departments ──────────
  useEffect(() => {
    let cancelled = false;
    getServices()
      .then((data) => {
        if (!cancelled) setServices(data);
      })
      .catch(() => {
        if (!cancelled) setServicesError(true);
      })
      .finally(() => {
        if (!cancelled) setServicesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const departments = useMemo(() => {
    const seen = new Map<string, Service>();
    for (const s of services) {
      if (!seen.has(s.department)) seen.set(s.department, s);
    }
    return [...seen.entries()].map(([name, rep]) => ({ name, rep }));
  }, [services]);

  // ── Step 2 data: providers for the chosen department + next availability
  useEffect(() => {
    if (step !== 2 || !department) return;
    let cancelled = false;
    setProvidersLoading(true);
    getProviders()
      .then(async (all) => {
        const matched = all.filter(
          (p) => p.specialty.toLowerCase() === department.toLowerCase(),
        );
        if (!cancelled) setProviders(matched);

        // Earliest available slot per provider → "Next available".
        const entries = await Promise.all(
          matched.map(async (p) => {
            try {
              const s = await getSlots(p.id);
              const avail = s
                .filter((x) => x.status === "available")
                .sort((a, b) => a.start_time.localeCompare(b.start_time));
              return [p.id, avail[0]?.start_time ?? null] as const;
            } catch {
              return [p.id, null] as const;
            }
          }),
        );
        if (!cancelled) setNextAvailable(Object.fromEntries(entries));
      })
      .catch(() => {
        if (!cancelled) setProviders([]);
      })
      .finally(() => {
        if (!cancelled) setProvidersLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [step, department]);

  const visibleProviders = useMemo(() => {
    const q = doctorSearch.trim().toLowerCase();
    if (!q) return providers;
    return providers.filter((p) => p.full_name.toLowerCase().includes(q));
  }, [providers, doctorSearch]);

  function selectDepartment(dep: { name: string; rep: Service }) {
    if (department !== dep.name) {
      setProvider(null);
      setSlot(null);
    }
    setDepartment(dep.name);
    setService(dep.rep);
  }

  function runSuggestion() {
    const text = symptom.toLowerCase();
    const guess =
      departments.find((d) => {
        const entry = DEPARTMENT_ICONS.find((x) => x.match.test(d.name));
        return entry ? entry.match.test(text) : false;
      })?.name ?? departments[0]?.name ?? null;
    setSuggestion(guess);
  }

  async function confirmBooking() {
    if (!slot || !service) return;
    setSubmitting(true);
    setBookingError(null);
    try {
      const appt = await bookAppointment(slot.id, service.id);
      setResult(appt);
    } catch (err) {
      if (errorStatus(err) === 409) {
        // Slot was taken between selection and confirmation → back to step 3.
        setBookingError(null);
        setSlot(null);
        setReloadKey((k) => k + 1);
        setStep(3);
        window.alert("That time was just booked by someone else. Please pick another slot.");
      } else {
        setBookingError("Could not confirm the booking. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  function resetWizard() {
    setStep(1);
    setService(null);
    setDepartment(null);
    setProvider(null);
    setSlot(null);
    setResult(null);
    setBookingError(null);
    setDoctorSearch("");
    setSymptom("");
    setSuggestion(null);
  }

  const canNext = (step === 1 && !!service) || (step === 2 && !!provider) || (step === 3 && !!slot);
  const nextLabel = step === 1 ? "Next: Choose Doctor" : step === 2 ? "Next: Pick Date" : "Next: Confirm";
  const slotDate = slot
    ? new Date(slot.start_time).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })
    : "—";

  // ── Success screen ───────────────────────────────────────────────────
  if (result) {
    return (
      <div className="mx-auto max-w-xl rounded-3xl border border-[var(--color-border)] bg-white p-8 text-center shadow-sm">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[var(--color-success-light)] text-[var(--color-success)]">
          <Check size={30} />
        </div>
        <h2 className="mt-5 text-2xl font-bold text-[var(--color-text-primary)]">Booking Confirmed!</h2>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
          A confirmation has been sent to your email.
        </p>
        <span className="mt-3 inline-block rounded-full bg-[var(--color-primary-50)] px-3 py-1 font-mono text-xs font-semibold text-[var(--color-primary-700)]">
          Appointment ID · #{result.id.slice(0, 8).toUpperCase()}
        </span>

        <div className="mt-6 space-y-2 rounded-2xl border border-[var(--color-border-light)] bg-[var(--color-bg-secondary)] p-5 text-left text-sm">
          <SummaryRow label="Service" value={service?.name ?? "—"} />
          <SummaryRow label="Doctor" value={provider?.full_name ?? "—"} />
          <SummaryRow label="Date" value={slotDate} />
          <SummaryRow label="Status" value={result.status} />
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={resetWizard}
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-[var(--color-border)] bg-white px-5 py-2.5 text-sm font-semibold text-[var(--color-text-secondary)] transition hover:bg-[var(--color-bg-muted)]"
          >
            Book Another
          </button>
          <Link
            href="/patient/appointments"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[var(--color-primary)] px-6 py-2.5 text-sm font-semibold text-[var(--color-white)] transition hover:bg-[var(--color-primary-600)]"
          >
            View My Appointments <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-[var(--color-text-primary)]">Book an appointment</h1>
      <p className="mt-1 text-sm text-[var(--color-text-muted)]">A guided 4-step booking experience.</p>

      {/* Progress stepper */}
      <div className="mt-6 rounded-2xl border border-[var(--color-border)] bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between text-sm">
          <span className="font-semibold text-[var(--color-primary)]">Step {step} of 4</span>
          <span className="text-[var(--color-text-muted)]">{STEP_LABELS[step - 1]}</span>
        </div>
        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-bg-muted)]">
          <div
            className="h-full rounded-full bg-[var(--color-primary)] transition-all duration-300"
            style={{ width: `${(step / 4) * 100}%` }}
          />
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {STEP_LABELS.map((label, i) => {
            const n = (i + 1) as Step;
            const done = n < step;
            const active = n === step;
            return (
              <div key={label} className="flex items-center gap-2">
                <span
                  className={`grid h-6 w-6 flex-none place-items-center rounded-full text-xs font-bold ${
                    done
                      ? "bg-[var(--color-success)] text-white"
                      : active
                        ? "bg-[var(--color-primary)] text-white"
                        : "bg-[var(--color-bg-muted)] text-[var(--color-text-muted)]"
                  }`}
                >
                  {done ? <Check size={14} /> : n}
                </span>
                <span
                  className={`text-sm ${active ? "font-semibold text-[var(--color-text-primary)]" : "text-[var(--color-text-muted)]"}`}
                >
                  {label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Step body */}
      <div className="mt-8">
        {step === 1 && (
          <Step1
            loading={servicesLoading}
            error={servicesError}
            departments={departments}
            selected={department}
            onSelect={selectDepartment}
            symptom={symptom}
            setSymptom={setSymptom}
            suggestion={suggestion}
            onSuggest={runSuggestion}
            onPickSuggestion={(name) => {
              const dep = departments.find((d) => d.name === name);
              if (dep) selectDepartment(dep);
            }}
          />
        )}

        {step === 2 && (
          <Step2
            department={department}
            loading={providersLoading}
            providers={visibleProviders}
            nextAvailable={nextAvailable}
            selected={provider}
            onSelect={(p) => {
              if (provider?.id !== p.id) setSlot(null);
              setProvider(p);
            }}
            search={doctorSearch}
            setSearch={setDoctorSearch}
          />
        )}

        {step === 3 && provider && (
          <div>
            <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">Pick a date &amp; time</h2>
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">
              Choose from available slots for {provider.full_name}.
            </p>
            <div className="mt-6">
              <DateTimeSelector
                providerId={provider.id}
                selectedSlot={slot}
                onSelectSlot={setSlot}
                reloadKey={reloadKey}
              />
            </div>
          </div>
        )}

        {step === 4 && service && provider && slot && (
          <BookingModal
            service={{ name: service.name, department: service.department }}
            doctor={{ name: provider.full_name, specialty: provider.specialty }}
            date={new Date(slot.start_time).toLocaleDateString("en-US", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
            time={formatTime(slot.start_time)}
            durationMinutes={service.duration_minutes}
            patient={patient}
            fee={CONSULTATION_FEE}
            submitting={submitting}
            error={bookingError}
            onBackToEdit={() => setStep(3)}
            onConfirm={confirmBooking}
          />
        )}
      </div>

      {/* Footer nav (hidden on step 4 — the review card has its own buttons) */}
      {step !== 4 && (
        <div className="mt-8 flex items-center justify-between">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep((s) => (s - 1) as Step)}
              className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[var(--color-border)] bg-white px-5 py-2.5 text-sm font-semibold text-[var(--color-text-secondary)] transition hover:bg-[var(--color-bg-muted)]"
            >
              <ArrowLeft size={16} /> Back
            </button>
          ) : (
            <span />
          )}
          <button
            type="button"
            disabled={!canNext}
            onClick={() => setStep((s) => (s + 1) as Step)}
            className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[var(--color-primary)] px-6 py-2.5 text-sm font-semibold text-[var(--color-white)] transition hover:bg-[var(--color-primary-600)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {nextLabel} <ArrowRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[var(--color-text-muted)]">{label}</span>
      <span className="font-semibold text-[var(--color-text-primary)]">{value}</span>
    </div>
  );
}

// ── Step 1: department selection + symptom assistant (static) ──────────
function Step1({
  loading,
  error,
  departments,
  selected,
  onSelect,
  symptom,
  setSymptom,
  suggestion,
  onSuggest,
  onPickSuggestion,
}: {
  loading: boolean;
  error: boolean;
  departments: { name: string; rep: Service }[];
  selected: string | null;
  onSelect: (dep: { name: string; rep: Service }) => void;
  symptom: string;
  setSymptom: (v: string) => void;
  suggestion: string | null;
  onSuggest: () => void;
  onPickSuggestion: (name: string) => void;
}) {
  return (
    <div>
      <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">Select a department</h2>
      <p className="mt-1 text-sm text-[var(--color-text-muted)]">Pick the type of visit you need today.</p>

      {error ? (
        <p className="mt-6 rounded-xl border border-[var(--color-danger-light)] bg-[var(--color-danger-light)] px-4 py-3 text-sm font-medium text-[var(--color-danger)]">
          Could not load services. Please refresh and try again.
        </p>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {loading
            ? Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-40" />)
            : departments.map((dep) => {
                const Icon = iconForDepartment(dep.name);
                const active = selected === dep.name;
                return (
                  <button
                    key={dep.name}
                    type="button"
                    onClick={() => onSelect(dep)}
                    className={`flex flex-col rounded-2xl border bg-white p-5 text-left transition ${
                      active
                        ? "border-[var(--color-primary)] ring-2 ring-[var(--color-primary-100)]"
                        : "border-[var(--color-border)] hover:border-[var(--color-primary)] hover:shadow-sm"
                    }`}
                  >
                    <span
                      className={`grid h-11 w-11 place-items-center rounded-xl ${
                        active
                          ? "bg-[var(--color-primary)] text-white"
                          : "bg-[var(--color-primary-50)] text-[var(--color-primary)]"
                      }`}
                    >
                      <Icon size={20} />
                    </span>
                    <p className="mt-4 font-semibold text-[var(--color-text-primary)]">{dep.name}</p>
                    <p className="text-sm text-[var(--color-text-muted)]">{dep.rep.name}</p>
                    <div className="mt-4 flex items-center justify-between text-sm text-[var(--color-text-muted)]">
                      <span className="inline-flex items-center gap-1.5">
                        <Clock size={14} /> {dep.rep.duration_minutes} min
                      </span>
                      {active && (
                        <span className="inline-flex items-center gap-1 font-semibold text-[var(--color-primary)]">
                          <CheckCircle2 size={14} /> Selected
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
          {!loading && departments.length === 0 && (
            <p className="text-sm text-[var(--color-text-muted)]">No services are available yet.</p>
          )}
        </div>
      )}

      {/* Symptom assistant — UI placeholder only (no backend endpoint). */}
      <div className="mt-6 rounded-2xl border border-[var(--color-border)] bg-white p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-[var(--color-primary)] text-white">
            <Wand2 size={16} />
          </span>
          <div>
            <p className="font-semibold text-[var(--color-text-primary)]">Not sure which department?</p>
            <p className="text-xs text-[var(--color-text-muted)]">
              Describe your symptoms — our assistant will suggest the right care.
            </p>
          </div>
        </div>
        <textarea
          value={symptom}
          onChange={(e) => setSymptom(e.target.value)}
          rows={3}
          placeholder="e.g. chest pain when climbing stairs"
          className="mt-4 w-full resize-y rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-3 text-sm outline-none transition focus:border-[var(--color-primary)]"
        />
        <div className="mt-3 flex items-center justify-between">
          <span className="text-xs text-[var(--color-text-muted)]">Advisory only — not a medical diagnosis.</span>
          <button
            type="button"
            onClick={onSuggest}
            disabled={!symptom.trim()}
            className="inline-flex items-center gap-2 rounded-full border border-[var(--color-primary)] px-4 py-1.5 text-sm font-semibold text-[var(--color-primary)] transition hover:bg-[var(--color-primary-50)] disabled:opacity-50"
          >
            <Sparkles size={14} /> Suggest Department
          </button>
        </div>
        {suggestion && (
          <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-[var(--color-primary-100)] bg-[var(--color-primary-50)] p-4">
            <div className="flex items-center gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-white text-[var(--color-primary)]">
                {(() => {
                  const Icon = iconForDepartment(suggestion);
                  return <Icon size={16} />;
                })()}
              </span>
              <p className="font-semibold text-[var(--color-text-primary)]">{suggestion}</p>
            </div>
            <button
              type="button"
              onClick={() => onPickSuggestion(suggestion)}
              className="rounded-full bg-[var(--color-primary)] px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-[var(--color-primary-600)]"
            >
              Select
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Step 2: provider selection ─────────────────────────────────────────
function Step2({
  department,
  loading,
  providers,
  nextAvailable,
  selected,
  onSelect,
  search,
  setSearch,
}: {
  department: string | null;
  loading: boolean;
  providers: Provider[];
  nextAvailable: Record<number, string | null>;
  selected: Provider | null;
  onSelect: (p: Provider) => void;
  search: string;
  setSearch: (v: string) => void;
}) {
  return (
    <div>
      <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">Choose your provider</h2>
      <p className="mt-1 text-sm text-[var(--color-text-muted)]">
        {loading
          ? "Loading doctors…"
          : `${providers.length} doctor${providers.length === 1 ? "" : "s"} available for ${department}.`}
      </p>

      <div className="relative mt-6">
        <Search size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by doctor name"
          className="min-h-12 w-full rounded-2xl border border-[var(--color-border)] bg-white pl-11 pr-4 text-sm outline-none transition focus:border-[var(--color-primary)]"
        />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {loading
          ? Array.from({ length: 2 }, (_, i) => <Skeleton key={i} className="h-28" />)
          : providers.map((p) => {
              const active = selected?.id === p.id;
              const next = nextAvailable[p.id];
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => onSelect(p)}
                  className={`flex items-center justify-between gap-4 rounded-2xl border bg-white p-5 text-left transition ${
                    active
                      ? "border-[var(--color-primary)] ring-2 ring-[var(--color-primary-100)]"
                      : "border-[var(--color-border)] hover:border-[var(--color-primary)] hover:shadow-sm"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <span className="grid h-12 w-12 flex-none place-items-center rounded-full bg-[var(--color-primary-100)] text-sm font-bold text-[var(--color-primary)]">
                      {initials(p.full_name)}
                    </span>
                    <div>
                      <p className="font-semibold text-[var(--color-text-primary)]">{p.full_name}</p>
                      <p className="text-sm text-[var(--color-text-secondary)]">{p.specialty}</p>
                      <p className="mt-1 inline-flex items-center gap-1.5 text-xs text-[var(--color-text-muted)]">
                        <Calendar size={12} />
                        {next ? `Next: ${formatNextAvailable(next)}` : "No availability"}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold ${
                      active
                        ? "bg-[var(--color-primary)] text-white"
                        : "border border-[var(--color-border)] text-[var(--color-text-secondary)]"
                    }`}
                  >
                    {active && <CheckCircle2 size={15} />}
                    {active ? "Selected" : "Select"}
                  </span>
                </button>
              );
            })}
        {!loading && providers.length === 0 && (
          <p className="text-sm text-[var(--color-text-muted)]">
            No doctors found for {department}.
          </p>
        )}
      </div>
    </div>
  );
}
