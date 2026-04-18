import React from "react";
import { HeroSection } from "../components/home/HeroSection";
import { PopularInventory } from "../components/home/PopularInventory";
import { FleetAvailability } from "../components/home/FleetAvailability";

export function Home() {
  return (
    <div className="max-w-7xl mx-auto pb-12">
      <HeroSection />
      <PopularInventory />
      <FleetAvailability />
      
      <footer className="mt-16 pt-8 border-t flex flex-col md:flex-row justify-between items-center text-xs font-semibold text-slate-400 tracking-widest uppercase">
        <p>© 2024 RENTTOOLS. UTILIDAD DE PRECISIÓN PARA PROFESIONALES INDUSTRIALES.</p>
        <div className="flex gap-6 mt-4 md:mt-0">
          <a href="#" className="hover:text-primary transition-colors">Privacidad</a>
          <a href="#" className="hover:text-primary transition-colors">Términos</a>
          <a href="#" className="hover:text-primary transition-colors">Seguridad</a>
          <a href="#" className="hover:text-primary transition-colors">Contacto</a>
        </div>
      </footer>
    </div>
  );
}
