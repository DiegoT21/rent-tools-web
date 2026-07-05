import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { DateRange } from "react-day-picker";
import {
  CalendarDays,
  Clock,
  MapPin,
  MessageSquare,
  ArrowRight,
} from "lucide-react";

import { PublicTool, toolService } from "@/services/toolService";
import { rentalRequestService } from "@/services/rentalRequestService";
import { alerts } from "@/lib/alerts";
import { buildIsoDateRange, buildPickupAtIso, toDateOnlyString } from "@/lib/rentalDates";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Booking = { startDate: string; endDate: string; status?: string };
type Period = "AM" | "PM";

const MINUTE_OPTIONS = ["00", "15", "30", "45"];
const HOUR_OPTIONS = Array.from({ length: 12 }, (_, i) => String(i + 1));

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 768px)");
    const update = () => setIsDesktop(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  return isDesktop;
}

function parseIsoDateOnly(iso: string) {
  const [y, m, d] = iso.split("-").map((n) => Number(n));
  return new Date(y, (m ?? 1) - 1, d ?? 1, 0, 0, 0, 0);
}

function overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) {
  return aStart <= bEnd && bStart <= aEnd;
}

function to24Hour(hour12: number, minute: number, period: Period): string {
  let hour = hour12 % 12;
  if (period === "PM") hour += 12;
  if (period === "AM" && hour12 === 12) hour = 0;
  if (period === "PM" && hour12 === 12) hour = 12;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function formatTime12h(time24: string) {
  const [hh, mm] = time24.split(":").map((n) => Number(n));
  const period: Period = hh >= 12 ? "PM" : "AM";
  let hour12 = hh % 12;
  if (hour12 === 0) hour12 = 12;
  return `${hour12}:${String(mm).padStart(2, "0")} ${period}`;
}

export function RentalRequestDialog({
  open,
  onOpenChange,
  tool,
  toolUuid,
  meetingLocations: meetingLocationsProp,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (next: boolean) => void;
  tool: PublicTool;
  toolUuid: string;
  meetingLocations?: Array<{
    label?: string;
    address?: string;
    lat?: number;
    lng?: number;
    notes?: string;
  }>;
  onCreated?: () => void;
}) {
  const isDesktop = useIsDesktop();
  const pricePerDay = typeof tool.pricePerDay === "number" ? tool.pricePerDay : 0;
  const backendPricing = (tool as any)?.pricingSummary ?? null;
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]);

  const [range, setRange] = useState<DateRange | undefined>(undefined);
  const [pickupLabel, setPickupLabel] = useState("");
  const [pickupHour12, setPickupHour12] = useState("9");
  const [pickupMinute, setPickupMinute] = useState("00");
  const [pickupPeriod, setPickupPeriod] = useState<Period>("AM");
  const [message, setMessage] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const meetingLocations =
    Array.isArray(meetingLocationsProp) && meetingLocationsProp.length > 0
      ? meetingLocationsProp.slice(0, 3)
      : Array.isArray((tool as any)?.meetingLocations)
        ? (tool as any).meetingLocations.slice(0, 3)
        : [];
  const [selectedMeetingIndex, setSelectedMeetingIndex] = useState(0);

  const pickupTime = useMemo(
    () => to24Hour(Number(pickupHour12), Number(pickupMinute), pickupPeriod),
    [pickupHour12, pickupMinute, pickupPeriod]
  );

  const today = useMemo(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  }, []);

  useEffect(() => {
    if (!open) return;
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    setRange({ from: today, to: tomorrow });
    setPickupLabel("");
    setPickupHour12("9");
    setPickupMinute("00");
    setPickupPeriod("AM");
    setMessage("");
    setAcceptedTerms(false);
    setSelectedMeetingIndex(0);
    setFormError(null);
  }, [open, today]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      setLoadingBookings(true);
      try {
        const now = new Date();
        const from = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
        const to = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 3, 0)).toISOString();
        const data = await toolService.getBookings(toolUuid, from, to);
        if (!cancelled) setBookings(data ?? []);
      } catch {
        if (!cancelled) setBookings([]);
      } finally {
        if (!cancelled) setLoadingBookings(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, toolUuid]);

  const bookedDates = useMemo(() => {
    return bookings.flatMap((b) => {
      const start = parseIsoDateOnly(String(b.startDate).slice(0, 10));
      const end = parseIsoDateOnly(String(b.endDate).slice(0, 10));
      const days: Date[] = [];
      const cur = new Date(start.getFullYear(), start.getMonth(), start.getDate(), 0, 0, 0, 0);
      const last = new Date(end.getFullYear(), end.getMonth(), end.getDate(), 0, 0, 0, 0);
      while (cur <= last) {
        days.push(new Date(cur));
        cur.setDate(cur.getDate() + 1);
      }
      return days;
    });
  }, [bookings]);

  const selectedDays = useMemo(() => {
    if (!range?.from) return 0;
    const from = new Date(range.from.getFullYear(), range.from.getMonth(), range.from.getDate());
    const to = range.to ? new Date(range.to.getFullYear(), range.to.getMonth(), range.to.getDate()) : from;
    const diff = Math.round((to.getTime() - from.getTime()) / 86400000);
    return Number.isFinite(diff) && diff > 0 ? diff : 0;
  }, [range]);

  const depositMin = typeof (tool as any)?.depositAmount === "number" ? (tool as any).depositAmount : 0;
  const totalDays = typeof backendPricing?.totalDays === "number" ? backendPricing.totalDays : selectedDays;
  const subtotalRental =
    typeof backendPricing?.subtotal === "number" ? backendPricing.subtotal : totalDays * pricePerDay;
  const holdAmount =
    typeof backendPricing?.hold === "number"
      ? backendPricing.hold
      : Math.max(depositMin, Math.round(subtotalRental * 0.2));
  const totalEstimated =
    typeof backendPricing?.totalEstimated === "number" ? backendPricing.totalEstimated : subtotalRental + holdAmount;

  const disabledDays = useMemo(() => {
    return [
      { before: today },
      ...bookings.map((b) => ({
        from: new Date(b.startDate),
        to: new Date(b.endDate),
      })),
    ] as any;
  }, [bookings, today]);

  const modifiers = useMemo(() => ({ booked: bookedDates }), [bookedDates]);
  const modifiersClassNames = useMemo(
    () => ({
      booked:
        "[&>button]:bg-red-50 [&>button]:text-red-700 [&>button]:line-through [&>button]:opacity-100",
    }),
    []
  );

  const fromDate = range?.from
    ? new Date(range.from.getFullYear(), range.from.getMonth(), range.from.getDate())
    : null;
  const toDate = range?.to
    ? new Date(range.to.getFullYear(), range.to.getMonth(), range.to.getDate())
    : fromDate
      ? new Date(fromDate)
      : null;

  const rangeSummary = useMemo(() => {
    if (!fromDate) return "Selecciona las fechas en el calendario";
    const from = format(fromDate, "EEE d MMM yyyy", { locale: es });
    const to = toDate ? format(toDate, "EEE d MMM yyyy", { locale: es }) : from;
    return fromDate.getTime() === toDate?.getTime() ? from : `${from} → ${to}`;
  }, [fromDate, toDate]);

  const validate = () => {
    if (!range?.from) return "Selecciona el rango de fechas.";
    const from = new Date(range.from.getFullYear(), range.from.getMonth(), range.from.getDate());
    const to = range.to ? new Date(range.to.getFullYear(), range.to.getMonth(), range.to.getDate()) : from;
    const { startDateStr } = buildIsoDateRange(from, to);

    if (from < today) return "La fecha de inicio no puede ser anterior a hoy.";
    if (to <= from) return "Debes seleccionar al menos 1 día de alquiler.";

    for (const b of bookings) {
      const bStart = new Date(b.startDate);
      const bEnd = new Date(b.endDate);
      if (overlaps(from, to, bStart, bEnd)) return "La herramienta no está disponible en esas fechas.";
    }

    const [hh, mm] = pickupTime.split(":").map((n) => Number(n));
    const pickupAtLocal = new Date(from);
    pickupAtLocal.setHours(hh || 0, mm || 0, 0, 0);

    const pickupAtIso = buildPickupAtIso(startDateStr, pickupTime);
    if (pickupAtIso.slice(0, 10) !== startDateStr) {
      return "La entrega debe ser el mismo día de la fecha de inicio.";
    }

    if (hh < 8 || hh > 18 || (hh === 18 && mm > 0)) {
      return "La hora de entrega debe estar entre 8:00 AM y 6:00 PM.";
    }

    const isTodayPickup = from.getTime() === today.getTime();
    if (isTodayPickup) {
      const now = new Date();
      const minimumPickup = new Date(now.getTime() + 3 * 60 * 60 * 1000);
      if (pickupAtLocal < minimumPickup) {
        return "Si retiras hoy, la hora debe ser al menos 3 horas después de ahora.";
      }
    }

    if (meetingLocations.length === 0 && !pickupLabel.trim()) return "Indica el punto de encuentro.";
    if (!selectedDays) return "Selecciona un rango de fechas válido.";
    if (!acceptedTerms) return "Debes aceptar los términos y condiciones del alquiler.";
    return null;
  };

  const onSubmit = async () => {
    const error = validate();
    if (error) {
      setFormError(error);
      return;
    }
    if (!range?.from) return;

    setFormError(null);

    const from = new Date(range.from.getFullYear(), range.from.getMonth(), range.from.getDate());
    const to = range.to
      ? new Date(range.to.getFullYear(), range.to.getMonth(), range.to.getDate())
      : new Date(from);

    const { startDateStr, startDate, endDate } = buildIsoDateRange(from, to);
    const pickupAt = buildPickupAtIso(startDateStr, pickupTime);

    const selectedMeeting = meetingLocations[selectedMeetingIndex];
    const meetingLabel = selectedMeeting?.label
      ? String(selectedMeeting.label).trim()
      : undefined;
    const meetingAddress = selectedMeeting
      ? String(selectedMeeting.address ?? selectedMeeting.label ?? "").trim()
      : "";

    const pickupPayload =
      meetingLocations.length > 0 && selectedMeeting
        ? {
            label: meetingLabel,
            addressLabel: meetingAddress || meetingLabel || "Punto de encuentro",
            lat: typeof selectedMeeting.lat === "number" ? selectedMeeting.lat : undefined,
            lng: typeof selectedMeeting.lng === "number" ? selectedMeeting.lng : undefined,
            notes: selectedMeeting.notes ? String(selectedMeeting.notes) : undefined,
            pickupAt,
          }
        : {
            addressLabel: pickupLabel.trim(),
            pickupAt,
          };

    setSubmitting(true);
    try {
      await rentalRequestService.create({
        toolUuid,
        startDate,
        endDate,
        message: message.trim() ? message.trim() : undefined,
        acceptedTerms: true,
        pickup: pickupPayload,
      });

      onOpenChange(false);
      onCreated?.();
      await alerts.success("Solicitud enviada", "Tu solicitud fue enviada. Espera la respuesta del propietario.");
    } catch (e: any) {
      const status = e?.response?.status;
      const apiMessage =
        e?.response?.data?.message ??
        e?.response?.data?.error ??
        e?.message ??
        "No se pudo enviar la solicitud.";
      const msg = String(apiMessage);

      if (status === 409) {
        if (msg.toLowerCase().includes("trámite") || msg.toLowerCase().includes("tramite")) {
          onOpenChange(false);
          onCreated?.();
          await alerts.info("Solicitud en trámite", "Ya enviaste una solicitud, espera respuesta del dueño.");
          return;
        }
        if (msg.toLowerCase().includes("disponible")) {
          setFormError("La herramienta no está disponible en esas fechas. Elige otras.");
          return;
        }
      }

      if (status === 400) {
        setFormError(msg || "Solicitud inválida. Revisa fechas, punto de encuentro y hora.");
        return;
      }

      setFormError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const bookingLines = useMemo(() => {
    if (bookings.length === 0) return [];
    return bookings.slice(0, 6).map((b) => {
      const start = format(parseIsoDateOnly(String(b.startDate).slice(0, 10)), "dd/MM/yyyy", { locale: es });
      const end = format(parseIsoDateOnly(String(b.endDate).slice(0, 10)), "dd/MM/yyyy", { locale: es });
      return start === end ? start : `${start} → ${end}`;
    });
  }, [bookings]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[96vh] w-[calc(100vw-1rem)] max-w-6xl flex-col gap-0 overflow-hidden p-0 sm:w-full">
        <DialogHeader className="border-b border-slate-100 px-4 py-3 sm:px-5">
          <div className="flex items-center justify-between gap-3 pr-6">
            <div className="min-w-0">
              <DialogTitle className="text-lg font-black tracking-tight text-slate-950">
                Solicitar alquiler
              </DialogTitle>
              <DialogDescription asChild>
                <p className="truncate text-sm font-medium text-slate-700">{tool.name}</p>
              </DialogDescription>
            </div>
            <div className="shrink-0 rounded-xl bg-orange-50 px-3 py-2 text-right ring-1 ring-orange-100">
              <p className="text-[10px] font-bold uppercase tracking-wide text-orange-600">Por día</p>
              <p className="text-xl font-black text-slate-900">${pricePerDay}</p>
            </div>
          </div>
        </DialogHeader>

        <div className="overflow-hidden px-4 py-3 sm:px-5">
          <div className="grid gap-3 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)_220px]">
            {/* Columna 1: Calendario + hora */}
            <section className="rounded-xl border border-slate-200 bg-white p-3">
              <div className="mb-2 flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">Fechas</h3>
                <span className="ml-auto truncate text-[11px] font-medium text-slate-500">{rangeSummary}</span>
              </div>

              <div className="rounded-lg border border-slate-100 bg-slate-50/60 p-1">
                <Calendar
                  mode="range"
                  selected={range}
                  onSelect={(next) => {
                    if (next?.from && next?.to) {
                      const from = new Date(next.from.getFullYear(), next.from.getMonth(), next.from.getDate());
                      const to = new Date(next.to.getFullYear(), next.to.getMonth(), next.to.getDate());
                      if (to <= from) {
                        const adjustedTo = new Date(from);
                        adjustedTo.setDate(adjustedTo.getDate() + 1);
                        setRange({ from, to: adjustedTo });
                        setFormError("Debes seleccionar al menos 1 día de alquiler.");
                        return;
                      }
                    }
                    setRange(next);
                    setFormError(null);
                  }}
                  locale={es}
                  disabled={disabledDays}
                  modifiers={modifiers}
                  modifiersClassNames={modifiersClassNames}
                  numberOfMonths={isDesktop ? 2 : 1}
                  defaultMonth={today}
                  className="mx-auto p-0 [--cell-size:1.65rem] sm:[--cell-size:1.75rem]"
                  classNames={{
                    months: "flex flex-col gap-2 sm:flex-row sm:gap-3",
                    month: "space-y-2",
                    month_caption: "mb-1 flex justify-center relative items-center",
                    weekdays: "flex",
                    weekday: "w-[var(--cell-size)] text-[0.65rem] font-medium text-slate-500",
                    week: "mt-1 flex w-full",
                    day: "relative p-0 text-center",
                    day_button:
                      "h-[var(--cell-size)] w-[var(--cell-size)] rounded-md p-0 text-xs font-medium",
                    range_start:
                      "rounded-l-md bg-orange-100 [&>button]:bg-[#e86f00] [&>button]:text-white [&>button]:shadow-sm",
                    range_middle:
                      "bg-orange-100 [&>button]:bg-[#ffedd5] [&>button]:text-[#9a3412] [&>button]:font-semibold",
                    range_end:
                      "rounded-r-md bg-orange-100 [&>button]:bg-[#e86f00] [&>button]:text-white [&>button]:shadow-sm",
                    selected: "bg-orange-100",
                  }}
                />
              </div>

              <div className="mt-2.5 border-t border-slate-100 pt-2.5">
                <div className="mb-2 flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5 text-violet-600" />
                  <span className="text-xs font-bold text-slate-800">Hora de entrega</span>
                  <span className="ml-auto text-[11px] font-semibold text-violet-700">
                    {formatTime12h(pickupTime)}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  <Select value={pickupHour12} onValueChange={setPickupHour12}>
                    <SelectTrigger className="h-9 rounded-lg text-xs">
                      <SelectValue placeholder="Hora" />
                    </SelectTrigger>
                    <SelectContent>
                      {HOUR_OPTIONS.map((hour) => (
                        <SelectItem key={hour} value={hour}>{hour}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={pickupMinute} onValueChange={setPickupMinute}>
                    <SelectTrigger className="h-9 rounded-lg text-xs">
                      <SelectValue placeholder="Min" />
                    </SelectTrigger>
                    <SelectContent>
                      {MINUTE_OPTIONS.map((minute) => (
                        <SelectItem key={minute} value={minute}>{minute}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={pickupPeriod} onValueChange={(v) => setPickupPeriod(v as Period)}>
                    <SelectTrigger className="h-9 rounded-lg text-xs font-semibold">
                      <SelectValue placeholder="AM/PM" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AM">AM</SelectItem>
                      <SelectItem value="PM">PM</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </section>

            {/* Columna 2: Encuentro + mensaje */}
            <section className="flex min-h-0 flex-col rounded-xl border border-slate-200 bg-white p-3">
              <div className="mb-2 flex items-center gap-2">
                <MapPin className="h-4 w-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900">Punto de encuentro</h3>
              </div>

              {meetingLocations.length > 0 ? (
                <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-0.5">
                  {meetingLocations.map((location: any, index: number) => {
                    const isActive = selectedMeetingIndex === index;
                    const title = location.label ?? `Punto ${index + 1}`;
                    const address = location.address?.trim() || "";
                    const showAddress = address && address !== title;

                    return (
                      <button
                        key={`${location.label ?? location.address ?? index}-${index}`}
                        type="button"
                        onClick={() => setSelectedMeetingIndex(index)}
                        className={cn(
                          "w-full rounded-lg border px-2.5 py-2 text-left transition-all",
                          isActive
                            ? "border-[#e86f00] bg-orange-50/80 ring-1 ring-[#e86f00]/20"
                            : "border-slate-200 hover:bg-slate-50"
                        )}
                      >
                        <div className="flex items-start gap-2">
                          <div
                            className={cn(
                              "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2",
                              isActive ? "border-[#e86f00] bg-[#e86f00]" : "border-slate-300"
                            )}
                          >
                            {isActive ? <span className="h-1.5 w-1.5 rounded-full bg-white" /> : null}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-bold leading-snug text-slate-900 break-words">{title}</p>
                            {showAddress ? (
                              <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-slate-600">{address}</p>
                            ) : null}
                            {location.notes ? (
                              <p className="mt-1 line-clamp-1 text-[11px] text-slate-500">{location.notes}</p>
                            ) : null}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <Input
                  id="pickup-label"
                  value={pickupLabel}
                  onChange={(e) => setPickupLabel(e.target.value)}
                  placeholder="Ej. Multiplaza — entrada principal"
                  className="h-9 rounded-lg text-sm"
                />
              )}

              <div className="mt-2.5 border-t border-slate-100 pt-2.5">
                <Label htmlFor="rental-message" className="mb-1.5 flex items-center gap-1.5 text-xs font-bold text-slate-700">
                  <MessageSquare className="h-3.5 w-3.5 text-slate-400" />
                  Mensaje (opcional)
                </Label>
                <Textarea
                  id="rental-message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Ej. Lo necesito para una obra el lunes temprano."
                  rows={2}
                  className="min-h-0 resize-none rounded-lg text-sm"
                />
              </div>

              <div className="mt-2.5 rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs font-bold text-slate-800">Términos y condiciones</p>
                <p className="mt-1 text-[11px] leading-relaxed text-slate-600">
                  Al enviar esta solicitud, acepto que RentTools validará mi identidad, disponibilidad del equipo y
                  fechas seleccionadas antes de procesar el alquiler. Entiendo que el propietario deberá aprobar la
                  solicitud para generar el contrato, que el depósito o hold será calculado según el total estimado,
                  y que la entrega y devolución requerirán firma y evidencias fotográficas. También acepto que la
                  solicitud puede expirar automáticamente si no recibe respuesta dentro del plazo establecido y que
                  no podrá aprobarse si la fecha de inicio ya pasó.
                </p>
                <label className="mt-3 flex cursor-pointer items-start gap-2 text-xs text-slate-700">
                  <input
                    type="checkbox"
                    checked={acceptedTerms}
                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-slate-300 text-orange-500 focus:ring-orange-500"
                  />
                  <span>Acepto los términos y condiciones del alquiler</span>
                </label>
              </div>
            </section>

            {/* Resumen */}
            <aside className="space-y-2.5">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <h3 className="text-[11px] font-black uppercase tracking-wide text-slate-500">Resumen</h3>
                <div className="mt-2 space-y-1.5 text-xs">
                  <div className="flex justify-between gap-2">
                    <span className="text-slate-600">Días</span>
                    <span className="font-bold text-slate-900">{totalDays || "—"}</span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-slate-600">Subtotal</span>
                    <span className="font-bold">{totalDays ? `$${subtotalRental}` : "—"}</span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-slate-600">Depósito de garantía</span>
                    <span className="font-bold">{totalDays ? `$${holdAmount}` : "—"}</span>
                  </div>
                  <div className="flex justify-between gap-2 border-t border-slate-200 pt-1.5">
                    <span className="font-semibold text-slate-900">Total</span>
                    <span className="text-base font-black text-[#e86f00]">
                      {totalDays ? `$${totalEstimated}` : "—"}
                    </span>
                  </div>
                </div>
                {fromDate ? (
                  <p className="mt-2 rounded-lg bg-white px-2 py-1.5 text-[11px] text-slate-600 ring-1 ring-slate-200">
                    Entrega: {format(fromDate, "d MMM yyyy", { locale: es })} · {formatTime12h(pickupTime)}
                  </p>
                ) : null}
              </div>

              {bookingLines.length > 0 ? (
                <div className="rounded-xl border border-red-100 bg-red-50/70 p-2.5">
                  <p className="text-[10px] font-bold uppercase text-red-700">Ocupado</p>
                  <ul className="mt-1 space-y-0.5">
                    {bookingLines.slice(0, 4).map((line) => (
                      <li key={line} className="text-[10px] leading-snug text-red-800 break-words">
                        • {line}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </aside>
          </div>
        </div>

        {formError ? (
          <div className="border-t border-red-100 bg-red-50 px-4 py-2 text-xs font-medium text-red-700 sm:px-5">
            {formError}
          </div>
        ) : null}

        <DialogFooter className="gap-2 border-t border-slate-100 bg-slate-50/80 px-4 py-2.5 sm:px-5 sm:justify-between">
          <Button
            variant="outline"
            size="sm"
            className="rounded-lg"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Cancelar
          </Button>
          <Button
            size="sm"
            className="rounded-lg bg-[#e86f00] px-5 font-bold hover:bg-[#d46500]"
            onClick={onSubmit}
            disabled={submitting || !acceptedTerms}
          >
            {submitting ? "Enviando..." : (
              <span className="inline-flex items-center gap-2">
                Enviar solicitud <ArrowRight className="h-4 w-4" />
              </span>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
