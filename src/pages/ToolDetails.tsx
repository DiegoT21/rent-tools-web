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
import Swal from "sweetalert2";
import { rentalRequestService } from "@/services/rentalRequestService";
import { userService, UserReview } from "@/services/userService";

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
  const [requestStatusLoading, setRequestStatusLoading] = useState(false);
  const [hasPendingRequest, setHasPendingRequest] = useState(false);
  const [ownerReviewsLoading, setOwnerReviewsLoading] = useState(false);
  const [ownerReviewsError, setOwnerReviewsError] = useState<string | null>(null);
  const [ownerReviews, setOwnerReviews] = useState<UserReview[]>([]);
  const [ownerSummary, setOwnerSummary] = useState<{ count: number; averageRating: number } | null>(null);
  const [showOwnerReviews, setShowOwnerReviews] = useState(false);

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
  const ownerUuid = typeof (tool as any)?.owner?.uuid === "string" ? (tool as any).owner.uuid : null;
  const ownerName =
    typeof (tool as any)?.owner?.firstName === "string"
      ? `${(tool as any).owner.firstName}${typeof (tool as any).owner.lastName === "string" ? ` ${(tool as any).owner.lastName}` : ""}`.trim()
      : null;
  const currentUserUuid =
    typeof (user as any)?.uuid === "string"
      ? (user as any).uuid
      : typeof (user as any)?._id === "string"
      ? (user as any)._id
      : typeof (user as any)?.id === "string"
      ? (user as any).id
      : null;

  useEffect(() => {
    setImageIndex(0);
  }, [uuid]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!ownerUuid) {
        setOwnerReviews([]);
        setOwnerSummary(null);
        return;
      }
      setOwnerReviewsLoading(true);
      setOwnerReviewsError(null);
      try {
        const data = await userService.getReviews(ownerUuid);
        if (cancelled) return;
        setOwnerReviews(data.reviews ?? []);
        setOwnerSummary(data.summary ?? { count: 0, averageRating: 0 });
      } catch (e: any) {
        if (cancelled) return;
        setOwnerReviews([]);
        setOwnerSummary(null);
        setOwnerReviewsError(e?.response?.data?.message || "No se pudieron cargar los reviews del propietario.");
      } finally {
        if (!cancelled) setOwnerReviewsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [ownerUuid]);

  const StarRow = ({ rating }: { rating: number }) => {
    const full = Math.round(Math.max(0, Math.min(5, rating)));
    return (
      <div className="flex items-center gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <span
            key={i}
            className={cn(
              "inline-block h-2.5 w-2.5 rounded-full",
              i < full ? "bg-orange-500" : "bg-slate-200"
            )}
            aria-hidden="true"
          />
        ))}
      </div>
    );
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!uuid) return;
      const isLoggedIn = Boolean(accessToken) || Boolean(user);
      if (!isLoggedIn) {
        setHasPendingRequest(false);
        return;
      }

      setRequestStatusLoading(true);
      try {
        const status = await rentalRequestService.getStatus(uuid);
        if (!cancelled) setHasPendingRequest(status.hasPending);
      } catch {
        if (!cancelled) setHasPendingRequest(false);
      } finally {
        if (!cancelled) setRequestStatusLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [uuid, accessToken, user]);

  const handleRequestRental = async () => {
    const isLoggedIn = Boolean(accessToken) || Boolean(user);
    if (!isLoggedIn) {
      await alerts.info("Inicia sesión", "Para solicitar un alquiler necesitas iniciar sesión.");
      navigate("/login", { state: { returnTo: `/tools/${uuid ?? ""}` } });
      return;
    }

    if (!uuid || !tool) return;
    if (ownerUuid && currentUserUuid && ownerUuid === currentUserUuid) {
      await alerts.warning("Acción no permitida", "No puedes solicitar el alquiler de tu propia herramienta.");
      return;
    }
    if (hasPendingRequest) {
      await alerts.info("Solicitud pendiente", "Ya enviaste una solicitud para esta publicación. Está en revisión.");
      return;
    }

    const pricePerDay = typeof tool.pricePerDay === "number" ? tool.pricePerDay : 0;
    const deposit = typeof (tool as any)?.depositAmount === "number" ? (tool as any).depositAmount : 0;

    const today = new Date();
    const isoToday = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())).toISOString().slice(0, 10);

    // Preload bookings (public) to validate occupied days
    let bookings: Array<{ startDate: string; endDate: string }> = [];
    try {
      const now = new Date();
      const from = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
      const to = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 3, 0)).toISOString();
      bookings = (await toolService.getBookings(uuid, from, to)).map((b) => ({ startDate: b.startDate, endDate: b.endDate }));
    } catch {
      bookings = [];
    }
    const overlaps = (aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) => aStart <= bEnd && bStart <= aEnd;

    const { isConfirmed, value } = await Swal.fire({
      title: "Confirmar solicitud",
      html: `
        <div style="text-align:left">
          <div style="font-weight:700;margin-bottom:8px;">${tool.name}</div>
          <div style="color:#64748b;margin-bottom:12px;">Precio: <b>$${pricePerDay}</b> / día${deposit ? ` · Depósito: <b>$${deposit}</b>` : ""}</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:10px;">
            <label style="display:flex;flex-direction:column;gap:6px;font-size:13px;">
              Desde
              <input id="rt_from" type="date" class="swal2-input" style="margin:0;height:40px" value="${isoToday}" min="${isoToday}" />
            </label>
            <label style="display:flex;flex-direction:column;gap:6px;font-size:13px;">
              Hasta
              <input id="rt_to" type="date" class="swal2-input" style="margin:0;height:40px" value="${isoToday}" min="${isoToday}" />
            </label>
          </div>
          <label style="display:flex;flex-direction:column;gap:6px;font-size:13px;margin-bottom:10px;">
            Punto de encuentro (texto)
            <input id="rt_pickup_label" class="swal2-input" style="margin:0;height:40px" placeholder="Ej. Multiplaza - entrada principal" />
          </label>
          <label style="display:flex;flex-direction:column;gap:6px;font-size:13px;margin-bottom:10px;">
            Hora de entrega
            <input id="rt_pickup_at" type="datetime-local" class="swal2-input" style="margin:0;height:40px" />
          </label>
          <label style="display:flex;flex-direction:column;gap:6px;font-size:13px;">
            Mensaje (opcional)
            <input id="rt_msg" class="swal2-input" style="margin:0;height:40px" placeholder="Ej. Lo necesito para un trabajo..." />
          </label>
          <div id="rt_summary" style="margin-top:10px;color:#0f172a;font-size:13px;"></div>
        </div>
      `,
      confirmButtonText: "Enviar solicitud",
      showCancelButton: true,
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#f97316",
      cancelButtonColor: "#0f172a",
      didOpen: () => {
        const fromEl = document.getElementById("rt_from") as HTMLInputElement | null;
        const toEl = document.getElementById("rt_to") as HTMLInputElement | null;
        const summaryEl = document.getElementById("rt_summary") as HTMLDivElement | null;
        const compute = () => {
          if (!fromEl || !toEl || !summaryEl) return;
          const from = fromEl.value;
          const to = toEl.value;
          if (!from || !to) {
            summaryEl.textContent = "";
            return;
          }
          const fromDate = new Date(from + "T00:00:00");
          const toDate = new Date(to + "T00:00:00");
          const diffMs = toDate.getTime() - fromDate.getTime();
          const days = Math.floor(diffMs / 86400000) + 1;
          if (!Number.isFinite(days) || days <= 0) {
            summaryEl.innerHTML = `<span style="color:#b91c1c;font-weight:600;">Rango de fechas inválido.</span>`;
            return;
          }
          const total = pricePerDay * days + (deposit || 0);
          summaryEl.innerHTML = `Resumen: <b>${days}</b> día(s) · Total estimado: <b>$${total}</b> ${deposit ? `<span style="color:#64748b">(incluye depósito)</span>` : ""}`;
        };
        fromEl?.addEventListener("change", compute);
        toEl?.addEventListener("change", compute);
        compute();
      },
      preConfirm: () => {
        const fromEl = document.getElementById("rt_from") as HTMLInputElement | null;
        const toEl = document.getElementById("rt_to") as HTMLInputElement | null;
        const msgEl = document.getElementById("rt_msg") as HTMLInputElement | null;
        const pickupLabelEl = document.getElementById("rt_pickup_label") as HTMLInputElement | null;
        const pickupAtEl = document.getElementById("rt_pickup_at") as HTMLInputElement | null;
        const fromDate = fromEl?.value ?? "";
        const toDate = toEl?.value ?? "";
        const pickupLabel = (pickupLabelEl?.value ?? "").trim();
        const pickupAtRaw = pickupAtEl?.value ?? "";
        if (!fromDate || !toDate) {
          Swal.showValidationMessage("Selecciona las fechas.");
          return;
        }
        if (fromDate < isoToday) {
          Swal.showValidationMessage("La fecha de inicio no puede ser en el pasado.");
          return;
        }
        if (toDate < fromDate) {
          Swal.showValidationMessage("La fecha 'Hasta' no puede ser anterior a 'Desde'.");
          return;
        }
        if (!pickupLabel) {
          Swal.showValidationMessage("Escribe el punto de encuentro.");
          return;
        }
        if (!pickupAtRaw) {
          Swal.showValidationMessage("Selecciona la hora de entrega.");
          return;
        }
        const pickupAt = new Date(pickupAtRaw).toISOString();

        const startIso = new Date(fromDate + "T00:00:00.000Z").toISOString();
        const endIso = new Date(toDate + "T00:00:00.000Z").toISOString();
        if (pickupAt < startIso || pickupAt > endIso) {
          Swal.showValidationMessage("La hora de entrega debe estar entre la fecha inicio y fin.");
          return;
        }

        const aStart = new Date(startIso);
        const aEnd = new Date(endIso);
        const hasConflict = bookings.some((b) => overlaps(aStart, aEnd, new Date(b.startDate), new Date(b.endDate)));
        if (hasConflict) {
          Swal.showValidationMessage("Fechas ocupadas: elige otro rango.");
          return;
        }

        return { fromDate, toDate, pickupAt, pickupLabel, message: (msgEl?.value ?? "").trim() };
      },
    });

    if (!isConfirmed || !value) return;

    try {
      await rentalRequestService.create({
        toolUuid: uuid,
        startDate: new Date(value.fromDate + "T00:00:00.000Z").toISOString(),
        endDate: new Date(value.toDate + "T00:00:00.000Z").toISOString(),
        message: value.message || undefined,
        pickup: {
          addressLabel: value.pickupLabel,
          pickupAt: value.pickupAt,
        },
      });
      setHasPendingRequest(true);
      await alerts.success("Solicitud enviada", "El propietario la verá en su sección de solicitudes.");
    } catch (e: any) {
      const status = e?.response?.status;
      if (status === 400) {
        await alerts.error("No se pudo enviar", e?.response?.data?.message || "Solicitud inválida.");
        return;
      }
      if (status === 409) {
        await alerts.error("Fechas no disponibles", "Ese rango de fechas entra en conflicto con otra solicitud/reserva.");
        return;
      }
      await alerts.error("No se pudo enviar", e?.response?.data?.message || "Ocurrió un error al enviar la solicitud.");
    }
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

            {(ownerUuid || ownerName) && (
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setShowOwnerReviews((v) => !v)}
                  className="w-full flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2 text-left hover:bg-slate-50 transition-colors"
                  aria-expanded={showOwnerReviews}
                >
                  <div className="flex flex-col">
                    <div className="text-sm font-semibold text-slate-800">
                      Publicado por {ownerName ?? "Propietario"}
                    </div>
                    {ownerSummary && (
                      <div className="mt-1 flex items-center gap-2 text-xs text-slate-600">
                        <StarRow rating={ownerSummary.averageRating ?? 0} />
                        <span>
                          {(ownerSummary.averageRating ?? 0).toFixed(1)} · {ownerSummary.count} review(s)
                        </span>
                      </div>
                    )}
                  </div>
                  <ChevronDown className={cn("h-4 w-4 text-slate-500 transition-transform", showOwnerReviews && "rotate-180")} />
                </button>

                {showOwnerReviews && (
                  <div className="mt-3 space-y-2">
                    {ownerReviewsLoading && <div className="text-sm text-slate-600">Cargando reviews...</div>}
                    {!ownerReviewsLoading && ownerReviewsError && (
                      <div className="text-sm text-red-600">{ownerReviewsError}</div>
                    )}
                    {!ownerReviewsLoading && !ownerReviewsError && ownerReviews.length === 0 && (
                      <div className="text-sm text-slate-600">Este propietario aún no tiene reviews.</div>
                    )}
                    {!ownerReviewsLoading &&
                      !ownerReviewsError &&
                      ownerReviews.slice(0, 4).map((r, idx) => (
                        <div key={r.uuid ?? idx} className="rounded-xl border border-slate-200 bg-white p-3">
                          <div className="flex items-center justify-between">
                            <div className="text-sm font-semibold text-slate-800">
                              {typeof r.rating === "number" ? r.rating.toFixed(1) : "—"} / 5
                            </div>
                            <div className="text-xs text-slate-500">
                              {typeof r.createdAt === "string" ? new Date(r.createdAt).toLocaleDateString() : ""}
                            </div>
                          </div>
                          <div className="mt-1 text-sm text-slate-700 whitespace-pre-line">{r.comment || "Sin comentario"}</div>
                        </div>
                      ))}
                    {!ownerReviewsLoading && !ownerReviewsError && ownerReviews.length > 4 && (
                      <button
                        type="button"
                        onClick={async () => {
                          const summaryText = ownerSummary
                            ? `<div style="margin-bottom:10px;color:#0f172a;"><b>${(ownerSummary.averageRating ?? 0).toFixed(
                                1
                              )}</b> promedio · <b>${ownerSummary.count}</b> review(s)</div>`
                            : "";
                          const rows = ownerReviews
                            .map(
                              (rev) => `<div style="padding:10px 0;border-top:1px solid #e2e8f0;">
                                <div style="font-weight:700;color:#0f172a;">${(rev.rating ?? 0).toFixed(1)} / 5</div>
                                <div style="color:#334155;font-size:13px;white-space:pre-line;">${(rev.comment ?? "Sin comentario").toString()}</div>
                              </div>`
                            )
                            .join("");
                          await Swal.fire({
                            title: `Reviews de ${ownerName ?? "propietario"}`,
                            html: `<div style="text-align:left">${summaryText}<div style="max-height:340px;overflow:auto;border:1px solid #e2e8f0;border-radius:12px;padding:0 12px;">${rows}</div></div>`,
                            confirmButtonText: "Listo",
                            confirmButtonColor: "#f97316",
                          });
                        }}
                        className="text-sm font-semibold text-primary hover:text-orange-600"
                      >
                        Ver todos los reviews
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="pt-3">
              <Button className="w-full h-11" onClick={handleRequestRental} disabled={requestStatusLoading || hasPendingRequest}>
                {hasPendingRequest ? "Solicitud enviada" : requestStatusLoading ? "Verificando..." : "Solicitar alquiler"}
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
