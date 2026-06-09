import type { ButtonHTMLAttributes } from "react";

const variants = {
  primary: "bg-[var(--color-primary)] text-[var(--color-white)] shadow-lg shadow-[var(--color-primary)]/20 hover:bg-[var(--color-primary-600)]",
  secondary: "border border-[var(--color-border)] bg-[var(--color-white)] text-[var(--color-secondary)] hover:border-[var(--color-primary)] hover:bg-[var(--color-primary-50)]",
  ghost: "text-[var(--color-secondary)] hover:bg-[var(--color-bg-muted)]",
} as const;


type ButtonVariant = keyof typeof variants;

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

export default function Button({
  children,
  variant = "primary",
  className = "",
  ...props
}: ButtonProps) {

  return (
    <button
      className={`inline-flex min-h-11 items-center justify-center rounded-full px-5 py-2.5 text-sm font-semibold transition duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)] ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
