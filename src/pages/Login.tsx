import React from "react";
import { BriefcaseBusiness, Eye, EyeOff, Globe, LockKeyhole, Mail } from "lucide-react";
import { Link } from "react-router-dom";
import heroImage from "../assets/hero.png";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { useNavigate } from "react-router-dom";
import { isAxiosError } from "axios";
import { authService } from "../services/authService";
import { useAuthStore } from "../store/useAuthStore";
import Swal from "sweetalert2";

declare global {
  interface Window {
    google?: any;
  }
}

export function Login() {
  const navigate = useNavigate();
  const fetchProfile = useAuthStore((state) => state.fetchProfile);

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!googleClientId) return;

    const id = "google-gsi-client";
    if (document.getElementById(id)) return;

    const script = document.createElement("script");
    script.id = id;
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);

    return () => {
      const existingScript = document.getElementById(id);
      if (existingScript) {
        document.body.removeChild(existingScript);
      }
    };
  }, []);

  const handleMockGoogleLogin = async () => {
    const { value: mockEmail } = await Swal.fire({
      title: 'Iniciar sesión con Google (Simulador)',
      input: 'email',
      inputLabel: 'Introduce un correo de Google de prueba',
      inputValue: 'test-google@example.com',
      showCancelButton: true,
      confirmButtonText: 'Continuar',
      cancelButtonText: 'Cancelar',
      inputValidator: (value) => {
        if (!value) {
          return '¡Debes ingresar un correo!';
        }
      }
    });

    if (mockEmail) {
      const { value: mockName } = await Swal.fire({
        title: 'Nombre de usuario',
        input: 'text',
        inputLabel: 'Introduce el nombre para tu perfil simulado',
        inputValue: 'Google User',
        showCancelButton: true,
        confirmButtonText: 'Iniciar sesión',
        cancelButtonText: 'Cancelar',
      });

      setIsLoading(true);
      setError(null);
      try {
        await authService.loginWithGoogle({
          isMock: true,
          mockEmail: mockEmail,
          mockName: mockName || 'Google User'
        });
        await fetchProfile();
        navigate("/");
      } catch (err: any) {
        console.error("Error al iniciar sesión simulada con Google:", err);
        setError(err.response?.data?.message || "Error al autenticar con Google simulado.");
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleGoogleLogin = () => {
    const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!googleClientId) {
      handleMockGoogleLogin();
      return;
    }

    try {
      if (window.google) {
        const tokenClient = window.google.accounts.oauth2.initTokenClient({
          client_id: googleClientId,
          scope: 'openid email profile',
          callback: async (tokenResponse: any) => {
            if (tokenResponse && tokenResponse.access_token) {
              setIsLoading(true);
              setError(null);
              try {
                await authService.loginWithGoogle({ accessToken: tokenResponse.access_token });
                await fetchProfile();
                navigate("/");
              } catch (err: any) {
                console.error("Error al iniciar sesión con Google:", err);
                setError(err.response?.data?.message || "Error al autenticar con Google.");
              } finally {
                setIsLoading(false);
              }
            }
          },
        });
        tokenClient.requestAccessToken();
      } else {
        setError("No se pudo cargar el SDK de Google Sign-In. Intente nuevamente.");
      }
    } catch (err) {
      console.error("Google init error:", err);
      setError("Error al iniciar Google Sign-In.");
    }
  };

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Por favor, ingrese su correo y contraseña.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await authService.login({ email, password });
      await fetchProfile();
      navigate("/");
    } catch (err) {
      console.error("Error al iniciar sesión:", err);
      if (isAxiosError(err)) {
        setError(err.response?.data?.message || "Credenciales incorrectas.");
      } else {
        setError("Error de conexión al servidor. Intente nuevamente.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen overflow-y-auto bg-[#f8f9fb] text-slate-900">
      <div className="mx-auto flex min-h-screen max-w-[1320px] flex-col px-4 py-4 sm:px-6 sm:py-5 lg:px-8 lg:py-6">
        <header className="flex items-center rounded-[22px] border border-white/70 bg-white/85 px-4 py-2.5 shadow-[0_18px_45px_-34px_rgba(15,23,42,0.35)] backdrop-blur md:px-5">
          <Link
            to="/"
            className="flex items-center gap-3 whitespace-nowrap transition-opacity hover:opacity-80"
          >
            <img
              src="/logo.jpeg"
              alt="RentTools Logo"
              className="h-10 w-10 rounded-xl object-cover shadow-[0_10px_24px_-16px_rgba(15,23,42,0.45)]"
            />
            <div className="text-[2rem] font-bold tracking-tight text-slate-900 leading-none">
              Rent<span className="font-medium text-slate-500">Tools</span>
            </div>
          </Link>
        </header>

        <main className="mt-4 grid flex-1 gap-4 lg:grid-cols-[1.02fr_0.82fr]">
          <section className="relative overflow-hidden rounded-[24px] bg-slate-950">
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${heroImage})` }}
            />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.18),rgba(15,23,42,0.85))]" />
            <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(15,23,42,0.9)_8%,rgba(15,23,42,0.38)_48%,rgba(15,23,42,0.78)_100%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,122,0,0.3),transparent_30%)]" />
            <div className="absolute left-6 top-6 h-16 w-16 rounded-full border border-white/15 bg-white/5 blur-2xl" />

            <div className="relative flex h-full min-h-[320px] flex-col justify-end p-5 md:p-6 xl:p-8">
              <div className="max-w-lg">
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-300">
                  Plataforma de renta profesional
                </p>
                <h1 className="max-w-md text-[2rem] font-black leading-[1.02] text-white sm:text-[2.35rem] xl:text-[2.8rem]">
                  Potencia industrial en tus manos.
                </h1>
                <p className="mt-3 max-w-sm text-sm leading-6 text-slate-200">
                  Administra tu flota, consulta disponibilidad en tiempo real y coordina
                  entregas con la precision que exige cada proyecto.
                </p>

                <div className="mt-5 flex flex-wrap gap-2">
                  <div className="rounded-xl border border-white/12 bg-white/10 px-3.5 py-2.5 backdrop-blur">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-300">
                      Cobertura
                    </p>
                    <p className="mt-1 text-lg font-black text-white">24/7</p>
                  </div>
                  <div className="rounded-xl border border-white/12 bg-white/10 px-3.5 py-2.5 backdrop-blur">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-300">
                      Inventario activo
                    </p>
                    <p className="mt-1 text-lg font-black text-white">+1,200</p>
                  </div>
                  <div className="rounded-xl border border-white/12 bg-white/10 px-3.5 py-2.5 backdrop-blur">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-300">
                      Respuesta
                    </p>
                    <p className="mt-1 text-lg font-black text-white">15 min</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="flex flex-col rounded-[24px] border border-white/70 bg-white/80 p-4 shadow-[0_22px_60px_-42px_rgba(15,23,42,0.4)] backdrop-blur md:p-5 xl:p-6">
            <div className="mx-auto flex w-full max-w-[390px] flex-1 flex-col justify-center">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">
                  Acceso seguro
                </p>
                <h2 className="mt-2 text-[1.7rem] font-black tracking-tight text-slate-950 md:text-[1.9rem]">
                  Bienvenido de nuevo
                </h2>
                <p className="mt-2 max-w-sm text-sm leading-5 text-slate-500">
                  Ingresa tus credenciales para acceder a tu panel profesional y
                  continuar gestionando equipos.
                </p>
              </div>

              {error && (
                <div className="mt-4 p-3 text-sm text-red-600 bg-red-50 rounded-xl font-medium border border-red-100">
                  {error}
                </div>
              )}

              <form className="mt-6 space-y-4" onSubmit={handleLogin}>
                <div className="space-y-1.5">
                  <label htmlFor="email" className="block text-[13px] font-bold text-slate-900">
                    Correo electronico
                  </label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400" />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="ejemplo@empresa.com"
                      className="h-12 rounded-xl border-[#dde5f0] bg-[#f3f6fc] pl-12 pr-4 text-sm shadow-none placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-primary/20"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-4">
                    <label htmlFor="password" className="block text-[13px] font-bold text-slate-900">
                      Contrasena
                    </label>
                    <a
                      href="#"
                      className="text-[13px] font-semibold text-primary transition-colors hover:text-[#e86f00]"
                    >
                      Olvidaste tu contrasena?
                    </a>
                  </div>

                  <div className="relative">
                    <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Ingresa tu contrasena"
                      className="h-12 rounded-xl border-[#dde5f0] bg-[#f3f6fc] pl-12 pr-12 text-sm shadow-none placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-primary/20"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((value) => !value)}
                      className="absolute right-4 top-1/2 inline-flex -translate-y-1/2 items-center justify-center text-slate-400 transition-colors hover:text-slate-700"
                      aria-label={showPassword ? "Ocultar contrasena" : "Mostrar contrasena"}
                    >
                      {showPassword ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
                    </button>
                  </div>
                </div>

                <label className="flex items-center gap-2.5 text-sm text-slate-600">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-slate-300 bg-white accent-[#ff7a00]"
                  />
                  Recordarme
                </label>

                <Button 
                  type="submit" 
                  disabled={isLoading}
                  className="h-12 w-full rounded-xl bg-primary text-sm font-black text-white shadow-[0_20px_45px_-28px_rgba(255,122,0,0.95)] hover:bg-[#e86f00] disabled:opacity-70"
                >
                  {isLoading ? "Iniciando sesión..." : "Iniciar sesion"}
                </Button>
              </form>

              <div className="my-5 flex items-center gap-3">
                <div className="h-px flex-1 bg-[#d9e2ef]" />
                <span className="text-xs font-medium text-slate-500">o continuar con</span>
                <div className="h-px flex-1 bg-[#d9e2ef]" />
              </div>

              <div className="grid gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleGoogleLogin}
                  disabled={isLoading}
                  className="h-11 rounded-xl border-[#dde5f0] bg-[#f3f6fc] text-sm font-bold text-slate-800 hover:bg-white flex items-center justify-center gap-2"
                >
                  <Globe className="h-[18px] w-[18px]" />
                  Google
                </Button>
              </div>

              <p className="mt-5 text-center text-sm text-slate-500">
                No tienes una cuenta?{" "}
               <Link to="/register" className="font-bold text-primary hover:text-[#e86f00]">
                 Registrate gratis
               </Link>
              </p>
            </div>
          </section>
        </main>

        <footer className="flex flex-col gap-2 px-1 pt-3 pb-1 text-sm text-slate-500 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-lg font-black tracking-tight text-slate-950">
              RentTools.
            </p>
            <p className="mt-1 text-xs">(c) 2026 RentTools.</p>
          </div>
        </footer>
      </div>
    </div>
  );
}
