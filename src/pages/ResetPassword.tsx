import React from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Eye, EyeOff, LockKeyhole } from "lucide-react";
import { isAxiosError } from "axios";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { authService } from "../services/authService";

export function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [done, setDone] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (password !== confirm) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      await authService.resetPassword(token, password);
      setDone(true);
      setTimeout(() => navigate("/login", { replace: true }), 2500);
    } catch (err) {
      if (isAxiosError(err) && err.response) {
        setError(err.response.data?.message || "No se pudo restablecer la contraseña.");
      } else {
        setError("No se pudo conectar con el servidor. Intenta nuevamente.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fb] text-slate-900">
      <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-10">
        <Link to="/" className="mx-auto mb-8 flex items-center gap-3">
          <img src="/logo.jpeg" alt="RentTools" className="h-11 w-11 rounded-xl object-cover" />
          <span className="text-2xl font-bold tracking-tight">
            Rent<span className="font-medium text-slate-500">Tools</span>
          </span>
        </Link>

        <section className="rounded-[24px] border border-white/70 bg-white/90 p-6 shadow-[0_22px_60px_-42px_rgba(15,23,42,0.4)] backdrop-blur sm:p-8">
          {done ? (
            <div className="text-center">
              <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-2xl bg-emerald-50 border border-emerald-100">
                <CheckCircle2 className="h-8 w-8 text-emerald-600" />
              </div>
              <h1 className="text-2xl font-black tracking-tight">Contraseña actualizada</h1>
              <p className="mt-3 text-sm leading-6 text-slate-500">
                Ya puedes iniciar sesión con tu nueva contraseña. Te redirigiremos en un momento.
              </p>
              <Link
                to="/login"
                className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-primary hover:text-[#e86f00]"
              >
                Ir a iniciar sesión
              </Link>
            </div>
          ) : !token ? (
            <div className="text-center">
              <h1 className="text-2xl font-black tracking-tight">Enlace inválido</h1>
              <p className="mt-3 text-sm leading-6 text-slate-500">
                Este enlace de recuperación no es válido. Solicita uno nuevo desde la página de
                recuperación.
              </p>
              <Link
                to="/forgot-password"
                className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-primary hover:text-[#e86f00]"
              >
                Solicitar nuevo enlace
              </Link>
            </div>
          ) : (
            <>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">
                Nueva contraseña
              </p>
              <h1 className="mt-2 text-2xl font-black tracking-tight">Restablece tu contraseña</h1>
              <p className="mt-2 text-sm leading-5 text-slate-500">
                Crea una contraseña segura de al menos 8 caracteres.
              </p>

              {error && (
                <div className="mt-4 rounded-xl border border-red-100 bg-red-50 p-3 text-sm font-medium text-red-600">
                  {error}
                </div>
              )}

              <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
                <div className="space-y-1.5">
                  <label htmlFor="password" className="block text-[13px] font-bold text-slate-900">
                    Nueva contraseña
                  </label>
                  <div className="relative">
                    <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Mínimo 8 caracteres"
                      className="h-12 rounded-xl border-[#dde5f0] bg-[#f3f6fc] pl-12 pr-12 text-sm shadow-none placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-primary/20"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-4 top-1/2 inline-flex -translate-y-1/2 items-center justify-center text-slate-400 transition-colors hover:text-slate-700"
                      aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                    >
                      {showPassword ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="confirm" className="block text-[13px] font-bold text-slate-900">
                    Confirmar contraseña
                  </label>
                  <div className="relative">
                    <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400" />
                    <Input
                      id="confirm"
                      type={showPassword ? "text" : "password"}
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      placeholder="Repite la contraseña"
                      className="h-12 rounded-xl border-[#dde5f0] bg-[#f3f6fc] pl-12 pr-4 text-sm shadow-none placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-primary/20"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="h-12 w-full rounded-xl bg-primary text-sm font-black text-white hover:bg-[#e86f00] disabled:opacity-70"
                >
                  {isLoading ? "Guardando..." : "Cambiar contraseña"}
                </Button>
              </form>

              <Link
                to="/login"
                className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-800"
              >
                <ArrowLeft className="h-4 w-4" /> Volver a iniciar sesión
              </Link>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
