import type { HTMLAttributes } from "react";

type SkeletonProps = HTMLAttributes<HTMLDivElement>;

export default function Skeleton({ className = "", ...props }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={`animate-pulse rounded-2xl bg-[var(--color-border)] ${className}`}
      {...props}
    />
  );
}
