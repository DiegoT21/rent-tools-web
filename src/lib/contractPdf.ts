import type { RentalContract } from "@/services/contractService";

function fmtDate(value?: string) {
  if (!value) return "—";
  const normalized = String(value).slice(0, 10);
  const [year, month, day] = normalized.split("-").map(Number);
  if (!year || !month || !day) return "—";
  return `${String(day).padStart(2, "0")}/${String(month).padStart(2, "0")}/${year}`;
}

export function downloadContractPdf(contract: RentalContract) {
  const toolName = contract.tool?.name ?? "Herramienta";
  const pricing = (contract as any)?.pricing ?? {};
  const payment = (contract as any)?.payment ?? {};
  const pickup = (contract as any)?.pickupProposal ?? (contract as any)?.pickup ?? {};
  const rentalAmount =
    payment?.rentalAmount ?? pricing?.rentalAmount ?? pricing?.subtotal ?? "—";
  const depositAmount = payment?.depositAmount ?? pricing?.depositAmount ?? "—";

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <title>Contrato ${contract.uuid}</title>
  <style>
    body { font-family: Arial, sans-serif; color: #0f172a; margin: 40px; line-height: 1.5; }
    h1 { font-size: 22px; margin-bottom: 4px; }
    .muted { color: #64748b; font-size: 13px; }
    .section { margin-top: 24px; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; }
    .label { font-size: 11px; text-transform: uppercase; letter-spacing: .08em; color: #94a3b8; font-weight: 700; }
    .value { font-size: 15px; font-weight: 600; margin-top: 4px; }
    table { width: 100%; border-collapse: collapse; margin-top: 12px; }
    td { padding: 8px 0; border-bottom: 1px solid #f1f5f9; vertical-align: top; }
    td:first-child { width: 38%; color: #64748b; font-weight: 600; }
    .footer { margin-top: 32px; font-size: 12px; color: #94a3b8; }
  </style>
</head>
<body>
  <h1>Contrato de alquiler — RentTools</h1>
  <p class="muted">Referencia: ${contract.uuid}</p>

  <div class="section">
    <div class="label">Herramienta</div>
    <div class="value">${toolName}</div>
    <table>
      <tr><td>Estado</td><td>${contract.status ?? "—"}</td></tr>
      <tr><td>Periodo</td><td>${fmtDate(contract.startDate)} → ${fmtDate(contract.endDate)}</td></tr>
      <tr><td>Punto de entrega</td><td>${pickup.label ?? pickup.addressLabel ?? "—"}</td></tr>
      <tr><td>Dirección</td><td>${pickup.addressLabel ?? pickup.address ?? "—"}</td></tr>
      <tr><td>Hora de entrega</td><td>${pickup.pickupAt ? new Date(pickup.pickupAt).toLocaleString("es-PA") : "—"}</td></tr>
    </table>
  </div>

  <div class="section">
    <div class="label">Montos</div>
    <table>
      <tr><td>Alquiler estimado</td><td>$${rentalAmount}</td></tr>
      <tr><td>Depósito / hold</td><td>$${depositAmount}</td></tr>
      <tr><td>Estado depósito</td><td>${payment?.holdStatus ?? payment?.depositPaidStatus ?? "—"}</td></tr>
      <tr><td>Estado pago alquiler</td><td>${payment?.rentalPaidStatus ?? "—"}</td></tr>
    </table>
  </div>

  <p class="footer">
    Documento generado desde RentTools. Las firmas digitales registradas en la plataforma tienen validez operativa dentro del flujo del contrato.
  </p>
  <script>window.onload = () => { window.print(); };</script>
</body>
</html>`;

  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, "_blank", "noopener,noreferrer");
  if (!win) {
    URL.revokeObjectURL(url);
    throw new Error("No se pudo abrir la ventana de impresión. Permite ventanas emergentes.");
  }
  win.onload = () => URL.revokeObjectURL(url);
}
