import { api } from "@/lib/api";
import { compareFaces, type FaceComparisonResult } from "@/lib/faceVerification";

export interface VerifyIdentityResult extends FaceComparisonResult {
  source: "backend" | "client";
}

async function verifyWithBackend(
  documentImage: string,
  selfieImage: string
): Promise<VerifyIdentityResult | null> {
  try {
    const response = await api.post("/verification/verify-identity", {
      documentImage,
      selfieImage,
    });

    const payload = response.data?.data ?? response.data;
    if (typeof payload?.verified === "boolean") {
      return {
        verified: payload.verified,
        distance: payload.distance ?? (payload.verified ? 0.4 : 0.8),
        similarityPercent:
          payload.similarityPercent ??
          payload.similarity ??
          (payload.verified ? 85 : 30),
        message:
          payload.message ??
          (payload.verified
            ? "Identidad verificada con éxito."
            : "Los rostros no coinciden."),
        source: "backend",
      };
    }
  } catch (error: unknown) {
    const status = (error as { response?: { status?: number } })?.response?.status;
    // Backend sin endpoint o sin Python/biometría disponible → verificación en el navegador
    if (status === 404 || status === 501 || status === 500 || status === 503) {
      return null;
    }
    // Rechazo explícito del algoritmo (400: rostros no detectados, etc.)
    const message =
      (error as { response?: { data?: { message?: string } } })?.response?.data
        ?.message ?? null;
    if (message) {
      return {
        verified: false,
        distance: 1,
        similarityPercent: 0,
        message,
        source: "backend",
      };
    }
  }

  return null;
}

export async function verifyIdentity(
  documentImage: string,
  selfieImage: string
): Promise<VerifyIdentityResult> {
  const clientResult = await compareFaces(documentImage, selfieImage);
  if (!clientResult.verified) {
    return { ...clientResult, source: "client" };
  }

  const backendResult = await verifyWithBackend(documentImage, selfieImage);
  if (backendResult) {
    return backendResult;
  }

  try {
    await api.post("/verification/confirm-client-verification");
  } catch {
    // Si falla, la UI sigue; en dev el perfil puede quedar sin marcar en BD
  }

  return { ...clientResult, source: "client" };
}

export const REGISTRATION_DOCUMENT_KEY = "register_document_image";

export function saveRegistrationDocument(image: string) {
  sessionStorage.setItem(REGISTRATION_DOCUMENT_KEY, image);
}

export function getRegistrationDocument(): string | null {
  return sessionStorage.getItem(REGISTRATION_DOCUMENT_KEY);
}

export function clearRegistrationDocument() {
  sessionStorage.removeItem(REGISTRATION_DOCUMENT_KEY);
}
