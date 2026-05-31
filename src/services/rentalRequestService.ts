import { api } from "@/lib/api";

export type RentalRequestStatus =
  | { hasPending: false }
  | { hasPending: true; requestUuid: string };

export interface CreateRentalRequestBody {
  toolUuid: string;
  startDate: string; // ISO
  endDate: string; // ISO
  message?: string;
  pickup?: {
    addressLabel: string;
    pickupAt: string; // ISO
    lat?: number;
    lng?: number;
    notes?: string;
  };
}

export type RentalRequestStatusValue =
  | "pending"
  | "approved"
  | "rejected"
  | "cancelled"
  | "pending_owner"
  | "pending_tenant";

export interface RentalRequestListItem {
  _id?: string;
  uuid: string;
  toolUuid?: string;
  ownerUuid?: string;
  tenantUuid?: string;
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
  dateCounterProposal?: {
    startDate?: string;
    endDate?: string;
  };
  contract?: { uuid?: string };
  contractUuid?: string;
  status: RentalRequestStatusValue;
  rejectionReason?: string;
  createdAt?: string;
  _source?: "rentalrequests" | "rentals_legacy" | string;
}

const unwrap = (response: any) => response?.data?.data ?? response?.data;

const isNotFound = (e: any) => e?.response?.status === 404;

const normalizeStatus = (value: unknown): RentalRequestStatusValue => {
  const s = String(value ?? "").toLowerCase();
  if (s === "pending_owner" || s === "pending_tenant") return s as any;
  if (s === "approved" || s === "rejected" || s === "cancelled") return s as any;
  if (s === "pending") return "pending";
  return "pending";
};

const normalizeListPayload = (payload: any) => {
  const data = payload?.data?.data ?? payload?.data ?? payload;
  const items = Array.isArray(data) ? data : Array.isArray(data?.items) ? data.items : [];
  const pagination = payload?.data?.pagination ?? payload?.pagination ?? null;
  return { items, pagination };
};

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

  getReceived: async (page = 1, status: "pending" | "approved" | "all" = "pending") => {
    const params: any = { page };
    if (status && status !== "pending") params.status = status;
    const response = await api.get("/rentals/requests/received", { params });
    const { items, pagination } = normalizeListPayload(response);
    return { data: items as RentalRequestListItem[], pagination };
  },

  getSent: async (page = 1, status: "pending" | "approved" | "all" = "pending") => {
    const params: any = { page };
    if (status && status !== "pending") params.status = status;
    const response = await api.get("/rentals/requests/sent", { params });
    const { items, pagination } = normalizeListPayload(response);
    return { data: items as RentalRequestListItem[], pagination };
  },

  updateStatus: async (uuid: string, body: { status: "approved" } | { status: "rejected"; rejectionReason?: string }) => {
    const response = await api.patch(`/rentals/requests/${encodeURIComponent(uuid)}`, body);
    return unwrap(response);
  },

  act: async (
    uuid: string,
    body:
      | {
          action: "counter_propose";
          pickup: { lat?: number; lng?: number; addressLabel: string; notes?: string; pickupAt: string };
          dates?: { startDate: string; endDate: string };
        }
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

  normalizeForUi: (raw: any): RentalRequestListItem => {
    const tool = raw?.tool ?? {};
    const normalized: RentalRequestListItem = {
      _id: raw?._id,
      uuid: String(raw?.uuid ?? raw?.requestUuid ?? raw?._id ?? ""),
      toolUuid: String(raw?.toolUuid ?? tool?.uuid ?? raw?.tool?._id ?? ""),
      ownerUuid: raw?.ownerUuid ? String(raw.ownerUuid) : undefined,
      tenantUuid: raw?.tenantUuid ? String(raw.tenantUuid) : undefined,
      tool: {
        uuid: String(tool?.uuid ?? tool?._id ?? raw?.toolUuid ?? ""),
        name: String(tool?.name ?? "Herramienta"),
        category: tool?.category,
        pricePerDay: tool?.pricePerDay,
        imageUrls: Array.isArray(tool?.imageUrls) ? tool.imageUrls : undefined,
      },
      tenant: raw?.tenant ?? undefined,
      renter: raw?.renter ?? undefined,
      owner: raw?.owner ?? undefined,
      startDate: raw?.startDate ?? raw?.fromDate,
      endDate: raw?.endDate ?? raw?.toDate,
      fromDate: raw?.fromDate ?? undefined,
      toDate: raw?.toDate ?? undefined,
      message: raw?.message,
      pickup: raw?.pickup,
      pickupProposal: raw?.pickupProposal ?? raw?.pickup,
      pickupCounterProposal: raw?.pickupCounterProposal ?? undefined,
      dateCounterProposal: raw?.dateCounterProposal ?? undefined,
      contract: raw?.contract,
      contractUuid: raw?.contractUuid ?? raw?.contract?.uuid,
      status: normalizeStatus(raw?.status),
      rejectionReason: raw?.rejectionReason,
      createdAt: raw?.createdAt,
      _source: raw?._source,
    };
    return normalized;
  },
};
