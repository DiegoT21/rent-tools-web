import React, { useRef, useState, useCallback } from "react";
import Webcam from "react-webcam";
import { Camera, RefreshCw, Check } from "lucide-react";
import { Button } from "./button";

interface WebcamCaptureProps {
  onCapture: (imageSrc: string) => void;
  overlayType?: "document" | "face";
}

export function WebcamCapture({ onCapture, overlayType = "document" }: WebcamCaptureProps) {
  const webcamRef = useRef<Webcam>(null);
  const [imgSrc, setImgSrc] = useState<string | null>(null);

  const capture = useCallback(() => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      setImgSrc(imageSrc);
    }
  }, [webcamRef, setImgSrc]);

  const retake = () => {
    setImgSrc(null);
  };

  const confirm = () => {
    if (imgSrc) {
      onCapture(imgSrc);
    }
  };

  const videoConstraints = {
    width: 1280,
    height: 720,
    facingMode: overlayType === "face" ? "user" : "environment" // Usa cámara frontal para selfie, trasera para doc (si está en móvil)
  };

  return (
    <div className="relative w-full overflow-hidden rounded-2xl bg-slate-950 flex flex-col items-center justify-center min-h-[300px]">
      {!imgSrc ? (
        <>
          <Webcam
            audio={false}
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            videoConstraints={videoConstraints}
            className="w-full h-full object-cover"
          />
          
          {/* Overlays */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            {overlayType === "document" ? (
              // Guía rectangular para cédula
              <div className="w-[80%] h-[50%] border-2 border-dashed border-[#ff7a00]/80 rounded-xl relative">
                <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-xs text-white/90 font-medium bg-black/50 px-3 py-1 rounded-full whitespace-nowrap">
                  Encuadra tu documento aquí
                </div>
              </div>
            ) : (
              // Guía circular para selfie
              <div className="w-48 h-64 border-2 border-dashed border-[#ff7a00]/80 rounded-[100%] relative">
                 <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-xs text-white/90 font-medium bg-black/50 px-3 py-1 rounded-full whitespace-nowrap">
                  Rostro descubierto
                </div>
              </div>
            )}
          </div>

          <div className="absolute bottom-4 flex justify-center w-full">
            <Button 
              type="button"
              onClick={capture} 
              size="sm" 
              className="bg-white/20 backdrop-blur-md text-white border border-white/40 hover:bg-white/30 rounded-full px-6 py-5 shadow-lg"
            >
              <Camera className="mr-2 h-5 w-5" /> Tomar Foto
            </Button>
          </div>
        </>
      ) : (
        <>
          <img src={imgSrc} alt="Captured" className="w-full h-full object-cover" />
          
          <div className="absolute bottom-4 flex justify-center gap-4 w-full">
            <Button 
              type="button"
              onClick={retake} 
              variant="outline"
              className="bg-slate-900/60 backdrop-blur-md text-white border-white/20 hover:bg-slate-800/80 rounded-full"
            >
              <RefreshCw className="mr-2 h-4 w-4" /> Repetir
            </Button>
            <Button 
              type="button"
              onClick={confirm} 
              className="bg-[#e86f00] text-white hover:bg-[#d46500] rounded-full shadow-lg"
            >
              <Check className="mr-2 h-4 w-4" /> Confirmar
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
