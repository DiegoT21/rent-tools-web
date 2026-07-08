import { api } from "@/lib/api";

export type DisputeReason = "damage" | "non_return" | "late_return" | "wrong_item" | "payment_issue" | "other";

export interface DisputeUserRef {
  uuid: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  role?: string;
}

export interface DisputeMessage {
  _id: string;
  sender: DisputeUserRef;
  isAdminSender: boolean;
  message: string;
  attachments?: string[];
  createdAt: string;
}

export interface DisputeDetail {
  dispute: {
    uuid: string;
    reason: DisputeReason | string;
    description: string;
    status: string;
    resolution?: string;
    resolvedAt?: string;
    reportedBy?: DisputeUserRef;
    against?: DisputeUserRef;
    rental?: { uuid?: string; startDate?: string; endDate?: string; status?: string };
    createdAt?: string;
  };
  messages: DisputeMessage[];
  evidences?: {
    delivery?: Array<Record<string, any>>;
    return?: Array<Record<string, any>>;
  };
}

export const disputeReasonOptions: Array<{ value: DisputeReason; label: string }> = [
  { value: "damage", label: "Daño en la herramienta" },
  { value: "non_return", label: "No devolución" },
  { value: "late_return", label: "Devolución tardía" },
  { value: "wrong_item", label: "Artículo incorrecto" },
  { value: "payment_issue", label: "Problema de pago" },
  { value: "other", label: "Otro" },
];

type CreateDisputeInput = {
  rentalUuid?: string;
  requestUuid?: string;
  contractUuid?: string;
  reason: DisputeReason;
  description: string;
  evidenceImages: string[];
};

const unwrap = (response: any) => response?.data?.data ?? response?.data;

const describeDisputeApiError = (error: any, fallbackMessage: string): string => {
  const status = error?.response?.status;
  const method = String(error?.config?.method ?? 'request').toUpperCase();
  const url = String(error?.config?.url ?? '/disputes');
  const backendMessage = error?.response?.data?.message;
  const backendStatus = error?.response?.data?.status;

  const parts = [fallbackMessage];
  if (status) parts.push(`HTTP ${status}`);
  if (method || url) parts.push(`${method} ${url}`);
  if (backendStatus && backendStatus !== status) parts.push(`backend=${backendStatus}`);
  if (backendMessage && backendMessage !== fallbackMessage) parts.push(String(backendMessage));

  return parts.join(' · ');
};

export const disputeService = {
  create: async (payload: CreateDisputeInput) => {
    try {
      const response = await api.post("/disputes", payload);
      return unwrap(response);
    } catch (error: any) {
      throw new Error(describeDisputeApiError(error, 'No se pudo crear la disputa'));
    }
  },

  listMine: async () => {
    try {
      const response = await api.get("/disputes/my");
      return unwrap(response);
    } catch (error: any) {
      throw new Error(describeDisputeApiError(error, 'No se pudieron cargar tus disputas'));
    }
  },

  getDetail: async (uuid: string): Promise<DisputeDetail> => {
    try {
      const response = await api.get(`/disputes/${encodeURIComponent(uuid)}`);
      return unwrap(response) as DisputeDetail;
    } catch (error: any) {
      throw new Error(describeDisputeApiError(error, 'No se pudo cargar el detalle de la disputa'));
    }
  },

  getMessages: async (uuid: string): Promise<DisputeMessage[]> => {
    try {
      const response = await api.get(`/disputes/${encodeURIComponent(uuid)}/messages`);
      return (unwrap(response) ?? []) as DisputeMessage[];
    } catch (error: any) {
      throw new Error(describeDisputeApiError(error, 'No se pudieron cargar los mensajes de la disputa'));
    }
  },

  sendMessage: async (uuid: string, payload: { message: string; attachments?: string[] }) => {
    try {
      const response = await api.post(`/disputes/${encodeURIComponent(uuid)}/messages`, payload);
      return unwrap(response) as DisputeMessage;
    } catch (error: any) {
      throw new Error(describeDisputeApiError(error, 'No se pudo enviar el mensaje de la disputa'));
    }
  },
};

export { describeDisputeApiError };