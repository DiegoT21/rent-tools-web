import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Search } from "lucide-react";
import { PublicTool, toolService } from "@/services/toolService";
import { HomeHero } from "@/components/home/HomeHero";
import { PopularSection } from "@/components/home/PopularSection";
import { RecentSection } from "@/components/home/RecentSection";
import { ProviderCta } from "@/components/home/ProviderCta";
import { ToolCard } from "@/components/home/ToolCard";

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-72 animate-pulse rounded-2xl bg-slate-200" />
      ))}
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

  const recent = useMemo(() => {
    const withDate = allTools as Array<PublicTool & { createdAt?: string }>;
    return [...withDate]
      .sort((a, b) => {
        const da = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const db = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return db - da;
      })
      .slice(0, 8);
  }, [allTools]);

  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return allTools.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        (t.category ?? "").toLowerCase().includes(q),
    );
  }, [query, allTools]);

  const isSearching = query.trim().length > 0;

  if (isSearching) {
    return (
      <div className="-mx-8 -mt-8">
        <div className="mx-auto max-w-7xl px-8 py-10">
          <div className="mb-8 flex items-center gap-2">
            <Search className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-black text-slate-900">
              {loadingAll
                ? "Buscando..."
                : `${searchResults.length} resultado${searchResults.length !== 1 ? "s" : ""} para "${query.trim()}"`}
            </h2>
          </div>
          {loadingAll ? (
            <SkeletonGrid />
          ) : searchResults.length === 0 ? (
            <p className="text-sm text-slate-400">No se encontraron herramientas con ese nombre o categoría.</p>
          ) : (
            <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
              {searchResults.map((tool) => (
                <ToolCard key={toolService.getToolId(tool)} tool={tool} />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="-mx-8 -mt-8">
      <HomeHero />
      <div className="mx-auto max-w-7xl px-8 py-12">
        <PopularSection tools={popular} loading={loadingPopular} />
        <RecentSection tools={recent} loading={loadingAll} />
        <ProviderCta />
      </div>
    </div>
  );
}
