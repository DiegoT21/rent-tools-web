import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./dialog";
import { WebcamCapture } from "./WebcamCapture";

export async function dataUrlToFile(
  dataUrl: string,
  filename = "photo.jpg"
): Promise<File> {
  const response = await fetch(dataUrl);
  const blob = await response.blob();
  return new File([blob], filename, { type: blob.type || "image/jpeg" });
}

interface PhotoCaptureDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCapture: (imageSrc: string, file?: File) => void;
  overlayType?: "document" | "face" | "general";
  hint?: string;
  title?: string;
  description?: string;
}

export function PhotoCaptureDialog({
  open,
  onOpenChange,
  onCapture,
  overlayType = "general",
  hint,
  title = "Tomar o subir foto",
  description = "Elige cómo quieres capturar la imagen: cámara web, cámara del dispositivo o galería.",
}: PhotoCaptureDialogProps) {
  const [sessionKey, setSessionKey] = useState(0);

  const handleCapture = (imageSrc: string, file?: File) => {
    onCapture(imageSrc, file);
    onOpenChange(false);
    setSessionKey((key) => key + 1);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    onOpenChange(nextOpen);
    if (!nextOpen) {
      setSessionKey((key) => key + 1);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90dvh] max-w-[calc(100vw-2rem)] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <WebcamCapture
          key={sessionKey}
          overlayType={overlayType}
          hint={hint}
          onCapture={handleCapture}
        />
      </DialogContent>
    </Dialog>
  );
}
