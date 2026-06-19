import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppLayout } from "@/components/AppLayout";
import { fetchMatches, fetchPlayers, queryKeys } from "@/lib/db";
import { computePlayerStats, matchWinner, type PlayerStats } from "@/lib/stats";
import { Card, CardContent } from "@/components/ui/card";
import { Trophy, Medal, Award, Flame } from "lucide-react";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export const Route = createFileRoute("/ranking")({
  head: () => ({ meta: [{ title: "Ranking — GolaçoCup" }] }),
  component: RankingPage,
});

function initials(name: string) {
  return name.split(" ").map(p => p[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
}

function computeStreak(playerId: string, matches: { player1_id: string; player2_id: string; score1: number; score2: number; played_at: string; created_at: string }[]) {
  const sorted = matches
    .filter(m => m.player1_id === playerId || m.player2_id === playerId)
    .sort((a, b) => (b.played_at + b.created_at).localeCompare(a.played_at + a.created_at));
  let streak = 0;
  for (const m of sorted) {
    const w = matchWinner(m as never);
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
  const stats = computePlayerStats(players.data ?? [], matches.data ?? []);

  if (stats.length === 0) {
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

  const top3 = stats.slice(0, 3);
  const rest = stats.slice(3);

  return (
    <AppLayout title={t("ranking.title")} subtitle={t("ranking.subtitle")}>
      {/* Podium */}
      {top3.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-6 items-end max-w-2xl mx-auto">
          {[1, 0, 2].map((idx, pos) => {
            const s = top3[idx];
            if (!s) return <div key={pos} />;
            const heights = ["h-32", "h-40", "h-24"];
            const colors = [
              "from-slate-300 to-slate-500",
              "from-amber-300 to-yellow-500",
              "from-orange-400 to-amber-700",
            ];
            const medalIdx = idx;
            const Icon = idx === 0 ? Trophy : idx === 1 ? Medal : Award;
            return (
              <div key={s.player.id} className="flex flex-col items-center gap-2 pop" style={{ animationDelay: `${pos * 80}ms` }}>
                <Avatar className={cn("size-16 ring-4", idx === 0 ? "ring-amber-400" : idx === 1 ? "ring-slate-400" : "ring-orange-500")}>
                  {s.player.avatar_url && <AvatarImage src={s.player.avatar_url} />}
                  <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground font-display font-black">
                    {initials(s.player.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="text-center min-w-0 w-full">
                  <div className="font-display font-bold text-sm truncate">{s.player.name}</div>
                  <div className="text-xs text-primary font-bold">{s.points} pts</div>
                </div>
                <div className={cn("w-full rounded-t-2xl bg-gradient-to-b text-primary-foreground grid place-items-center gap-1 glass-card", heights[pos], colors[medalIdx])}>
                  <Icon className="size-6" />
                  <div className="font-display font-black text-2xl">#{idx + 1}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Full leaderboard list */}
      <div className="grid gap-2 max-w-3xl mx-auto">
        {stats.map((s, i) => <RankRow key={s.player.id} s={s} i={i} streak={computeStreak(s.player.id, matches.data ?? [])} />)}
      </div>
    </AppLayout>
  );
}

function RankRow({ s, i, streak }: { s: PlayerStats; i: number; streak: number }) {
  const t = useT();
  const winPct = Math.round(s.winRate * 100);
  const isLeader = i === 0;
  return (
    <Card className={cn("glass-card float-in", isLeader && "ring-2 ring-primary")} style={{ animationDelay: `${i * 25}ms` }}>
      <CardContent className="p-3 flex items-center gap-3">
        <div className={cn("size-9 rounded-full grid place-items-center font-display font-black text-sm shrink-0",
          isLeader ? "bg-primary text-primary-foreground" : "bg-foreground/10")}>
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
            {isLeader && <span className="text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded-full bg-primary/15 text-primary font-bold">{t("ranking.leader")}</span>}
            {streak >= 2 && (
              <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-[color:var(--accent)]">
                <Flame className="size-3" />{streak}
              </span>
            )}
          </div>
          <div className="mt-1 h-1.5 rounded-full bg-foreground/10 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-primary to-[color:var(--win)] transition-all duration-700" style={{ width: `${winPct}%` }} />
          </div>
          <div className="mt-1 text-[10px] text-muted-foreground font-semibold">
            {s.wins}W · {s.draws}D · {s.losses}L · {winPct}%
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="font-display font-black text-xl neon-text leading-none">{s.points}</div>
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mt-0.5">pts</div>
        </div>
      </CardContent>
    </Card>
  );
}
