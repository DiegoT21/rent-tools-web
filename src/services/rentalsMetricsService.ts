import { api } from "@/lib/api";

export interface OwnerRentalMetrics {
  month: string; // YYYY-MM
  incomeMonth: number;
  activeRentals: number;
  completedRentals: number;
}

const unwrap = (response: any) => response?.data?.data ?? response?.data;

export const rentalsMetricsService = {
  getOwnerMetrics: async (month?: string): Promise<OwnerRentalMetrics> => {
    const response = await api.get("/rentals/metrics/owner", { params: month ? { month } : undefined });
    const data = unwrap(response);
    return {
      month: String(data?.month ?? month ?? ""),
      incomeMonth: Number(data?.incomeMonth ?? 0),
      activeRentals: Number(data?.activeRentals ?? 0),
      completedRentals: Number(data?.completedRentals ?? 0),
    };
  },
};

