import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2, MessageSquare, Paperclip, RefreshCw, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { alerts } from "@/lib/alerts";
import { mediaService } from "@/services/mediaService";
import { disputeService, type DisputeDetail, type DisputeMessage } from "@/services/disputeService";

type Props = {
  disputeUuid: string;
  title?: string;
  subtitle?: string;
  compact?: boolean;
};

export function DisputeThread({ disputeUuid, title = "Chat de disputa", subtitle, compact = false }: Props) {
  const [detail, setDetail] = useState<DisputeDetail | null>(null);
  const [messages, setMessages] = useState<DisputeMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [draft, setDraft] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [expandedMessages, setExpandedMessages] = useState<Record<string, boolean>>({});
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const loadThread = async (showLoader = false) => {
    if (showLoader) setLoading(true);
    try {
      const data = await disputeService.getDetail(disputeUuid);
      setDetail(data);
      setMessages(Array.isArray(data.messages) ? data.messages : []);
    } catch (err: any) {
      setError(err?.message || err?.response?.data?.message || "No se pudo cargar el chat de la disputa.");
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  useEffect(() => {
    loadThread(true);
    const interval = window.setInterval(() => {
      loadThread(false);
    }, 5000);
    return () => window.clearInterval(interval);
  }, [disputeUuid]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, detail]);

  const attachmentPreviews = useMemo(
    () =>
      files.map((file) => ({
        name: file.name,
        isImage: file.type.startsWith("image/"),
      })),
    [files]
  );

  const disputeStatus = String(detail?.dispute?.status ?? "");
  const isClosed = disputeStatus === "closed";

  const pickFiles = () => fileInputRef.current?.click();

  const handleFilesChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const next = Array.from(event.target.files ?? []);
    if (next.length === 0) return;
    setFiles((prev) => [...prev, ...next].slice(0, 10));
    event.target.value = "";
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const toggleMessage = (messageId: string) => {
    setExpandedMessages((prev) => ({
      ...prev,
      [messageId]: !prev[messageId],
    }));
  };

  const handleSend = async () => {
    if (isClosed) {
      setError("La disputa está cerrada y solo permite ver el historial.");
      return;
    }

    const text = draft.trim();
    if (!text && files.length === 0) {
      setError("Escribe un mensaje o adjunta al menos una foto.");
      return;
    }

    setSending(true);
    setError(null);

    try {
      const attachments = files.length
        ? await Promise.all(
            files.map(async (file) => {
              const uploaded = await mediaService.uploadFileToStorageWithUrl(file, false, "evidence");
              return uploaded.publicUrl;
            }),
          )
        : [];

      await disputeService.sendMessage(disputeUuid, {
        message: text || "[Adjunto]",
        attachments,
      });

      setDraft("");
      setFiles([]);
      await loadThread(false);
      await alerts.success("Mensaje enviado", "Se actualizó el hilo de la disputa.");
    } catch (err: any) {
      setError(err?.message || err?.response?.data?.message || "No se pudo enviar el mensaje.");
    } finally {
      setSending(false);
    }
  };

  const isCompact = compact;

  return (
    <div className={`rounded-2xl border border-slate-200 bg-white ${isCompact ? "p-4" : "p-5"}`}>
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <div className="text-xs font-bold tracking-widest text-slate-400 uppercase">{title}</div>
          <div className="text-sm text-slate-500">{subtitle ?? "Mensajes y evidencias compartidas en esta disputa."}</div>
          {isClosed && (
            <div className="mt-2 inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold text-slate-600">
              Caso cerrado: solo lectura
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={() => loadThread(true)}
          className="rounded-full border border-slate-200 p-2 text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition-colors"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      <div className="max-h-[420px] overflow-y-auto space-y-3 pr-1">
        {loading && messages.length === 0 ? (
          <div className="flex items-center justify-center py-10 text-slate-400 text-sm">
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            Cargando chat...
          </div>
        ) : messages.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
            <MessageSquare className="h-8 w-8 mx-auto mb-2 text-slate-300" />
            Todavía no hay mensajes en esta disputa.
          </div>
        ) : (
          messages.map((msg) => {
            const isAdmin = Boolean(msg.isAdminSender);
            const isExpanded = Boolean(expandedMessages[msg._id]);
            const hasAttachments = Array.isArray(msg.attachments) && msg.attachments.length > 0;
            const shouldTruncate = msg.message.length > 140;
            const summaryText = shouldTruncate ? `${msg.message.slice(0, 90).trim()}…` : msg.message;
            return (
              <div key={msg._id} className={`flex ${isAdmin ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm ${isAdmin ? "bg-slate-900 text-white rounded-tr-md" : "bg-slate-50 text-slate-800 border border-slate-200 rounded-tl-md"}`}>
                  <div className="text-[11px] font-semibold uppercase tracking-wide mb-1 opacity-70">
                    {isAdmin ? "Admin" : `${msg.sender?.firstName ?? "Usuario"} ${msg.sender?.lastName ?? ""}`.trim()}
                  </div>
                  <div className={`mb-2 inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest ${isAdmin ? "bg-white/10 text-white" : "bg-slate-100 text-slate-500"}`}>
                    Resumen
                  </div>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">{isExpanded ? msg.message : summaryText}</p>

                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {(shouldTruncate || hasAttachments) && (
                    <button
                      type="button"
                      onClick={() => toggleMessage(msg._id)}
                      className={`mt-2 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                        isAdmin ? "bg-white/10 text-white hover:bg-white/15" : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
                      }`}
                    >
                      {isExpanded ? "Ocultar" : "Ver más"}
                      <span aria-hidden="true">▾</span>
                    </button>
                    )}
                    {hasAttachments && !isExpanded && (
                      <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${isAdmin ? "bg-white/10 text-white" : "bg-slate-100 text-slate-600"}`}>
                        {msg.attachments!.length} foto{msg.attachments!.length === 1 ? "" : "s"}
                      </span>
                    )}
                  </div>

                  {isExpanded && hasAttachments && (
                    <div className="mt-3 space-y-2">
                      <div className={`text-[11px] font-semibold ${isAdmin ? "text-slate-300" : "text-slate-500"}`}>
                        {msg.attachments!.length} adjunto{msg.attachments!.length === 1 ? "" : "s"}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {msg.attachments!.map((attachment) => (
                          <a key={attachment} href={attachment} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-xl border border-white/10 bg-black/10">
                            <img src={attachment} alt="Adjunto de disputa" className="h-28 w-full object-cover" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className={`mt-2 text-[10px] ${isAdmin ? "text-slate-300" : "text-slate-400"}`}>
                    {new Date(msg.createdAt).toLocaleString()}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <div className="mt-4 space-y-3 border-t border-slate-100 pt-4">
        <Textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Escribe tu respuesta..."
          className="min-h-[110px] rounded-2xl border-slate-200 bg-slate-50 resize-none"
          maxLength={2000}
          disabled={isClosed}
        />

        {attachmentPreviews.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {attachmentPreviews.map((file, index) => (
              <div key={`${file.name}-${index}`} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-600">
                <Paperclip className="h-3.5 w-3.5" />
                <span className="max-w-[220px] truncate">{file.name}</span>
                <button type="button" onClick={() => removeFile(index)} className="text-slate-400 hover:text-slate-700">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFilesChange} disabled={isClosed} />
          <Button type="button" variant="secondary" className="bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100" onClick={pickFiles} disabled={sending}>
            <Paperclip className="h-4 w-4 mr-2" />
            Adjuntar fotos
          </Button>
          <Button type="button" onClick={handleSend} disabled={sending || isClosed} className="bg-indigo-600 hover:bg-indigo-700 text-white">
            {sending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
            {isClosed ? "Cerrado" : "Enviar"}
          </Button>
        </div>
      </div>
    </div>
  );
}