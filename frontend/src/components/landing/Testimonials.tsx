import { Star } from "lucide-react";
import Card from "../ui/card";
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
  return (
    <section className="bg-[var(--color-bg-secondary)] px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <SectionHeader
          eyebrow="Testimonials"
          title="Built for clinics that value patient trust"
          description="Healthcare leaders use MediSlot to create cleaner operations and smoother patient experiences."
        />
        <div className="mt-12 grid gap-5 lg:grid-cols-3">
          {testimonials.map((testimonial) => (
            <Card key={testimonial.name} className="p-6">
              <div
                className="flex gap-1 text-amber-400"
                aria-label={`${testimonial.rating} out of 5 stars`}
              >
                {Array.from({ length: testimonial.rating }, (_, index) => (
                  <Star key={index} size={17} fill="currentColor" />
                ))}
              </div>
              <blockquote className="mt-5 leading-8 text-[var(--color-secondary)]">
                &ldquo;{testimonial.quote}&rdquo;
              </blockquote>
              <div className="mt-6 flex items-center gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-full bg-[var(--color-primary-100)] font-bold text-[var(--color-primary)]">
                  {testimonial.initials}
                </div>
                <div>
                  <p className="font-bold text-[var(--color-secondary)]">
                    {testimonial.name}
                  </p>
                  <p className="text-sm text-[var(--color-secondary)]">
                    {testimonial.role}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
