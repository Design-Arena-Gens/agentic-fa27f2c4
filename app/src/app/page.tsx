import dynamic from "next/dynamic";

const DesertScene = dynamic(
  () => import("@/components/DesertScene").then((mod) => mod.DesertScene),
  { ssr: false },
);

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col bg-black text-white">
      <section className="relative h-[100svh] w-full overflow-hidden">
        <DesertScene />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/80" />
      </section>
    </main>
  );
}
