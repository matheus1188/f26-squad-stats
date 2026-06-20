import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppLayout } from "@/components/AppLayout";
import { fetchMatches, fetchPlayers, fetchTeams, queryKeys } from "@/lib/db";
import { computePlayerStats, teamUsage } from "@/lib/stats";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from "recharts";
import { BarChart3 } from "lucide-react";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/stats")({
  head: () => ({ meta: [{ title: "Stats — F26 Arena" }] }),
  component: StatsPage,
});

const palette = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];

function StatsPage() {
  const t = useT();
  const players = useQuery({ queryKey: queryKeys.players, queryFn: fetchPlayers });
  const teams = useQuery({ queryKey: queryKeys.teams, queryFn: fetchTeams });
  const matches = useQuery({ queryKey: queryKeys.matches, queryFn: fetchMatches });
  const stats = computePlayerStats(players.data ?? [], matches.data ?? []);

  if (stats.length === 0) {
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

  const mostActive = [...stats].sort((a, b) => b.played - a.played).slice(0, 8)
    .map(s => ({ name: s.player.name, value: s.played }));
  const mostWins = [...stats].sort((a, b) => b.wins - a.wins).slice(0, 8)
    .map(s => ({ name: s.player.name, value: s.wins }));
  const topScorers = [...stats].sort((a, b) => b.goalsFor - a.goalsFor).slice(0, 8)
    .map(s => ({ name: s.player.name, value: s.goalsFor }));
  const winRate = [...stats].filter(s => s.played >= 1).sort((a, b) => b.winRate - a.winRate).slice(0, 8)
    .map(s => ({ name: s.player.name, value: Math.round(s.winRate * 100) }));
  const usage = teamUsage(matches.data ?? [], teams.data ?? []).slice(0, 8)
    .map(tm => ({ name: tm.team.name, value: tm.count }));

  return (
    <AppLayout title={t("stats.title")} subtitle={t("stats.subtitle")}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title={t("stats.most_active")} data={mostActive} />
        <ChartCard title={t("stats.most_wins")} data={mostWins} />
        <ChartCard title={t("stats.top_scorers")} data={topScorers} />
        <ChartCard title={t("stats.win_rate")} data={winRate} suffix="%" />
        <div className="lg:col-span-2">
          <ChartCard title={t("stats.team_usage")} data={usage} />
        </div>
      </div>
    </AppLayout>
  );
}

function ChartCard({ title, data, suffix }: { title: string; data: { name: string; value: number }[]; suffix?: string }) {
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
                <Bar dataKey="value" radius={[0, 10, 10, 0]} animationDuration={900}>
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
