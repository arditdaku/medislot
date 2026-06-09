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
      <div className="mx-auto max-w-7xl">
        <SectionHeader
          eyebrow="How it works"
          title="A simpler path from booking to arrival"
          description="Keep every appointment moving with clear patient actions and automated clinic workflows."
        />
        <div className="relative mt-14 grid gap-5 lg:grid-cols-3">
          <div className="absolute left-1/2 top-12 hidden h-px w-2/3 -translate-x-1/2 bg-[var(--color-border)] lg:block" />
          {workflow.map((step, index) => (
            <motion.div
              key={step.title}
              className="relative"
              initial={false}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.12 }}
            >
              <Card className="relative h-full p-7 text-center">
                <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[var(--color-primary)] text-lg font-bold text-[var(--color-white)]">
                  {index + 1}
                </span>
                <h3 className="mt-6 text-xl font-bold text-[var(--color-text-primary)]">
                  {step.title}
                </h3>
                <p className="mt-3 leading-7 text-[var(--color-text-secondary)]">
                  {step.description}
                </p>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
