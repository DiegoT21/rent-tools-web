import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Mail, MailCheck } from "lucide-react";
import { isAxiosError } from "axios";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { authService } from "../services/authService";

export function ForgotPassword() {
  const [email, setEmail] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [sent, setSent] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email) {
      setError("Ingresa tu correo electrónico.");
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      await authService.forgotPassword(email);
      setSent(true);
    } catch (err) {
      if (isAxiosError(err) && err.response) {
        setError(err.response.data?.message || "No se pudo procesar la solicitud.");
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
          {sent ? (
            <div className="text-center">
              <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-2xl bg-emerald-50 border border-emerald-100">
                <MailCheck className="h-8 w-8 text-emerald-600" />
              </div>
              <h1 className="text-2xl font-black tracking-tight">Revisa tu correo</h1>
              <p className="mt-3 text-sm leading-6 text-slate-500">
                Si <strong>{email}</strong> está registrado, te enviamos un enlace para restablecer
                tu contraseña. El enlace vence en 1 hora.
              </p>
              <Link
                to="/login"
                className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-primary hover:text-[#e86f00]"
              >
                <ArrowLeft className="h-4 w-4" /> Volver a iniciar sesión
              </Link>
            </div>
          ) : (
            <>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">
                Recuperación de cuenta
              </p>
              <h1 className="mt-2 text-2xl font-black tracking-tight">¿Olvidaste tu contraseña?</h1>
              <p className="mt-2 text-sm leading-5 text-slate-500">
                Ingresa el correo asociado a tu cuenta y te enviaremos un enlace para crear una nueva.
              </p>

              {error && (
                <div className="mt-4 rounded-xl border border-red-100 bg-red-50 p-3 text-sm font-medium text-red-600">
                  {error}
                </div>
              )}

              <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
                <div className="space-y-1.5">
                  <label htmlFor="email" className="block text-[13px] font-bold text-slate-900">
                    Correo electrónico
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

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="h-12 w-full rounded-xl bg-primary text-sm font-black text-white hover:bg-[#e86f00] disabled:opacity-70"
                >
                  {isLoading ? "Enviando..." : "Enviar enlace"}
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
