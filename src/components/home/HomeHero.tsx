import { Button } from "@/components/ui/button";

const HERO_BG =
  "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=2000&auto=format&fit=crop";

export function HomeHero() {
  return (
    <section className="relative min-h-[360px] overflow-hidden sm:min-h-[420px] lg:min-h-[480px]">
      <img
        src={HERO_BG}
        alt="Almacén industrial de herramientas"
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-900/70 to-slate-900/30" />
      <div className="relative mx-auto flex min-h-[360px] max-w-7xl flex-col justify-center px-4 py-12 sm:min-h-[420px] sm:px-6 sm:py-14 md:px-8 lg:min-h-[480px] lg:px-12 lg:py-16">
        <p className="mb-3 text-[10px] font-bold tracking-[0.25em] text-primary uppercase sm:mb-4">
          Plataforma industrial
        </p>
        <h1 className="mb-4 max-w-2xl text-3xl font-black leading-tight text-white sm:mb-5 sm:text-4xl md:text-5xl lg:text-6xl">
          Rendimiento Industrial a tu Alcance
        </h1>
        <p className="mb-6 max-w-xl text-sm leading-relaxed text-slate-300 sm:mb-8 sm:text-base md:text-lg">
          Alquiler de maquinaria pesada y herramientas profesionales con garantía de operatividad 24/7.
        </p>
        <div className="flex flex-wrap gap-4">
          <Button
            className="rounded-xl bg-primary px-8 py-6 text-base font-bold text-white shadow-lg shadow-primary/30 hover:bg-primary/90"
            onClick={() => {
              document.getElementById("recientes")?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            Explorar catálogo
          </Button>
        </div>
      </div>
    </section>
  );
}
