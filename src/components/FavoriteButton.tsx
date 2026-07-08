import { useNavigate } from "react-router-dom";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import { useFavoritesStore } from "@/store/favoritesStore";
import { alerts } from "@/lib/alerts";

interface FavoriteButtonProps {
  toolUuid: string;
  className?: string;
  size?: "sm" | "md";
}

export function FavoriteButton({ toolUuid, className, size = "md" }: FavoriteButtonProps) {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const isFavorite = useFavoritesStore((state) => state.ids.includes(toolUuid));
  const toggle = useFavoritesStore((state) => state.toggle);

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      navigate("/login");
      return;
    }
    if (!toolUuid) return;
    try {
      await toggle(toolUuid);
    } catch {
      alerts.error("No se pudo actualizar", "Inténtalo de nuevo en un momento.");
    }
  };

  const box = size === "sm" ? "h-8 w-8" : "h-9 w-9";
  const icon = size === "sm" ? "h-4 w-4" : "h-[18px] w-[18px]";

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={isFavorite ? "Quitar de favoritos" : "Agregar a favoritos"}
      aria-pressed={isFavorite}
      className={cn(
        "grid place-items-center rounded-full border bg-white/90 shadow-sm backdrop-blur-sm transition-colors hover:bg-white",
        isFavorite ? "border-red-200 text-red-500" : "border-slate-200 text-slate-500 hover:text-red-500",
        box,
        className,
      )}
    >
      <Heart className={cn(icon, isFavorite && "fill-red-500")} />
    </button>
  );
}
