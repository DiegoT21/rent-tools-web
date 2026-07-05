import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ChevronLeft, ChevronRight, Flame, Clock, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { PublicTool, toolService } from "@/services/toolService";

const fallbackImage =
  "https://images.unsplash.com/photo-1504148455328-c376907d081c?q=80&w=600&auto=format&fit=crop";

function ToolCard({ tool }: { tool: PublicTool }) {
  const navigate = useNavigate();
  const images = toolService.getToolImages(tool, 3);
  const pics = images.length ? images : [fallbackImage];
  const [imgIdx, setImgIdx] = useState(0);
  const uuid = toolService.getToolId(tool);
  const price = typeof tool.pricePerDay === "number" ? tool.pricePerDay : 0;
  const category = (tool.category ?? "herramientas").toString().toUpperCase();

  return (
    <div
      className="group cursor-pointer rounded-2xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 bg-white"
      onClick={() => uuid && navigate(`/tools/${uuid}`)}
    >
      <div className="relative pt-[68%] overflow-hidden bg-slate-100">
        <img
          src={pics[imgIdx]}
          alt={tool.name}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {pics.length > 1 && (
          <>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setImgIdx((i) => (i - 1 + pics.length) % pics.length); }}
              className="absolute left-2 top-1/2 -translate-y-1/2 h-7 w-7 rounded-full bg-white/90 border border-slate-200 text-slate-700 grid place-items-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setImgIdx((i) => (i + 1) % pics.length); }}
              className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 rounded-full bg-white/90 border border-slate-200 text-slate-700 grid place-items-center opacity-0 group-hover:opacity-100 transition-opacity"
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
        <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase mb-1">{category}</p>
        <h3 className="font-bold text-slate-900 text-base mb-3 truncate">{tool.name}</h3>
        <div className="flex items-end justify-between">
          <div>
            <span className="text-xl font-bold text-slate-900">${price}</span>
            <span className="text-xs text-slate-400 font-medium"> /día</span>
          </div>
          <span className="text-xs font-semibold text-primary bg-orange-50 border border-orange-100 px-2 py-1 rounded-lg">Ver más</span>
        </div>
      </div>
    </div>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="rounded-2xl bg-slate-100 animate-pulse h-64" />
      ))}
    </div>
  );
}

function Section({ title, subtitle, icon, tools, loading }: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  tools: PublicTool[];
  loading: boolean;
}) {
  return (
    <div className="mb-14">
      <div className="flex items-end gap-3 mb-6">
        <div className="bg-orange-50 border border-orange-100 p-2 rounded-xl">{icon}</div>
        <div>
          <h2 className="text-2xl font-black text-slate-900 leading-none">{title}</h2>
          <p className="text-sm text-slate-400 font-medium mt-0.5">{subtitle}</p>
        </div>
      </div>
      {loading ? (
        <SkeletonGrid />
      ) : tools.length === 0 ? (
        <p className="text-slate-400 text-sm">Aún no hay herramientas para mostrar.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
          {tools.map((tool) => <ToolCard key={toolService.getToolId(tool)} tool={tool} />)}
        </div>
      )}
    </div>
  );
}

export function Home() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") ?? "";

  const [allTools, setAllTools] = useState<PublicTool[]>([]);
  const [popular, setPopular] = useState<PublicTool[]>([]);
  const [loadingAll, setLoadingAll] = useState(true);
  const [loadingPopular, setLoadingPopular] = useState(true);

  useEffect(() => {
    let cancelled = false;
    toolService.getPublicTools()
      .then((t) => { if (!cancelled) { setAllTools(t); setLoadingAll(false); } })
      .catch(() => { if (!cancelled) setLoadingAll(false); });
    toolService.getPopularTools(7, 8)
      .then((t) => { if (!cancelled) { setPopular(t); setLoadingPopular(false); } })
      .catch(() => { if (!cancelled) setLoadingPopular(false); });
    return () => { cancelled = true; };
  }, []);

  const recent = useMemo(() => allTools.slice(0, 8), [allTools]);

  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return allTools.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        (t.category ?? "").toLowerCase().includes(q)
    );
  }, [query, allTools]);

  const isSearching = query.trim().length > 0;

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      {isSearching ? (
        <div className="mb-14">
          <div className="flex items-center gap-2 mb-6">
            <Search className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-black text-slate-900">
              {loadingAll ? "Buscando..." : `${searchResults.length} resultado${searchResults.length !== 1 ? "s" : ""} para "${query.trim()}"`}
            </h2>
          </div>
          {loadingAll ? (
            <SkeletonGrid />
          ) : searchResults.length === 0 ? (
            <p className="text-slate-400 text-sm">No se encontraron herramientas con ese nombre o categoría.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
              {searchResults.map((tool) => <ToolCard key={toolService.getToolId(tool)} tool={tool} />)}
            </div>
          )}
        </div>
      ) : (
        <>
          <Section
            title="Lo más rentado esta semana"
            subtitle="Herramientas con más actividad en los últimos 7 días"
            icon={<Flame className="h-5 w-5 text-primary" />}
            tools={popular}
            loading={loadingPopular}
          />
          <Section
            title="Publicados recientemente"
            subtitle="Las últimas herramientas disponibles en el catálogo"
            icon={<Clock className="h-5 w-5 text-primary" />}
            tools={recent}
            loading={loadingAll}
          />
        </>
      )}
    </div>
  );
}
