"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Check, ChevronDown } from "lucide-react";

export type SelectOption<T extends string | number> = {
  value: T;
  label: string;
  /** Optional muted text shown after the label (e.g. a specialty). */
  hint?: string;
};

type SelectProps<T extends string | number> = {
  value: T;
  onChange: (value: T) => void;
  options: SelectOption<T>[];
  /** Optional leading icon shown inside the trigger. */
  icon?: ReactNode;
  placeholder?: string;
  ariaLabel?: string;
  className?: string;
  disabled?: boolean;
};

/**
 * A clean, brand-styled dropdown that replaces the native <select>. Closes on
 * outside click or Escape, marks the active option with a check, and animates
 * the chevron. Values can be strings or numbers.
 */
export default function Select<T extends string | number>({
  value,
  onChange,
  options,
  icon,
  placeholder = "Select…",
  ariaLabel,
  className = "",
  disabled = false,
}: SelectProps<T>) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => setOpen((v) => !v)}
        className={`flex min-h-11 w-full items-center gap-2 rounded-xl border bg-bg-primary px-3.5 text-left text-sm text-text-primary outline-none transition disabled:cursor-not-allowed disabled:opacity-60 ${
          open
            ? "border-primary ring-2 ring-primary-100"
            : "border-border hover:border-primary/60"
        }`}
      >
        {icon && <span className="flex-none text-text-muted">{icon}</span>}
        <span
          className={`flex-1 truncate ${selected ? "" : "text-text-muted"}`}
        >
          {selected ? (
            <>
              {selected.label}
              {selected.hint && (
                <span className="text-text-muted"> · {selected.hint}</span>
              )}
            </>
          ) : (
            placeholder
          )}
        </span>
        <ChevronDown
          size={16}
          className={`flex-none text-text-muted transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-30 mt-2 max-h-64 w-full overflow-y-auto rounded-xl border border-border bg-white p-1.5 shadow-lg"
        >
          {options.map((opt) => {
            const active = opt.value === value;
            return (
              <li key={String(opt.value)} role="option" aria-selected={active}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm transition ${
                    active
                      ? "bg-primary-50 font-semibold text-primary"
                      : "text-text-secondary hover:bg-bg-muted"
                  }`}
                >
                  <span className="truncate">
                    {opt.label}
                    {opt.hint && (
                      <span
                        className={active ? "text-primary/70" : "text-text-muted"}
                      >
                        {" "}
                        · {opt.hint}
                      </span>
                    )}
                  </span>
                  {active && <Check size={15} className="flex-none" />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
