import type { Team } from "@/lib/db";
import { cn } from "@/lib/utils";
import { flagUrl } from "@/lib/countries";

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

/**
 * Team crest: shows the real country flag as the background when the country
 * resolves to an ISO code, with the team monogram overlaid. Falls back to a
 * deterministic vector gradient when the country is unknown.
 */
export function TeamCrest({ team, size = 40, className }: {
  team?: { name: string; country: string; crest_url?: string } | null;
  size?: number;
  className?: string;
}) {
  const name = team?.name ?? "—";
  const country = team?.country ?? "";
  const uploaded = team?.crest_url && /^https?:\/\//i.test(team.crest_url) ? team.crest_url : null;
  const flag = !uploaded ? flagUrl(country, size > 64 ? "w320" : "w160") : null;
  const [c1, c2] = gradientFor(name + country);
  const mono = initials(name);

  return (
    <div
      className={cn("relative shrink-0 overflow-hidden rounded-[22%] ring-1 ring-black/20 shadow-md", className)}
      style={{ width: size, height: size, background: `linear-gradient(135deg, ${c1}, ${c2})` }}
      role="img"
      aria-label={`${name}${country ? ` (${country})` : ""}`}
    >
      {uploaded ? (
        <img
          src={uploaded}
          alt={name}
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : flag ? (
        <>
          <img
            src={flag}
            alt=""
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover"
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/20 to-black/45" />
          <span
            className="absolute inset-0 grid place-items-center font-display font-black text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]"
            style={{ fontSize: Math.max(10, size * 0.42), lineHeight: 1 }}
          >
            {mono}
          </span>
        </>
      ) : (
        <>
          {/* Default football-badge placeholder */}
          <svg viewBox="0 0 64 64" className="absolute inset-0 h-full w-full" aria-hidden>
            <defs>
              <radialGradient id={`b${hash(name).toString(36)}`} cx="50%" cy="40%" r="60%">
                <stop offset="0%" stopColor="white" stopOpacity="0.25" />
                <stop offset="100%" stopColor="white" stopOpacity="0" />
              </radialGradient>
            </defs>
            <circle cx="32" cy="32" r="22" fill="white" fillOpacity="0.95" />
            <polygon points="32,16 38,22 36,30 28,30 26,22" fill="black" />
            <polygon points="20,28 26,22 28,30 24,36 18,34" fill="black" />
            <polygon points="44,28 38,22 36,30 40,36 46,34" fill="black" />
            <polygon points="24,42 32,38 40,42 36,48 28,48" fill="black" />
            <circle cx="32" cy="32" r="22" fill={`url(#b${hash(name).toString(36)})`} />
          </svg>
          <span
            className="absolute inset-x-0 bottom-1 text-center font-display font-black text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]"
            style={{ fontSize: Math.max(8, size * 0.2), lineHeight: 1 }}
          >
            {mono}
          </span>
        </>
      )}
    </div>
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
