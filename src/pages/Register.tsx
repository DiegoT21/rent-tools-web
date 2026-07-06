import React from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { useNavigate } from "react-router-dom";
import { isAxiosError } from "axios";
import { authService } from "../services/authService";
import { ServiceTermsDialog } from "@/components/legal/ServiceTermsDialog";

export function Register() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = React.useState(false);
  const [acceptedTerms, setAcceptedTerms] = React.useState(false);
  const [termsOpen, setTermsOpen] = React.useState(false);

  // Form states
  const [firstName, setFirstName] = React.useState("");
  const [lastName, setLastName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [identityDocument, setIdentityDocument] = React.useState("");

  // UI states
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleNextStep = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!acceptedTerms) {
      setError("Debes aceptar los términos y condiciones para continuar.");
      return;
    }
    
    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

    if (!firstName || !lastName || !email || !password || !identityDocument) {
      setError("Todos los campos son obligatorios (excepto el teléfono)");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await authService.register({
        firstName,
        lastName,
        email,
        password,
        identityDocument,
        acceptTerms: true as const,
      });
      const accessToken = data.data?.accessToken;
      navigate("/register/step-2", { state: { accessToken } });
    } catch (err) {
      if (isAxiosError(err)) {
        setError(err.response?.data?.message || "Error al crear la cuenta");
      } else {
        setError("Error de conexión con el servidor");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fb] text-slate-900 font-sans">
      <div className="mx-auto flex min-h-screen max-w-[1280px] flex-col px-4 py-6 md:px-8">
        
        {/* Header simplificado como en tu captura */}
        <header className="flex items-center justify-between py-4">
          <div className="flex items-center gap-2">
            <span className="text-xl font-black tracking-tight text-slate-900">RentTools</span>
          </div>
          <button className="text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors">
            Help
          </button>
        </header>

        <main className="mt-6 grid flex-1 gap-6 lg:mt-8 lg:grid-cols-[0.9fr_1.1fr] lg:gap-12 items-start">
          
          {/* Columna Izquierda: Mensaje de Valor */}
          <section className="space-y-8">
            <div className="rounded-[28px] bg-slate-100/50 p-10 space-y-6 border border-slate-200/60 shadow-sm">
              <h1 className="text-[2.6rem] font-black leading-[1.1] tracking-tight text-slate-950">
                Comienza tu próxima gran obra.
              </h1>
              <p className="text-slate-500 text-lg leading-relaxed max-w-md">
                Únete a la comunidad de profesionales que confían en el alquiler de herramientas de precisión y maquinaria pesada de alta gama.
              </p>
              
              {/* Imagen de maquinaria con bordes redondeados */}
             <div className="overflow-hidden rounded-3xl shadow-lg border-4 border-white aspect-[16/9] relative">
              <img 
                src="IndustrialMachinery.png" 
                alt="Industrial Machinery" 
                className="absolute inset-0 w-full h-full object-cover grayscale-[0.2] hover:grayscale-0 transition-all duration-500"
               />
            </div>
            </div>

            {/* Banner de Verificación KYC */}
            <div className="flex items-center justify-between rounded-2xl bg-[#eff6ff] p-5 border border-blue-100 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="mt-1 rounded-full bg-blue-600 p-1">
                  <ShieldCheck className="h-4 w-4 text-white" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-bold text-slate-900">
                    Para alquilar en RentTools necesitas verificar tu identidad
                  </p>
                  <div className="flex gap-3 pt-2">
                    <Button size="sm" className="bg-[#e86f00] hover:bg-[#d46500] text-xs font-bold px-5 rounded-lg">
                      Verificar ahora
                    </Button>
                    <Button size="sm" variant="ghost" className="text-slate-500 text-xs font-bold hover:bg-white/50">
                      Más tarde
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Columna Derecha: Formulario */}
          <section className="rounded-[32px] border border-white bg-white p-6 shadow-[0_25px_70px_-35px_rgba(0,0,0,0.08)] md:p-8 lg:p-12">
            <div className="max-w-xl mx-auto">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#e86f00]">
                Paso 1 de 3
              </span>
              <h2 className="mt-3 text-[1.85rem] font-black tracking-tight text-slate-950">
                Crear cuenta profesional
              </h2>

              <form className="mt-10 space-y-6" onSubmit={handleNextStep}>
                {error && (
                  <div className="p-3 text-sm text-red-600 bg-red-50 rounded-xl font-medium border border-red-100">
                    {error}
                  </div>
                )}
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-[13px] font-bold text-slate-800">Nombre</label>
                    <Input 
                      placeholder="Ej. Juan" 
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="h-12 bg-slate-50/50 border-slate-200 rounded-xl" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[13px] font-bold text-slate-800">Apellido</label>
                    <Input 
                      placeholder="Ej. Pérez" 
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="h-12 bg-slate-50/50 border-slate-200 rounded-xl" 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-[13px] font-bold text-slate-800">Documento de Identidad</label>
                    <Input 
                      placeholder="Ej. 8-000-0000" 
                      value={identityDocument}
                      onChange={(e) => setIdentityDocument(e.target.value)}
                      className="h-12 bg-slate-50/50 border-slate-200 rounded-xl" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[13px] font-bold text-slate-800">Correo electrónico</label>
                    <Input 
                      type="email" 
                      placeholder="profesional@empresa.com" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-12 bg-slate-50/50 border-slate-200 rounded-xl" 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-[13px] font-bold text-slate-800">Contraseña</label>
                    <div className="relative">
                      <Input 
                        type={showPassword ? "text" : "password"} 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="h-12 bg-slate-50/50 border-slate-200 rounded-xl pr-10" 
                      />
                      <button 
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[13px] font-bold text-slate-800">Confirmar contraseña</label>
                    <Input 
                      type="password" 
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="h-12 bg-slate-50/50 border-slate-200 rounded-xl" 
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[13px] font-bold text-slate-800">Teléfono de contacto</label>
                  <div className="flex gap-3">
                    <div className="w-24">
                      <Input defaultValue="+34" className="h-12 bg-slate-50/50 border-slate-200 rounded-xl text-center" />
                    </div>
                    <div className="flex-1">
                      <Input placeholder="600 000 000" className="h-12 bg-slate-50/50 border-slate-200 rounded-xl" />
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3 py-2">
                  <input
                    id="accept-terms"
                    type="checkbox"
                    checked={acceptedTerms}
                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-slate-300 accent-[#e86f00]"
                  />
                  <p className="text-[13px] leading-relaxed text-slate-500">
                    <label htmlFor="accept-terms" className="cursor-pointer">
                      Acepto los{" "}
                    </label>
                    <button
                      type="button"
                      onClick={() => setTermsOpen(true)}
                      className="font-bold text-blue-600 underline hover:text-blue-800"
                    >
                      términos y condiciones
                    </button>{" "}
                    de servicio y la política de privacidad industrial de RentTools, y autorizo a
                    RentTools a enviarme notificaciones transaccionales al correo indicado.
                  </p>
                </div>

                <ServiceTermsDialog open={termsOpen} onOpenChange={setTermsOpen} />

                <Button 
                  type="submit"
                  disabled={isLoading || !acceptedTerms}
                  className="h-14 w-full rounded-2xl bg-[#e86f00] text-base font-black text-white hover:bg-[#d46500] shadow-lg shadow-orange-500/20 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isLoading ? "Creando cuenta..." : "Continuar al registro"}
                </Button>

                <p className="text-center text-sm text-slate-500 pt-2">
                  ¿Ya tienes una cuenta?{" "}
                  <Link to="/login" className="font-bold text-[#e86f00] hover:underline">
                    Inicia sesión
                </Link>
                </p>
              </form>
            </div>
          </section>
        </main>

        <footer className="mt-auto py-8 text-center text-[10px] font-bold uppercase tracking-[0.3em] text-slate-300">
          © 2024 RENTTOOLS MARKETPLACE • INDUSTRIAL GRADE PRECISION
        </footer>
      </div>
    </div>
  );
}