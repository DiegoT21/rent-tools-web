import React from "react";
import { ArrowRight, Zap, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function HeroSection() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
      {/* Main Hero Card */}
      <div className="lg:col-span-2 relative rounded-2xl overflow-hidden shadow-sm group min-h-[400px]">
        <div 
          className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
          style={{ 
            backgroundImage: "url('https://images.unsplash.com/photo-1541888052131-dcb86546dc3e?q=80&w=1200&auto=format&fit=crop')",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900/90 via-slate-900/60 to-transparent" />
        
        <div className="relative h-full flex flex-col justify-center p-10 md:p-14">
          <Badge variant="outline" className="text-primary border-primary hover:bg-primary/10 w-fit mb-4 text-[10px] tracking-widest font-bold uppercase">
            Renta Destacada
          </Badge>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-8 max-w-xl">
            Excavadora Compacta<br />de Precisión ZX-40
          </h1>
          
          <div className="flex flex-wrap items-center gap-6">
            <Button className="bg-primary hover:bg-primary/90 text-white px-8 py-6 rounded-xl font-bold text-lg shadow-lg shadow-primary/25">
              Rentar ahora
            </Button>
            <div className="flex flex-col">
              <span className="text-slate-300 text-xs font-medium">Desde</span>
              <div className="flex items-baseline gap-1">
                <span className="text-white text-3xl font-bold">$249</span>
                <span className="text-slate-300 text-sm">/día</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Side Promo Cards */}
      <div className="flex flex-col gap-6">
        <Card className="flex-1 bg-gradient-to-br from-blue-50 to-white border-blue-100 hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="p-6 h-full flex flex-col justify-between relative z-10">
            <div>
              <div className="flex justify-between items-start mb-3">
                <Badge className="bg-blue-500 text-white hover:bg-blue-600 text-[10px] uppercase font-bold tracking-wider">Pase de Temporada</Badge>
                <Zap className="text-blue-500 h-5 w-5" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Oferta de Generadores</h3>
              <p className="text-sm text-slate-500 leading-relaxed max-w-[90%]">
                Ahorra 25% en rentas semanales para todas las unidades de generación de energía.
              </p>
            </div>
            <button className="flex items-center gap-2 text-sm font-bold text-slate-700 hover:text-primary transition-colors mt-6 w-fit group-hover:translate-x-1 duration-300">
              Ver Detalles <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </Card>

        <Card className="flex-1 bg-gradient-to-br from-[#fff7f0] to-white border-orange-100/50 hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="p-6 h-full flex flex-col justify-between relative z-10">
            <div>
              <div className="flex justify-between items-start mb-3">
                <Badge className="bg-primary text-white hover:bg-primary/90 text-[10px] uppercase font-bold tracking-wider">Recién Llegado</Badge>
                <div className="bg-primary/10 p-1.5 rounded-full text-primary">
                  <Star className="h-4 w-4 fill-primary" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Escáneres Láser de Precisión</h3>
              <p className="text-sm text-slate-500 leading-relaxed max-w-[90%]">
                Lo último en mapeo 3D de sitios ya está disponible para renta diaria.
              </p>
            </div>
            <button className="flex items-center gap-2 text-sm font-bold text-slate-700 hover:text-primary transition-colors mt-6 w-fit group-hover:translate-x-1 duration-300">
              Explorar Tecnología <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}
