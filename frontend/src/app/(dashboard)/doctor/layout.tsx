"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated, getRole } from "@/lib/auth";

export default function DoctorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
    const router = useRouter();
    const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!isAuthenticated()) {
      router.replace("/login");
      return;
    }
    if (getRole() !== "doctor") {
      router.replace("/login");
    }
  }, [router]);

  if (!mounted) return null;
  if (!isAuthenticated() || getRole() !== "doctor") return null;

  return <>{children}</>;
}