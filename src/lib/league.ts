import { useEffect, useState } from "react";

export type LeagueRules = {
  winPoints: number;
  drawPoints: number;
  lossPoints: number;
  useGoalDiff: boolean;
  useGoalsFor: boolean;
  useWinRate: boolean;
};

export const DEFAULT_RULES: LeagueRules = {
  winPoints: 3,
  drawPoints: 1,
  lossPoints: 0,
  useGoalDiff: true,
  useGoalsFor: true,
  useWinRate: true,
};

export type Season = {
  id: string;
  name: string;
  startDate: string; // ISO date
  endDate: string | null;
  archived: boolean;
};

export type LeagueConfig = {
  leagueName: string;
  currentSeasonId: string | null;
  seasons: Season[];
  rules: LeagueRules;
};

const LS_KEY = "golaco.league.v1";

function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

function makeDefault(): LeagueConfig {
  const s: Season = {
    id: uid(),
    name: "Season 1",
    startDate: new Date().toISOString().slice(0, 10),
    endDate: null,
    archived: false,
  };
  return {
    leagueName: "GOLAÇO CUP 2026",
    currentSeasonId: s.id,
    seasons: [s],
    rules: { ...DEFAULT_RULES },
  };
}

function read(): LeagueConfig {
  if (typeof window === "undefined") return makeDefault();
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return makeDefault();
    const parsed = JSON.parse(raw) as Partial<LeagueConfig>;
    return {
      leagueName: parsed.leagueName ?? "GOLAÇO CUP 2026",
      currentSeasonId: parsed.currentSeasonId ?? null,
      seasons: parsed.seasons ?? [],
      rules: { ...DEFAULT_RULES, ...(parsed.rules ?? {}) },
    };
  } catch {
    return makeDefault();
  }
}

function write(cfg: LeagueConfig) {
  localStorage.setItem(LS_KEY, JSON.stringify(cfg));
  window.dispatchEvent(new CustomEvent("league-config-changed"));
}

export function useLeague() {
  const [cfg, setCfg] = useState<LeagueConfig>(() => read());

  useEffect(() => {
    const sync = () => setCfg(read());
    window.addEventListener("league-config-changed", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("league-config-changed", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const update = (partial: Partial<LeagueConfig>) => {
    const next = { ...cfg, ...partial };
    write(next);
    setCfg(next);
  };

  const currentSeason =
    cfg.seasons.find((s) => s.id === cfg.currentSeasonId) ?? cfg.seasons[0] ?? null;

  return {
    cfg,
    currentSeason,
    setLeagueName: (name: string) => update({ leagueName: name }),
    setRules: (rules: LeagueRules) => update({ rules }),
    setCurrentSeason: (id: string) => update({ currentSeasonId: id }),
    addSeason: (name: string, startDate: string) => {
      const s: Season = { id: uid(), name, startDate, endDate: null, archived: false };
      update({ seasons: [...cfg.seasons, s], currentSeasonId: s.id });
    },
    updateSeason: (id: string, patch: Partial<Season>) => {
      update({ seasons: cfg.seasons.map((s) => (s.id === id ? { ...s, ...patch } : s)) });
    },
    archiveSeason: (id: string) => {
      update({
        seasons: cfg.seasons.map((s) =>
          s.id === id ? { ...s, archived: true, endDate: s.endDate ?? new Date().toISOString().slice(0, 10) } : s,
        ),
      });
    },
    deleteSeason: (id: string) => {
      const next = cfg.seasons.filter((s) => s.id !== id);
      update({
        seasons: next,
        currentSeasonId: cfg.currentSeasonId === id ? next[0]?.id ?? null : cfg.currentSeasonId,
      });
    },
  };
}

export function matchInSeason(playedAt: string, season: Season | null): boolean {
  if (!season) return true;
  const t = new Date(playedAt).getTime();
  const start = new Date(season.startDate).getTime();
  if (t < start) return false;
  if (season.endDate) {
    const end = new Date(season.endDate).getTime() + 24 * 3600 * 1000;
    if (t > end) return false;
  }
  return true;
}
