import { useRef, useState } from "react";
import { AlertTriangle, Loader2, MessageSquareWarning, X, ImagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { disputeReasonOptions, disputeService, type DisputeReason } from "@/services/disputeService";
import { mediaService } from "@/services/mediaService";
import { alerts } from "@/lib/alerts";
import type { MyRental } from "@/services/contractService";

interface DisputeDialogProps {
  rental: MyRental;
  toolName?: string;
  ownerName?: string;
  onSuccess?: () => void;
  onClose: () => void;
}

export function DisputeDialog({ rental, toolName, ownerName, onSuccess, onClose }: DisputeDialogProps) {
  const [reason, setReason] = useState<DisputeReason | "">("");
  const [description, setDescription] = useState("");
  const [photos, setPhotos] = useState<{ file: File; preview: string }[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePickPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    const remaining = 2 - photos.length;
    const toAdd = files.slice(0, remaining);
    setPhotos((prev) => [...prev, ...toAdd.map((f) => ({ file: f, preview: URL.createObjectURL(f) }))]);
    e.target.value = "";
  };

  const removePhoto = (i: number) => {
    setPhotos((prev) => {
      URL.revokeObjectURL(prev[i].preview);
      return prev.filter((_, idx) => idx !== i);
    });
  };

  const handleSubmit = async () => {
    if (!reason) { setError("Selecciona un motivo para la disputa."); return; }
    if (description.trim().length < 20) { setError("La descripción debe tener al menos 20 caracteres."); return; }
    if (photos.length < 2) { setError("Debes adjuntar exactamente 2 fotos como evidencia."); return; }

    const contractUuid = String(rental.uuid ?? "");
    if (!contractUuid) { setError("No se pudo identificar el alquiler."); return; }

    setSubmitting(true);
    setUploading(true);
    setError(null);

    let evidenceUrls: string[] = [];
    try {
      const uploaded = await Promise.all(
        photos.map((p) => mediaService.uploadFileToStorageWithUrl(p.file, false, "evidence"))
      );
      evidenceUrls = uploaded.map((u) => u.publicUrl);
    } catch {
      setError("No se pudieron subir las fotos. Intenta de nuevo.");
      setSubmitting(false);
      setUploading(false);
      return;
    }
    setUploading(false);

    try {
      await disputeService.create({
        rentalUuid: rental.requestUuid ?? rental.uuid,
        requestUuid: rental.requestUuid,
        contractUuid,
        reason,
        description: description.trim(),
        evidenceImages: evidenceUrls,
      });
      await alerts.success("Disputa enviada", "Tu reporte fue creado correctamente.");
      onSuccess?.();
      onClose();
    } catch (e: any) {
      if (e?.response?.status === 409) { setError("Ya existe una disputa activa para este alquiler."); return; }
      if (e?.response?.status === 422) { setError(e?.response?.data?.message || "Este alquiler no permite abrir disputas aún."); return; }
      setError(e?.response?.data?.message || "No se pudo enviar la disputa. Inténtalo de nuevo.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg bg-white">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-amber-100 flex items-center justify-center">
              <MessageSquareWarning className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <DialogTitle className="text-left">Abrir disputa</DialogTitle>
              <DialogDescription className="text-left">
                {toolName ? `${toolName}${ownerName ? ` · ${ownerName}` : ""}` : "Reporta un problema con este alquiler."}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-5">
          <div className="rounded-2xl border border-amber-200 bg-amber-50/70 px-4 py-3 text-sm text-amber-900 flex gap-3">
            <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600 mt-0.5" />
            <p>Solo se puede abrir una disputa por alquiler. Se requieren 2 fotos como evidencia del problema.</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Motivo <span className="text-red-500">*</span></label>
            <Select value={reason} onValueChange={(v) => setReason(v as DisputeReason)}>
              <SelectTrigger className="h-11 rounded-xl bg-slate-50 border-slate-200">
                <SelectValue placeholder="Selecciona un motivo" />
              </SelectTrigger>
              <SelectContent>
                {disputeReasonOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Descripción <span className="text-red-500">*</span></label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe qué ocurrió, qué evidencias tienes y qué solución esperas."
              className="min-h-[120px] rounded-xl border-slate-200 bg-slate-50 resize-none"
              maxLength={1000}
            />
            <div className="flex justify-between text-xs">
              {description.trim().length > 0 && description.trim().length < 20
                ? <span className="text-red-500">Mínimo 20 caracteres ({20 - description.trim().length} restantes)</span>
                : <span />}
              <span className="text-slate-400">{description.length}/1000</span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">
              Fotos de evidencia <span className="text-red-500">*</span>
              <span className="ml-1 text-xs font-normal text-slate-400">({photos.length}/2)</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              {photos.map((p, i) => (
                <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-slate-200 bg-slate-100 group">
                  <img src={p.preview} alt={`Foto ${i + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removePhoto(i)}
                    className="absolute top-1.5 right-1.5 w-6 h-6 bg-slate-900/60 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              {photos.length < 2 && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="aspect-square rounded-xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center gap-1.5 text-slate-400 hover:border-amber-400 hover:text-amber-500 transition-colors"
                >
                  <ImagePlus className="w-6 h-6" />
                  <span className="text-xs">Agregar foto</span>
                </button>
              )}
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePickPhoto} />
          </div>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
          )}
        </div>

        <DialogFooter className="gap-3 sm:gap-3">
          <Button variant="secondary" className="bg-slate-100 text-slate-700 hover:bg-slate-200 border-0" onClick={onClose} disabled={submitting}>
            Cancelar
          </Button>
          <Button
            className="bg-amber-500 hover:bg-amber-600 text-slate-950"
            onClick={handleSubmit}
            disabled={submitting || !reason || photos.length < 2 || description.trim().length < 20}
          >
            {submitting ? (
              <><Loader2 className="h-4 w-4 animate-spin mr-2" />{uploading ? "Subiendo fotos..." : "Enviando..."}</>
            ) : "Enviar disputa"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
