import { Link, useNavigate } from "react-router-dom";
import { Search, Bell, User, MapPin, ShieldCheck, ShieldAlert } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/useAuthStore";
import { UserAvatar } from "@/components/UserAvatar";

export function Header({ toggleSidebar, isSidebarOpen }: { toggleSidebar?: () => void, isSidebarOpen?: boolean }) {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const handlePublicarClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (user && !user.isVerified) {
      e.preventDefault();
      alert("Debes verificar tu identidad primero para poder publicar herramientas.");
      navigate("/register/step-2");
    } else if (!user) {
      e.preventDefault();
      navigate("/register");
    } else {
      navigate("/profile?tab=publicar");
    }
  };
  return (
    <header className="sticky top-0 z-50 flex h-16 items-center justify-between border-b bg-white shadow-sm px-6">
      <div className="flex items-center gap-12">
        <Link to="/" className="flex items-center gap-2.5 group hover:opacity-80 transition-opacity whitespace-nowrap">
          <img src="/logo.jpeg" alt="RentTools Logo" className="h-8 w-8 object-cover rounded-md" />
          <div className="text-xl font-bold tracking-tight text-slate-900">
            Rent<span className="text-slate-600 font-medium">Tools</span>
          </div>
        </Link>
        <nav className="flex items-center gap-6">
          <a href="#" className="text-sm font-semibold text-primary border-b-2 border-primary py-5">Ubicación</a>
          <button 
            onClick={toggleSidebar}
            className={`text-sm transition-colors py-5 ${isSidebarOpen ? "font-semibold text-primary border-b-2 border-primary" : "font-medium text-slate-500 hover:text-slate-900 border-b-2 border-transparent"}`}
          >
            Categorías
          </button>
          <a href="#" className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors py-5 border-b-2 border-transparent">Mis Rentas</a>
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
            placeholder="Buscar maquinaria industrial..." 
            className="w-full bg-[#f3f4f6] pl-10 h-10 border-transparent rounded-full shadow-none focus-visible:ring-primary/20 focus-visible:border-primary/50"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Button 
          onClick={handlePublicarClick}
          className="rounded-full bg-primary hover:bg-primary/90 text-white font-semibold px-6 shadow-md shadow-primary/20"
        >
          Publicar
        </Button>
        <button className="flex h-9 w-9 items-center justify-center rounded-full text-slate-600 hover:bg-slate-100 transition-colors">
          <Bell className="h-5 w-5" />
        </button>
        
        {user ? (
          <div className="flex items-center gap-3 ml-2">
            <div className="flex flex-col items-end">
              <span className="text-sm font-semibold text-slate-900">Hola, {user.firstName}</span>
              {user.isVerified ? (
                <span className="flex items-center gap-1 text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full border border-green-200">
                  <ShieldCheck size={10} /> Cuenta Verificada
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[10px] font-bold text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded-full border border-yellow-200">
                  <ShieldAlert size={10} /> Verificación Pendiente
                </span>
              )}
            </div>
            <Link to="/profile" className="flex h-10 w-10 items-center justify-center rounded-full bg-[#eff6ff] text-blue-600 border border-blue-200 hover:bg-blue-100 transition-colors overflow-hidden">
              <UserAvatar
                firstName={user.firstName}
                lastName={user.lastName}
                profileImageUrl={user.profileImageUrl}
                textClassName="text-blue-600"
              />
            </Link>
          </div>
        ) : (
          <Link to="/login" className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-200 text-slate-700 hover:bg-slate-300 transition-colors">
            <User className="h-5 w-5" />
          </Link>
        )}
      </div>
    </header>
  );
}
