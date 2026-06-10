import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { DateRange } from "react-day-picker";
import { CalendarIcon } from "lucide-react";

import { PublicTool, toolService } from "@/services/toolService";
import { rentalRequestService } from "@/services/rentalRequestService";
import { alerts } from "@/lib/alerts";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

type Booking = { startDate: string; endDate: string; status?: string };

function toDateOnlyString(d: Date) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseIsoDateOnly(iso: string) {
  const [y, m, d] = iso.split("-").map((n) => Number(n));
  return new Date(y, (m ?? 1) - 1, d ?? 1, 0, 0, 0, 0);
}

function overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) {
  return aStart <= bEnd && bStart <= aEnd;
}

function rangeToText(range: DateRange | undefined) {
  if (!range?.from) return "";
  const from = format(range.from, "dd/MM/yyyy", { locale: es });
  const to = range.to ? format(range.to, "dd/MM/yyyy", { locale: es }) : from;
  return from === to ? from : `${from} → ${to}`;
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
  const pricePerDay = typeof tool.pricePerDay === "number" ? tool.pricePerDay : 0;
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]);

  const [range, setRange] = useState<DateRange | undefined>(undefined);
  const [pickupLabel, setPickupLabel] = useState("");
  const [pickupTime, setPickupTime] = useState("09:00");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [fromOpen, setFromOpen] = useState(false);
  const [toOpen, setToOpen] = useState(false);
  const meetingLocations =
    Array.isArray(meetingLocationsProp) && meetingLocationsProp.length > 0
      ? meetingLocationsProp.slice(0, 3)
      : Array.isArray((tool as any)?.meetingLocations)
      ? (tool as any).meetingLocations.slice(0, 3)
      : [];
  const [selectedMeetingIndex, setSelectedMeetingIndex] = useState(0);

  const today = useMemo(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  }, []);

  useEffect(() => {
    if (!open) return;
    setRange({ from: today, to: today });
    setPickupLabel("");
    setPickupTime("09:00");
    setMessage("");
    setSelectedMeetingIndex(0);
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
      // Use date-only to avoid timezone shifting (we care about calendar days).
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

  const totalDays = useMemo(() => {
    if (!range?.from) return 0;
    const from = new Date(range.from.getFullYear(), range.from.getMonth(), range.from.getDate());
    const to = range.to ? new Date(range.to.getFullYear(), range.to.getMonth(), range.to.getDate()) : from;
    const diff = Math.round((to.getTime() - from.getTime()) / 86400000) + 1;
    return Number.isFinite(diff) && diff > 0 ? diff : 0;
  }, [range]);

  const subtotalRental = useMemo(() => {
    if (!totalDays) return 0;
    return pricePerDay * totalDays;
  }, [pricePerDay, totalDays]);

  const holdAmount = useMemo(() => {
    if (!subtotalRental) return 0;
    return Math.round(subtotalRental * 0.25);
  }, [subtotalRental]);

  const totalEstimated = useMemo(() => subtotalRental + holdAmount, [holdAmount, subtotalRental]);

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
      // Keep visible even if the day is also disabled.
      booked: "!bg-red-50 !text-red-700 !opacity-100 line-through",
    }),
    []
  );

  const fromDate = range?.from ? new Date(range.from.getFullYear(), range.from.getMonth(), range.from.getDate()) : null;
  const toDate = range?.to
    ? new Date(range.to.getFullYear(), range.to.getMonth(), range.to.getDate())
    : fromDate
      ? new Date(fromDate)
      : null;

  const fromText = fromDate ? format(fromDate, "dd/MM/yyyy", { locale: es }) : "";
  const toText = toDate ? format(toDate, "dd/MM/yyyy", { locale: es }) : "";

  const onSelectFrom = (d: Date | undefined) => {
    if (!d) return;
    const picked = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const nextTo = toDate && toDate >= picked ? toDate : picked;
    setRange({ from: picked, to: nextTo });
    setFromOpen(false);
  };

  const onSelectTo = (d: Date | undefined) => {
    if (!d) return;
    if (!fromDate) {
      const picked = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      setRange({ from: picked, to: picked });
      setToOpen(false);
      return;
    }
    const picked = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const nextTo = picked < fromDate ? fromDate : picked;
    setRange({ from: fromDate, to: nextTo });
    setToOpen(false);
  };

  const validate = () => {
    if (!range?.from) return "Selecciona el rango de fechas.";
    const from = new Date(range.from.getFullYear(), range.from.getMonth(), range.from.getDate());
    const to = range.to ? new Date(range.to.getFullYear(), range.to.getMonth(), range.to.getDate()) : from;

    if (from < today) return "La fecha 'Desde' no puede ser anterior a hoy.";
    if (to < from) return "La fecha 'Hasta' debe ser mayor o igual a 'Desde'.";

    // Check overlap with bookings inclusive
    for (const b of bookings) {
      const bStart = new Date(b.startDate);
      const bEnd = new Date(b.endDate);
      if (overlaps(from, to, bStart, bEnd)) return "La herramienta no está disponible en esas fechas.";
    }

    if (!pickupTime) return "Selecciona la hora de entrega.";
    const [hh, mm] = pickupTime.split(":").map((n) => Number(n));
    const pickupAt = new Date(from);
    pickupAt.setHours(hh || 0, mm || 0, 0, 0);
    if (pickupAt < from || pickupAt > to) return "La entrega debe estar dentro del rango seleccionado.";

    const isTodayPickup = from.getTime() === today.getTime();
    if (hh < 8 || hh > 18 || (hh === 18 && mm > 0)) {
      return "La hora de entrega debe estar dentro del horario permitido (08:00-18:00).";
    }

    if (isTodayPickup) {
      const now = new Date();
      const minimumPickup = new Date(now.getTime() + 3 * 60 * 60 * 1000);
      if (pickupAt < minimumPickup) {
        return "La hora de entrega debe estar al menos 3 horas después de la hora actual.";
      }
    }

    if (meetingLocations.length === 0 && !pickupLabel.trim()) return "Escribe el punto de encuentro.";
    if (!totalDays) return "Selecciona un rango de fechas válido.";
    return null;
  };

  const onSubmit = async () => {
    const error = validate();
    if (error) {
      await alerts.warning("Revisa la solicitud", error);
      return;
    }
    if (!range?.from) return;

    const fromDate = new Date(range.from.getFullYear(), range.from.getMonth(), range.from.getDate());
    const toDate = range.to
      ? new Date(range.to.getFullYear(), range.to.getMonth(), range.to.getDate())
      : new Date(fromDate);

    const [hh, mm] = pickupTime.split(":").map((n) => Number(n));
    const pickupAt = new Date(fromDate);
    pickupAt.setHours(hh || 0, mm || 0, 0, 0);

    const startDate = toDateOnlyString(fromDate);
    const endDate = toDateOnlyString(toDate);
    const pickupIso = pickupAt.toISOString();
    const selectedMeeting = meetingLocations[selectedMeetingIndex];
    const pickupPayload =
      meetingLocations.length > 0 && selectedMeeting
        ? {
            addressLabel: String(selectedMeeting.address ?? selectedMeeting.label ?? "").trim(),
            lat: typeof selectedMeeting.lat === "number" ? selectedMeeting.lat : undefined,
            lng: typeof selectedMeeting.lng === "number" ? selectedMeeting.lng : undefined,
            notes: selectedMeeting.notes ? String(selectedMeeting.notes) : undefined,
            pickupAt: pickupIso,
          }
        : {
            addressLabel: pickupLabel.trim(),
            pickupAt: pickupIso,
          };

    setSubmitting(true);
    try {
      await rentalRequestService.create({
        toolUuid,
        startDate,
        endDate,
        message: message.trim() ? message.trim() : undefined,
        pickup: pickupPayload,
      });

      await alerts.success("Solicitud enviada", "Tu solicitud fue enviada. Espera la respuesta del propietario.");
      onOpenChange(false);
      onCreated?.();
    } catch (e: any) {
      const msg = String(e?.message ?? "No se pudo enviar la solicitud.");
      if (e?.status === 409 || msg.includes("409")) {
        if (msg.toLowerCase().includes("trámite") || msg.toLowerCase().includes("tramite")) {
          await alerts.info("Solicitud en trámite", "Ya enviaste una solicitud, espera respuesta del dueño.");
          onOpenChange(false);
          onCreated?.();
          return;
        }
        if (msg.toLowerCase().includes("disponible")) {
          await alerts.warning("Fechas ocupadas", "La herramienta no está disponible en esas fechas. Elige otras.");
          return;
        }
      }
      await alerts.error("Error", msg);
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
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Confirmar solicitud</DialogTitle>
          <DialogDescription className="flex flex-col gap-1">
            <span className="font-medium text-slate-900">{tool.name}</span>
            <span>
              Precio: <span className="font-semibold">${pricePerDay}</span> / día
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Desde</Label>
                <Popover open={fromOpen} onOpenChange={setFromOpen}>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className={cn(
                        "w-full h-10 rounded-xl border border-slate-200 px-3 text-left text-sm text-slate-700",
                        "flex items-center justify-between hover:bg-slate-50"
                      )}
                    >
                      <span className={fromText ? "text-slate-900" : "text-slate-400"}>{fromText || "Seleccionar"}</span>
                      <CalendarIcon className="h-4 w-4 text-slate-500" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent align="start">
                    <Calendar
                      mode="single"
                      selected={fromDate ?? undefined}
                      onSelect={onSelectFrom}
                      locale={es}
                      disabled={disabledDays}
                      modifiers={modifiers}
                      modifiersClassNames={modifiersClassNames}
                      numberOfMonths={1}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label>Hasta</Label>
                <Popover open={toOpen} onOpenChange={setToOpen}>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className={cn(
                        "w-full h-10 rounded-xl border border-slate-200 px-3 text-left text-sm text-slate-700",
                        "flex items-center justify-between hover:bg-slate-50"
                      )}
                    >
                      <span className={toText ? "text-slate-900" : "text-slate-400"}>{toText || "Seleccionar"}</span>
                      <CalendarIcon className="h-4 w-4 text-slate-500" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent align="start">
                    <Calendar
                      mode="single"
                      selected={toDate ?? undefined}
                      onSelect={onSelectTo}
                      locale={es}
                      disabled={disabledDays}
                      modifiers={modifiers}
                      modifiersClassNames={modifiersClassNames}
                      numberOfMonths={1}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <Label>Resumen</Label>
                <div className="mt-1 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700">
                  {totalDays ? (
                    <div className="space-y-1">
                      <div>
                        <span className="font-semibold">{totalDays}</span> día(s)
                      </div>
                      <div>Subtotal alquiler: <span className="font-semibold">${subtotalRental}</span></div>
                      <div>Hold / depósito: <span className="font-semibold">${holdAmount}</span></div>
                      <div>Total estimado: <span className="font-semibold">${totalEstimated}</span></div>
                    </div>
                  ) : (
                    "—"
                  )}
                </div>
              </div>
            </div>

            {meetingLocations.length > 0 ? (
              <div className="space-y-2">
                <Label>Punto de encuentro</Label>
                <div className="grid gap-2">
                  {meetingLocations.map((location: any, index: number) => {
                    const isActive = selectedMeetingIndex === index;
                    return (
                      <button
                        key={`${location.label ?? location.address ?? index}-${index}`}
                        type="button"
                        onClick={() => setSelectedMeetingIndex(index)}
                        className={cn(
                          "rounded-xl border px-3 py-3 text-left transition-colors",
                          isActive
                            ? "border-primary bg-orange-50 ring-1 ring-primary/20"
                            : "border-slate-200 bg-white hover:bg-slate-50"
                        )}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="font-semibold text-slate-900">
                              {location.label ?? `Punto ${index + 1}`}
                            </div>
                            <div className="text-sm text-slate-600">{location.address ?? "Dirección exacta no disponible"}</div>
                            {location.notes ? <div className="mt-1 text-xs text-slate-500">{location.notes}</div> : null}
                          </div>
                          <div
                            className={cn(
                              "mt-1 h-4 w-4 rounded-full border-2",
                              isActive ? "border-primary bg-primary" : "border-slate-300 bg-white"
                            )}
                          />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div>
                <Label>Punto de encuentro</Label>
                <Input
                  className="mt-1"
                  value={pickupLabel}
                  onChange={(e) => setPickupLabel(e.target.value)}
                  placeholder="Ej. Multiplaza - entrada principal"
                />
              </div>
            )}

            <div>
              <Label>Hora de entrega</Label>
              <Input className="mt-1" type="time" value={pickupTime} onChange={(e) => setPickupTime(e.target.value)} />
              <p className="mt-1 text-xs text-slate-500">
                La entrega será el mismo día de <span className="font-medium">Desde</span> (solo eliges la hora).
              </p>
            </div>

            <div>
              <Label>Mensaje (opcional)</Label>
              <Textarea
                className="mt-1"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Ej. Lo necesito para un trabajo..."
              />
            </div>

            {bookingLines.length > 0 ? (
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                <div className="text-xs font-semibold text-slate-700">Rangos ocupados</div>
                <ul className="mt-1 space-y-0.5 text-xs text-slate-600">
                  {bookingLines.map((l) => (
                    <li key={l} className="flex items-start gap-2">
                      <span className={cn("mt-[3px] h-1.5 w-1.5 rounded-full bg-slate-400")} />
                      <span>{l}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-2 text-[11px] text-slate-500">
                  {loadingBookings ? "Cargando disponibilidad..." : "Los días ocupados aparecen marcados en rojo en el calendario."}
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancelar
          </Button>
          <Button onClick={onSubmit} disabled={submitting}>
            {submitting ? "Enviando..." : "Enviar solicitud"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
