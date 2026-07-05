import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Package,
  MapPin,
  Image as ImageIcon,
  ShieldCheck,
  Wrench,
  Upload,
  CloudUpload,
  Loader2,
  Camera,
  Info,
  ArrowRight,
  ArrowLeft,
  Check,
} from "lucide-react";
import { LocationPicker } from "@/components/LocationPicker";
import { PhotoCaptureDialog, dataUrlToFile } from "@/components/ui/PhotoCaptureDialog";
import { Card, CardContent } from "@/components/ui/card";
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
import { uploadFileToStorage } from "@/lib/mediaUpload";
import { useAuthStore } from "@/store/authStore";
import { alerts } from "@/lib/alerts";
import { cn } from "@/lib/utils";

export enum ToolUsageLevel {
  NEW = "new",
  EXCELLENT = "excellent",
  GOOD = "good",
  FAIR = "fair",
}

const STEPS = [
  { id: 1, label: "Detalles" },
  { id: 2, label: "Logística" },
  { id: 3, label: "Multimedia" },
] as const;

interface CreateListingProps {
  embedded?: boolean;
  onBack?: () => void;
}

function SectionHeader({ icon: Icon, title }: { icon: React.ElementType; title: string }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <div className="grid h-10 w-10 place-items-center rounded-full bg-orange-50 border border-orange-100">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <h3 className="text-lg font-black text-slate-900">{title}</h3>
    </div>
  );
}

export function CreateListing({ embedded = false, onBack }: CreateListingProps) {
  const user = useAuthStore((state) => state.user);
  const location = useLocation();
  const navigate = useNavigate();
  const editTool: any = location.state?.editTool ?? null;
  const isEditing = Boolean(editTool);

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [meetingLocations, setMeetingLocations] = useState<
    Array<{ label: string; address: string; lat: number | null; lng: number | null }>
  >(() => {
    const existing = editTool?.meetingLocations;
    if (Array.isArray(existing) && existing.length >= 2) {
      return existing.map((loc: any) => ({
        label: loc.label ?? "",
        address: loc.address ?? "",
        lat: loc.lat ?? null,
        lng: loc.lng ?? null,
      }));
    }
    return [
      { label: "", address: "", lat: null, lng: null },
      { label: "", address: "", lat: null, lng: null },
    ];
  });
  const [selectedMediaFiles, setSelectedMediaFiles] = useState<File[]>([]);
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [cameraDialogOpen, setCameraDialogOpen] = useState(false);

  const existingFileKeys: string[] = editTool?.fileKeys ?? [];
  const existingImageUrls: string[] = editTool?.imageUrls ?? [];
  const existingInvoiceFileKey: string = editTool?.invoiceFileKey ?? "";

  const [formData, setFormData] = useState({
    name: editTool?.name ?? "",
    brand: editTool?.brand ?? "",
    category: editTool?.category ?? "",
    description: editTool?.description ?? "",
    pricePerDay: editTool?.pricePerDay?.toString() ?? "",
    serialNumber: editTool?.serialNumber ?? "",
    usageLevel: (editTool?.usageLevel as ToolUsageLevel | "") ?? "",
  });

  const resetForm = () => {
    setMeetingLocations([
      { label: "", address: "", lat: null, lng: null },
      { label: "", address: "", lat: null, lng: null },
    ]);
    setSelectedMediaFiles([]);
    setInvoiceFile(null);
    setCurrentStep(1);
    setFormData({
      name: "",
      brand: "",
      category: "",
      description: "",
      pricePerDay: "",
      serialNumber: "",
      usageLevel: "",
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    const key =
      id === "tool-name" ? "name" : id === "price" ? "pricePerDay" : id === "serial" ? "serialNumber" : id;
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSelectChange = (value: string, field: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleMeetingLocationChange = (
    index: number,
    field: "label" | "address" | "lat" | "lng",
    value: string,
  ) => {
    setMeetingLocations((prev) =>
      prev.map((item, currentIndex) => {
        if (currentIndex !== index) return item;
        if (field === "lat" || field === "lng") {
          return { ...item, [field]: value === "" ? null : Number(value) };
        }
        return { ...item, [field]: value };
      }),
    );
  };

  const handleMeetingLocationSelect = (
    index: number,
    selectedLocation: { address: string; lat: number; lng: number },
  ) => {
    setMeetingLocations((prev) =>
      prev.map((item, currentIndex) =>
        currentIndex === index
          ? { ...item, address: selectedLocation.address, lat: selectedLocation.lat, lng: selectedLocation.lng }
          : item,
      ),
    );
  };

  const appendMediaFiles = (newFiles: File[]) => {
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
  };

  const handleMediaFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    appendMediaFiles(Array.from(e.target.files));
    e.target.value = "";
  };

  const handleCameraCapture = async (imageSrc: string, file?: File) => {
    const capturedFile = file ?? (await dataUrlToFile(imageSrc, `herramienta-${Date.now()}.jpg`));
    appendMediaFiles([capturedFile]);
  };

  const handleInvoiceFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    setInvoiceFile(e.target.files[0]);
  };

  const validateStep = async (step: number): Promise<boolean> => {
    if (step === 1) {
      if (!formData.name.trim()) {
        await alerts.warning("Campo requerido", "Ingresa el nombre de la herramienta.");
        return false;
      }
      if (!formData.brand) {
        await alerts.warning("Campo requerido", "Selecciona la marca.");
        return false;
      }
      if (!formData.category) {
        await alerts.warning("Campo requerido", "Selecciona la categoría.");
        return false;
      }
      if (!formData.description.trim()) {
        await alerts.warning("Campo requerido", "Agrega una descripción detallada.");
        return false;
      }
      if (!formData.usageLevel) {
        await alerts.warning("Campo requerido", "Selecciona el nivel de uso.");
        return false;
      }
      return true;
    }

    if (step === 2) {
      if (!formData.pricePerDay || Number(formData.pricePerDay) <= 0) {
        await alerts.warning("Campo requerido", "Ingresa una tarifa diaria válida.");
        return false;
      }
      const meetingPayload = meetingLocations.map((entry, index) => ({
        label: entry.label.trim() || `Punto ${index + 1}`,
        address: entry.address.trim(),
        lat: typeof entry.lat === "number" ? entry.lat : Number.NaN,
        lng: typeof entry.lng === "number" ? entry.lng : Number.NaN,
      }));
      const hasInvalid = meetingPayload.some(
        (entry) => !entry.address || Number.isNaN(entry.lat) || Number.isNaN(entry.lng),
      );
      if (hasInvalid || meetingPayload.length !== 2) {
        await alerts.warning(
          "Faltan ubicaciones",
          "Debes completar exactamente las 2 ubicaciones de encuentro usando el mapa de cada punto.",
        );
        return false;
      }
      return true;
    }

    if (step === 3) {
      if (!isEditing && selectedMediaFiles.length < 3) {
        await alerts.warning("Faltan fotos", "Debes seleccionar al menos 3 fotos para publicar la herramienta.");
        return false;
      }
      if (!isEditing && !invoiceFile) {
        await alerts.warning("Falta comprobante", "Debes subir la factura/comprobante para publicar la herramienta.");
        return false;
      }
      return true;
    }

    return true;
  };

  const goNext = async () => {
    const ok = await validateStep(currentStep);
    if (!ok) return;
    setCurrentStep((s) => Math.min(3, s + 1));
  };

  const goBack = () => setCurrentStep((s) => Math.max(1, s - 1));

  const handleSubmit = async () => {
    if (!user) {
      await alerts.warning("Inicia sesión", "Debes iniciar sesión para publicar una herramienta.");
      return;
    }

    const ok = await validateStep(3);
    if (!ok) return;

    const meetingPayload = meetingLocations.map((entry, index) => ({
      label: entry.label.trim() || `Punto ${index + 1}`,
      address: entry.address.trim(),
      lat: typeof entry.lat === "number" ? entry.lat : Number.NaN,
      lng: typeof entry.lng === "number" ? entry.lng : Number.NaN,
    }));

    setLoading(true);
    setUploadProgress(null);
    try {
      let finalFileKeys: string[];
      if (selectedMediaFiles.length > 0) {
        setUploadProgress("Subiendo fotos...");
        const mediaToUpload = selectedMediaFiles.slice(0, 3);
        finalFileKeys = [];
        for (let i = 0; i < mediaToUpload.length; i++) {
          const fileKey = await uploadFileToStorage(mediaToUpload[i], false, "catalog");
          finalFileKeys.push(fileKey);
          setUploadProgress(`Subiendo fotos... (${i + 1}/${mediaToUpload.length})`);
        }
      } else {
        finalFileKeys = existingFileKeys;
      }

      let finalInvoiceFileKey: string;
      if (invoiceFile) {
        setUploadProgress("Subiendo factura/comprobante...");
        finalInvoiceFileKey = await uploadFileToStorage(invoiceFile, true, "evidence");
      } else {
        finalInvoiceFileKey = existingInvoiceFileKey;
      }

      setUploadProgress(isEditing ? "Guardando cambios..." : "Publicando herramienta...");

      const payload = {
        ...formData,
        pricePerDay: Number(formData.pricePerDay),
        meetingLocations: meetingPayload,
        fileKeys: finalFileKeys,
        invoiceFileKey: finalInvoiceFileKey,
        ...(!isEditing && { owner: (user as any).id || (user as any)._id, isAvailable: true }),
      };

      if (isEditing) {
        await api.patch(`/tools/${editTool.uuid}`, payload);
        await alerts.success("Guardado", "La herramienta fue actualizada correctamente.");
        navigate("/profile?tab=inventario");
      } else {
        const response = await api.post("/tools", payload);
        if (response.data) {
          await alerts.success("Publicado", "Herramienta publicada exitosamente.");
          resetForm();
        }
      }
    } catch (error: any) {
      console.error("Error al guardar la herramienta:", error);
      const message =
        error.response?.data?.message || error.message || "Ocurrió un error al guardar la herramienta.";
      await alerts.error(isEditing ? "No se pudo actualizar" : "No se pudo publicar", message);
    } finally {
      setLoading(false);
      setUploadProgress(null);
    }
  };

  const handleBackToInventory = () => {
    if (onBack) onBack();
    else navigate("/profile?tab=inventario");
  };

  return (
    <div className={cn("space-y-6 sm:space-y-8", !embedded && "container mx-auto max-w-4xl px-2 py-4 sm:px-4 sm:py-6")}>
      {/* Encabezado */}
      <div className="space-y-6">
        <button
          type="button"
          onClick={handleBackToInventory}
          className="text-sm font-semibold text-slate-500 hover:text-primary transition-colors"
        >
          ← Volver al inventario
        </button>

        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            {isEditing ? "Editar publicación" : "Publicar nueva herramienta"}
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-1">
            {isEditing
              ? `Actualiza los detalles de "${editTool.name}" siguiendo estos pasos.`
              : "Completa los detalles de tu equipo siguiendo estos sencillos pasos."}
          </p>
        </div>

        {/* Stepper */}
        <div className="flex items-center justify-center gap-0 max-w-lg mx-auto">
          {STEPS.map((step, index) => {
            const isActive = currentStep === step.id;
            const isCompleted = currentStep > step.id;
            return (
              <div key={step.id} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center gap-2">
                  <div
                    className={cn(
                      "grid h-10 w-10 place-items-center rounded-full text-sm font-bold transition-colors",
                      isActive && "bg-primary text-white shadow-md shadow-primary/30",
                      isCompleted && "bg-primary text-white",
                      !isActive && !isCompleted && "bg-slate-100 text-slate-400 border border-slate-200",
                    )}
                  >
                    {isCompleted ? <Check className="h-5 w-5" /> : step.id}
                  </div>
                  <span
                    className={cn(
                      "text-xs font-bold whitespace-nowrap",
                      isActive || isCompleted ? "text-primary" : "text-slate-400",
                    )}
                  >
                    {step.label}
                  </span>
                </div>
                {index < STEPS.length - 1 && (
                  <div
                    className={cn(
                      "h-0.5 flex-1 mx-3 mb-6 transition-colors",
                      currentStep > step.id ? "bg-primary" : "bg-slate-200",
                    )}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Paso 1: Detalles */}
      {currentStep === 1 && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <Card className="border border-slate-100 shadow-sm bg-white rounded-2xl">
            <CardContent className="p-8">
              <SectionHeader icon={Info} title="Información Básica" />
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="tool-name" className="text-slate-600 font-semibold">
                    Nombre de la Herramienta
                  </Label>
                  <Input
                    id="tool-name"
                    placeholder="Ej. Rotomartillo SDS Max 1500W"
                    className="bg-slate-50 border-slate-200 rounded-xl h-12 focus-visible:ring-primary/20"
                    value={formData.name}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-slate-600 font-semibold">Marca</Label>
                    <Select onValueChange={(val) => handleSelectChange(val, "brand")} value={formData.brand}>
                      <SelectTrigger className="bg-slate-50 border-slate-200 rounded-xl h-12">
                        <SelectValue placeholder="Selecciona una marca" />
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
                      <SelectTrigger className="bg-slate-50 border-slate-200 rounded-xl h-12">
                        <SelectValue placeholder="Selecciona categoría" />
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
                  <Label htmlFor="description" className="text-slate-600 font-semibold">
                    Descripción Detallada
                  </Label>
                  <Textarea
                    id="description"
                    placeholder="Especificaciones técnicas, tipo de motor, accesorios incluidos..."
                    className="bg-slate-50 border-slate-200 rounded-xl min-h-[120px] focus-visible:ring-primary/20"
                    value={formData.description}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-slate-100 shadow-sm bg-white rounded-2xl">
            <CardContent className="p-8">
              <SectionHeader icon={Wrench} title="Estado de Uso" />
              <div className="space-y-2">
                <Label className="text-slate-600 font-semibold">Nivel de Uso</Label>
                <Select onValueChange={(val) => handleSelectChange(val, "usageLevel")} value={formData.usageLevel}>
                  <SelectTrigger className="bg-slate-50 border-slate-200 rounded-xl h-12">
                    <SelectValue placeholder="Selecciona el estado actual" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ToolUsageLevel.NEW}>Nuevo (nunca usado)</SelectItem>
                    <SelectItem value={ToolUsageLevel.EXCELLENT}>Excelente (como nuevo)</SelectItem>
                    <SelectItem value={ToolUsageLevel.GOOD}>Bueno (uso normal)</SelectItem>
                    <SelectItem value={ToolUsageLevel.FAIR}>Regular (mucho uso)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Paso 2: Logística */}
      {currentStep === 2 && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <Card className="border border-slate-100 shadow-sm bg-white rounded-2xl">
            <CardContent className="p-8">
              <SectionHeader icon={Package} title="Precio de renta" />
              <div className="space-y-2 max-w-sm">
                <Label htmlFor="price" className="text-slate-600 font-semibold">
                  Tarifa diaria ($)
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-semibold">$</span>
                  <Input
                    id="price"
                    type="number"
                    placeholder="0.00"
                    className="bg-slate-50 border-slate-200 rounded-xl h-12 pl-8"
                    value={formData.pricePerDay}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-slate-100 shadow-sm bg-white rounded-2xl">
            <CardContent className="p-8">
              <div className="flex items-start justify-between gap-3 mb-6">
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-full bg-orange-50 border border-orange-100">
                    <MapPin className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-lg font-black text-slate-900">Puntos de encuentro</h3>
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-primary bg-orange-50 px-3 py-2 rounded-full border border-orange-100 shrink-0">
                  2 obligatorias
                </span>
              </div>
              <p className="text-sm text-slate-500 mb-6 -mt-2">
                Completa exactamente 2 ubicaciones. Cada punto usa su propio mapa para fijar la dirección.
              </p>

              <div className="grid gap-5">
                {meetingLocations.map((entry, index) => (
                  <div key={index} className="rounded-2xl border border-slate-200 bg-slate-50 p-5 space-y-4">
                    <h4 className="font-bold text-slate-800">Punto {index + 1}</h4>
                    <div className="space-y-2">
                      <Label className="text-slate-600 font-semibold">Nombre del punto</Label>
                      <Input
                        value={entry.label}
                        onChange={(e) => handleMeetingLocationChange(index, "label", e.target.value)}
                        placeholder="Ej. Pasillo Celeste Mall"
                        className="bg-white border-slate-200 rounded-xl h-12"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-600 font-semibold">Dirección exacta</Label>
                      <Input
                        value={entry.address}
                        onChange={(e) => handleMeetingLocationChange(index, "address", e.target.value)}
                        placeholder="Se llena al pinnear el mapa"
                        className="bg-white border-slate-200 rounded-xl h-12"
                      />
                    </div>
                    <LocationPicker
                      title={`Mapa del punto ${index + 1}`}
                      description="Haz clic en el mapa o busca una dirección para fijar el pin."
                      searchPlaceholder="Buscar dirección exacta"
                      onLocationSelect={(selectedLocation) => handleMeetingLocationSelect(index, selectedLocation)}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Paso 3: Multimedia */}
      {currentStep === 3 && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <Card className="border border-slate-100 shadow-sm bg-white rounded-2xl">
            <CardContent className="p-8">
              <SectionHeader icon={ImageIcon} title="Fotos de la herramienta" />
              <label
                htmlFor="media-files-input"
                className="block w-full border-2 border-dashed border-slate-200 rounded-2xl p-10 text-center space-y-4 hover:bg-slate-50 transition-colors cursor-pointer group"
              >
                <div className="bg-orange-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto group-hover:bg-orange-100 transition-colors">
                  <CloudUpload className="h-8 w-8 text-primary" />
                </div>
                <div className="space-y-1">
                  <p className="font-bold text-slate-700">Arrastra o haz clic para seleccionar fotos</p>
                  <p className="text-sm text-slate-500">
                    {isEditing
                      ? "Sube nuevas fotos para reemplazar las actuales (opcional)."
                      : "Mínimo 3 fotos: frontal, lateral y etiqueta de serie. Máx 10MB por archivo."}
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
              <div className="mt-4 flex justify-center">
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-xl border-primary text-primary hover:bg-orange-50"
                  onClick={() => setCameraDialogOpen(true)}
                >
                  <Camera className="mr-2 h-4 w-4" />
                  Tomar foto con cámara
                </Button>
              </div>

              {isEditing && existingImageUrls.length > 0 && selectedMediaFiles.length === 0 && (
                <div className="mt-6 space-y-3">
                  <p className="text-sm text-slate-500 font-semibold">
                    Fotos actuales ({existingImageUrls.length})
                  </p>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3">
                    {existingImageUrls.map((url, i) => (
                      <img
                        key={i}
                        src={url}
                        alt={`Foto ${i + 1}`}
                        className="w-full h-24 object-cover rounded-xl border border-slate-200"
                      />
                    ))}
                  </div>
                </div>
              )}

              {selectedMediaFiles.length > 0 && (
                <div className="mt-6 space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">
                      {selectedMediaFiles.length} archivo{selectedMediaFiles.length > 1 ? "s" : ""} seleccionado
                      {selectedMediaFiles.length > 1 ? "s" : ""}
                    </span>
                    <span
                      className={cn(
                        "font-semibold",
                        !isEditing && selectedMediaFiles.length < 3 ? "text-red-600" : "text-emerald-600",
                      )}
                    >
                      {!isEditing && selectedMediaFiles.length < 3
                        ? "Faltan fotos"
                        : "Listo para continuar"}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {selectedMediaFiles.map((file, index) => (
                      <div
                        key={`${file.name}-${index}`}
                        className="rounded-xl border border-slate-200 bg-slate-50 p-3"
                      >
                        <p className="font-semibold text-sm text-slate-800 truncate">{file.name}</p>
                        <p className="text-xs text-slate-500 mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border border-slate-100 shadow-sm bg-white rounded-2xl">
            <CardContent className="p-8">
              <SectionHeader icon={ShieldCheck} title="Validación de propiedad" />
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="serial" className="text-slate-600 font-semibold">
                    Número de serie
                  </Label>
                  <Input
                    id="serial"
                    placeholder="SN-XXXX-XXXX"
                    className="bg-slate-50 border-slate-200 rounded-xl h-12"
                    value={formData.serialNumber}
                    onChange={handleInputChange}
                  />
                </div>
                <label
                  htmlFor="invoice-file-input"
                  className="bg-slate-50 rounded-xl p-4 flex items-center justify-between cursor-pointer hover:bg-orange-50 transition-colors border border-slate-200 hover:border-primary/30"
                >
                  <div className="flex items-center gap-3">
                    <Upload className="h-5 w-5 text-slate-500" />
                    <span className="text-slate-600 font-medium text-sm">
                      {isEditing ? "Reemplazar factura (opcional)" : "Subir factura / comprobante"}
                    </span>
                  </div>
                  <span className="text-primary font-bold text-xs tracking-wider uppercase">
                    {invoiceFile?.name ?? (isEditing && existingInvoiceFileKey ? "Ya subida ✓" : "Explorar")}
                  </span>
                </label>
                <input
                  id="invoice-file-input"
                  type="file"
                  className="hidden"
                  accept="image/*,application/pdf"
                  onChange={handleInvoiceFileChange}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Navegación */}
      <div className="flex items-center justify-between pt-4 pb-8">
        {currentStep > 1 ? (
          <Button
            type="button"
            variant="outline"
            onClick={goBack}
            className="rounded-xl border-slate-200 text-slate-700 font-bold h-12 px-6"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Anterior
          </Button>
        ) : (
          <div />
        )}

        <div className="flex flex-col items-end gap-2">
          {uploadProgress && <p className="text-sm text-slate-500">{uploadProgress}</p>}
          {currentStep < 3 ? (
            <Button
              type="button"
              onClick={goNext}
              className="bg-primary hover:bg-primary/90 text-white font-bold h-12 px-8 rounded-xl shadow-md shadow-primary/25"
            >
              Siguiente
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="bg-primary hover:bg-primary/90 text-white font-bold h-12 px-10 rounded-xl shadow-md shadow-primary/25 min-w-[200px]"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  {isEditing ? "Guardando..." : "Publicando..."}
                </>
              ) : isEditing ? (
                "Guardar cambios"
              ) : (
                "Publicar herramienta"
              )}
            </Button>
          )}
        </div>
      </div>

      <PhotoCaptureDialog
        open={cameraDialogOpen}
        onOpenChange={setCameraDialogOpen}
        onCapture={handleCameraCapture}
        overlayType="general"
        hint="Encuadra la herramienta"
        title="Foto de la herramienta"
        description="Elige cámara web, cámara del dispositivo o galería."
      />
    </div>
  );
}
