import { HeroSection } from "../components/home/HeroSection";
import { Link } from "react-router-dom";
import { PopularInventory } from "../components/home/PopularInventory";
import { FleetAvailability } from "../components/home/FleetAvailability";

export function Home() {
  return (
    <div className="max-w-7xl mx-auto pb-12">
      <div className="bg-yellow-100 p-4 text-center text-yellow-900 mb-4 rounded-b-lg font-medium flex justify-center gap-4">
        <span>🚀 Nuevos Flujos (Testing):</span>
        <Link to="/checkout" className="underline hover:text-yellow-700">Flujo de Garantía (Stripe)</Link>
        <Link to="/delivery" className="underline hover:text-yellow-700">Protocolo de Entrega (GPS/Cámara)</Link>
      </div>
      <HeroSection />
      <PopularInventory />
      <FleetAvailability />
    </div>
  );
}
