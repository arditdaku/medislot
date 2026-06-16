"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Quote, Star } from "lucide-react";
import SectionHeader from "../ui/sectionHeader";

const testimonials = [
  {
    name: "Dr. Elena Morris",
    role: "Owner, Morris Family Clinic",
    quote:
      "MediSlot made our front desk calmer within the first week. Patients book faster, and our confirmation flow finally feels predictable.",
    initials: "EM",
    rating: 5,
  },
  {
    name: "Marcus Lee",
    role: "Operations Director, Harbor Medical",
    quote:
      "The multi-location scheduling tools are excellent. We can see capacity, provider utilization, and cancellations without spreadsheet work.",
    initials: "ML",
    rating: 5,
  },
  {
    name: "Dr. Priya Shah",
    role: "Clinic Founder, Wellpath Care",
    quote:
      "Automated reminders helped us cut missed appointments significantly while giving patients a more professional experience.",
    initials: "PS",
    rating: 5,
  },
];

export default function Testimonials() {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(0);

  const paginate = (next: number) => {
    setDirection(next);
    setIndex((current) => (current + next + testimonials.length) % testimonials.length);
  };

  const active = testimonials[index];

  return (
    <section className="bg-[var(--color-bg-secondary)] px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <SectionHeader
          eyebrow="Testimonials"
          title="Built for clinics that value patient trust"
          description="Healthcare leaders use MediSlot to create cleaner operations and smoother patient experiences."
        />

        <div className="mt-12 flex items-center gap-4 sm:gap-6">
          <button
            onClick={() => paginate(-1)}
            aria-label="Previous testimonial"
            className="grid h-12 w-12 flex-none place-items-center rounded-full border border-[var(--color-border)] bg-white text-[var(--color-text-secondary)] shadow-sm transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
          >
            <ChevronLeft size={20} />
          </button>

          <div className="relative flex min-h-[320px] flex-1 overflow-hidden">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={index}
                custom={direction}
                initial={{ opacity: 0, x: direction >= 0 ? 60 : -60 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: direction >= 0 ? -60 : 60 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className="flex w-full flex-col justify-center rounded-1xl border border-[var(--color-border)] bg-white p-8 shadow-xl shadow-[var(--color-border)]/60 sm:p-10"
              >
                <Quote
                  className="h-10 w-10 text-[var(--color-primary-200)]"
                  fill="currentColor"
                />

                <div
                  className="mt-5 flex gap-1 text-amber-400"
                  aria-label={`${active.rating} out of 5 stars`}
                >
                  {Array.from({ length: active.rating }, (_, starIndex) => (
                    <Star key={starIndex} size={18} fill="currentColor" />
                  ))}
                </div>

                <blockquote className="mt-4 text-lg leading-8 text-[var(--color-text-primary)] sm:text-xl">
                  &ldquo;{active.quote}&rdquo;
                </blockquote>

                <div className="mt-7 flex items-center gap-3">
                  <div className="grid h-12 w-12 flex-none place-items-center rounded-full bg-[var(--color-primary-100)] font-bold text-[var(--color-primary)]">
                    {active.initials}
                  </div>
                  <div>
                    <p className="font-bold text-[var(--color-text-primary)]">
                      {active.name}
                    </p>
                    <p className="text-sm text-[var(--color-text-secondary)]">
                      {active.role}
                    </p>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          <button
            onClick={() => paginate(1)}
            aria-label="Next testimonial"
            className="grid h-12 w-12 flex-none place-items-center rounded-full border border-[var(--color-border)] bg-white text-[var(--color-text-secondary)] shadow-sm transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Dots */}
        <div className="mt-8 flex justify-center gap-2">
          {testimonials.map((testimonial, dotIndex) => (
            <button
              key={testimonial.name}
              onClick={() => {
                setDirection(dotIndex > index ? 1 : -1);
                setIndex(dotIndex);
              }}
              aria-label={`Go to testimonial ${dotIndex + 1}`}
              className={`h-2 rounded-full transition-all duration-300 ${
                dotIndex === index
                  ? "w-6 bg-[var(--color-primary)]"
                  : "w-2 bg-[var(--color-border)] hover:bg-[var(--color-primary-200)]"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
