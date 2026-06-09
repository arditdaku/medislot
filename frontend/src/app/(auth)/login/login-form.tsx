"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";

type Role = "Patient" | "Staff" | "Doctor";

const roles: Role[] = ["Patient", "Staff", "Doctor"];

const roleDashboardMap: Record<Role, string> = {
  Patient: "/dashboard/patient",
  Staff: "/dashboard/staff",
  Doctor: "/dashboard/doctor",
};

export default function LoginForm() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<Role>("Patient");
  const [formData, setFormData] = useState({
    email: "",
    password: "",
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
        const errorData = await response.json();
        throw new Error(errorData.detail || "Invalid email or password");
      }
      const data = await response.json();
      localStorage.setItem("token", data.access_token);
      toast.success("Logged in successfully");
      router.push(roleDashboardMap[selectedRole]);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Something went wrong"
      );
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
          <h2 className="text-xl font-bold text-[#111827]">Welcome back</h2>
          <p className="mt-1 text-xs text-[#4b5563]">
            Please sign in to your account
          </p>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="mb-5">
            <p className="mb-2 text-xs font-semibold text-[#111827]">I am a</p>
            <div className="grid grid-cols-3 gap-2">
              {roles.map((role) => {
                const active = selectedRole === role;
                return (
                  <button
                    key={role}
                    type="button"
                    onClick={() => setSelectedRole(role)}
                    className={`h-10 rounded-lg border text-xs font-medium transition ${
                      active
                        ? "border-[#5B6EF5] bg-[#eef1ff] text-[#5B6EF5]"
                        : "border-[#d1d5db] bg-white text-[#374151]"
                    }`}
                  >
                    {role}
                  </button>
                );
              })}
            </div>
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
          <div className="mb-6">
            <div className="mb-1 flex items-center justify-between">
              <label className="text-xs font-semibold text-[#111827]">
                Password
              </label>
              <Link
                href="/forgot-password"
                className="text-xs text-[#5B6EF5] hover:underline"
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
              className="h-10 w-full rounded-lg border border-[#d1d5db] px-3 text-xs outline-none transition focus:border-[#5B6EF5]"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="mb-5 h-10 w-full rounded-full bg-[#5B6EF5] text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
        <p className="text-center text-xs text-[#4b5563]">
          Don&apos;t have an account?{" "}
          <Link
            href="/register"
            className="font-semibold text-[#5B6EF5] hover:underline"
          >
            Sign up here
          </Link>
        </p>
      </div>
    </div>
  );
}