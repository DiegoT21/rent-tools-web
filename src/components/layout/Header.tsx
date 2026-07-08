import { Link, useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { Search, User, ShieldCheck, ShieldAlert, LogOut, Menu, X, Package, LayoutDashboard } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/useAuthStore";
import { authService } from "@/services/authService";
import { alerts } from "@/lib/alerts";
import { UserAvatar } from "@/components/UserAvatar";
import { NotificationBell } from "@/components/layout/NotificationBell";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { isAdminUser } from "@/lib/isAdmin";

export function Header({ toggleSidebar, isSidebarOpen }: { toggleSidebar?: () => void; isSidebarOpen?: boolean }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuthStore();
  const isAdmin = isAdminUser(user);
  const activeTab = searchParams.get("tab") || "users";
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") ?? "");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const isAdminRoute = location.pathname.startsWith("/admin");
  const showPublicNav = !isAdmin || !isAdminRoute;

  useEffect(() => {
    setSearchQuery(searchParams.get("q") ?? "");
  }, [searchParams]);

  useEffect(() => {
    setMobileMenuOpen(false);
    setMobileSearchOpen(false);
  }, [location.pathname]);

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && searchQuery.trim()) {
      navigate(`/?q=${encodeURIComponent(searchQuery.trim())}`);
      setMobileSearchOpen(false);
    }
    if (e.key === "Escape") {
      setSearchQuery("");
      navigate("/");
      setMobileSearchOpen(false);
    }
  };

  const handlePublicarClick = () => {
    setMobileMenuOpen(false);
    if (user && !user.isVerified) {
      alerts.warning("Verificación requerida", "Debes verificar tu identidad primero para poder publicar herramientas.");
      navigate("/register/step-2");
    } else if (!user) {
      navigate("/login", { state: { from: "/profile?tab=publicar" } });
    } else {
      navigate("/profile?tab=publicar");
    }
  };

  const handleLogout = () => {
    void authService.logout();
  };

  const navLinkClass = (active: boolean) =>
    cn(
      "text-sm transition-colors py-2 lg:py-5 border-b-2",
      active
        ? "font-semibold text-primary border-primary"
        : "font-medium text-slate-500 hover:text-slate-900 border-transparent",
    );

  const searchInput = (
    <div className="relative w-full">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <Input
        type="search"
        placeholder="Buscar maquinaria..."
        className="w-full bg-[#f3f4f6] pl-10 h-10 border-transparent rounded-full shadow-none focus-visible:ring-primary/20 focus-visible:border-primary/50"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        onKeyDown={handleSearch}
      />
    </div>
  );

  return (
    <header className="sticky top-0 z-50 border-b bg-white shadow-sm">
      <div className="flex h-14 items-center justify-between gap-2 px-4 sm:px-6 lg:h-16">
        <div className="flex min-w-0 items-center gap-2 lg:gap-12">
          <button
            type="button"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-lg text-slate-600 hover:bg-slate-100 lg:hidden"
            onClick={() => setMobileMenuOpen((v) => !v)}
            aria-label="Abrir menú"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          <Link to="/" className="flex min-w-0 items-center gap-2 transition-opacity hover:opacity-80">
            <img src="/logo.jpeg" alt="RentTools Logo" className="h-8 w-8 shrink-0 rounded-md object-cover" />
            <div className="hidden truncate text-lg font-bold tracking-tight text-slate-900 min-[380px]:block sm:text-xl">
              Rent<span className="text-primary">Tools</span>
            </div>
          </Link>

          {showPublicNav && (
            <nav className="hidden items-center gap-6 lg:flex">
              <button type="button" onClick={toggleSidebar} className={navLinkClass(Boolean(isSidebarOpen))}>
                Categorías
              </button>
            </nav>
          )}

          {isAdmin && isAdminRoute && (
            <nav className="hidden items-center gap-4 md:gap-6 lg:flex">
              <button onClick={() => navigate("/admin?tab=users")} className={navLinkClass(activeTab === "users")}>
                Usuarios
              </button>
              <button onClick={() => navigate("/admin?tab=audit")} className={navLinkClass(activeTab === "audit")}>
                Auditoría
              </button>
              <button onClick={() => navigate("/admin?tab=chat")} className={navLinkClass(activeTab === "chat")}>
                Soporte
              </button>
              <button onClick={() => navigate("/admin?tab=disputes")} className={navLinkClass(activeTab === "disputes")}>
                Disputas
              </button>
              <button onClick={() => navigate("/admin?tab=catalog")} className={navLinkClass(activeTab === "catalog")}>
                Catálogo
              </button>
              <button onClick={() => navigate("/admin?tab=listings")} className={navLinkClass(activeTab === "listings")}>
                Publicaciones
              </button>
            </nav>
          )}
        </div>

        {showPublicNav && (
          <div className="hidden flex-1 items-center justify-center px-4 xl:flex xl:px-8">
            <div className="w-full max-w-xl">{searchInput}</div>
          </div>
        )}

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          {showPublicNav && (
            <button
              type="button"
              className="grid h-10 w-10 place-items-center rounded-full text-slate-600 hover:bg-slate-100 xl:hidden"
              onClick={() => setMobileSearchOpen((v) => !v)}
              aria-label="Buscar"
            >
              <Search className="h-5 w-5" />
            </button>
          )}

          {isAdmin && (
            <Button
              onClick={() => navigate(isAdminRoute ? "/" : "/admin")}
              variant={isAdminRoute ? "outline" : "default"}
              className={cn(
                "hidden rounded-full font-semibold sm:inline-flex",
                isAdminRoute
                  ? "border-slate-200 text-slate-700 hover:bg-slate-50"
                  : "bg-red-600 text-white hover:bg-red-700 shadow-md shadow-red-200",
              )}
            >
              {isAdminRoute ? "Ver Sitio" : "Admin"}
            </Button>
          )}

          {!isAdmin && (
            <Button
              onClick={handlePublicarClick}
              className="hidden rounded-full bg-primary px-4 font-semibold text-white shadow-md shadow-primary/20 hover:bg-primary/90 sm:inline-flex sm:px-6"
            >
              Publicar
            </Button>
          )}

          {user && !isAdmin ? <NotificationBell /> : null}

          {user ? (
            <div className="flex items-center gap-1.5 sm:gap-2">
              <div className="hidden flex-col items-end md:flex">
                <span className="max-w-[120px] truncate text-sm font-semibold text-slate-900 lg:max-w-none">
                  Hola, {user.firstName}
                </span>
                {isAdmin ? (
                  <span className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
                    Administrador
                  </span>
                ) : user.isVerified ? (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full border border-green-200">
                    <ShieldCheck size={10} /> Verificada
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded-full border border-yellow-200">
                    <ShieldAlert size={10} /> Pendiente
                  </span>
                )}
              </div>
              {isAdmin && isAdminRoute ? (
                <button
                  onClick={handleLogout}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
                  title="Cerrar sesión"
                  aria-label="Cerrar sesión"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              ) : (
                <Link
                  to="/profile"
                  className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-primary/30 bg-[#eff6ff] text-blue-600 ring-2 ring-primary/10 hover:bg-blue-100"
                  title="Mi perfil"
                  aria-label="Mi perfil"
                >
                  <UserAvatar
                    firstName={user.firstName}
                    lastName={user.lastName}
                    profileImageUrl={user.profileImageUrl}
                    textClassName="text-sm font-bold text-blue-600"
                  />
                </Link>
              )}
            </div>
          ) : (
            <Link
              to="/login"
              className="flex h-10 shrink-0 items-center gap-1.5 rounded-full bg-primary px-3 text-white hover:bg-primary/90 sm:px-4"
              aria-label="Iniciar sesión"
            >
              <User className="h-4 w-4 shrink-0" />
              <span className="hidden text-sm font-semibold min-[380px]:inline">Entrar</span>
            </Link>
          )}
        </div>
      </div>

      {showPublicNav && mobileSearchOpen && (
        <div className="border-t border-slate-100 px-4 py-3 xl:hidden">{searchInput}</div>
      )}

      {mobileMenuOpen && (
        <>
          <div className="fixed inset-0 top-14 z-40 bg-slate-900/40 lg:hidden" onClick={() => setMobileMenuOpen(false)} />
          <div className="absolute left-0 right-0 top-full z-50 border-b border-slate-200 bg-white px-4 py-4 shadow-lg lg:hidden">
            <nav className="flex flex-col gap-1">
              {showPublicNav ? (
                <>
                  {user ? (
                    <div className="mb-3 rounded-xl border border-slate-100 bg-slate-50 p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-primary/30 bg-[#eff6ff]">
                          <UserAvatar
                            firstName={user.firstName}
                            lastName={user.lastName}
                            profileImageUrl={user.profileImageUrl}
                            textClassName="text-sm font-bold text-blue-600"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-bold text-slate-900">
                            {user.firstName} {user.lastName}
                          </p>
                          <p className="truncate text-xs text-slate-500">{user.email}</p>
                        </div>
                      </div>
                      <div className="mt-3 grid gap-1">
                        <Link
                          to="/profile"
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-slate-800 hover:bg-white"
                        >
                          <User className="h-4 w-4 text-primary" />
                          Mi perfil
                        </Link>
                        {!isAdmin && (
                          <Link
                            to="/my-rentals"
                            onClick={() => setMobileMenuOpen(false)}
                            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-slate-800 hover:bg-white"
                          >
                            <Package className="h-4 w-4 text-primary" />
                            Mis alquileres
                          </Link>
                        )}
                        {isAdmin && (
                          <Link
                            to="/admin"
                            onClick={() => setMobileMenuOpen(false)}
                            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-slate-800 hover:bg-white"
                          >
                            <LayoutDashboard className="h-4 w-4 text-red-600" />
                            Panel admin
                          </Link>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setMobileMenuOpen(false);
                            handleLogout();
                          }}
                          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-red-600 hover:bg-white"
                        >
                          <LogOut className="h-4 w-4" />
                          Cerrar sesión
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="mb-3 grid gap-2">
                      <Link
                        to="/login"
                        onClick={() => setMobileMenuOpen(false)}
                        className="rounded-xl bg-primary px-4 py-3 text-center text-sm font-bold text-white"
                      >
                        Iniciar sesión
                      </Link>
                      <Link
                        to="/register"
                        onClick={() => setMobileMenuOpen(false)}
                        className="rounded-xl border border-slate-200 px-4 py-3 text-center text-sm font-semibold text-slate-700"
                      >
                        Crear cuenta
                      </Link>
                    </div>
                  )}

                  <button
                    type="button"
                    className="rounded-xl px-4 py-3 text-left text-sm font-semibold text-slate-700 hover:bg-slate-50"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      toggleSidebar?.();
                    }}
                  >
                    Categorías
                  </button>
                  {!isAdmin && (
                    <button
                      type="button"
                      className="mt-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-white"
                      onClick={handlePublicarClick}
                    >
                      Publicar herramienta
                    </button>
                  )}
                </>
              ) : (
                <>
                  <button onClick={() => { navigate("/admin?tab=users"); setMobileMenuOpen(false); }} className="rounded-xl px-4 py-3 text-left text-sm font-semibold text-slate-700 hover:bg-slate-50">
                    Usuarios
                  </button>
                  <button onClick={() => { navigate("/admin?tab=audit"); setMobileMenuOpen(false); }} className="rounded-xl px-4 py-3 text-left text-sm font-semibold text-slate-700 hover:bg-slate-50">
                    Auditoría
                  </button>
                  <button onClick={() => { navigate("/admin?tab=chat"); setMobileMenuOpen(false); }} className="rounded-xl px-4 py-3 text-left text-sm font-semibold text-slate-700 hover:bg-slate-50">
                    Soporte
                  </button>
                  <button onClick={() => { navigate("/admin?tab=catalog"); setMobileMenuOpen(false); }} className="rounded-xl px-4 py-3 text-left text-sm font-semibold text-slate-700 hover:bg-slate-50">
                    Catálogo
                  </button>
                  <button onClick={() => { navigate("/admin?tab=listings"); setMobileMenuOpen(false); }} className="rounded-xl px-4 py-3 text-left text-sm font-semibold text-slate-700 hover:bg-slate-50">
                    Publicaciones
                  </button>
                  <button onClick={() => { navigate("/"); setMobileMenuOpen(false); }} className="mt-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700">
                    Ver sitio web
                  </button>
                </>
              )}
            </nav>
          </div>
        </>
      )}
    </header>
  );
}
