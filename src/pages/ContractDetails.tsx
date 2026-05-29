import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Timeline } from "@/components/rentals/Timeline";
import { alerts } from "@/lib/alerts";
import { useAuthStore } from "@/store/authStore";
import { contractService, RentalContract } from "@/services/contractService";

function shortDate(value?: string) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleDateString();
  } catch {
    return value;
  }
}

export function ContractDetails() {
  const { uuid } = useParams();
  const navigate = useNavigate();
  const accessToken = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user) as any;
  const [contract, setContract] = useState<RentalContract | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const currentUserUuid = String(user?.uuid ?? user?._id ?? user?.id ?? "");
  const isOwner = useMemo(() => Boolean(contract?.ownerUuid && currentUserUuid && contract.ownerUuid === currentUserUuid), [contract?.ownerUuid, currentUserUuid]);
  const isTenant = useMemo(() => Boolean(contract?.tenantUuid && currentUserUuid && contract.tenantUuid === currentUserUuid), [contract?.tenantUuid, currentUserUuid]);

  const refresh = async () => {
    if (!uuid) return;
    setLoading(true);
    setError(null);
    try {
      const data = await contractService.getByUuid(uuid);
      setContract(data);
    } catch (e: any) {
      setError(e?.response?.data?.message || "No se pudo cargar el contrato.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!accessToken) navigate("/login");
  }, [accessToken, navigate]);

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uuid]);

  const uploadEvidence = async () => {
    if (!uuid) return;
    const { isConfirmed, value } = await Swal.fire({
      title: "Evidencias (3 fotos)",
      html: `
        <div style="text-align:left">
          <div style="color:#64748b;font-size:13px;margin-bottom:8px;">Pega 3 URLs públicas (una por línea).</div>
          <textarea id="ev_urls" style="width:100%;height:120px;border:1px solid #e2e8f0;border-radius:12px;padding:10px;"></textarea>
        </div>
      `,
      confirmButtonText: "Guardar",
      showCancelButton: true,
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#f97316",
      cancelButtonColor: "#0f172a",
      preConfirm: () => {
        const el = document.getElementById("ev_urls") as HTMLTextAreaElement | null;
        const urls = (el?.value ?? "")
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean);
        if (urls.length !== 3) {
          Swal.showValidationMessage("Debes pegar exactamente 3 URLs.");
          return;
        }
        return urls;
      },
    });
    if (!isConfirmed || !value) return;
    try {
      await contractService.uploadEvidenceBeforeHandover(uuid, value);
      await alerts.success("Listo", "Evidencias guardadas.");
      refresh();
    } catch (e: any) {
      await alerts.error("No se pudo guardar", e?.response?.data?.message || "Intenta de nuevo.");
    }
  };

  const doHold = async () => {
    if (!uuid) return;
    const ok = await alerts.confirm({
      title: "Autorizar hold/garantía",
      text: "Esto reservará el alquiler y te dejará listo para la entrega.",
      confirmText: "Autorizar",
      cancelText: "Cancelar",
    });
    if (!ok) return;
    const { isConfirmed, value } = await Swal.fire({
      title: "Plan de pago",
      input: "select",
      inputOptions: { one_time: "Un solo pago", two_payments: "En 2 pagos" },
      inputValue: "one_time",
      showCancelButton: true,
      confirmButtonColor: "#f97316",
      cancelButtonColor: "#0f172a",
    });
    if (!isConfirmed) return;
    try {
      await contractService.paymentHold(uuid, value as any);
      await alerts.success("Hold autorizado", "Ya puedes coordinar la entrega y firmar handover.");
      refresh();
    } catch (e: any) {
      await alerts.error("No se pudo autorizar", e?.response?.data?.message || "Intenta de nuevo.");
    }
  };

  const signPhase = async (phase: "handover" | "return") => {
    if (!uuid) return;
    if (!isOwner && !isTenant) {
      await alerts.error("No autorizado", "Este contrato no corresponde a tu usuario.");
      return;
    }
    const actor = isOwner ? "owner" : "tenant";
    const { isConfirmed, value } = await Swal.fire({
      title: phase === "handover" ? "Firmar entrega" : "Firmar devolución",
      input: "text",
      inputLabel: "Signature token",
      inputPlaceholder: "Token",
      showCancelButton: true,
      confirmButtonText: "Firmar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#f97316",
      cancelButtonColor: "#0f172a",
      preConfirm: (v) => (typeof v === "string" ? v.trim() : ""),
    });
    if (!isConfirmed) return;
    if (!value) {
      await alerts.warning("Falta token", "Debes ingresar el signature token.");
      return;
    }
    try {
      await contractService.sign(uuid, { actor, phase, signatureToken: value });
      await alerts.success("Firmado", "Se registró tu firma.");
      refresh();
    } catch (e: any) {
      await alerts.error("No se pudo firmar", e?.response?.data?.message || "Intenta de nuevo.");
    }
  };

  if (loading) return <div className="max-w-5xl mx-auto py-10 px-4 text-slate-600">Cargando contrato...</div>;
  if (error) return <div className="max-w-5xl mx-auto py-10 px-4 text-red-600">{error}</div>;
  if (!contract) return <div className="max-w-5xl mx-auto py-10 px-4 text-slate-600">Contrato no encontrado.</div>;

  const pickup = contract.pickup;
  const pricing = contract.pricing;

  return (
    <div className="max-w-5xl mx-auto py-10 px-4 space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <div className="text-xs font-bold tracking-widest text-slate-400 uppercase">Contrato</div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">{contract.tool?.name ?? "Alquiler"}</h1>
          <div className="text-sm text-slate-600">
            {shortDate(contract.startDate)} → {shortDate(contract.endDate)} · Estado:{" "}
            <span className="font-semibold text-slate-900">{contract.status}</span>
          </div>
        </div>
        <Button variant="secondary" className="bg-slate-50" onClick={refresh}>
          Actualizar
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <Card className="lg:col-span-2 border-slate-100 shadow-sm">
          <CardContent className="p-6 space-y-4">
            <div className="text-sm font-semibold text-slate-800">Resumen</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div className="rounded-xl border border-slate-200 p-3">
                <div className="text-xs text-slate-500">Punto de encuentro</div>
                <div className="font-semibold text-slate-800">{pickup?.addressLabel ?? "—"}</div>
                {pickup?.pickupAt && <div className="text-xs text-slate-500 mt-1">{new Date(pickup.pickupAt).toLocaleString()}</div>}
              </div>
              <div className="rounded-xl border border-slate-200 p-3">
                <div className="text-xs text-slate-500">Costo estimado</div>
                <div className="font-semibold text-slate-800">
                  ${pricing?.totalAmountEstimated ?? "—"}{" "}
                  <span className="text-xs text-slate-500 font-medium">
                    ({pricing?.totalDays ?? "—"} días)
                  </span>
                </div>
                <div className="text-xs text-slate-500 mt-1">Depósito: ${pricing?.depositAmount ?? 0}</div>
              </div>
            </div>

            <div className="pt-2">
              <Timeline contractUuid={contract.uuid} />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-100 shadow-sm">
          <CardContent className="p-6 space-y-3">
            <div className="text-sm font-semibold text-slate-800">Acciones</div>

            {isOwner && (
              <Button className="w-full bg-orange-500 hover:bg-orange-600" onClick={uploadEvidence}>
                Subir evidencias (3 fotos)
              </Button>
            )}

            {isTenant && (
              <Button className="w-full bg-orange-500 hover:bg-orange-600" onClick={doHold}>
                Autorizar hold / pago
              </Button>
            )}

            <Button variant="secondary" className="w-full bg-white border border-slate-200" onClick={() => signPhase("handover")}>
              Firmar entrega (handover)
            </Button>
            <Button variant="secondary" className="w-full bg-white border border-slate-200" onClick={() => signPhase("return")}>
              Firmar devolución (return)
            </Button>

            <div className="text-xs text-slate-500 pt-2">
              Nota: las firmas requieren el `signatureToken` emitido por el backend.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

