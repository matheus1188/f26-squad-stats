import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppLayout } from "@/components/AppLayout";
import { fetchMatches, fetchPlayers, fetchTeams, queryKeys } from "@/lib/db";
import { computePlayerStats, matchWinner } from "@/lib/stats";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TeamCrest } from "@/components/TeamCrest";
import { Trophy, Target, Flame, Gamepad2, Plus, ArrowRight, Crown, Sparkles } from "lucide-react";
import { format, parseISO, subDays } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [{ title: "F26 Arena" }] }),
  component: Dashboard,
});

function Dashboard() {
  const t = useT();
  const players = useQuery({ queryKey: queryKeys.players, queryFn: fetchPlayers });
  const teams = useQuery({ queryKey: queryKeys.teams, queryFn: fetchTeams });
  const matches = useQuery({ queryKey: queryKeys.matches, queryFn: fetchMatches });

  const stats = computePlayerStats(players.data ?? [], matches.data ?? []);
  const totalMatches = matches.data?.length ?? 0;
  const mostMatches = [...stats].sort((a, b) => b.played - a.played)[0];
  const mostWins = [...stats].sort((a, b) => b.wins - a.wins)[0];
  const topScorer = [...stats].sort((a, b) => b.goalsFor - a.goalsFor)[0];
  const recent = (matches.data ?? []).slice(0, 8);
  const playerById = new Map((players.data ?? []).map((p) => [p.id, p]));
  const teamById = new Map((teams.data ?? []).map((t) => [t.id, t]));

  // Champion of the week
  const weekAgo = subDays(new Date(), 7);
  const weekMatches = (matches.data ?? []).filter((m) => parseISO(m.played_at) >= weekAgo);
  const weekStats = computePlayerStats(players.data ?? [], weekMatches);
  const champion = weekStats[0];
  const latest = recent[0];
  const latestWinner = latest
    ? matchWinner(latest) === "p1"
      ? playerById.get(latest.player1_id)
      : matchWinner(latest) === "p2"
      ? playerById.get(latest.player2_id)
      : null
    : null;

  return (
    <AppLayout
      title={t("dashboard.title")}
      subtitle={t("dashboard.subtitle")}
      action={
        <Link to="/matches/new" className="hidden md:inline-flex">
          <Button className="gap-1.5 rounded-2xl tap"><Plus className="size-4" /> {t("common.new_match")}</Button>
        </Link>
      }
    >
      {/* Hero cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 mb-4">
        {champion && (
          <Card className="glass-card overflow-hidden relative pop">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-accent/20 pointer-events-none" />
            <CardContent className="p-5 relative">
              <div className="flex items-center gap-2 text-primary text-xs font-semibold uppercase tracking-widest">
                <Crown className="size-4" /> {t("dashboard.champion_week")}
              </div>
              <div className="mt-3 flex items-center justify-between">
                <div className="min-w-0">
                  <div className="font-display text-2xl font-black truncate">{champion.player.name}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {champion.wins}W · {champion.draws}D · {champion.losses}L · {champion.points} pts
                  </div>
                </div>
                <div className="size-16 grid place-items-center rounded-2xl bg-gradient-to-br from-primary to-accent text-primary-foreground font-display font-black text-3xl shadow-lg">
                  {champion.player.name[0]?.toUpperCase()}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {latestWinner && latest && (
          <Card className="glass-card overflow-hidden relative pop">
            <div className="absolute inset-0 bg-gradient-to-br from-[color:var(--win)]/20 via-transparent to-primary/10 pointer-events-none" />
            <CardContent className="p-5 relative">
              <div className="flex items-center gap-2 text-[color:var(--win)] text-xs font-semibold uppercase tracking-widest">
                <Sparkles className="size-4" /> {t("dashboard.latest_winner")}
              </div>
              <div className="mt-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-display text-2xl font-black truncate">{latestWinner.name}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {latest.score1}–{latest.score2} · {format(parseISO(latest.played_at), "MMM d")}
                  </div>
                </div>
                <div className="flex gap-1">
                  <TeamCrest team={teamById.get(latest.team1_id ?? "")} size={44} />
                  <TeamCrest team={teamById.get(latest.team2_id ?? "")} size={44} />
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <StatCard icon={<Gamepad2 className="size-5" />} label={t("dashboard.matches")} value={totalMatches} accent="primary" />
        <StatCard icon={<Flame className="size-5" />} label={t("dashboard.most_active")} value={mostMatches?.played ?? 0} sub={mostMatches?.player.name ?? "—"} accent="accent" />
        <StatCard icon={<Trophy className="size-5" />} label={t("dashboard.most_wins")} value={mostWins?.wins ?? 0} sub={mostWins?.player.name ?? "—"} accent="win" />
        <StatCard icon={<Target className="size-5" />} label={t("dashboard.top_scorer")} value={topScorer?.goalsFor ?? 0} sub={topScorer?.player.name ?? "—"} accent="draw" />
      </div>

      {/* Recent matches carousel */}
      <section className="mt-6 md:mt-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-sm font-bold uppercase tracking-[0.2em] text-muted-foreground">{t("dashboard.recent")}</h2>
          <Link to="/matches" className="text-xs text-primary inline-flex items-center gap-1 font-semibold">
            {t("common.view_all")} <ArrowRight className="size-3" />
          </Link>
        </div>
        {recent.length === 0 ? (
          <Card className="glass-card">
            <CardContent className="py-10 text-center text-muted-foreground">
              <Gamepad2 className="size-10 mx-auto mb-3 opacity-50" />
              <p className="mb-4">{t("dashboard.no_matches")}</p>
              <Link to="/matches/new"><Button className="rounded-xl tap">{t("dashboard.register")}</Button></Link>
            </CardContent>
          </Card>
        ) : (
          <div className="flex md:grid md:gap-3 gap-3 overflow-x-auto no-scrollbar -mx-4 px-4 md:mx-0 md:px-0 snap-x snap-mandatory">
            {recent.map((m, i) => {
              const p1 = playerById.get(m.player1_id);
              const p2 = playerById.get(m.player2_id);
              const t1 = teamById.get(m.team1_id ?? "");
              const t2 = teamById.get(m.team2_id ?? "");
              const w = matchWinner(m);
              return (
                <Card
                  key={m.id}
                  className="glass-card min-w-[88%] md:min-w-0 snap-center float-in"
                  style={{ animationDelay: `${i * 40}ms` }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
                        {format(parseISO(m.played_at), "MMM d, yyyy")}
                      </span>
                      {w === "draw" ? (
                        <Badge variant="outline" className="rounded-full">{t("match.draw")}</Badge>
                      ) : (
                        <Badge className="rounded-full bg-[color:var(--win)] text-black hover:bg-[color:var(--win)]">
                          {(w === "p1" ? p1?.name : p2?.name) ?? t("match.winner")}
                        </Badge>
                      )}
                    </div>
                    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                      <div className="min-w-0">
                        <div className="text-sm font-semibold truncate">{p1?.name ?? "—"}</div>
                        <div className="mt-1.5 flex items-center gap-2 min-w-0">
                          <TeamCrest team={t1} size={28} />
                          <span className="text-xs text-muted-foreground truncate">{t1?.name ?? "—"}</span>
                        </div>
                      </div>
                      <div className="font-display font-black text-3xl tracking-tight text-center">
                        <span className={w === "p1" ? "neon-text" : ""}>{m.score1}</span>
                        <span className="opacity-30 mx-1">:</span>
                        <span className={w === "p2" ? "neon-text" : ""}>{m.score2}</span>
                      </div>
                      <div className="min-w-0 text-right">
                        <div className="text-sm font-semibold truncate">{p2?.name ?? "—"}</div>
                        <div className="mt-1.5 flex items-center gap-2 min-w-0 justify-end flex-row-reverse">
                          <TeamCrest team={t2} size={28} />
                          <span className="text-xs text-muted-foreground truncate">{t2?.name ?? "—"}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>
    </AppLayout>
  );
}

function StatCard({ icon, label, value, sub, accent }: {
  icon: React.ReactNode; label: string; value: number | string; sub?: string;
  accent: "primary" | "accent" | "win" | "draw";
}) {
  const color = {
    primary: "text-primary",
    accent: "text-[color:var(--accent)]",
    win: "text-[color:var(--win)]",
    draw: "text-[color:var(--draw)]",
  }[accent];
  return (
    <Card className="glass-card tap pop">
      <CardContent className="p-4">
        <div className={`flex items-center gap-2 ${color}`}>
          {icon}
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">{label}</span>
        </div>
        <div className="mt-2 font-display text-3xl md:text-4xl font-black tracking-tight">{value}</div>
        {sub && <div className="mt-1 text-xs text-muted-foreground truncate">{sub}</div>}
      </CardContent>
    </Card>
  );
}
