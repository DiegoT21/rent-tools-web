import React, { useState, useEffect } from "react";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import { Footer } from "./Footer";
import { cn } from "@/lib/utils";
import { useLocation } from "react-router-dom";
import { SupportChatBubble } from "../support/SupportChatBubble";


interface RootLayoutProps {
  children: React.ReactNode;
}

export function RootLayout({ children }: RootLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();

  // Cerrar el sidebar automáticamente cuando cambia la ruta (navegación)
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  return (
    <div className="flex flex-col min-h-screen bg-white relative">
      <Header toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} isSidebarOpen={isSidebarOpen} />
      
      <div className="flex flex-1 overflow-hidden relative">
        {/* Backdrop / Overlay */}
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-30 transition-opacity duration-300"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Overlaid Sidebar */}
        <div className={cn(
          "fixed inset-y-0 left-0 z-40 w-72 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out border-r border-slate-100 mt-16",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}>
          <Sidebar className="w-full h-full" />
        </div>

        <main className="flex-1 overflow-y-auto pt-8">
          <div className="min-h-full flex flex-col">
            <div className="flex-1 px-8">
              {children}
            </div>
            <Footer />
          </div>
        </main>
      </div>
      <SupportChatBubble />
    </div>
  );
}
