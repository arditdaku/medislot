"use client";

import React, { useState } from "react";
import { ChevronLeft } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";

export default function RegisterForm() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch("http://localhost:8000/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: formData.fullName,
          email: formData.email,
          password: formData.password,
          role: "patient",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to create account");
      }

      toast.success("Account created successfully");
      router.push("/login");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-bg-secondary flex items-center justify-center px-4 py-6">

      {/* Back to home */}
      <Link
        href="/"
        className="absolute left-6 top-6 inline-flex items-center gap-1 text-md font-medium text-text-secondary transition hover:text-primary"
      >
        <ChevronLeft size={21} />
        <span className="leading-none">Back</span>
      </Link>

      <div className="w-full max-w-[400px] rounded-xl border border-border bg-bg-primary px-7 py-8 shadow-sm">

        {/* Logo */}
        <div className="mb-6">
          <Image
            src="/logo.png"
            alt="MediSlot"
            width={160}
            height={40}
            priority
            className="h-9 w-auto"
          />
        </div>

        {/* Title */}
        <div className="mb-6">
          <h2 className="text-xl font-bold text-text-primary">Create Account</h2>
          <p className="mt-1 text-xs text-text-muted">
            Please sign up to book appointment
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Full Name */}
          <div className="mb-4">
            <label className="mb-1 block text-xs font-semibold text-text-primary">
              Full name
            </label>
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              placeholder="Jane Doe"
              required
              className="h-10 w-full rounded-lg border border-border bg-bg-primary px-3 text-xs text-text-primary outline-none transition focus:border-primary"
            />
          </div>

          {/* Email */}
          <div className="mb-4">
            <label className="mb-1 block text-xs font-semibold text-text-primary">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="you@clinic.com"
              required
              className="h-10 w-full rounded-lg border border-border bg-bg-primary px-3 text-xs text-text-primary outline-none transition focus:border-primary"
            />
          </div>

          {/* Password */}
          <div className="mb-4">
            <label className="mb-1 block text-xs font-semibold text-text-primary">
              Password
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              required
              className="h-10 w-full rounded-lg border border-border bg-bg-primary px-3 text-xs text-text-primary outline-none transition focus:border-primary"
            />
          </div>

          {/* Confirm Password */}
          <div className="mb-6">
            <label className="mb-1 block text-xs font-semibold text-text-primary">
              Confirm Password
            </label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="••••••••"
              required
              className="h-10 w-full rounded-lg border border-border bg-bg-primary px-3 text-xs text-text-primary outline-none transition focus:border-primary"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="mb-5 h-10 w-full rounded-full bg-primary text-sm font-semibold text-white transition hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? "Creating..." : "Create account"}
          </button>
        </form>

        <p className="text-center text-xs text-text-muted">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-semibold text-primary hover:underline"
          >
            Login here
          </Link>
        </p>
      </div>
    </div>
  );
}