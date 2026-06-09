"use client";

import { motion } from "framer-motion";
import {
  Check,
  DatabaseZap,
  FileText,
  HeartPulse,
  Stethoscope,
} from "lucide-react";
import Card from "../ui/card";

const benefits = [
  "Reduce administrative workload",
  "Increase patient retention",
  "Fewer missed appointments",
  "Better clinic organization",
];

const illustrationCards = [
  { icon: Stethoscope, title: "Provider capacity", value: "87%" },
  { icon: HeartPulse, title: "Patient satisfaction", value: "96%" },
  { icon: DatabaseZap, title: "Hours saved monthly", value: "42" },
  { icon: FileText, title: "Digital intake forms", value: "1,920" },
];

export default function Benefits() {
  return (
    <section className="bg-white px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-2">
        <motion.div
          initial={false}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
        >
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-navy)]">
            Benefits
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-[var(--color-secondary)] sm:text-4xl">
            Give your team fewer manual tasks and better daily rhythm
          </h2>
          <p className="mt-5 leading-8 text-[var(--color-secondary)]">
            MediSlot helps teams replace phone tag, missed reminders, and
            fragmented scheduling with one dependable appointment workflow.
          </p>
          <ul className="mt-8 space-y-4">
            {benefits.map((benefit) => (
              <li
                key={benefit}
                className="flex items-center gap-3 text-[var(--color-secondary)]"
              >
                <span className="grid h-7 w-7 place-items-center rounded-full bg-[var(--color-navy-50)] text-[var(--color-navy)]">
                  <Check size={16} />
                </span>
                <span className="font-medium">{benefit}</span>
              </li>
            ))}
          </ul>
        </motion.div>
        <motion.div
          className="relative grid gap-4 sm:grid-cols-2"
          initial={false}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
        >
          {illustrationCards.map((item, index) => {
            const Icon = item.icon;
            return (
              <Card
                key={item.title}
                className={`p-6 ${index % 2 ? "sm:translate-y-8" : ""}`}
              >
                <Icon className="h-8 w-8 text-[var(--color-primary)]" />
                <p className="mt-8 text-3xl font-bold text-[var(--color-text-primary)]">
                  {item.value}
                </p>
                <p className="mt-2 text-sm font-medium text-[var(--color-text-muted)]">
                  {item.title}
                </p>
              </Card>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
