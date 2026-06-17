import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppLayout } from "@/components/AppLayout";
import { fetchMatches, fetchPlayers, fetchTeams, queryKeys } from "@/lib/db";
import { computePlayerStats, matchWinner } from "@/lib/stats";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TeamBadge } from "@/components/TeamBadge";
import { Trophy, Target, Flame, Gamepad2, Plus, ArrowRight } from "lucide-react";
import { format, parseISO } from "date-fns";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [{ title: "Dashboard — F26 Friends Match Tracker" }],
  }),
  component: Dashboard,
});

function Dashboard() {
  const players = useQuery({ queryKey: queryKeys.players, queryFn: fetchPlayers });
  const teams = useQuery({ queryKey: queryKeys.teams, queryFn: fetchTeams });
  const matches = useQuery({ queryKey: queryKeys.matches, queryFn: fetchMatches });

  const stats = computePlayerStats(players.data ?? [], matches.data ?? []);
  const totalMatches = matches.data?.length ?? 0;
  const mostMatches = [...stats].sort((a, b) => b.played - a.played)[0];
  const mostWins = [...stats].sort((a, b) => b.wins - a.wins)[0];
  const topScorer = [...stats].sort((a, b) => b.goalsFor - a.goalsFor)[0];
  const recent = (matches.data ?? []).slice(0, 6);
  const playerById = new Map((players.data ?? []).map((p) => [p.id, p]));
  const teamById = new Map((teams.data ?? []).map((t) => [t.id, t]));

  return (
    <AppLayout
      title="Dashboard"
      subtitle="Live overview of your F26 friendly battles"
      action={
        <Link to="/matches/new">
          <Button className="gap-1.5"><Plus className="size-4" /> New match</Button>
        </Link>
      }
    >
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <StatCard icon={<Gamepad2 className="size-5" />} label="Matches" value={totalMatches} accent="primary" />
        <StatCard icon={<Flame className="size-5" />} label="Most matches" value={mostMatches?.played ?? 0} sub={mostMatches?.player.name ?? "—"} accent="accent" />
        <StatCard icon={<Trophy className="size-5" />} label="Most wins" value={mostWins?.wins ?? 0} sub={mostWins?.player.name ?? "—"} accent="win" />
        <StatCard icon={<Target className="size-5" />} label="Top scorer" value={topScorer?.goalsFor ?? 0} sub={topScorer?.player.name ?? "—"} accent="draw" />
      </div>

      <section className="mt-6 md:mt-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-sm uppercase tracking-[0.25em] text-muted-foreground">Recent matches</h2>
          <Link to="/matches" className="text-xs text-primary inline-flex items-center gap-1 hover:underline">
            View all <ArrowRight className="size-3" />
          </Link>
        </div>
        {recent.length === 0 ? (
          <Card className="glass-card">
            <CardContent className="py-10 text-center text-muted-foreground">
              <Gamepad2 className="size-10 mx-auto mb-3 opacity-50" />
              <p className="mb-4">No matches yet. Register your first F26 battle.</p>
              <Link to="/matches/new"><Button>Register match</Button></Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3">
            {recent.map((m) => {
              const p1 = playerById.get(m.player1_id);
              const p2 = playerById.get(m.player2_id);
              const t1 = teamById.get(m.team1_id ?? "");
              const t2 = teamById.get(m.team2_id ?? "");
              const w = matchWinner(m);
              return (
                <Card key={m.id} className="glass-card">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                        {format(parseISO(m.played_at), "MMM d, yyyy")}
                      </span>
                      {w === "draw" ? (
                        <Badge variant="outline" className="border-[color:var(--draw)] text-[color:var(--draw)]">Draw</Badge>
                      ) : (
                        <Badge className="bg-[color:var(--win)] text-black">
                          {(w === "p1" ? p1?.name : p2?.name) ?? "Winner"}
                        </Badge>
                      )}
                    </div>
                    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                      <div className="min-w-0">
                        <div className="text-sm font-semibold truncate">{p1?.name ?? "—"}</div>
                        <TeamBadge team={t1} size="sm" className="mt-1" />
                      </div>
                      <div className="font-display font-black text-2xl tracking-wider text-center">
                        <span className={w === "p1" ? "neon-text" : ""}>{m.score1}</span>
                        <span className="opacity-40 mx-1">:</span>
                        <span className={w === "p2" ? "neon-text" : ""}>{m.score2}</span>
                      </div>
                      <div className="min-w-0 text-right">
                        <div className="text-sm font-semibold truncate">{p2?.name ?? "—"}</div>
                        <TeamBadge team={t2} size="sm" className="mt-1 justify-end flex-row-reverse" />
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
    <Card className="glass-card">
      <CardContent className="p-4">
        <div className={`flex items-center gap-2 ${color}`}>
          {icon}
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</span>
        </div>
        <div className="mt-2 font-display text-3xl md:text-4xl font-black">{value}</div>
        {sub && <div className="mt-1 text-xs text-muted-foreground truncate">{sub}</div>}
      </CardContent>
    </Card>
  );
}
