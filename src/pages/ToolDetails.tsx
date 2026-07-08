import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { ChevronLeft, ChevronRight, MapPin, ChevronDown, Star } from "lucide-react";
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
import { buildPickupAtIso } from "@/lib/rentalDates";
import Swal from "sweetalert2";
import { rentalRequestService } from "@/services/rentalRequestService";
import { userService, UserReview } from "@/services/userService";
import { RentalRequestDialog } from "@/components/rentals/RentalRequestDialog";

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
  showRentedBadge,
}: {
  images: string[];
  alt: string;
  index: number;
  onIndexChange: (next: number) => void;
  showRentedBadge?: boolean;
}) {
  const pics = images.slice(0, 3);

  if (pics.length === 0) return null;

  const prev = () => onIndexChange((index - 1 + pics.length) % pics.length);
  const next = () => onIndexChange((index + 1) % pics.length);

  return (
    <div className="w-full">
      <div className="relative w-full aspect-[16/10] rounded-2xl overflow-hidden bg-slate-100 border border-slate-200">
        <img src={pics[index]} alt={alt} className="w-full h-full object-cover" />
        {showRentedBadge && (
          <span
            className="absolute right-3 top-3 rounded px-2 py-0.5 text-[9px] font-bold tracking-wider uppercase bg-primary text-white"
            title="Actualmente alquilado"
          >
            act. Alq.
          </span>
        )}

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
  const [activeRequestStatus, setActiveRequestStatus] = useState<string | null>(null);
  const [activeRequestExpiresAt, setActiveRequestExpiresAt] = useState<string | null>(null);
  const [ownerReviewsLoading, setOwnerReviewsLoading] = useState(false);
  const [ownerReviewsError, setOwnerReviewsError] = useState<string | null>(null);
  const [ownerReviews, setOwnerReviews] = useState<UserReview[]>([]);
  const [ownerSummary, setOwnerSummary] = useState<{ count: number; averageRating: number } | null>(null);
  const [showOwnerReviews, setShowOwnerReviews] = useState(false);
  const [requestDialogOpen, setRequestDialogOpen] = useState(false);

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
  const meetingLocations = Array.isArray((tool as any)?.meetingLocations) ? (tool as any).meetingLocations.slice(0, 3) : [];
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
  const depositRecommendation = "25% del alquiler";
  const isRented = tool?.rentalState === "rented";
  const ownerUuid = typeof (tool as any)?.owner?.uuid === "string" ? (tool as any).owner.uuid : null;
  const ownerName =
    typeof (tool as any)?.owner?.firstName === "string"
      ? `${(tool as any).owner.firstName}${typeof (tool as any).owner.lastName === "string" ? ` ${(tool as any).owner.lastName}` : ""}`.trim()
      : null;
  const canRequestRental =
    Boolean(user) &&
    (user as any)?.isVerified === true &&
    String((user as any)?.kycStatus ?? "").toLowerCase() === "approved";
  const currentUserUuid =
    typeof (user as any)?.uuid === "string"
      ? (user as any).uuid
      : typeof (user as any)?._id === "string"
      ? (user as any)._id
      : typeof (user as any)?.id === "string"
      ? (user as any).id
      : null;

  const refreshRequestStatus = useCallback(async () => {
    if (!uuid) return;
    const isLoggedIn = Boolean(accessToken) || Boolean(user);
    if (!isLoggedIn) {
      setHasPendingRequest(false);
      setActiveRequestStatus(null);
      return;
    }

    setRequestStatusLoading(true);
    try {
      const status = await rentalRequestService.getStatus(uuid);
      const expiresAt = typeof (status as any).expiresAt === "string" ? String((status as any).expiresAt) : null;
      const isExpired = expiresAt ? new Date(expiresAt).getTime() <= Date.now() : false;
      const active = Boolean(status.hasActive ?? status.hasPending) && !isExpired;
      setHasPendingRequest(active);
      setActiveRequestStatus((status as any).status ?? null);
      setActiveRequestExpiresAt(expiresAt);
    } catch {
      setHasPendingRequest(false);
      setActiveRequestStatus(null);
      setActiveRequestExpiresAt(null);
    } finally {
      setRequestStatusLoading(false);
    }
  }, [uuid, accessToken, user]);

  useEffect(() => {
    if (!activeRequestExpiresAt) return;
    const expiresAtMs = new Date(activeRequestExpiresAt).getTime();
    if (!expiresAtMs || Number.isNaN(expiresAtMs)) return;
    const remaining = expiresAtMs - Date.now();
    if (remaining <= 0) {
      setHasPendingRequest(false);
      return;
    }
    const timer = window.setTimeout(() => {
      setHasPendingRequest(false);
      void refreshRequestStatus();
    }, remaining + 1000);
    return () => window.clearTimeout(timer);
  }, [activeRequestExpiresAt, refreshRequestStatus]);

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
      <div className="flex items-center gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={cn(
              "h-3.5 w-3.5 transition-colors",
              i < full ? "text-amber-400 fill-amber-400" : "text-slate-200 fill-slate-200"
            )}
            aria-hidden="true"
          />
        ))}
      </div>
    );
  };

  useEffect(() => {
    void refreshRequestStatus();
  }, [refreshRequestStatus]);

  useEffect(() => {
    const onFocus = () => void refreshRequestStatus();
    const onVisible = () => {
      if (document.visibilityState === "visible") void refreshRequestStatus();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisible);
    const interval = window.setInterval(() => void refreshRequestStatus(), 60_000);
    window.addEventListener("rental-requests-updated", onFocus);
    window.addEventListener("rental-requests-seen", onFocus);

    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("rental-requests-updated", onFocus);
      window.removeEventListener("rental-requests-seen", onFocus);
      window.clearInterval(interval);
    };
  }, [refreshRequestStatus]);

  const handleRequestRental = async () => {
    const isLoggedIn = Boolean(accessToken) || Boolean(user);
    if (!isLoggedIn) {
      await alerts.info("Inicia sesión", "Para solicitar un alquiler necesitas iniciar sesión.");
      navigate("/login", { state: { returnTo: `/tools/${uuid ?? ""}` } });
      return;
    }

    if (!canRequestRental) {
      await alerts.warning("KYC requerido", "Debes completar y aprobar tu KYC para solicitar alquiler.");
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

    setRequestDialogOpen(true);
    return;

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
            <input id="rt_pickup_time" type="time" class="swal2-input" style="margin:0;height:40px" value="09:00" />
          </label>
          <div style="margin-top:-6px;margin-bottom:10px;color:#64748b;font-size:12px;">
            Nota: la entrega debe ser el mismo día de "Desde" (solo eliges la hora).
          </div>
          <label style="display:flex;flex-direction:column;gap:6px;font-size:13px;">
            Mensaje (opcional)
            <input id="rt_msg" class="swal2-input" style="margin:0;height:40px" placeholder="Ej. Lo necesito para un trabajo..." />
          </label>
          <div id="rt_summary" style="margin-top:10px;color:#0f172a;font-size:13px;"></div>
          <div id="rt_bookings" style="margin-top:8px;color:#64748b;font-size:12px;"></div>
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
        const pickupTimeEl = document.getElementById("rt_pickup_time") as HTMLInputElement | null;
        const summaryEl = document.getElementById("rt_summary") as HTMLDivElement | null;
        const bookingsEl = document.getElementById("rt_bookings") as HTMLDivElement | null;

        const setPickupBounds = () => {
          // With type="time" there are no date bounds; we just ensure a default time exists.
          if (!pickupTimeEl) return;
          if (!pickupTimeEl.value) pickupTimeEl.value = "09:00";
        };

        const formatRange = (startIso: string, endIso: string) => {
          const start = String(startIso).slice(0, 10);
          const end = String(endIso).slice(0, 10);
          return start === end ? start : `${start} → ${end}`;
        };

        if (bookingsEl) {
          if (bookings.length === 0) {
            bookingsEl.textContent = "";
          } else {
            const lines = bookings
              .slice(0, 6)
              .map((b) => `• ${formatRange(b.startDate, b.endDate)}`)
              .join("<br/>");
            bookingsEl.innerHTML = `<div style="font-weight:600;color:#334155;margin-bottom:4px;">Rangos ocupados:</div>${lines}`;
          }
        }
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
        // Ensure pickupAt stays inside selected date range
        setPickupBounds();
        fromEl?.addEventListener("change", () => setPickupBounds());
        toEl?.addEventListener("change", () => setPickupBounds());
        pickupTimeEl?.addEventListener("change", () => setPickupBounds());
      },
      preConfirm: () => {
        if (hasPendingRequest) {
          Swal.showValidationMessage("Ya enviaste una solicitud en trámite para esta herramienta.");
          return;
        }
        const fromEl = document.getElementById("rt_from") as HTMLInputElement | null;
        const toEl = document.getElementById("rt_to") as HTMLInputElement | null;
        const msgEl = document.getElementById("rt_msg") as HTMLInputElement | null;
        const pickupLabelEl = document.getElementById("rt_pickup_label") as HTMLInputElement | null;
        const pickupTimeEl = document.getElementById("rt_pickup_time") as HTMLInputElement | null;
        const fromDate = fromEl?.value ?? "";
        const toDate = toEl?.value ?? "";
        const pickupLabel = (pickupLabelEl?.value ?? "").trim();
        const pickupTime = (pickupTimeEl?.value ?? "").trim();
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
        if (!pickupTime) {
          Swal.showValidationMessage("Selecciona la hora de entrega.");
          return;
        }
        // pickupAt is always the same date as "Desde" + selected time.
        const pickupAt = buildPickupAtIso(fromDate, pickupTime);

        // Estricto: pickupAt debe ser el mismo día de "Desde"
        const pickupDay = pickupAt.slice(0, 10);
        if (pickupDay !== fromDate) {
          Swal.showValidationMessage("La entrega debe ser el mismo día de la fecha de inicio (Desde).");
          return;
        }

        const startIso = new Date(fromDate + "T00:00:00.000Z").toISOString();
        const endIso = new Date(toDate + "T00:00:00.000Z").toISOString();
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
        const msg = String(e?.response?.data?.message ?? "");
        if (msg.toLowerCase().includes("solicitud") && msg.toLowerCase().includes("trámite")) {
          setHasPendingRequest(true);
          await alerts.info("Solicitud ya enviada", "Ya enviaste una solicitud, espera respuesta del dueño.");
          return;
        }
        await alerts.error("Fechas ocupadas", "La herramienta no está disponible en esas fechas. Elige otras.");
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

  if (tool.isAvailable === false) {
    return (
      <div className="max-w-5xl mx-auto py-20 px-4 flex flex-col items-center gap-4 text-center">
        <div className="text-5xl">🔒</div>
        <h2 className="text-2xl font-black text-slate-800">Herramienta no disponible</h2>
        <p className="text-slate-500 max-w-md">Esta herramienta fue pausada temporalmente por su propietario y no está disponible para alquilar en este momento.</p>
        <button onClick={() => navigate(-1)} className="mt-4 text-sm font-semibold text-primary hover:underline">← Volver</button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-2 py-6 sm:px-4 sm:py-10">
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2 lg:gap-8">
        <div className="space-y-4">
          <ImageCarousel images={images} alt={tool.name} index={imageIndex} onIndexChange={setImageIndex} showRentedBadge={isRented} />

          {images.length > 1 && (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3">
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
              <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                <div className="rounded-xl border border-slate-200 bg-white p-3">
                  <div className="text-xs text-slate-500">Estado</div>
                  <div className="font-semibold text-slate-800">
                    {isRented ? "Actualmente alquilado" : tool.isAvailable ? "Disponible" : "No disponible"}
                  </div>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-3">
                  <div className="text-xs text-slate-500">Uso</div>
                  <div className="font-semibold text-slate-800">{usageLevel ?? "—"}</div>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-3">
                  <div className="text-xs text-slate-500">Depósito recomendado</div>
                  <div className="font-semibold text-slate-800">
                    {depositRecommendation}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">Se recalcula al pedir el alquiler.</div>
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
{typeof tool.ratingScore === "number" && (
  <div className="flex items-center gap-1 mt-2">
    <StarRow rating={tool.ratingScore} />
    <span className="text-sm text-slate-600">{tool.ratingScore.toFixed(1)} / 5</span>
    {typeof tool.ratingCount === "number" && (
      <span className="text-xs text-slate-500 ml-2">({tool.ratingCount} review{tool.ratingCount !== 1 ? "s" : ""})</span>
    )}
  </div>
)}
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

            {meetingLocations.length > 0 && (
              <div className="pt-1">
                <div className="text-sm font-semibold text-slate-800 mb-2">Puntos de encuentro</div>
                <div className="grid gap-2">
                  {meetingLocations.map((location: any, index: number) => (
                    <div key={`${location.label ?? location.address ?? index}-${index}`} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="font-semibold text-slate-900">{location.label ?? `Punto ${index + 1}`}</div>
                          <div className="text-sm text-slate-600">{location.address ?? "Dirección no disponible"}</div>
                          {location.notes ? <div className="mt-1 text-xs text-slate-500">{location.notes}</div> : null}
                        </div>
                        <span className="rounded-full bg-white px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-primary border border-orange-100">
                          Opción {index + 1}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
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
              <Button
                className="w-full h-11"
                onClick={handleRequestRental}
                disabled={requestStatusLoading || hasPendingRequest || !canRequestRental}
              >
                {hasPendingRequest
                  ? "Solicitud en trámite"
                  : requestStatusLoading
                    ? "Verificando..."
                    : "Solicitar alquiler"}
              </Button>
              <div className="mt-2 text-xs text-slate-500">
                {hasPendingRequest
                  ? "Solicitud en trámite. Espera la respuesta del propietario."
                  : !canRequestRental
                  ? "Debes completar y aprobar tu KYC para solicitar alquiler."
                  : isRented
                  ? "Algunas fechas están bloqueadas por alquileres activos. Podrás reservar a partir del día siguiente al fin del alquiler actual."
                  : "Verifica disponibilidad y coordina entrega con el propietario."}
              </div>
            </div>

            {tool && uuid ? (
              <RentalRequestDialog
                open={requestDialogOpen}
                onOpenChange={setRequestDialogOpen}
                tool={tool}
                toolUuid={uuid}
                meetingLocations={meetingLocations}
                onCreated={async () => {
                  try {
                    setRequestStatusLoading(true);
                    const status = await rentalRequestService.getStatus(uuid);
                    setHasPendingRequest(status.hasPending);
                  } catch {
                    setHasPendingRequest(true);
                  } finally {
                    setRequestStatusLoading(false);
                  }
                }}
              />
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
