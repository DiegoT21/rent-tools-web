import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const HERO_BG =
  "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=2000&auto=format&fit=crop";

export function HomeHero() {
  const navigate = useNavigate();

  return (
    <section className="relative min-h-[480px] overflow-hidden">
      <img
        src={HERO_BG}
        alt="Almacén industrial de herramientas"
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-900/70 to-slate-900/30" />
      <div className="relative mx-auto flex min-h-[480px] max-w-7xl flex-col justify-center px-8 py-16 md:px-12">
        <p className="mb-4 text-[10px] font-bold tracking-[0.25em] text-primary uppercase">
          Plataforma industrial
        </p>
        <h1 className="mb-5 max-w-2xl text-4xl font-black leading-tight text-white md:text-5xl lg:text-6xl">
          Rendimiento Industrial a tu Alcance
        </h1>
        <p className="mb-8 max-w-xl text-base leading-relaxed text-slate-300 md:text-lg">
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
          <Button
            variant="outline"
            className="rounded-xl border-white/40 bg-white/10 px-8 py-6 text-base font-bold text-white backdrop-blur-sm hover:bg-white/20 hover:text-white"
            onClick={() => navigate("/my-rentals")}
          >
            Ver promociones
          </Button>
        </div>
      </div>
    </section>
  );
}
