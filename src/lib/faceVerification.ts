const MODEL_URL =
  "https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.15/model";

/** Distancia euclidiana máxima para considerar la misma persona (menor = más estricto). */
const MATCH_THRESHOLD = 0.55;

/** En una selfie real el rostro ocupa buena parte del encuadre. */
const MIN_SELFIE_FACE_AREA_RATIO = 0.1;

/** En la cédula el rostro es pequeño respecto a toda la foto. */
const MAX_DOCUMENT_FACE_AREA_RATIO = 0.28;
const MIN_DOCUMENT_FACE_AREA_RATIO = 0.003;

/** La selfie debe mostrar el rostro mucho más grande que en la foto del documento. */
const MIN_SELFIE_TO_DOCUMENT_FACE_SCALE = 2.5;

type FaceApiModule = typeof import("@vladmandic/face-api");
type FaceDetection = Awaited<ReturnType<typeof getFaceDescriptor>>;

let faceApiModule: FaceApiModule | null = null;
let modelsLoading: Promise<void> | null = null;

async function getFaceApi(): Promise<FaceApiModule> {
  if (!faceApiModule) {
    faceApiModule = await import("@vladmandic/face-api");
  }
  return faceApiModule;
}

async function loadModels(): Promise<void> {
  if (modelsLoading) return modelsLoading;

  modelsLoading = (async () => {
    const faceapi = await getFaceApi();
    await Promise.all([
      faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
      faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
    ]);
  })();

  return modelsLoading;
}

function loadImage(imageSrc: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    if (!imageSrc.startsWith("data:")) {
      img.crossOrigin = "anonymous";
    }
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("No se pudo cargar la imagen"));
    img.src = imageSrc;
  });
}

function stripDataUrl(imageSrc: string): string {
  return imageSrc.replace(/^data:image\/\w+;base64,/, "");
}

function imagesAreLikelySame(documentImage: string, selfieImage: string): boolean {
  if (documentImage === selfieImage) return true;

  const docPayload = stripDataUrl(documentImage);
  const selfiePayload = stripDataUrl(selfieImage);

  if (docPayload === selfiePayload) return true;

  const lengthDelta = Math.abs(docPayload.length - selfiePayload.length);
  const shorter = Math.min(docPayload.length, selfiePayload.length);
  if (shorter === 0) return false;

  if (lengthDelta / shorter <= 0.02) {
    const sampleSize = Math.min(800, docPayload.length, selfiePayload.length);
    let matches = 0;
    for (let i = 0; i < sampleSize; i += 1) {
      if (docPayload[i] === selfiePayload[i]) matches += 1;
    }
    if (matches / sampleSize >= 0.98) return true;
  }

  return false;
}

function getFaceAreaRatio(
  face: NonNullable<FaceDetection>,
  img: HTMLImageElement
): number {
  const imageArea = img.width * img.height;
  if (imageArea <= 0) return 0;
  return face.detection.box.area / imageArea;
}

async function getFaceDescriptor(imageSrc: string) {
  const faceapi = await getFaceApi();
  await loadModels();
  const img = await loadImage(imageSrc);

  const detections = await faceapi
    .detectAllFaces(img, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.4 }))
    .withFaceLandmarks()
    .withFaceDescriptors();

  if (detections.length === 0) {
    return null;
  }

  return detections.reduce((largest, current) =>
    current.detection.box.area > largest.detection.box.area ? current : largest
  );
}

export interface FaceComparisonResult {
  verified: boolean;
  distance: number;
  similarityPercent: number;
  message: string;
}

function rejectComparison(message: string): FaceComparisonResult {
  return {
    verified: false,
    distance: 1,
    similarityPercent: 0,
    message,
  };
}

export async function detectFaceInImage(
  imageSrc: string
): Promise<{ found: boolean; message: string }> {
  try {
    const face = await getFaceDescriptor(imageSrc);
    if (!face) {
      return {
        found: false,
        message:
          "No se detectó un rostro en la imagen. Asegúrate de que la foto de la cédula muestre claramente tu rostro.",
      };
    }

    const img = await loadImage(imageSrc);
    const faceRatio = getFaceAreaRatio(face, img);

    if (faceRatio > MAX_DOCUMENT_FACE_AREA_RATIO) {
      return {
        found: false,
        message:
          "Esta imagen parece una selfie, no una cédula. Fotografía el documento completo sobre una superficie plana.",
      };
    }

    if (faceRatio < MIN_DOCUMENT_FACE_AREA_RATIO) {
      return {
        found: false,
        message:
          "El rostro en la cédula se ve muy pequeño. Acércate más al documento para que se lea claramente.",
      };
    }

    return { found: true, message: "Rostro detectado en el documento." };
  } catch (error) {
    console.error("Error detectando rostro:", error);
    return {
      found: false,
      message:
        "No se pudo analizar la imagen del documento. Intenta con mejor iluminación.",
    };
  }
}

export async function validateSelfieImage(
  imageSrc: string
): Promise<{ valid: boolean; message: string }> {
  try {
    const face = await getFaceDescriptor(imageSrc);
    if (!face) {
      return {
        valid: false,
        message:
          "No se detectó tu rostro. Toma una selfie en vivo con el rostro centrado y bien iluminado.",
      };
    }

    const img = await loadImage(imageSrc);
    const faceRatio = getFaceAreaRatio(face, img);

    if (faceRatio < MIN_SELFIE_FACE_AREA_RATIO) {
      return {
        valid: false,
        message:
          "Esto no parece una selfie. El rostro debe verse grande y de cerca. No uses otra foto de tu cédula en este paso.",
      };
    }

    return {
      valid: true,
      message: "Selfie válida para verificación.",
    };
  } catch (error) {
    console.error("Error validando selfie:", error);
    return {
      valid: false,
      message: "No se pudo analizar la selfie. Intenta de nuevo.",
    };
  }
}

export async function compareFaces(
  documentImage: string,
  selfieImage: string
): Promise<FaceComparisonResult> {
  if (imagesAreLikelySame(documentImage, selfieImage)) {
    return rejectComparison(
      "La selfie no puede ser la misma imagen que la cédula. En el paso 3 debes tomarte una foto en vivo, no reutilizar el documento."
    );
  }

  const documentFace = await getFaceDescriptor(documentImage);
  if (!documentFace) {
    return rejectComparison(
      "No se detectó un rostro en la foto de la cédula. Toma otra foto donde se vea claramente tu rostro."
    );
  }

  const selfieFace = await getFaceDescriptor(selfieImage);
  if (!selfieFace) {
    return rejectComparison(
      "No se detectó tu rostro en la selfie. Retira gorras o lentes oscuros e intenta de nuevo."
    );
  }

  const selfieImg = await loadImage(selfieImage);

  const selfieFaceRatio = getFaceAreaRatio(selfieFace, selfieImg);
  const faceScaleRatio =
    selfieFace.detection.box.area / documentFace.detection.box.area;

  if (selfieFaceRatio < MIN_SELFIE_FACE_AREA_RATIO) {
    return rejectComparison(
      "La imagen del paso 3 no es una selfie válida. Debes tomarte una foto en vivo con tu rostro grande y centrado; no subas otra foto de la cédula."
    );
  }

  if (faceScaleRatio < MIN_SELFIE_TO_DOCUMENT_FACE_SCALE) {
    return rejectComparison(
      "La foto del paso 3 parece otro documento o una foto impresa, no una selfie en vivo. Acércate a la cámara y muestra solo tu rostro."
    );
  }

  const faceapi = await getFaceApi();
  const distance = faceapi.euclideanDistance(
    documentFace.descriptor,
    selfieFace.descriptor
  );
  const similarityPercent = Math.round(Math.max(0, (1 - distance) * 100));
  const verified = distance < MATCH_THRESHOLD;

  if (!verified) {
    return {
      verified: false,
      distance,
      similarityPercent,
      message: `Los rostros no coinciden (${similarityPercent}% de similitud). Debes tomar la selfie tú mismo; la persona de la cédula debe ser quien se registra.`,
    };
  }

  return {
    verified: true,
    distance,
    similarityPercent,
    message: `Identidad verificada. Coincidencia del ${similarityPercent}%.`,
  };
}
