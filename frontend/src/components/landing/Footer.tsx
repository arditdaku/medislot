import { AtSign, Send, Share2 } from "lucide-react";
import Logo from "./Logo";
import {  
  Mail,
  MapPin,
  MessageSquareText
} from "lucide-react";

export default function Footer() {

  const footerLinks = [
    { label: "Product", href: "#features" },
    { label: "Dashboard", href: "#dashboard" },
    { label: "Pricing", href: "#pricing" },
    { label: "Security", href: "#faq" },
  ];
  
  const contactItems = [
    { icon: Mail, label: "hello@medislot.health" },
    { icon: MapPin, label: "Chicago, IL" },
    { icon: MessageSquareText, label: "Live chat support" },
  ];

  return (
    <footer className="border-t border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.2fr_0.8fr_0.8fr]">
        <div>
          <Logo />
          <p className="mt-4 max-w-md leading-7 text-[var(--color-secondary)]">
            Appointment scheduling software for clinics that want fewer no-shows,
            cleaner calendars, and better patient communication.
          </p>
          <div className="mt-6 flex gap-3">
            {[Share2, Send, AtSign].map((Icon, index) => (
              <a
                key={index}
                href="#"
                className="grid h-10 w-10 place-items-center rounded-full border border-[var(--color-border)] text-[var(--color-secondary)] transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
                aria-label="Social profile"
              >
                <Icon size={18} />
              </a>
            ))}
          </div>
        </div>
        <div>
          <h2 className="font-bold text-[var(--color-secondary)]">Navigation</h2>
          <div className="mt-4 grid gap-3">
            {footerLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-[var(--color-secondary)] transition hover:text-[var(--color-primary)]"
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>
        <div>
          <h2 className="font-bold text-[var(--color-secondary)]">Contact</h2>
          <div className="mt-4 grid gap-3">
            {contactItems.map((item) => {
              const Icon = item.icon;
              return (
                <p
                  key={item.label}
                  className="flex items-center gap-3 text-[var(--color-secondary)]"
                >
                  <Icon size={17} className="text-[var(--color-primary)]" />
                  {item.label}
                </p>
              );
            })}
          </div>
        </div>
      </div>
      <div className="mx-auto mt-10 max-w-7xl border-t border-[var(--color-border)] pt-6 text-sm text-[var(--color-secondary)]">
        &copy; 2026 MediSlot. All rights reserved.
      </div>
    </footer>
  );
}
