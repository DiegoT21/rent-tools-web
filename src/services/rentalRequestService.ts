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
  _id?: string;
  uuid: string;
  toolUuid?: string;
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
  pickup?: {
    lat?: number;
    lng?: number;
    addressLabel?: string;
    notes?: string;
    pickupAt?: string;
  };
  pickupProposal?: {
    lat?: number;
    lng?: number;
    addressLabel?: string;
    notes?: string;
    pickupAt?: string;
  };
  pickupCounterProposal?: {
    lat?: number;
    lng?: number;
    addressLabel?: string;
    notes?: string;
    pickupAt?: string;
  };
  contract?: { uuid?: string };
  contractUuid?: string;
  status: RentalRequestStatusValue;
  rejectionReason?: string;
  createdAt?: string;
}

const unwrap = (response: any) => response?.data?.data ?? response?.data;

const isNotFound = (e: any) => e?.response?.status === 404;

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

  act: async (
    uuid: string,
    body:
      | { action: "counter_propose"; pickup: { lat?: number; lng?: number; addressLabel: string; notes?: string; pickupAt: string } }
      | { action: "accept_counter" }
      | { action: "cancel" }
      | { action: "approve" }
      | { action: "reject"; rejectionReason?: string }
  ) => {
    try {
      const response = await api.patch(`/rentals/requests/${encodeURIComponent(uuid)}`, body);
      return unwrap(response);
    } catch (e: any) {
      if (isNotFound(e) && (body as any)?._fallbackId) {
        const fallbackId = String((body as any)._fallbackId);
        const cloned = { ...(body as any) };
        delete cloned._fallbackId;
        const response = await api.patch(`/rentals/requests/${encodeURIComponent(fallbackId)}`, cloned);
        return unwrap(response);
      }
      throw e;
    }
  },

  getIdentifier: (req: { uuid?: string; _id?: string }) => String(req?.uuid || req?._id || ""),
};
