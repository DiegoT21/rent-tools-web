import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { ChevronLeft, ChevronRight, MapPin, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PublicTool, toolService } from "@/services/toolService";
import { MapContainer, Marker, TileLayer } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const DefaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

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

function ToolLocationMap({ lat, lng }: { lat: number; lng: number }) {
  const center: [number, number] = [lat, lng];

  return (
    <div className="relative rounded-xl overflow-hidden h-[220px] border border-slate-200 bg-slate-100">
      <MapContainer
        center={center}
        zoom={15}
        style={{ width: "100%", height: "100%" }}
        scrollWheelZoom={false}
        zoomControl={false}
        dragging={false}
        doubleClickZoom={false}
        boxZoom={false}
        keyboard={false}
        touchZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={center} />
      </MapContainer>
    </div>
  );
}

export function ToolDetails() {
  const { uuid } = useParams();
  const [tool, setTool] = useState<PublicTool | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showMap, setShowMap] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);

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
  const lat = typeof (tool as any)?.latitude === "number" ? (tool as any).latitude : null;
  const lng = typeof (tool as any)?.longitude === "number" ? (tool as any).longitude : null;
  const address = typeof (tool as any)?.address === "string" ? (tool as any).address : null;
  const brand = typeof (tool as any)?.brand === "string" ? (tool as any).brand : null;
  const description = typeof (tool as any)?.description === "string" ? (tool as any).description : null;

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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <ImageCarousel images={images} alt={tool.name} />

        <Card className="border-slate-100 shadow-sm">
          <CardContent className="p-6 space-y-4">
            <div className="space-y-1">
              <div className="text-[11px] font-bold tracking-widest text-slate-400 uppercase">
                {(tool.category ?? "HERRAMIENTAS").toString()}
              </div>
              <h1 className="text-2xl font-bold text-slate-900 leading-tight">{tool.name}</h1>
              {brand && <div className="text-sm text-slate-600">{brand}</div>}
            </div>

            {typeof tool.pricePerDay === "number" && (
              <div className="flex items-end gap-3">
                <div className="text-4xl font-bold text-slate-900">${tool.pricePerDay}</div>
                <div className="text-sm text-slate-500 font-semibold mb-1">/día</div>
              </div>
            )}

            {(address || (lat !== null && lng !== null)) && (
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setShowMap((v) => !v)}
                  className="w-full flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2 text-left hover:bg-slate-50 transition-colors"
                  aria-expanded={showMap}
                >
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-slate-500" />
                    <div className="text-sm font-semibold text-slate-800">Ubicación</div>
                  </div>
                  <ChevronDown className={cn("h-4 w-4 text-slate-500 transition-transform", showMap && "rotate-180")} />
                </button>

                {showMap && (
                  <div className="mt-3 space-y-3">
                    {address && <div className="text-sm text-slate-600">{address}</div>}
                    {lat !== null && lng !== null && <ToolLocationMap lat={lat} lng={lng} />}
                  </div>
                )}
              </div>
            )}

            {description && (
              <div className="pt-1">
                <div className="text-sm font-semibold text-slate-800 mb-1">Descripción</div>
                <div className={cn("text-sm text-slate-700 whitespace-pre-line", !showFullDescription && "line-clamp-5")}>
                  {description}
                </div>
                {description.length > 220 && (
                  <button
                    type="button"
                    onClick={() => setShowFullDescription((v) => !v)}
                    className="mt-2 text-sm font-semibold text-primary hover:text-orange-600"
                  >
                    {showFullDescription ? "Ver menos" : "Ver más"}
                  </button>
                )}
              </div>
            )}

            <div className="pt-3">
              <Button className="w-full h-11">Solicitar alquiler</Button>
              <div className="mt-2 text-xs text-slate-500">
                Verifica disponibilidad y coordina entrega con el propietario.
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
