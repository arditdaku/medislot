"use client";
import { motion } from "framer-motion";
import SectionHeader from "../ui/sectionHeader";
import DashboardMockup from "./DashboardMockup";

export default function DashboardPreview() {
  return (
    <section id="dashboard" className="bg-[var(--color-bg-secondary)] px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <SectionHeader
          eyebrow="Dashboard"
          title="See every clinic signal without visual noise"
          description="A modern dashboard preview with appointment tables, weekly charts, calendar widgets, and patient stats."
        />
        <motion.div
          className="mt-12"
          initial={false}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.55 }}
        >
          <DashboardMockup />
        </motion.div>
      </div>
    </section>
  );
}
