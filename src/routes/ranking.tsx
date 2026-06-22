import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { AppLayout } from "@/components/AppLayout";
import { fetchMatches, fetchPlayers, queryKeys, type Match } from "@/lib/db";
import { computePlayerStats, matchWinner, type PlayerStats } from "@/lib/stats";
import { Card, CardContent } from "@/components/ui/card";
import { Trophy, Medal, Award, Flame, Crown, Target, Zap, Activity } from "lucide-react";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export const Route = createFileRoute("/ranking")({
  head: () => ({ meta: [{ title: "Ranking — GOLAÇO CUP" }] }),
  component: RankingPage,
});

function initials(name: string) {
  return name.split(" ").map((p) => p[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
}

function computeStreak(playerId: string, matches: Match[]) {
  const sorted = matches
    .filter((m) => m.player1_id === playerId || m.player2_id === playerId)
    .sort((a, b) => (b.played_at + b.created_at).localeCompare(a.played_at + a.created_at));
  let streak = 0;
  for (const m of sorted) {
    const w = matchWinner(m);
    const isP1 = m.player1_id === playerId;
    const won = (w === "p1" && isP1) || (w === "p2" && !isP1);
    if (won) streak++;
    else break;
  }
  return streak;
}

function RankingPage() {
  const t = useT();
  const players = useQuery({ queryKey: queryKeys.players, queryFn: fetchPlayers });
  const matches = useQuery({ queryKey: queryKeys.matches, queryFn: fetchMatches });
  const stats = useMemo(
    () => computePlayerStats(players.data ?? [], matches.data ?? []),
    [players.data, matches.data],
  );
  const matchList = matches.data ?? [];

  if (stats.length === 0 || matchList.length === 0) {
    return (
      <AppLayout title={t("ranking.title")} subtitle={t("ranking.subtitle")}>
        <Card className="glass-card">
          <CardContent className="py-12 text-center text-muted-foreground">
            <Trophy className="size-10 mx-auto mb-3 opacity-50" />
            {t("ranking.empty")}
          </CardContent>
        </Card>
      </AppLayout>
    );
  }

  const played = stats.filter((s) => s.played > 0);
  const ranked = played.length > 0 ? played : stats;

  // Special cards
  const champion = ranked[0];
  const bestWinRate = [...ranked].sort((a, b) => b.winRate - a.winRate || b.played - a.played)[0];
  const topScorer = [...ranked].sort((a, b) => b.goalsFor - a.goalsFor)[0];
  const mostActive = [...ranked].sort((a, b) => b.played - a.played)[0];

  const top3 = ranked.slice(0, 3);

  return (
    <AppLayout title={t("ranking.title")} subtitle={t("ranking.subtitle")}>
      {/* Special cards */}
      <div className="grid grid-cols-2 gap-2 mb-5">
        <SpecialCard icon={Crown} label={t("ranking.champion")} name={champion?.player.name} value={`${champion?.points ?? 0} pts`} tone="gold" />
        <SpecialCard icon={Target} label={t("ranking.best_winrate")} name={bestWinRate?.player.name} value={`${Math.round((bestWinRate?.winRate ?? 0) * 100)}%`} tone="green" />
        <SpecialCard icon={Zap} label={t("ranking.top_scorer")} name={topScorer?.player.name} value={`${topScorer?.goalsFor ?? 0} ⚽`} tone="blue" />
        <SpecialCard icon={Activity} label={t("ranking.most_active")} name={mostActive?.player.name} value={t("players.x_matches", { n: mostActive?.played ?? 0 })} tone="purple" />
      </div>

      {/* Podium */}
      {top3.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-6 items-end max-w-2xl mx-auto">
          {[1, 0, 2].map((idx, pos) => {
            const s = top3[idx];
            if (!s) return <div key={pos} />;
            const heights = ["h-28", "h-40", "h-20"];
            const tones = [
              { ring: "ring-slate-300", grad: "from-slate-200 via-slate-400 to-slate-600", glow: "shadow-[0_0_30px_-5px_rgba(148,163,184,0.7)]", Icon: Medal, label: "2nd" },
              { ring: "ring-amber-400", grad: "from-yellow-200 via-amber-400 to-yellow-600", glow: "shadow-[0_0_40px_-5px_rgba(250,204,21,0.85)]", Icon: Crown, label: "1st" },
              { ring: "ring-orange-500", grad: "from-orange-300 via-amber-600 to-orange-800", glow: "shadow-[0_0_30px_-5px_rgba(249,115,22,0.7)]", Icon: Award, label: "3rd" },
            ];
            const tone = tones[idx];
            return (
              <div key={s.player.id} className="flex flex-col items-center gap-2 animate-fade-in" style={{ animationDelay: `${pos * 80}ms` }}>
                <div className="relative">
                  {idx === 0 && <Crown className="absolute -top-5 left-1/2 -translate-x-1/2 size-6 text-amber-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.9)] animate-pulse" />}
                  <Avatar className={cn("size-16 ring-4", tone.ring, idx === 0 && "size-20")}>
                    {s.player.avatar_url && <AvatarImage src={s.player.avatar_url} />}
                    <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground font-display font-black">
                      {initials(s.player.name)}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div className="text-center min-w-0 w-full">
                  <div className="font-display font-bold text-sm truncate">{s.player.name}</div>
                  <div className="text-xs text-primary font-bold">{s.points} pts</div>
                </div>
                <div className={cn(
                  "w-full rounded-t-2xl bg-gradient-to-b text-black grid place-items-center gap-1",
                  heights[pos], tone.grad, tone.glow,
                )}>
                  <tone.Icon className="size-6 drop-shadow" />
                  <div className="font-display font-black text-2xl">#{idx + 1}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Full leaderboard */}
      <div className="grid gap-2 max-w-3xl mx-auto">
        {ranked.map((s, i) => (
          <RankRow key={s.player.id} s={s} i={i} streak={computeStreak(s.player.id, matchList)} />
        ))}
      </div>
    </AppLayout>
  );
}

function SpecialCard({
  icon: Icon, label, name, value, tone,
}: {
  icon: typeof Crown; label: string; name?: string; value: string;
  tone: "gold" | "green" | "blue" | "purple";
}) {
  const tones: Record<string, string> = {
    gold:   "border-amber-400/40 shadow-[0_0_24px_-10px_rgba(250,204,21,0.7)] text-amber-300",
    green:  "border-emerald-400/40 shadow-[0_0_24px_-10px_rgba(52,211,153,0.7)] text-emerald-300",
    blue:   "border-sky-400/40 shadow-[0_0_24px_-10px_rgba(56,189,248,0.7)] text-sky-300",
    purple: "border-violet-400/40 shadow-[0_0_24px_-10px_rgba(167,139,250,0.7)] text-violet-300",
  };
  return (
    <Card className={cn("glass-card border animate-fade-in", tones[tone])}>
      <CardContent className="p-3">
        <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-bold">
          <Icon className="size-3.5" /> {label}
        </div>
        <div className="mt-1.5 font-bold text-sm truncate text-foreground">{name ?? "—"}</div>
        <div className="text-xs text-muted-foreground tabular-nums">{value}</div>
      </CardContent>
    </Card>
  );
}

function RankRow({ s, i, streak }: { s: PlayerStats; i: number; streak: number }) {
  const t = useT();
  const winPct = Math.round(s.winRate * 100);
  const isLeader = i === 0;
  const positionStyles = i === 0
    ? "bg-gradient-to-br from-amber-300 to-yellow-600 text-black"
    : i === 1
      ? "bg-gradient-to-br from-slate-200 to-slate-500 text-black"
      : i === 2
        ? "bg-gradient-to-br from-orange-300 to-amber-700 text-black"
        : "bg-foreground/10 text-foreground";
  return (
    <Card
      className={cn(
        "glass-card animate-fade-in border transition-all hover:shadow-[0_0_24px_-8px_rgba(var(--accent-glow),0.7)]",
        isLeader ? "border-[color:var(--primary)]/50 shadow-[0_0_28px_-10px_rgba(var(--accent-glow),0.8)]" : "border-[color:var(--primary)]/15",
      )}
      style={{ animationDelay: `${i * 25}ms` }}
    >
      <CardContent className="p-3">
        <div className="flex items-center gap-3">
          <div className={cn("size-9 rounded-full grid place-items-center font-display font-black text-sm shrink-0", positionStyles)}>
            {i + 1}
          </div>
          <Avatar className="size-10 shrink-0">
            {s.player.avatar_url && <AvatarImage src={s.player.avatar_url} />}
            <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground font-bold text-xs">
              {initials(s.player.name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <div className="font-bold text-sm truncate">{s.player.name}</div>
              {isLeader && (
                <span className="text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded-full bg-primary/15 text-primary font-bold">
                  {t("ranking.leader")}
                </span>
              )}
              {streak >= 2 && (
                <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-[color:var(--win,theme(colors.emerald.400))]">
                  <Flame className="size-3" />{streak}
                </span>
              )}
            </div>
            <div className="mt-1 h-1.5 rounded-full bg-foreground/10 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[color:var(--primary)] to-[color:var(--win,theme(colors.emerald.400))] transition-[width] duration-700 ease-out"
                style={{ width: `${winPct}%` }}
              />
            </div>
            <div className="mt-1 text-[10px] text-muted-foreground font-semibold">
              {s.wins}W · {s.draws}D · {s.losses}L · {winPct}%
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className="font-display font-black text-xl neon-text leading-none">{s.points}</div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mt-0.5">pts</div>
          </div>
        </div>
        {/* expanded stats grid */}
        <div className="mt-3 pt-3 border-t border-border/40 grid grid-cols-6 gap-1 text-center">
          <Stat label={t("ranking.played")} value={s.played} />
          <Stat label={t("ranking.wins")} value={s.wins} />
          <Stat label={t("ranking.draws")} value={s.draws} />
          <Stat label={t("ranking.losses")} value={s.losses} />
          <Stat label={t("ranking.goals_for")} value={s.goalsFor} />
          <Stat label={t("ranking.goal_diff")} value={(s.goalDiff > 0 ? "+" : "") + s.goalDiff} />
        </div>
      </CardContent>
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="min-w-0">
      <div className="text-sm font-bold tabular-nums">{value}</div>
      <div className="text-[9px] uppercase tracking-wider text-muted-foreground">{label}</div>
    </div>
  );
}
