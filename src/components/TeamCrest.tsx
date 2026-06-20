import type { Team } from "@/lib/db";
import { cn } from "@/lib/utils";

/**
 * Vector-style team crest: deterministic gradient + monogram + optional country code.
 * Replaces realistic flag images with a clean, premium, consistent look.
 */
function hash(str: string) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h;
}

function gradientFor(seed: string): [string, string] {
  const h = hash(seed);
  const h1 = h % 360;
  const h2 = (h1 + 40 + (h % 60)) % 360;
  return [`hsl(${h1} 75% 55%)`, `hsl(${h2} 80% 45%)`];
}

function initials(name: string) {
  const words = name.replace(/[^\p{L}\p{N}\s]/gu, "").split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

function countryCode(country: string) {
  return country.replace(/[^\p{L}]/gu, "").slice(0, 3).toUpperCase();
}

export function TeamCrest({ team, size = 40, className }: {
  team?: { name: string; country: string } | null;
  size?: number;
  className?: string;
}) {
  const name = team?.name ?? "—";
  const country = team?.country ?? "";
  const [c1, c2] = gradientFor(name + country);
  const id = `g${hash(name + country).toString(36)}`;
  const mono = initials(name);
  const code = countryCode(country);
  return (
    <svg
      width={size} height={size} viewBox="0 0 64 64"
      className={cn("shrink-0 drop-shadow-sm", className)}
      role="img" aria-label={name}
    >
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={c1} />
          <stop offset="100%" stopColor={c2} />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="60" height="60" rx="16" fill={`url(#${id})`} />
      <rect x="2" y="2" width="60" height="60" rx="16" fill="white" fillOpacity="0.06" />
      <path d="M2 18 Q 32 30 62 18" stroke="white" strokeOpacity="0.18" strokeWidth="1.2" fill="none" />
      <path d="M2 46 Q 32 58 62 46" stroke="white" strokeOpacity="0.18" strokeWidth="1.2" fill="none" />
      <text
        x="32" y="38" textAnchor="middle"
        fontFamily="ui-sans-serif, system-ui, -apple-system"
        fontWeight="800" fontSize="22"
        fill="white" fillOpacity="0.95"
      >{mono}</text>
      {code && (
        <text
          x="32" y="54" textAnchor="middle"
          fontFamily="ui-sans-serif, system-ui"
          fontWeight="700" fontSize="7"
          fill="white" fillOpacity="0.8" letterSpacing="1"
        >{code}</text>
      )}
    </svg>
  );
}

export function TeamRow({ team, size = 32, className, align = "left" }: {
  team?: Team | null;
  size?: number;
  className?: string;
  align?: "left" | "right";
}) {
  return (
    <div className={cn("flex items-center gap-2 min-w-0", align === "right" && "flex-row-reverse", className)}>
      <TeamCrest team={team} size={size} />
      <div className={cn("min-w-0", align === "right" && "text-right")}>
        <div className="truncate text-sm font-semibold leading-tight">{team?.name ?? "—"}</div>
        {team?.country && <div className="truncate text-[10px] uppercase tracking-wider text-muted-foreground">{team.country}</div>}
      </div>
    </div>
  );
}
