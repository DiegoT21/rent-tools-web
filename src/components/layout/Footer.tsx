import { Link } from "react-router-dom";
import { Globe, Mail } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-slate-200 bg-[#f3f4f6]">
      <div className="container mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-8 sm:gap-6 sm:px-6 sm:py-10 md:flex-row lg:px-8">
        <div className="flex flex-col items-center gap-2 md:items-start">
          <Link to="/" className="text-lg font-black tracking-tight text-slate-900">
            Rent<span className="text-primary">Tools</span>
          </Link>
          <p className="text-xs font-medium text-slate-500">
            © {new Date().getFullYear()} RentTools Industrial. Professional Grade Reliability.
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-6 text-xs font-semibold tracking-wide text-slate-500 uppercase">
          <a href="#" className="transition-colors hover:text-primary">Términos de Servicio</a>
          <a href="#" className="transition-colors hover:text-primary">Política de Privacidad</a>
          <a href="#" className="transition-colors hover:text-primary">Soporte Técnico</a>
          <a href="#" className="transition-colors hover:text-primary">Contacto</a>
        </div>
        <div className="flex items-center gap-3 text-slate-400">
          <button type="button" className="grid h-9 w-9 place-items-center rounded-full border border-slate-200 bg-white transition-colors hover:text-primary">
            <Globe className="h-4 w-4" />
          </button>
          <button type="button" className="grid h-9 w-9 place-items-center rounded-full border border-slate-200 bg-white transition-colors hover:text-primary">
            <Mail className="h-4 w-4" />
          </button>
        </div>
      </div>
    </footer>
  );
}
