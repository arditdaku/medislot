"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import Card from "../ui/card";
import SectionHeader from "../ui/sectionHeader";

const faqs = [
  {
    question: "How secure is patient data?",
    answer:
      "MediSlot is designed with encrypted data transfer, role-based access, audit-friendly workflows, and healthcare-grade operational controls.",
  },
  {
    question: "Can patients book online?",
    answer:
      "Yes. Clinics can publish branded booking pages with appointment types, provider availability, and intake questions.",
  },
  {
    question: "Does it support multiple doctors?",
    answer:
      "Yes. You can manage provider schedules, availability rules, appointment types, and location assignments across your team.",
  },
  {
    question: "Is there SMS integration?",
    answer:
      "Yes. MediSlot supports SMS and email confirmations, reminders, cancellation notices, and follow-up messages.",
  },
  {
    question: "Can I customize appointment types?",
    answer:
      "Yes. Create appointment types with custom durations, buffers, provider rules, locations, and patient-facing instructions.",
  },
];

export default function FAQ() {
  const [active, setActive] = useState<number>(0);

  return (
    <section id="faq" className="bg-[var(--color-bg-secondary)] px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <SectionHeader
          eyebrow="FAQ"
          title="Questions clinics ask before switching"
          description="Clear answers about patient booking, reminders, customization, and security."
        />
        <div className="mt-10 space-y-3">
          {faqs.map((faq, index) => {
            const isOpen = active === index;

            return (
              <Card key={faq.question} className="overflow-hidden">
                <button
                  type="button"
                  onClick={() => setActive(isOpen ? -1 : index)}
                  className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left font-semibold text-[var(--color-text-primary)]"
                  aria-expanded={isOpen}
                >
                  {faq.question}
                  <ChevronDown
                    className={`h-5 w-5 flex-none text-[var(--color-text-muted)] transition ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <p className="px-5 pb-5 leading-7 text-[var(--color-text-secondary)]">
                        {faq.answer}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
