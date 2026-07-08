import { api } from "@/lib/api";
import type { PublicTool } from "./toolService";

export const favoriteService = {
  list: async (): Promise<PublicTool[]> => {
    const response = await api.get("/favorites");
    const data = response.data?.data ?? response.data;
    return Array.isArray(data) ? (data as PublicTool[]) : [];
  },

  listIds: async (): Promise<string[]> => {
    const response = await api.get("/favorites/ids");
    const data = response.data?.data ?? response.data;
    return Array.isArray(data) ? (data as string[]) : [];
  },

  add: async (toolUuid: string): Promise<void> => {
    await api.post(`/favorites/${encodeURIComponent(toolUuid)}`);
  },

  remove: async (toolUuid: string): Promise<void> => {
    await api.delete(`/favorites/${encodeURIComponent(toolUuid)}`);
  },
};
