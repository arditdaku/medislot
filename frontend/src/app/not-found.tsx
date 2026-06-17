import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-bg-secondary px-6 text-center">
      <div className="flex flex-col items-center">
        <Image
          src="/logo.png"
          alt="MediSlot"
          width={180}
          height={44}
          priority
          className="h-11 w-auto ms-5"
        />

        <p className="mt-8 text-7xl font-bold tracking-tight text-primary sm:text-8xl">
          404
        </p>

        <h1 className="mt-4 text-2xl font-bold text-text-primary sm:text-3xl">
          Page not found
        </h1>
        <p className="mt-3 max-w-md text-text-secondary">
          The page you&apos;re looking for doesn&apos;t exist or may have been
          moved. Let&apos;s get you back on track.
        </p>

        <Link
          href="/"
          className="mt-8 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-primary/20 transition hover:bg-primary-600"
        >
          <ArrowLeft size={16} />
          Back to home
        </Link>
      </div>
    </main>
  );
}
