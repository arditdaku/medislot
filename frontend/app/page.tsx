import Image from "next/image";

export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex flex-1 w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
        <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left">
          <h1 className="max-w-xs text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50">
            MediSlot App
          </h1>
          <p className="max-w-md text-lg leading-8 text-zinc-900 dark:text-zinc-100">
            This is the frontend of the MediSlot App, a medical appointment application built with Next.js & FastAPI. This is still the Nextjs template -- Will be edited later...
          </p>
        </div>
      </main>
    </div>
  );
}
