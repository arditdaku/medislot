import type { HTMLAttributes } from "react";

type CardProps = HTMLAttributes<HTMLDivElement>;

export default function Card({ children, className = "", ...props }: CardProps) {
  return (
    <div
      className={`rounded-3xl border border-slate-200/80 bg-white shadow-xl shadow-slate-200/70 transition duration-300 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
