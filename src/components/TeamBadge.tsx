import type { Team } from "@/lib/db";
import { cn } from "@/lib/utils";
import { TeamCrest } from "./TeamCrest";

export function TeamBadge({ team, size = "md", showName = true, className, reverse = false }: {
  team?: Team | null;
  size?: "sm" | "md" | "lg";
  showName?: boolean;
  className?: string;
  reverse?: boolean;
}) {
  const px = size === "lg" ? 48 : size === "sm" ? 24 : 32;
  return (
    <div className={cn("flex items-center gap-2 min-w-0", reverse && "flex-row-reverse", className)}>
      <TeamCrest team={team} size={px} />
      {showName && (
        <span className={cn("truncate text-sm font-medium", reverse && "text-right")}>{team?.name ?? "—"}</span>
      )}
    </div>
  );
}
