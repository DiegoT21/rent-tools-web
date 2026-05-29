import { api } from "@/lib/api";

export type ContractStatus =
  | "pending_signatures"
  | "signed"
  | "owner_evidence_pending"
  | "payment_pending"
  | "ready_for_handover"
  | "in_progress"
  | "completed"
  | "cancelled";

export interface RentalContract {
  uuid: string;
  requestUuid?: string;
  toolUuid?: string;
  tool?: { uuid?: string; name?: string; imageUrls?: string[]; pricePerDay?: number; depositAmount?: number };
  ownerUuid?: string;
  tenantUuid?: string;
  startDate?: string;
  endDate?: string;
  pickup?: { lat?: number; lng?: number; addressLabel?: string; notes?: string; pickupAt?: string };
  pricing?: { pricePerDay?: number; depositAmount?: number; totalDays?: number; totalAmountEstimated?: number };
  status: ContractStatus | string;
  ownerSignature?: { accepted?: boolean; acceptedAt?: string };
  tenantSignature?: { accepted?: boolean; acceptedAt?: string };
  ownerEvidence?: { photosBeforeHandover?: string[]; uploadedAt?: string };
  payment?: { holdStatus?: string; paymentPlan?: string; paidStatus?: string };
}

export interface TimelineEvent {
  uuid: string;
  actor: "tenant" | "owner" | "system" | string;
  type: string;
  entity: "request" | "contract" | string;
  entityUuid: string;
  payload: Record<string, any>;
  createdAt: string;
  updatedAt?: string;
}

const unwrap = (response: any) => response?.data?.data ?? response?.data;

export const contractService = {
  getByUuid: async (uuid: string): Promise<RentalContract | null> => {
    const response = await api.get(`/rentals/contracts/${encodeURIComponent(uuid)}`);
    const data = unwrap(response);
    if (data && typeof data === "object") return data as RentalContract;
    return null;
  },

  getByRequest: async (requestUuid: string): Promise<RentalContract | null> => {
    const response = await api.get(`/rentals/contracts/by-request/${encodeURIComponent(requestUuid)}`);
    const data = unwrap(response);
    if (data && typeof data === "object") return data as RentalContract;
    return null;
  },

  getTimeline: async (opts: { requestUuid?: string; contractUuid?: string }) => {
    const response = await api.get("/rentals/timeline", { params: opts });
    const data = unwrap(response);
    return {
      currentStatus: String(data?.currentStatus ?? ""),
      events: (Array.isArray(data?.events) ? data.events : []) as TimelineEvent[],
    };
  },

  uploadEvidenceBeforeHandover: async (contractUuid: string, photoUrls: string[]) => {
    const response = await api.post(`/rentals/contracts/${encodeURIComponent(contractUuid)}/evidence/before-handover`, {
      photoUrls,
    });
    return unwrap(response);
  },

  paymentHold: async (contractUuid: string, paymentPlan: "one_time" | "two_payments") => {
    const response = await api.post(`/rentals/contracts/${encodeURIComponent(contractUuid)}/payment/hold`, {
      paymentPlan,
    });
    return unwrap(response);
  },

  sign: async (contractUuid: string, body: { actor: "tenant" | "owner"; phase: "handover" | "return"; signatureToken: string }) => {
    const response = await api.post(`/rentals/contracts/${encodeURIComponent(contractUuid)}/sign`, body);
    return unwrap(response);
  },
};

