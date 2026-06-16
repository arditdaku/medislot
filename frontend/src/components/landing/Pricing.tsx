import { CheckCircle2 } from "lucide-react";
import SectionHeader from "../ui/sectionHeader";

const pricingPlans = [
  {
    name: "Starter",
    price: "$15",
    description: "For small practices getting online booking in place.",
    cta: "Start Free Trial",
    features: ["1 location", "3 providers", "Online booking page", "Email reminders"],
  },
  {
    name: "Professional",
    price: "$50",
    description: "For growing clinics that need automation and reporting.",
    popular: true,
    cta: "Start Free Trial",
    features: [
      "Up to 3 locations",
      "15 providers",
      "SMS and email reminders",
      "Analytics dashboard",
      "Patient profiles",
    ],
  },
  {
    name: "Enterprise",
    price: "Custom",
    description: "For larger healthcare groups with advanced workflows.",
    cta: "Contact Sales",
    features: [
      "Unlimited locations",
      "Custom permissions",
      "Priority onboarding",
      "API access",
      "Dedicated support",
    ],
  },
];

export default function Pricing() {
  return (
    <section id="pricing" className="bg-white px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <SectionHeader
          eyebrow="Pricing"
          title="Plans that scale with your practice"
          description="Start with core scheduling and add automation, reporting, and enterprise controls as your clinic grows."
        />
        <div className="mt-14 grid items-stretch gap-6 lg:grid-cols-3">
          {pricingPlans.map((plan) => {
            const isPopular = plan.popular;

            return (
              <div
                key={plan.name}
                className={`relative flex flex-col rounded-3xl border p-8 transition duration-300 ${
                  isPopular
                    ? "border-transparent bg-[var(--color-navy)] text-[var(--color-white)] shadow-2xl shadow-[var(--color-navy)]/30 lg:-mt-4 lg:mb-4"
                    : "border-[var(--color-border)] bg-white text-[var(--color-text-primary)] shadow-xl shadow-[var(--color-border)]/60"
                }`}
              >
                {isPopular && (
                  <span className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-[var(--color-primary)] px-4 py-1.5 text-xs font-bold text-[var(--color-white)] shadow-lg shadow-[var(--color-primary)]/30">
                    Most popular
                  </span>
                )}

                <h3 className="text-xl font-bold">{plan.name}</h3>
                <p
                  className={`mt-2 min-h-12 text-sm leading-6 ${
                    isPopular
                      ? "text-[var(--color-primary-100)]"
                      : "text-[var(--color-text-secondary)]"
                  }`}
                >
                  {plan.description}
                </p>

                <div className="mt-6 flex items-end gap-1">
                  <span className="text-5xl font-bold tracking-tight">
                    {plan.price}
                  </span>
                  {plan.price !== "Custom" && (
                    <span
                      className={`pb-2 text-sm ${
                        isPopular
                          ? "text-[var(--color-primary-100)]"
                          : "text-[var(--color-text-muted)]"
                      }`}
                    >
                      /mo
                    </span>
                  )}
                </div>

                <ul className="mt-8 space-y-4">
                  {plan.features.map((feature) => (
                    <li
                      key={feature}
                      className={`flex items-center gap-3 text-sm ${
                        isPopular
                          ? "text-[var(--color-primary-50)]"
                          : "text-[var(--color-text-secondary)]"
                      }`}
                    >
                      <CheckCircle2
                        className={`h-5 w-5 flex-none ${
                          isPopular
                            ? "text-[var(--color-primary-200)]"
                            : "text-[var(--color-primary)]"
                        }`}
                      />
                      {feature}
                    </li>
                  ))}
                </ul>

                <div className="mt-auto pt-8">
                  <button
                    className={`inline-flex min-h-12 w-full items-center justify-center rounded-full px-5 py-3 text-sm font-semibold transition duration-200 ${
                      isPopular
                        ? "bg-[var(--color-primary)] text-[var(--color-white)] hover:bg-[var(--color-primary-600)]"
                        : "border border-[var(--color-border)] bg-white text-[var(--color-text-primary)] hover:border-[var(--color-primary)] hover:bg-[var(--color-primary-50)]"
                    }`}
                  >
                    {plan.cta}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
