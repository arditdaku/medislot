"use client";

import { motion } from "framer-motion";
import {
  BarChart3,
  BellRing,
  Building2,
  CalendarCheck,
  Clock3,
  UsersRound,
} from "lucide-react";
import Card from "../ui/card";
import SectionHeader from "../ui/sectionHeader";
import { fadeUp } from "./animations";

const features = [
  {
    icon: CalendarCheck,
    title: "Online Appointment Booking",
    description:
      "Let patients book from any device with clinic rules, appointment types, and intake details built in.",
  },
  {
    icon: BellRing,
    title: "Automated SMS & Email Reminders",
    description:
      "Send timely confirmations, reminders, and follow-ups that reduce missed appointments.",
  },
  {
    icon: Clock3,
    title: "Doctor Availability Management",
    description:
      "Coordinate provider schedules, buffer times, lunch breaks, and room availability from one place.",
  },
  {
    icon: Building2,
    title: "Multi-Location Clinic Support",
    description:
      "Manage multiple branches, providers, services, and calendars without operational clutter.",
  },
  {
    icon: UsersRound,
    title: "Patient Management",
    description:
      "Keep patient profiles, booking history, notes, and communication preferences easy to find.",
  },
  {
    icon: BarChart3,
    title: "Analytics & Reporting",
    description:
      "Track bookings, no-shows, provider utilization, and clinic performance with clean reports.",
  },
];

export default function Features() {
  return (
    <section id="features" className="bg-[var(--color-bg-secondary)] px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <SectionHeader
          eyebrow="Features" 
          title="Everything your clinic needs to keep calendars healthy"
          description="MediSlot brings booking, reminders, provider availability, patient context, and reporting into one calm operating system."
        />
        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => {
            const Icon = feature.icon;

            return (
              <motion.article
                key={feature.title}
                variants={fadeUp}
                initial={false}
                whileInView="visible"
                viewport={{ once: true, amount: 0.25 }}
                transition={{ duration: 0.45, delay: index * 0.04 }}
              >
                <Card className="h-full p-6 hover:-translate-y-1 hover:shadow-2xl hover:shadow-[var(--color-primary-100)]">
                  <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[var(--color-primary-50)] text-[var(--color-primary)]">
                    <Icon size={23} />
                  </div>
                  <h3 className="mt-5 text-lg font-bold text-dark">
                    {feature.title}
                  </h3>
                  <p className="mt-3 leading-7 text-[var(--color-text-secondary)]">
                    {feature.description}
                  </p>
                </Card>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
