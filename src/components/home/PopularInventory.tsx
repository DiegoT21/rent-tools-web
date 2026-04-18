import React from "react";
import { Star, ShoppingCart, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const inventoryItems = [
  {
    id: 1,
    category: "POWER TOOLS",
    rating: 4.9,
    title: "Industrial Circular Saw",
    price: 45,
    image: "https://images.unsplash.com/photo-1504148455328-c376907d081c?q=80&w=600&auto=format&fit=crop"
  },
  {
    id: 2,
    category: "PNEUMATICS",
    rating: 4.8,
    title: "Twin-Tank Air Compressor",
    price: 38,
    image: "https://images.unsplash.com/photo-1581092586614-da20a32e1d7a?q=80&w=600&auto=format&fit=crop"
  },
  {
    id: 3,
    category: "CONSTRUCTION",
    rating: 5.0,
    title: "Direct Drive Cement Mixer",
    price: 72,
    image: "https://images.unsplash.com/photo-1510528659550-9ce838a1ddbd?q=80&w=600&auto=format&fit=crop"
  },
  {
    id: 4,
    category: "SURVEYING",
    rating: 4.7,
    title: "360° Rotary Laser Level",
    price: 55,
    image: "https://images.unsplash.com/photo-1581092334651-ddf68ca96fb8?q=80&w=600&auto=format&fit=crop"
  }
];

export function PopularInventory() {
  return (
    <div className="mb-12">
      <div className="flex items-end justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 mb-2">Popular Inventory</h2>
          <p className="text-slate-500 font-medium">Top rated tools for industrial professionals</p>
        </div>
        <button className="flex items-center gap-1 text-sm font-bold text-primary hover:text-orange-600 transition-colors">
          View All Inventory <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {inventoryItems.map((item) => (
          <Card key={item.id} className="overflow-hidden border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 group cursor-pointer bg-white">
            <div className="relative pt-[70%] overflow-hidden bg-slate-100">
              <img 
                src={item.image} 
                alt={item.title} 
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
            </div>
            <CardContent className="p-5">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">{item.category}</span>
                <div className="flex items-center gap-1 text-primary">
                  <Star className="h-3 w-3 fill-primary" />
                  <span className="text-xs font-bold text-slate-700">{item.rating}</span>
                </div>
              </div>
              <h3 className="font-bold text-slate-900 text-lg mb-4 truncate">{item.title}</h3>
              
              <div className="flex items-end justify-between">
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-bold text-slate-900">${item.price}</span>
                  <span className="text-xs text-slate-500 font-medium">/day</span>
                </div>
                <button className="bg-slate-900 hover:bg-primary text-white p-2.5 rounded-lg transition-colors group-hover:shadow-md">
                  <ShoppingCart className="h-4 w-4" />
                </button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
