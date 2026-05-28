import { api } from "@/lib/api";

export interface PublicTool {
  id?: string;
  _id?: string;
  name: string;
  category?: string;
  pricePerDay?: number;
  rating?: number;
  imageUrl?: string;
  images?: string[];
  mediaUrls?: string[];
  isAvailable?: boolean;
}

const normalizeArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === "string" && v.length > 0);
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
    const candidates = [
      tool.imageUrl,
      ...normalizeArray(tool.images),
      ...normalizeArray(tool.mediaUrls),
    ].filter((v): v is string => typeof v === "string" && v.length > 0);

    return candidates[0] ?? null;
  },

  getToolId: (tool: PublicTool): string => {
    return String(tool.id ?? tool._id ?? "");
  },
};
