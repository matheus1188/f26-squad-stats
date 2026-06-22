import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { fetchMatches, fetchPlayers, fetchTeams, queryKeys, type Match } from "@/lib/db";
import { matchWinner } from "@/lib/stats";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { TeamCrest } from "@/components/TeamCrest";
import { Trash2, Plus, History as HistoryIcon, Search, Trophy, Pencil, Minus } from "lucide-react";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/matches/")({
  head: () => ({ meta: [{ title: "History — GOLAÇO CUP" }] }),
  component: MatchHistory,
});

type SortKey = "newest" | "oldest" | "goals";

function MatchHistory() {
  const t = useT();
  const qc = useQueryClient();
  const players = useQuery({ queryKey: queryKeys.players, queryFn: fetchPlayers });
  const teams = useQuery({ queryKey: queryKeys.teams, queryFn: fetchTeams });
  const matches = useQuery({ queryKey: queryKeys.matches, queryFn: fetchMatches });

  const [search, setSearch] = useState("");
  const [teamFilter, setTeamFilter] = useState<string>("all");
  const [winnerFilter, setWinnerFilter] = useState<string>("all");
  const [period, setPeriod] = useState<string>("all");
  const [sort, setSort] = useState<SortKey>("newest");

  const [detailId, setDetailId] = useState<string | null>(null);
  const [editTarget, setEditTarget] = useState<Match | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // swipe state
  const [swipingId, setSwipingId] = useState<string | null>(null);
  const [swipeX, setSwipeX] = useState(0);
  const [startX, setStartX] = useState(0);

  const playerById = useMemo(() => new Map((players.data ?? []).map((p) => [p.id, p])), [players.data]);
  const teamById = useMemo(() => new Map((teams.data ?? []).map((t) => [t.id, t])), [teams.data]);

  const filtered = useMemo(() => {
    let m = matches.data ?? [];
    const q = search.trim().toLowerCase();
    if (q) {
      m = m.filter((x) => {
        const p1 = playerById.get(x.player1_id)?.name.toLowerCase() ?? "";
        const p2 = playerById.get(x.player2_id)?.name.toLowerCase() ?? "";
        return p1.includes(q) || p2.includes(q) || (x.notes ?? "").toLowerCase().includes(q);
      });
    }
    if (teamFilter !== "all") m = m.filter((x) => x.team1_id === teamFilter || x.team2_id === teamFilter);
    if (winnerFilter !== "all") {
      if (winnerFilter === "draw") m = m.filter((x) => matchWinner(x) === "draw");
      else m = m.filter((x) => {
        const w = matchWinner(x);
        return (w === "p1" && x.player1_id === winnerFilter) || (w === "p2" && x.player2_id === winnerFilter);
      });
    }
    if (period !== "all") {
      const days = period === "7" ? 7 : period === "30" ? 30 : 90;
      const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - days);
      m = m.filter((x) => parseISO(x.played_at) >= cutoff);
    }
    const sorted = [...m];
    if (sort === "newest") sorted.sort((a, b) => b.played_at.localeCompare(a.played_at) || b.created_at.localeCompare(a.created_at));
    else if (sort === "oldest") sorted.sort((a, b) => a.played_at.localeCompare(b.played_at) || a.created_at.localeCompare(b.created_at));
    else sorted.sort((a, b) => (b.score1 + b.score2) - (a.score1 + a.score2));
    return sorted;
  }, [matches.data, search, teamFilter, winnerFilter, period, sort, playerById]);

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("matches").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.matches });
      qc.invalidateQueries({ queryKey: queryKeys.players });
      toast.success(t("match.deleted"));
      setDeleteId(null);
      setDetailId(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const update = useMutation({
    mutationFn: async (m: Match) => {
      const { error } = await supabase.from("matches").update({
        played_at: m.played_at,
        score1: m.score1,
        score2: m.score2,
        notes: m.notes,
      }).eq("id", m.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.matches });
      toast.success(t("match.updated"));
      setEditTarget(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const count = filtered.length;
  const countText = count === 1 ? t("match.history_count_one", { n: count }) : t("match.history_count_other", { n: count });
  const detail = detailId ? (matches.data ?? []).find((x) => x.id === detailId) ?? null : null;

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
      <div className="space-y-2 mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("match.search_placeholder")}
            className="pl-9 rounded-xl"
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Select value={teamFilter} onValueChange={setTeamFilter}>
            <SelectTrigger className="rounded-xl"><SelectValue placeholder={t("match.filter_team")} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("match.filter_team")} · {t("common.all")}</SelectItem>
              {(teams.data ?? []).map((tm) => <SelectItem key={tm.id} value={tm.id}>{tm.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={winnerFilter} onValueChange={setWinnerFilter}>
            <SelectTrigger className="rounded-xl"><SelectValue placeholder={t("match.filter_winner")} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("match.filter_winner")} · {t("common.all")}</SelectItem>
              <SelectItem value="draw">{t("match.draw")}</SelectItem>
              {(players.data ?? []).map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="rounded-xl"><SelectValue placeholder={t("match.filter_period")} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("match.filter_period")} · {t("common.all")}</SelectItem>
              <SelectItem value="7">{t("match.period_7")}</SelectItem>
              <SelectItem value="30">{t("match.period_30")}</SelectItem>
              <SelectItem value="90">{t("match.period_90")}</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
            <SelectTrigger className="rounded-xl"><SelectValue placeholder={t("match.sort")} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">{t("match.sort_newest")}</SelectItem>
              <SelectItem value="oldest">{t("match.sort_oldest")}</SelectItem>
              <SelectItem value="goals">{t("match.sort_goals")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card className="glass-card">
          <CardContent className="py-12 text-center text-muted-foreground">
            <HistoryIcon className="size-10 mx-auto mb-3 opacity-50" />
            {t("match.no_history")}
          </CardContent>
        </Card>
      ) : (
        <>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground/70 text-center mb-2">
            {t("match.swipe_hint")}
          </p>
          <div className="grid gap-3">
            {filtered.map((m, i) => {
              const p1 = playerById.get(m.player1_id);
              const p2 = playerById.get(m.player2_id);
              const t1 = teamById.get(m.team1_id ?? "");
              const t2 = teamById.get(m.team2_id ?? "");
              const w = matchWinner(m);
              const isSwiping = swipingId === m.id;
              const translate = isSwiping ? Math.max(-110, Math.min(110, swipeX)) : 0;
              const winnerName = w === "p1" ? p1?.name : w === "p2" ? p2?.name : null;
              return (
                <div key={m.id} className="relative overflow-hidden rounded-2xl">
                  {/* swipe backgrounds */}
                  <div className="absolute inset-0 rounded-2xl bg-destructive/90 flex items-center justify-end pr-6">
                    <Trash2 className="size-5 text-destructive-foreground" />
                  </div>
                  <div className="absolute inset-0 rounded-2xl bg-[color:var(--primary)]/80 flex items-center justify-start pl-6">
                    <Pencil className="size-5 text-black" />
                  </div>
                  <Card
                    className="glass-card relative float-in border border-[color:var(--primary)]/25 shadow-[0_0_24px_-12px_rgba(var(--accent-glow),0.6)] hover:shadow-[0_0_36px_-8px_rgba(var(--accent-glow),0.85)] transition-shadow cursor-pointer"
                    style={{
                      animationDelay: `${i * 30}ms`,
                      transform: `translateX(${translate}px)`,
                      transition: isSwiping ? "none" : "transform 0.25s ease",
                    }}
                    onClick={() => { if (!isSwiping && Math.abs(swipeX) < 5) setDetailId(m.id); }}
                    onTouchStart={(e) => { setStartX(e.touches[0].clientX); setSwipingId(m.id); setSwipeX(0); }}
                    onTouchMove={(e) => { if (isSwiping) setSwipeX(e.touches[0].clientX - startX); }}
                    onTouchEnd={() => {
                      const x = translate;
                      setSwipingId(null); setSwipeX(0);
                      if (x < -80) setDeleteId(m.id);
                      else if (x > 80) setEditTarget(m);
                    }}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
                          {format(parseISO(m.played_at), "EEE, MMM d, yyyy")}
                        </span>
                        {w === "draw" ? (
                          <Badge variant="outline" className="rounded-full">{t("match.draw")}</Badge>
                        ) : (
                          <Badge className="rounded-full bg-[color:var(--win,theme(colors.emerald.400))] text-black hover:bg-[color:var(--win,theme(colors.emerald.400))] gap-1 animate-pulse">
                            <Trophy className="size-3" /> {winnerName ?? t("match.winner")}
                          </Badge>
                        )}
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
                          <span className="opacity-30 mx-1">×</span>
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
                      {m.notes && (
                        <p className="mt-3 text-xs text-muted-foreground italic truncate">"{m.notes}"</p>
                      )}
                    </CardContent>
                  </Card>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Detail modal */}
      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetailId(null)}>
        <DialogContent className="glass-card max-w-md">
          {detail && (() => {
            const p1 = playerById.get(detail.player1_id);
            const p2 = playerById.get(detail.player2_id);
            const t1 = teamById.get(detail.team1_id ?? "");
            const t2 = teamById.get(detail.team2_id ?? "");
            const w = matchWinner(detail);
            const winnerName = w === "p1" ? p1?.name : w === "p2" ? p2?.name : null;
            return (
              <>
                <DialogHeader>
                  <DialogTitle>{t("match.details")}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="text-center text-xs uppercase tracking-widest text-muted-foreground">
                    {format(parseISO(detail.played_at), "EEEE, MMM d, yyyy")}
                  </div>
                  <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                    <div className="flex flex-col items-center gap-2">
                      <TeamCrest team={t1} size={72} />
                      <span className="text-xs text-muted-foreground">{t1?.name}</span>
                      <span className="text-sm font-semibold">{p1?.name ?? "—"}</span>
                    </div>
                    <div className="font-display font-black text-5xl tabular-nums text-center">
                      <span className={w === "p1" ? "neon-text" : ""}>{detail.score1}</span>
                      <span className="opacity-30 mx-1">×</span>
                      <span className={w === "p2" ? "neon-text" : ""}>{detail.score2}</span>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                      <TeamCrest team={t2} size={72} />
                      <span className="text-xs text-muted-foreground">{t2?.name}</span>
                      <span className="text-sm font-semibold">{p2?.name ?? "—"}</span>
                    </div>
                  </div>
                  <div className="text-center">
                    {w === "draw" ? (
                      <Badge variant="outline" className="rounded-full">{t("match.draw")}</Badge>
                    ) : (
                      <Badge className="rounded-full bg-[color:var(--win,theme(colors.emerald.400))] text-black gap-1">
                        <Trophy className="size-3" /> {winnerName}
                      </Badge>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-center">
                    <div className="glass-card rounded-xl p-3">
                      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{t("match.total_goals")}</div>
                      <div className="text-2xl font-bold tabular-nums">{detail.score1 + detail.score2}</div>
                    </div>
                    <div className="glass-card rounded-xl p-3">
                      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{t("match.goal_diff")}</div>
                      <div className="text-2xl font-bold tabular-nums">{Math.abs(detail.score1 - detail.score2)}</div>
                    </div>
                  </div>
                  {detail.notes && (
                    <p className="text-sm text-muted-foreground italic text-center">"{detail.notes}"</p>
                  )}
                </div>
                <DialogFooter className="gap-2 sm:gap-2">
                  <Button variant="outline" className="gap-2" onClick={() => { setEditTarget(detail); setDetailId(null); }}>
                    <Pencil className="size-4" /> {t("common.edit")}
                  </Button>
                  <Button variant="destructive" className="gap-2" onClick={() => setDeleteId(detail.id)}>
                    <Trash2 className="size-4" /> {t("common.delete")}
                  </Button>
                </DialogFooter>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Edit modal */}
      <Dialog open={!!editTarget} onOpenChange={(o) => !o && setEditTarget(null)}>
        <DialogContent className="glass-card max-w-md">
          <DialogHeader><DialogTitle>{t("match.edit_title")}</DialogTitle></DialogHeader>
          {editTarget && (
            <div className="space-y-4">
              <div>
                <label className="text-xs uppercase tracking-widest text-muted-foreground">{t("common.date")}</label>
                <Input
                  type="date"
                  value={editTarget.played_at}
                  onChange={(e) => setEditTarget({ ...editTarget, played_at: e.target.value })}
                  className="rounded-xl mt-1"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                {([1, 2] as const).map((side) => {
                  const pid = side === 1 ? editTarget.player1_id : editTarget.player2_id;
                  const tid = side === 1 ? editTarget.team1_id : editTarget.team2_id;
                  const score = side === 1 ? editTarget.score1 : editTarget.score2;
                  const setScore = (n: number) =>
                    setEditTarget(side === 1 ? { ...editTarget, score1: n } : { ...editTarget, score2: n });
                  return (
                    <div key={side} className="glass-card rounded-xl p-3 text-center space-y-2">
                      <TeamCrest team={teamById.get(tid ?? "")} size={48} className="mx-auto" />
                      <div className="text-sm font-semibold truncate">{playerById.get(pid)?.name ?? "—"}</div>
                      <div className="flex items-center justify-center gap-2">
                        <Button size="icon" variant="outline" className="size-8 rounded-full" onClick={() => setScore(Math.max(0, score - 1))}>
                          <Minus className="size-3" />
                        </Button>
                        <span className="font-display font-black text-2xl tabular-nums w-8">{score}</span>
                        <Button size="icon" variant="outline" className="size-8 rounded-full" onClick={() => setScore(score + 1)}>
                          <Plus className="size-3" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div>
                <label className="text-xs uppercase tracking-widest text-muted-foreground">{t("common.notes_optional")}</label>
                <Textarea
                  value={editTarget.notes ?? ""}
                  onChange={(e) => setEditTarget({ ...editTarget, notes: e.target.value })}
                  placeholder={t("match.notes_placeholder")}
                  className="rounded-xl mt-1"
                  rows={3}
                />
              </div>
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="outline" onClick={() => setEditTarget(null)}>{t("common.cancel")}</Button>
            <Button onClick={() => editTarget && update.mutate(editTarget)} disabled={update.isPending}>
              {update.isPending ? t("common.saving") : t("common.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent className="glass-card">
          <AlertDialogHeader>
            <AlertDialogTitle>{t("match.confirm_delete")}</AlertDialogTitle>
            <AlertDialogDescription>{t("settings.reset_confirm_body")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteId && del.mutate(deleteId)}
            >
              {t("common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
