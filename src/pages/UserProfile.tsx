import { 
  User, 
  Package, 
  LifeBuoy, 
  FileText, 
  LogOut, 
  Edit3, 
  MoreHorizontal, 
  Star,
  MapPin,
  Calendar,
  Plus,
  ArrowUpRight,
  Search,
  SlidersHorizontal,
  ChevronDown,
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
import { useAuthStore } from "@/store/useAuthStore";

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
  const { user, clearAuth } = useAuthStore();

  const handleLogout = () => {
    clearAuth();
    navigate("/login");
  };

  const setActiveTab = (tab: string) => {
    setSearchParams({ tab });
  };

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
      <main className="flex-1">
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
                          <p className="text-xl font-bold text-slate-900">0</p>
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
                      +2 esta semana
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Publicaciones</p>
                    <p className="text-4xl font-black text-slate-900">48</p>
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
                      82% utilización
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Actualmente Alquilados</p>
                    <p className="text-4xl font-black text-slate-900">32</p>
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
                      +12% vs mes pasado
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Ingresos del mes</p>
                    <p className="text-4xl font-black text-slate-900">$14,250</p>
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
              {inventoryItems.map((item) => (
                <Card key={item.id} className={cn("border-none shadow-sm bg-white overflow-hidden border-l-4", item.borderColor)}>
                  <CardContent className="p-6 flex flex-col md:flex-row items-center gap-6">
                    {/* Imagen/Icono representativo */}
                    <div className={cn("w-20 h-20 rounded-2xl flex items-center justify-center shrink-0", item.iconBg)}>
                      <item.icon className="h-10 w-10" />
                    </div>

                    <div className="flex-1 space-y-1 text-center md:text-left">
                      <h3 className="text-xl font-bold text-slate-900">{item.name}</h3>
                      <p className="text-[10px] font-black text-slate-400 tracking-widest uppercase">{item.category}</p>
                    </div>

                    <div className="w-full md:w-48 space-y-2">
                      <div className="flex justify-between items-center text-[10px] font-bold">
                        <Badge variant="outline" className={cn("rounded-full px-3 py-0.5", item.statusColor)}>
                          <span className="h-1.5 w-1.5 rounded-full bg-current mr-2 inline-block" />
                          {item.status}
                        </Badge>
                      </div>
                      <Progress value={item.status === "Disponible" ? 100 : item.status === "Alquilado" ? 60 : 30} className="h-1.5 bg-slate-100" />
                    </div>

                    <div className="text-center md:text-right px-8 border-x border-slate-50">
                      <p className="text-2xl font-black text-slate-900">${item.price}<span className="text-xs text-slate-400 font-bold"> /día</span></p>
                      <p className="text-[10px] font-bold text-primary uppercase tracking-tight flex items-center justify-center md:justify-end gap-1">
                        <ArrowUpRight className="h-3 w-3" />
                        {item.stats}
                      </p>
                    </div>

                    <div className="flex gap-2 shrink-0">
                      <Button variant="ghost" size="icon" className="rounded-full text-slate-400 hover:text-primary hover:bg-orange-50">
                        <Pencil className="h-5 w-5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="rounded-full text-slate-400 hover:bg-slate-50">
                        {item.status === "Mantenimiento" ? <Play className="h-5 w-5" /> : <Pause className="h-5 w-5" />}
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
              <Button variant="secondary" className="bg-orange-50 text-primary font-bold h-12 px-8 rounded-xl hover:bg-orange-100 transition-colors">
                Cargar más herramientas
              </Button>
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
