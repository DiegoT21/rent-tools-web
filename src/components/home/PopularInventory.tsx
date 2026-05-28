import { useEffect, useMemo, useState } from "react";
import { Star, ShoppingCart, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { PublicTool, toolService } from "@/services/toolService";

const fallbackImage =
  "https://images.unsplash.com/photo-1504148455328-c376907d081c?q=80&w=600&auto=format&fit=crop";

export function PopularInventory() {
  const [tools, setTools] = useState<PublicTool[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const result = await toolService.getPublicTools();
        if (!cancelled) setTools(result);
      } catch {
        if (!cancelled) setTools([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const visibleTools = useMemo(() => tools.slice(0, 8), [tools]);

  return (
    <div className="mb-12">
      <div className="flex items-end justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 mb-2">Inventario Popular</h2>
          <p className="text-slate-500 font-medium">Publicaciones recientes para alquilar</p>
        </div>
        <button className="flex items-center gap-1 text-sm font-bold text-primary hover:text-orange-600 transition-colors">
          Ver Todo el Inventario <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {loading && (
          <div className="col-span-full text-sm text-slate-500 font-medium">Cargando publicaciones...</div>
        )}

        {!loading && visibleTools.length === 0 && (
          <div className="col-span-full text-sm text-slate-500 font-medium">Aún no hay publicaciones para mostrar.</div>
        )}

        {visibleTools.map((tool) => {
          const id = toolService.getToolId(tool) || tool.name;
          const image = toolService.getToolCoverImage(tool) ?? fallbackImage;
          const category = (tool.category ?? "HERRAMIENTAS").toString().toUpperCase();
          const rating = typeof tool.rating === "number" ? tool.rating : 4.8;
          const price = typeof tool.pricePerDay === "number" ? tool.pricePerDay : 0;

          return (
            <Card
              key={id}
              className="overflow-hidden border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 group cursor-pointer bg-white"
            >
              <div className="relative pt-[70%] overflow-hidden bg-slate-100">
                <img
                  src={image}
                  alt={tool.name}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
              </div>
              <CardContent className="p-5">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">{category}</span>
                  <div className="flex items-center gap-1 text-primary">
                    <Star className="h-3 w-3 fill-primary" />
                    <span className="text-xs font-bold text-slate-700">{rating.toFixed(1)}</span>
                  </div>
                </div>
                <h3 className="font-bold text-slate-900 text-lg mb-4 truncate">{tool.name}</h3>

                <div className="flex items-end justify-between">
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl font-bold text-slate-900">${price}</span>
                    <span className="text-xs text-slate-500 font-medium">/día</span>
                  </div>
                  <button className="bg-slate-900 hover:bg-primary text-white p-2.5 rounded-lg transition-colors group-hover:shadow-md">
                    <ShoppingCart className="h-4 w-4" />
                  </button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

