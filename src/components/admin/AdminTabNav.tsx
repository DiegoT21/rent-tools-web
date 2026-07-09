import { useNavigate, useSearchParams } from "react-router-dom";
import { cn } from "@/lib/utils";

const tabs = [
  { id: "users", label: "Usuarios" },
  { id: "audit", label: "Auditoría" },
  { id: "chat", label: "Soporte" },
  { id: "disputes", label: "Disputas" },
  { id: "catalog", label: "Catálogo" },
  { id: "listings", label: "Publicaciones" },
] as const;

export type AdminTabId = (typeof tabs)[number]["id"];

export function AdminTabNav() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const activeTab = (searchParams.get("tab") || "users") as AdminTabId;

  return (
    <div className="mb-6 -mx-1 overflow-x-auto pb-1">
      <div className="flex min-w-max gap-1 rounded-2xl border border-slate-200 bg-slate-50/80 p-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => navigate(`/admin?tab=${tab.id}`)}
            className={cn(
              "rounded-xl px-4 py-2 text-sm font-semibold transition-colors whitespace-nowrap",
              activeTab === tab.id
                ? "bg-white text-indigo-700 shadow-sm border border-slate-200"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/60",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}
