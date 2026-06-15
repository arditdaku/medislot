"use client";

import { FormEvent, useEffect, useState } from "react";

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

export default function PatientProfilePage() {
  const [profile, setProfile] = useState<PatientProfile>(emptyProfile);
  const [errors, setErrors] = useState<Partial<PatientProfile>>({});
  const [toast, setToast] = useState<ToastState>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

  useEffect(() => {
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
          dateOfBirth: data.dateOfBirth ?? data.date_of_birth ?? "",
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
          date_of_birth: profile.dateOfBirth,
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

  return (
    <main className="min-h-screen bg-background px-6 py-8 text-foreground">
      <section className="mx-auto max-w-3xl">
        <div className="mb-8">
          <p className="text-sm font-medium text-primary">Patient Profile</p>
          <h1 className="mt-2 text-3xl font-bold">My profile</h1>
          <p className="mt-2 text-muted-foreground">
            View and update your personal information.
          </p>
        </div>

        {toast && (
          <div
            className={`mb-6 rounded-md border px-4 py-3 text-sm font-medium ${
              toast.type === "success"
                ? "border-primary/30 bg-primary/10 text-primary"
                : "border-destructive/30 bg-destructive/10 text-destructive"
            }`}
          >
            {toast.message}
          </div>
        )}

        <form
          onSubmit={handleSave}
          className="rounded-lg border border-border bg-card p-6 text-card-foreground shadow-sm"
        >
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading profile...</p>
          ) : (
            <div className="space-y-5">
              <div>
                <label className="text-sm font-medium" htmlFor="fullName">
                  Full name
                </label>
                <input
                  id="fullName"
                  value={profile.fullName}
                  onChange={(event) =>
                    updateField("fullName", event.target.value)
                  }
                  className="mt-2 min-h-11 w-full rounded-md border border-input bg-background px-4 text-sm outline-none focus:border-primary"
                  type="text"
                />
                {errors.fullName && (
                  <p className="mt-1 text-sm text-destructive">
                    {errors.fullName}
                  </p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium" htmlFor="phone">
                  Phone
                </label>
                <input
                  id="phone"
                  value={profile.phone}
                  onChange={(event) => updateField("phone", event.target.value)}
                  className="mt-2 min-h-11 w-full rounded-md border border-input bg-background px-4 text-sm outline-none focus:border-primary"
                  type="tel"
                />
                {errors.phone && (
                  <p className="mt-1 text-sm text-destructive">
                    {errors.phone}
                  </p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium" htmlFor="address">
                  Address
                </label>
                <input
                  id="address"
                  value={profile.address}
                  onChange={(event) =>
                    updateField("address", event.target.value)
                  }
                  className="mt-2 min-h-11 w-full rounded-md border border-input bg-background px-4 text-sm outline-none focus:border-primary"
                  type="text"
                />
                {errors.address && (
                  <p className="mt-1 text-sm text-destructive">
                    {errors.address}
                  </p>
                )}
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium" htmlFor="dateOfBirth">
                    Date of birth
                  </label>
                  <input
                    id="dateOfBirth"
                    value={profile.dateOfBirth}
                    onChange={(event) =>
                      updateField("dateOfBirth", event.target.value)
                    }
                    className="mt-2 min-h-11 w-full rounded-md border border-input bg-background px-4 text-sm outline-none focus:border-primary"
                    type="date"
                  />
                  {errors.dateOfBirth && (
                    <p className="mt-1 text-sm text-destructive">
                      {errors.dateOfBirth}
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium" htmlFor="gender">
                    Gender
                  </label>
                  <select
                    id="gender"
                    value={profile.gender}
                    onChange={(event) =>
                      updateField("gender", event.target.value)
                    }
                    className="mt-2 min-h-11 w-full rounded-md border border-input bg-background px-4 text-sm outline-none focus:border-primary"
                  >
                    <option value="">Select gender</option>
                    <option value="female">Female</option>
                    <option value="male">Male</option>
                    <option value="other">Other</option>
                    <option value="prefer_not_to_say">Prefer not to say</option>
                  </select>
                  {errors.gender && (
                    <p className="mt-1 text-sm text-destructive">
                      {errors.gender}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  disabled={isSaving}
                  type="submit"
                  className="rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isSaving ? "Saving..." : "Save changes"}
                </button>
              </div>
            </div>
          )}
        </form>
      </section>
    </main>
  );
}