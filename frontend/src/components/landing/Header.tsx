"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import Button from "../ui/button";
import Logo from "./Logo";

const navItems = ["Features", "Workflow", "Pricing", "FAQ"];

export default function Header() {
  const [open, setOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("");

  useEffect(() => {
    const sections = navItems
      .map((item) => document.getElementById(item.toLowerCase()))
      .filter((section): section is HTMLElement => section !== null);

    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

        if (visible[0]) {
          setActiveSection(visible[0].target.id);
        }
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: [0, 0.25, 0.5, 1] }
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--color-border)]/70 bg-white/85 backdrop-blur-xl">
      <nav
        className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8"
        aria-label="Main navigation"
      >
        <Logo />
        <div className="hidden items-center gap-8 lg:flex">
          {navItems.map((item) => {
            const isActive = activeSection === item.toLowerCase();
            return (
              <a
                key={item}
                href={`#${item.toLowerCase()}`}
                aria-current={isActive ? "true" : undefined}
                className={`text-sm font-medium transition hover:text-[var(--color-primary)] ${
                  isActive
                    ? "text-[var(--color-primary)]"
                    : "text-[var(--color-secondary)]"
                }`}
              >
                {item}
              </a>
            );
          })}
        </div>
        <div className="hidden items-center gap-2 lg:flex">
          <Link href="/login">
            <Button variant="secondary">Login</Button>
          </Link>
          <Link href="/register">
            <Button variant="primary">Create Account</Button>
          </Link>
        </div>
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="grid h-11 w-11 place-items-center rounded-full border border-[var(--color-border)] text-[var(--color-secondary)] lg:hidden"
          aria-expanded={open}
          aria-label="Toggle menu"
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </nav>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-[var(--color-border)] bg-white px-4 py-4 lg:hidden"
          >
            <div className="flex flex-col gap-2">
              {navItems.map((item) => {
                const isActive = activeSection === item.toLowerCase();
                return (
                  <a
                    key={item}
                    href={`#${item.toLowerCase()}`}
                    onClick={() => setOpen(false)}
                    aria-current={isActive ? "true" : undefined}
                    className={`rounded-2xl px-3 py-3 text-sm font-medium hover:bg-[var(--color-border-light)] ${
                      isActive
                        ? "bg-[var(--color-primary-50)] text-[var(--color-primary)]"
                        : "text-[var(--color-secondary)]"
                    }`}
                  >
                    {item}
                  </a>
                );
              })}
              <div className="mt-2 grid grid-cols-2 gap-2">
                <Link href="/login" className="w-full">
                  <Button variant="secondary" className="w-full">Login</Button>
                </Link>
                <Link href="/register" className="w-full">
                  <Button variant="secondary" className="w-full">Create Account</Button>
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
