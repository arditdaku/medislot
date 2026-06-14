"use client";

import { useState } from "react";

type PatientProfile = {
  fullName: string;
  phone: string;
  address: string;
  dateOfBirth: string;
  gender: string;
};

const emptyProfile: PatientProfile = {
  fullName: "",
  phone: "",
  address: "",
  dateOfBirth: "",
  gender: "",
};

export default function PatientProfilePage() {
  const [profile, setProfile] = useState<PatientProfile>(emptyProfile);

  const updateField = (field: keyof PatientProfile, value: string) => {
    setProfile((currentProfile) => ({
      ...currentProfile,
      [field]: value,
    }));
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

        <form className="rounded-lg border border-border bg-card p-6 text-card-foreground shadow-sm">
          <div className="space-y-5">
            <div>
              <label className="text-sm font-medium" htmlFor="fullName">
                Full name
              </label>
              <input
                id="fullName"
                value={profile.fullName}
                onChange={(event) => updateField("fullName", event.target.value)}
                className="mt-2 min-h-11 w-full rounded-md border border-input bg-background px-4 text-sm outline-none focus:border-primary"
                type="text"
              />
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
            </div>

            <div>
              <label className="text-sm font-medium" htmlFor="address">
                Address
              </label>
              <input
                id="address"
                value={profile.address}
                onChange={(event) => updateField("address", event.target.value)}
                className="mt-2 min-h-11 w-full rounded-md border border-input bg-background px-4 text-sm outline-none focus:border-primary"
                type="text"
              />
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
              </div>

              <div>
                <label className="text-sm font-medium" htmlFor="gender">
                  Gender
                </label>
                <select
                  id="gender"
                  value={profile.gender}
                  onChange={(event) => updateField("gender", event.target.value)}
                  className="mt-2 min-h-11 w-full rounded-md border border-input bg-background px-4 text-sm outline-none focus:border-primary"
                >
                  <option value="">Select gender</option>
                  <option value="female">Female</option>
                  <option value="male">Male</option>
                  <option value="other">Other</option>
                  <option value="prefer_not_to_say">Prefer not to say</option>
                </select>
              </div>
            </div>
          </div>
        </form>
      </section>
    </main>
  );
}