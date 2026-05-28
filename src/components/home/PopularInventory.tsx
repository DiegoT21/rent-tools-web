import { useEffect, useMemo, useState } from "react";
import { Star, ShoppingCart, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { PublicTool, toolService } from "@/services/toolService";
import { cn } from "@/lib/utils";

const fallbackImage =
  "https://images.unsplash.com/photo-1504148455328-c376907d081c?q=80&w=600&auto=format&fit=crop";

function ToolImageCarousel({ images, alt }: { images: string[]; alt: string }) {
  const pics = (images.length ? images : [fallbackImage]).slice(0, 3);
  const [index, setIndex] = useState(0);
  const hasArrows = pics.length > 1 && images.length > 1;

  const prev = () => setIndex((i) => (i - 1 + pics.length) % pics.length);
  const next = () => setIndex((i) => (i + 1) % pics.length);

  return (
    <div className="relative pt-[70%] overflow-hidden bg-slate-100">
      <img
        src={pics[index]}
        alt={alt}
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
      />

      {hasArrows && (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              prev();
            }}
            className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-white/90 border border-slate-200 text-slate-700 hover:bg-white grid place-items-center"
            aria-label="Imagen anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              next();
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-white/90 border border-slate-200 text-slate-700 hover:bg-white grid place-items-center"
            aria-label="Imagen siguiente"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </>
      )}

      {images.length > 1 && (
        <div className="absolute bottom-2 left-0 right-0 flex items-center justify-center gap-1.5">
          {pics.map((_, i) => (
            <span
              key={i}
              className={cn("h-1.5 w-1.5 rounded-full", i === index ? "bg-primary" : "bg-white/80")}
            />
          ))}
        </div>
      )}
    </div>
  );
}

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
          const images = toolService.getToolImages(tool, 3);
          const category = (tool.category ?? "HERRAMIENTAS").toString().toUpperCase();
          const rating = typeof tool.rating === "number" ? tool.rating : 4.8;
          const price = typeof tool.pricePerDay === "number" ? tool.pricePerDay : 0;

          return (
            <Card
              key={id}
              className="overflow-hidden border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 group cursor-pointer bg-white"
            >
              <ToolImageCarousel images={images} alt={tool.name} />
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
