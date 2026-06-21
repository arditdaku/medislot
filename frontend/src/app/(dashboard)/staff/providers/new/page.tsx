"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isAxiosError } from "axios";
import {
  Stethoscope,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Award,
  DollarSign,
  MapPin,
  User as UserIcon,
  FileText,
  GraduationCap,
  Camera,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { createDoctor } from "@/lib/api/providers";
import { getServices } from "@/lib/api/services";
import type { DoctorCreatePayload } from "@/types/api";
import Select from "@/components/ui/select";

/**
 * A doctor's specialty must match a service `department` exactly — that's how
 * the patient booking flow finds doctors (booking-wizard filters providers by
 * `specialty === department`). So the options here are the real service
 * departments; this fallback is only used if the services request fails.
 */
const FALLBACK_SPECIALTIES = [
  "General Medicine",
  "Cardiology",
  "Dermatology",
  "Neurology",
  "Pediatrics",
  "Dentistry",
];

const EXPERIENCE_OPTIONS = [
  "1 Year",
  "2 Years",
  "3 Years",
  "4 Years",
  "5 Years",
  "6 Years",
  "7 Years",
  "8 Years",
  "9 Years",
  "10+ Years",
];

type FormState = {
  fullName: string;
  email: string;
  password: string;
  specialty: string;
  experience: string;
  education: string;
  fees: string;
  address: string;
  about: string;
};

const emptyForm: FormState = {
  fullName: "",
  email: "",
  password: "",
  specialty: FALLBACK_SPECIALTIES[0],
  experience: EXPERIENCE_OPTIONS[0],
  education: "",
  fees: "",
  address: "",
  about: "",
};

type Toast = { type: "success" | "error"; message: string } | null;

export default function AddDoctorPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(emptyForm);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [toast, setToast] = useState<Toast>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [specialties, setSpecialties] = useState<string[]>(FALLBACK_SPECIALTIES);
  // Non-functional for this ticket: the picture stays null and clicking does nothing.
  const [picture] = useState<File | null>(null);

  // Specialty options are the real service departments, so a created doctor
  // matches what patients can pick in the booking flow.
  useEffect(() => {
    let cancelled = false;
    getServices()
      .then((services) => {
        const departments = [...new Set(services.map((s) => s.department))].sort();
        if (!cancelled && departments.length > 0) {
          setSpecialties(departments);
          setForm((prev) =>
            departments.includes(prev.specialty)
              ? prev
              : { ...prev, specialty: departments[0] }
          );
        }
      })
      .catch(() => {
        /* keep FALLBACK_SPECIALTIES */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const update = (field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const validate = () => {
    const next: Partial<Record<keyof FormState, string>> = {};
    if (!form.fullName.trim()) next.fullName = "Doctor name is required.";
    if (!form.email.trim()) next.email = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      next.email = "Enter a valid email.";
    if (!form.password.trim()) next.password = "Password is required.";
    else if (form.password.length < 8)
      next.password = "Password must be at least 8 characters.";
    if (!form.specialty.trim()) next.specialty = "Speciality is required.";
    if (!form.education.trim()) next.education = "Education is required.";
    if (!form.fees.trim()) next.fees = "Fees is required.";
    else if (Number.isNaN(Number(form.fees)) || Number(form.fees) <= 0)
      next.fees = "Fees must be a number greater than 0.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setToast(null);
    if (!validate()) {
      setToast({ type: "error", message: "Please fix the highlighted fields." });
      return;
    }

    setIsSaving(true);
    try {
      const payload: DoctorCreatePayload = {
        full_name: form.fullName.trim(),
        email: form.email.trim(),
        password: form.password,
        specialty: form.specialty,
        experience: form.experience || null,
        fees: form.fees ? Number(form.fees) : null,
        address: form.address.trim() || null,
        about: form.about.trim() || null,
      };
      await createDoctor(payload);
      setToast({
        type: "success",
        message: "Doctor added successfully",
      });
      router.push("/staff/providers");
    } catch (err) {
      const message =
        isAxiosError(err) && err.response?.status === 409
          ? "A doctor with this email already exists."
          : "Could not create the doctor. Please try again.";
      setToast({ type: "error", message });
    } finally {
      setIsSaving(false);
    }
  };

  // Base styles without a top margin, so fields wrapped in a `relative` div
  // (password, fees) can carry the margin on the wrapper instead — keeping the
  // absolutely-positioned icons centered on the input, not the margin box.
  const fieldBase =
    "h-10 w-full rounded-lg border border-border bg-bg-secondary px-3 text-sm text-text-primary outline-none transition focus:border-primary focus:bg-white";
  const fieldClass = `mt-1.5 ${fieldBase}`;
  const labelClass = "text-xs font-semibold text-text-secondary";
  const iconClass = "text-primary";

  return (
    <div className="mx-auto max-w-3xl">
      {/* Header */}
      <div className="mb-5 flex items-center gap-3">
        <span className="grid h-10 w-10 flex-none place-items-center rounded-xl bg-primary-50 text-primary">
          <Stethoscope size={20} />
        </span>
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Add Doctor</h1>
          <p className="text-sm text-text-muted">
            They can log in immediately with these credentials.
          </p>
        </div>
      </div>

      {toast && (
        <div
          className={`mb-4 flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium ${
            toast.type === "success"
              ? "border-success/30 bg-success-light text-success"
              : "border-danger/30 bg-danger-light text-danger"
          }`}
        >
          {toast.type === "success" && <CheckCircle2 size={16} />}
          {toast.message}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-border bg-white p-5 shadow-sm"
      >
        {/* Avatar (non-functional placeholder) */}
        <div className="mb-5 flex items-center gap-3 border-b border-border-light pb-5">
          <button
            type="button"
            aria-label="Upload doctor picture"
            className="group relative grid h-14 w-14 flex-none place-items-center rounded-full bg-primary-50 text-primary transition hover:bg-primary-100"
          >
            <Camera size={18} />
          </button>
          <div>
            <p className="text-sm font-semibold text-text-primary">
              Doctor photo
            </p>
            <p className="text-xs text-text-muted">
              {picture ? "Picture selected" : "Optional — add later"}
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Doctor name */}
          <div>
            <label className={labelClass} htmlFor="fullName">
              <UserIcon size={13} className={`mr-1 inline ${iconClass}`} />
              Doctor name
            </label>
            <input
              id="fullName"
              value={form.fullName}
              onChange={(e) => update("fullName", e.target.value)}
              placeholder="Dr. Jane Smith"
              className={fieldClass}
            />
            {errors.fullName && (
              <p className="mt-1 text-xs text-danger">{errors.fullName}</p>
            )}
          </div>

          {/* Speciality */}
          <div>
            <span className={labelClass}>
              <Stethoscope size={13} className={`mr-1 inline ${iconClass}`} />
              Speciality
            </span>
            <Select
              className="mt-1.5"
              ariaLabel="Speciality"
              icon={<Stethoscope size={14} />}
              value={form.specialty}
              onChange={(v) => update("specialty", v)}
              options={specialties.map((s) => ({ value: s, label: s }))}
            />
          </div>

          {/* Email */}
          <div>
            <label className={labelClass} htmlFor="email">
              <Mail size={13} className={`mr-1 inline ${iconClass}`} />
              Doctor email
            </label>
            <input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              placeholder="doctor@clinic.com"
              className={fieldClass}
            />
            {errors.email && (
              <p className="mt-1 text-xs text-danger">{errors.email}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <label className={labelClass} htmlFor="password">
              <Lock size={13} className={`mr-1 inline ${iconClass}`} />
              Doctor password
            </label>
            <div className="relative mt-1.5">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={(e) => update("password", e.target.value)}
                placeholder="At least 8 characters"
                className={`${fieldBase} pr-10`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted transition hover:text-primary"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-xs text-danger">{errors.password}</p>
            )}
          </div>

          {/* Experience */}
          <div>
            <span className={labelClass}>
              <Award size={13} className={`mr-1 inline ${iconClass}`} />
              Experience
            </span>
            <Select
              className="mt-1.5"
              ariaLabel="Experience"
              icon={<Award size={14} />}
              value={form.experience}
              onChange={(v) => update("experience", v)}
              options={EXPERIENCE_OPTIONS.map((opt) => ({
                value: opt,
                label: opt,
              }))}
            />
          </div>

          {/* Fees */}
          <div>
            <label className={labelClass} htmlFor="fees">
              <DollarSign size={13} className={`mr-1 inline ${iconClass}`} />
              Fees
            </label>
            <div className="relative mt-1.5">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-text-muted">
                $
              </span>
              <input
                id="fees"
                inputMode="numeric"
                value={form.fees}
                onChange={(e) => update("fees", e.target.value)}
                placeholder="120"
                className={`${fieldBase} pl-7`}
              />
            </div>
            {errors.fees && (
              <p className="mt-1 text-xs text-danger">{errors.fees}</p>
            )}
          </div>

          {/* Education */}
          <div className="sm:col-span-2">
            <label className={labelClass} htmlFor="education">
              <GraduationCap size={13} className={`mr-1 inline ${iconClass}`} />
              Education
            </label>
            <input
              id="education"
              value={form.education}
              onChange={(e) => update("education", e.target.value)}
              placeholder="e.g. MBBS, MD"
              className={fieldClass}
            />
            {errors.education && (
              <p className="mt-1 text-xs text-danger">{errors.education}</p>
            )}
          </div>

          {/* Address (full width) */}
          <div className="sm:col-span-2">
            <label className={labelClass} htmlFor="address">
              <MapPin size={13} className={`mr-1 inline ${iconClass}`} />
              Address
            </label>
            <input
              id="address"
              value={form.address}
              onChange={(e) => update("address", e.target.value)}
              placeholder="Clinic / practice address"
              className={fieldClass}
            />
          </div>

          {/* About (full width) */}
          <div className="sm:col-span-2">
            <label className={labelClass} htmlFor="about">
              <FileText size={13} className={`mr-1 inline ${iconClass}`} />
              About doctor
            </label>
            <textarea
              id="about"
              value={form.about}
              onChange={(e) => update("about", e.target.value)}
              placeholder="Short bio shown to patients"
              rows={3}
              className={`${fieldClass} h-auto resize-y py-2.5`}
            />
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-3 border-t border-border-light pt-4">
          <button
            type="button"
            onClick={() => router.push("/staff/providers")}
            className="rounded-full border border-border bg-white px-5 py-2 text-sm font-semibold text-text-secondary transition hover:bg-bg-muted"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2 text-sm font-semibold text-white transition hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSaving ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <CheckCircle2 size={16} />
            )}
            {isSaving ? "Adding..." : "Add doctor"}
          </button>
        </div>
      </form>
    </div>
  );
}
