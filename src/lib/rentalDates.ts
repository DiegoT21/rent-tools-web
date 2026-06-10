/** Fecha de calendario local → YYYY-MM-DD */
export function toDateOnlyString(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Rango de alquiler como medianoche UTC (formato que espera el backend). */
export function buildIsoDateRange(from: Date, to: Date) {
  const startDateStr = toDateOnlyString(from);
  const endDateStr = toDateOnlyString(to);
  return {
    startDateStr,
    endDateStr,
    startDate: new Date(`${startDateStr}T00:00:00.000Z`).toISOString(),
    endDate: new Date(`${endDateStr}T00:00:00.000Z`).toISOString(),
  };
}

/** Hora local del navegador + día de inicio → ISO UTC para pickupAt. */
export function buildPickupAtIso(startDateStr: string, time24: string): string {
  const [year, month, day] = startDateStr.split("-").map(Number);
  const [hour, minute] = time24.split(":").map(Number);
  const local = new Date(year, month - 1, day, hour, minute, 0, 0);
  return local.toISOString();
}
