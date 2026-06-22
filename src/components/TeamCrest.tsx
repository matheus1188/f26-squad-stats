import type { Team } from "@/lib/db";
import { cn } from "@/lib/utils";

/**
 * Premium shield-shaped vector crests — neon outline, gradient fill, iconic per-country motif.
 * Single visual style across every team to feel like an EA Sports / eFootball asset.
 */
function hash(str: string) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h;
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

// Iconic per-team palette + motif. Falls back to a generic neon shield.
type Variant = {
  fillA: string;
  fillB: string;
  accent: string;
  stroke: string;
  motif: "star" | "stars" | "cross" | "rooster" | "crown" | "lion" | "stripes" | "circle" | "diamond";
  showMono?: boolean;
};

const VARIANTS: Record<string, Variant> = {
  // Countries
  brazil:      { fillA: "#0066b3", fillB: "#003a66", accent: "#FFDF00", stroke: "rgba(255,223,0,0.8)", motif: "star",   showMono: false },
  brasil:      { fillA: "#0066b3", fillB: "#003a66", accent: "#FFDF00", stroke: "rgba(255,223,0,0.8)", motif: "star",   showMono: false },
  argentina:   { fillA: "#75AADB", fillB: "#3A6A95", accent: "#FFD700", stroke: "rgba(255,215,0,0.8)", motif: "stripes",showMono: false },
  england:     { fillA: "#f8fafc", fillB: "#cbd5e1", accent: "#D52B1E", stroke: "rgba(213,43,30,0.8)", motif: "cross",  showMono: false },
  inglaterra:  { fillA: "#f8fafc", fillB: "#cbd5e1", accent: "#D52B1E", stroke: "rgba(213,43,30,0.8)", motif: "cross",  showMono: false },
  france:      { fillA: "#1d3a8a", fillB: "#0b1d4a", accent: "#ef4444", stroke: "rgba(239,68,68,0.8)", motif: "rooster",showMono: false },
  frança:      { fillA: "#1d3a8a", fillB: "#0b1d4a", accent: "#ef4444", stroke: "rgba(239,68,68,0.8)", motif: "rooster",showMono: false },
  francia:     { fillA: "#1d3a8a", fillB: "#0b1d4a", accent: "#ef4444", stroke: "rgba(239,68,68,0.8)", motif: "rooster",showMono: false },
  portugal:    { fillA: "#a30022", fillB: "#5a0014", accent: "#FFD700", stroke: "rgba(255,215,0,0.8)", motif: "crown",  showMono: false },
  spain:       { fillA: "#c1121f", fillB: "#660b14", accent: "#FFD700", stroke: "rgba(255,215,0,0.8)", motif: "stars",  showMono: false },
  españa:      { fillA: "#c1121f", fillB: "#660b14", accent: "#FFD700", stroke: "rgba(255,215,0,0.8)", motif: "stars",  showMono: false },
  espanha:     { fillA: "#c1121f", fillB: "#660b14", accent: "#FFD700", stroke: "rgba(255,215,0,0.8)", motif: "stars",  showMono: false },
  germany:     { fillA: "#0a0a0a", fillB: "#1f1f1f", accent: "#FFCC00", stroke: "rgba(255,204,0,0.8)", motif: "lion",   showMono: false },
  alemanha:    { fillA: "#0a0a0a", fillB: "#1f1f1f", accent: "#FFCC00", stroke: "rgba(255,204,0,0.8)", motif: "lion",   showMono: false },
  alemania:    { fillA: "#0a0a0a", fillB: "#1f1f1f", accent: "#FFCC00", stroke: "rgba(255,204,0,0.8)", motif: "lion",   showMono: false },
  italy:       { fillA: "#0d7a3a", fillB: "#053d1d", accent: "#FFFFFF", stroke: "rgba(255,255,255,0.8)", motif: "stripes", showMono: false },
  italia:      { fillA: "#0d7a3a", fillB: "#053d1d", accent: "#FFFFFF", stroke: "rgba(255,255,255,0.8)", motif: "stripes", showMono: false },
  netherlands: { fillA: "#ff6a00", fillB: "#a83e00", accent: "#FFFFFF", stroke: "rgba(255,255,255,0.8)", motif: "lion",  showMono: false },
  holanda:     { fillA: "#ff6a00", fillB: "#a83e00", accent: "#FFFFFF", stroke: "rgba(255,255,255,0.8)", motif: "lion",  showMono: false },
  belgium:     { fillA: "#0a0a0a", fillB: "#1f1f1f", accent: "#F5C518", stroke: "rgba(245,197,24,0.8)", motif: "diamond", showMono: false },
  belgica:     { fillA: "#0a0a0a", fillB: "#1f1f1f", accent: "#F5C518", stroke: "rgba(245,197,24,0.8)", motif: "diamond", showMono: false },
  bélgica:     { fillA: "#0a0a0a", fillB: "#1f1f1f", accent: "#F5C518", stroke: "rgba(245,197,24,0.8)", motif: "diamond", showMono: false },
  // Clubs
  "manchester city":   { fillA: "#6CABDD", fillB: "#1c5d8a", accent: "#FFFFFF", stroke: "rgba(255,255,255,0.7)", motif: "circle" },
  "manchester united": { fillA: "#DA291C", fillB: "#7a1812", accent: "#FBE122", stroke: "rgba(251,225,34,0.85)", motif: "diamond" },
  liverpool:           { fillA: "#C8102E", fillB: "#6a0a1c", accent: "#FFD700", stroke: "rgba(255,215,0,0.85)", motif: "lion" },
  chelsea:             { fillA: "#034694", fillB: "#011d44", accent: "#FFD700", stroke: "rgba(255,215,0,0.85)", motif: "lion" },
  "real madrid":       { fillA: "#FEFEFE", fillB: "#cbd5e1", accent: "#FEBE10", stroke: "rgba(254,190,16,0.9)", motif: "crown" },
  barcelona:           { fillA: "#a50044", fillB: "#004d98", accent: "#FFED02", stroke: "rgba(255,237,2,0.85)", motif: "stripes" },
  "bayern munich":     { fillA: "#DC052D", fillB: "#7a0319", accent: "#0066B2", stroke: "rgba(0,102,178,0.85)", motif: "diamond" },
  "bayern münchen":    { fillA: "#DC052D", fillB: "#7a0319", accent: "#0066B2", stroke: "rgba(0,102,178,0.85)", motif: "diamond" },
  psg:                 { fillA: "#004170", fillB: "#001833", accent: "#ED1C24", stroke: "rgba(237,28,36,0.85)", motif: "crown" },
  "paris saint-germain": { fillA: "#004170", fillB: "#001833", accent: "#ED1C24", stroke: "rgba(237,28,36,0.85)", motif: "crown" },
  juventus:            { fillA: "#0a0a0a", fillB: "#1a1a1a", accent: "#FFFFFF", stroke: "rgba(255,255,255,0.75)", motif: "stripes" },
  "inter milan":       { fillA: "#0068A8", fillB: "#011833", accent: "#0a0a0a", stroke: "rgba(0,191,255,0.85)", motif: "circle" },
  inter:               { fillA: "#0068A8", fillB: "#011833", accent: "#0a0a0a", stroke: "rgba(0,191,255,0.85)", motif: "circle" },
  "ac milan":          { fillA: "#FB090B", fillB: "#7a0506", accent: "#0a0a0a", stroke: "rgba(255,255,255,0.7)", motif: "stripes" },
  milan:               { fillA: "#FB090B", fillB: "#7a0506", accent: "#0a0a0a", stroke: "rgba(255,255,255,0.7)", motif: "stripes" },
  arsenal:             { fillA: "#EF0107", fillB: "#7a0104", accent: "#FFFFFF", stroke: "rgba(255,255,255,0.85)", motif: "crown" },
  tottenham:           { fillA: "#FEFEFE", fillB: "#cbd5e1", accent: "#132257", stroke: "rgba(19,34,87,0.85)", motif: "circle" },
};

function paletteFor(name: string, country: string): Variant {
  const key = name.trim().toLowerCase();
  if (VARIANTS[key]) return VARIANTS[key];
  const ckey = country.trim().toLowerCase();
  if (VARIANTS[ckey]) return VARIANTS[ckey];
  // Generic neon fallback (deterministic)
  const h = hash(name + country);
  const baseHue = h % 360;
  const useGreen = (h >> 4) % 2 === 0;
  return {
    fillA: `hsl(${baseHue} 70% 22%)`,
    fillB: `hsl(${(baseHue + 20) % 360} 80% 12%)`,
    accent: useGreen ? "#39FF14" : "#00BFFF",
    stroke: useGreen ? "rgba(57,255,20,0.75)" : "rgba(0,191,255,0.75)",
    motif: "star",
    showMono: true,
  };
}

function Motif({ motif, accent }: { motif: Variant["motif"]; accent: string }) {
  switch (motif) {
    case "star":
      return (
        <polygon
          points="32,22 35,32 45,32 37,38 40,48 32,42 24,48 27,38 19,32 29,32"
          fill={accent} stroke="#fff" strokeOpacity="0.4" strokeWidth="0.5"
        />
      );
    case "stars":
      return (
        <g fill={accent}>
          <polygon points="32,20 33.5,24 38,24 34.4,26.5 35.8,30.5 32,28 28.2,30.5 29.6,26.5 26,24 30.5,24" />
          <polygon points="20,32 21.2,35 24.5,35 21.8,37 22.8,40 20,38.2 17.2,40 18.2,37 15.5,35 18.8,35" />
          <polygon points="44,32 45.2,35 48.5,35 45.8,37 46.8,40 44,38.2 41.2,40 42.2,37 39.5,35 42.8,35" />
        </g>
      );
    case "cross":
      return (
        <g fill={accent}>
          <rect x="29" y="18" width="6" height="32" />
          <rect x="14" y="31" width="36" height="6" />
        </g>
      );
    case "rooster":
      return (
        <g fill={accent} stroke="#fff" strokeOpacity="0.3" strokeWidth="0.5">
          {/* stylized rooster head */}
          <path d="M22 40 Q22 28 32 26 Q42 26 42 38 L40 44 L34 44 L34 48 L30 48 L30 44 L24 44 Z" />
          <polygon points="32,20 36,24 32,26 28,24" />
          <circle cx="38" cy="32" r="1.5" fill="#0a0a0a" />
        </g>
      );
    case "crown":
      return (
        <g fill={accent} stroke="#fff" strokeOpacity="0.3" strokeWidth="0.5">
          <path d="M18 42 L22 24 L28 36 L32 22 L36 36 L42 24 L46 42 Z" />
          <rect x="18" y="42" width="28" height="4" />
        </g>
      );
    case "lion":
      return (
        <g fill={accent} stroke="#fff" strokeOpacity="0.3" strokeWidth="0.5">
          <circle cx="32" cy="34" r="11" />
          <path d="M24 28 L20 22 L25 26 Z M40 28 L44 22 L39 26 Z" />
          <path d="M28 36 Q32 40 36 36" stroke="#0a0a0a" strokeWidth="1.2" fill="none" />
          <circle cx="28" cy="32" r="1.3" fill="#0a0a0a" />
          <circle cx="36" cy="32" r="1.3" fill="#0a0a0a" />
        </g>
      );
    case "stripes":
      return (
        <g>
          <rect x="14" y="22" width="6" height="30" fill={accent} fillOpacity="0.85" />
          <rect x="29" y="22" width="6" height="30" fill={accent} fillOpacity="0.85" />
          <rect x="44" y="22" width="6" height="30" fill={accent} fillOpacity="0.85" />
        </g>
      );
    case "circle":
      return (
        <g fill="none" stroke={accent} strokeWidth="2.5">
          <circle cx="32" cy="34" r="12" />
          <circle cx="32" cy="34" r="6" />
        </g>
      );
    case "diamond":
      return (
        <g fill={accent} stroke="#fff" strokeOpacity="0.3" strokeWidth="0.5">
          <polygon points="32,18 46,34 32,50 18,34" />
          <polygon points="32,26 40,34 32,42 24,34" fill="#0a0a0a" fillOpacity="0.3" />
        </g>
      );
  }
}

export function TeamCrest({ team, size = 40, className }: {
  team?: { name: string; country: string } | null;
  size?: number;
  className?: string;
}) {
  const name = team?.name ?? "—";
  const country = team?.country ?? "";
  const p = paletteFor(name, country);
  const id = `g${hash(name + country).toString(36)}`;
  const mono = initials(name);
  const code = countryCode(country);
  const shield = "M32 2 L62 10 L62 36 Q62 58 32 70 Q2 58 2 36 L2 10 Z";

  return (
    <svg
      width={size} height={size * (72 / 64)} viewBox="0 0 64 72"
      className={cn("shrink-0", className)}
      role="img" aria-label={name}
      style={{ filter: `drop-shadow(0 0 8px ${p.accent}55)` }}
    >
      <defs>
        <linearGradient id={`f${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={p.fillA} />
          <stop offset="100%" stopColor={p.fillB} />
        </linearGradient>
        <linearGradient id={`s${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.35" />
          <stop offset="45%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
        <clipPath id={`c${id}`}>
          <path d={shield} />
        </clipPath>
      </defs>
      {/* shield */}
      <path d={shield} fill={`url(#f${id})`} stroke={p.stroke} strokeWidth="1.8" />
      {/* inner highlight */}
      <path d={shield} fill={`url(#s${id})`} />
      {/* motif clipped to shield */}
      <g clipPath={`url(#c${id})`}>
        <Motif motif={p.motif} accent={p.accent} />
      </g>
      {/* monogram (only fallback) */}
      {p.showMono && (
        <text
          x="32" y="46" textAnchor="middle"
          fontFamily="Orbitron, ui-sans-serif, system-ui"
          fontWeight="900" fontSize="20"
          fill="#ffffff"
        >{mono}</text>
      )}
      {code && (
        <text
          x="32" y="65" textAnchor="middle"
          fontFamily="ui-sans-serif, system-ui"
          fontWeight="800" fontSize="6.5"
          fill="#ffffff" fillOpacity="0.9" letterSpacing="1.2"
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
