import { ArrowRight, Flame } from "lucide-react";
import { PublicTool } from "@/services/toolService";
import { ToolCard } from "./ToolCard";

interface PopularSectionProps {
  tools: PublicTool[];
  loading: boolean;
}

function PopularSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
      <div className="min-h-[420px] animate-pulse rounded-2xl bg-slate-200 lg:col-span-2" />
      <div className="flex flex-col gap-5">
        <div className="h-48 animate-pulse rounded-2xl bg-slate-200" />
        <div className="h-48 animate-pulse rounded-2xl bg-slate-200" />
      </div>
    </div>
  );
}

export function PopularSection({ tools, loading }: PopularSectionProps) {
  const featured = tools[0];
  const sideTools = tools.slice(1, 3);

  return (
    <section className="mb-16" id="popular">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-start gap-3 sm:items-center">
          <div className="rounded-xl border border-orange-100 bg-orange-50 p-2 shrink-0">
            <Flame className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="mb-1 text-[10px] font-bold tracking-[0.2em] text-primary uppercase">Top alquileres</p>
            <h2 className="text-xl font-black text-slate-900 sm:text-2xl">Lo más rentado esta semana</h2>
            <p className="text-xs font-medium text-slate-400 sm:text-sm">
                Herramientas con más actividad en los últimos 7 días
            </p>
          </div>
        </div>
        <button
          type="button"
          className="hidden items-center gap-1 text-sm font-bold text-primary transition-colors hover:text-primary/80 sm:flex"
          onClick={() => document.getElementById("recientes")?.scrollIntoView({ behavior: "smooth" })}
        >
          Ver todos <ArrowRight className="h-4 w-4" />
        </button>
      </div>

      {loading ? (
        <PopularSkeleton />
      ) : tools.length === 0 ? (
        <p className="text-sm text-slate-400">Aún no hay herramientas populares para mostrar.</p>
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <ToolCard tool={featured} variant="featured" badge="Más popular" />
          </div>
          <div className="flex flex-col gap-5">
            {sideTools.length > 0 ? (
              sideTools.map((tool, index) => (
                <ToolCard
                  key={tool.uuid ?? tool.id ?? index}
                  tool={tool}
                  variant="compact"
                  badge={index === 1 ? "Nuevo ingreso" : undefined}
                />
              ))
            ) : (
              <div className="flex flex-1 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-sm text-slate-400">
                Más equipos populares próximamente
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
