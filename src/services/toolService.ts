import { api } from "@/lib/api";

export interface PublicTool {
  id?: string;
  _id?: string;
  uuid?: string;
  name: string;
  category?: string;
  pricePerDay?: number;
  rating?: number;
  imageUrl?: string;
  imageUrls?: string[];
  images?: string[];
  mediaUrls?: string[];
  fileKeys?: string[];
  photos?: string[];
  coverUrl?: string;
  thumbnailUrl?: string;
  isAvailable?: boolean;
}

const normalizeArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === "string" && v.length > 0);
};

const mediaBaseUrl =
  (import.meta as any).env?.VITE_MEDIA_PUBLIC_BASE_URL ||
  (import.meta as any).env?.VITE_S3_PUBLIC_BASE_URL ||
  "";

const isAbsoluteUrl = (value: string) => /^https?:\/\//i.test(value);

const resolveMaybeKeyToUrl = (value: string): string | null => {
  if (!value) return null;
  if (isAbsoluteUrl(value)) return value;
  if (!mediaBaseUrl) return null;

  const base = String(mediaBaseUrl).replace(/\/+$/, "");
  const path = value.replace(/^\/+/, "");
  return `${base}/${path}`;
};

export const toolService = {
  getPublicTools: async (): Promise<PublicTool[]> => {
    const response = await api.get("/tools");
    const data = (response as any).data?.data ?? (response as any).data;
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.items)) return data.items;
    if (Array.isArray(data?.tools)) return data.tools;
    return [];
  },

  getToolCoverImage: (tool: PublicTool): string | null => {
    const rawCandidates = [
      tool.coverUrl,
      tool.thumbnailUrl,
      tool.imageUrl,
      ...normalizeArray(tool.imageUrls),
      ...normalizeArray(tool.photos),
      ...normalizeArray(tool.images),
      ...normalizeArray(tool.mediaUrls),
      ...normalizeArray(tool.fileKeys),
    ].filter((v): v is string => typeof v === "string" && v.length > 0);

    for (const raw of rawCandidates) {
      const resolved = resolveMaybeKeyToUrl(raw);
      if (resolved) return resolved;
    }

    return null;
  },

  getToolId: (tool: PublicTool): string => {
    return String(tool.uuid ?? tool.id ?? tool._id ?? "");
  },
};
