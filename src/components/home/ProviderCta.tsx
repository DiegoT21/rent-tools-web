import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/useAuthStore";

export function ProviderCta() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  return (
    <section className="mb-10 overflow-hidden rounded-2xl bg-slate-900 shadow-xl">
      <div className="flex flex-col items-start justify-between gap-6 px-8 py-10 md:flex-row md:items-center md:px-10">
        <div className="max-w-2xl">
          <h3 className="mb-3 text-2xl font-black text-white md:text-3xl">
            ¿Tienes equipo parado?
          </h3>
          <p className="text-sm leading-relaxed text-slate-300 md:text-base">
            Únete a nuestra red de proveedores y empieza a rentar tus herramientas industriales hoy mismo con seguro incluido.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-3">
          <Button
            className="rounded-xl bg-primary px-6 py-5 font-bold text-white hover:bg-primary/90"
            onClick={() => {
              if (!user) navigate("/register");
              else if (!user.isVerified) navigate("/register/step-2");
              else navigate("/profile?tab=publicar");
            }}
          >
            Registrar mi equipo
          </Button>
          <Button
            variant="outline"
            className="rounded-xl border-white/30 bg-transparent px-6 py-5 font-bold text-white hover:bg-white/10 hover:text-white"
            onClick={() => {
              if (!user) navigate("/login");
              else navigate("/profile");
            }}
          >
            Saber más
          </Button>
        </div>
      </div>
    </section>
  );
}
