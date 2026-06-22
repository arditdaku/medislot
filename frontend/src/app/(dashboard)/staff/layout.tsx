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
    const init = () => {
      setMounted(true);
      if (!isAuthenticated()) {
        router.replace("/login");
        return;
      }
      if (getRole() !== "admin") {
        router.replace("/login");
      }
    };

    init();
  }, [router]);

  if (!mounted) return null;
  if (!isAuthenticated() || getRole() !== "admin") return null;

  return <>{children}</>;
}