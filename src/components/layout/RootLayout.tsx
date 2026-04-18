import React, { useState } from "react";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import { Footer } from "./Footer";

interface RootLayoutProps {
  children: React.ReactNode;
}

export function RootLayout({ children }: RootLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex flex-col min-h-screen bg-[#f8f9fb]">
      <Header toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} isSidebarOpen={isSidebarOpen} />
      <div className="flex flex-1 overflow-hidden">
        <div className={`transition-all duration-300 ease-in-out flex-shrink-0 ${isSidebarOpen ? "w-64" : "w-0 opacity-0 overflow-hidden border-r-0"}`}>
          <Sidebar className="w-64" />
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
    </div>
  );
}
