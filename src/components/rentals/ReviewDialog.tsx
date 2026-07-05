import { useState } from "react";
import { Star, X, Loader2, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

interface ReviewDialogProps {
  contractUuid: string;
  toolUuid: string;
  ownerUuid: string;
  toolName?: string;
  ownerName?: string;
  onSuccess?: () => void;
  onClose: () => void;
}

const unwrap = (res: any) => res?.data?.data ?? res?.data;

export async function checkReviewExists(contractUuid: string): Promise<boolean> {
  try {
    const res = await api.get(`/reviews/by-contract/${encodeURIComponent(contractUuid)}`);
    const data = unwrap(res);
    return Boolean(data);
  } catch {
    return false;
  }
}

export async function submitReview(params: {
  contractUuid: string;
  toolUuid: string;
  ownerUuid: string;
  rating: number;
  comment: string;
}) {
  const res = await api.post(`/reviews`, {
    contractUuid: params.contractUuid,
    toolRating: params.rating,
    ownerRating: params.rating,
    comment: params.comment,
  });
  return unwrap(res);
}

export function ReviewDialog({
  contractUuid,
  toolUuid,
  ownerUuid,
  toolName,
  ownerName,
  onSuccess,
  onClose,
}: ReviewDialogProps) {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (rating === 0) {
      setError("Por favor selecciona una calificación (1–5 estrellas).");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await submitReview({ contractUuid, toolUuid, ownerUuid, rating, comment });
      onSuccess?.();
      onClose();
    } catch (e: any) {
      const msg = e?.response?.data?.message || "No se pudo enviar la reseña. Inténtalo de nuevo.";
      if (e?.response?.status === 409) {
        setError("Ya dejaste una reseña para este alquiler.");
      } else {
        setError(msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const displayRating = hovered || rating;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 animate-in fade-in zoom-in-95 duration-200">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 h-8 w-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          aria-label="Cerrar"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-2xl bg-orange-100 flex items-center justify-center">
            <MessageSquare className="h-5 w-5 text-orange-500" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Dejar Reseña</h2>
            {toolName && (
              <p className="text-sm text-slate-500 mt-0.5">
                {toolName}
                {ownerName && ` · ${ownerName}`}
              </p>
            )}
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-semibold text-slate-700 mb-3">
            Calificación <span className="text-orange-500">*</span>
          </label>
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHovered(star)}
                onMouseLeave={() => setHovered(0)}
                className="transition-transform hover:scale-110 focus:outline-none"
                aria-label={`${star} estrellas`}
              >
                <Star
                  className={`h-9 w-9 transition-colors ${
                    displayRating >= star
                      ? "text-amber-400 fill-amber-400"
                      : "text-slate-200 fill-slate-200"
                  }`}
                />
              </button>
            ))}
            {displayRating > 0 && (
              <span className="ml-2 text-sm font-semibold text-slate-600">
                {["", "Muy malo", "Malo", "Regular", "Bueno", "Excelente"][displayRating]}
              </span>
            )}
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Comentario <span className="text-slate-400 font-normal">(opcional)</span>
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Cuéntanos cómo fue tu experiencia con esta herramienta y su propietario..."
            className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-400/30 focus:border-orange-400 transition-all"
            rows={4}
            maxLength={500}
          />
          <div className="mt-1 text-right text-xs text-slate-400">{comment.length}/500</div>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <Button
            variant="secondary"
            className="flex-1 bg-slate-100 text-slate-700 hover:bg-slate-200 border-0"
            onClick={onClose}
            disabled={submitting}
          >
            Cancelar
          </Button>
          <Button
            className="flex-1 bg-orange-500 hover:bg-orange-600 text-white shadow-md shadow-orange-500/20"
            onClick={handleSubmit}
            disabled={submitting || rating === 0}
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Enviando...
              </>
            ) : (
              "Enviar reseña"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
