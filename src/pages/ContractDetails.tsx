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

  const status = String(contract?.status ?? "");
  const canHold = isTenant && ["signed", "owner_evidence_pending", "payment_pending"].includes(status);
  const canUploadEvidence = isOwner && ["signed", "owner_evidence_pending", "payment_pending"].includes(status);
  const canSignHandover =
    (isOwner || isTenant) &&
    status === "ready_for_handover" &&
    String((contract as any)?.payment?.holdStatus ?? "") === "authorized";
  const canSignReturn = (isOwner || isTenant) && status === "in_progress";

  const nextStep = useMemo(() => {
    if (!contract) return { title: "Cargando...", text: "" };
    if (status === "signed") return { title: "Siguiente paso: Evidencias + Hold", text: "El propietario sube 3 fotos y el solicitante autoriza el hold/pago." };
    if (status === "owner_evidence_pending") return { title: "Siguiente paso: Autorizar hold", text: "El solicitante debe autorizar el hold/pago para habilitar la entrega." };
    if (status === "payment_pending") return { title: "Siguiente paso: Autorizar hold", text: "El solicitante debe autorizar el hold/pago para habilitar la entrega." };
    if (status === "ready_for_handover") return { title: "Siguiente paso: Firmar entrega", text: "Ambas partes deben firmar la entrega (handover) para iniciar el alquiler." };
    if (status === "in_progress") return { title: "Siguiente paso: Firmar devolución", text: "Al finalizar, ambas partes firman la devolución (return) para completar el alquiler." };
    if (status === "completed") return { title: "Alquiler completado", text: "El contrato ya fue cerrado." };
    return { title: `Estado: ${status}`, text: "Sigue el timeline para continuar." };
  }, [contract, status]);

  const payment = (contract as any)?.payment ?? null;
  const holdStatus = String(payment?.holdStatus ?? "");
  const paymentPlan = String(payment?.paymentPlan ?? "");
  const depositAmount = typeof payment?.depositAmount === "number" ? payment.depositAmount : null;
  const rentalAmount = typeof payment?.rentalAmount === "number" ? payment.rentalAmount : null;
  const amountDueNow = typeof payment?.amountDueNow === "number" ? payment.amountDueNow : null;
  const amountDueLater = typeof payment?.amountDueLater === "number" ? payment.amountDueLater : null;
  const paidAmount = typeof payment?.paidAmount === "number" ? payment.paidAmount : null;
  const paidStatus = String(payment?.paidStatus ?? "");
  const showPaymentBox = isTenant && (holdStatus === "authorized" || status === "ready_for_handover" || paidStatus !== "");

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
      await alerts.info("No disponible", "Solo el solicitante puede autorizar el hold y solo cuando corresponda.");
      return;
    }
    const ok = await alerts.confirm({
      title: "Autorizar hold y pagar",
      text: "Esto autoriza el hold/garantía y registra el pago (simulado) de la primera parte.",
      confirmText: "Continuar",
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
      await contractService.paymentPay(uuid, "first");
      await alerts.success("Listo", "Hold autorizado y pago (simulado) registrado.");
      refresh();
    } catch (e: any) {
      await alerts.error("No se pudo completar", e?.response?.data?.message || "Intenta de nuevo.");
    }
  };

  const paySimulated = async (part: "first" | "second") => {
    if (!uuid) return;
    if (!isTenant) return;
    const ok = await alerts.confirm({
      title: part === "first" ? "Pagar ahora (simulado)" : "Pagar segunda parte (simulado)",
      text: "Esto es una simulación para pruebas (sin pasarela).",
      confirmText: "Pagar",
      cancelText: "Cancelar",
    });
    if (!ok) return;
    try {
      await contractService.paymentPay(uuid, part);
      await alerts.success("Pago registrado", "Se actualizó el estado del pago (simulado).");
      refresh();
    } catch (e: any) {
      await alerts.error("No se pudo pagar", e?.response?.data?.message || "Intenta de nuevo.");
    }
  };

  const signPhase = async (phase: "handover" | "return") => {
    if (!uuid) return;
    if (!isOwner && !isTenant) {
      await alerts.error("No autorizado", "Este contrato no corresponde a tu usuario.");
      return;
    }
    if (phase === "handover" && !canSignHandover) {
      await alerts.warning("Aún no", "Primero el solicitante debe autorizar el hold/pago para habilitar la entrega.");
      return;
    }
    if (phase === "return" && !canSignReturn) {
      await alerts.warning("Aún no", "La devolución solo se firma cuando el contrato está en progreso (in_progress).");
      return;
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
      await alerts.error("No se pudo firmar", e?.response?.data?.message || "Intenta de nuevo.");
    }
  };

  if (loading) return <div className="max-w-5xl mx-auto py-10 px-4 text-slate-600">Cargando contrato...</div>;
  if (error) return <div className="max-w-5xl mx-auto py-10 px-4 text-red-600">{error}</div>;
  if (!contract) return <div className="max-w-5xl mx-auto py-10 px-4 text-slate-600">Contrato no encontrado.</div>;

  const pickup = contract.pickup;
  const pricing = contract.pricing;
  const evidencePhotos = Array.isArray(contract.ownerEvidence?.photosBeforeHandover)
    ? contract.ownerEvidence?.photosBeforeHandover.map((p) => (typeof p === "string" ? mediaService.resolvePublicUrl(p) : p))
    : [];

  const hasAllEvidence = evidencePhotos.length >= 3;

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
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-sm font-bold text-slate-900">{nextStep.title}</div>
              <div className="text-sm text-slate-600 mt-1">{nextStep.text}</div>
            </div>
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

            {showPaymentBox && (
              <div className="pt-2">
                <div className="text-sm font-semibold text-slate-800 mb-2">Pago (simulado)</div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <div className="rounded-xl border border-slate-200 p-3">
                      <div className="text-xs text-slate-500">Depósito (hold)</div>
                      <div className="font-semibold text-slate-800">{depositAmount !== null ? `$${depositAmount}` : "—"}</div>
                      <div className="text-xs text-slate-500 mt-1">Estado hold: {holdStatus || "—"}</div>
                    </div>
                    <div className="rounded-xl border border-slate-200 p-3">
                      <div className="text-xs text-slate-500">Alquiler total</div>
                      <div className="font-semibold text-slate-800">{rentalAmount !== null ? `$${rentalAmount}` : "—"}</div>
                      <div className="text-xs text-slate-500 mt-1">Plan: {paymentPlan || "—"}</div>
                    </div>
                    <div className="rounded-xl border border-slate-200 p-3">
                      <div className="text-xs text-slate-500">A pagar ahora</div>
                      <div className="font-semibold text-slate-800">{amountDueNow !== null ? `$${amountDueNow}` : "—"}</div>
                      <div className="text-xs text-slate-500 mt-1">Pagado: {paidAmount !== null ? `$${paidAmount}` : "$0"}</div>
                    </div>
                    <div className="rounded-xl border border-slate-200 p-3">
                      <div className="text-xs text-slate-500">A pagar luego</div>
                      <div className="font-semibold text-slate-800">{amountDueLater !== null ? `$${amountDueLater}` : "$0"}</div>
                      <div className="text-xs text-slate-500 mt-1">Estado pago: {paidStatus || "—"}</div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button
                      onClick={() => paySimulated("first")}
                      className="bg-orange-500 hover:bg-orange-600 text-white font-bold h-11"
                      disabled={holdStatus !== "authorized" || (paidAmount ?? 0) > 0}
                    >
                      {(paidAmount ?? 0) > 0 ? "Pago registrado" : "Pagar ahora (simulado)"}
                    </Button>
                    {paymentPlan === "two_payments" && (amountDueLater ?? 0) > 0 && (
                      <Button
                        onClick={() => paySimulated("second")}
                        variant="secondary"
                        className="bg-white border border-slate-200 text-slate-800 font-bold h-11"
                        disabled={holdStatus !== "authorized"}
                      >
                        Pagar segunda parte (simulado)
                      </Button>
                    )}
                  </div>
                  <div className="text-xs text-slate-500">
                    Nota: esto no usa Stripe; el backend simula los pagos para pruebas.
                  </div>
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
              <Button className="w-full bg-orange-500 hover:bg-orange-600" onClick={doHoldAndPay} disabled={!canHold}>
                Autorizar hold y pagar ahora
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
            <Button
              variant="secondary"
              className="w-full bg-white border border-slate-200"
              onClick={() => signPhase("return")}
              disabled={!canSignReturn}
            >
              Firmar devolución (return)
            </Button>

            <div className="text-xs text-slate-500 pt-2">La firma genera un token temporal validando tu contraseña.</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
