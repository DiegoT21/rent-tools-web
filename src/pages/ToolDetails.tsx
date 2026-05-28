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
import { useAuthStore } from "@/store/authStore";
import { useNavigate } from "react-router-dom";
import { alerts } from "@/lib/alerts";

const DefaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

function ImageCarousel({
  images,
  alt,
  index,
  onIndexChange,
}: {
  images: string[];
  alt: string;
  index: number;
  onIndexChange: (next: number) => void;
}) {
  const pics = images.slice(0, 3);

  if (pics.length === 0) return null;

  const prev = () => onIndexChange((index - 1 + pics.length) % pics.length);
  const next = () => onIndexChange((index + 1) % pics.length);

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
            <button
              key={i}
              type="button"
              onClick={() => onIndexChange(i)}
              className={cn(
                "h-2 w-2 rounded-full transition-colors",
                i === index ? "bg-primary" : "bg-slate-200 hover:bg-slate-300"
              )}
              aria-label={`Ir a imagen ${i + 1}`}
            />
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
  const navigate = useNavigate();
  const accessToken = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);
  const [tool, setTool] = useState<PublicTool | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showMap, setShowMap] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [imageIndex, setImageIndex] = useState(0);

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
  const usageLevelRaw = typeof (tool as any)?.usageLevel === "string" ? (tool as any).usageLevel : null;
  const usageLevel = useMemo(() => {
    const value = (usageLevelRaw ?? "").toLowerCase();
    if (!value) return null;
    const map: Record<string, string> = {
      new: "Nuevo",
      excellent: "Excelente",
      good: "Bueno",
      fair: "Regular",
    };
    return map[value] ?? usageLevelRaw;
  }, [usageLevelRaw]);
  const depositAmount = typeof (tool as any)?.depositAmount === "number" ? (tool as any).depositAmount : null;

  useEffect(() => {
    setImageIndex(0);
  }, [uuid]);

  const handleRequestRental = () => {
    const isLoggedIn = Boolean(accessToken) || Boolean(user);
    if (!isLoggedIn) {
      alerts.info("Inicia sesión", "Para solicitar un alquiler necesitas iniciar sesión.");
      navigate("/login", { state: { returnTo: `/tools/${uuid ?? ""}` } });
      return;
    }

    alerts.toast("Listo: continúa con tu solicitud", "success");
  };

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
        <div className="space-y-4">
          <ImageCarousel images={images} alt={tool.name} index={imageIndex} onIndexChange={setImageIndex} />

          {images.length > 1 && (
            <div className="grid grid-cols-3 gap-3">
              {images.slice(0, 3).map((src, i) => (
                <button
                  key={src}
                  type="button"
                  onClick={() => setImageIndex(i)}
                  className={cn(
                    "relative aspect-[16/10] rounded-xl overflow-hidden border bg-slate-100",
                    i === imageIndex ? "border-primary ring-2 ring-primary/20" : "border-slate-200 hover:border-slate-300"
                  )}
                  aria-label={`Ver imagen ${i + 1}`}
                >
                  <img src={src} alt={`${tool.name} ${i + 1}`} className="absolute inset-0 w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          <Card className="border-slate-100 shadow-sm">
            <CardContent className="p-5">
              <div className="text-sm font-semibold text-slate-800 mb-3">Detalles rápidos</div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-xl border border-slate-200 bg-white p-3">
                  <div className="text-xs text-slate-500">Estado</div>
                  <div className="font-semibold text-slate-800">{tool.isAvailable ? "Disponible" : "No disponible"}</div>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-3">
                  <div className="text-xs text-slate-500">Uso</div>
                  <div className="font-semibold text-slate-800">{usageLevel ?? "—"}</div>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-3">
                  <div className="text-xs text-slate-500">Depósito</div>
                  <div className="font-semibold text-slate-800">
                    {typeof depositAmount === "number" ? `$${depositAmount}` : "—"}
                  </div>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-3">
                  <div className="text-xs text-slate-500">Categoría</div>
                  <div className="font-semibold text-slate-800">{(tool.category ?? "—").toString()}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

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
              <Button className="w-full h-11" onClick={handleRequestRental}>
                Solicitar alquiler
              </Button>
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
