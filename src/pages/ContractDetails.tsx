import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Timeline } from "@/components/rentals/Timeline";
import { alerts } from "@/lib/alerts";
import { useAuthStore } from "@/store/authStore";
import { contractService, RentalContract } from "@/services/contractService";
import { mediaService } from "@/services/mediaService";
import { downloadContractPdf } from "@/lib/contractPdf";
import { Download } from "lucide-react";

function shortDate(value?: string) {
  if (!value) return "—";
  const normalized = String(value).slice(0, 10);
  const [year, month, day] = normalized.split("-").map(Number);
  if (!year || !month || !day) return "—";
  return `${String(day).padStart(2, "0")}/${String(month).padStart(2, "0")}/${year}`;
}

function parseIso(value?: string): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function isSameDayPanama(a: Date, b: Date): boolean {
  const opts: Intl.DateTimeFormatOptions = { timeZone: 'America/Panama', year: 'numeric', month: '2-digit', day: '2-digit' };
  return a.toLocaleDateString('en-CA', opts) === b.toLocaleDateString('en-CA', opts);
}

export function ContractDetails() {
  const { uuid } = useParams();
  const navigate = useNavigate();
  const accessToken = useAuthStore((s) => s.accessToken);
  const hasHydrated = useAuthStore((s) => s.hasHydrated);
  const user = useAuthStore((s) => s.user) as any;
  const [contract, setContract] = useState<RentalContract | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const currentUserUuid = String(user?.uuid ?? user?._id ?? user?.id ?? "");
  const isOwner = useMemo(() => Boolean(contract?.ownerUuid && currentUserUuid && contract.ownerUuid === currentUserUuid), [contract?.ownerUuid, currentUserUuid]);
  const isTenant = useMemo(() => Boolean(contract?.tenantUuid && currentUserUuid && contract.tenantUuid === currentUserUuid), [contract?.tenantUuid, currentUserUuid]);

  const status = String(contract?.status ?? "");
  const canHold = isTenant && ["owner_evidence_pending", "payment_pending"].includes(status);
  const canUploadEvidence = isOwner && ["signed", "owner_evidence_pending", "payment_pending"].includes(status);
  const canPayRental = isTenant && status === "in_progress" && (contract as any)?.payment?.rentalPaidStatus !== "paid";

  const now = useMemo(() => new Date(), [contract]);
  const pickupInfo = useMemo(() => (contract as any)?.pickupProposal ?? (contract as any)?.pickup ?? {}, [contract]);
  const pickupAt = useMemo(() => parseIso(pickupInfo?.pickupAt), [pickupInfo?.pickupAt]);
  const endDate = useMemo(() => parseIso((contract as any)?.endDate), [contract]);

  const handoverWindowOk = useMemo(() => (pickupAt ? isSameDayPanama(now, pickupAt) : false), [now, pickupAt]);
  const returnWindowOk = useMemo(() => {
    const raw = (contract as any)?.endDate as string | undefined;
    if (!raw) return false;
    const target = raw.slice(0, 10);
    const todayPanama = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Panama', year: 'numeric', month: '2-digit', day: '2-digit',
    }).format(now);
    return target === todayPanama;
  }, [contract, now]);

  const handoverOwnerSigned = Boolean((contract as any)?.handoverOwnerSignature?.accepted);
  const handoverTenantSigned = Boolean((contract as any)?.handoverTenantSignature?.accepted);
  const returnOwnerSigned = Boolean((contract as any)?.returnOwnerSignature?.accepted);
  const returnTenantSigned = Boolean((contract as any)?.returnTenantSignature?.accepted);
  const alreadySignedHandover = (isOwner && handoverOwnerSigned) || (isTenant && handoverTenantSigned);
  const alreadySignedReturn = (isOwner && returnOwnerSigned) || (isTenant && returnTenantSigned);

  const canSignHandover =
    (isOwner || isTenant) &&
    status === "ready_for_handover" &&
    String((contract as any)?.payment?.holdStatus ?? "") === "authorized" &&
    handoverWindowOk &&
    !alreadySignedHandover;
  const canSignReturn = (isOwner || isTenant) && status === "in_progress" && returnWindowOk && !alreadySignedReturn;

  const nextStep = useMemo(() => {
    if (!contract) return { title: "Cargando...", text: "" };
    if (status === "signed") return { title: "Siguiente paso: El propietario sube evidencias", text: "El propietario debe subir 3 fotos del estado actual de la herramienta. Luego podrás pagar el depósito." };
    if (status === "owner_evidence_pending") return { title: "Siguiente paso: Pagar depósito", text: "El propietario ya subió las evidencias. Ahora el solicitante debe pagar el depósito de garantía para habilitar la entrega." };
    if (status === "payment_pending") return { title: "Siguiente paso: Pagar depósito", text: "El solicitante debe pagar el depósito de garantía para habilitar la entrega." };
    if (status === "ready_for_handover") return { title: "Siguiente paso: Firmar entrega", text: "Ambas partes deben firmar la entrega (handover) para iniciar el alquiler." };
    if (status === "in_progress") {
      const rps = (contract as any)?.payment?.rentalPaidStatus;
      if (isTenant && rps !== "paid") return { title: "Siguiente paso: Pagar el alquiler", text: "El alquiler está activo. Puedes pagar el monto del alquiler en cualquier momento antes de la devolución." };
      return { title: "Siguiente paso: Firmar devolución", text: "Al finalizar, ambas partes firman la devolución (return) para completar el alquiler." };
    }
    if (status === "completed") {
      const refund = (contract as any)?.payment?.depositRefundStatus;
      if (refund === "refunded") return { title: "Alquiler completado", text: "El contrato fue cerrado y el depósito fue reembolsado automáticamente." };
      if (refund === "failed") return { title: "Alquiler completado — revisar reembolso", text: "El alquiler terminó pero hubo un error al reembolsar el depósito. Contacta soporte." };
      return { title: "Alquiler completado", text: "El contrato ya fue cerrado." };
    }
    return { title: `Estado: ${status}`, text: "Sigue el timeline para continuar." };
  }, [contract, status]);

  const payment = (contract as any)?.payment ?? null;
  const pricing = (contract as any)?.pricing ?? null;
  const holdStatus = String(payment?.holdStatus ?? "");
  const depositAmount =
    typeof payment?.depositAmount === "number" && payment.depositAmount > 0
      ? payment.depositAmount
      : (pricing?.depositAmount ?? 0);
  const rentalAmount =
    typeof payment?.rentalAmount === "number" && payment.rentalAmount > 0
      ? payment.rentalAmount
      : (pricing?.rentalAmount ?? (pricing?.pricePerDay && pricing?.totalDays ? pricing.pricePerDay * pricing.totalDays : 0));
  const paidAmount = typeof payment?.paidAmount === "number" ? payment.paidAmount : 0;
  const depositPaidStatus = String(payment?.depositPaidStatus ?? "");
  const rentalPaidStatus = String(payment?.rentalPaidStatus ?? "");
  const depositRefundStatus = String(payment?.depositRefundStatus ?? "");
  const showPaymentBox = isTenant && (holdStatus === "authorized" || ["ready_for_handover", "in_progress", "completed"].includes(status));
  const pickupLabel = String(pickupInfo?.label ?? pickupInfo?.addressLabel ?? "Punto de encuentro");
  const pickupAddress = String(pickupInfo?.addressLabel ?? pickupInfo?.label ?? "—");
  const pickupAtText = pickupInfo?.pickupAt ? new Date(pickupInfo.pickupAt).toLocaleString("es-PA") : "—";

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
    if (!hasHydrated) return;
    if (!accessToken) navigate("/login");
  }, [accessToken, hasHydrated, navigate]);

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uuid]);

  const uploadEvidence = async () => {
    if (!uuid) return;
    if (!canUploadEvidence) {
      await alerts.info("No disponible", "Solo el propietario puede subir evidencias y solo antes de la entrega.");
      return;
    }

    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.multiple = true;
    input.click();

    const files: File[] = await new Promise((resolve) => {
      input.onchange = () => resolve(Array.from(input.files ?? []));
    });

    if (files.length !== 3) {
      await alerts.warning("Evidencias", "Debes seleccionar exactamente 3 fotos.");
      return;
    }

    try {
      Swal.fire({
        title: "Subiendo evidencias...",
        text: "Por favor espera.",
        allowOutsideClick: false,
        allowEscapeKey: false,
        didOpen: () => Swal.showLoading(),
      });

      const signed = await Promise.all(files.map((f) => mediaService.getUploadUrlAndKey(f, false)));
      for (let i = 0; i < files.length; i++) {
        await mediaService.uploadToPresignedUrl(signed[i], files[i]);
      }
      const urls = signed.map((s) => s.publicUrl).filter(Boolean);

      if (urls.length !== 3) {
        throw new Error("No se pudieron resolver las 3 URLs públicas.");
      }

      await contractService.uploadEvidenceBeforeHandover(uuid, urls);
      Swal.close();
      await alerts.success("Listo", "Evidencias guardadas.");
      refresh();
    } catch (e: any) {
      Swal.close();
      await alerts.error("No se pudo guardar", e?.response?.data?.message || "Intenta de nuevo.");
    }
  };

  const doHoldAndPay = async () => {
    if (!uuid) return;
    if (!canHold) {
      await alerts.info("No disponible", "Solo el solicitante puede autorizar el hold y pagar.");
      return;
    }
    navigate(`/checkout/${uuid}`);
  };

  const signPhase = async (phase: "handover" | "return") => {
    if (!uuid) return;
    if (!isOwner && !isTenant) {
      await alerts.error("No autorizado", "Este contrato no corresponde a tu usuario.");
      return;
    }
    if (phase === "handover") {
      if (status !== "ready_for_handover") {
        await alerts.warning("Aún no", "Primero se debe autorizar el hold/pago para habilitar la entrega.");
        return;
      }
      if (!handoverWindowOk) {
        await alerts.warning("Fuera de ventana", "Solo puedes firmar dentro de ±12h del pickup.");
        return;
      }
    }
    if (phase === "return") {
      if (status !== "in_progress") {
        await alerts.warning("Aún no", "La devolución solo se firma cuando el contrato está en progreso (in_progress).");
        return;
      }
      if (!returnWindowOk) {
        await alerts.warning("Fuera de ventana", "Solo puedes firmar dentro de ±12h de la devolución.");
        return;
      }
    }
    const actor = isOwner ? "owner" : "tenant";
    const { isConfirmed, value } = await Swal.fire({
      title: phase === "handover" ? "Firmar entrega" : "Firmar devolución",
      html: `
        <div style="text-align:left">
          <div style="color:#64748b;font-size:13px;margin-bottom:10px;">
            Para firmar, confirma tu contraseña. Se generará un token temporal para esta fase.
          </div>
          <label style="display:flex;flex-direction:column;gap:6px;font-size:13px;">
            Contraseña
            <input id="rt_pwd" type="password" class="swal2-input" style="margin:0;height:40px" placeholder="Tu contraseña" />
          </label>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: "Generar y firmar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#f97316",
      cancelButtonColor: "#0f172a",
      preConfirm: () => {
        const pwd = (document.getElementById("rt_pwd") as HTMLInputElement | null)?.value ?? "";
        if (!pwd.trim()) {
          Swal.showValidationMessage("Ingresa tu contraseña.");
          return;
        }
        return pwd.trim();
      },
    });
    if (!isConfirmed || !value) return;
    try {
      const token = await contractService.getSignatureToken(uuid, { actor, phase, password: value });
      if (!token.signatureToken) {
        await alerts.error("Sin token", "No se pudo obtener el token de firma.");
        return;
      }
      await contractService.sign(uuid, { actor, phase, signatureToken: token.signatureToken });
      await alerts.success("Firmado", "Se registró tu firma.");
      refresh();
    } catch (e: any) {
      const statusCode = e?.response?.status;
      if (statusCode === 409) {
        await alerts.warning("No se pudo firmar", e?.response?.data?.message || "Fuera de la ventana de firma.");
        return;
      }
      await alerts.error("No se pudo firmar", e?.response?.data?.message || "Intenta de nuevo.");
    }
  };

  if (loading) return <div className="max-w-5xl mx-auto py-10 px-4 text-slate-600">Cargando contrato...</div>;
  if (error) return <div className="max-w-5xl mx-auto py-10 px-4 text-red-600">{error}</div>;
  if (!contract) return <div className="max-w-5xl mx-auto py-10 px-4 text-slate-600">Contrato no encontrado.</div>;

  const evidencePhotos = Array.isArray(contract.ownerEvidence?.photosBeforeHandover)
    ? contract.ownerEvidence?.photosBeforeHandover.map((p) => (typeof p === "string" ? mediaService.resolvePublicUrl(p) : p))
    : [];

  const hasAllEvidence = evidencePhotos.length >= 3;

  return (
    <div className="mx-auto max-w-5xl space-y-4 px-2 py-6 sm:space-y-6 sm:px-4 sm:py-10">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="text-xs font-bold tracking-widest text-slate-400 uppercase">Contrato</div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight sm:text-3xl">{contract.tool?.name ?? "Alquiler"}</h1>
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
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-sm font-bold text-slate-900">{nextStep.title}</div>
              <div className="text-sm text-slate-600 mt-1">{nextStep.text}</div>
            </div>
            <div className="text-sm font-semibold text-slate-800">Resumen</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div className="rounded-xl border border-slate-200 p-3">
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">Punto elegido</div>
                <div className="font-semibold text-slate-800 mt-1">{pickupLabel}</div>
                <div className="text-sm text-slate-600 mt-1">{pickupAddress}</div>
                <div className="text-xs text-slate-500 mt-2">Hora de entrega: {pickupAtText}</div>
              </div>
              <div className="rounded-xl border border-slate-200 p-3">
                <div className="text-xs text-slate-500">Costo estimado</div>
                <div className="font-semibold text-slate-800">
                  ${(pricing?.pricePerDay ?? 0) * (pricing?.totalDays ?? 0)}{" "}
                  <span className="text-xs text-slate-500 font-medium">
                    ({pricing?.totalDays ?? "—"} días × ${pricing?.pricePerDay ?? 0}/día)
                  </span>
                </div>
                <div className="text-xs text-slate-500 mt-1">Depósito: ${pricing?.depositAmount ?? 0}</div>
                <div className="text-xs font-semibold text-orange-600 mt-1">
                  Total: ${pricing?.totalAmountEstimated ?? "—"}
                </div>
              </div>
            </div>

            {showPaymentBox && (
              <div className="pt-2">
                <div className="text-sm font-semibold text-slate-800 mb-2">Estado del Pago</div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <div className={`rounded-xl border p-3 ${depositPaidStatus === "paid" ? "border-green-200 bg-green-50" : "border-slate-200"}`}>
                      <div className="text-xs text-slate-500">Depósito de garantía</div>
                      <div className="font-semibold text-slate-800">${depositAmount.toFixed(2)}</div>
                      <div className={`text-xs mt-1 font-medium ${depositPaidStatus === "paid" ? "text-green-600" : "text-slate-500"}`}>
                        {depositPaidStatus === "paid" ? "✓ Pagado" : depositPaidStatus === "failed" ? "✗ Error" : "Pendiente"}
                      </div>
                    </div>
                    <div className={`rounded-xl border p-3 ${rentalPaidStatus === "paid" ? "border-green-200 bg-green-50" : "border-slate-200"}`}>
                      <div className="text-xs text-slate-500">Alquiler ({pricing?.totalDays ?? "—"} días)</div>
                      <div className="font-semibold text-slate-800">${rentalAmount.toFixed(2)}</div>
                      <div className={`text-xs mt-1 font-medium ${rentalPaidStatus === "paid" ? "text-green-600" : "text-slate-500"}`}>
                        {rentalPaidStatus === "paid" ? `✓ Pagado ($${paidAmount.toFixed(2)})` : rentalPaidStatus === "failed" ? "✗ Error" : "Pendiente"}
                      </div>
                    </div>
                  </div>
                  {depositRefundStatus && depositRefundStatus !== "" && (
                    <div className={`rounded-xl border p-3 text-sm ${depositRefundStatus === "refunded" ? "border-blue-200 bg-blue-50" : depositRefundStatus === "failed" ? "border-red-200 bg-red-50" : "border-slate-200"}`}>
                      <div className="text-xs text-slate-500">Reembolso del depósito</div>
                      <div className={`font-medium mt-1 ${depositRefundStatus === "refunded" ? "text-blue-700" : depositRefundStatus === "failed" ? "text-red-600" : "text-slate-500"}`}>
                        {depositRefundStatus === "refunded" && `✓ Reembolsado ($${depositAmount.toFixed(2)})`}
                        {depositRefundStatus === "failed" && "✗ Error en el reembolso — contacta soporte"}
                        {depositRefundStatus === "skipped" && "Simulado (no se usó Stripe)"}
                        {depositRefundStatus === "pending" && "Procesando..."}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="pt-2">
              <div className="text-sm font-semibold text-slate-800 mb-2">Evidencias del producto (antes de entregar)</div>
              {evidencePhotos.length === 0 ? (
                <div className="text-sm text-slate-600">
                  {isOwner ? "Aún no has subido evidencias." : "El propietario aún no ha subido evidencias."}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {evidencePhotos.slice(0, 3).map((src, i) => (
                    <button
                      key={src}
                      type="button"
                      className="relative aspect-[16/10] rounded-xl overflow-hidden border border-slate-200 bg-slate-100"
                      onClick={() => Swal.fire({ imageUrl: src, imageAlt: `Evidencia ${i + 1}`, showConfirmButton: false })}
                      aria-label={`Ver evidencia ${i + 1}`}
                    >
                      <img src={src} alt={`Evidencia ${i + 1}`} className="absolute inset-0 w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-2">
              <Timeline contractUuid={contract.uuid} />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-100 shadow-sm">
          <CardContent className="p-6 space-y-3">
            <div className="text-sm font-semibold text-slate-800">Acciones</div>

            <Button
              variant="outline"
              className="w-full border-slate-200 text-slate-700 font-semibold"
              onClick={() => {
                try {
                  downloadContractPdf(contract);
                } catch (e: any) {
                  alerts.error("No se pudo generar el PDF", e?.message || "Intenta de nuevo.");
                }
              }}
            >
              <Download className="mr-2 h-4 w-4" />
              Descargar PDF del contrato
            </Button>

            {isOwner && (
              <Button
                className="w-full bg-orange-500 hover:bg-orange-600"
                onClick={uploadEvidence}
                disabled={!canUploadEvidence || hasAllEvidence}
              >
                {hasAllEvidence ? "Evidencias subidas" : "Subir evidencias (3 fotos)"}
              </Button>
            )}

            {isTenant && (
              <>
                <Button className="w-full bg-orange-500 hover:bg-orange-600" onClick={doHoldAndPay} disabled={!canHold}>
                  Pagar depósito de garantía
                </Button>
                {status === "signed" && (
                  <div className="text-xs text-slate-500 -mt-1">
                    Esperando que el propietario suba las 3 fotos de evidencia.
                  </div>
                )}
              </>
            )}

            {isTenant && (
              <Button
                className="w-full bg-orange-600 hover:bg-orange-700"
                onClick={() => uuid && navigate(`/checkout-rental/${uuid}`)}
                disabled={!canPayRental}
              >
                {(contract as any)?.payment?.rentalPaidStatus === "paid" ? "Alquiler pagado ✓" : "Pagar alquiler"}
              </Button>
            )}

            <Button
              variant="secondary"
              className="w-full bg-white border border-slate-200"
              onClick={() => signPhase("handover")}
              disabled={!canSignHandover}
            >
              Firmar entrega (handover)
            </Button>
            {status === "ready_for_handover" && !canSignHandover && (
              <div className="text-xs -mt-2">
                {alreadySignedHandover
                  ? <span className="text-green-600">Ya firmaste la entrega. Esperando la otra parte.</span>
                  : <span className="text-slate-500">El botón se habilita el día del pickup ({pickupAt ? pickupAt.toLocaleDateString("es-PA", { timeZone: "America/Panama" }) : "—"}).</span>
                }
              </div>
            )}
            <Button
              variant="secondary"
              className="w-full bg-white border border-slate-200"
              onClick={() => signPhase("return")}
              disabled={!canSignReturn}
            >
              Firmar devolución (return)
            </Button>
            {status === "in_progress" && !canSignReturn && (
              <div className="text-xs -mt-2">
                {alreadySignedReturn
                  ? <span className="text-green-600">Ya firmaste la devolución. Esperando la otra parte.</span>
                  : <span className="text-slate-500">El botón se habilita el día de la devolución ({shortDate((contract as any)?.endDate)}).</span>
                }
              </div>
            )}

            <div className="text-xs text-slate-500 pt-2">La firma genera un token temporal validando tu contraseña.</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
