import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { fetchMatches, fetchPlayers, fetchTeams, queryKeys } from "@/lib/db";
import { matchWinner } from "@/lib/stats";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { TeamBadge } from "@/components/TeamBadge";
import { Trash2, Plus, History as HistoryIcon } from "lucide-react";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";

export const Route = createFileRoute("/matches/")({
  head: () => ({ meta: [{ title: "Match history — F26 Tracker" }] }),
  component: MatchHistory,
});

function MatchHistory() {
  const qc = useQueryClient();
  const players = useQuery({ queryKey: queryKeys.players, queryFn: fetchPlayers });
  const teams = useQuery({ queryKey: queryKeys.teams, queryFn: fetchTeams });
  const matches = useQuery({ queryKey: queryKeys.matches, queryFn: fetchMatches });

  const [playerFilter, setPlayerFilter] = useState<string>("all");
  const [teamFilter, setTeamFilter] = useState<string>("all");
  const [period, setPeriod] = useState<string>("all");

  const playerById = new Map((players.data ?? []).map((p) => [p.id, p]));
  const teamById = new Map((teams.data ?? []).map((t) => [t.id, t]));

  const filtered = useMemo(() => {
    let m = matches.data ?? [];
    if (playerFilter !== "all") m = m.filter(x => x.player1_id === playerFilter || x.player2_id === playerFilter);
    if (teamFilter !== "all") m = m.filter(x => x.team1_id === teamFilter || x.team2_id === teamFilter);
    if (period !== "all") {
      const days = period === "7" ? 7 : period === "30" ? 30 : 90;
      const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - days);
      m = m.filter(x => parseISO(x.played_at) >= cutoff);
    }
    return m;
  }, [matches.data, playerFilter, teamFilter, period]);

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("matches").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.matches });
      toast.success("Match deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <AppLayout
      title="Match history"
      subtitle={`${filtered.length} match${filtered.length === 1 ? "" : "es"}`}
      action={
        <Link to="/matches/new">
          <Button className="gap-1.5"><Plus className="size-4" /> <span className="hidden sm:inline">New</span></Button>
        </Link>
      }
    >
      <div className="grid grid-cols-3 gap-2 mb-4">
        <Select value={playerFilter} onValueChange={setPlayerFilter}>
          <SelectTrigger><SelectValue placeholder="Player" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All players</SelectItem>
            {(players.data ?? []).map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={teamFilter} onValueChange={setTeamFilter}>
          <SelectTrigger><SelectValue placeholder="Team" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All teams</SelectItem>
            {(teams.data ?? []).map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger><SelectValue placeholder="Period" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All time</SelectItem>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <Card className="glass-card">
          <CardContent className="py-12 text-center text-muted-foreground">
            <HistoryIcon className="size-10 mx-auto mb-3 opacity-50" />
            No matches to show.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {filtered.map((m) => {
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
                      {format(parseISO(m.played_at), "EEE, MMM d, yyyy")}
                    </span>
                    <div className="flex items-center gap-2">
                      {w === "draw"
                        ? <Badge variant="outline" className="border-[color:var(--draw)] text-[color:var(--draw)]">Draw</Badge>
                        : <Badge className="bg-[color:var(--win)] text-black">{(w === "p1" ? p1?.name : p2?.name) ?? "Winner"}</Badge>}
                      <Button size="icon" variant="ghost" className="size-7 text-destructive"
                        onClick={() => { if (confirm("Delete this match?")) del.mutate(m.id); }}>
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-semibold truncate">{p1?.name ?? "—"}</div>
                      <TeamBadge team={t1} size="sm" className="mt-1" />
                    </div>
                    <div className="font-display font-black text-3xl tracking-wider text-center">
                      <span className={w === "p1" ? "neon-text" : ""}>{m.score1}</span>
                      <span className="opacity-40 mx-1">:</span>
                      <span className={w === "p2" ? "neon-text" : ""}>{m.score2}</span>
                    </div>
                    <div className="min-w-0 text-right">
                      <div className="text-sm font-semibold truncate">{p2?.name ?? "—"}</div>
                      <TeamBadge team={t2} size="sm" className="mt-1 justify-end flex-row-reverse" />
                    </div>
                  </div>
                  {m.notes && (
                    <p className="mt-3 text-xs text-muted-foreground italic border-t border-white/5 pt-2">"{m.notes}"</p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </AppLayout>
  );
}
