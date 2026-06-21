"use client";

import React, { useState } from "react";
import { ChevronLeft, AlertCircle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { login } from "@/lib/auth";

const roleDashboardMap: Record<string, string> = {
  patient: "/patient",
  admin: "/staff",
  doctor: "/doctor",
};

export default function LoginForm() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Clear the error as soon as the user edits a field.
    setError(null);
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    try {
      setLoading(true);
      const response = await fetch("http://localhost:8000/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });

      if (!response.ok) {
        // Industry-standard wording: never reveal which field was wrong.
        setError(
          response.status === 401
            ? "Your email or password is incorrect."
            : "Something went wrong. Please try again."
        );
        return;
      }

      const data = await response.json();
      login(data.access_token, data.role, { email: formData.email });
      toast.success("Logged in successfully");
      const dashboard = roleDashboardMap[data.role] ?? "/login";
      router.push(dashboard);
    } catch {
      setError("Couldn't reach the server. Please try again.");
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
        <ChevronLeft size={21}  />
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
          <h2 className="text-xl font-bold text-text-primary">Welcome back</h2>
          <p className="mt-1 text-xs text-text-muted">
            Please sign in to your account
          </p>
        </div>

        <form onSubmit={handleSubmit}>
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
              aria-invalid={error ? true : undefined}
              className={`h-10 w-full rounded-lg border bg-bg-primary px-3 text-xs text-text-primary outline-none transition focus:border-primary ${
                error ? "border-danger" : "border-border"
              }`}
            />
          </div>

          {/* Password */}
          <div className="mb-6">
            <div className="mb-1 flex items-center justify-between">
              <label className="text-xs font-semibold text-text-primary">
                Password
              </label>
              <Link
                href="/forgot-password"
                className="text-xs text-primary hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              required
              aria-invalid={error ? true : undefined}
              className={`h-10 w-full rounded-lg border bg-bg-primary px-3 text-xs text-text-primary outline-none transition focus:border-primary ${
                error ? "border-danger" : "border-border"
              }`}
            />
            {error && (
              <p
                role="alert"
                className="mt-2 flex items-center gap-1.5 text-xs font-medium text-danger"
              >
                <AlertCircle size={13} className="flex-none" />
                {error}
              </p>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="mb-5 h-10 w-full rounded-full bg-primary text-sm font-semibold text-white transition hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="text-center text-xs text-text-muted">
          Don&apos;t have an account?{" "}
          <Link
            href="/register"
            className="font-semibold text-primary hover:underline"
          >
            Sign up here
          </Link>
        </p>
      </div>
    </div>
  );
}