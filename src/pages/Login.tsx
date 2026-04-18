import React from "react";
import { BriefcaseBusiness, Eye, EyeOff, Globe, LockKeyhole, Mail } from "lucide-react";
import { Link } from "react-router-dom";
import heroImage from "../assets/hero.png";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";

export function Login() {
  const [showPassword, setShowPassword] = React.useState(false);

  return (
    <div className="min-h-screen overflow-y-auto bg-[#f8f9fb] text-slate-900">
      <div className="mx-auto flex min-h-screen max-w-[1320px] flex-col px-4 py-4 sm:px-6 sm:py-5 lg:px-8 lg:py-6">
        <header className="flex items-center rounded-[22px] border border-white/70 bg-white/85 px-4 py-2.5 shadow-[0_18px_45px_-34px_rgba(15,23,42,0.35)] backdrop-blur md:px-5">
          <Link to="/" className="flex items-center gap-3 text-slate-950">
            <span className="relative inline-flex h-10 w-10 items-center justify-center overflow-hidden rounded-[18px] bg-[#121c34] shadow-[0_14px_30px_-18px_rgba(18,28,52,0.8)]">
              <span className="text-[1.35rem] font-black tracking-[-0.08em] text-primary">RT</span>
              <span className="absolute bottom-1.5 right-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-white text-[9px] font-black text-[#121c34] shadow-sm">
                {"\u2713"}
              </span>
            </span>
            <span className="text-lg font-black tracking-tight md:text-xl">RentTools</span>
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

              <form className="mt-6 space-y-4" onSubmit={(event) => event.preventDefault()}>
                <div className="space-y-1.5">
                  <label htmlFor="email" className="block text-[13px] font-bold text-slate-900">
                    Correo electronico
                  </label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400" />
                    <Input
                      id="email"
                      type="email"
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

                <Button className="h-12 w-full rounded-xl bg-primary text-sm font-black text-white shadow-[0_20px_45px_-28px_rgba(255,122,0,0.95)] hover:bg-[#e86f00]">
                  Iniciar sesion
                </Button>
              </form>

              <div className="my-5 flex items-center gap-3">
                <div className="h-px flex-1 bg-[#d9e2ef]" />
                <span className="text-xs font-medium text-slate-500">o continuar con</span>
                <div className="h-px flex-1 bg-[#d9e2ef]" />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <Button
                  variant="outline"
                  className="h-11 rounded-xl border-[#dde5f0] bg-[#f3f6fc] text-sm font-bold text-slate-800 hover:bg-white"
                >
                  <Globe className="h-[18px] w-[18px]" />
                  Google
                </Button>
                <Button
                  variant="outline"
                  className="h-11 rounded-xl border-[#dde5f0] bg-[#f3f6fc] text-sm font-bold text-slate-800 hover:bg-white"
                >
                  <BriefcaseBusiness className="h-[18px] w-[18px]" />
                  LinkedIn
                </Button>
              </div>

              <p className="mt-5 text-center text-sm text-slate-500">
                No tienes una cuenta?{" "}
                <a href="#" className="font-bold text-primary transition-colors hover:text-[#e86f00]">
                  Registrate gratis
                </a>
              </p>
            </div>
          </section>
        </main>

        <footer className="flex flex-col gap-2 px-1 pt-3 pb-1 text-sm text-slate-500 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-lg font-black tracking-tight text-slate-950">
              RentTools Industrial.
            </p>
            <p className="mt-1 text-xs">(c) 2026 RentTools.</p>
          </div>
        </footer>
      </div>
    </div>
  );
}
