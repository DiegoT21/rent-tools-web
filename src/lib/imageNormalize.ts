/**
 * Normaliza fotos de cámara nativa / galería para verificación facial.
 *
 * Las fotos del celular suelen fallar con face-api porque:
 * 1) vienen con EXIF Orientation (aparecen bien en <img> pero el detector ve píxeles rotados)
 * 2) son muy grandes (4K+) y el modelo pierde el rostro pequeño de la cédula
 *
 * La captura por cámara web no tiene EXIF y ya viene a ~1280px, por eso sí funciona.
 */

const MAX_EDGE = 1600;
const JPEG_QUALITY = 0.92;

function canvasToJpegDataUrl(canvas: HTMLCanvasElement): string {
  return canvas.toDataURL("image/jpeg", JPEG_QUALITY);
}

async function bitmapFromBlob(blob: Blob): Promise<ImageBitmap> {
  // imageOrientation: 'from-image' aplica la rotación EXIF al bitmap
  try {
    return await createImageBitmap(blob, { imageOrientation: "from-image" });
  } catch {
    return await createImageBitmap(blob);
  }
}

async function bitmapFromDataUrl(dataUrl: string): Promise<ImageBitmap> {
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  return bitmapFromBlob(blob);
}

function drawScaledBitmap(
  bitmap: ImageBitmap,
  maxEdge = MAX_EDGE,
): HTMLCanvasElement {
  const { width, height } = bitmap;
  const longest = Math.max(width, height);
  const scale = longest > maxEdge ? maxEdge / longest : 1;
  const w = Math.max(1, Math.round(width * scale));
  const h = Math.max(1, Math.round(height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("No se pudo preparar el canvas para normalizar la imagen");
  }
  ctx.drawImage(bitmap, 0, 0, w, h);
  return canvas;
}

/** Normaliza un File (cámara nativa / galería) a data URL JPEG orientada y redimensionada. */
export async function normalizeCaptureFile(file: File): Promise<string> {
  const bitmap = await bitmapFromBlob(file);
  try {
    const canvas = drawScaledBitmap(bitmap);
    return canvasToJpegDataUrl(canvas);
  } finally {
    bitmap.close();
  }
}

/**
 * Normaliza cualquier data URL / blob URL antes de face-api.
 * Seguro de llamar también sobre capturas de cámara web.
 */
export async function normalizeImageSrc(imageSrc: string): Promise<string> {
  if (!imageSrc) return imageSrc;

  // Ya es un JPEG razonable y corto: igual aplicamos EXIF + resize por seguridad
  const bitmap = await bitmapFromDataUrl(imageSrc);
  try {
    const canvas = drawScaledBitmap(bitmap);
    return canvasToJpegDataUrl(canvas);
  } finally {
    bitmap.close();
  }
}
