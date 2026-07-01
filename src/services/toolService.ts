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
  pricingSummary?: {
    totalDays?: number;
    subtotal?: number;
    hold?: number;
    totalEstimated?: number;
  };
  meetingLocations?: Array<{
    label?: string;
    address?: string;
    lat?: number;
    lng?: number;
    notes?: string;
  }>;
}

export interface ToolBookingRange {
  startDate: string;
  endDate: string;
  status: string;
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

  getToolByUuid: async (uuid: string): Promise<PublicTool | null> => {
    if (!uuid) return null;
    const response = await api.get(`/tools/${encodeURIComponent(uuid)}`);
    const data = (response as any).data?.data ?? (response as any).data;
    if (data && typeof data === "object") return data as PublicTool;
    return null;
  },

  getPopularTools: async (days = 7, limit = 8): Promise<PublicTool[]> => {
    const response = await api.get("/tools/popular", { params: { days, limit } });
    const data = (response as any).data?.data ?? (response as any).data;
    if (Array.isArray(data)) return data;
    return [];
  },

  getBookings: async (toolUuid: string, fromIso: string, toIso: string): Promise<ToolBookingRange[]> => {
    const response = await api.get(`/tools/${encodeURIComponent(toolUuid)}/bookings`, {
      params: { from: fromIso, to: toIso },
    });
    const data = (response as any).data?.data ?? (response as any).data;
    return Array.isArray(data) ? (data as ToolBookingRange[]) : [];
  },

  getToolImages: (tool: PublicTool, limit = 3): string[] => {
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

    const unique: string[] = [];
    const seen = new Set<string>();
    for (const raw of rawCandidates) {
      const resolved = resolveMaybeKeyToUrl(raw);
      if (!resolved) continue;
      if (seen.has(resolved)) continue;
      seen.add(resolved);
      unique.push(resolved);
      if (unique.length >= limit) break;
    }
    return unique;
  },

  getToolCoverImage: (tool: PublicTool): string | null => {
    return toolService.getToolImages(tool, 1)[0] ?? null;
  },

  getToolId: (tool: PublicTool): string => {
    return String(tool.uuid ?? tool.id ?? tool._id ?? "");
  },
};
