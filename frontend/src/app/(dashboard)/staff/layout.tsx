"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated, getRole } from "@/lib/auth";

export default function StaffLayout({
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
    if (getRole() !== "admin") {
      router.replace("/login");
    }
  }, [router]);

    if (!isAuthenticated() || getRole() !== "admin") return null;
    if (!mounted) return null;
    
  return <>{children}</>;
}