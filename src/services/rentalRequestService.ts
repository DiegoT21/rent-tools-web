import { api } from "@/lib/api";

export type RentalRequestStatus =
  | { hasPending: false }
  | { hasPending: true; requestUuid: string };

export interface CreateRentalRequestBody {
  toolUuid: string;
  fromDate: string; // YYYY-MM-DD
  toDate: string; // YYYY-MM-DD
  message?: string;
}

export type RentalRequestStatusValue = "pending" | "approved" | "rejected";

export interface RentalRequestListItem {
  uuid: string;
  tool: {
    uuid: string;
    name: string;
    category?: string;
    pricePerDay?: number;
    imageUrls?: string[];
  };
  tenant?: {
    uuid?: string;
    _id?: string;
    id?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    name?: string;
  };
  renter?: {
    uuid?: string;
    _id?: string;
    id?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    name?: string;
  };
  owner?: any;
  startDate?: string;
  endDate?: string;
  fromDate?: string;
  toDate?: string;
  message?: string;
  status: RentalRequestStatusValue;
  rejectionReason?: string;
  createdAt?: string;
}

const unwrap = (response: any) => response?.data?.data ?? response?.data;

export const rentalRequestService = {
  getStatus: async (toolUuid: string): Promise<RentalRequestStatus> => {
    const response = await api.get("/rentals/requests/status", { params: { toolUuid } });
    const data = unwrap(response);
    if (data?.hasPending) return { hasPending: true, requestUuid: String(data.requestUuid ?? "") };
    return { hasPending: false };
  },

  create: async (body: CreateRentalRequestBody) => {
    const response = await api.post("/rentals/requests", body);
    return unwrap(response);
  },

  getReceived: async (page = 1) => {
    const response = await api.get("/rentals/requests/received", { params: { page } });
    const payload = response?.data;
    return {
      data: (Array.isArray(payload?.data) ? payload.data : []) as RentalRequestListItem[],
      pagination: payload?.pagination ?? null,
    };
  },

  getSent: async (page = 1) => {
    const response = await api.get("/rentals/requests/sent", { params: { page } });
    const payload = response?.data;
    return {
      data: (Array.isArray(payload?.data) ? payload.data : []) as RentalRequestListItem[],
      pagination: payload?.pagination ?? null,
    };
  },

  updateStatus: async (uuid: string, body: { status: "approved" } | { status: "rejected"; rejectionReason?: string }) => {
    const response = await api.patch(`/rentals/requests/${encodeURIComponent(uuid)}`, body);
    return unwrap(response);
  },
};
