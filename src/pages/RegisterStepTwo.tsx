import React from "react";
import { useLocation, useNavigate } from "react-router-dom"; // Importación limpia
import { ShieldCheck, Lock, ArrowRight, Phone, CreditCard } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { WebcamCapture } from "../components/ui/WebcamCapture";
import { useAuthStore } from "../store/useAuthStore";
import { detectFaceInImage } from "@/lib/faceVerification";
import {
  getRegistrationDocument,
  saveRegistrationDocument,
} from "@/services/verificationService";
import { userService } from "@/services/userService";

export function RegisterStepTwo() {
  const location = useLocation();
  const navigate = useNavigate();
  const { accessToken: storeToken, user, fetchProfile } = useAuthStore();

  const accessToken = location.state?.accessToken || storeToken;

  // Protección: Si no hay token, no puede estar aquí
  React.useEffect(() => {
    if (!accessToken) {
      navigate("/register");
    }
  }, [accessToken, navigate]);

  // Cargar perfil al entrar para tener la información más fresca de cédula/teléfono
  React.useEffect(() => {
    if (accessToken) {
      fetchProfile();
    }
  }, [accessToken]);

  const [documentImage, setDocumentImage] = React.useState<string | null>(() =>
    getRegistrationDocument()
  );
  const [useManualForm, setUseManualForm] = React.useState(false);

  // Formulario para completar datos faltantes (caso Google u otros que no tengan cedula/teléfono)
  const needsPhone = React.useMemo(() => !user || !user.phone || !user.phone.trim(), [user]);
  const needsDoc = React.useMemo(() => {
    return !user || !user.identityDocument || !user.identityDocument.trim() || user.identityDocument.startsWith("GOOGLE_");
  }, [user]);

  const isProfileIncomplete = React.useMemo(() => needsPhone || needsDoc, [needsPhone, needsDoc]);

  const [completePhone, setCompletePhone] = React.useState("");
  const [completeDoc, setCompleteDoc] = React.useState("");
  const [isUpdatingProfile, setIsUpdatingProfile] = React.useState(false);

  // State for manual form
  const [documentType, setDocumentType] = React.useState("CCPA");
  const [documentNumber, setDocumentNumber] = React.useState("");
  const [dateOfBirth, setDateOfBirth] = React.useState("");

  // Loading and error state
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleUpdateProfileData = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsUpdatingProfile(true);

    try {
      const payload: any = {};
      if (needsPhone) {
        if (!completePhone || completePhone.trim().length < 5) {
          setError("Por favor, ingrese un número de teléfono válido.");
          setIsUpdatingProfile(false);
          return;
        }
        payload.phone = completePhone;
      }
      if (needsDoc) {
        if (!completeDoc || completeDoc.trim().length < 5) {
          setError("Por favor, ingrese un documento de identidad válido.");
          setIsUpdatingProfile(false);
          return;
        }
        payload.identityDocument = completeDoc;
      }

      await userService.updateProfile(payload);
      await fetchProfile();
    } catch (err: any) {
      console.error("Error al actualizar el perfil:", err);
      setError(err.response?.data?.message || "Ocurrió un error al guardar los datos.");
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleNext = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("El registro manual no está disponible. Debes tomar una foto de tu cédula.");
  };

  const handleProcessImage = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (!documentImage) return;

    setError(null);
    setIsLoading(true);

    try {
      const faceCheck = await detectFaceInImage(documentImage);
      if (!faceCheck.found) {
        setError(faceCheck.message);
        return;
      }

      saveRegistrationDocument(documentImage);
      navigate("/register/step-3", { state: { documentImage, accessToken } });
    } catch (err) {
      console.error("Error al procesar la imagen de la cédula", err);
      setError("Ocurrió un error al procesar la imagen. Intenta nuevamente.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fb] text-slate-900 font-sans">
      <div className="mx-auto flex min-h-screen max-w-[1280px] flex-col px-4 py-6 md:px-8">

        {/* Header */}
        <header className="flex items-center justify-between py-4">
          <span className="text-xl font-black tracking-tight">RentTools</span>
          <button className="text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors">Help</button>
        </header>

        <main className="mt-8 grid flex-1 gap-12 lg:grid-cols-[1fr_1fr] items-center">

          {/* Columna Izquierda */}
          <section className="space-y-8 lg:pr-12">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 border border-blue-100">
                <ShieldCheck className="h-3.5 w-3.5 text-blue-600" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">Entorno Seguro</span>
              </div>

              <h1 className="text-[3rem] font-black leading-[1.05] tracking-tight text-slate-950">
                Verifica tu identidad profesional.
              </h1>

              <p className="text-slate-500 text-lg leading-relaxed max-w-md">
                Para garantizar la seguridad de nuestra comunidad de alquiler de herramientas, necesitamos validar tus datos oficiales.
              </p>

              <div className="flex items-center gap-4 rounded-2xl bg-white p-5 border border-slate-200/60 shadow-sm max-w-sm">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100">
                  <Lock className="h-6 w-6 text-slate-400" />
                </div>
                <div className="space-y-0.5">
                  <p className="text-sm font-bold text-slate-900">Encriptación Bancaria</p>
                  <p className="text-xs text-slate-500">Tus datos están protegidos bajo estándares AES-256.</p>
                </div>
              </div>
            </div>
          </section>

          {/* Columna Derecha */}
          <section className="relative">
            <div className="absolute -bottom-6 -right-6 opacity-5 invisible xl:visible">
              <Lock className="h-32 w-32" />
            </div>

            <div className="rounded-[32px] border border-white bg-white p-8 md:p-12 shadow-[0_35px_80px_-35px_rgba(0,0,0,0.1)]">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#e86f00]">Paso 2 de 3</span>
                <span className="text-xs font-bold text-slate-400">66% completado</span>
              </div>

              <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                <div className="h-full w-[66%] rounded-full bg-[#e86f00]" />
              </div>

              <h2 className="mt-6 text-2xl font-black tracking-tight text-slate-950">
                Información Personal
              </h2>

              <div className="mt-8">
                {error && (
                  <div className="mb-6 p-3 text-sm text-red-600 bg-red-50 rounded-xl font-medium border border-red-100">
                    {error}
                  </div>
                )}
                {isProfileIncomplete ? (
                  <form onSubmit={handleUpdateProfileData} className="space-y-6 animate-in fade-in duration-300">
                    <p className="text-sm text-slate-500 font-medium">
                      Para continuar con la verificación, necesitamos completar la siguiente información requerida:
                    </p>

                    {needsDoc && (
                      <div className="space-y-2">
                        <label htmlFor="completeDoc" className="text-[13px] font-bold text-slate-800 flex items-center gap-2">
                          <CreditCard className="h-4 w-4 text-[#e86f00]" /> Documento de Identidad (Cédula)
                        </label>
                        <Input
                          id="completeDoc"
                          placeholder="Ej: 8-1251-1829"
                          value={completeDoc}
                          onChange={(e) => setCompleteDoc(e.target.value)}
                          className="h-12 bg-[#f3f6fc] border-none rounded-xl"
                          required
                        />
                      </div>
                    )}

                    {needsPhone && (
                      <div className="space-y-2">
                        <label htmlFor="completePhone" className="text-[13px] font-bold text-slate-800 flex items-center gap-2">
                          <Phone className="h-4 w-4 text-[#e86f00]" /> Número de Teléfono
                        </label>
                        <Input
                          id="completePhone"
                          type="tel"
                          placeholder="Ej: +507 6123-4567"
                          value={completePhone}
                          onChange={(e) => setCompletePhone(e.target.value)}
                          className="h-12 bg-[#f3f6fc] border-none rounded-xl"
                          required
                        />
                      </div>
                    )}

                    <div className="pt-2">
                      <Button
                        type="submit"
                        disabled={isUpdatingProfile}
                        className="h-14 w-full rounded-2xl bg-[#e86f00] text-base font-black text-white hover:bg-[#d46500] shadow-lg shadow-orange-500/20 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                      >
                        {isUpdatingProfile ? "Guardando datos..." : (
                          <>Continuar <ArrowRight className="ml-2 h-5 w-5" /></>
                        )}
                      </Button>
                    </div>
                  </form>
                ) : !useManualForm ? (
                  <div className="space-y-6">
                    {!documentImage ? (
                      <div className="space-y-4">
                        <p className="text-sm text-slate-500 font-medium">Captura el frente de tu documento de identidad oficial.</p>
                        <WebcamCapture
                          overlayType="document"
                          onCapture={(img) => setDocumentImage(img)}
                        />
                        {/* Opción manual deshabilitada temporalmente 
                        <button 
                          onClick={() => {
                            setError(null);
                            setUseManualForm(true);
                          }}
                          className="w-full text-center text-xs font-bold text-[#e86f00] hover:underline"
                        >
                          ¿No tienes cámara? Ingresar datos manualmente
                        </button>
                        */}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="rounded-xl overflow-hidden border-2 border-green-500">
                          <img src={documentImage} alt="Documento" className="w-full h-auto" />
                        </div>
                        <div className="flex items-center gap-2 text-green-600 text-sm font-bold bg-green-50 p-3 rounded-xl">
                          <ShieldCheck className="h-5 w-5" /> Documento capturado con éxito
                        </div>
                        <Button
                          onClick={handleProcessImage}
                          disabled={isLoading}
                          className="h-14 w-full rounded-2xl bg-[#e86f00] text-base font-black text-white hover:bg-[#d46500] shadow-lg shadow-orange-500/20 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                          {isLoading ? "Analizando documento..." : (
                            <>Continuar <ArrowRight className="ml-2 h-5 w-5" /></>
                          )}
                        </Button>
                        <button
                          onClick={() => setDocumentImage(null)}
                          className="w-full text-center text-xs font-bold text-slate-400 hover:text-slate-600"
                        >
                          Volver a tomar foto
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <form className="space-y-6" onSubmit={handleNext}>
                    <div className="space-y-2">
                      <label className="text-[13px] font-bold text-slate-800">Tipo de Documento</label>
                      <Select value={documentType} onValueChange={setDocumentType}>
                        <SelectTrigger className="h-12 bg-[#f3f6fc] border-none rounded-xl">
                          <SelectValue placeholder="Selecciona documento" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="CCPA">DNI - Documento Nacional de Identidad (CCPA)</SelectItem>
                          <SelectItem value="passport">Pasaporte</SelectItem>
                          <SelectItem value="license">Licencia de Conducir</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[13px] font-bold text-slate-800">Número de Documento</label>
                      <Input
                        placeholder="Ej: 8-1251-1829"
                        value={documentNumber}
                        onChange={(e) => setDocumentNumber(e.target.value)}
                        className="h-12 bg-[#f3f6fc] border-none rounded-xl"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[13px] font-bold text-slate-800">Fecha de Nacimiento</label>
                      <Input
                        type="date"
                        value={dateOfBirth}
                        onChange={(e) => setDateOfBirth(e.target.value)}
                        className="h-12 bg-[#f3f6fc] border-none rounded-xl"
                        required
                      />
                      <p className="text-[10px] text-blue-500 font-medium pt-1">
                        Debes ser mayor de 18 años para alquilar herramientas profesionales.
                      </p>
                    </div>

                    {error && (
                      <div className="p-3 text-sm text-red-600 bg-red-50 rounded-xl font-medium border border-red-100">
                        {error}
                      </div>
                    )}

                    <div className="pt-2 space-y-4">
                      <Button
                        type="submit"
                        disabled={isLoading}
                        className="h-14 w-full rounded-2xl bg-[#e86f00] text-base font-black text-white hover:bg-[#d46500] shadow-lg shadow-orange-500/20 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                      >
                        {isLoading ? "Validando identidad..." : (
                          <>Continuar <ArrowRight className="ml-2 h-5 w-5" /></>
                        )}
                      </Button>

                      <button
                        type="button"
                        onClick={() => setUseManualForm(false)}
                        className="w-full text-center text-xs font-bold text-slate-400 hover:text-slate-600"
                      >
                        Volver a usar la cámara
                      </button>
                    </div>
                  </form>
                )}

              </div>
            </div>
          </section>
        </main>

        <div className="mt-12 grid grid-cols-2 gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="aspect-[16/9] overflow-hidden rounded-2xl grayscale opacity-40 hover:opacity-100 hover:grayscale-0 transition-all duration-500 border border-slate-200">
              <img
                src={`https://placehold.co/400x225/png`}
                alt={`Stock ${i}`}
                className="h-full w-full object-cover"
              />
            </div>
          ))}
        </div>

        {/* Footer */}
        <footer className="flex flex-col md:flex-row items-center justify-between py-10 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 border-t border-slate-100 mt-8">
          <div className="flex gap-6">
            <span>© 2026 RENTTOOLS</span>
            <a href="#" className="hover:text-slate-900">Términos de servicio</a>
            <a href="#" className="hover:text-slate-900">Privacidad</a>
          </div>
          <div className="flex items-center gap-2 mt-4 md:mt-0">
            <Lock size={12} /> CONEXIÓN SEGURA SSL
          </div>
        </footer>
      </div>
    </div>
  );
}
