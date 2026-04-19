import React from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ShieldCheck, Lock, ArrowRight, Calendar } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { useNavigate } from "react-router-dom";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";

export function RegisterStepTwo() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-[#f8f9fb] text-slate-900 font-sans">
      <div className="mx-auto flex min-h-screen max-w-[1280px] flex-col px-4 py-6 md:px-8">
        
        {/* Header */}
        <header className="flex items-center justify-between py-4">
          <span className="text-xl font-black tracking-tight">RentTools</span>
          <button className="text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors">Help</button>
        </header>

        <main className="mt-8 grid flex-1 gap-12 lg:grid-cols-[1fr_1fr] items-center">
          
          {/* Columna Izquierda: Información de Seguridad */}
          <section className="space-y-8 lg:pr-12">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 border border-blue-100">
                <ShieldCheck className="h-3.5 w-3.5 text-blue-600" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">Entorno Seguro</span>
              </div>
              
              <h1 className="text-[3rem] font-black leading-[1.05] tracking-tight text-slate-950">
                Verifica tu identidad profesional.
              </h1>
              
              <p className="text-slate-500 text-lg leading-relaxed max-w-md">
                Para garantizar la seguridad de nuestra comunidad de alquiler de herramientas, necesitamos validar tus datos oficiales.
              </p>

              {/* Card de Encriptación */}
              <div className="flex items-center gap-4 rounded-2xl bg-white p-5 border border-slate-200/60 shadow-sm max-w-sm">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100">
                  <Lock className="h-6 w-6 text-slate-400" />
                </div>
                <div className="space-y-0.5">
                  <p className="text-sm font-bold text-slate-900">Encriptación Bancaria</p>
                  <p className="text-xs text-slate-500">Tus datos están protegidos bajo estándares AES-256.</p>
                </div>
              </div>
            </div>
          </section>

          {/* Columna Derecha: Card de Formulario KYC */}
          <section className="relative">
            {/* El icono del candado flotante que se ve en tu captura */}
            <div className="absolute -bottom-6 -right-6 opacity-5 invisible xl:visible">
               <Lock className="h-32 w-32" />
            </div>

            <div className="rounded-[32px] border border-white bg-white p-8 md:p-12 shadow-[0_35px_80px_-35px_rgba(0,0,0,0.1)]">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#e86f00]">Paso 2 de 3</span>
                <span className="text-xs font-bold text-slate-400">66% completado</span>
              </div>

              {/* Barra de progreso */}
              <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                <div className="h-full w-[66%] rounded-full bg-[#e86f00]" />
              </div>

              <h2 className="mt-6 text-2xl font-black tracking-tight text-slate-950">
                Información Personal
              </h2>

              <form className="mt-8 space-y-6" onSubmit={(e) => e.preventDefault()}>
                <div className="space-y-2">
                  <label className="text-[13px] font-bold text-slate-800">Tipo de Documento</label>
                  <Select defaultValue="dni">
                    <SelectTrigger className="h-12 bg-[#f3f6fc] border-none rounded-xl">
                      <SelectValue placeholder="Selecciona documento" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dni">DNI - Documento Nacional de Identidad</SelectItem>
                      <SelectItem value="passport">Pasaporte</SelectItem>
                      <SelectItem value="license">Licencia de Conducir</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-[13px] font-bold text-slate-800">Número de Documento</label>
                  <Input placeholder="Ej: 12345678X" className="h-12 bg-[#f3f6fc] border-none rounded-xl" />
                </div>

                <div className="space-y-2">
                  <label className="text-[13px] font-bold text-slate-800">Fecha de Nacimiento</label>
                  <div className="relative">
                    <Input type="date" className="h-12 bg-[#f3f6fc] border-none rounded-xl pr-10" />
                  </div>
                  <p className="text-[10px] text-blue-500 font-medium pt-1">
                    Debes ser mayor de 18 años para alquilar herramientas profesionales.
                  </p>
                </div>

                <div className="pt-2">
                  <Button className="h-14 w-full rounded-2xl bg-[#e86f00] text-base font-black text-white hover:bg-[#d46500] flex items-center justify-center gap-2">
                    Continuar <ArrowRight size={18} />
                  </Button>
                  
                  <button 
                    type="button"
                    onClick={() => navigate("/register")}
                    className="mt-4 flex w-full items-center justify-center gap-2 text-xs font-bold text-slate-400 ..."
                  >
                  <ChevronLeft size={16} /> Volver al paso anterior
                </button>
                </div>
              </form>
            </div>
          </section>
        </main>

        {/* Galería Inferior */}
        <div className="mt-12 grid grid-cols-2 gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="aspect-[16/9] overflow-hidden rounded-2xl grayscale opacity-40 hover:opacity-100 hover:grayscale-0 transition-all duration-500 border border-slate-200">
              <img 
                src={`/api/placeholder/400/225`} 
                alt={`Stock ${i}`} 
                className="h-full w-full object-cover"
              />
            </div>
          ))}
        </div>

        {/* Footer */}
        <footer className="flex flex-col md:flex-row items-center justify-between py-10 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 border-t border-slate-100 mt-8">
          <div className="flex gap-6">
            <span>© 2024 RENTTOOLS</span>
            <a href="#" className="hover:text-slate-900">Términos de servicio</a>
            <a href="#" className="hover:text-slate-900">Privacidad</a>
          </div>
          <div className="flex items-center gap-2 mt-4 md:mt-0">
             <Lock size={12} /> CONEXIÓN SEGURA SSL
          </div>
        </footer>
      </div>
    </div>
  );
}