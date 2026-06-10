import { useRef, useState, useCallback } from "react";
import Webcam from "react-webcam";
import {
  Camera,
  RefreshCw,
  Check,
  Monitor,
  Smartphone,
  ImageIcon,
  ChevronLeft,
} from "lucide-react";
import { Button } from "./button";

export interface WebcamCaptureProps {
  onCapture: (imageSrc: string, file?: File) => void;
  overlayType?: "document" | "face" | "general";
  hint?: string;
}

type CaptureSource = "web" | "native" | "gallery";
type Step = "choose" | "capture" | "preview";

function getPlatformInfo() {
  const ua = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua);
  const isAndroid = /Android/.test(ua);
  const isMac = /Mac/.test(ua) && !isIOS;
  const isWindows = /Win/.test(ua);

  return { isIOS, isAndroid, isMac, isWindows };
}

function getNativeCameraLabel() {
  const { isIOS, isAndroid, isMac, isWindows } = getPlatformInfo();

  if (isIOS) return "Cámara de Apple (iPhone/iPad)";
  if (isAndroid) return "Cámara del dispositivo Android";
  if (isWindows) return "Cámara de Windows";
  if (isMac) return "Cámara de Mac / Continuity";
  return "Cámara del dispositivo";
}

function getNativeCameraDescription() {
  const { isIOS, isAndroid, isMac, isWindows } = getPlatformInfo();

  if (isIOS) return "Abre la app Cámara nativa de tu iPhone o iPad.";
  if (isAndroid) return "Abre la cámara integrada de tu teléfono o tablet.";
  if (isWindows) return "Abre la app Cámara de Windows o el selector con cámara integrada.";
  if (isMac) return "Abre la cámara de tu Mac o Continuity Camera desde el iPhone.";
  return "Usa la cámara nativa de tu dispositivo en lugar del navegador.";
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("No se pudo leer la imagen"));
    reader.readAsDataURL(file);
  });
}

function SourcePicker({
  onSelect,
}: {
  onSelect: (source: CaptureSource) => void;
}) {
  const options: {
    id: CaptureSource;
    icon: typeof Monitor;
    title: string;
    description: string;
  }[] = [
    {
      id: "web",
      icon: Monitor,
      title: "Cámara web",
      description:
        "Usa la cámara de tu computadora directamente en el navegador (permiso requerido).",
    },
    {
      id: "native",
      icon: Smartphone,
      title: getNativeCameraLabel(),
      description: getNativeCameraDescription(),
    },
    {
      id: "gallery",
      icon: ImageIcon,
      title: "Galería o archivos",
      description:
        "Elige una foto que ya tengas guardada en tu dispositivo o en la nube.",
    },
  ];

  return (
    <div className="w-full space-y-4 p-1">
      <div className="text-center space-y-1 px-2">
        <p className="text-sm font-bold text-slate-900">¿Cómo quieres tomar la foto?</p>
        <p className="text-xs text-slate-500">
          Elige abrir la cámara web del navegador, la cámara de tu dispositivo o subir una imagen.
        </p>
      </div>

      <div className="grid gap-3">
        {options.map(({ id, icon: Icon, title, description }) => (
          <button
            key={id}
            type="button"
            onClick={() => onSelect(id)}
            className="flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-4 text-left transition-all hover:border-[#e86f00] hover:bg-orange-50/40 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#e86f00]/30"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#fff4eb] text-[#e86f00]">
              <Icon className="h-5 w-5" />
            </div>
            <div className="space-y-0.5">
              <p className="text-sm font-bold text-slate-900">{title}</p>
              <p className="text-xs leading-relaxed text-slate-500">{description}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function WebcamStream({
  overlayType,
  hint,
  onPreview,
  onBack,
}: {
  overlayType: "document" | "face" | "general";
  hint?: string;
  onPreview: (imageSrc: string) => void;
  onBack: () => void;
}) {
  const webcamRef = useRef<Webcam>(null);

  const capture = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) onPreview(imageSrc);
  }, [onPreview]);

  const videoConstraints = {
    width: 1280,
    height: 720,
    facingMode: overlayType === "face" ? "user" : "environment",
  };

  const overlayHint =
    hint ??
    (overlayType === "document"
      ? "Encuadra tu documento aquí"
      : overlayType === "face"
        ? "Rostro descubierto"
        : "Encuadra el objeto aquí");

  return (
    <div className="relative flex min-h-[300px] w-full flex-col items-center justify-center overflow-hidden rounded-2xl bg-slate-950">
      <Webcam
        audio={false}
        ref={webcamRef}
        screenshotFormat="image/jpeg"
        videoConstraints={videoConstraints}
        className="h-full w-full object-cover"
      />

      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {overlayType === "document" ? (
          <div className="relative h-[50%] w-[80%] rounded-xl border-2 border-dashed border-[#ff7a00]/80">
            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-black/50 px-3 py-1 text-xs font-medium text-white/90">
              {overlayHint}
            </div>
          </div>
        ) : overlayType === "face" ? (
          <div className="relative h-64 w-48 rounded-[100%] border-2 border-dashed border-[#ff7a00]/80">
            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-black/50 px-3 py-1 text-xs font-medium text-white/90">
              {overlayHint}
            </div>
          </div>
        ) : (
          <div className="relative h-[55%] w-[75%] rounded-xl border-2 border-dashed border-[#ff7a00]/80">
            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-black/50 px-3 py-1 text-xs font-medium text-white/90">
              {overlayHint}
            </div>
          </div>
        )}
      </div>

      <div className="absolute left-4 top-4">
        <Button
          type="button"
          onClick={onBack}
          size="sm"
          variant="outline"
          className="rounded-full border-white/20 bg-slate-900/60 text-white backdrop-blur-md hover:bg-slate-800/80"
        >
          <ChevronLeft className="mr-1 h-4 w-4" /> Cambiar
        </Button>
      </div>

      <div className="absolute bottom-4 flex w-full justify-center">
        <Button
          type="button"
          onClick={capture}
          size="sm"
          className="rounded-full border border-white/40 bg-white/20 px-6 py-5 text-white shadow-lg backdrop-blur-md hover:bg-white/30"
        >
          <Camera className="mr-2 h-5 w-5" /> Tomar foto
        </Button>
      </div>
    </div>
  );
}

function ImagePreview({
  imgSrc,
  onRetake,
  onConfirm,
}: {
  imgSrc: string;
  onRetake: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="relative flex min-h-[300px] w-full flex-col items-center justify-center overflow-hidden rounded-2xl bg-slate-950">
      <img src={imgSrc} alt="Vista previa" className="h-full w-full object-cover" />

      <div className="absolute bottom-4 flex w-full justify-center gap-4">
        <Button
          type="button"
          onClick={onRetake}
          variant="outline"
          className="rounded-full border-white/20 bg-slate-900/60 text-white backdrop-blur-md hover:bg-slate-800/80"
        >
          <RefreshCw className="mr-2 h-4 w-4" /> Repetir
        </Button>
        <Button
          type="button"
          onClick={onConfirm}
          className="rounded-full bg-[#e86f00] text-white shadow-lg hover:bg-[#d46500]"
        >
          <Check className="mr-2 h-4 w-4" /> Confirmar
        </Button>
      </div>
    </div>
  );
}

export function WebcamCapture({
  onCapture,
  overlayType = "document",
  hint,
}: WebcamCaptureProps) {
  const nativeInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>("choose");
  const [source, setSource] = useState<CaptureSource | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | undefined>();

  const captureMode =
    overlayType === "face" ? "user" : "environment";

  const handleSourceSelect = (selected: CaptureSource) => {
    setSource(selected);

    if (selected === "web") {
      setStep("capture");
      return;
    }

    if (selected === "native") {
      nativeInputRef.current?.click();
      return;
    }

    galleryInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      return;
    }

    try {
      const dataUrl = await fileToDataUrl(file);
      setSelectedFile(file);
      setPreviewImage(dataUrl);
      setStep("preview");
    } catch {
      setStep("choose");
      setSource(null);
    }
  };

  const resetToPicker = () => {
    setStep("choose");
    setSource(null);
    setPreviewImage(null);
    setSelectedFile(undefined);
  };

  const handleRetake = () => {
    if (source === "web") {
      setPreviewImage(null);
      setSelectedFile(undefined);
      setStep("capture");
      return;
    }

    if (source === "native") {
      nativeInputRef.current?.click();
      return;
    }

    if (source === "gallery") {
      galleryInputRef.current?.click();
      return;
    }

    resetToPicker();
  };

  const handleConfirm = () => {
    if (previewImage) {
      onCapture(previewImage, selectedFile);
      resetToPicker();
    }
  };

  return (
    <div className="w-full">
      <input
        ref={nativeInputRef}
        type="file"
        accept="image/*"
        capture={captureMode}
        className="hidden"
        onChange={handleFileChange}
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {step === "choose" && <SourcePicker onSelect={handleSourceSelect} />}

      {step === "capture" && source === "web" && (
        <WebcamStream
          overlayType={overlayType}
          hint={hint}
          onPreview={(imageSrc) => {
            setPreviewImage(imageSrc);
            setSelectedFile(undefined);
            setStep("preview");
          }}
          onBack={resetToPicker}
        />
      )}

      {step === "preview" && previewImage && (
        <ImagePreview
          imgSrc={previewImage}
          onRetake={handleRetake}
          onConfirm={handleConfirm}
        />
      )}
    </div>
  );
}
