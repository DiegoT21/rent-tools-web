import React from "react";
import { Link } from "react-router-dom";
import { Search, Bell, User, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function Header() {
  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-white px-6">
      <div className="flex items-center gap-12">
        <div className="text-xl font-bold tracking-tight text-slate-900">
          Rent<span className="text-slate-600 font-medium">Tools</span>
        </div>
        <nav className="flex items-center gap-6">
          <a href="#" className="text-sm font-semibold text-primary border-b-2 border-primary py-5">Location</a>
          <a href="#" className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors">Categories</a>
          <a href="#" className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors">My Rentals</a>
        </nav>
      </div>

      <div className="flex flex-1 items-center justify-center px-12 gap-3">
        <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 bg-slate-100 py-2 px-3.5 rounded-full hover:bg-slate-200 cursor-pointer transition-colors shadow-sm">
          <MapPin className="h-4 w-4 text-primary" />
          <span>Ubicación</span>
        </div>
        <div className="relative w-full max-w-xl">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input 
            type="search" 
            placeholder="Search industrial tools..." 
            className="w-full bg-[#f3f4f6] pl-10 h-10 border-transparent rounded-full shadow-none focus-visible:ring-primary/20 focus-visible:border-primary/50"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Button className="rounded-full bg-primary hover:bg-primary/90 text-white font-semibold px-6 shadow-md shadow-primary/20">
          Post
        </Button>
        <button className="flex h-9 w-9 items-center justify-center rounded-full text-slate-600 hover:bg-slate-100 transition-colors">
          <Bell className="h-5 w-5" />
        </button>
        <Link to="/login" className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-200 text-slate-700 hover:bg-slate-300 transition-colors">
          <User className="h-5 w-5" />
        </Link>
      </div>
    </header>
  );
}
