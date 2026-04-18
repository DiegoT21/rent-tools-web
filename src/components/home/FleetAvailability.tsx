import React from "react";
import { Progress } from "@/components/ui/progress";

const fleetData = [
  { category: "Heavy Machinery", available: 75 },
  { category: "Handheld Power", available: 45 },
  { category: "Lifting Gear", available: 85 },
];

export function FleetAvailability() {
  return (
    <div className="bg-[#f0f3fa] rounded-2xl p-8 shadow-sm">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Current Fleet Availability</h2>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-blue-700"></div>
            <span className="text-sm font-semibold text-slate-700">Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-blue-100"></div>
            <span className="text-sm font-semibold text-slate-700">Booked</span>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {fleetData.map((item) => (
          <div key={item.category} className="flex items-center gap-6">
            <div className="w-48 text-sm font-semibold text-slate-700">
              {item.category}
            </div>
            <div className="flex-1">
              <div className="relative h-3 w-full overflow-hidden rounded-full bg-blue-100">
                <div 
                  className="h-full bg-blue-700 transition-all duration-1000 ease-in-out" 
                  style={{ width: `${item.available}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
