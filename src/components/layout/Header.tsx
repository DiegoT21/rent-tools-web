import { Link, useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { Search, User, MapPin, ShieldCheck, ShieldAlert, LogOut } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/useAuthStore";
import { alerts } from "@/lib/alerts";
import { UserAvatar } from "@/components/UserAvatar";
import { NotificationBell } from "@/components/layout/NotificationBell";
import { useState, useEffect } from "react";

export function Header({ toggleSidebar, isSidebarOpen }: { toggleSidebar?: () => void, isSidebarOpen?: boolean }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, clearSession } = useAuthStore();
  const isAdmin = user?.role === 'admin' || user?.email === 'diegoorlando211170@gmail.com';
  const activeTab = searchParams.get("tab") || "users";
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") ?? "");

  useEffect(() => {
    setSearchQuery(searchParams.get("q") ?? "");
  }, [searchParams]);

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && searchQuery.trim()) {
      navigate(`/?q=${encodeURIComponent(searchQuery.trim())}`);
    }
    if (e.key === "Escape") {
      setSearchQuery("");
      navigate("/");
    }
  };

  const handlePublicarClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (user && !user.isVerified) {
      e.preventDefault();
      alerts.warning("Verificación requerida", "Debes verificar tu identidad primero para poder publicar herramientas.");
      navigate("/register/step-2");
    } else if (!user) {
      e.preventDefault();
      navigate("/register");
    } else {
      navigate("/profile?tab=publicar");
    }
  };

  const handleLogout = () => {
    clearSession();
    navigate("/login");
  };

  return (
    <header className="sticky top-0 z-50 flex h-16 items-center justify-between border-b bg-white shadow-sm px-6">
      <div className="flex items-center gap-12">
        <Link to="/" className="flex items-center gap-2.5 group hover:opacity-80 transition-opacity whitespace-nowrap">
          <img src="/logo.jpeg" alt="RentTools Logo" className="h-8 w-8 object-cover rounded-md" />
          <div className="text-xl font-bold tracking-tight text-slate-900">
            Rent<span className="text-primary">Tools</span>
          </div>
        </Link>
        {(!isAdmin || !location.pathname.startsWith("/admin")) && (
          <nav className="flex items-center gap-6">
            <Link
              to="/"
              className={`text-sm transition-colors py-5 border-b-2 ${
                location.pathname === "/"
                  ? "font-semibold text-primary border-primary"
                  : "font-medium text-slate-500 hover:text-slate-900 border-transparent"
              }`}
            >
              Ubicación
            </Link>
            <button 
              onClick={toggleSidebar}
              className={`text-sm transition-colors py-5 ${isSidebarOpen ? "font-semibold text-primary border-b-2 border-primary" : "font-medium text-slate-500 hover:text-slate-900 border-b-2 border-transparent"}`}
            >
              Categorías
            </button>
            <Link
              to="/my-rentals"
              id="nav-my-rentals"
              className={`text-sm transition-colors py-5 border-b-2 ${
                location.pathname === "/my-rentals"
                  ? "font-semibold text-primary border-primary"
                  : "font-medium text-slate-500 hover:text-slate-900 border-transparent"
              }`}
            >
              Alquileres
            </Link>
          </nav>
        )}
        {isAdmin && location.pathname.startsWith("/admin") && (
          <nav className="flex items-center gap-6">
            <button 
              onClick={() => navigate("/admin?tab=users")}
              className={`text-sm font-semibold transition-colors py-5 border-b-2 ${activeTab === "users" ? "text-primary border-primary" : "text-slate-500 hover:text-slate-900 border-transparent"}`}
            >
              Usuarios
            </button>
            <button 
              onClick={() => navigate("/admin?tab=audit")}
              className={`text-sm font-semibold transition-colors py-5 border-b-2 ${activeTab === "audit" ? "text-primary border-primary" : "text-slate-500 hover:text-slate-900 border-transparent"}`}
            >
              Auditoría
            </button>
            <button 
              onClick={() => navigate("/admin?tab=chat")}
              className={`text-sm font-semibold transition-colors py-5 border-b-2 ${activeTab === "chat" ? "text-primary border-primary" : "text-slate-500 hover:text-slate-900 border-transparent"}`}
            >
              Soporte
            </button>
          </nav>
        )}
      </div>

      {(!isAdmin || !location.pathname.startsWith("/admin")) && (
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
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearch}
            />
          </div>
        </div>
      )}

      <div className="flex items-center gap-4">
        {isAdmin && (
          location.pathname.startsWith("/admin") ? (
            <Button 
              onClick={() => navigate("/")}
              variant="outline"
              className="rounded-full border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold px-6"
            >
              Ver Sitio Web
            </Button>
          ) : (
            <Button 
              onClick={() => navigate("/admin")}
              className="rounded-full bg-red-600 hover:bg-red-700 text-white font-semibold px-6 shadow-md shadow-red-200"
            >
              Panel Admin
            </Button>
          )
        )}
        {!isAdmin && (
          <Button 
            onClick={handlePublicarClick}
            className="rounded-full bg-primary hover:bg-primary/90 text-white font-semibold px-6 shadow-md shadow-primary/20"
          >
            Publicar
          </Button>
        )}
        {user && !isAdmin ? <NotificationBell /> : null}
        
        {user ? (
          <div className="flex items-center gap-3 ml-2">
            <div className="flex flex-col items-end">
              <span className="text-sm font-semibold text-slate-900">Hola, {user.firstName}</span>
              {isAdmin ? (
                <span className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
                  Administrador
                </span>
              ) : user.isVerified ? (
                <span className="flex items-center gap-1 text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full border border-green-200">
                  <ShieldCheck size={10} /> Cuenta Verificada
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[10px] font-bold text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded-full border border-yellow-200">
                  <ShieldAlert size={10} /> Verificación Pendiente
                </span>
              )}
            </div>
            {isAdmin ? (
              <button
                onClick={handleLogout}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition-colors"
                title="Cerrar Sesión"
              >
                <LogOut className="h-5 w-5" />
              </button>
            ) : (
              <Link to="/profile" className="flex h-10 w-10 items-center justify-center rounded-full bg-[#eff6ff] text-blue-600 border border-blue-200 hover:bg-blue-100 transition-colors overflow-hidden">
                <UserAvatar
                  firstName={user.firstName}
                  lastName={user.lastName}
                  profileImageUrl={user.profileImageUrl}
                  textClassName="text-blue-600"
                />
              </Link>
            )}
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
