import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { fetchMatches, fetchPlayers, fetchTeams, queryKeys, type Match, type Player, type Team } from "@/lib/db";
import { computePlayerStats, teamUsage } from "@/lib/stats";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell,
  LineChart, Line, CartesianGrid,
} from "recharts";
import {
  BarChart3, Trophy, Target, ShieldCheck, Activity, Percent, Flame, Users,
} from "lucide-react";
import { useT } from "@/lib/i18n";
import { TeamCrest } from "@/components/TeamCrest";

export const Route = createFileRoute("/stats")({
  head: () => ({ meta: [{ title: "Stats — GOLAÇO CUP" }] }),
  component: StatsPage,
});

const palette = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];

type Period = "all" | "week" | "month" | "custom";

function startOfWeek(d: Date) {
  const x = new Date(d); x.setHours(0, 0, 0, 0);
  const day = x.getDay(); const diff = (day + 6) % 7; // Monday-start
  x.setDate(x.getDate() - diff); return x;
}
function startOfMonth(d: Date) {
  const x = new Date(d.getFullYear(), d.getMonth(), 1); return x;
}

function filterMatches(matches: Match[], period: Period, from?: string, to?: string) {
  if (period === "all") return matches;
  const now = new Date();
  let start: Date | null = null;
  let end: Date | null = null;
  if (period === "week") start = startOfWeek(now);
  else if (period === "month") start = startOfMonth(now);
  else if (period === "custom") {
    if (from) start = new Date(from);
    if (to) { end = new Date(to); end.setHours(23, 59, 59, 999); }
  }
  return matches.filter(m => {
    const d = new Date(m.played_at);
    if (start && d < start) return false;
    if (end && d > end) return false;
    return true;
  });
}

function StatsPage() {
  const t = useT();
  const players = useQuery({ queryKey: queryKeys.players, queryFn: fetchPlayers });
  const teams = useQuery({ queryKey: queryKeys.teams, queryFn: fetchTeams });
  const matches = useQuery({ queryKey: queryKeys.matches, queryFn: fetchMatches });

  const [period, setPeriod] = useState<Period>("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [detail, setDetail] = useState<
    | { kind: "player"; id: string }
    | { kind: "team"; id: string }
    | null
  >(null);

  const allMatches = matches.data ?? [];
  const allPlayers = players.data ?? [];
  const allTeams = teams.data ?? [];

  const periodMatches = useMemo(
    () => filterMatches(allMatches, period, from, to),
    [allMatches, period, from, to],
  );

  const stats = useMemo(() => computePlayerStats(allPlayers, periodMatches), [allPlayers, periodMatches]);
  const usage = useMemo(() => teamUsage(periodMatches, allTeams), [periodMatches, allTeams]);

  const totalGoals = periodMatches.reduce((a, m) => a + m.score1 + m.score2, 0);
  const totalMatches = periodMatches.length;
  const avgGoals = totalMatches ? (totalGoals / totalMatches) : 0;
  const mostActive = [...stats].sort((a, b) => b.played - a.played)[0];
  const topScorer = [...stats].sort((a, b) => b.goalsFor - a.goalsFor)[0];
  const bestDefense = [...stats].filter(s => s.played).sort((a, b) => (a.goalsAgainst / a.played) - (b.goalsAgainst / b.played))[0];
  const bestRate = [...stats].filter(s => s.played >= 2).sort((a, b) => b.winRate - a.winRate)[0];
  const mostTeam = usage[0];

  const playerById = (id: string) => allPlayers.find(p => p.id === id);
  const teamById = (id: string) => allTeams.find(p => p.id === id);

  // Chart datasets
  const playedData = [...stats].sort((a, b) => b.played - a.played).slice(0, 8)
    .map(s => ({ id: s.player.id, name: s.player.name, value: s.played }));
  const winsData = [...stats].sort((a, b) => b.wins - a.wins).slice(0, 8)
    .map(s => ({ id: s.player.id, name: s.player.name, value: s.wins }));
  const goalsForData = [...stats].sort((a, b) => b.goalsFor - a.goalsFor).slice(0, 8)
    .map(s => ({ id: s.player.id, name: s.player.name, value: s.goalsFor }));
  const goalsAgainstData = [...stats].sort((a, b) => b.goalsAgainst - a.goalsAgainst).slice(0, 8)
    .map(s => ({ id: s.player.id, name: s.player.name, value: s.goalsAgainst }));
  const winRateData = [...stats].filter(s => s.played >= 1).sort((a, b) => b.winRate - a.winRate).slice(0, 8)
    .map(s => ({ id: s.player.id, name: s.player.name, value: Math.round(s.winRate * 100) }));
  const usageData = usage.slice(0, 8).map(u => ({ id: u.team.id, name: u.team.name, value: u.count }));

  // Goals evolution: daily aggregate
  const overTime = useMemo(() => {
    const map = new Map<string, number>();
    for (const m of periodMatches) {
      const d = new Date(m.played_at).toISOString().slice(0, 10);
      map.set(d, (map.get(d) ?? 0) + m.score1 + m.score2);
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([date, value]) => ({ date, value }));
  }, [periodMatches]);

  if (allMatches.length === 0) {
    return (
      <AppLayout title={t("stats.title")}>
        <Card className="glass-card">
          <CardContent className="py-12 text-center text-muted-foreground">
            <BarChart3 className="size-10 mx-auto mb-3 opacity-50" />
            {t("stats.empty")}
          </CardContent>
        </Card>
      </AppLayout>
    );
  }

  return (
    <AppLayout title={t("stats.title")} subtitle={t("stats.subtitle")}>
      {/* Filters */}
      <Card className="glass-card mb-4">
        <CardContent className="p-3 flex flex-wrap items-center gap-2">
          {(["all", "week", "month", "custom"] as Period[]).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={
                "tap px-3 py-1.5 rounded-full text-xs font-semibold border transition-all " +
                (period === p
                  ? "bg-primary/20 text-primary border-primary/40 shadow-[0_0_18px_rgba(0,191,255,0.25)]"
                  : "border-white/10 text-muted-foreground hover:text-foreground")
              }
            >
              {t(`stats.filter.${p}`)}
            </button>
          ))}
          {period === "custom" && (
            <div className="flex items-center gap-2 ml-1">
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground">{t("stats.filter.from")}</span>
              <Input type="date" value={from} onChange={e => setFrom(e.target.value)} className="h-8 w-[140px]" />
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground">{t("stats.filter.to")}</span>
              <Input type="date" value={to} onChange={e => setTo(e.target.value)} className="h-8 w-[140px]" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* KPI grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <Kpi icon={Activity} label={t("stats.kpi.total_matches")} value={totalMatches} />
        <Kpi icon={Target} label={t("stats.kpi.total_goals")} value={totalGoals} />
        <Kpi icon={Flame} label={t("stats.kpi.avg_goals")} value={avgGoals.toFixed(2)} />
        <Kpi icon={Users} label={t("stats.kpi.most_active")} value={mostActive?.player.name ?? "—"} sub={mostActive ? `${mostActive.played}` : ""} onClick={mostActive ? () => setDetail({ kind: "player", id: mostActive.player.id }) : undefined} />
        <Kpi icon={Trophy} label={t("stats.kpi.top_scorer")} value={topScorer?.player.name ?? "—"} sub={topScorer ? `${topScorer.goalsFor}` : ""} onClick={topScorer ? () => setDetail({ kind: "player", id: topScorer.player.id }) : undefined} />
        <Kpi icon={ShieldCheck} label={t("stats.kpi.best_defense")} value={bestDefense?.player.name ?? "—"} sub={bestDefense ? `${(bestDefense.goalsAgainst / bestDefense.played).toFixed(2)}` : ""} onClick={bestDefense ? () => setDetail({ kind: "player", id: bestDefense.player.id }) : undefined} />
        <Kpi icon={Percent} label={t("stats.kpi.best_win_rate")} value={bestRate?.player.name ?? "—"} sub={bestRate ? `${Math.round(bestRate.winRate * 100)}%` : ""} onClick={bestRate ? () => setDetail({ kind: "player", id: bestRate.player.id }) : undefined} />
        <Kpi icon={BarChart3} label={t("stats.kpi.most_used_team")} value={mostTeam?.team.name ?? "—"} sub={mostTeam ? `${mostTeam.count}` : ""} onClick={mostTeam ? () => setDetail({ kind: "team", id: mostTeam.team.id }) : undefined} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title={t("stats.matches_played")} data={playedData} onSelect={(id) => setDetail({ kind: "player", id })} />
        <ChartCard title={t("stats.most_wins")} data={winsData} onSelect={(id) => setDetail({ kind: "player", id })} />
        <ChartCard title={t("stats.goals_scored")} data={goalsForData} onSelect={(id) => setDetail({ kind: "player", id })} />
        <ChartCard title={t("stats.goals_conceded")} data={goalsAgainstData} onSelect={(id) => setDetail({ kind: "player", id })} />
        <ChartCard title={t("stats.win_rate")} data={winRateData} suffix="%" onSelect={(id) => setDetail({ kind: "player", id })} />
        <ChartCard title={t("stats.team_usage")} data={usageData} onSelect={(id) => setDetail({ kind: "team", id })} />
        <div className="lg:col-span-2">
          <Card className="glass-card float-in">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-display font-bold uppercase tracking-[0.2em] text-muted-foreground">
                {t("stats.goals_over_time")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {overTime.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">{t("stats.no_data")}</p>
              ) : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={overTime} margin={{ left: 8, right: 16, top: 8, bottom: 8 }}>
                      <CartesianGrid stroke="color-mix(in oklab, var(--foreground) 6%, transparent)" strokeDasharray="3 6" />
                      <XAxis dataKey="date" tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} axisLine={false} tickLine={false} width={28} />
                      <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 12 }} />
                      <Line type="monotone" dataKey="value" stroke="var(--chart-2)" strokeWidth={3} dot={{ r: 3, fill: "var(--chart-1)" }} animationDuration={900} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Detail modal */}
      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent className="glass-card max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display tracking-tight">
              {detail?.kind === "team" ? t("stats.team_details") : t("stats.player_details")}
            </DialogTitle>
          </DialogHeader>
          {detail?.kind === "player" && playerById(detail.id) && (
            <PlayerDetail
              player={playerById(detail.id)!}
              stat={stats.find(s => s.player.id === detail.id)}
            />
          )}
          {detail?.kind === "team" && teamById(detail.id) && (
            <TeamDetail
              team={teamById(detail.id)!}
              matches={periodMatches}
              players={allPlayers}
            />
          )}
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}

function Kpi({ icon: Icon, label, value, sub, onClick }: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: React.ReactNode;
  sub?: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className="glass-card float-in text-left rounded-2xl p-3 transition-all hover:shadow-[0_0_22px_rgba(0,191,255,0.18)] hover:-translate-y-0.5 disabled:cursor-default"
    >
      <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
        <Icon className="size-3.5 text-primary" />
        <span className="truncate">{label}</span>
      </div>
      <div className="mt-1.5 text-lg font-display font-black truncate">{value}</div>
      {sub && <div className="text-xs text-[color:var(--chart-2)] font-semibold">{sub}</div>}
    </button>
  );
}

function ChartCard({
  title, data, suffix, onSelect,
}: {
  title: string;
  data: { id: string; name: string; value: number }[];
  suffix?: string;
  onSelect?: (id: string) => void;
}) {
  return (
    <Card className="glass-card float-in">
      <CardHeader className="pb-2">
        <CardTitle className="text-xs font-display font-bold uppercase tracking-[0.2em] text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">—</p>
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16, top: 8, bottom: 8 }}>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" width={100} tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip
                  cursor={{ fill: "color-mix(in oklab, var(--foreground) 5%, transparent)" }}
                  contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 12 }}
                  formatter={(v: number) => `${v}${suffix ?? ""}`}
                />
                <Bar
                  dataKey="value"
                  radius={[0, 10, 10, 0]}
                  animationDuration={900}
                  onClick={(d: { id?: string }) => d?.id && onSelect?.(d.id)}
                  cursor={onSelect ? "pointer" : "default"}
                >
                  {data.map((_, i) => <Cell key={i} fill={palette[i % palette.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function PlayerDetail({ player, stat }: { player: Player; stat?: ReturnType<typeof computePlayerStats>[number] }) {
  const t = useT();
  if (!stat) return <p className="text-sm text-muted-foreground">{t("stats.no_data")}</p>;
  const rows: [string, React.ReactNode][] = [
    [t("stats.matches_played"), stat.played],
    [t("ranking.podium") /* reuse minor */, ""],
  ];
  // Simpler: build a stat grid
  const grid = [
    { label: t("stats.matches_played"), value: stat.played },
    { label: t("stats.kpi.top_scorer"), value: stat.goalsFor },
    { label: t("stats.goals_conceded"), value: stat.goalsAgainst },
    { label: t("stats.win_rate"), value: `${Math.round(stat.winRate * 100)}%` },
  ];
  void rows;
  return (
    <div className="space-y-3">
      <div className="text-lg font-display font-black">{player.name}</div>
      <div className="grid grid-cols-2 gap-2">
        {grid.map(g => (
          <div key={g.label} className="rounded-xl border border-white/10 bg-white/5 p-2.5">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{g.label}</div>
            <div className="text-base font-display font-bold">{g.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TeamDetail({ team, matches, players }: { team: Team; matches: Match[]; players: Player[] }) {
  const t = useT();
  const used = matches.filter(m => m.team1_id === team.id || m.team2_id === team.id);
  let wins = 0, goalsFor = 0, goalsAgainst = 0;
  for (const m of used) {
    const isP1 = m.team1_id === team.id;
    const my = isP1 ? m.score1 : m.score2;
    const op = isP1 ? m.score2 : m.score1;
    goalsFor += my; goalsAgainst += op;
    if (my > op) wins++;
  }
  const topPlayers = new Map<string, number>();
  for (const m of used) {
    const id = m.team1_id === team.id ? m.player1_id : m.player2_id;
    topPlayers.set(id, (topPlayers.get(id) ?? 0) + 1);
  }
  const topPlayer = [...topPlayers.entries()].sort((a, b) => b[1] - a[1])[0];
  const topPlayerName = topPlayer ? players.find(p => p.id === topPlayer[0])?.name : "—";

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <TeamCrest team={team} size={56} />
        <div>
          <div className="text-lg font-display font-black">{team.name}</div>
          <div className="text-xs text-muted-foreground">{team.country}</div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Cell2 label={t("stats.kpi.total_matches")} value={used.length} />
        <Cell2 label={t("stats.most_wins")} value={wins} />
        <Cell2 label={t("stats.goals_scored")} value={goalsFor} />
        <Cell2 label={t("stats.goals_conceded")} value={goalsAgainst} />
      </div>
      <div className="rounded-xl border border-white/10 bg-white/5 p-2.5">
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{t("stats.kpi.most_active")}</div>
        <div className="text-base font-display font-bold">{topPlayerName ?? "—"}</div>
      </div>
    </div>
  );
}

function Cell2({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-2.5">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="text-base font-display font-bold">{value}</div>
    </div>
  );
}
