"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import Button from "../ui/button";
import DashboardMockup from "./DashboardMockup";
import { fadeUp } from "./animations";
import MiniAppointmentCard from "./MiniAppointmentCard";

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-slate-50 px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
      <div className="absolute inset-0 -z-0 bg-[radial-gradient(circle_at_top_left,#e0f2fe,transparent_34%),radial-gradient(circle_at_bottom_right,#ccfbf1,transparent_30%)]" />
      <div className="relative mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[0.95fr_1.05fr]">
        <motion.div
          initial={false}
          animate="visible"
          variants={fadeUp}
          transition={{ duration: 0.6 }}
        >
          <p className="inline-flex rounded-full border border-sky-100 bg-white px-4 py-2 text-sm font-semibold text-[var(--color-primary)] shadow-sm">
            Trusted scheduling for modern healthcare teams
          </p>
          <h1 className="mt-6 max-w-4xl text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
            Modern Appointment Scheduling for Medical Clinics
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-[var(--color-secondary)]">
            Reduce no-shows, automate bookings, and improve patient experience
            with a scheduling platform built for clinics and private healthcare
            practices.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button className="sm:min-w-40">Start Free Trial</Button>
            <Button variant="secondary" className="sm:min-w-36">
              Book Demo
            </Button>
          </div>
          <div className="mt-8 flex flex-wrap gap-5 text-sm text-[var(--color-secondary)]">
            {["HIPAA-ready workflows", "Setup within a day"].map((item) => (
              <span key={item} className="inline-flex items-center gap-2">
                <Check className="h-4 w-4 text-teal-500" />
                {item}
              </span>
            ))}
          </div>
        </motion.div>
        <motion.div
          className="relative"
          initial={false}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.15 }}
        >
          <MiniAppointmentCard
            className="-left-4 top-12 z-10"
            title="Dr. Shah available"
            meta="3 openings today"
          />
          <MiniAppointmentCard
            className="-right-2 bottom-16 z-10"
            title="Reminder sent"
            meta="SMS to Ava Brooks"
          />
          <DashboardMockup compact />
        </motion.div>
      </div>
    </section>
  );
}
