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
import { TeamCrest } from "@/components/TeamCrest";
import { Trash2, Plus, History as HistoryIcon, ChevronDown } from "lucide-react";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/matches/")({
  head: () => ({ meta: [{ title: "History — GolaçoCup" }] }),
  component: MatchHistory,
});

function MatchHistory() {
  const t = useT();
  const qc = useQueryClient();
  const players = useQuery({ queryKey: queryKeys.players, queryFn: fetchPlayers });
  const teams = useQuery({ queryKey: queryKeys.teams, queryFn: fetchTeams });
  const matches = useQuery({ queryKey: queryKeys.matches, queryFn: fetchMatches });

  const [playerFilter, setPlayerFilter] = useState<string>("all");
  const [teamFilter, setTeamFilter] = useState<string>("all");
  const [period, setPeriod] = useState<string>("all");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [swipingId, setSwipingId] = useState<string | null>(null);
  const [swipeX, setSwipeX] = useState(0);
  const [startX, setStartX] = useState(0);

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
      toast.success(t("match.deleted"));
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const count = filtered.length;
  const countText = count === 1 ? t("match.history_count_one", { n: count }) : t("match.history_count_other", { n: count });

  return (
    <AppLayout
      title={t("match.history_title")}
      subtitle={countText}
      action={
        <Link to="/matches/new" className="hidden md:inline-flex">
          <Button className="gap-1.5 rounded-2xl tap"><Plus className="size-4" /> {t("common.new_match")}</Button>
        </Link>
      }
    >
      <div className="grid grid-cols-3 gap-2 mb-4">
        <Select value={playerFilter} onValueChange={setPlayerFilter}>
          <SelectTrigger className="rounded-xl"><SelectValue placeholder={t("match.filter_player")} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("common.all")}</SelectItem>
            {(players.data ?? []).map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={teamFilter} onValueChange={setTeamFilter}>
          <SelectTrigger className="rounded-xl"><SelectValue placeholder={t("match.filter_team")} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("common.all")}</SelectItem>
            {(teams.data ?? []).map(tm => <SelectItem key={tm.id} value={tm.id}>{tm.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="rounded-xl"><SelectValue placeholder={t("match.filter_period")} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("common.all")}</SelectItem>
            <SelectItem value="7">{t("match.period_7")}</SelectItem>
            <SelectItem value="30">{t("match.period_30")}</SelectItem>
            <SelectItem value="90">{t("match.period_90")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <Card className="glass-card">
          <CardContent className="py-12 text-center text-muted-foreground">
            <HistoryIcon className="size-10 mx-auto mb-3 opacity-50" />
            {t("match.no_history")}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {filtered.map((m, i) => {
            const p1 = playerById.get(m.player1_id);
            const p2 = playerById.get(m.player2_id);
            const t1 = teamById.get(m.team1_id ?? "");
            const t2 = teamById.get(m.team2_id ?? "");
            const w = matchWinner(m);
            const isOpen = expanded === m.id;
            const isSwiping = swipingId === m.id;
            const translate = isSwiping ? Math.max(-100, Math.min(0, swipeX)) : 0;
            return (
              <div key={m.id} className="relative">
                {/* Delete background revealed by swipe */}
                <div className="absolute inset-0 rounded-2xl bg-destructive flex items-center justify-end pr-6">
                  <Trash2 className="size-5 text-destructive-foreground" />
                </div>
                <Card
                  className="glass-card relative float-in"
                  style={{
                    animationDelay: `${i * 30}ms`,
                    transform: `translateX(${translate}px)`,
                    transition: isSwiping ? "none" : "transform 0.25s ease",
                  }}
                  onTouchStart={(e) => { setStartX(e.touches[0].clientX); setSwipingId(m.id); setSwipeX(0); }}
                  onTouchMove={(e) => { if (isSwiping) setSwipeX(e.touches[0].clientX - startX); }}
                  onTouchEnd={() => {
                    if (translate < -70) {
                      if (confirm(t("match.confirm_delete"))) del.mutate(m.id);
                    }
                    setSwipingId(null); setSwipeX(0);
                  }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
                        {format(parseISO(m.played_at), "EEE, MMM d, yyyy")}
                      </span>
                      <div className="flex items-center gap-2">
                        {w === "draw"
                          ? <Badge variant="outline" className="rounded-full">{t("match.draw")}</Badge>
                          : <Badge className="rounded-full bg-[color:var(--win)] text-black hover:bg-[color:var(--win)]">
                              {(w === "p1" ? p1?.name : p2?.name) ?? t("match.winner")}
                            </Badge>}
                        <button
                          onClick={() => setExpanded(isOpen ? null : m.id)}
                          className="tap size-7 rounded-full grid place-items-center hover:bg-foreground/10"
                        >
                          <ChevronDown className={cn("size-4 transition-transform", isOpen && "rotate-180")} />
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                      <div className="min-w-0">
                        <div className="text-sm font-semibold truncate">{p1?.name ?? "—"}</div>
                        <div className="mt-1.5 flex items-center gap-2 min-w-0">
                          <TeamCrest team={t1} size={28} />
                          <span className="text-xs text-muted-foreground truncate">{t1?.name ?? ""}</span>
                        </div>
                      </div>
                      <div className="font-display font-black text-3xl tabular-nums tracking-tight text-center">
                        <span className={w === "p1" ? "neon-text" : ""}>{m.score1}</span>
                        <span className="opacity-30 mx-1">:</span>
                        <span className={w === "p2" ? "neon-text" : ""}>{m.score2}</span>
                      </div>
                      <div className="min-w-0 text-right">
                        <div className="text-sm font-semibold truncate">{p2?.name ?? "—"}</div>
                        <div className="mt-1.5 flex items-center gap-2 min-w-0 justify-end flex-row-reverse">
                          <TeamCrest team={t2} size={28} />
                          <span className="text-xs text-muted-foreground truncate">{t2?.name ?? ""}</span>
                        </div>
                      </div>
                    </div>
                    {isOpen && (
                      <div className="mt-3 pt-3 border-t border-border/50 space-y-2 float-in">
                        {m.notes && (
                          <p className="text-xs text-muted-foreground italic">"{m.notes}"</p>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive gap-2"
                          onClick={() => { if (confirm(t("match.confirm_delete"))) del.mutate(m.id); }}
                        >
                          <Trash2 className="size-4" /> {t("common.delete")}
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>
      )}
    </AppLayout>
  );
}
