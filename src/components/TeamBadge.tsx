import type { Team } from "@/lib/db";
import { cn } from "@/lib/utils";
import { Shield } from "lucide-react";

export function TeamBadge({ team, size = "md", showName = true, className }: {
  team?: Team | null;
  size?: "sm" | "md" | "lg";
  showName?: boolean;
  className?: string;
}) {
  const s = size === "lg" ? "size-12" : size === "sm" ? "size-6" : "size-8";
  return (
    <div className={cn("flex items-center gap-2 min-w-0", className)}>
      <div className={cn("shrink-0 grid place-items-center rounded-md bg-white/5 border border-white/10 overflow-hidden", s)}>
        {team?.crest_url ? (
          <img src={team.crest_url} alt={team.name} className="size-full object-contain p-0.5" loading="lazy" />
        ) : (
          <Shield className="size-3/5 text-muted-foreground" />
        )}
      </div>
      {showName && (
        <span className="truncate text-sm font-medium">{team?.name ?? "—"}</span>
      )}
    </div>
  );
}
