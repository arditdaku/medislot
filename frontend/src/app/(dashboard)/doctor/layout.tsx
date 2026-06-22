"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated, getRole } from "@/lib/auth";
import { ToastProvider } from "@/components/ui/toast-provider";

export default function DoctorLayout({
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
      if (getRole() !== "doctor") {
        router.replace("/login");
      }
    };

    init();
  }, [router]);

  if (!mounted) return null;
  if (!isAuthenticated() || getRole() !== "doctor") return null;

  return (
    <>
      <ToastProvider />
      {children}
    </>
  );
}