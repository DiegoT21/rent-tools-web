import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { contractService, TimelineEvent } from "@/services/contractService";

const titleByType: Record<string, string> = {
  request_created: "Solicitud creada",
  owner_counter_proposed: "Cambio propuesto por propietario",
  tenant_counter_accepted: "Cambio aceptado por solicitante",
  request_approved: "Solicitud aprobada",
  request_rejected: "Solicitud rechazada",
  request_cancelled: "Solicitud cancelada",
  contract_created: "Contrato generado",
  owner_evidence_uploaded: "Evidencias subidas (propietario)",
  payment_hold_authorized: "Hold autorizado",
  deposit_paid: "Depósito de garantía pagado",
  rental_paid: "Alquiler pagado",
  deposit_refunded: "Depósito reembolsado",
  deposit_refund_failed: "Error al reembolsar depósito",
  ready_for_handover: "Listo para entrega",
  handover_completed: "Entrega completada",
  return_completed: "Devolución completada",
  contract_completed: "Alquiler completado",
  contract_cancelled: "Contrato cancelado",
};

function formatDate(value: string) {
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

export function Timeline({ requestUuid, contractUuid }: { requestUuid?: string; contractUuid?: string }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentStatus, setCurrentStatus] = useState("");
  const [events, setEvents] = useState<TimelineEvent[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await contractService.getTimeline({ requestUuid, contractUuid });
        if (cancelled) return;
        setCurrentStatus(data.currentStatus);
        setEvents(data.events);
      } catch (e: any) {
        if (cancelled) return;
        setError(e?.response?.data?.message || "No se pudo cargar el timeline.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [requestUuid, contractUuid]);

  const ordered = useMemo(() => {
    const list = [...events];
    list.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    return list;
  }, [events]);

  if (loading) return <div className="text-sm text-slate-600">Cargando timeline...</div>;
  if (error) return <div className="text-sm text-red-600">{error}</div>;
  if (ordered.length === 0) return <div className="text-sm text-slate-600">Sin eventos aún.</div>;

  return (
    <div className="space-y-3">
      <div className="text-xs font-bold tracking-widest text-slate-400 uppercase">Progreso</div>
      <div className="text-sm text-slate-600">
        Estado actual: <span className="font-semibold text-slate-900">{currentStatus || "—"}</span>
      </div>
      <ol className="space-y-3">
        {ordered.map((ev, idx) => (
          <li key={ev.uuid ?? idx} className="flex gap-3">
            <div className="mt-0.5 flex flex-col items-center">
              <div className={cn("h-2.5 w-2.5 rounded-full", idx === ordered.length - 1 ? "bg-primary" : "bg-slate-300")} />
              {idx !== ordered.length - 1 && <div className="w-px flex-1 bg-slate-200 mt-1" />}
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold text-slate-900">{titleByType[ev.type] ?? ev.type}</div>
              <div className="text-xs text-slate-500">
                {formatDate(ev.createdAt)} · {ev.actor}
              </div>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

