import React from "react";
import { Link, useNavigate } from "react-router-dom";

import { 
  Camera, 
  Upload, 
  ShieldCheck, 
  CheckCircle2, 
  ChevronLeft, 
  ArrowRight,
  UserCircle,
  FileText
} from "lucide-react";
import { Button } from "../components/ui/button";

export function RegisterStepThree() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#f8f9fb] text-slate-900 font-sans">
      <div className="mx-auto flex min-h-screen max-w-[1100px] flex-col px-4 py-6 md:px-8">
        
        {/* Header */}
        <header className="flex items-center justify-between py-4">
          <span className="text-xl font-black tracking-tight">RentTools</span>
          <button className="text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors">Help</button>
        </header>

        <main className="mt-6 flex-1 flex flex-col items-center">
          <div className="w-full max-w-4xl text-center space-y-4 mb-10">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#e86f00]">Paso 3 de 3</span>
            <h1 className="text-[2.5rem] font-black tracking-tight text-slate-950">Verifica tu identidad</h1>
            <p className="text-slate-500 text-base max-w-2xl mx-auto">
              Para garantizar la seguridad de nuestra comunidad de alquiler, necesitamos confirmar que eres tú. Este proceso es rápido y seguro.
            </p>
          </div>

          <div className="grid w-full gap-6 md:grid-cols-2">
            
            {/* Tarjeta 1: Documento de Identidad */}
            <section className="rounded-[24px] bg-[#eff6ff]/50 border border-blue-100 p-8 flex flex-col space-y-6">
              <div className="flex items-center gap-3">
                <div className="bg-[#ff7a00] p-1.5 rounded-lg">
                  <FileText className="h-4 w-4 text-white" />
                </div>
                <h2 className="font-bold text-slate-900">Documento de Identidad</h2>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Sube una foto clara de tu DNI, Pasaporte o Licencia de conducir. Asegúrate de que todos los datos sean legibles.
              </p>
              
              <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-blue-200 rounded-2xl bg-white/50 hover:bg-white hover:border-[#ff7a00] transition-all cursor-pointer group min-h-[200px]">
                <div className="bg-slate-100 p-4 rounded-full group-hover:scale-110 transition-transform">
                  <Camera className="h-6 w-6 text-slate-400" />
                </div>
                <p className="mt-4 text-sm font-bold text-slate-700">Click para subir o arrastra la imagen</p>
                <p className="mt-1 text-[10px] text-slate-400">JPG, PNG HASTA 10MB</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-[11px] font-bold text-slate-600">
                  <CheckCircle2 className="h-3.5 w-3.5 text-blue-500" /> Sin reflejos de luz
                </div>
                <div className="flex items-center gap-2 text-[11px] font-bold text-slate-600">
                  <CheckCircle2 className="h-3.5 w-3.5 text-blue-500" /> Bordes del documento visibles
                </div>
              </div>
            </section>

            {/* Tarjeta 2: Verificación Facial */}
            <section className="rounded-[24px] bg-[#f0f4f8] border border-slate-200 p-8 flex flex-col space-y-6">
              <div className="flex items-center gap-3">
                <div className="bg-[#ff7a00] p-1.5 rounded-lg">
                  <UserCircle className="h-4 w-4 text-white" />
                </div>
                <h2 className="font-bold text-slate-900">Verificación Facial</h2>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Tómate una selfie para confirmar la propiedad del documento. Colócate en un lugar bien iluminado.
              </p>

              <div className="relative flex-1 rounded-2xl bg-slate-950 overflow-hidden flex items-center justify-center min-h-[200px]">
                <div className="absolute inset-0 border-[30px] border-black/40 flex items-center justify-center">
                  <div className="w-32 h-44 rounded-[100%] border-2 border-dashed border-[#ff7a00]/60 relative">
                     <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-[10px] text-white/60 font-medium whitespace-nowrap">Selfie Area</div>
                  </div>
                </div>
                <div className="absolute bottom-4">
                  <Button size="sm" className="bg-white/10 backdrop-blur-md text-white border border-white/20 hover:bg-white/20 rounded-full px-6 py-5">
                    <Camera className="mr-2 h-4 w-4" /> CAPTURAR AHORA
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-[11px] font-bold text-slate-600">
                  <CheckCircle2 className="h-3.5 w-3.5 text-blue-500" /> Rostro descubierto
                </div>
                <div className="flex items-center gap-2 text-[11px] font-bold text-slate-600">
                  <CheckCircle2 className="h-3.5 w-3.5 text-blue-500" /> Fondo neutro y claro
                </div>
              </div>
            </section>
          </div>

          {/* Barra de Acciones Finales (CONECTADA) */}
          <div className="w-full mt-12 flex flex-col items-center space-y-6">
            <div className="flex w-full items-center justify-between border-t border-slate-200 pt-8 max-w-4xl">
              <div className="flex items-center gap-3 rounded-2xl bg-blue-50 px-4 py-3 border border-blue-100">
                <ShieldCheck className="h-5 w-5 text-blue-600" />
                <div className="text-left">
                  <p className="text-[11px] font-bold text-slate-900 leading-none">Encriptación de Grado Bancario</p>
                  <p className="text-[9px] text-slate-500 mt-1">Tus datos están protegidos y nunca se comparten.</p>
                </div>
              </div>

              <div className="flex items-center gap-6">
                {/* BOTÓN VOLVER AGREGADO */}
                <button 
                  onClick={() => navigate("/register/step-2")}
                  className="text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors flex items-center gap-1"
                >
                  <ChevronLeft size={16} /> Volver
                </button>

                <button className="text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors">
                  Omitir por ahora
                </button>
                
                <Button 
                  onClick={() => alert("¡Registro completado!")}
                  className="h-12 px-8 rounded-xl bg-[#e86f00] text-sm font-black text-white shadow-lg shadow-orange-500/20 hover:bg-[#d46500] flex items-center gap-2"
                >
                  Finalizar Registro <ArrowRight size={16} />
                </Button>
              </div>
            </div>
            
            <p className="text-[11px] text-slate-400">
              ¿Tienes problemas con la cámara? <span className="text-[#ff7a00] font-bold cursor-pointer hover:underline">Contáctanos</span>
            </p>
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