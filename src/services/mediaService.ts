import { getUploadUrlAndKey, uploadFileToStorage, uploadFileToStorageWithUrl, uploadToPresignedUrl } from '@/lib/mediaUpload';

const mediaBaseUrl =
  (import.meta as any).env?.VITE_MEDIA_PUBLIC_BASE_URL ||
  (import.meta as any).env?.VITE_S3_PUBLIC_BASE_URL ||
  "";

const defaultPublicBaseUrl = "https://renttools-inventario-publico.s3.us-east-2.amazonaws.com";

const isAbsoluteUrl = (value: string) => /^https?:\/\//i.test(value);

const resolveMaybeKeyToUrl = (value: string): string => {
  if (isAbsoluteUrl(value)) return value;
  const base = String(mediaBaseUrl || defaultPublicBaseUrl).replace(/\/+$/, "");
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
  getUploadUrlAndKey,
  uploadToPresignedUrl,
  uploadFileToStorage,
  uploadFileToStorageWithUrl,
  resolvePublicUrl: (value: string): string => resolveMaybeKeyToUrl(value),
};
