"use client";

import { motion } from "framer-motion";

type MiniAppointmentCardProps = {
  className: string;
  title: string;
  meta: string;
};

export default function MiniAppointmentCard({
  className,
  title,
  meta,
}: MiniAppointmentCardProps) {
  return (
    <motion.div
      className={`absolute hidden rounded-2xl border border-white/80 bg-white/90 p-4 shadow-2xl shadow-sky-900/10 backdrop-blur sm:block ${className}`}
      animate={{ y: [0, -10, 0] }}
      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
    >
      <p className="text-sm font-semibold text-slate-900">
        {title}
      </p>
      <p className="mt-1 text-xs text-slate-500">{meta}</p>
    </motion.div>
  );
}
