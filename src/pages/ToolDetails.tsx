import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { ChevronLeft, ChevronRight, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PublicTool, toolService } from "@/services/toolService";

function ImageCarousel({ images, alt }: { images: string[]; alt: string }) {
  const pics = images.slice(0, 3);
  const [index, setIndex] = useState(0);

  if (pics.length === 0) return null;

  const prev = () => setIndex((i) => (i - 1 + pics.length) % pics.length);
  const next = () => setIndex((i) => (i + 1) % pics.length);

  return (
    <div className="w-full">
      <div className="relative w-full aspect-[16/10] rounded-2xl overflow-hidden bg-slate-100 border border-slate-200">
        <img src={pics[index]} alt={alt} className="w-full h-full object-cover" />

        {pics.length > 1 && (
          <>
            <button
              type="button"
              onClick={prev}
              className="absolute left-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/90 border border-slate-200 text-slate-700 hover:bg-white grid place-items-center"
              aria-label="Imagen anterior"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={next}
              className="absolute right-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/90 border border-slate-200 text-slate-700 hover:bg-white grid place-items-center"
              aria-label="Imagen siguiente"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}
      </div>

      {pics.length > 1 && (
        <div className="mt-2 flex items-center justify-center gap-1.5">
          {pics.map((_, i) => (
            <span key={i} className={cn("h-2 w-2 rounded-full", i === index ? "bg-primary" : "bg-slate-200")} />
          ))}
        </div>
      )}
    </div>
  );
}

export function ToolDetails() {
  const { uuid } = useParams();
  const [tool, setTool] = useState<PublicTool | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!uuid) {
        setError("Falta el identificador de la publicación.");
        setLoading(false);
        return;
      }

      try {
        const data = await toolService.getToolByUuid(uuid);
        if (!cancelled) setTool(data);
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? "No se pudo cargar la publicación.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [uuid]);

  const images = useMemo(() => (tool ? toolService.getToolImages(tool, 3) : []), [tool]);

  if (loading) {
    return <div className="max-w-5xl mx-auto py-10 px-4 text-slate-600">Cargando publicación...</div>;
  }

  if (error) {
    return <div className="max-w-5xl mx-auto py-10 px-4 text-red-600">{error}</div>;
  }

  if (!tool) {
    return <div className="max-w-5xl mx-auto py-10 px-4 text-slate-600">Publicación no encontrada.</div>;
  }

  return (
    <div className="max-w-5xl mx-auto py-10 px-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <ImageCarousel images={images} alt={tool.name} />

        <Card className="border-slate-100 shadow-sm">
          <CardContent className="p-6 space-y-4">
            <div>
              <div className="text-xs font-bold tracking-widest text-slate-400 uppercase">
                {(tool.category ?? "HERRAMIENTAS").toString()}
              </div>
              <h1 className="text-2xl font-bold text-slate-900">{tool.name}</h1>
              {typeof (tool as any).brand === "string" && (
                <div className="text-sm text-slate-600 mt-1">{(tool as any).brand}</div>
              )}
            </div>

            {typeof tool.pricePerDay === "number" && (
              <div className="flex items-end gap-2">
                <div className="text-3xl font-bold text-slate-900">${tool.pricePerDay}</div>
                <div className="text-sm text-slate-500 font-medium">/día</div>
              </div>
            )}

            {typeof (tool as any).address === "string" && (
              <div className="flex items-start gap-2 text-slate-600">
                <MapPin className="h-5 w-5 mt-0.5 text-slate-500" />
                <span className="text-sm">{(tool as any).address}</span>
              </div>
            )}

            {typeof (tool as any).description === "string" && (
              <div className="text-sm text-slate-700 whitespace-pre-line">{(tool as any).description}</div>
            )}

            <div className="pt-2">
              <Button className="w-full">Solicitar alquiler</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

