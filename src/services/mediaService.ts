import { api } from "@/lib/api";

const mediaBaseUrl =
  (import.meta as any).env?.VITE_MEDIA_PUBLIC_BASE_URL ||
  (import.meta as any).env?.VITE_S3_PUBLIC_BASE_URL ||
  "";

const isAbsoluteUrl = (value: string) => /^https?:\/\//i.test(value);

const resolveMaybeKeyToUrl = (value: string): string => {
  if (isAbsoluteUrl(value)) return value;
  const base = String(mediaBaseUrl || "").replace(/\/+$/, "");
  const path = value.replace(/^\/+/, "");
  return base ? `${base}/${path}` : value;
};

export type PresignedUpload = {
  uploadUrl: string;
  method: "PUT" | "POST";
  fields: Record<string, string> | null;
  fileKey: string;
  publicUrl: string;
};

export const mediaService = {
  getUploadUrlAndKey: async (file: File, isPrivate: boolean): Promise<PresignedUpload> => {
    const response = await api.post("/media/upload-url", {
      fileName: file.name,
      contentType: file.type || "application/octet-stream",
      isPrivate,
    });

    const data = (response as any).data?.data ?? (response as any).data;
    const uploadUrl = data?.uploadUrl ?? data?.url ?? data?.signedUrl;
    const fileKey = data?.fileKey ?? data?.key;
    const method = (data?.method ?? (data?.fields ? "POST" : "PUT")) as "PUT" | "POST";
    const fields = (data?.fields ?? null) as Record<string, string> | null;
    const publicUrl = String(data?.publicUrl ?? data?.fileUrl ?? resolveMaybeKeyToUrl(String(fileKey ?? "")));

    if (!uploadUrl || !fileKey) {
      throw new Error("Respuesta inválida de /media/upload-url (faltan uploadUrl o fileKey).");
    }

    return { uploadUrl: String(uploadUrl), fileKey: String(fileKey), method, fields, publicUrl };
  },

  uploadToPresignedUrl: async (signed: { uploadUrl: string; method: "PUT" | "POST"; fields: Record<string, string> | null }, file: File) => {
    if (signed.method === "POST" && signed.fields) {
      const form = new FormData();
      for (const [k, v] of Object.entries(signed.fields)) form.append(k, v);
      form.append("file", file);

      const res = await fetch(signed.uploadUrl, { method: "POST", body: form });
      if (!res.ok) {
        const body = await res.text().catch(() => "");
        throw new Error(`Falló la subida (POST) (HTTP ${res.status}) ${body}`.trim());
      }
      return;
    }

    const res = await fetch(signed.uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": file.type || "application/octet-stream" },
      body: file,
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`Falló la subida (PUT) (HTTP ${res.status}) ${body}`.trim());
    }
  },
};

