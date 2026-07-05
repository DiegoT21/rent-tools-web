import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { PublicTool, toolService } from "@/services/toolService";
import { Button } from "@/components/ui/button";

const fallbackImage =
  "https://images.unsplash.com/photo-1504148455328-c376907d081c?q=80&w=600&auto=format&fit=crop";

type ToolCardVariant = "standard" | "featured" | "compact";

interface ToolCardProps {
  tool: PublicTool;
  variant?: ToolCardVariant;
  badge?: string;
  showOffer?: boolean;
}

export function ToolCard({ tool, variant = "standard", badge, showOffer }: ToolCardProps) {
  const navigate = useNavigate();
  const images = toolService.getToolImages(tool, 3);
  const pics = images.length ? images : [fallbackImage];
  const [imgIdx, setImgIdx] = useState(0);
  const uuid = toolService.getToolId(tool);
  const price = typeof tool.pricePerDay === "number" ? tool.pricePerDay : 0;
  const category = (tool.category ?? "herramientas").toString().toUpperCase();
  const isRented = tool.rentalState === "rented";
  const available = tool.isAvailable !== false && !isRented;

  const goToDetail = () => uuid && navigate(`/tools/${uuid}`);

  const RentalBadge = ({ className }: { className?: string }) =>
    isRented ? (
      <span
        className={cn(
          "rounded px-2 py-0.5 text-[9px] font-bold tracking-wider uppercase bg-primary text-white",
          className,
        )}
        title="Actualmente alquilado"
      >
        act. Alq.
      </span>
    ) : null;

  if (variant === "featured") {
    return (
      <div
        className="group relative cursor-pointer overflow-hidden rounded-2xl bg-slate-900 min-h-[420px] lg:min-h-full shadow-lg"
        onClick={goToDetail}
      >
        <img
          src={pics[imgIdx]}
          alt={tool.name}
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-900/50 to-slate-900/20" />
        <div className="absolute right-4 top-4">
          <RentalBadge />
        </div>
        <div className="relative flex h-full min-h-[420px] flex-col justify-end p-8">
          <span className="mb-4 w-fit rounded-md bg-primary px-3 py-1 text-[10px] font-bold tracking-widest text-white uppercase">
            {badge ?? "Más popular"}
          </span>
          <h3 className="mb-2 text-3xl font-black text-white">{tool.name}</h3>
          <p className="mb-6 max-w-md text-sm text-slate-300">
            Equipo industrial verificado, listo para operar con soporte 24/7.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <div>
              <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">Desde</p>
              <p className="text-3xl font-black text-white">
                ${price}
                <span className="text-base font-medium text-slate-400"> /día</span>
              </p>
            </div>
            <Button
              className="rounded-xl bg-white px-6 py-5 font-bold text-slate-900 hover:bg-slate-100"
              onClick={(e) => { e.stopPropagation(); goToDetail(); }}
            >
              Ver detalles
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (variant === "compact") {
    return (
      <div
        className="group flex cursor-pointer gap-4 overflow-hidden rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition-all hover:shadow-md"
        onClick={goToDetail}
      >
        <div className="relative h-28 w-32 shrink-0 overflow-hidden rounded-xl bg-slate-100">
          <img src={pics[0]} alt={tool.name} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
          <div className="absolute left-2 top-2 flex flex-col gap-1">
            {badge && (
              <span className="rounded bg-slate-900/80 px-2 py-0.5 text-[9px] font-bold tracking-wider text-white uppercase">
                {badge}
              </span>
            )}
            <RentalBadge />
          </div>
        </div>
        <div className="flex min-w-0 flex-1 flex-col justify-between py-1">
          <div>
            <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">{category}</p>
            <h3 className="truncate font-bold text-slate-900">{tool.name}</h3>
            <p className="mt-1 text-xs text-slate-500 line-clamp-2">
              Renta diaria con entrega coordinada y seguro incluido.
            </p>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-lg font-black text-slate-900">
              ${price}
              <span className="text-xs font-medium text-slate-400"> /día</span>
            </p>
            <button
              type="button"
              className="grid h-9 w-9 place-items-center rounded-full bg-primary text-white shadow-md shadow-primary/25 transition-transform group-hover:scale-105"
              onClick={(e) => { e.stopPropagation(); goToDetail(); }}
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="group cursor-pointer overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition-all duration-300 hover:shadow-xl"
      onClick={goToDetail}
    >
      <div className="relative overflow-hidden bg-slate-50 pt-[72%]">
        <img
          src={pics[imgIdx]}
          alt={tool.name}
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <span
          className={cn(
            "absolute left-3 top-3 rounded px-2 py-0.5 text-[9px] font-bold tracking-wider uppercase",
            isRented
              ? "bg-primary text-white"
              : showOffer
                ? "bg-primary text-white"
                : "bg-white/95 text-slate-600",
          )}
        >
          {isRented ? "Alq." : showOffer ? "Oferta" : available ? "Disponible" : "Reservado"}
        </span>
        {pics.length > 1 && (
          <>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setImgIdx((i) => (i - 1 + pics.length) % pics.length); }}
              className="absolute left-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full border border-slate-200 bg-white/90 text-slate-700 opacity-0 transition-opacity group-hover:opacity-100"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setImgIdx((i) => (i + 1) % pics.length); }}
              className="absolute right-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full border border-slate-200 bg-white/90 text-slate-700 opacity-0 transition-opacity group-hover:opacity-100"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
            <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1">
              {pics.map((_, i) => (
                <span key={i} className={cn("h-1.5 w-1.5 rounded-full", i === imgIdx ? "bg-primary" : "bg-white/70")} />
              ))}
            </div>
          </>
        )}
      </div>
      <div className="p-4">
        <p className="mb-1 text-[10px] font-bold tracking-widest text-slate-400 uppercase">{category}</p>
        <h3 className="mb-3 truncate font-bold text-slate-900">{tool.name}</h3>
        <p className="mb-4 text-xs text-slate-500">Precio por día</p>
        <div className="flex items-end justify-between">
          <p className="text-2xl font-black text-slate-900">${price}</p>
          <span className="rounded-lg border border-orange-100 bg-orange-50 px-3 py-1.5 text-xs font-bold text-primary">
            Ver más
          </span>
        </div>
      </div>
    </div>
  );
}
