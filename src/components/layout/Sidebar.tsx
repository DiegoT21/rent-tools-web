import React from "react";
import { Grid, Pickaxe, Settings, ShoppingCart, TestTube, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

const categories = [
  { name: "Todo el Equipo", icon: Grid, active: true },
  { name: "Herramientas de Poder", icon: Pickaxe, active: false },
  { name: "Excavadoras", icon: Settings, active: false },
  { name: "Manejo de Materiales", icon: ShoppingCart, active: false },
  { name: "Lab. de Precisión", icon: TestTube, active: false },
];

export function Sidebar({ className }) {
  return (
    <div className={cn("flex flex-col bg-[#f0f3fa] border-r border-[#e5e9f2] p-4", className)}>
      <div className="flex flex-col space-y-1 mb-8 pt-4 px-2">
        <h2 className="text-lg font-bold text-slate-900 tracking-tight">Categorías</h2>
        <p className="text-xs text-slate-500 font-medium">Inventario Profesional</p>
      </div>
      
      <nav className="flex-1 space-y-1.5">
        {categories.map((cat) => (
          <button
            key={cat.name}
            className={cn(
              "flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200",
              cat.active 
                ? "bg-white text-primary shadow-sm ring-1 ring-slate-900/5" 
                : "text-slate-600 hover:bg-white/50 hover:text-slate-900"
            )}
          >
            <cat.icon className={cn("h-5 w-5", cat.active ? "text-primary" : "text-slate-400")} />
            {cat.name}
          </button>
        ))}
      </nav>

      <div className="mt-auto p-1">
        <div className="bg-[#1a1f2e] text-white rounded-2xl p-5 relative overflow-hidden group border border-slate-800">
          <div className="relative z-10 flex flex-col gap-1.5">
            <p className="text-[10px] font-bold tracking-widest text-[#8e9bb3] uppercase">Acceso a la Flota</p>
            <h3 className="text-sm font-semibold mb-2">Mejorar a Pro</h3>
            <button className="flex w-full items-center justify-center rounded-lg bg-primary hover:bg-[#ff8c26] px-4 py-2 text-xs font-bold text-white transition-colors shadow-[0_0_15px_-3px_rgba(255,122,0,0.5)]">
              Mejorar a Flota
            </button>
          </div>
          {/* Decorative shapes behind text */}
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/5 rounded-full border border-white/10 group-hover:scale-110 transition-transform duration-500" />
        </div>
      </div>
    </div>
  );
}
