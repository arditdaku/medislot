"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  User as UserIcon,
  Phone,
  MapPin,
  Calendar,
  Mail,
  CheckCircle2,
} from "lucide-react";
import { getUser } from "@/lib/auth";

type PatientProfile = {
  fullName: string;
  phone: string;
  address: string;
  dateOfBirth: string;
  gender: string;
};

type ToastState = {
  type: "success" | "error";
  message: string;
} | null;

const emptyProfile: PatientProfile = {
  fullName: "",
  phone: "",
  address: "",
  dateOfBirth: "",
  gender: "",
};

function initials(name: string, email: string): string {
  if (name.trim()) {
    const parts = name.trim().split(/\s+/);
    return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase();
  }
  return (email[0] ?? "U").toUpperCase();
}

export default function PatientProfilePage() {
  const [profile, setProfile] = useState<PatientProfile>(emptyProfile);
  const [errors, setErrors] = useState<Partial<PatientProfile>>({});
  const [toast, setToast] = useState<ToastState>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [email, setEmail] = useState("");

  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

  useEffect(() => {
    const account = getUser() as { email?: string } | null;
    if (account?.email) setEmail(account.email);

    const fetchPatientProfile = async () => {
      try {
        const response = await fetch(`${apiUrl}/patients/me`);

        if (!response.ok) {
          throw new Error("Failed to load patient profile");
        }

        const data = await response.json();

        setProfile({
          fullName: data.fullName ?? data.full_name ?? "",
          phone: data.phone ?? "",
          address: data.address ?? "",
          dateOfBirth: data.dateOfBirth ?? data.dob ?? data.date_of_birth ?? "",
          gender: data.gender ?? "",
        });
      } catch {
        setToast({
          type: "error",
          message: "Could not load your profile. Please try again.",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchPatientProfile();
  }, [apiUrl]);

  const completion = useMemo(() => {
    const fields = [
      profile.fullName,
      profile.phone,
      profile.address,
      profile.dateOfBirth,
      profile.gender,
    ];
    const filled = fields.filter((value) => value.trim()).length;
    return Math.round((filled / fields.length) * 100);
  }, [profile]);

  const updateField = (field: keyof PatientProfile, value: string) => {
    setProfile((currentProfile) => ({
      ...currentProfile,
      [field]: value,
    }));

    setErrors((currentErrors) => ({
      ...currentErrors,
      [field]: "",
    }));
  };

  const validateForm = () => {
    const nextErrors: Partial<PatientProfile> = {};

    if (!profile.fullName.trim()) {
      nextErrors.fullName = "Full name is required.";
    }
    if (!profile.phone.trim()) {
      nextErrors.phone = "Phone is required.";
    }
    if (!profile.address.trim()) {
      nextErrors.address = "Address is required.";
    }
    if (!profile.dateOfBirth.trim()) {
      nextErrors.dateOfBirth = "Date of birth is required.";
    }
    if (!profile.gender.trim()) {
      nextErrors.gender = "Gender is required.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setToast(null);

    if (!validateForm()) {
      setToast({
        type: "error",
        message: "Please fill in all required fields.",
      });
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch(`${apiUrl}/patients/me`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          full_name: profile.fullName,
          phone: profile.phone,
          address: profile.address,
          dob: profile.dateOfBirth,
          gender: profile.gender,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save patient profile");
      }

      setToast({
        type: "success",
        message: "Profile saved successfully.",
      });
    } catch {
      setToast({
        type: "error",
        message: "Could not save your profile. Please try again.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const inputClass =
    "mt-2 min-h-11 w-full rounded-xl border border-border bg-bg-secondary px-4 text-sm text-text-primary outline-none transition focus:border-primary focus:bg-white";
  const labelClass =
    "flex items-center gap-2 text-sm font-medium text-text-secondary";

  return (
    <div className="mx-auto max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text-primary">Profile</h1>
        <p className="mt-2 text-text-secondary">
          Keep your information up to date so we can provide the best care.
        </p>
      </div>

      {toast && (
        <div
          className={`mb-6 rounded-xl border px-4 py-3 text-sm font-medium ${
            toast.type === "success"
              ? "border-success/30 bg-success-light text-success"
              : "border-danger/30 bg-danger-light text-danger"
          }`}
        >
          {toast.message}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        {/* Left column */}
        <div className="space-y-6">
          {/* Identity card */}
          <div className="flex flex-col items-center rounded-2xl border border-border bg-white p-8 text-center shadow-sm">
            <span className="grid h-24 w-24 place-items-center rounded-2xl bg-primary-100 text-2xl font-bold text-primary">
              {initials(profile.fullName, email)}
            </span>
            <h2 className="mt-4 text-lg font-bold text-text-primary">
              {profile.fullName || "Your name"}
            </h2>
            {email && (
              <p className="mt-1 text-sm text-text-muted">{email}</p>
            )}
            <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold text-primary">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              Patient
            </span>
          </div>

          {/* Profile completion card */}
          <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-text-primary">
                Profile completion
              </p>
              <span className="text-lg font-bold text-primary">
                {completion}%
              </span>
            </div>
            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500"
                style={{ width: `${completion}%` }}
              />
            </div>
            <p className="mt-4 flex items-start gap-2 text-sm text-text-secondary">
              <CheckCircle2 size={16} className="mt-0.5 flex-none text-primary" />
              A complete profile helps doctors provide better care.
            </p>
          </div>
        </div>

        {/* Right column — editable personal information */}
        <form
          onSubmit={handleSave}
          className="rounded-2xl border border-border bg-white p-6 shadow-sm sm:p-8"
        >
          <div className="mb-6">
            <h3 className="text-lg font-bold text-text-primary">
              Personal information
            </h3>
            <p className="mt-1 text-sm text-text-muted">
              Your basic contact details
            </p>
          </div>

          {isLoading ? (
            <p className="text-sm text-text-muted">Loading profile...</p>
          ) : (
            <div className="space-y-5">
              <div>
                <label className={labelClass} htmlFor="fullName">
                  <UserIcon size={15} /> Full name
                </label>
                <input
                  id="fullName"
                  value={profile.fullName}
                  onChange={(event) =>
                    updateField("fullName", event.target.value)
                  }
                  className={inputClass}
                  type="text"
                />
                {errors.fullName && (
                  <p className="mt-1 text-sm text-danger">{errors.fullName}</p>
                )}
              </div>

              {/* Email — account field, read only */}
              <div>
                <label className={labelClass} htmlFor="email">
                  <Mail size={15} /> Email
                </label>
                <input
                  id="email"
                  value={email}
                  readOnly
                  className="mt-2 min-h-11 w-full cursor-not-allowed rounded-xl border border-border bg-bg-muted px-4 text-sm text-text-muted outline-none"
                  type="email"
                />
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className={labelClass} htmlFor="phone">
                    <Phone size={15} /> Phone
                  </label>
                  <input
                    id="phone"
                    value={profile.phone}
                    onChange={(event) =>
                      updateField("phone", event.target.value)
                    }
                    className={inputClass}
                    type="tel"
                  />
                  {errors.phone && (
                    <p className="mt-1 text-sm text-danger">{errors.phone}</p>
                  )}
                </div>

                <div>
                  <label className={labelClass} htmlFor="dateOfBirth">
                    <Calendar size={15} /> Date of birth
                  </label>
                  <input
                    id="dateOfBirth"
                    value={profile.dateOfBirth}
                    onChange={(event) =>
                      updateField("dateOfBirth", event.target.value)
                    }
                    className={inputClass}
                    type="date"
                  />
                  {errors.dateOfBirth && (
                    <p className="mt-1 text-sm text-danger">
                      {errors.dateOfBirth}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className={labelClass} htmlFor="gender">
                  <UserIcon size={15} /> Gender
                </label>
                <select
                  id="gender"
                  value={profile.gender}
                  onChange={(event) =>
                    updateField("gender", event.target.value)
                  }
                  className={inputClass}
                >
                  <option value="">Select gender</option>
                  <option value="female">Female</option>
                  <option value="male">Male</option>
                  <option value="other">Other</option>
                  <option value="prefer_not_to_say">Prefer not to say</option>
                </select>
                {errors.gender && (
                  <p className="mt-1 text-sm text-danger">{errors.gender}</p>
                )}
              </div>

              <div>
                <label className={labelClass} htmlFor="address">
                  <MapPin size={15} /> Address
                </label>
                <input
                  id="address"
                  value={profile.address}
                  onChange={(event) =>
                    updateField("address", event.target.value)
                  }
                  className={inputClass}
                  type="text"
                />
                {errors.address && (
                  <p className="mt-1 text-sm text-danger">{errors.address}</p>
                )}
              </div>

              <div className="flex justify-end gap-3 border-t border-border-light pt-6">
                <button
                  type="button"
                  onClick={() => setErrors({})}
                  className="rounded-full border border-border bg-white px-5 py-2.5 text-sm font-semibold text-text-secondary transition hover:bg-bg-muted"
                >
                  Discard
                </button>
                <button
                  disabled={isSaving}
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  <CheckCircle2 size={16} />
                  {isSaving ? "Saving..." : "Save changes"}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
