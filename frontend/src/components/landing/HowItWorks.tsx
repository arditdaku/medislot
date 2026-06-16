"use client";

import { motion } from "framer-motion";
import Card from "../ui/card";
import SectionHeader from "../ui/sectionHeader";

const workflow = [
  {
    title: "Patients Book Online",
    description:
      "Patients choose appointment types, preferred providers, and open time slots in seconds.",
  },
  {
    title: "Clinic Confirms Appointment",
    description:
      "Your team reviews requests, confirms visits, and keeps calendars synchronized.",
  },
  {
    title: "Automatic Reminders Sent",
    description:
      "MediSlot sends SMS and email reminders before the appointment to reduce no-shows.",
  },
];

export default function HowItWorks() {
  return (
    <section id="workflow" className="bg-white px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <SectionHeader
          eyebrow="How it works"
          title="A simpler path from booking to arrival"
          description="Keep every appointment moving with clear patient actions and automated clinic workflows."
        />
        <div className="mt-14 grid gap-5 lg:grid-cols-3">
          {workflow.map((step, index) => {
            const stepNumber = String(index + 1).padStart(2, "0");

            return (
              <motion.div
                key={step.title}
                initial={false}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.12 }}
              >
                <Card className="relative h-full overflow-hidden p-7">
                  <span
                    aria-hidden
                    className="pointer-events-none absolute -top-2 right-2 select-none text-7xl font-bold leading-none text-[var(--color-primary-50)]"
                  >
                    {stepNumber}
                  </span>
                  <p className="relative text-sm font-bold uppercase tracking-wide text-[var(--color-primary)]">
                    Step {stepNumber}
                  </p>
                  <h3 className="relative mt-4 text-xl font-bold text-[var(--color-text-primary)]">
                    {step.title}
                  </h3>
                  <p className="relative mt-3 leading-7 text-[var(--color-text-secondary)]">
                    {step.description}
                  </p>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
