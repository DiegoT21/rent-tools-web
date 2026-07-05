import { 
  User, 
  Package, 
  FileText, 
  LogOut, 
  Edit3, 
  MoreHorizontal, 
  Star,
  ShieldCheck,
  MapPin,
  Calendar,
  Plus,
  ArrowUpRight,
  Search,
  SlidersHorizontal,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Pause,
  Trash2,
  Play,
  Hammer,
  Zap,
  Scissors,
  Wrench
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CreateListing } from "./CreateListing";
import { useAuthStore } from "@/store/authStore";
import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "@/lib/api";
import { rentalRequestService, RentalRequestListItem } from "@/services/rentalRequestService";
import { userService } from "@/services/userService";
import { alerts } from "@/lib/alerts";
import Swal from "sweetalert2";
import { contractService } from "@/services/contractService";
import { rentalsMetricsService, OwnerRentalMetrics } from "@/services/rentalsMetricsService";
import { authService } from "@/services/authService";
import { getInventoryAvailabilityLabel } from "@/lib/rentalAvailability";
import { markRentalRequestsSeen, notifyRentalRequestsUpdated } from "@/hooks/useRentalNotifications";
import { UserAvatar } from "@/components/UserAvatar";
import { PhotoCaptureDialog, dataUrlToFile } from "@/components/ui/PhotoCaptureDialog";
import { Loader2 } from "lucide-react";

function safeParseDate(value: unknown): Date | null {
  if (typeof value === "string" || typeof value === "number") {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  return null;
}

function formatDateOnly(value?: string) {
  if (!value) return "—";
  const normalized = String(value).slice(0, 10);
  const [year, month, day] = normalized.split("-").map(Number);
  if (!year || !month || !day) return "—";
  return `${String(day).padStart(2, "0")}/${String(month).padStart(2, "0")}/${year}`;
}

function isRequestPending(value?: string) {
  const status = String(value ?? "").toLowerCase();
  return status === "pending" || status === "pending_owner" || status === "pending_tenant";
}

function isRequestExpired(req: RentalRequestListItem) {
  if (!isRequestPending(req.status)) return false;
  const expiresAt = req.expiresAt ? new Date(req.expiresAt).getTime() : 0;
  if (expiresAt) return Date.now() >= expiresAt;
  const createdAt = req.createdAt ? new Date(req.createdAt).getTime() : 0;
  if (!createdAt) return false;
  return Date.now() - createdAt >= 24 * 60 * 60 * 1000;
}

function normalizeRequestForUi(req: RentalRequestListItem, tab: "pending" | "approved" | "all") {
  if (!isRequestExpired(req)) return req;
  if (tab === "pending") return null;
  return {
    ...req,
    status: "rejected" as const,
    rejectionReason: req.rejectionReason || "Solicitud vencida por falta de respuesta.",
    __expired: true,
  };
}

function formatCountdown(targetIso?: string, now = Date.now()) {
  if (!targetIso) return "";
  const target = new Date(targetIso).getTime();
  if (!target || Number.isNaN(target)) return "";
  const diff = target - now;
  if (diff <= 0) return "Expira ahora";
  const totalSeconds = Math.floor(diff / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    const remainHours = hours % 24;
    return `Esta solicitud vence en ${days}d ${remainHours}h`;
  }
  if (hours > 0) {
    return `Esta solicitud vence en ${hours}h ${String(minutes).padStart(2, "0")}m`;
  }
  return `Expira en ${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function ImageCarousel({ images, alt }: { images: string[]; alt: string }) {
  const pics = (images || []).filter(Boolean).slice(0, 3);
  const [index, setIndex] = useState(0);

  if (pics.length === 0) {
    return (
      <div className="w-20 h-20 rounded-2xl flex items-center justify-center shrink-0 bg-slate-100 text-slate-900">
        <Wrench className="h-10 w-10" />
      </div>
    );
  }

  const prev = () => setIndex((i) => (i - 1 + pics.length) % pics.length);
  const next = () => setIndex((i) => (i + 1) % pics.length);

  return (
    <div className="w-20 shrink-0">
      <div className="relative w-20 h-20 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200">
        <img src={pics[index]} alt={alt} className="w-full h-full object-cover" />

        {pics.length > 1 && (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                prev();
              }}
              className="absolute left-1 top-1/2 -translate-y-1/2 h-7 w-7 rounded-full bg-white/90 border border-slate-200 text-slate-700 hover:bg-white grid place-items-center"
              aria-label="Imagen anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                next();
              }}
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 rounded-full bg-white/90 border border-slate-200 text-slate-700 hover:bg-white grid place-items-center"
              aria-label="Imagen siguiente"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </>
        )}
      </div>
      {pics.length > 1 && (
        <div className="mt-1 flex items-center justify-center gap-1">
          {pics.map((_, i) => (
            <span key={i} className={cn("h-1.5 w-1.5 rounded-full", i === index ? "bg-primary" : "bg-slate-200")} />
          ))}
        </div>
      )}
    </div>
  );
}

const menuItems = [
  { id: "perfil", label: "Mi Perfil", icon: User },
  { id: "inventario", label: "Mi Inventario", icon: Package },
  { id: "alquileres", label: "Alquileres", icon: Calendar },
  { id: "solicitudes", label: "Solicitudes", icon: FileText },
];

const inventoryItems = [
  {
    id: 1,
    name: "Rotomartillo Industrial XT-200",
    category: "PERFORACIÓN PESADA",
    status: "Disponible",
    statusColor: "bg-teal-50 text-teal-600 border-teal-100",
    barColor: "bg-teal-500",
    price: "45.00",
    stats: "12 alquileres este mes",
    icon: Hammer,
    iconBg: "bg-green-100 text-green-600",
    borderColor: "border-l-teal-500"
  },
  {
    id: 2,
    name: "Generador Eléctrico 5500W",
    category: "ENERGÍA PORTÁTIL",
    status: "Alquilado",
    statusColor: "bg-orange-50 text-orange-600 border-orange-100",
    barColor: "bg-orange-500",
    price: "120.00",
    stats: "5 alquileres este mes",
    icon: Zap,
    iconBg: "bg-slate-100 text-slate-900",
    borderColor: "border-l-orange-500"
  },
  {
    id: 3,
    name: "Sierra Circular Pro-Cut 7\"",
    category: "CARPINTERÍA",
    status: "Mantenimiento",
    statusColor: "bg-slate-100 text-slate-500 border-slate-200",
    barColor: "bg-slate-300",
    price: "30.00",
    stats: "Inactivo por servicio",
    icon: Scissors,
    iconBg: "bg-orange-500 text-white",
    borderColor: "border-l-slate-400"
  }
];

export function UserProfile() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "perfil";
  const navigate = useNavigate();
  const { user, accessToken, clearSession, hasHydrated } = useAuthStore();
  const [inventory, setInventory] = useState<any[]>([]);
  const [inventoryLoading, setInventoryLoading] = useState(false);
  const [inventoryError, setInventoryError] = useState<string | null>(null);
  const [inventoryPage, setInventoryPage] = useState(1);
  const [inventoryTotal, setInventoryTotal] = useState<number>(0);
  const [inventoryTotalPages, setInventoryTotalPages] = useState<number>(1);
  const [inventorySearch, setInventorySearch] = useState("");
  const [activeRentals, setActiveRentals] = useState<RentalRequestListItem[]>([]);
  const [ownerMetrics, setOwnerMetrics] = useState<OwnerRentalMetrics | null>(null);
  const [ownerMetricsLoading, setOwnerMetricsLoading] = useState(false);

  const [requestsMode, setRequestsMode] = useState<"received" | "sent">("received");
  const [requestsTab, setRequestsTab] = useState<"pending" | "approved" | "all">("pending");
  const [requests, setRequests] = useState<RentalRequestListItem[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [requestsError, setRequestsError] = useState<string | null>(null);
  const [requestsPage, setRequestsPage] = useState(1);
  const [requestsTotalPages, setRequestsTotalPages] = useState(1);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarDialogOpen, setAvatarDialogOpen] = useState(false);
  const [requestClock, setRequestClock] = useState(Date.now());

  const [userReviews, setUserReviews] = useState<any[]>([]);
  const [userSummary, setUserSummary] = useState<{ count: number; averageRating: number } | null>(null);
  const [userReviewsLoading, setUserReviewsLoading] = useState(false);
  const [profileTab, setProfileTab] = useState<"resenas" | "listados" | "historial">("resenas");

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
    let cancelled = false;
    const uid = user?.uuid || user?.id || user?._id;
    if (!uid) return;
    if (activeTab !== "perfil") return;

    setUserReviewsLoading(true);
    userService.getReviews(uid)
      .then((data) => {
        if (cancelled) return;
        setUserReviews(data.reviews ?? []);
        setUserSummary(data.summary ?? { count: 0, averageRating: 0 });
      })
      .catch((err) => {
        console.error("Error fetching user reviews:", err);
      })
      .finally(() => {
        if (!cancelled) setUserReviewsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user, activeTab]);

  // Redirigir a login si no hay usuario (protección de ruta)
  useEffect(() => {
    if (!hasHydrated) return;
    if (!accessToken) {
      navigate("/login");
      return;
    }
    authService.getProfile().catch(() => undefined);
  }, [accessToken, hasHydrated, navigate]);

  useEffect(() => {
    if (activeTab === "solicitudes") {
      markRentalRequestsSeen();
    }
  }, [activeTab]);

  useEffect(() => {
    const timer = window.setInterval(() => setRequestClock(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const uploadAvatarFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Selecciona un archivo de imagen (JPG, PNG o WebP).");
      return;
    }

    setAvatarUploading(true);
    try {
      await authService.updateProfileImage(file);
    } catch (error: any) {
      console.error("Error al actualizar avatar:", error);
      alert(error.response?.data?.message || error.message || "No se pudo actualizar la foto de perfil.");
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleAvatarCapture = async (imageSrc: string, file?: File) => {
    const uploadFile = file ?? (await dataUrlToFile(imageSrc, "avatar.jpg"));
    await uploadAvatarFile(uploadFile);
  };

  const openAvatarPicker = () => setAvatarDialogOpen(true);

  const handleLogout = () => {
    clearSession();
    navigate("/login");
  };

  const setActiveTab = (tab: string) => {
    setSearchParams({ tab });
  };

  const fetchActiveRentals = async () => {
    if (!accessToken) return;
    try {
      const result = await rentalRequestService.getReceived(1, "approved");
      const normalized = (result.data ?? []).map((item: any) =>
        rentalRequestService.normalizeForUi(item)
      );
      setActiveRentals(normalized);
    } catch {
      setActiveRentals([]);
    }
  };

  const fetchInventoryPage = async (opts: { page: number; mode: "replace" | "append" }) => {
    if (!accessToken) return;

    setInventoryLoading(true);
    setInventoryError(null);
    try {
      const response = await api.get("/tools/me", { params: { page: opts.page } });
      const payload = response.data;
      const tools = Array.isArray(payload?.data) ? payload.data : [];
      const pagination = payload?.pagination;

      setInventory((prev) => (opts.mode === "append" ? [...prev, ...tools] : tools));
      setInventoryPage(Number(pagination?.page ?? opts.page));
      setInventoryTotal(Number(pagination?.total ?? tools.length));
      setInventoryTotalPages(Number(pagination?.totalPages ?? 1));
    } catch (err: any) {
      setInventory([]);
      setInventoryError(err?.response?.data?.message || "No se pudo cargar tu inventario.");
      setInventoryPage(1);
      setInventoryTotal(0);
      setInventoryTotalPages(1);
    } finally {
      setInventoryLoading(false);
    }
  };

  // Carga inventario para: (a) tab inventario (lista) y (b) tab perfil (conteo de publicaciones)
  useEffect(() => {
    if (!accessToken) return;
    if (activeTab !== "inventario" && activeTab !== "perfil") return;
    fetchInventoryPage({ page: 1, mode: "replace" });
    fetchActiveRentals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, accessToken]);

  useEffect(() => {
    if (!accessToken) return;
    const onUpdated = () => {
      void fetchActiveRentals();
    };
    window.addEventListener("rental-requests-updated", onUpdated);
    return () => window.removeEventListener("rental-requests-updated", onUpdated);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!accessToken) return;
      if (activeTab !== "perfil" && activeTab !== "inventario") return;

      setOwnerMetricsLoading(true);
      try {
        const now = new Date();
        const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
        const data = await rentalsMetricsService.getOwnerMetrics(month);
        if (!cancelled) setOwnerMetrics(data);
      } catch {
        if (!cancelled) setOwnerMetrics(null);
      } finally {
        if (!cancelled) setOwnerMetricsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [activeTab, accessToken]);

  const fetchRequestsPage = async (opts: {
    page: number;
    mode: "replace" | "append";
    kind: "received" | "sent";
    tab: "pending" | "approved" | "all";
  }) => {
    if (!accessToken) return;
    setRequestsLoading(true);
    setRequestsError(null);

    try {
      const result =
        opts.kind === "received"
          ? await rentalRequestService.getReceived(opts.page, opts.tab)
          : await rentalRequestService.getSent(opts.page, opts.tab);

      const normalized = (result.data ?? [])
        .map((r: any) => rentalRequestService.normalizeForUi(r))
        .map((r: RentalRequestListItem) => normalizeRequestForUi(r, opts.tab))
        .filter((r): r is RentalRequestListItem => Boolean(r));
      setRequests((prev) => (opts.mode === "append" ? [...prev, ...normalized] : normalized));
      setRequestsPage(Number(result.pagination?.page ?? opts.page));
      setRequestsTotalPages(Number(result.pagination?.totalPages ?? 1));
      return normalized;
    } catch (e: any) {
      setRequests([]);
      setRequestsError(e?.response?.data?.message || "No se pudieron cargar las solicitudes.");
      setRequestsPage(1);
      setRequestsTotalPages(1);
      return [];
    } finally {
      setRequestsLoading(false);
    }
  };

  useEffect(() => {
    if (!accessToken) return;
    if (activeTab !== "solicitudes") return;
    (async () => {
      const current = await fetchRequestsPage({ page: 1, mode: "replace", kind: requestsMode, tab: requestsTab });
      // Si el usuario no tiene recibidas pero sí enviadas, cambiamos automáticamente a "enviadas"
      if (requestsMode === "received") {
        try {
          const sent = await rentalRequestService.getSent(1, requestsTab);
          if ((sent.data?.length ?? 0) > 0 && (current?.length ?? 0) === 0) {
            setRequestsMode("sent");
          }
        } catch {
          // ignore
        }
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, accessToken, requestsMode, requestsTab]);

  // requests are already filtered server-side via requestsTab (pending/approved/all)

  const showRenterReviews = async (renterUuid: string, renterName: string) => {
    if (!renterUuid) {
      await alerts.warning("Sin identificador", "No se pudo obtener el id del solicitante para cargar sus reviews.");
      return;
    }
    try {
      const data = await userService.getReviews(renterUuid);
      const summary = data.summary ?? { count: 0, averageRating: 0 };
      const reviews = Array.isArray(data.reviews) ? data.reviews : [];
      const rows = reviews
        .slice(0, 6)
        .map((r) => {
          const rating = typeof r.rating === "number" ? r.rating : 0;
          const comment = (r.comment ?? "").toString();
          return `<div style="padding:10px 0;border-top:1px solid #e2e8f0;">
            <div style="font-weight:700;color:#0f172a;">${rating.toFixed(1)} / 5</div>
            <div style="color:#334155;font-size:13px;white-space:pre-line;">${comment || "Sin comentario"}</div>
          </div>`;
        })
        .join("");

      await Swal.fire({
        title: `Reviews de ${renterName}`,
        html: `
          <div style="text-align:left">
            <div style="margin-bottom:10px;color:#0f172a;">
              <b>${summary.averageRating?.toFixed?.(1) ?? summary.averageRating}</b> promedio · <b>${summary.count}</b> review(s)
            </div>
            <div style="max-height:320px;overflow:auto;border:1px solid #e2e8f0;border-radius:12px;padding:0 12px;">
              ${rows || `<div style="padding:14px 0;color:#64748b;">Este usuario aún no tiene reviews.</div>`}
            </div>
          </div>
        `,
        confirmButtonText: "Listo",
        confirmButtonColor: "#f97316",
      });
    } catch (e: any) {
      await alerts.error("No se pudieron cargar los reviews", e?.response?.data?.message || "Intenta de nuevo.");
    }
  };

  const showRequestSummary = async (req: RentalRequestListItem) => {
    const startText = formatDateOnly(req.startDate);
    const endText = formatDateOnly(req.endDate);
    const pickupLabel = req.pickupProposal?.label || req.pickup?.label || "Punto de encuentro";
    const pickupText =
      req.pickupProposal?.addressLabel ||
      req.pickup?.addressLabel ||
      req.pickupProposal?.notes ||
      "Por definir";
    const pickupAtValue = req.pickupProposal?.pickupAt || req.pickup?.pickupAt;
    const pickupAtText = pickupAtValue
      ? new Intl.DateTimeFormat("es-PA", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        }).format(new Date(pickupAtValue))
      : "—";
    const subtotal = Number(req.pricingSummary?.subtotal ?? 0) || 0;
    const hold = Number(req.pricingSummary?.hold ?? 0) || 0;
    const total = Number(req.pricingSummary?.totalEstimated ?? subtotal + hold) || subtotal + hold;

    await Swal.fire({
      title: "Resumen de solicitud",
      html: `
        <div style="text-align:left;display:grid;gap:12px">
          <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;padding:14px 16px;">
            <div style="font-size:12px;font-weight:700;color:#94a3b8;letter-spacing:.08em;text-transform:uppercase;margin-bottom:6px;">Fechas</div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
              <div>
                <div style="font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.06em;">Fecha de entrega</div>
                <div style="font-size:15px;font-weight:800;color:#0f172a;">${startText}</div>
              </div>
              <div>
                <div style="font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.06em;">Fecha de devolución</div>
                <div style="font-size:15px;font-weight:800;color:#0f172a;">${endText}</div>
              </div>
            </div>
          </div>
          <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:14px;padding:14px 16px;">
            <div style="font-size:12px;font-weight:700;color:#fb923c;letter-spacing:.08em;text-transform:uppercase;margin-bottom:6px;">Punto elegido</div>
            <div style="font-size:15px;font-weight:700;color:#0f172a;margin-bottom:4px;">${pickupLabel}</div>
            <div style="font-size:13px;line-height:1.45;color:#475569;">${pickupText}</div>
            <div style="margin-top:8px;font-size:13px;color:#64748b;"><b>Hora de entrega:</b> ${pickupAtText}</div>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
            <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;padding:14px 16px;">
              <div style="font-size:12px;font-weight:700;color:#94a3b8;letter-spacing:.08em;text-transform:uppercase;margin-bottom:6px;">Subtotal</div>
              <div style="font-size:18px;font-weight:800;color:#0f172a;">$${subtotal}</div>
            </div>
            <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;padding:14px 16px;">
              <div style="font-size:12px;font-weight:700;color:#94a3b8;letter-spacing:.08em;text-transform:uppercase;margin-bottom:6px;">Hold / depósito</div>
              <div style="font-size:18px;font-weight:800;color:#0f172a;">$${hold}</div>
            </div>
          </div>
          <div style="background:#0f172a;border-radius:16px;padding:16px;color:#fff;display:flex;align-items:center;justify-content:space-between;gap:12px;">
            <span style="font-size:13px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;opacity:.8;">Total estimado</span>
            <span style="font-size:24px;font-weight:900;">$${total}</span>
          </div>
        </div>
      `,
      confirmButtonText: "Listo",
      confirmButtonColor: "#f97316",
    });
  };

  const counterPropose = async (req: RentalRequestListItem) => {
    const { isConfirmed, value } = await Swal.fire({
      title: "Proponer cambio (pickup)",
      html: `
        <div style="text-align:left">
          <div style="color:#64748b;font-size:13px;margin-bottom:8px;">Propón un punto y hora aproximados.</div>
          <label style="display:flex;flex-direction:column;gap:6px;font-size:13px;margin-bottom:10px;">
            Lugar (texto)
            <input id="cp_addr" class="swal2-input" style="margin:0;height:40px" placeholder="Ej. Albrook Mall - entrada norte" />
          </label>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:10px;">
            <label style="display:flex;flex-direction:column;gap:6px;font-size:13px;">
              Lat (opcional)
              <input id="cp_lat" class="swal2-input" style="margin:0;height:40px" placeholder="8.99" />
            </label>
            <label style="display:flex;flex-direction:column;gap:6px;font-size:13px;">
              Lng (opcional)
              <input id="cp_lng" class="swal2-input" style="margin:0;height:40px" placeholder="-79.56" />
            </label>
          </div>
          <label style="display:flex;flex-direction:column;gap:6px;font-size:13px;margin-bottom:10px;">
            Hora de entrega
            <input id="cp_at" type="datetime-local" class="swal2-input" style="margin:0;height:40px" />
          </label>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:10px;">
            <label style="display:flex;flex-direction:column;gap:6px;font-size:13px;">
              Nueva fecha inicio (opcional)
              <input id="cp_start" type="date" class="swal2-input" style="margin:0;height:40px" />
            </label>
            <label style="display:flex;flex-direction:column;gap:6px;font-size:13px;">
              Nueva fecha fin (opcional)
              <input id="cp_end" type="date" class="swal2-input" style="margin:0;height:40px" />
            </label>
          </div>
          <label style="display:flex;flex-direction:column;gap:6px;font-size:13px;">
            Notas (opcional)
            <input id="cp_notes" class="swal2-input" style="margin:0;height:40px" placeholder="Ej. Frente al banco X" />
          </label>
        </div>
      `,
      confirmButtonText: "Enviar cambio",
      showCancelButton: true,
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#f97316",
      cancelButtonColor: "#0f172a",
      preConfirm: () => {
        const addr = (document.getElementById("cp_addr") as HTMLInputElement | null)?.value?.trim() ?? "";
        const latRaw = (document.getElementById("cp_lat") as HTMLInputElement | null)?.value?.trim() ?? "";
        const lngRaw = (document.getElementById("cp_lng") as HTMLInputElement | null)?.value?.trim() ?? "";
        const atRaw = (document.getElementById("cp_at") as HTMLInputElement | null)?.value ?? "";
        const startRaw = (document.getElementById("cp_start") as HTMLInputElement | null)?.value ?? "";
        const endRaw = (document.getElementById("cp_end") as HTMLInputElement | null)?.value ?? "";
        const notes = (document.getElementById("cp_notes") as HTMLInputElement | null)?.value?.trim() ?? "";
        if (!addr) {
          Swal.showValidationMessage("El lugar es requerido.");
          return;
        }
        if (!atRaw) {
          Swal.showValidationMessage("La hora de entrega es requerida.");
          return;
        }
        if ((startRaw && !endRaw) || (!startRaw && endRaw)) {
          Swal.showValidationMessage("Si cambias fechas, debes indicar inicio y fin.");
          return;
        }
        if (startRaw && endRaw && endRaw < startRaw) {
          Swal.showValidationMessage("La fecha fin no puede ser anterior a la fecha inicio.");
          return;
        }

        const pickupAt = new Date(atRaw).toISOString();
        const lat = latRaw ? Number(latRaw) : undefined;
        const lng = lngRaw ? Number(lngRaw) : undefined;
        if ((latRaw && Number.isNaN(lat)) || (lngRaw && Number.isNaN(lng))) {
          Swal.showValidationMessage("Lat/Lng inválidos.");
          return;
        }
        const dates =
          startRaw && endRaw
            ? { startDate: new Date(startRaw + "T00:00:00.000Z").toISOString(), endDate: new Date(endRaw + "T00:00:00.000Z").toISOString() }
            : null;
        return { pickup: { addressLabel: addr, pickupAt, lat, lng, notes: notes || undefined }, dates };
      },
    });

    if (!isConfirmed || !value) return;
    try {
      const id = rentalRequestService.getIdentifier(req as any);
      await rentalRequestService.act(
        id,
        { action: "counter_propose", pickup: value.pickup, dates: value.dates ?? undefined, _fallbackId: (req as any)._id } as any
      );
      await alerts.success("Enviado", "Se envió tu propuesta al solicitante.");
      fetchRequestsPage({ page: 1, mode: "replace", kind: "received", tab: requestsTab });
    } catch (e: any) {
      await alerts.error("No se pudo enviar", e?.response?.data?.message || "Intenta de nuevo.");
    }
  };

  const acceptCounter = async (req: RentalRequestListItem) => {
    if (String((req as any)?.status ?? "") !== "pending_tenant") {
      await alerts.info("Sin contraoferta", "No hay un ajuste pendiente para aceptar.");
      return;
    }
    const ok = await alerts.confirm({
      title: "Aceptar cambio",
      text: "¿Aceptas la propuesta del propietario?",
      confirmText: "Aceptar",
      cancelText: "Cancelar",
    });
    if (!ok) return;
    try {
      const id = rentalRequestService.getIdentifier(req as any);
      await rentalRequestService.act(id, { action: "accept_counter", _fallbackId: (req as any)._id } as any);
      await alerts.success("Aceptado", "Se aceptó la propuesta. Espera aprobación final.");
      fetchRequestsPage({ page: 1, mode: "replace", kind: "sent", tab: requestsTab });
    } catch (e: any) {
      await alerts.error("No se pudo aceptar", e?.response?.data?.message || "Intenta de nuevo.");
    }
  };

  const cancelRequest = async (req: RentalRequestListItem) => {
    const ok = await alerts.confirm({
      title: "Cancelar solicitud",
      text: "¿Seguro que deseas cancelar esta solicitud?",
      confirmText: "Cancelar solicitud",
      cancelText: "Volver",
    });
    if (!ok) return;
    try {
      const id = rentalRequestService.getIdentifier(req as any);
      await rentalRequestService.act(id, { action: "cancel", _fallbackId: (req as any)._id } as any);
      await alerts.success("Cancelada", "Tu solicitud fue cancelada.");
      fetchRequestsPage({ page: 1, mode: "replace", kind: "sent" });
    } catch (e: any) {
      await alerts.error("No se pudo cancelar", e?.response?.data?.message || "Intenta de nuevo.");
    }
  };

  const approveRequest = async (req: RentalRequestListItem) => {
    const ok = await alerts.confirm({
      title: "Aprobar solicitud",
      text: `¿Aprobar la solicitud de ${req.renter?.firstName ?? "usuario"} para "${req.tool?.name ?? "herramienta"}"?`,
      confirmText: "Aprobar",
      cancelText: "Cancelar",
    });
    if (!ok) return;
    try {
      const id = rentalRequestService.getIdentifier(req as any);
      const result = await rentalRequestService.act(id, { action: "approve", _fallbackId: (req as any)._id } as any);
      const updatedStatus = String(result?.request?.status ?? result?.status ?? "");
      if (updatedStatus === "pending_tenant") {
        await alerts.info(
          "Ajuste automático propuesto",
          "La fecha inicial ya pasó. Se propuso un ajuste automático. Esperando confirmación del solicitante."
        );
        fetchRequestsPage({ page: 1, mode: "replace", kind: "received", tab: requestsTab });
        notifyRentalRequestsUpdated();
        return;
      }
      await alerts.success("Aprobada", "La solicitud fue aprobada. Se generó el contrato.");
      let contractUuid = String(result?.contract?.uuid ?? result?.contractUuid ?? "");
      if (!contractUuid) {
        const contract = await contractService.getByRequest(String((req as any)?.uuid ?? ""));
        contractUuid = String(contract?.uuid ?? "");
      }
      fetchRequestsPage({ page: 1, mode: "replace", kind: "received", tab: requestsTab });
      fetchActiveRentals();
      fetchInventoryPage({ page: 1, mode: "replace" });
      notifyRentalRequestsUpdated();
      if (contractUuid) {
        navigate(`/rentals/contracts/${contractUuid}`);
      }
    } catch (e: any) {
      await alerts.error("No se pudo aprobar", e?.response?.data?.message || "Intenta de nuevo.");
    }
  };

  const rejectRequest = async (req: RentalRequestListItem) => {
    const { isConfirmed, value } = await Swal.fire({
      title: "Rechazar solicitud",
      input: "text",
      inputLabel: "Motivo (opcional)",
      inputPlaceholder: "Ej. No disponible en esas fechas",
      showCancelButton: true,
      confirmButtonText: "Rechazar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#f97316",
      cancelButtonColor: "#0f172a",
      preConfirm: (val) => (typeof val === "string" ? val.trim() : ""),
    });
    if (!isConfirmed) return;
    try {
      const id = rentalRequestService.getIdentifier(req as any);
      await rentalRequestService.act(id, { action: "reject", rejectionReason: value || undefined, _fallbackId: (req as any)._id } as any);
      await alerts.success("Rechazada", "La solicitud fue rechazada.");
      fetchRequestsPage({ page: 1, mode: "replace", kind: "received", tab: requestsTab });
      notifyRentalRequestsUpdated();
    } catch (e: any) {
      await alerts.error("No se pudo rechazar", e?.response?.data?.message || "Intenta de nuevo.");
    }
  };

  const inventoryCards = useMemo(() => {
    const query = inventorySearch.trim().toLowerCase();
    const filtered = query
      ? inventory.filter((t) => (t?.name || "").toString().toLowerCase().includes(query))
      : inventory;

    return filtered.map((tool) => {
      const key = tool?._id || tool?.id || tool?.uuid || tool?.name || crypto.randomUUID();
      const availability = getInventoryAvailabilityLabel(tool, activeRentals);
      const price = typeof tool?.pricePerDay === "number" ? tool.pricePerDay.toFixed(2) : "--";
      const category = (tool?.category || "Sin categoría").toString().toUpperCase();
      const images = Array.isArray(tool?.imageUrls) ? tool.imageUrls : Array.isArray(tool?.images) ? tool.images : [];

      return {
        key,
        tool,
        ...availability,
        price,
        category,
        images,
      };
    });
  }, [inventory, inventorySearch, activeRentals]);

  const deleteTool = async (tool: any) => {
    const toolUuid = String(tool?.uuid ?? tool?.id ?? tool?._id ?? "");
    if (!toolUuid) {
      await alerts.error("No se pudo borrar", "No se encontró el identificador de la herramienta.");
      return;
    }

    const ok = await alerts.confirm({
      title: "¿Seguro que quieres borrar esta herramienta?",
      text: "Esta acción no se puede deshacer.",
      confirmText: "Sí, borrar",
      cancelText: "Cancelar",
    });
    if (!ok) return;

    try {
      await api.delete(`/tools/${encodeURIComponent(toolUuid)}`);
      await alerts.success("Herramienta eliminada", "La herramienta fue eliminada exitosamente.");
      await fetchInventoryPage({ page: 1, mode: "replace" });
    } catch (e: any) {
      const status = e?.response?.status;
      const message = e?.response?.data?.message || "No se pudo eliminar la herramienta.";
      if (status === 409) {
        await alerts.warning("No se puede borrar", message || "La herramienta está alquilada o tiene un contrato activo.");
        return;
      }
      await alerts.error("No se pudo borrar", message);
    }
  };

  const editTool = (tool: any) => {
    navigate("/create-listing", { state: { editTool: tool } });
  };

  const toggleTool = async (tool: any) => {
    const toolUuid = String(tool?.uuid ?? tool?.id ?? tool?._id ?? "");
    if (!toolUuid) return;

    const willActivate = tool?.isAvailable === false;
    const ok = await alerts.confirm({
      title: willActivate ? "¿Activar herramienta?" : "¿Pausar herramienta?",
      text: willActivate
        ? "La herramienta volverá a aparecer en el marketplace."
        : "La herramienta dejará de aparecer en el marketplace temporalmente.",
      confirmText: willActivate ? "Sí, activar" : "Sí, pausar",
      cancelText: "Cancelar",
    });
    if (!ok) return;

    try {
      await api.patch(`/tools/${encodeURIComponent(toolUuid)}/toggle`);
      await fetchInventoryPage({ page: 1, mode: "replace" });
    } catch (e: any) {
      const status = e?.response?.status;
      const message = e?.response?.data?.message || "No se pudo cambiar el estado de la herramienta.";
      if (status === 409) { await alerts.warning("No permitido", message); return; }
      await alerts.error("Error", message);
    }
  };

  const metrics = useMemo(() => {
    const totalPublicaciones = inventoryTotal || inventory.length;
    const alquilados = inventory.filter((tool) =>
      getInventoryAvailabilityLabel(tool, activeRentals).status === "En renta"
    ).length;

    // Ingresos: hasta que el backend provea métricas de rentas/pagos, se queda en 0.
    const ingresosMes = ownerMetrics?.incomeMonth ?? 0;

    // Publicaciones esta semana (y delta vs semana anterior) si existe createdAt
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startThisWeek = new Date(startOfToday);
    startThisWeek.setDate(startThisWeek.getDate() - 7);
    const startPrevWeek = new Date(startOfToday);
    startPrevWeek.setDate(startPrevWeek.getDate() - 14);

    const createdDates = inventory
      .map((t) => safeParseDate(t?.createdAt))
      .filter((d): d is Date => Boolean(d));

    const thisWeekCount = createdDates.filter((d) => d >= startThisWeek && d < startOfToday).length;
    const prevWeekCount = createdDates.filter((d) => d >= startPrevWeek && d < startThisWeek).length;

    let publicacionesBadge: string | null = null;
    if (createdDates.length > 0) {
      if (thisWeekCount === prevWeekCount) publicacionesBadge = `${thisWeekCount} esta semana`;
      else {
        const diff = thisWeekCount - prevWeekCount;
        publicacionesBadge = `${diff > 0 ? "+" : ""}${diff} vs semana pasada`;
      }
    } else {
      publicacionesBadge = `${totalPublicaciones} en total`;
    }

    const utilizacion = totalPublicaciones > 0 ? Math.round((alquilados / totalPublicaciones) * 100) : 0;
    const utilizacionBadge = `${utilizacion}% utilizaciÃ³n`;

    const ingresosBadge = ownerMetricsLoading ? "Calculando..." : `${ownerMetrics?.month ?? ""}`;

    return {
      totalPublicaciones,
      alquilados,
      ingresosMes,
      publicacionesBadge,
      utilizacionBadge,
      ingresosBadge,
    };
  }, [inventory, inventoryTotal, ownerMetrics, ownerMetricsLoading, activeRentals]);

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 flex gap-8 min-h-[calc(100vh-140px)]">
      {/* Sidebar de Usuario */}
      <aside className="w-64 flex-shrink-0 space-y-2">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden p-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                if (item.id === "alquileres") {
                  navigate("/my-rentals");
                } else {
                  setActiveTab(item.id);
                }
              }}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-semibold transition-all duration-200",
                activeTab === item.id 
                  ? "bg-[#eef2ff] text-primary shadow-sm" 
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <item.icon className={cn("h-5 w-5", activeTab === item.id ? "text-primary" : "text-slate-400")} />
              {item.label}
            </button>
          ))}
          
          <div className="mt-4 pt-4 border-t border-slate-100">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-semibold text-red-500 hover:bg-red-50 transition-all duration-200"
            >
              <LogOut className="h-5 w-5" />
              Cerrar Sesión
            </button>
          </div>
        </div>
      </aside>

      {/* Área de Contenido Principal */}
      <main className="flex-1 space-y-6">
        {activeTab === "perfil" && !user?.isVerified && (
          <Card className="border-none shadow-sm bg-gradient-to-r from-orange-500 to-orange-600 text-white overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
              <ShieldCheck size={120} />
            </div>
            <CardContent className="p-6 relative z-10">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-white/20 hover:bg-white/30 text-white border-none font-bold">
                      PASO 2 DE 3
                    </Badge>
                    <span className="text-sm font-medium text-orange-100 italic">Identidad pendiente</span>
                  </div>
                  <h2 className="text-2xl font-black tracking-tight">Casi listo para rentar tus equipos</h2>
                  <p className="text-orange-100 text-sm font-medium max-w-md">
                    Completa tu verificación de identidad para poder publicar tus herramientas y empezar a generar ingresos hoy mismo.
                  </p>
                </div>
                
                <div className="flex flex-col items-center md:items-end gap-3 w-full md:w-auto">
                  <div className="w-full md:w-48 space-y-1.5">
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-wider">
                      <span>Progreso</span>
                      <span>66%</span>
                    </div>
                    <Progress value={66} className="h-2 bg-white/20" />
                  </div>
                  <Button 
                    onClick={() => navigate("/register/step-2")}
                    className="w-full md:w-auto bg-white text-orange-600 hover:bg-orange-50 font-bold px-8 h-11 rounded-xl shadow-lg shadow-black/10 transition-all active:scale-95"
                  >
                    Verificar ahora
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === "perfil" && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <Card className="border-none shadow-sm overflow-hidden bg-white">
              <CardContent className="p-8">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex gap-6">
                    <div className="relative">
                      <button
                        type="button"
                        onClick={openAvatarPicker}
                        disabled={avatarUploading}
                        className="h-28 w-28 rounded-full bg-orange-100 overflow-hidden border-4 border-white shadow-md relative group disabled:opacity-70"
                        aria-label="Cambiar foto de perfil"
                      >
                        <UserAvatar
                          firstName={user?.firstName}
                          lastName={user?.lastName}
                          profileImageUrl={user?.profileImageUrl}
                          className="h-full w-full"
                          textClassName="text-3xl text-primary"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          {avatarUploading ? (
                            <Loader2 className="h-6 w-6 text-white animate-spin" />
                          ) : (
                            <Edit3 className="h-6 w-6 text-white" />
                          )}
                        </div>
                      </button>
                      <span className="absolute bottom-1 right-1 grid h-8 w-8 place-items-center rounded-full bg-primary text-white border-4 border-white shadow-sm">
                        <Edit3 className="h-3.5 w-3.5" />
                      </span>
                    </div>
                    <div className="space-y-2 pt-2">
                      <h1 className="text-3xl font-black text-slate-900">
                        {user ? `${user.firstName} ${user.lastName || ''}` : 'Invitado'}
                      </h1>
                      <div className="flex items-center gap-4 text-sm text-slate-500 font-medium">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          <span>Panamá Oeste, Panamá</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>Miembro desde 2024</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="rounded-xl gap-2 font-bold px-6 text-slate-700"
                      onClick={openAvatarPicker}
                      disabled={avatarUploading}
                    >
                      {avatarUploading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Pencil className="h-4 w-4" />
                      )}
                      Editar Perfil
                    </Button>
                    <Button variant="outline" size="icon" className="rounded-xl text-slate-400">
                      <MoreHorizontal className="h-5 w-5" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
                  <div className="rounded-2xl bg-slate-50 border border-slate-100 p-5 text-center">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Calificación</p>
                    <p className="text-3xl font-black text-primary flex items-center justify-center gap-1">
                      {userSummary ? userSummary.averageRating.toFixed(1) : "0.0"}
                      <Star className="h-5 w-5 fill-primary text-primary" />
                    </p>
                    <p className="text-xs text-slate-400 font-medium mt-1">
                      Basado en {userSummary ? userSummary.count : 0} reseña{(userSummary?.count ?? 0) !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 border border-slate-100 p-5 text-center">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Rentas totales</p>
                    <p className="text-3xl font-black text-slate-900">{userSummary ? userSummary.count : 0}</p>
                    <p className="text-xs text-slate-400 font-medium mt-1">Herramientas alquiladas</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 border border-slate-100 p-5 text-center">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Publicaciones</p>
                    <p className="text-3xl font-black text-slate-900">{metrics.totalPublicaciones}</p>
                    <p className="text-xs text-slate-400 font-medium mt-1">Equipos en inventario</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm bg-white">
              <CardContent className="p-8">
                <div className="flex items-center gap-8 border-b border-slate-100 -mt-2 mb-8">
                  {([
                    ["resenas", "Reseñas"],
                    ["listados", "Mis Listados"],
                    ["historial", "Historial"],
                  ] as const).map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setProfileTab(value)}
                      className={cn(
                        "pb-4 text-sm font-semibold border-b-2 transition-colors -mb-px",
                        profileTab === value
                          ? "text-primary border-primary"
                          : "text-slate-500 border-transparent hover:text-slate-900"
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                {profileTab === "resenas" && (
                  <>
                    {userReviewsLoading && (
                      <div className="min-h-[200px] flex items-center justify-center text-slate-500 font-semibold gap-2">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Cargando reviews...
                      </div>
                    )}

                    {!userReviewsLoading && userReviews.length === 0 && (
                      <div className="flex flex-col items-center text-center py-10">
                        <div className="relative mb-6">
                          <div className="grid h-20 w-20 place-items-center rounded-2xl bg-orange-50 border border-orange-100">
                            <Star className="h-9 w-9 text-primary fill-primary" />
                          </div>
                          <span className="absolute -top-2 -right-2 grid h-8 w-8 place-items-center rounded-xl bg-white border border-slate-200 shadow-sm">
                            <FileText className="h-4 w-4 text-slate-400" />
                          </span>
                        </div>
                        <h3 className="text-xl font-black text-slate-900 mb-2">Aún no tienes reviews</h3>
                        <p className="text-sm text-slate-500 font-medium max-w-md mb-6">
                          Los reviews ayudan a mantener nuestra comunidad confiable y segura. Empieza a rentar para que otros te conozcan y construyas tu reputación en la plataforma.
                        </p>
                        <div className="flex flex-wrap justify-center gap-3">
                          <Button
                            onClick={() => navigate("/")}
                            className="rounded-xl bg-primary hover:bg-primary/90 text-white font-bold px-6 h-11"
                          >
                            Explorar Herramientas
                          </Button>
                          <Button
                            variant="outline"
                            className="rounded-xl border-slate-200 text-slate-700 font-bold px-6 h-11"
                          >
                            Invitar Amigos
                          </Button>
                        </div>

                        <div className="w-full max-w-lg mt-12">
                          <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest mb-3">
                            Vista previa de una reseña
                          </p>
                          <div className="rounded-2xl border border-slate-100 bg-white p-5 text-left opacity-60">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex items-center gap-3">
                                <div className="h-9 w-9 rounded-full bg-slate-100" />
                                <div>
                                  <p className="text-sm font-bold text-slate-800">Usuario de Prueba</p>
                                  <p className="text-xs text-slate-400">Alquiler: Excavadora Bobcat E35</p>
                                </div>
                              </div>
                              <StarRow rating={4} />
                            </div>
                            <p className="text-sm text-slate-500 italic mt-3">
                              "Excelente trato y la maquinaria estaba en perfectas condiciones. Muy recomendable."
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {!userReviewsLoading && userReviews.length > 0 && (
                      <div className="grid gap-4">
                        {userReviews.map((r, idx) => (
                          <div key={r.uuid ?? idx} className="rounded-2xl border border-slate-100 bg-white p-5 space-y-3 shadow-sm hover:shadow transition-shadow">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <StarRow rating={r.rating ?? 0} />
                                <span className="text-sm font-bold text-slate-800">
                                  {typeof r.rating === "number" ? r.rating.toFixed(1) : "—"} / 5
                                </span>
                              </div>
                              <span className="text-xs text-slate-400 font-medium">
                                {r.createdAt ? formatDateOnly(r.createdAt) : ""}
                              </span>
                            </div>
                            <p className="text-sm text-slate-600 whitespace-pre-line font-medium">
                              {r.comment || "Sin comentario"}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}

                {profileTab === "listados" && (
                  <div className="flex flex-col items-center text-center py-14">
                    <div className="grid h-20 w-20 place-items-center rounded-2xl bg-orange-50 border border-orange-100 mb-6">
                      <Package className="h-9 w-9 text-primary" />
                    </div>
                    <h3 className="text-xl font-black text-slate-900 mb-2">
                      {metrics.totalPublicaciones > 0 ? "Gestiona tu inventario" : "Aún no tienes listados"}
                    </h3>
                    <p className="text-sm text-slate-500 font-medium max-w-md mb-6">
                      {metrics.totalPublicaciones > 0
                        ? `Tienes ${metrics.totalPublicaciones} equipo${metrics.totalPublicaciones !== 1 ? "s" : ""} publicado${metrics.totalPublicaciones !== 1 ? "s" : ""}. Revísalos en tu inventario.`
                        : "Publica tu primera herramienta y empieza a generar ingresos."}
                    </p>
                    <Button
                      onClick={() => setActiveTab("inventario")}
                      className="rounded-xl bg-primary hover:bg-primary/90 text-white font-bold px-6 h-11"
                    >
                      Ir a Mi Inventario
                    </Button>
                  </div>
                )}

                {profileTab === "historial" && (
                  <div className="flex flex-col items-center text-center py-14">
                    <div className="grid h-20 w-20 place-items-center rounded-2xl bg-orange-50 border border-orange-100 mb-6">
                      <Calendar className="h-9 w-9 text-primary" />
                    </div>
                    <h3 className="text-xl font-black text-slate-900 mb-2">Historial de alquileres</h3>
                    <p className="text-sm text-slate-500 font-medium max-w-md mb-6">
                      Consulta el detalle de tus rentas activas y pasadas en la sección de alquileres.
                    </p>
                    <Button
                      onClick={() => navigate("/my-rentals")}
                      className="rounded-xl bg-primary hover:bg-primary/90 text-white font-bold px-6 h-11"
                    >
                      Ver Alquileres
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "inventario" && (
          <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
            {/* Cabecera y Título */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  Cuenta <span className="text-[8px]">●</span> Inventario
                </p>
                <h1 className="text-4xl font-black text-slate-900 tracking-tight">Mi Inventario</h1>
              </div>
              <Button 
                onClick={() => setActiveTab("publicar")}
                className="bg-orange-500 hover:bg-orange-600 text-white font-bold h-12 px-8 rounded-xl shadow-lg shadow-orange-200 gap-2"
              >
                <Plus className="h-5 w-5" />
                Publicar
              </Button>
            </div>

            {/* Tarjetas de Estadísticas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="border-none shadow-sm bg-[#fafaff] relative overflow-hidden group">
                <CardContent className="p-6 space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="bg-orange-100 p-2.5 rounded-lg">
                      <Package className="h-5 w-5 text-primary" />
                    </div>
                    <Badge variant="secondary" className="bg-orange-50 text-orange-600 border-none font-bold text-[10px]">
                      {metrics.publicacionesBadge}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Publicaciones</p>
                    <p className="text-4xl font-black text-slate-900">{metrics.totalPublicaciones}</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm bg-[#fafaff] relative overflow-hidden">
                <CardContent className="p-6 space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="bg-orange-100 p-2.5 rounded-lg">
                      <Wrench className="h-5 w-5 text-primary" />
                    </div>
                    <Badge variant="secondary" className="bg-orange-50 text-orange-600 border-none font-bold text-[10px]">
                      {metrics.utilizacionBadge}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Actualmente Alquilados</p>
                    <p className="text-4xl font-black text-slate-900">{metrics.alquilados}</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm bg-[#fafaff] relative overflow-hidden">
                <CardContent className="p-6 space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="bg-orange-100 p-2.5 rounded-lg">
                      <ArrowUpRight className="h-5 w-5 text-primary" />
                    </div>
                    <Badge variant="secondary" className="bg-orange-50 text-orange-600 border-none font-bold text-[10px]">
                      {metrics.ingresosBadge}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Ingresos del mes</p>
                    <p className="text-4xl font-black text-slate-900">${metrics.ingresosMes}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Filtros y Búsqueda */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <Input 
                  placeholder="Buscar equipo por nombre o ID..." 
                  className="pl-10 h-12 bg-slate-50 border-transparent rounded-xl focus-visible:ring-primary/20"
                  value={inventorySearch}
                  onChange={(e) => setInventorySearch(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" className="h-12 px-6 rounded-xl bg-slate-50 text-slate-600 font-bold gap-2">
                  <SlidersHorizontal className="h-4 w-4" />
                  Filtrar
                </Button>
                <Button variant="secondary" className="h-12 px-6 rounded-xl bg-slate-50 text-slate-600 font-bold gap-2">
                  <ChevronDown className="h-4 w-4" />
                  Ordenar
                </Button>
              </div>
            </div>

            {/* Lista de Productos */}
            <div className="space-y-4">
              {inventoryLoading && (
                <Card className="border-none shadow-sm bg-white">
                  <CardContent className="p-6 text-slate-600 font-semibold">
                    Cargando inventario...
                  </CardContent>
                </Card>
              )}

              {!inventoryLoading && inventoryError && (
                <Card className="border-none shadow-sm bg-white border border-red-100">
                  <CardContent className="p-6 text-red-600 font-semibold">
                    {inventoryError}
                  </CardContent>
                </Card>
              )}

              {!inventoryLoading && !inventoryError && inventoryCards.length === 0 && (
                <Card className="border-none shadow-sm bg-white">
                  <CardContent className="p-6 text-slate-600 font-semibold">
                    AÃºn no tienes herramientas publicadas.
                  </CardContent>
                </Card>
              )}
              {!inventoryLoading && !inventoryError && inventoryCards.map((item) => (
                <Card key={item.key} className={cn("border-none shadow-sm bg-white overflow-hidden border-l-4", item.borderColor)}>
                  <CardContent className="p-6 flex flex-col md:flex-row items-center gap-6">
                    {/* Imagen/Icono representativo */}
                    <ImageCarousel images={item.images} alt={item.tool?.name || "Herramienta"} />

                    <div className="flex-1 space-y-1 text-center md:text-left">
                      <h3 className="text-xl font-bold text-slate-900">{item.tool?.name || "Sin nombre"}</h3>
                      <p className="text-[10px] font-black text-slate-400 tracking-widest uppercase">{item.category}</p>
                    </div>

                    <div className="w-full md:w-48 space-y-2">
                      <div className="flex justify-between items-center text-[10px] font-bold">
                        <Badge variant="outline" className={cn("rounded-full px-3 py-0.5", item.statusColor)}>
                          <span className="h-1.5 w-1.5 rounded-full bg-current mr-2 inline-block" />
                          {item.status}
                        </Badge>
                      </div>
                      <Progress value={item.available ? 100 : item.status === "En renta" ? 15 : 30} className="h-1.5 bg-slate-100" />
                    </div>

                    <div className="text-center md:text-right px-8 border-x border-slate-50">
                      <p className="text-2xl font-black text-slate-900">${item.price}<span className="text-xs text-slate-400 font-bold"> /día</span></p>
                      <p className="text-[10px] font-bold text-primary uppercase tracking-tight flex items-center justify-center md:justify-end gap-1">
                        <ArrowUpRight className="h-3 w-3" />
                        {item.footnote}
                      </p>
                    </div>

                    <div className="flex gap-2 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-full text-slate-400 hover:text-primary hover:bg-orange-50 disabled:opacity-30"
                        onClick={() => editTool(item.tool)}
                        disabled={item.status === "En renta"}
                        title={item.status === "En renta" ? "No puedes editar una herramienta en renta" : "Editar herramienta"}
                      >
                        <Pencil className="h-5 w-5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-full text-slate-400 hover:bg-slate-50 disabled:opacity-30"
                        onClick={() => toggleTool(item.tool)}
                        disabled={item.status === "En renta"}
                        title={item.status === "En renta" ? "No puedes pausar una herramienta en renta" : (item.tool?.isAvailable !== false ? "Pausar herramienta" : "Activar herramienta")}
                      >
                        {item.tool?.isAvailable !== false ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-full text-slate-400 hover:text-red-500 hover:bg-red-50"
                        onClick={() => deleteTool(item.tool)}
                      >
                        <Trash2 className="h-5 w-5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="flex justify-center pt-4">
              {inventoryPage < inventoryTotalPages && (
                <Button
                  variant="secondary"
                  disabled={inventoryLoading}
                  onClick={() => fetchInventoryPage({ page: inventoryPage + 1, mode: "append" })}
                  className="bg-orange-50 text-primary font-bold h-12 px-8 rounded-xl hover:bg-orange-100 transition-colors"
                >
                  {inventoryLoading ? "Cargando..." : "Cargar más herramientas"}
                </Button>
              )}
            </div>
          </div>
        )}

        {activeTab === "solicitudes" && (
          <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  Cuenta <span className="text-[8px]">●</span> Solicitudes
                </p>
                <h1 className="text-4xl font-black text-slate-900 tracking-tight">Solicitudes</h1>
              </div>
              <div className="flex flex-wrap gap-2 items-center">
                <div className="flex rounded-xl overflow-hidden border border-slate-200 bg-white">
                  <button
                    type="button"
                    onClick={() => setRequestsMode("received")}
                    className={cn(
                      "h-11 px-5 text-sm font-bold",
                      requestsMode === "received" ? "bg-orange-500 text-white" : "text-slate-700 hover:bg-slate-50"
                    )}
                  >
                    Recibidas
                  </button>
                  <button
                    type="button"
                    onClick={() => setRequestsMode("sent")}
                    className={cn(
                      "h-11 px-5 text-sm font-bold",
                      requestsMode === "sent" ? "bg-orange-500 text-white" : "text-slate-700 hover:bg-slate-50"
                    )}
                  >
                    Enviadas
                  </button>
                </div>

                <div className="flex rounded-xl overflow-hidden border border-slate-200 bg-white">
                  <button
                    type="button"
                    onClick={() => setRequestsTab("pending")}
                    className={cn(
                      "h-11 px-4 text-sm font-bold",
                      requestsTab === "pending" ? "bg-orange-500 text-white" : "text-slate-700 hover:bg-slate-50"
                    )}
                  >
                    Pendientes
                  </button>
                  <button
                    type="button"
                    onClick={() => setRequestsTab("approved")}
                    className={cn(
                      "h-11 px-4 text-sm font-bold",
                      requestsTab === "approved" ? "bg-orange-500 text-white" : "text-slate-700 hover:bg-slate-50"
                    )}
                  >
                    Aprobadas
                  </button>
                  <button
                    type="button"
                    onClick={() => setRequestsTab("all")}
                    className={cn(
                      "h-11 px-4 text-sm font-bold",
                      requestsTab === "all" ? "bg-orange-500 text-white" : "text-slate-700 hover:bg-slate-50"
                    )}
                  >
                    Todas
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {requestsLoading && (
                <Card className="border-none shadow-sm bg-white">
                  <CardContent className="p-6 text-slate-600 font-semibold">Cargando solicitudes...</CardContent>
                </Card>
              )}

              {!requestsLoading && requestsError && (
                <Card className="border-none shadow-sm bg-white border border-red-100">
                  <CardContent className="p-6 text-red-600 font-semibold">{requestsError}</CardContent>
                </Card>
              )}

              {!requestsLoading && !requestsError && requests.length === 0 && (
                <Card className="border-none shadow-sm bg-white">
                  <CardContent className="p-6 text-slate-600 font-semibold">
                    No tienes solicitudes {requestsMode === "received" ? "recibidas" : "enviadas"} para este filtro.
                  </CardContent>
                </Card>
              )}

              {!requestsLoading &&
                !requestsError &&
                requests.map((req) => {
                  const person = (req as any)?.tenant ?? (req as any)?.renter ?? (req as any)?.user ?? null;
                  const renterUuid = String(person?.uuid ?? person?._id ?? person?.id ?? "");
                  const renterFirst = person?.firstName ?? person?.name ?? "";
                  const renterLast = person?.lastName ?? "";
                  const renterName = `${String(renterFirst || "Usuario")} ${String(renterLast || "")}`.trim();
                  const toolName = req.tool?.name ?? "Herramienta";
                  const contractUuid = String((req as any)?.contract?.uuid ?? (req as any)?.contractUuid ?? "");
                  const expired = Boolean((req as any).__expired) || isRequestExpired(req);
                  const countdownText = expired
                    ? "Solicitud vencida por falta de respuesta."
                    : req.status === "pending" || req.status === "pending_owner" || req.status === "pending_tenant"
                      ? formatCountdown(req.expiresAt, requestClock)
                      : "";
                  const statusLabel =
                    expired
                      ? "Vencida"
                      : req.status === "approved"
                      ? "Aprobada"
                      : req.status === "rejected"
                      ? "Rechazada"
                      : req.status === "pending_tenant"
                      ? "Esperando solicitante"
                      : "Pendiente";
                  const statusClass =
                    expired
                      ? "bg-slate-100 text-slate-600 border-slate-200"
                      : req.status === "approved"
                      ? "bg-green-50 text-green-700 border-green-200"
                      : req.status === "rejected"
                      ? "bg-red-50 text-red-700 border-red-200"
                      : "bg-orange-50 text-orange-700 border-orange-200";

                  const canOwnerAct = !expired && (req.status === "pending" || req.status === "pending_owner");
                  const canTenantAct = req.status === "pending_tenant";

                  return (
                    <Card key={req.uuid} className="border-none shadow-sm bg-white overflow-hidden">
                      <CardContent className="p-6 flex flex-col md:flex-row md:items-center gap-5">
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className={cn("rounded-full px-3 py-0.5 font-bold text-[10px]", statusClass)}>
                              {statusLabel}
                            </Badge>
                            <div className="text-[10px] font-black text-slate-400 tracking-widest uppercase">
                              {formatDateOnly((req as any).fromDate ?? (req as any).startDate ?? undefined)} → {formatDateOnly((req as any).toDate ?? (req as any).endDate ?? undefined)}
                            </div>
                          </div>
                          <div className="text-xl font-bold text-slate-900">{toolName}</div>
                          <div className="text-sm text-slate-600">
                            {requestsMode === "received" ? (
                              <span>
                                Solicitante: <span className="font-semibold">{renterName}</span>
                              </span>
                            ) : (
                              <span>
                                Estado: <span className="font-semibold">{statusLabel}</span>
                              </span>
                            )}
                          </div>
                          {req.message && <div className="text-sm text-slate-500 line-clamp-2">“{req.message}”</div>}
                          {(req.status === "rejected" || expired) && req.rejectionReason && (
                            <div className="text-sm text-red-600">Motivo: {req.rejectionReason}</div>
                          )}
                          {countdownText && !expired && (
                            <div className="text-xs font-semibold text-orange-700">{countdownText}</div>
                          )}
                        </div>

                        {requestsMode === "received" && (
                          <div className="flex gap-2 shrink-0">
                            <Button
                              variant="secondary"
                              onClick={() => showRenterReviews(renterUuid, renterName)}
                              disabled={!renterUuid}
                              className="h-11 px-5 rounded-xl bg-slate-50 text-slate-700 font-bold hover:bg-slate-100"
                            >
                              Ver reviews
                            </Button>

                            <Button
                              variant="secondary"
                              onClick={() => showRequestSummary(req)}
                              className="h-11 px-5 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold hover:bg-slate-50"
                            >
                              Ver resumen
                            </Button>

                            <Button
                              onClick={() => approveRequest(req)}
                              disabled={!canOwnerAct}
                              className="h-11 px-5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold"
                            >
                              Aprobar
                            </Button>
                            <Button
                              variant="secondary"
                              onClick={() => rejectRequest(req)}
                              disabled={!canOwnerAct}
                              className="h-11 px-5 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold hover:bg-slate-50"
                            >
                              Rechazar
                            </Button>

                            {contractUuid && (
                              <Button
                                variant="secondary"
                                onClick={() => navigate(`/rentals/contracts/${contractUuid}`)}
                                className="h-11 px-5 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800"
                              >
                                Ver contrato
                              </Button>
                            )}

                            {!contractUuid && req.status === "approved" && (
                              <Button
                                variant="secondary"
                                onClick={async () => {
                                  try {
                                    const c = await contractService.getByRequest(String((req as any)?.uuid ?? ""));
                                    if (c?.uuid) navigate(`/rentals/contracts/${c.uuid}`);
                                    else await alerts.info("Sin contrato", "Aún no se encontró el contrato para esta solicitud.");
                                  } catch (e: any) {
                                    await alerts.error("No se pudo abrir", e?.response?.data?.message || "Intenta de nuevo.");
                                  }
                                }}
                                className="h-11 px-5 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800"
                              >
                                Ver contrato
                              </Button>
                            )}
                          </div>
                        )}

                        {requestsMode === "sent" && (
                          <div className="flex gap-2 shrink-0">
                            <Button
                              variant="secondary"
                              onClick={() => showRequestSummary(req)}
                              className="h-11 px-5 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold hover:bg-slate-50"
                            >
                              Ver resumen
                            </Button>
                            <Button
                              variant="secondary"
                              onClick={() => cancelRequest(req)}
                              disabled={req.status === "approved" || req.status === "rejected"}
                              className="h-11 px-5 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold hover:bg-slate-50"
                            >
                              Cancelar
                            </Button>
                            {contractUuid && (
                              <Button
                                onClick={() => navigate(`/rentals/contracts/${contractUuid}`)}
                                className="h-11 px-5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold"
                              >
                                Ver contrato
                              </Button>
                            )}
                            {!contractUuid && req.status === "approved" && (
                              <Button
                                onClick={async () => {
                                  try {
                                    const c = await contractService.getByRequest(String((req as any)?.uuid ?? ""));
                                    if (c?.uuid) navigate(`/rentals/contracts/${c.uuid}`);
                                    else await alerts.info("Sin contrato", "Aún no se encontró el contrato para esta solicitud.");
                                  } catch (e: any) {
                                    await alerts.error("No se pudo abrir", e?.response?.data?.message || "Intenta de nuevo.");
                                  }
                                }}
                                className="h-11 px-5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold"
                              >
                                Ver contrato
                              </Button>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
            </div>

            <div className="flex justify-center pt-4">
              {requestsPage < requestsTotalPages && (
                <Button
                  variant="secondary"
                  disabled={requestsLoading}
                  onClick={() => fetchRequestsPage({ page: requestsPage + 1, mode: "append", kind: requestsMode, tab: requestsTab })}
                  className="bg-orange-50 text-primary font-bold h-12 px-8 rounded-xl hover:bg-orange-100 transition-colors"
                >
                  {requestsLoading ? "Cargando..." : "Cargar más"}
                </Button>
              )}
            </div>
          </div>
        )}

        {activeTab === "publicar" && (
          <div className="animate-in slide-in-from-right-4 duration-500">
            <CreateListing embedded onBack={() => setActiveTab("inventario")} />
          </div>
        )}
      </main>

      <PhotoCaptureDialog
        open={avatarDialogOpen}
        onOpenChange={setAvatarDialogOpen}
        onCapture={handleAvatarCapture}
        overlayType="face"
        title="Foto de perfil"
        description="Elige si quieres usar la cámara web, la cámara de tu dispositivo (Windows, Apple, Android) o subir una imagen existente."
      />
    </div>
  );
}
