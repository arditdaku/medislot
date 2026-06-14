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
      </section>
    </main>
  );
}