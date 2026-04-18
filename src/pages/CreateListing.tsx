import { Package, MapPin, Image as ImageIcon, ShieldCheck, Wrench, Upload, CloudUpload } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function CreateListing() {
  return (
    <div className="container mx-auto max-w-4xl py-10 px-4 space-y-8">
      {/* Información Básica */}
      <Card className="border-none shadow-sm bg-white">
        <CardHeader className="flex flex-row items-center gap-2 space-y-0 pb-6">
          <div className="bg-orange-100 p-2 rounded-lg">
            <Package className="h-5 w-5 text-primary" />
          </div>
          <CardTitle className="text-xl font-bold text-slate-800">Información Básica</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="tool-name" className="text-slate-600 font-semibold">Nombre de la Herramienta</Label>
            <Input id="tool-name" placeholder="ej., Martillo Combinado Hilti TE 70-ATC/AVR" className="bg-[#f3f4f6] border-transparent rounded-lg h-12 focus-visible:ring-primary/20" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-slate-600 font-semibold">Marca</Label>
              <Select>
                <SelectTrigger className="bg-[#f3f4f6] border-transparent rounded-lg h-12 focus:ring-primary/20">
                  <SelectValue placeholder="Seleccionar Marca" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hilti">Hilti</SelectItem>
                  <SelectItem value="dewalt">DeWalt</SelectItem>
                  <SelectItem value="milwaukee">Milwaukee</SelectItem>
                  <SelectItem value="makita">Makita</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-slate-600 font-semibold">Categoría</Label>
              <Select>
                <SelectTrigger className="bg-[#f3f4f6] border-transparent rounded-lg h-12 focus:ring-primary/20">
                  <SelectValue placeholder="Seleccionar Categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="drills">Taladros y Martillos</SelectItem>
                  <SelectItem value="saws">Sierras</SelectItem>
                  <SelectItem value="generators">Generadores</SelectItem>
                  <SelectItem value="access">Acceso y Elevación</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-slate-600 font-semibold">Descripción Detallada</Label>
            <Textarea id="description" placeholder="Incluye especificaciones técnicas, tipo de motor y accesorios incluidos..." className="bg-[#f3f4f6] border-transparent rounded-lg min-h-[120px] focus-visible:ring-primary/20" />
          </div>
        </CardContent>
      </Card>

      {/* Precio y Ubicación */}
      <Card className="border-none shadow-sm bg-white">
        <CardHeader className="flex flex-row items-center gap-2 space-y-0 pb-6">
          <div className="bg-orange-100 p-2 rounded-lg">
            <MapPin className="h-5 w-5 text-primary" />
          </div>
          <CardTitle className="text-xl font-bold text-slate-800">Precio y Ubicación</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="price" className="text-slate-600 font-semibold">Tarifa Diaria de Renta ($)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">$</span>
                <Input id="price" type="number" placeholder="0.00" className="bg-[#f3f4f6] border-transparent rounded-lg h-12 pl-8 focus-visible:ring-primary/20" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="address" className="text-slate-600 font-semibold">Dirección de Entrega y Devolución</Label>
              <Input id="address" placeholder="Ingresa la dirección completa" className="bg-[#f3f4f6] border-transparent rounded-lg h-12 focus-visible:ring-primary/20" />
            </div>
          </div>

          <div className="relative rounded-xl overflow-hidden h-[300px] bg-slate-100 border border-slate-200 group">
             {/* Marcador de Mapa */}
            <div className="absolute inset-0 bg-[url('https://maps.googleapis.com/maps/api/staticmap?center=40.712776,-74.005974&zoom=13&size=800x400&sensor=false')] bg-cover bg-center grayscale opacity-80" />
            <div className="absolute inset-0 flex items-center justify-center">
               <Button className="bg-slate-900 hover:bg-black text-white rounded-full px-6 gap-2">
                 <MapPin className="h-4 w-4 text-primary" />
                 Establecer Ubicación
               </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Archivos Multimedia */}
      <Card className="border-none shadow-sm bg-white">
        <CardHeader className="flex flex-row items-center gap-2 space-y-0 pb-6">
          <div className="bg-orange-100 p-2 rounded-lg">
            <ImageIcon className="h-5 w-5 text-primary" />
          </div>
          <CardTitle className="text-xl font-bold text-slate-800">Archivos Multimedia</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border-2 border-dashed border-slate-200 rounded-xl p-12 text-center space-y-4 hover:bg-slate-50 transition-colors cursor-pointer group">
            <div className="bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto group-hover:bg-primary/10 transition-colors">
              <CloudUpload className="h-8 w-8 text-slate-400 group-hover:text-primary transition-colors" />
            </div>
            <div className="space-y-1">
              <p className="font-bold text-lg text-slate-700">Arrastra y suelta fotos de alta resolución</p>
              <p className="text-sm text-slate-500">Mínimo 3 fotos requeridas: Frontal, Lateral y Etiqueta de Serie. (Máx 10MB por archivo)</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Validación y Uso */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Validación de Propiedad */}
        <Card className="border-none shadow-sm bg-white">
          <CardHeader className="flex flex-row items-center gap-2 space-y-0 pb-6 border-l-4 border-l-primary rounded-tl-lg">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <CardTitle className="text-xl font-bold text-slate-800">Validación de Propiedad</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="serial" className="text-slate-600 font-semibold">Número de Serie</Label>
              <Input id="serial" placeholder="SN-XXXX-XXXX" className="bg-[#eef2ff] border-transparent rounded-lg h-12 focus-visible:ring-primary/20" />
            </div>
            <div className="bg-[#eef2ff] rounded-lg p-4 flex items-center justify-between group cursor-pointer hover:bg-[#e0e7ff] transition-colors border border-transparent hover:border-primary/20">
              <div className="flex items-center gap-3">
                <Upload className="h-5 w-5 text-slate-500" />
                <span className="text-slate-600 font-medium text-sm">Subir Factura/Comprobante</span>
              </div>
              <span className="text-primary font-bold text-xs tracking-wider uppercase">Explorar</span>
            </div>
          </CardContent>
        </Card>

        {/* Estado de Uso */}
        <Card className="border-none shadow-sm bg-white">
          <CardHeader className="flex flex-row items-center gap-2 space-y-0 pb-6 border-l-4 border-l-orange-400 rounded-tl-lg">
            <Wrench className="h-5 w-5 text-orange-400" />
            <CardTitle className="text-xl font-bold text-slate-800 leading-tight">Estado de Uso</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label className="text-slate-600 font-semibold">Nivel de Uso</Label>
              <Select>
                <SelectTrigger className="bg-[#eef2ff] border-transparent rounded-lg h-12 focus:ring-primary/20">
                  <SelectValue placeholder="Selecciona el nivel de uso" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Poco Uso (Como Nuevo)</SelectItem>
                  <SelectItem value="moderate">Uso Moderado</SelectItem>
                  <SelectItem value="high">Mucho Uso (Uso Intensivo)</SelectItem>
                  <SelectItem value="refurbished">Reconstruido</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Acciones del Footer */}
      <div className="flex flex-col items-end pt-8">
        <Button className="bg-primary hover:bg-primary/90 text-white font-bold h-14 px-12 rounded-xl text-lg shadow-lg shadow-primary/30 min-w-[240px]">
          Publicar Herramienta
        </Button>
      </div>

    </div>
  );
}
