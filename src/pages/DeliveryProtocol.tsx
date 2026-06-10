import React, { useState, useRef } from 'react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { MapPin, Camera, PenTool, CheckCircle } from 'lucide-react';
import SignatureCanvas from 'react-signature-canvas';
import { WebcamCapture } from '../components/ui/WebcamCapture';

export const DeliveryProtocol = () => {
  const [step, setStep] = useState(1);
  const [location, setLocation] = useState<{lat: number, lng: number} | null>(null);
  const [locError, setLocError] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const sigCanvas = useRef<any>(null);

  const verifyLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          // Validar "Bounding Box" de Panamá: Lat 7.0 a 9.6, Lng -83.0 a -77.0 aprox
          if (latitude > 7.0 && latitude < 9.6 && longitude > -83.0 && longitude < -77.0) {
            setLocation({ lat: latitude, lng: longitude });
            setStep(2);
          } else {
            setLocError("Debes estar dentro del territorio de Panamá para realizar la entrega.");
          }
        },
        () => setLocError("Error obteniendo ubicación. Asegúrate de dar permisos.")
      );
    } else {
      setLocError("Tu navegador no soporta geolocalización.");
    }
  };

  const handleCapture = (imgSrc: string) => {
    if (photos.length < 3) {
      setPhotos([...photos, imgSrc]);
    }
  };

  const finishPhotos = () => {
    if (photos.length >= 1) setStep(3);
  };

  const finishProtocol = () => {
    if (sigCanvas.current?.isEmpty()) {
      alert("Por favor firme el documento.");
      return;
    }
    setStep(4);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-slate-900 mb-8">Protocolo de Entrega Segura</h1>
      
      {/* Paso 1: GPS */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-6 h-6 text-blue-600" />
              Paso 1: Validación GPS
            </CardTitle>
            <CardDescription>
              Para seguridad de ambas partes y del contrato, se verificará que la entrega ocurra en Panamá.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            {locError && <p className="text-red-500 mb-4 text-center bg-red-50 p-2 rounded">{locError}</p>}
            <Button onClick={verifyLocation} size="lg" className="w-full sm:w-auto">
              Verificar Ubicación Ahora
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Paso 2: Cámara */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="w-6 h-6 text-indigo-600" />
              Paso 2: Evidencia Fotográfica
            </CardTitle>
            <CardDescription>
              Toma fotos del estado del equipo. (Capturadas: {photos.length}/3)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <WebcamCapture
                onCapture={handleCapture}
                overlayType="general"
                hint="Alinea el equipo en el centro"
              />
            </div>
            {photos.length > 0 && (
              <div className="flex gap-2 mb-6 overflow-x-auto p-2 bg-slate-50 rounded-lg">
                {photos.map((p, i) => (
                  <img key={i} src={p} alt={`Evidencia ${i}`} className="w-24 h-24 object-cover rounded-md border-2 border-white shadow-sm" />
                ))}
              </div>
            )}
            <Button onClick={finishPhotos} disabled={photos.length === 0} className="w-full">
              Continuar a Firmas
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Paso 3: Firma */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PenTool className="w-6 h-6 text-purple-600" />
              Paso 3: Firma del Contrato
            </CardTitle>
            <CardDescription>
              Firma digitalmente para confirmar la entrega. Se generará un PDF vinculante.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border-2 border-dashed border-slate-300 rounded-lg p-2 mb-4 bg-slate-50">
              <SignatureCanvas 
                ref={sigCanvas}
                canvasProps={{className: 'w-full h-48', style: {touchAction: 'none'}}}
              />
            </div>
            <div className="flex justify-between gap-4">
              <Button variant="outline" onClick={() => sigCanvas.current?.clear()}>Limpiar</Button>
              <Button onClick={finishProtocol}>Sellar Contrato y Finalizar</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Paso 4: Éxito */}
      {step === 4 && (
        <Card className="border-green-200 bg-green-50 text-center py-12">
          <CardContent>
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-green-900 mb-2">¡Entrega Confirmada!</h2>
            <p className="text-green-700">El contrato PDF ha sido generado y sellado con las evidencias.</p>
            <Button className="mt-8" onClick={() => window.location.href = '/'}>Volver al Inicio</Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
