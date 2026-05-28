import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

import { 
  ShieldCheck, 
  CheckCircle2, 
  ChevronLeft, 
  ArrowRight,
  UserCircle
} from "lucide-react";
import { Button } from "../components/ui/button";
import { WebcamCapture } from "../components/ui/WebcamCapture";
import { useAuthStore } from "../store/useAuthStore";
import { alerts } from "@/lib/alerts";


export function RegisterStepThree() {
  const location = useLocation();
  const navigate = useNavigate();
  const { accessToken: storeToken } = useAuthStore();
  const documentImage = location.state?.documentImage || null;
  const accessToken = location.state?.accessToken || storeToken;

  // Protección total: Validar sesión y que venga del Paso 2
  React.useEffect(() => {
    if (!accessToken) {
      navigate("/register");
    } else if (!documentImage) {
      // Si hay sesión pero no hay foto de cédula, mandarlo al Paso 2
      navigate("/register/step-2");
    }
  }, [accessToken, documentImage, navigate]);

  const [selfieImage, setSelfieImage] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFinish = async () => {
    if (!selfieImage) {
      await alerts.warning("Falta selfie", "Por favor, toma una selfie para continuar.");
      return;
    }

    if (!documentImage) {
      setError("No se detectó la foto del documento. Por favor, regresa al paso anterior y toma la foto de tu cédula para poder comparar los rostros.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/verification/verify-identity', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken && { 'Authorization': `Bearer ${accessToken}` }),
        },
        body: JSON.stringify({
          documentImage: documentImage,
          selfieImage: selfieImage
        }),
      });

      const data = await response.json();

      if (response.ok && data.verified) {
        console.log("Similitud de rostros exitosa", data);
        await alerts.success("Registro completado", "Identidad verificada con éxito.");
        
        // Guardar token y obtener perfil si hay accessToken
        if (accessToken) {
          useAuthStore.getState().setToken(accessToken);
          await useAuthStore.getState().fetchProfile();
        }
        
        navigate("/");
      } else {
        setError(data.message || "La prueba de vida no fue exitosa. Intente en un lugar con mejor iluminación.");
      }
    } catch (err) {
      console.error("Error al verificar liveness", err);
      setError("Ocurrió un error al verificar su identidad. Intente nuevamente.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fb] text-slate-900 font-sans">
      <div className="mx-auto flex min-h-screen max-w-[800px] flex-col px-4 py-6 md:px-8">
        
        {/* Header */}
        <header className="flex items-center justify-between py-4">
          <span className="text-xl font-black tracking-tight">RentTools</span>
          <button className="text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors">Help</button>
        </header>

        <main className="mt-6 flex-1 flex flex-col items-center">
          <div className="w-full text-center space-y-4 mb-10">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#e86f00]">Paso 3 de 3</span>
            <h1 className="text-[2.5rem] font-black tracking-tight text-slate-950">Prueba de Vida</h1>
            <p className="text-slate-500 text-base max-w-2xl mx-auto">
              Necesitamos confirmar que eres tú. Tómate una selfie para compararla con tu documento oficial.
            </p>
          </div>

          <div className="w-full">
            <section className="rounded-[24px] bg-white border border-slate-200 p-8 flex flex-col space-y-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="bg-[#ff7a00] p-1.5 rounded-lg">
                  <UserCircle className="h-5 w-5 text-white" />
                </div>
                <h2 className="font-bold text-lg text-slate-900">Verificación Facial</h2>
              </div>
              
              {!selfieImage ? (
                <>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    Colócate en un lugar bien iluminado, retira lentes oscuros o gorras, y asegúrate de que tu rostro esté completamente dentro del círculo.
                  </p>
                  
                  <div className="w-full max-w-md mx-auto">
                    <WebcamCapture 
                      overlayType="face" 
                      onCapture={(img) => setSelfieImage(img)} 
                    />
                  </div>

                  <div className="flex justify-center gap-6 pt-4">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                      <CheckCircle2 className="h-4 w-4 text-green-500" /> Rostro descubierto
                    </div>
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                      <CheckCircle2 className="h-4 w-4 text-green-500" /> Buena iluminación
                    </div>
                  </div>
                </>
              ) : (
                <div className="space-y-6 max-w-md mx-auto w-full">
                  <div className="rounded-2xl overflow-hidden border-4 border-green-500">
                    <img src={selfieImage} alt="Selfie" className="w-full h-auto" />
                  </div>
                  <div className="flex justify-center">
                    <div className="inline-flex items-center gap-2 text-green-600 text-sm font-bold bg-green-50 px-4 py-2 rounded-full">
                      <ShieldCheck className="h-5 w-5" /> Selfie capturada con éxito
                    </div>
                  </div>
                  <button 
                    onClick={() => setSelfieImage(null)}
                    className="w-full text-center text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    Volver a tomar foto
                  </button>
                </div>
              )}
            </section>
          </div>

          {/* Barra de Acciones Finales */}
          <div className="w-full mt-12 flex flex-col items-center space-y-6">
            <div className="flex w-full flex-col md:flex-row items-center justify-between border-t border-slate-200 pt-8 gap-6">
              <div className="flex items-center gap-3 rounded-2xl bg-blue-50 px-4 py-3 border border-blue-100">
                <ShieldCheck className="h-5 w-5 text-blue-600" />
                <div className="text-left">
                  <p className="text-[11px] font-bold text-slate-900 leading-none">Encriptación de Grado Bancario</p>
                  <p className="text-[9px] text-slate-500 mt-1">Tus datos están protegidos y nunca se comparten.</p>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <button 
                  onClick={() => navigate("/register/step-2")}
                  disabled={isLoading}
                  className="text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors flex items-center gap-1 disabled:opacity-50"
                >
                  <ChevronLeft size={16} /> Volver
                </button>
                
                <Button 
                  onClick={handleFinish}
                  disabled={!selfieImage || isLoading}
                  className={`h-12 px-8 rounded-xl text-sm font-black text-white flex items-center gap-2 transition-all ${
                    selfieImage && !isLoading
                      ? "bg-[#e86f00] hover:bg-[#d46500] shadow-lg shadow-orange-500/20" 
                      : "bg-slate-300 cursor-not-allowed"
                  }`}
                >
                  {isLoading ? "Verificando..." : "Finalizar Registro"} <ArrowRight size={16} />
                </Button>
              </div>
            </div>

            {error && (
              <div className="w-full p-4 mt-4 text-sm text-red-600 bg-red-50 rounded-xl font-medium border border-red-100 text-center">
                {error}
              </div>
            )}
          </div>
        </main>

        <footer className="mt-auto py-6 flex justify-between items-center text-[10px] font-bold uppercase tracking-[0.2em] text-slate-300">
          <div className="flex gap-4">
             <span>© 2026 RENTTOOLS</span>
             <span>TÉRMINOS DE SERVICIO</span>
             <span>PRIVACIDAD</span>
          </div>
          <div className="flex items-center gap-2">
            <ShieldCheck size={12} /> CONEXIÓN SEGURA SSL
          </div>
        </footer>
      </div>
    </div>
  );
}
