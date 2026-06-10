import { HeroSection } from "../components/home/HeroSection";
import { PopularInventory } from "../components/home/PopularInventory";
import { FleetAvailability } from "../components/home/FleetAvailability";

export function Home() {
  return (
    <div className="max-w-7xl mx-auto pb-12">
      <HeroSection />
      <PopularInventory />
      <FleetAvailability />
    </div>
  );
}
