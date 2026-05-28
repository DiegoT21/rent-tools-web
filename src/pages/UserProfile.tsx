import { 
  User, 
  Package, 
  LifeBuoy, 
  FileText, 
  LogOut, 
  Edit3, 
  MoreHorizontal, 
  Star,
  ShieldCheck,
  MapPin,
  Calendar,
  Plus,
  ArrowUpRight,
  Search,
  SlidersHorizontal,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Pause,
  Trash2,
  Play,
  Hammer,
  Zap,
  Scissors,
  Wrench
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CreateListing } from "./CreateListing";
import { useAuthStore } from "@/store/authStore";
import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";

function safeParseDate(value: unknown): Date | null {
  if (typeof value === "string" || typeof value === "number") {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  return null;
}

function ImageCarousel({ images, alt }: { images: string[]; alt: string }) {
  const pics = (images || []).filter(Boolean).slice(0, 3);
  const [index, setIndex] = useState(0);

  if (pics.length === 0) {
    return (
      <div className="w-20 h-20 rounded-2xl flex items-center justify-center shrink-0 bg-slate-100 text-slate-900">
        <Wrench className="h-10 w-10" />
      </div>
    );
  }

  const prev = () => setIndex((i) => (i - 1 + pics.length) % pics.length);
  const next = () => setIndex((i) => (i + 1) % pics.length);

  return (
    <div className="w-20 shrink-0">
      <div className="relative w-20 h-20 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200">
        <img src={pics[index]} alt={alt} className="w-full h-full object-cover" />

        {pics.length > 1 && (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                prev();
              }}
              className="absolute left-1 top-1/2 -translate-y-1/2 h-7 w-7 rounded-full bg-white/90 border border-slate-200 text-slate-700 hover:bg-white grid place-items-center"
              aria-label="Imagen anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                next();
              }}
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 rounded-full bg-white/90 border border-slate-200 text-slate-700 hover:bg-white grid place-items-center"
              aria-label="Imagen siguiente"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </>
        )}
      </div>
      {pics.length > 1 && (
        <div className="mt-1 flex items-center justify-center gap-1">
          {pics.map((_, i) => (
            <span key={i} className={cn("h-1.5 w-1.5 rounded-full", i === index ? "bg-primary" : "bg-slate-200")} />
          ))}
        </div>
      )}
    </div>
  );
}

const menuItems = [
  { id: "perfil", label: "Mi Perfil", icon: User },
  { id: "inventario", label: "Mi Inventario", icon: Package },
  { id: "solicitudes", label: "Solicitudes", icon: FileText },
  { id: "soporte", label: "Soporte", icon: LifeBuoy },
];

const inventoryItems = [
  {
    id: 1,
    name: "Rotomartillo Industrial XT-200",
    category: "PERFORACIÓN PESADA",
    status: "Disponible",
    statusColor: "bg-teal-50 text-teal-600 border-teal-100",
    barColor: "bg-teal-500",
    price: "45.00",
    stats: "12 alquileres este mes",
    icon: Hammer,
    iconBg: "bg-green-100 text-green-600",
    borderColor: "border-l-teal-500"
  },
  {
    id: 2,
    name: "Generador Eléctrico 5500W",
    category: "ENERGÍA PORTÁTIL",
    status: "Alquilado",
    statusColor: "bg-orange-50 text-orange-600 border-orange-100",
    barColor: "bg-orange-500",
    price: "120.00",
    stats: "5 alquileres este mes",
    icon: Zap,
    iconBg: "bg-slate-100 text-slate-900",
    borderColor: "border-l-orange-500"
  },
  {
    id: 3,
    name: "Sierra Circular Pro-Cut 7\"",
    category: "CARPINTERÍA",
    status: "Mantenimiento",
    statusColor: "bg-slate-100 text-slate-500 border-slate-200",
    barColor: "bg-slate-300",
    price: "30.00",
    stats: "Inactivo por servicio",
    icon: Scissors,
    iconBg: "bg-orange-500 text-white",
    borderColor: "border-l-slate-400"
  }
];

export function UserProfile() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "perfil";
  const navigate = useNavigate();
  const { user, accessToken, clearSession } = useAuthStore();
  const [inventory, setInventory] = useState<any[]>([]);
  const [inventoryLoading, setInventoryLoading] = useState(false);
  const [inventoryError, setInventoryError] = useState<string | null>(null);
  const [inventoryPage, setInventoryPage] = useState(1);
  const [inventoryTotal, setInventoryTotal] = useState<number>(0);
  const [inventoryTotalPages, setInventoryTotalPages] = useState<number>(1);
  const [inventorySearch, setInventorySearch] = useState("");

  // Redirigir a login si no hay usuario (protección de ruta)
  useEffect(() => {
    if (!accessToken) {
      navigate("/login");
    }
  }, [accessToken, navigate]);

  const handleLogout = () => {
    clearSession();
    navigate("/login");
  };

  const setActiveTab = (tab: string) => {
    setSearchParams({ tab });
  };

  const fetchInventoryPage = async (opts: { page: number; mode: "replace" | "append" }) => {
    if (!accessToken) return;

    setInventoryLoading(true);
    setInventoryError(null);
    try {
      const response = await api.get("/tools/me", { params: { page: opts.page } });
      const payload = response.data;
      const tools = Array.isArray(payload?.data) ? payload.data : [];
      const pagination = payload?.pagination;

      setInventory((prev) => (opts.mode === "append" ? [...prev, ...tools] : tools));
      setInventoryPage(Number(pagination?.page ?? opts.page));
      setInventoryTotal(Number(pagination?.total ?? tools.length));
      setInventoryTotalPages(Number(pagination?.totalPages ?? 1));
    } catch (err: any) {
      setInventory([]);
      setInventoryError(err?.response?.data?.message || "No se pudo cargar tu inventario.");
      setInventoryPage(1);
      setInventoryTotal(0);
      setInventoryTotalPages(1);
    } finally {
      setInventoryLoading(false);
    }
  };

  // Carga inventario para: (a) tab inventario (lista) y (b) tab perfil (conteo de publicaciones)
  useEffect(() => {
    if (!accessToken) return;
    if (activeTab !== "inventario" && activeTab !== "perfil") return;
    fetchInventoryPage({ page: 1, mode: "replace" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, accessToken]);

  const inventoryCards = useMemo(() => {
    const query = inventorySearch.trim().toLowerCase();
    const filtered = query
      ? inventory.filter((t) => (t?.name || "").toString().toLowerCase().includes(query))
      : inventory;

    return filtered.map((tool) => {
      const key = tool?._id || tool?.id || tool?.uuid || tool?.name || crypto.randomUUID();
      const available = tool?.isAvailable !== false;
      const status = available ? "Disponible" : "No disponible";
      const statusColor = available
        ? "bg-teal-50 text-teal-600 border-teal-100"
        : "bg-slate-100 text-slate-500 border-slate-200";
      const borderColor = available ? "border-l-teal-500" : "border-l-slate-400";
      const price = typeof tool?.pricePerDay === "number" ? tool.pricePerDay.toFixed(2) : "--";
      const category = (tool?.category || "Sin categorÃ­a").toString().toUpperCase();
      const images = Array.isArray(tool?.imageUrls) ? tool.imageUrls : Array.isArray(tool?.images) ? tool.images : [];

      return { key, tool, available, status, statusColor, borderColor, price, category, images };
    });
  }, [inventory, inventorySearch]);

  const metrics = useMemo(() => {
    const totalPublicaciones = inventoryTotal || inventory.length;
    const alquilados = inventory.filter((t) => t?.isAvailable === false).length;

    // Ingresos: hasta que el backend provea métricas de rentas/pagos, se queda en 0.
    const ingresosMes = 0;

    // Publicaciones esta semana (y delta vs semana anterior) si existe createdAt
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startThisWeek = new Date(startOfToday);
    startThisWeek.setDate(startThisWeek.getDate() - 7);
    const startPrevWeek = new Date(startOfToday);
    startPrevWeek.setDate(startPrevWeek.getDate() - 14);

    const createdDates = inventory
      .map((t) => safeParseDate(t?.createdAt))
      .filter((d): d is Date => Boolean(d));

    const thisWeekCount = createdDates.filter((d) => d >= startThisWeek && d < startOfToday).length;
    const prevWeekCount = createdDates.filter((d) => d >= startPrevWeek && d < startThisWeek).length;

    let publicacionesBadge: string | null = null;
    if (createdDates.length > 0) {
      if (thisWeekCount === prevWeekCount) publicacionesBadge = `${thisWeekCount} esta semana`;
      else {
        const diff = thisWeekCount - prevWeekCount;
        publicacionesBadge = `${diff > 0 ? "+" : ""}${diff} vs semana pasada`;
      }
    } else {
      publicacionesBadge = `${totalPublicaciones} en total`;
    }

    const utilizacion = totalPublicaciones > 0 ? Math.round((alquilados / totalPublicaciones) * 100) : 0;
    const utilizacionBadge = `${utilizacion}% utilizaciÃ³n`;

    const ingresosBadge = "+0% vs mes pasado";

    return {
      totalPublicaciones,
      alquilados,
      ingresosMes,
      publicacionesBadge,
      utilizacionBadge,
      ingresosBadge,
    };
  }, [inventory]);

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 flex gap-8 min-h-[calc(100vh-140px)]">
      {/* Sidebar de Usuario */}
      <aside className="w-64 flex-shrink-0 space-y-2">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden p-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-semibold transition-all duration-200",
                activeTab === item.id 
                  ? "bg-[#eef2ff] text-primary shadow-sm" 
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <item.icon className={cn("h-5 w-5", activeTab === item.id ? "text-primary" : "text-slate-400")} />
              {item.label}
            </button>
          ))}
          
          <div className="mt-4 pt-4 border-t border-slate-100">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-semibold text-red-500 hover:bg-red-50 transition-all duration-200"
            >
              <LogOut className="h-5 w-5" />
              Cerrar Sesión
            </button>
          </div>
        </div>
      </aside>

      {/* Área de Contenido Principal */}
      <main className="flex-1 space-y-6">
        {activeTab === "perfil" && !user?.isVerified && (
          <Card className="border-none shadow-sm bg-gradient-to-r from-orange-500 to-orange-600 text-white overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
              <ShieldCheck size={120} />
            </div>
            <CardContent className="p-6 relative z-10">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-white/20 hover:bg-white/30 text-white border-none font-bold">
                      PASO 2 DE 3
                    </Badge>
                    <span className="text-sm font-medium text-orange-100 italic">Identidad pendiente</span>
                  </div>
                  <h2 className="text-2xl font-black tracking-tight">Casi listo para rentar tus equipos</h2>
                  <p className="text-orange-100 text-sm font-medium max-w-md">
                    Completa tu verificación de identidad para poder publicar tus herramientas y empezar a generar ingresos hoy mismo.
                  </p>
                </div>
                
                <div className="flex flex-col items-center md:items-end gap-3 w-full md:w-auto">
                  <div className="w-full md:w-48 space-y-1.5">
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-wider">
                      <span>Progreso</span>
                      <span>66%</span>
                    </div>
                    <Progress value={66} className="h-2 bg-white/20" />
                  </div>
                  <Button 
                    onClick={() => navigate("/register/step-2")}
                    className="w-full md:w-auto bg-white text-orange-600 hover:bg-orange-50 font-bold px-8 h-11 rounded-xl shadow-lg shadow-black/10 transition-all active:scale-95"
                  >
                    Verificar ahora
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === "perfil" && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <Card className="border-none shadow-sm overflow-hidden bg-white">
              <CardContent className="p-8">
                <div className="flex items-start justify-between">
                  <div className="flex gap-6">
                    <div className="relative">
                      <div className="h-28 w-28 rounded-full bg-slate-200 overflow-hidden border-4 border-white shadow-md">
                        <img 
                          src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=1760&auto=format&fit=crop" 
                          alt="Avatar" 
                          className="h-full w-full object-cover"
                        />
                      </div>
                    </div>
                    <div className="space-y-3 pt-2">
                      <div className="space-y-1">
                        <h1 className="text-2xl font-bold text-slate-900">
                          {user ? `${user.firstName} ${user.lastName || ''}` : 'Invitado'}
                        </h1>
                        <div className="flex items-center gap-4 text-sm text-slate-500 font-medium">
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            <span>Panamá Oeste, Panamá</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            <span>Miembro desde 2024</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-8 pt-2">
                        <div className="text-center">
                          <p className="text-xl font-bold text-slate-900">0 <Star className="h-4 w-4 inline text-slate-400 mb-1" /></p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Calificación</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xl font-bold text-slate-900">0</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Rentas</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xl font-bold text-slate-900">{metrics.totalPublicaciones}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Publicaciones</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" className="rounded-full gap-2 font-bold px-6 text-slate-700">
                      <Edit3 className="h-4 w-4" />
                      Editar Perfil
                    </Button>
                    <Button variant="ghost" size="icon" className="rounded-full text-slate-400">
                      <MoreHorizontal className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm min-h-[400px] bg-white flex items-center justify-center">
              <CardContent className="text-center space-y-6 max-w-sm">
                <div className="relative">
                  <div className="w-48 h-32 bg-slate-50 rounded-lg mx-auto transform -rotate-3 border border-slate-100 flex flex-col p-4 gap-2">
                    <div className="w-1/2 h-2 bg-slate-200 rounded-full" />
                    <div className="w-3/4 h-2 bg-slate-100 rounded-full" />
                    <div className="flex gap-1 mt-2">
                      {[1,2,3,4].map(i => <Star key={i} className="h-4 w-4 text-orange-200 fill-orange-100" />)}
                      <Star key={5} className="h-4 w-4 text-slate-200" />
                    </div>
                  </div>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-32 bg-white rounded-lg border shadow-xl flex flex-col p-4 gap-2 transform rotate-3">
                     <div className="w-1/2 h-2 bg-slate-100 rounded-full" />
                     <div className="w-3/4 h-2 bg-slate-50 rounded-full" />
                     <div className="flex gap-1 mt-2">
                       {[1,2,3,4].map(i => <Star key={i} className="h-4 w-4 text-orange-400 fill-orange-400" />)}
                       <Star key={5} className="h-4 w-4 text-slate-200" />
                     </div>
                  </div>
                </div>
                <div className="space-y-2 pt-8">
                  <h3 className="text-xl font-bold text-slate-900">Aún no tienes reviews</h3>
                  <p className="text-sm text-slate-500 font-medium">
                    Los reviews ayudan a mantener nuestra comunidad confiable y segura. Empieza a rentar para que otros te conozcan.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "inventario" && (
          <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
            {/* Cabecera y Título */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  Cuenta <span className="text-[8px]">●</span> Inventario
                </p>
                <h1 className="text-4xl font-black text-slate-900 tracking-tight">Mi Inventario</h1>
              </div>
              <Button 
                onClick={() => setActiveTab("publicar")}
                className="bg-orange-500 hover:bg-orange-600 text-white font-bold h-12 px-8 rounded-xl shadow-lg shadow-orange-200 gap-2"
              >
                <Plus className="h-5 w-5" />
                Publicar
              </Button>
            </div>

            {/* Tarjetas de Estadísticas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="border-none shadow-sm bg-[#fafaff] relative overflow-hidden group">
                <CardContent className="p-6 space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="bg-orange-100 p-2.5 rounded-lg">
                      <Package className="h-5 w-5 text-primary" />
                    </div>
                    <Badge variant="secondary" className="bg-orange-50 text-orange-600 border-none font-bold text-[10px]">
                      {metrics.publicacionesBadge}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Publicaciones</p>
                    <p className="text-4xl font-black text-slate-900">{metrics.totalPublicaciones}</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm bg-[#fafaff] relative overflow-hidden">
                <CardContent className="p-6 space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="bg-orange-100 p-2.5 rounded-lg">
                      <Wrench className="h-5 w-5 text-primary" />
                    </div>
                    <Badge variant="secondary" className="bg-orange-50 text-orange-600 border-none font-bold text-[10px]">
                      {metrics.utilizacionBadge}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Actualmente Alquilados</p>
                    <p className="text-4xl font-black text-slate-900">{metrics.alquilados}</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm bg-[#fafaff] relative overflow-hidden">
                <CardContent className="p-6 space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="bg-orange-100 p-2.5 rounded-lg">
                      <ArrowUpRight className="h-5 w-5 text-primary" />
                    </div>
                    <Badge variant="secondary" className="bg-orange-50 text-orange-600 border-none font-bold text-[10px]">
                      {metrics.ingresosBadge}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Ingresos del mes</p>
                    <p className="text-4xl font-black text-slate-900">${metrics.ingresosMes}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Filtros y Búsqueda */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <Input 
                  placeholder="Buscar equipo por nombre o ID..." 
                  className="pl-10 h-12 bg-slate-50 border-transparent rounded-xl focus-visible:ring-primary/20"
                  value={inventorySearch}
                  onChange={(e) => setInventorySearch(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" className="h-12 px-6 rounded-xl bg-slate-50 text-slate-600 font-bold gap-2">
                  <SlidersHorizontal className="h-4 w-4" />
                  Filtrar
                </Button>
                <Button variant="secondary" className="h-12 px-6 rounded-xl bg-slate-50 text-slate-600 font-bold gap-2">
                  <ChevronDown className="h-4 w-4" />
                  Ordenar
                </Button>
              </div>
            </div>

            {/* Lista de Productos */}
            <div className="space-y-4">
              {inventoryLoading && (
                <Card className="border-none shadow-sm bg-white">
                  <CardContent className="p-6 text-slate-600 font-semibold">
                    Cargando inventario...
                  </CardContent>
                </Card>
              )}

              {!inventoryLoading && inventoryError && (
                <Card className="border-none shadow-sm bg-white border border-red-100">
                  <CardContent className="p-6 text-red-600 font-semibold">
                    {inventoryError}
                  </CardContent>
                </Card>
              )}

              {!inventoryLoading && !inventoryError && inventoryCards.length === 0 && (
                <Card className="border-none shadow-sm bg-white">
                  <CardContent className="p-6 text-slate-600 font-semibold">
                    AÃºn no tienes herramientas publicadas.
                  </CardContent>
                </Card>
              )}
              {!inventoryLoading && !inventoryError && inventoryCards.map((item) => (
                <Card key={item.key} className={cn("border-none shadow-sm bg-white overflow-hidden border-l-4", item.borderColor)}>
                  <CardContent className="p-6 flex flex-col md:flex-row items-center gap-6">
                    {/* Imagen/Icono representativo */}
                    <ImageCarousel images={item.images} alt={item.tool?.name || "Herramienta"} />

                    <div className="flex-1 space-y-1 text-center md:text-left">
                      <h3 className="text-xl font-bold text-slate-900">{item.tool?.name || "Sin nombre"}</h3>
                      <p className="text-[10px] font-black text-slate-400 tracking-widest uppercase">{item.category}</p>
                    </div>

                    <div className="w-full md:w-48 space-y-2">
                      <div className="flex justify-between items-center text-[10px] font-bold">
                        <Badge variant="outline" className={cn("rounded-full px-3 py-0.5", item.statusColor)}>
                          <span className="h-1.5 w-1.5 rounded-full bg-current mr-2 inline-block" />
                          {item.status}
                        </Badge>
                      </div>
                      <Progress value={item.available ? 100 : 30} className="h-1.5 bg-slate-100" />
                    </div>

                    <div className="text-center md:text-right px-8 border-x border-slate-50">
                      <p className="text-2xl font-black text-slate-900">${item.price}<span className="text-xs text-slate-400 font-bold"> /día</span></p>
                      <p className="text-[10px] font-bold text-primary uppercase tracking-tight flex items-center justify-center md:justify-end gap-1">
                        <ArrowUpRight className="h-3 w-3" />
                        Publicada
                      </p>
                    </div>

                    <div className="flex gap-2 shrink-0">
                      <Button variant="ghost" size="icon" className="rounded-full text-slate-400 hover:text-primary hover:bg-orange-50">
                        <Pencil className="h-5 w-5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="rounded-full text-slate-400 hover:bg-slate-50">
                        {item.available ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                      </Button>
                      <Button variant="ghost" size="icon" className="rounded-full text-slate-400 hover:text-red-500 hover:bg-red-50">
                        <Trash2 className="h-5 w-5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="flex justify-center pt-4">
              {inventoryPage < inventoryTotalPages && (
                <Button
                  variant="secondary"
                  disabled={inventoryLoading}
                  onClick={() => fetchInventoryPage({ page: inventoryPage + 1, mode: "append" })}
                  className="bg-orange-50 text-primary font-bold h-12 px-8 rounded-xl hover:bg-orange-100 transition-colors"
                >
                  {inventoryLoading ? "Cargando..." : "Cargar más herramientas"}
                </Button>
              )}
            </div>
          </div>
        )}

        {activeTab === "publicar" && (
          <div className="animate-in slide-in-from-right-4 duration-500">
            <div className="mb-6 flex items-center gap-4">
              <Button 
                variant="ghost" 
                onClick={() => setActiveTab("inventario")}
                className="text-slate-500 hover:text-slate-900"
              >
                ← Volver al Inventario
              </Button>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">Publicar nueva herramienta</h1>
            </div>
            <CreateListing />
          </div>
        )}
      </main>
    </div>
  );
}
