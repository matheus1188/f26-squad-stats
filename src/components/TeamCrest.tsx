import type { Team } from "@/lib/db";
import { cn } from "@/lib/utils";

/**
 * Premium shield-shaped vector crest — neon outline, gradient fill, monogram + country code.
 * Single visual style across every team to feel like an EA Sports / eFootball asset.
 */
function hash(str: string) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h;
}

// Per-team palette: pick a strong base hue then pair with neon green or blue accent.
function paletteFor(seed: string): { fillA: string; fillB: string; accent: string; stroke: string } {
  const h = hash(seed);
  const baseHue = h % 360;
  const fillA = `hsl(${baseHue} 70% 22%)`;
  const fillB = `hsl(${(baseHue + 20) % 360} 80% 12%)`;
  const useGreen = (h >> 4) % 2 === 0;
  const accent = useGreen ? "#39FF14" : "#00BFFF";
  const stroke = useGreen ? "rgba(57,255,20,0.75)" : "rgba(0,191,255,0.75)";
  return { fillA, fillB, accent, stroke };
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
  const p = paletteFor(name + country);
  const id = `g${hash(name + country).toString(36)}`;
  const mono = initials(name);
  const code = countryCode(country);
  // Shield path inside 64x72 viewBox
  const shield = "M32 2 L62 10 L62 36 Q62 58 32 70 Q2 58 2 36 L2 10 Z";

  return (
    <svg
      width={size} height={size * (72 / 64)} viewBox="0 0 64 72"
      className={cn("shrink-0", className)}
      role="img" aria-label={name}
      style={{ filter: `drop-shadow(0 0 6px ${p.accent}40)` }}
    >
      <defs>
        <linearGradient id={`f${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={p.fillA} />
          <stop offset="100%" stopColor={p.fillB} />
        </linearGradient>
        <linearGradient id={`s${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.4" />
          <stop offset="40%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* outer neon stroke */}
      <path d={shield} fill={`url(#f${id})`} stroke={p.stroke} strokeWidth="1.6" />
      {/* inner highlight */}
      <path d={shield} fill={`url(#s${id})`} />
      {/* accent diagonal */}
      <path d="M2 32 L62 12" stroke={p.accent} strokeOpacity="0.55" strokeWidth="1.3" />
      <path d="M2 44 L62 24" stroke={p.accent} strokeOpacity="0.25" strokeWidth="1" />
      {/* star above monogram */}
      <polygon
        points="32,12 33.2,15.3 36.5,15.3 33.8,17.4 34.9,20.7 32,18.7 29.1,20.7 30.2,17.4 27.5,15.3 30.8,15.3"
        fill={p.accent} fillOpacity="0.85"
      />
      {/* monogram */}
      <text
        x="32" y="46" textAnchor="middle"
        fontFamily="Orbitron, ui-sans-serif, system-ui"
        fontWeight="900" fontSize="20"
        fill="#ffffff"
      >{mono}</text>
      {code && (
        <text
          x="32" y="62" textAnchor="middle"
          fontFamily="ui-sans-serif, system-ui"
          fontWeight="700" fontSize="7"
          fill={p.accent} letterSpacing="1.2"
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
