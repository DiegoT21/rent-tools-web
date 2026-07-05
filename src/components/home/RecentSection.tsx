import { useMemo, useState } from "react";
import { Clock, SlidersHorizontal, ArrowUpDown } from "lucide-react";
import { PublicTool, toolService } from "@/services/toolService";
import { ToolCard } from "./ToolCard";
import { Button } from "@/components/ui/button";

type SortMode = "recent" | "price-asc" | "price-desc" | "name";

interface RecentSectionProps {
  tools: PublicTool[];
  loading: boolean;
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-72 animate-pulse rounded-2xl bg-slate-200" />
      ))}
    </div>
  );
}

export function RecentSection({ tools, loading }: RecentSectionProps) {
  const [sort, setSort] = useState<SortMode>("recent");
  const [showFilters, setShowFilters] = useState(false);

  const sorted = useMemo(() => {
    const copy = [...tools];
    if (sort === "price-asc") {
      return copy.sort((a, b) => (a.pricePerDay ?? 0) - (b.pricePerDay ?? 0));
    }
    if (sort === "price-desc") {
      return copy.sort((a, b) => (b.pricePerDay ?? 0) - (a.pricePerDay ?? 0));
    }
    if (sort === "name") {
      return copy.sort((a, b) => a.name.localeCompare(b.name));
    }
    return copy;
  }, [tools, sort]);

  return (
    <section className="mb-16" id="recientes">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="rounded-xl border border-orange-100 bg-orange-50 p-2">
            <Clock className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900">Publicados recientemente</h2>
            <p className="text-sm font-medium text-slate-400">
              Las últimas herramientas disponibles en el catálogo
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="rounded-full border-slate-200 font-semibold text-slate-600"
            onClick={() => setShowFilters((v) => !v)}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Filtrar
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="rounded-full border-slate-200 font-semibold text-slate-600"
            onClick={() =>
              setSort((current) =>
                current === "recent" ? "price-asc" : current === "price-asc" ? "price-desc" : "recent",
              )
            }
          >
            <ArrowUpDown className="h-3.5 w-3.5" />
            Ordenar
          </Button>
        </div>
      </div>

      {showFilters && (
        <div className="mb-5 flex flex-wrap gap-2">
          {([
            ["recent", "Más recientes"],
            ["price-asc", "Menor precio"],
            ["price-desc", "Mayor precio"],
            ["name", "Nombre A-Z"],
          ] as const).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setSort(value)}
              className={`rounded-full px-4 py-1.5 text-xs font-bold transition-colors ${
                sort === value
                  ? "bg-primary text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <SkeletonGrid />
      ) : sorted.length === 0 ? (
        <p className="text-sm text-slate-400">Aún no hay herramientas para mostrar.</p>
      ) : (
        <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
          {sorted.map((tool, index) => (
            <ToolCard
              key={toolService.getToolId(tool)}
              tool={tool}
              showOffer={(tool.pricePerDay ?? 0) >= 200 || index % 3 === 1}
            />
          ))}
        </div>
      )}
    </section>
  );
}
