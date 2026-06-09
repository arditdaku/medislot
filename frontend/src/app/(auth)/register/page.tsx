"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";

export default function RegisterForm() {
  const router = useRouter();

  const [selectedRole, setSelectedRole] = useState<Role>("Patient");

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
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          full_name: formData.fullName,
          email: formData.email,
          password: formData.password,
          role: selectedRole,
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
    <div className="min-h-screen bg-[#f3f4f6] flex items-center justify-center px-4 py-6">
      <div className="w-full max-w-[400px] rounded-[18px] border border-[#e5e7eb] bg-white px-7 py-8 shadow-sm">
        <div className="mb-6">
          <h1 className="text-2xl font-extrabold leading-none tracking-tight">
            <span className="text-[#5B6EF5]">Medi</span>
            <span className="text-[#111827]">Slot</span>
          </h1>
        </div>

        <div className="mb-6">
          <h2 className="text-xl font-bold text-[#111827]">Create Account</h2>
          <p className="mt-1 text-xs text-[#4b5563]">
            Please sign up to book appointment
          </p>
        </div>

        <form onSubmit={handleSubmit}>       

          <div className="mb-4">
            <label className="mb-1 block text-xs font-semibold text-[#111827]">
              Full name
            </label>
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              placeholder="Jane Doe"
              required
              className="h-10 w-full rounded-lg border border-[#d1d5db] px-3 text-xs outline-none transition focus:border-[#5B6EF5]"
            />
          </div>

          <div className="mb-4">
            <label className="mb-1 block text-xs font-semibold text-[#111827]">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="you@clinic.com"
              required
              className="h-10 w-full rounded-lg border border-[#d1d5db] px-3 text-xs outline-none transition focus:border-[#5B6EF5]"
            />
          </div>

          <div className="mb-4">
            <label className="mb-1 block text-xs font-semibold text-[#111827]">
              Password
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              required
              className="h-10 w-full rounded-lg border border-[#d1d5db] px-3 text-xs outline-none transition focus:border-[#5B6EF5]"
            />
          </div>

          <div className="mb-6">
            <label className="mb-1 block text-xs font-semibold text-[#111827]">
              Confirm Password
            </label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="••••••••"
              required
              className="h-10 w-full rounded-lg border border-[#d1d5db] px-3 text-xs outline-none transition focus:border-[#5B6EF5]"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mb-5 h-10 w-full rounded-full bg-[#5B6EF5] text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? "Creating..." : "Create account"}
          </button>
        </form>

        <p className="text-center text-xs text-[#4b5563]">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-semibold text-[#5B6EF5] hover:underline"
          >
            Login here
          </Link>
        </p>
      </div>
    </div>
  );
}