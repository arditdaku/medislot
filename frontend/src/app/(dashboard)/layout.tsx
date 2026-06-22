"use client";

import { useEffect, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  CalendarPlus,
  CalendarCheck,
  User,
  Calendar,
  ClipboardList,
  Users,
  UserPlus,
  Layers,
  Clock,
  ListChecks,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { getRole, getUser, logout } from "@/lib/auth";

type NavLink = { label: string; href: string; icon: LucideIcon };

const NAV_LINKS: Record<string, NavLink[]> = {
  patient: [
    { label: "Dashboard", href: "/patient", icon: LayoutDashboard },
    { label: "Book Appointment", href: "/patient/book", icon: CalendarPlus },
    { label: "My Appointments", href: "/patient/appointments", icon: CalendarCheck },
    { label: "Profile", href: "/patient/profile", icon: User },
  ],
  doctor: [
  { label: "Dashboard", href: "/doctor", icon: LayoutDashboard },
  { label: "Appointments", href: "/doctor/appointments", icon: Calendar },
  { label: "Schedule", href: "/doctor/schedule", icon: Clock },
  { label: "Visits", href: "/doctor/visits", icon: ClipboardList },
  { label: "Profile", href: "/doctor/profile", icon: User },
],
  admin: [
    { label: "Dashboard", href: "/staff", icon: LayoutDashboard },
    { label: "Providers", href: "/staff/providers", icon: Users },
    { label: "Add Doctor", href: "/staff/providers/new", icon: UserPlus },
    { label: "Services", href: "/staff/services", icon: Layers },
    { label: "Slots", href: "/staff/slots", icon: Clock },
    { label: "Appointments", href: "/staff/appointments", icon: Calendar },
    { label: "Queue", href: "/staff/queue", icon: ListChecks },
  ],
};

const ROLE_LABELS: Record<string, string> = {
  patient: "Patient",
  doctor: "Doctor",
  admin: "Admin",
};

function initials(name?: string, email?: string): string {
  if (name) {
    const parts = name.trim().split(/\s+/);
    return (parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "");
  }
  return (email?.[0] ?? "U").toUpperCase();
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [role, setRole] = useState<string | null>(null);
  const [user, setUser] = useState<{ full_name?: string; name?: string; email?: string } | null>(
    null
  );
  const [collapsed, setCollapsed] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);

  useEffect(() => {
    const init = () => {
      setRole(getRole() ?? "patient");
      setUser(getUser() as { full_name?: string; name?: string; email?: string } | null);
    };

    init();
  }, []);

  const links = role ? NAV_LINKS[role] ?? NAV_LINKS.patient : [];
  const displayName = user?.full_name ?? user?.name ?? "";

  return (
    <div className="flex min-h-screen bg-bg-secondary">
      {/* Sidebar */}
      <aside
        className={`flex flex-col border-r border-border bg-light py-6 transition-all duration-300 ${
          collapsed ? "w-20 px-2" : "w-84 px-4"
        }`}
      >
        {/* Logo + toggle */}
        <div
          className={`flex items-center px-2 ${
            collapsed ? "justify-center" : "justify-between"
          }`}
        >
          {!collapsed && (
            <Image
              src="/logo.png"
              alt="MediSlot"
              width={160}
              height={40}
              priority
              className="h-11 w-auto"
            />
          )}
          <button
            onClick={() => setCollapsed((v) => !v)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="grid h-8 w-8 flex-none place-items-center rounded-lg bg-primary-50 text-primary transition hover:bg-primary-100"
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        {!collapsed && role && (
          <span className="mt-5 mr-2 self-end w-fit rounded-full bg-primary-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
            {ROLE_LABELS[role]}
          </span>
        )}

        {/* Menu */}
        {!collapsed && (
          <p className="mt-8 mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-text-muted">
            Menu
          </p>
        )}
        <nav className={`flex flex-1 flex-col gap-1 ${collapsed ? "mt-8" : ""}`}>
          {links.map(({ label, href, icon: Icon }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                title={collapsed ? label : undefined}
                className={`relative flex items-center rounded-xl py-2.5 text-sm transition ${
                  collapsed ? "justify-center px-0" : "gap-3 px-3"
                } ${
                  isActive
                    ? "bg-white font-semibold text-text-primary shadow-sm"
                    : "text-text-secondary hover:bg-bg-muted"
                }`}
              >
                {isActive && !collapsed && (
                  <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-full bg-primary" />
                )}
                <Icon
                  size={18}
                  className={isActive ? "text-primary" : "text-text-muted"}
                />
                {!collapsed && label}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="mt-4 border-t border-border-light pt-4">
          <button
            onClick={() => setConfirmLogout(true)}
            title={collapsed ? "Logout" : undefined}
            className={`flex w-full items-center rounded-xl py-2.5 text-sm font-medium text-danger transition hover:bg-danger-light ${
              collapsed ? "justify-center px-0" : "gap-3 px-3 text-left"
            }`}
          >
            <LogOut size={18} />
            {!collapsed && "Logout"}
          </button>
        </div>

        {/* User card */}
        {(displayName || user?.email) && (
          <div
            className={`mt-4 flex items-center rounded-2xl border border-border bg-white ${
              collapsed ? "justify-center p-2" : "gap-3 px-3 py-3"
            }`}
          >
            <span className="grid h-9 w-9 flex-none place-items-center rounded-full bg-primary-100 text-xs font-bold text-primary">
              {initials(displayName, user?.email)}
            </span>
            {!collapsed && (
              <div className="min-w-0">
                {displayName && (
                  <p className="truncate text-sm font-semibold text-text-primary">
                    {displayName}
                  </p>
                )}
                {user?.email && (
                  <p className="truncate text-xs text-text-muted">{user.email}</p>
                )}
              </div>
            )}
          </div>
        )}
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8">{children}</main>

      {/* Logout confirmation */}
      {confirmLogout && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-navy/40 p-4"
          onClick={() => setConfirmLogout(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 grid h-12 w-12 place-items-center rounded-full bg-danger-light text-danger">
              <LogOut size={22} />
            </div>
            <h3 className="text-lg font-bold text-text-primary">Log out?</h3>
            <p className="mt-1 text-sm text-text-secondary">
              Are you sure you want to log out of your account?
            </p>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setConfirmLogout(false)}
                className="flex-1 rounded-full border border-border bg-white py-2.5 text-sm font-semibold text-text-secondary transition hover:bg-bg-muted"
              >
                Cancel
              </button>
              <button
                onClick={() => logout()}
                className="flex-1 rounded-full bg-danger py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
              >
                Log out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
