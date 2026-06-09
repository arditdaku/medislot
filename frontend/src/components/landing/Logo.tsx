export default function Logo() {
  return (
    <a href="#" className="flex items-center gap-3" aria-label="MediSlot home">
      <span className="grid h-10 w-10 place-items-center rounded-2xl bg-[var(--color-primary)] text-[var(--color-white)] shadow-lg shadow-[var(--color-primary)]/20">
        <span className="text-lg font-black">M</span>
      </span>
      <span className="text-lg font-bold tracking-tight text-slate-950">MediSlot</span>
    </a>
  );
}
