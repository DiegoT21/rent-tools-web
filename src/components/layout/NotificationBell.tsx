import { Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { markRentalRequestsSeen, useRentalNotifications } from "@/hooks/useRentalNotifications";
import { useAuthStore } from "@/store/useAuthStore";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

function formatRequestDates(start?: string, end?: string) {
  if (!start) return "Fechas por confirmar";
  const from = format(new Date(start), "d MMM", { locale: es });
  const to = end ? format(new Date(end), "d MMM", { locale: es }) : from;
  return from === to ? from : `${from} → ${to}`;
}

function formatCountdown(targetIso?: string) {
  if (!targetIso) return "";
  const target = new Date(targetIso).getTime();
  if (!target || Number.isNaN(target)) return "";
  const diff = target - Date.now();
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

export function NotificationBell() {
  const navigate = useNavigate();
  const { accessToken } = useAuthStore();
  const { pendingCount, items, loading, refresh } = useRentalNotifications(Boolean(accessToken));

  return (
    <Popover onOpenChange={(open) => open && refresh()}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="relative flex h-9 w-9 items-center justify-center rounded-full text-slate-600 hover:bg-slate-100 transition-colors"
          aria-label="Notificaciones"
        >
          <Bell className="h-5 w-5" />
          {pendingCount > 0 ? (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#e86f00] px-1 text-[10px] font-bold text-white ring-2 ring-white">
              {pendingCount > 9 ? "9+" : pendingCount}
            </span>
          ) : null}
        </button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-[calc(100vw-2rem)] max-w-80 p-0 sm:w-80">
        <div className="border-b border-slate-100 px-4 py-3">
          <p className="text-sm font-bold text-slate-900">Notificaciones</p>
          <p className="text-xs text-slate-500">Solicitudes de alquiler recibidas</p>
        </div>

        <div className="max-h-80 overflow-y-auto p-2">
          {loading ? (
            <p className="px-2 py-4 text-sm text-slate-500">Cargando...</p>
          ) : items.length === 0 ? (
            <p className="px-2 py-4 text-sm text-slate-500">No tienes solicitudes pendientes.</p>
          ) : (
            items.map((req) => {
              const person = req.tenant ?? req.renter;
              const name = person
                ? `${person.firstName ?? person.name ?? "Usuario"} ${person.lastName ?? ""}`.trim()
                : "Un usuario";

              return (
                <button
                  key={req.uuid}
                  type="button"
                  onClick={() => {
                    markRentalRequestsSeen();
                    navigate("/profile?tab=solicitudes");
                  }}
                  className={cn(
                    "w-full rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-orange-50",
                    "border border-transparent hover:border-orange-100"
                  )}
                >
                  <p className="text-sm font-semibold text-slate-900">Nueva solicitud de renta</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-slate-600">
                    <span className="font-medium text-slate-800">{name}</span> quiere alquilar{" "}
                    <span className="font-medium text-slate-800">{req.tool?.name ?? "tu herramienta"}</span>
                  </p>
                  <p className="mt-1 text-[11px] text-slate-400">
                    {formatRequestDates(req.startDate ?? req.fromDate, req.endDate ?? req.toDate)}
                  </p>
                  {req.expiresAt ? (
                    <p className="mt-1 text-[11px] font-semibold text-orange-700">
                      {formatCountdown(req.expiresAt)}
                    </p>
                  ) : null}
                </button>
              );
            })
          )}
        </div>

        {pendingCount > 0 ? (
          <div className="border-t border-slate-100 p-2">
            <button
              type="button"
              onClick={() => {
                markRentalRequestsSeen();
                navigate("/profile?tab=solicitudes");
              }}
              className="w-full rounded-lg px-3 py-2 text-sm font-bold text-[#e86f00] hover:bg-orange-50"
            >
              Ver todas las solicitudes
            </button>
          </div>
        ) : null}
      </PopoverContent>
    </Popover>
  );
}
