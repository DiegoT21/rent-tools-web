import { useState } from "react";
import { Package, MapPin, Image as ImageIcon, ShieldCheck, Wrench, Upload, CloudUpload, Loader2 } from "lucide-react";
import { LocationPicker } from "@/components/LocationPicker";
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
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

export enum ToolUsageLevel {
  NEW = 'new',
  EXCELLENT = 'excellent',
  GOOD = 'good',
  FAIR = 'fair',
}

export function CreateListing() {
  const user = useAuthStore((state) => state.user);
  console.log("Usuario actual en el store:", user);
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState<{ address: string; lat: number; lng: number } | null>(null);
  const [selectedMediaFiles, setSelectedMediaFiles] = useState<File[]>([]);
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    brand: "",
    category: "",
    description: "",
    pricePerDay: "",
    serialNumber: "",
    usageLevel: "" as ToolUsageLevel | "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    // Map id to the correct formData key
    const key = id === "tool-name" ? "name" :
      id === "price" ? "pricePerDay" :
        id === "serial" ? "serialNumber" : id;

    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleSelectChange = (value: string, field: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleLocationSelect = (selectedLocation: { address: string; lat: number; lng: number }) => {
    setLocation(selectedLocation);
  };

  const handleMediaFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const newFiles = Array.from(e.target.files);
    setSelectedMediaFiles((prev) => {
      const merged = [...prev, ...newFiles];
      const seen = new Set<string>();
      const deduped: File[] = [];

      for (const file of merged) {
        const key = `${file.name}__${file.size}__${file.lastModified}`;
        if (seen.has(key)) continue;
        seen.add(key);
        deduped.push(file);
      }

      return deduped.slice(0, 12);
    });

    // Permite volver a seleccionar el mismo archivo en el próximo click
    e.target.value = "";
  };

  const handleInvoiceFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    setInvoiceFile(e.target.files[0]);
  };

  const getUploadUrlAndKey = async (file: File, isPrivate: boolean) => {
    const response = await api.post("/media/upload-url", {
      fileName: file.name,
      contentType: file.type || "application/octet-stream",
      isPrivate,
    });

    const data = (response as any).data?.data ?? (response as any).data;
    const uploadUrl = data?.uploadUrl ?? data?.url ?? data?.signedUrl;
    const fileKey = data?.fileKey ?? data?.key;
    const method = (data?.method ?? (data?.fields ? "POST" : "PUT")) as "PUT" | "POST";
    const fields = (data?.fields ?? null) as Record<string, string> | null;

    if (!uploadUrl || !fileKey) {
      throw new Error("Respuesta inválida de /media/upload-url (faltan uploadUrl o fileKey).");
    }

    return { uploadUrl: String(uploadUrl), fileKey: String(fileKey), method, fields };
  };

  const uploadToPresignedUrl = async (signed: { uploadUrl: string; method: "PUT" | "POST"; fields: Record<string, string> | null }, file: File) => {
    if (signed.method === "POST" && signed.fields) {
      const form = new FormData();
      for (const [k, v] of Object.entries(signed.fields)) form.append(k, v);
      form.append("file", file);

      const res = await fetch(signed.uploadUrl, { method: "POST", body: form });
      if (!res.ok) {
        const body = await res.text().catch(() => "");
        throw new Error(`Falló la subida a S3 (POST) (HTTP ${res.status}) ${body}`.trim());
      }
      return;
    }

    const res = await fetch(signed.uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Type": file.type || "application/octet-stream",
      },
      body: file,
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`Falló la subida a S3 (PUT) (HTTP ${res.status}) ${body}`.trim());
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      alert("Debes iniciar sesión para publicar una herramienta.");
      return;
    }

    if (!location) {
      alert("Por favor establece una ubicación en el mapa.");
      return;
    }

    if (selectedMediaFiles.length < 3) {
      alert("Debes seleccionar al menos 3 fotos para publicar la herramienta.");
      return;
    }

    setLoading(true);
    setUploadProgress(null);
    try {
      if (!invoiceFile) {
        alert("Debes subir la factura/comprobante para publicar la herramienta.");
        return;
      }

      setUploadProgress("Generando URLs de subida...");

      // Backend espera 3 imÃ¡genes (mÃ­nimo 3). Tomamos las primeras 3.
      const mediaToUpload = selectedMediaFiles.slice(0, 3);
      const mediaSigned = await Promise.all(mediaToUpload.map((f) => getUploadUrlAndKey(f, false)));
      const invoiceSigned = await getUploadUrlAndKey(invoiceFile, true);

      setUploadProgress(`Subiendo ${mediaToUpload.length} fotos...`);
      for (let i = 0; i < mediaToUpload.length; i++) {
        await uploadToPresignedUrl(mediaSigned[i], mediaToUpload[i]);
        setUploadProgress(`Subiendo fotos... (${i + 1}/${mediaToUpload.length})`);
      }

      setUploadProgress("Subiendo factura/comprobante...");
      await uploadToPresignedUrl(invoiceSigned, invoiceFile);

      setUploadProgress("Publicando herramienta...");

      const payload = {
        ...formData,
        pricePerDay: Number(formData.pricePerDay),
        address: location.address,
        latitude: location.lat,
        longitude: location.lng,
        owner: user.id || user._id, // Dependiendo de cómo venga el usuario del store
        fileKeys: mediaSigned.map((m) => m.fileKey),
        invoiceFileKey: invoiceSigned.fileKey,
        isAvailable: true
      };

      const response = await api.post("/tools", payload);

      if (response.data) {
        alert("Herramienta publicada exitosamente!");
        // Aquí podrías redirigir al usuario o limpiar el formulario
      }
    } catch (error: any) {
      console.error("Error al publicar la herramienta:", error);
      alert(error.response?.data?.message || "Ocurrió un error al publicar la herramienta.");
    } finally {
      setLoading(false);
      setUploadProgress(null);
    }
  };

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
            <Input
              id="tool-name"
              placeholder="ej., Martillo Combinado Hilti TE 70-ATC/AVR"
              className="bg-[#f3f4f6] border-transparent rounded-lg h-12 focus-visible:ring-primary/20"
              value={formData.name}
              onChange={handleInputChange}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-slate-600 font-semibold">Marca</Label>
              <Select onValueChange={(val) => handleSelectChange(val, "brand")} value={formData.brand}>
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
              <Select onValueChange={(val) => handleSelectChange(val, "category")} value={formData.category}>
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
            <Textarea
              id="description"
              placeholder="Incluye especificaciones técnicas, tipo de motor y accesorios incluidos..."
              className="bg-[#f3f4f6] border-transparent rounded-lg min-h-[120px] focus-visible:ring-primary/20"
              value={formData.description}
              onChange={handleInputChange}
            />
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
        <CardContent className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="price" className="text-slate-600 font-semibold">Tarifa Diaria de Renta ($)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">$</span>
                <Input
                  id="price"
                  type="number"
                  placeholder="0.00"
                  className="bg-[#f3f4f6] border-transparent rounded-lg h-12 pl-8 focus-visible:ring-primary/20"
                  value={formData.pricePerDay}
                  onChange={handleInputChange}
                />
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100">
            <LocationPicker onLocationSelect={handleLocationSelect} />
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
          <label htmlFor="media-files-input" className="block w-full border-2 border-dashed border-slate-200 rounded-3xl p-10 text-center space-y-5 hover:bg-slate-50 transition-colors cursor-pointer group">
            <div className="bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto group-hover:bg-primary/10 transition-colors">
              <CloudUpload className="h-8 w-8 text-slate-400 group-hover:text-primary transition-colors" />
            </div>
            <div className="space-y-2">
              <p className="font-bold text-lg text-slate-700">Arrastra o haz clic para seleccionar fotos</p>
              <p className="text-sm text-slate-500">
                Selecciona al menos 3 fotos: frontal, lateral y etiqueta de serie. Máx 10MB por archivo.
              </p>
            </div>
          </label>
          <input
            id="media-files-input"
            type="file"
            className="hidden"
            multiple
            accept="image/*"
            onChange={handleMediaFilesChange}
          />
          {selectedMediaFiles.length > 0 && (
            <div className="mt-5 space-y-3">
              <div className="flex items-center justify-between text-sm text-slate-600">
                <span>{selectedMediaFiles.length} archivo{selectedMediaFiles.length > 1 ? "s" : ""} seleccionado{selectedMediaFiles.length > 1 ? "s" : ""}</span>
                <span className={`${selectedMediaFiles.length < 3 ? "text-red-600" : "text-emerald-600"}`}>
                  {selectedMediaFiles.length < 3 ? "Selecciona al menos 3 imágenes" : "Listo para continuar"}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {selectedMediaFiles.map((file, index) => (
                  <div key={`${file.name}-${index}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-left">
                    <p className="font-semibold text-sm text-slate-800 truncate">{file.name}</p>
                    <p className="text-xs text-slate-500 mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                ))}
              </div>
            </div>
          )}
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
              <Input
                id="serial"
                placeholder="SN-XXXX-XXXX"
                className="bg-[#eef2ff] border-transparent rounded-lg h-12 focus-visible:ring-primary/20"
                value={formData.serialNumber}
                onChange={handleInputChange}
              />
            </div>
            <label htmlFor="invoice-file-input" className="bg-[#eef2ff] rounded-lg p-4 flex items-center justify-between group cursor-pointer hover:bg-[#e0e7ff] transition-colors border border-transparent hover:border-primary/20">
              <div className="flex items-center gap-3">
                <Upload className="h-5 w-5 text-slate-500" />
                <span className="text-slate-600 font-medium text-sm">Subir Factura/Comprobante</span>
              </div>
              <span className="text-primary font-bold text-xs tracking-wider uppercase">
                {invoiceFile?.name ?? "Explorar"}
              </span>
            </label>
            <input
              id="invoice-file-input"
              type="file"
              className="hidden"
              accept="image/*,application/pdf"
              onChange={handleInvoiceFileChange}
            />
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
              <Select onValueChange={(val) => handleSelectChange(val, "usageLevel")} value={formData.usageLevel}>
                <SelectTrigger className="bg-[#eef2ff] border-transparent rounded-lg h-12 focus:ring-primary/20">
                  <SelectValue placeholder="Selecciona el nivel de uso" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ToolUsageLevel.NEW}>Nuevo (Nunca Usado)</SelectItem>
                  <SelectItem value={ToolUsageLevel.EXCELLENT}>Excelente (Como Nuevo)</SelectItem>
                  <SelectItem value={ToolUsageLevel.GOOD}>Bueno (Uso Normal)</SelectItem>
                  <SelectItem value={ToolUsageLevel.FAIR}>Regular (Mucho Uso)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col items-end pt-8">
        {uploadProgress && (
          <div className="w-full mb-3 text-sm text-slate-600">
            {uploadProgress}
          </div>
        )}
        <Button
          onClick={handleSubmit}
          disabled={loading}
          className="bg-primary hover:bg-primary/90 text-white font-bold h-14 px-12 rounded-xl text-lg shadow-lg shadow-primary/30 min-w-[240px]"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Publicando...
            </>
          ) : (
            "Publicar Herramienta"
          )}
        </Button>
      </div>
    </div>
  );
}
