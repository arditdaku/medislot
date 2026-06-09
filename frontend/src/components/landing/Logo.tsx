import Image from "next/image";

export default function Logo() {
  return (
    <a href="#" className="flex items-center" aria-label="MediSlot home">
      <Image
        src="/logo.png"
        alt="MediSlot"
        width={160}
        height={40}
        priority
        className="h-9 w-auto"
      />
    </a>
  );
}
