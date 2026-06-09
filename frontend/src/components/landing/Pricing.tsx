import { Check } from "lucide-react";
import Button from "../ui/button";
import Card from "../ui/card";
import SectionHeader from "../ui/sectionHeader";

const pricingPlans = [
  {
    name: "Starter",
    price: "$15",
    description: "For small practices getting online booking in place.",
    features: ["1 location", "3 providers", "Online booking page", "Email reminders"],
  },
  {
    name: "Professional",
    price: "$50",
    description: "For growing clinics that need automation and reporting.",
    popular: true,
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
    <section
      id="pricing"
      className="bg-white px-4 py-20 sm:px-6 lg:px-8"
    >
      <div className="mx-auto max-w-7xl">
        <SectionHeader
          eyebrow="Pricing"
          title="Plans that scale with your practice"
          description="Start with core scheduling and add automation, reporting, and enterprise controls as your clinic grows."
        />
        <div className="mt-12 grid gap-5 lg:grid-cols-3">
          {pricingPlans.map((plan) => (
            <Card
              key={plan.name}
              className={`relative p-7 ${
                plan.popular
                  ? "border-[var(--color-primary-300)] ring-4 ring-[var(--color-primary-300)]"
                  : ""
              }`}
            >
              {plan.popular && (
                <span className="absolute right-6 top-6 rounded-full bg-[var(--color-primary)] px-3 py-1 text-xs font-bold text-[var(--color-white)]">
                  Most popular
                </span>
              )}
              <h3 className="text-xl font-bold text-[var(--color-text-primary)]">
                {plan.name}
              </h3>
              <p className="mt-3 min-h-12 text-sm leading-6 text-[var(--color-text-secondary)]">
                {plan.description}
              </p>
              <div className="mt-6 flex items-end gap-2">
                <span className="text-4xl font-bold text-[var(--color-text-primary)]">
                  {plan.price}
                </span>
                {plan.price !== "Custom" && (
                  <span className="pb-1 text-[var(--color-text-muted)]">
                    /month
                  </span>
                )}
              </div>
              <Button
                className="mt-7 w-full"
                variant={plan.popular ? "primary" : "secondary"}
              >
                {plan.price === "Custom" ? "Contact Sales" : "Start Free Trial"}
              </Button>
              <ul className="mt-7 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature}className="flex gap-3 text-sm text-[var(--color-text-secondary)]">
                    <Check className="mt-0.5 h-4 w-4 flex-none text-[var(--color-navy)]" />
                    {feature}
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
