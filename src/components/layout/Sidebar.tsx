import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Grid, Pickaxe, Settings, ShoppingCart, TestTube } from "lucide-react";
import { cn } from "@/lib/utils";
import { categoryService, DEFAULT_CATEGORY_TREE, type CategoryTreeNode } from "@/services/catalogService";

const iconBySlug: Record<string, typeof Grid> = {
  "herramientas-poder": Pickaxe,
  "medicion-precision": TestTube,
  "energia-generacion": ShoppingCart,
  "excavacion-demolicion": Settings,
  "elevacion-manejo": Grid,
  "laboratorio-ti": TestTube,
  drills: Pickaxe,
  access: Settings,
  generators: ShoppingCart,
  saws: TestTube,
};

export function Sidebar({
  className,
  onClose,
}: {
  className?: string;
  onClose?: () => void;
}) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const activeCategory = searchParams.get("category");
  const [categories, setCategories] = useState<Array<{ name: string; slug: string }>>(
    DEFAULT_CATEGORY_TREE.map((c) => ({ name: c.name, slug: c.slug })),
  );

  useEffect(() => {
    categoryService
      .listTree()
      .then((items: CategoryTreeNode[]) => {
        if (items.length > 0) {
          setCategories(items.map((c) => ({ name: c.name, slug: c.slug })));
        }
      })
      .catch(() => {
        /* fallback defaults */
      });
  }, []);

  const handleSelect = (slug: string | null) => {
    const next = new URLSearchParams(searchParams);
    if (slug) next.set("category", slug);
    else next.delete("category");
    next.delete("q");
    navigate(`/?${next.toString()}`);
    onClose?.();
  };

  return (
    <div className={cn("flex flex-col bg-[#f0f3fa] border-r border-[#e5e9f2] p-4", className)}>
      <div className="flex flex-col space-y-1 mb-8 pt-4 px-2">
        <h2 className="text-lg font-bold text-slate-900 tracking-tight">Categorías</h2>
        <p className="text-xs text-slate-500 font-medium">Inventario Profesional</p>
      </div>

      <nav className="flex-1 space-y-1.5">
        <button
          type="button"
          onClick={() => handleSelect(null)}
          className={cn(
            "flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200",
            !activeCategory
              ? "bg-white text-primary shadow-sm ring-1 ring-slate-900/5"
              : "text-slate-600 hover:bg-white/50 hover:text-slate-900",
          )}
        >
          <Grid className={cn("h-5 w-5", !activeCategory ? "text-primary" : "text-slate-400")} />
          Todo el Equipo
        </button>
        {categories.map((cat) => {
          const Icon = iconBySlug[cat.slug] ?? Pickaxe;
          const isActive = activeCategory === cat.slug;
          return (
            <button
              key={cat.slug}
              type="button"
              onClick={() => handleSelect(cat.slug)}
              className={cn(
                "flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200",
                isActive
                  ? "bg-white text-primary shadow-sm ring-1 ring-slate-900/5"
                  : "text-slate-600 hover:bg-white/50 hover:text-slate-900",
              )}
            >
              <Icon className={cn("h-5 w-5", isActive ? "text-primary" : "text-slate-400")} />
              {cat.name}
            </button>
          );
        })}
      </nav>

      <div className="mt-auto p-1">
        <div className="bg-[#1a1f2e] text-white rounded-2xl p-5 relative overflow-hidden group border border-slate-800">
          <div className="relative z-10 flex flex-col gap-1.5">
            <p className="text-[10px] font-bold tracking-widest text-[#8e9bb3] uppercase">Acceso a la Flota</p>
            <h3 className="text-sm font-semibold mb-2">Mejorar a Pro</h3>
            <button
              type="button"
              className="flex w-full items-center justify-center rounded-lg bg-primary hover:bg-[#ff8c26] px-4 py-2 text-xs font-bold text-white transition-colors shadow-[0_0_15px_-3px_rgba(255,122,0,0.5)]"
            >
              Mejorar a Flota
            </button>
          </div>
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/5 rounded-full border border-white/10 group-hover:scale-110 transition-transform duration-500" />
        </div>
      </div>
    </div>
  );
}
