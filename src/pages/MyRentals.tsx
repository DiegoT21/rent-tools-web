import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Wrench,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Star,
  CheckCircle2,
  Clock,
  XCircle,
  PackageOpen,
  AlertCircle,
  Loader2,
  ArrowRight,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuthStore } from "@/store/authStore";
import { contractService, MyRental } from "@/services/contractService";
import { ReviewDialog } from "@/components/rentals/ReviewDialog";
import { DisputeThread } from "@/components/rentals/DisputeThread";
import { disputeService } from "@/services/disputeService";
import { alerts } from "@/lib/alerts";

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(value?: string): string {
  if (!value) return "—";
  const normalized = String(value).slice(0, 10);
  const [year, month, day] = normalized.split("-").map(Number);
  if (!year || !month || !day) return "—";
  return `${String(day).padStart(2, "0")}/${String(month).padStart(2, "0")}/${year}`;
}

function isPastEndDate(value?: string): boolean {
  if (!value) return false;
  const normalized = String(value).slice(0, 10);
  const [year, month, day] = normalized.split("-").map(Number);
  if (!year || !month || !day) return false;
  const endOfDay = new Date(year, month - 1, day + 1, 0, 0, 0, 0).getTime();
  return Date.now() >= endOfDay;
}

interface StatusConfig {
  label: string;
  badgeClass: string;
  icon: React.ReactNode;
}

function getStatusConfig(status: string): StatusConfig {
  switch (status) {
    case "pending_signatures":
      return { label: "Pendiente de firma", badgeClass: "bg-yellow-50 text-yellow-700 border-yellow-200", icon: <Clock className="h-3.5 w-3.5" /> };
    case "signed":
      return { label: "Firmado", badgeClass: "bg-blue-50 text-blue-700 border-blue-200", icon: <CheckCircle2 className="h-3.5 w-3.5" /> };
    case "owner_evidence_pending":
      return { label: "Evidencias pendientes", badgeClass: "bg-purple-50 text-purple-700 border-purple-200", icon: <AlertCircle className="h-3.5 w-3.5" /> };
    case "payment_pending":
      return { label: "Pago pendiente", badgeClass: "bg-orange-50 text-orange-700 border-orange-200", icon: <AlertCircle className="h-3.5 w-3.5" /> };
    case "ready_for_handover":
      return { label: "Listo para entrega", badgeClass: "bg-teal-50 text-teal-700 border-teal-200", icon: <CheckCircle2 className="h-3.5 w-3.5" /> };
    case "in_progress":
      return { label: "En progreso", badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: <CheckCircle2 className="h-3.5 w-3.5" /> };
    case "completed":
      return { label: "Terminado", badgeClass: "bg-slate-50 text-slate-600 border-slate-200", icon: <CheckCircle2 className="h-3.5 w-3.5" /> };
    case "terminated":
      return { label: "Terminado", badgeClass: "bg-slate-50 text-slate-600 border-slate-200", icon: <CheckCircle2 className="h-3.5 w-3.5" /> };
    case "cancelled":
      return { label: "Cancelado", badgeClass: "bg-red-50 text-red-600 border-red-200", icon: <XCircle className="h-3.5 w-3.5" /> };
    default:
      return { label: status, badgeClass: "bg-slate-50 text-slate-600 border-slate-200", icon: <Clock className="h-3.5 w-3.5" /> };
  }
}

// ── RentalCard ────────────────────────────────────────────────────────────────

interface RentalCardProps {
  rental: MyRental;
  onReview: (rental: MyRental) => void;
  reviewedSet: Set<string>;
  disputedSet: Set<string>;
}

function RentalCard({ rental, onReview, reviewedSet, disputedSet }: RentalCardProps) {
  const navigate = useNavigate();
  const fallbackOverdue = rental.status === "in_progress" && isPastEndDate(rental.endDate);
  const visualStatus = rental.displayStatus ?? (fallbackOverdue ? "terminated" : rental.status);
  const statusConfig = getStatusConfig(visualStatus);
  const toolImages = Array.isArray(rental.tool?.imageUrls) ? rental.tool!.imageUrls.filter(Boolean) : [];
  const thumbUrl = toolImages[0] ?? null;
  const toolName = rental.tool?.name ?? "Herramienta";
  const ownerName = rental.owner
    ? `${rental.owner.firstName ?? ""} ${rental.owner.lastName ?? ""}`.trim()
    : "Propietario";

  const isCompleted = visualStatus === "completed" || visualStatus === "terminated";
  const alreadyReviewed = reviewedSet.has(rental.uuid);
  const alreadyDisputed = disputedSet.has(rental.requestUuid ?? rental.uuid) || Boolean(rental.hasActiveDispute);

  return (
    <div className="group relative bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-slate-200 transition-all duration-200 overflow-hidden">
      {/* Accent stripe */}
      <div
        className={cn(
          "absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl",
          isCompleted
            ? "bg-slate-300"
            : rental.status === "in_progress"
            ? "bg-emerald-400"
            : rental.status === "cancelled"
            ? "bg-red-300"
            : "bg-orange-400"
        )}
      />

      <div className="flex flex-col gap-4 p-4 sm:flex-row sm:pl-5">
        {/* Tool image */}
        <div className="shrink-0 w-20 h-20 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center">
          {thumbUrl ? (
            <img src={thumbUrl} alt={toolName} className="w-full h-full object-cover" />
          ) : (
            <Wrench className="h-8 w-8 text-slate-400" />
          )}
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="min-w-0">
              <h3 className="font-bold text-slate-900 text-base leading-tight truncate">{toolName}</h3>
              <p className="text-sm text-slate-500 mt-0.5 truncate">
                Propietario: <span className="font-medium text-slate-700">{ownerName}</span>
              </p>
            </div>
            {/* Status badge */}
            <span
              className={cn(
                "shrink-0 inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border",
                statusConfig.badgeClass
              )}
            >
              {statusConfig.icon}
              {statusConfig.label}
            </span>
          </div>

          {/* Dates */}
          <div className="flex items-center gap-4 mt-3 text-sm text-slate-600">
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-slate-400" />
              <span className="font-medium">{formatDate(rental.startDate)}</span>
              <ArrowRight className="h-3 w-3 text-slate-400" />
              <span className="font-medium">{formatDate(rental.endDate)}</span>
            </div>
            {rental.pricing?.totalDays && (
              <span className="text-slate-400">·</span>
            )}
            {rental.pricing?.totalDays && (
              <span className="text-slate-500">{rental.pricing.totalDays} días</span>
            )}
          </div>

          {/* Pricing */}
          {rental.pricing?.totalAmountEstimated != null && (
            <div className="mt-2 text-sm">
              <span className="text-slate-500">Total estimado: </span>
              <span className="font-bold text-slate-900">
                ${Number(rental.pricing.totalAmountEstimated).toFixed(2)}
              </span>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col flex-wrap items-stretch gap-2 mt-4 sm:flex-row sm:items-center">
            <Button
              size="sm"
              variant="secondary"
              className="h-8 px-4 text-xs font-semibold bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700"
              onClick={() => navigate(`/rentals/contracts/${rental.uuid}`)}
            >
              Ver contrato
            </Button>

            {isCompleted && !alreadyReviewed && (
              <Button
                size="sm"
                className="h-8 px-4 text-xs font-semibold bg-amber-400 hover:bg-amber-500 text-slate-900 shadow-sm shadow-amber-400/30 border-0"
                onClick={() => onReview(rental)}
              >
                <Star className="h-3.5 w-3.5 mr-1.5 fill-current" />
                Dejar reseña
              </Button>
            )}

            {isCompleted && alreadyReviewed && (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Reseña enviada
              </span>
            )}

            {alreadyDisputed && (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-full">
                <AlertCircle className="h-3.5 w-3.5" />
                Disputa enviada
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState({ tab }: { tab: "active" | "past" }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="h-16 w-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
        <PackageOpen className="h-8 w-8 text-slate-400" />
      </div>
      <h3 className="text-lg font-bold text-slate-800 mb-1">
        {tab === "active" ? "No tienes alquileres activos" : "Sin historial aún"}
      </h3>
      <p className="text-sm text-slate-500 max-w-xs">
        {tab === "active"
          ? "Cuando alquiles una herramienta, aparecerá aquí mientras esté activa."
          : "Los alquileres completados o cancelados aparecerán en esta sección."}
      </p>
    </div>
  );
}

// ── Pagination ────────────────────────────────────────────────────────────────

function Pagination({
  page,
  totalPages,
  onPrev,
  onNext,
}: {
  page: number;
  totalPages: number;
  onPrev: () => void;
  onNext: () => void;
}) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-3 mt-8">
      <button
        type="button"
        onClick={onPrev}
        disabled={page <= 1}
        className="h-9 w-9 rounded-full flex items-center justify-center border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        aria-label="Página anterior"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <span className="text-sm font-semibold text-slate-700">
        Página {page} de {totalPages}
      </span>
      <button
        type="button"
        onClick={onNext}
        disabled={page >= totalPages}
        className="h-9 w-9 rounded-full flex items-center justify-center border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        aria-label="Página siguiente"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

interface MyRentalsProps {
  embedded?: boolean;
  onBack?: () => void;
}

export function MyRentals({ embedded = false, onBack }: MyRentalsProps) {
  const navigate = useNavigate();
  const { accessToken, hasHydrated } = useAuthStore();

  const [activeTab, setActiveTab] = useState<"active" | "past">("active");
  const [rentals, setRentals] = useState<MyRental[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"recent" | "oldest">("recent");

  // Review dialog state
  const [reviewTarget, setReviewTarget] = useState<MyRental | null>(null);
  // Track which contracts already have a review (after submitting in this session)
  const [reviewedSet, setReviewedSet] = useState<Set<string>>(new Set());
  const [disputedSet, setDisputedSet] = useState<Set<string>>(new Set());
  const [myDisputes, setMyDisputes] = useState<any[]>([]);
  const [myDisputesLoading, setMyDisputesLoading] = useState(false);
  const [expandedMyDisputeUuid, setExpandedMyDisputeUuid] = useState<string | null>(null);

  // Auth guard (solo en ruta standalone; en perfil el padre ya valida sesión)
  useEffect(() => {
    if (embedded || !hasHydrated) return;
    if (!accessToken) navigate("/login");
  }, [accessToken, embedded, hasHydrated, navigate]);

  const handleBack = () => {
    if (onBack) onBack();
    else navigate("/profile?tab=perfil");
  };

  const fetchRentals = useCallback(
    async (tab: "active" | "past", p: number, searchVal: string, sortVal: "recent" | "oldest") => {
      if (!accessToken) return;
      setLoading(true);
      setError(null);
      try {
        const result = await contractService.getMyRentals({
          status: tab,
          page: p,
          search: searchVal,
          sortBy: sortVal,
        });
        setRentals(result.data);
        setPage(result.pagination.page);
        setTotalPages(result.pagination.totalPages);
      } catch (e: any) {
        setError(e?.response?.data?.message || "No se pudieron cargar tus alquileres.");
        setRentals([]);
      } finally {
        setLoading(false);
      }
    },
    [accessToken]
  );

  const fetchMyDisputes = useCallback(async () => {
    if (!accessToken) return;
    setMyDisputesLoading(true);
    try {
      const result = await disputeService.listMine();
      const items = Array.isArray(result?.items) ? result.items : Array.isArray(result) ? result : [];
      setMyDisputes(items);
    } catch (e: any) {
      console.error("Error loading my disputes:", e);
      setMyDisputes([]);
    } finally {
      setMyDisputesLoading(false);
    }
  }, [accessToken]);

  // Reset to page 1 on filter/search change
  useEffect(() => {
    setPage(1);
  }, [activeTab, search, sortBy]);

  // Trigger fetch with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchRentals(activeTab, page, search, sortBy);
    }, 300);
    return () => clearTimeout(timer);
  }, [activeTab, page, search, sortBy, fetchRentals]);

  useEffect(() => {
    fetchMyDisputes();
  }, [fetchMyDisputes]);

  const handleTabChange = (tab: "active" | "past") => {
    setActiveTab(tab);
  };

  const handleReviewSuccess = (contractUuid: string) => {
    setReviewedSet((prev) => new Set([...prev, contractUuid]));
    alerts.success("¡Reseña enviada!", "Gracias por compartir tu experiencia.");
  };

  const tabs: { key: "active" | "past"; label: string }[] = [
    { key: "active", label: "Activos" },
    { key: "past", label: "Historial" },
  ];

  return (
    <div className={cn(embedded ? "space-y-6 animate-in slide-in-from-bottom-4 duration-500" : "max-w-3xl mx-auto pt-6 pb-12")}>
      <button
        type="button"
        onClick={handleBack}
        className="text-sm font-semibold text-slate-500 transition-colors hover:text-primary"
      >
        ← Volver al perfil
      </button>

      {/* Page header */}
      <div className={embedded ? "space-y-1" : "mb-5"}>
        {embedded ? (
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
            Cuenta <span className="text-[8px]">●</span> Alquileres
          </p>
        ) : (
          <div className="text-xs font-bold tracking-widest text-slate-400 uppercase mb-1">
            Mi cuenta
          </div>
        )}
        <h1 className={cn("font-black text-slate-900 tracking-tight", embedded ? "text-3xl sm:text-4xl" : "text-3xl")}>
          Mis Alquileres
        </h1>
        <p className="text-slate-500 mt-1 text-sm">
          Herramientas que has alquilado a otras personas.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-slate-100 rounded-2xl mb-5 w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            id={`my-rentals-tab-${tab.key}`}
            onClick={() => handleTabChange(tab.key)}
            className={cn(
              "px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150",
              activeTab === tab.key
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-800"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filtros y Búsqueda */}
      <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <Input 
            placeholder="Buscar herramienta por nombre o propietario..." 
            className="pl-10 h-12 bg-slate-50 border-transparent rounded-xl focus-visible:ring-primary/20 text-sm font-semibold"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2 min-w-[180px]">
          <Select value={sortBy} onValueChange={(val: any) => setSortBy(val)}>
            <SelectTrigger className="h-12 w-full rounded-xl bg-slate-50 border-transparent text-slate-600 font-bold gap-2 focus:ring-0">
              <SelectValue placeholder="Ordenar" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-slate-100 bg-white">
              <SelectItem value="recent" className="font-semibold text-slate-700">Más recientes</SelectItem>
              <SelectItem value="oldest" className="font-semibold text-slate-700">Más antiguos</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3 text-slate-500">
          <Loader2 className="h-7 w-7 animate-spin text-primary" />
          <span className="text-sm font-medium">Cargando alquileres...</span>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <div className="h-14 w-14 rounded-2xl bg-red-50 flex items-center justify-center">
            <AlertCircle className="h-7 w-7 text-red-400" />
          </div>
          <div className="text-center">
            <p className="font-semibold text-slate-800 mb-1">No pudimos cargar tus alquileres</p>
            <p className="text-sm text-slate-500">{error}</p>
          </div>
          <Button
            size="sm"
            variant="secondary"
            className="border border-slate-200"
            onClick={() => fetchRentals(activeTab, page, search, sortBy)}
          >
            Reintentar
          </Button>
        </div>
      ) : rentals.length === 0 ? (
        <EmptyState tab={activeTab} />
      ) : (
        <>
          <div className="flex flex-col gap-4">
            {rentals.map((rental) => (
              <RentalCard
                key={rental.uuid}
                rental={rental}
                onReview={setReviewTarget}
                reviewedSet={reviewedSet}
                disputedSet={disputedSet}
              />
            ))}
          </div>

          <Pagination
            page={page}
            totalPages={totalPages}
            onPrev={() => {
              const p = Math.max(1, page - 1);
              setPage(p);
            }}
            onNext={() => {
              const p = Math.min(totalPages, page + 1);
              setPage(p);
            }}
          />
        </>
      )}

      {/* Review dialog */}
      {reviewTarget && (
        <ReviewDialog
          contractUuid={reviewTarget.uuid}
          toolUuid={reviewTarget.tool?.uuid ?? ""}
          ownerUuid={reviewTarget.owner?.uuid ?? ""}
          toolName={reviewTarget.tool?.name}
          ownerName={
            reviewTarget.owner
              ? `${reviewTarget.owner.firstName ?? ""} ${reviewTarget.owner.lastName ?? ""}`.trim()
              : undefined
          }
          onSuccess={() => handleReviewSuccess(reviewTarget.uuid)}
          onClose={() => setReviewTarget(null)}
        />
      )}

      <div className="mt-10 bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <div className="text-xs font-bold tracking-widest text-slate-400 uppercase">Disputas</div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Mis casos</h2>
            <p className="text-sm text-slate-500">Aquí ves los mensajes que te envía el admin dentro de cada disputa.</p>
          </div>
          <Button
            type="button"
            variant="secondary"
            className="bg-slate-50 border border-slate-200 text-slate-700"
            onClick={fetchMyDisputes}
            disabled={myDisputesLoading}
          >
            {myDisputesLoading ? "Cargando..." : "Actualizar"}
          </Button>
        </div>

        {myDisputesLoading && myDisputes.length === 0 ? (
          <div className="py-10 text-center text-slate-400 text-sm">Cargando tus disputas...</div>
        ) : myDisputes.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
            Todavía no tienes disputas abiertas o en revisión.
          </div>
        ) : (
          <div className="space-y-4">
            {myDisputes.map((item) => {
              const dispute = item?.dispute ?? item;
              const rentalLabel = dispute?.rental?.uuid ?? dispute?.rental?.startDate ?? dispute?.uuid;
              const title = `${String(dispute?.reason ?? "disputa").replace(/_/g, " ")} · ${rentalLabel}`;
              const isExpanded = expandedMyDisputeUuid === dispute?.uuid;
              return (
                <div key={dispute?.uuid ?? rentalLabel} className="rounded-2xl border border-slate-200 bg-slate-50/60 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setExpandedMyDisputeUuid(isExpanded ? null : dispute?.uuid ?? null)}
                    className="w-full flex items-center justify-between gap-4 px-4 py-4 text-left hover:bg-slate-50/80 transition-colors"
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-slate-900 truncate">{title}</div>
                      <div className="text-xs text-slate-500">Estado: {String(dispute?.status ?? "—")}</div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-xs text-slate-400 hidden sm:block">{dispute?.createdAt ? new Date(dispute.createdAt).toLocaleString() : ""}</div>
                      {isExpanded ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="border-t border-slate-200 bg-white/80 p-4 space-y-3">
                      <p className="text-sm text-slate-700">{dispute?.description}</p>

                      {dispute?.uuid ? (
                        <DisputeThread
                          disputeUuid={dispute.uuid}
                          title="Chat de la disputa"
                          subtitle="Lee y responde dentro del mismo hilo compartido."
                          compact
                        />
                      ) : null}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
