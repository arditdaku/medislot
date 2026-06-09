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
    if (!isAuthenticated()) {
      router.replace("/login");
      return;
    }
    if (getRole() !== "doctor") {
      router.replace("/login");
    }
  }, [router]);

  if (!isAuthenticated() || getRole() !== "doctor") return null;

  if (!mounted) return null;
    
  return <>{children}</>;
}