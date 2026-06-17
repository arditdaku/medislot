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
  BadgeDollarSign,
  MapPin,
  User as UserIcon,
  FileText,
  GraduationCap,
  Upload,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { createDoctor } from "@/lib/api/providers";
import { getServices } from "@/lib/api/services";
import type { DoctorCreatePayload } from "@/types/api";

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

  const fieldClass =
    "mt-2 min-h-11 w-full rounded-xl border border-border bg-bg-secondary px-4 text-sm text-text-primary outline-none transition focus:border-primary focus:bg-white";
  const labelClass =
    "flex items-center gap-2 text-sm font-medium text-text-secondary";

  return (
    <div className="mx-auto max-w-5xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text-primary">Add Doctor</h1>
        <p className="mt-2 text-text-secondary">
          Create a doctor account. They can log in immediately with the
          credentials you set here.
        </p>
      </div>

      {toast && (
        <div
          className={`mb-6 flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium ${
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
        className="rounded-2xl border border-border bg-white p-6 shadow-sm sm:p-8"
      >
        {/* Upload picture (non-functional placeholder) */}
        <div className="flex items-center gap-5 border-b border-border-light pb-6">
          <button
            type="button"
            aria-label="Upload doctor picture"
            className="grid h-20 w-20 flex-none place-items-center rounded-full border border-border bg-bg-muted text-text-muted"
          >
            <Upload size={24} />
          </button>
          <span className="text-sm text-text-secondary">
            {picture ? "Picture selected" : "Upload doctor picture"}
          </span>
        </div>

        <div className="mt-6 grid gap-5 md:grid-cols-2">
          {/* Doctor name */}
          <div>
            <label className={labelClass} htmlFor="fullName">
              <UserIcon size={15} /> Doctor name
            </label>
            <input
              id="fullName"
              value={form.fullName}
              onChange={(e) => update("fullName", e.target.value)}
              placeholder="Dr. Jane Smith"
              className={fieldClass}
            />
            {errors.fullName && (
              <p className="mt-1 text-sm text-danger">{errors.fullName}</p>
            )}
          </div>

          {/* Speciality */}
          <div>
            <label className={labelClass} htmlFor="specialty">
              <Stethoscope size={15} /> Speciality
            </label>
            <select
              id="specialty"
              value={form.specialty}
              onChange={(e) => update("specialty", e.target.value)}
              className={fieldClass}
            >
              {specialties.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Email */}
          <div>
            <label className={labelClass} htmlFor="email">
              <Mail size={15} /> Doctor email
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
              <p className="mt-1 text-sm text-danger">{errors.email}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <label className={labelClass} htmlFor="password">
              <Lock size={15} /> Doctor password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={(e) => update("password", e.target.value)}
                placeholder="At least 8 characters"
                className={`${fieldClass} pr-11`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted transition hover:text-primary"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-sm text-danger">{errors.password}</p>
            )}
          </div>

          {/* Experience */}
          <div>
            <label className={labelClass} htmlFor="experience">
              <Award size={15} /> Experience
            </label>
            <select
              id="experience"
              value={form.experience}
              onChange={(e) => update("experience", e.target.value)}
              className={fieldClass}
            >
              {EXPERIENCE_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          {/* Fees */}
          <div>
            <label className={labelClass} htmlFor="fees">
              <BadgeDollarSign size={15} /> Fees
            </label>
            <input
              id="fees"
              inputMode="numeric"
              value={form.fees}
              onChange={(e) => update("fees", e.target.value)}
              placeholder="e.g. 120"
              className={fieldClass}
            />
            {errors.fees && (
              <p className="mt-1 text-sm text-danger">{errors.fees}</p>
            )}
          </div>

          {/* Education */}
          <div>
            <label className={labelClass} htmlFor="education">
              <GraduationCap size={15} /> Education
            </label>
            <input
              id="education"
              value={form.education}
              onChange={(e) => update("education", e.target.value)}
              placeholder="e.g. MBBS, MD"
              className={fieldClass}
            />
            {errors.education && (
              <p className="mt-1 text-sm text-danger">{errors.education}</p>
            )}
          </div>

          {/* Address (full width) */}
          <div className="md:col-span-2">
            <label className={labelClass} htmlFor="address">
              <MapPin size={15} /> Address
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
          <div className="md:col-span-2">
            <label className={labelClass} htmlFor="about">
              <FileText size={15} /> About doctor
            </label>
            <textarea
              id="about"
              value={form.about}
              onChange={(e) => update("about", e.target.value)}
              placeholder="Short bio shown to patients"
              rows={4}
              className={`${fieldClass} resize-y py-3`}
            />
          </div>
        </div>

        <div className="mt-8 flex justify-end gap-3 border-t border-border-light pt-6">
          <button
            type="button"
            onClick={() => router.push("/staff/providers")}
            className="rounded-full border border-border bg-white px-5 py-2.5 text-sm font-semibold text-text-secondary transition hover:bg-bg-muted"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-70"
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
