"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import Button from "../ui/button";
import Logo from "./Logo";

const navItems = ["Features", "Workflow", "Pricing", "FAQ"];

export default function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--color-border)]/70 bg-white/85 backdrop-blur-xl">
      <nav
        className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8"
        aria-label="Main navigation"
      >
        <Logo />
        <div className="hidden items-center gap-8 lg:flex">
          {navItems.map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase()}`}
              className="text-sm font-medium text-[var(--color-secondary)] transition hover:text-[var(--color-primary)]"
            >
              {item}
            </a>
          ))}
        </div>
        <div className="hidden items-center gap-2 lg:flex">
          <Link href="/login">
            <Button variant="secondary">Login</Button>
          </Link>
          <Link href="/register">
            <Button variant="primary">Create Account</Button>
          </Link>
          {/* <Button variant="secondary">Book Demo</Button> */}
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
              {navItems.map((item) => (
                <a
                  key={item}
                  href={`#${item.toLowerCase()}`}
                  onClick={() => setOpen(false)}
                  className="rounded-2xl px-3 py-3 text-sm font-medium text-[var(--color-secondary)] hover:bg-[var(--color-border-light)]"
                >
                  {item}
                </a>
              ))}
              <div className="mt-2 grid grid-cols-2 gap-2">
                <Link href="/login">
                  <Button variant="secondary">Login</Button>
                </Link>
                <Link href="/register">
                  <Button variant="secondary">Create Account</Button>
                </Link>
                <Button variant="secondary" className="col-span-2">Book Demo</Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
