import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { fetchPlayers, fetchTeams, queryKeys } from "@/lib/db";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { TeamCrest } from "@/components/TeamCrest";
import { TeamGalleryButton } from "@/components/TeamGallery";
import { format } from "date-fns";
import { toast } from "sonner";
import { Swords, Minus, Plus, Trophy, Sparkles } from "lucide-react";
import { useT } from "@/lib/i18n";
import { celebrate } from "@/lib/celebrate";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/matches/new")({
  head: () => ({ meta: [{ title: "New match — GOLAÇO CUP" }] }),
  component: NewMatch,
});

function NewMatch() {
  const t = useT();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const players = useQuery({ queryKey: queryKeys.players, queryFn: fetchPlayers });
  const teams = useQuery({ queryKey: queryKeys.teams, queryFn: fetchTeams });

  const [p1, setP1] = useState<string>("");
  const [p2, setP2] = useState<string>("");
  const [t1, setT1] = useState<string>("");
  const [t2, setT2] = useState<string>("");
  const [s1, setS1] = useState<number>(0);
  const [s2, setS2] = useState<number>(0);
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [notes, setNotes] = useState("");
  const [celebrateOpen, setCelebrateOpen] = useState(false);

  const team1 = teams.data?.find(x => x.id === t1);
  const team2 = teams.data?.find(x => x.id === t2);
  const player1 = players.data?.find(x => x.id === p1);
  const player2 = players.data?.find(x => x.id === p2);
  const winner = s1 > s2 ? player1?.name : s2 > s1 ? player2?.name : null;
  const winnerTeam = s1 > s2 ? team1 : s2 > s1 ? team2 : null;

  const save = useMutation({
    mutationFn: async () => {
      if (!p1 || !p2) throw new Error(t("match.select_player"));
      if (p1 === p2) throw new Error("Players must be different");
      const { error } = await supabase.from("matches").insert({
        played_at: date,
        player1_id: p1, player2_id: p2,
        team1_id: t1 || null, team2_id: t2 || null,
        score1: s1, score2: s2,
        notes: notes.trim() || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.matches });
      if (s1 !== s2) celebrate();
      toast.success(t("match.saved"));
      setCelebrateOpen(true);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const closeCelebration = () => {
    setCelebrateOpen(false);
    setTimeout(() => navigate({ to: "/matches" }), 150);
  };

  const noPlayers = (players.data?.length ?? 0) < 2;

  return (
    <AppLayout title={t("match.new_title")} subtitle={t("match.new_subtitle")}>
      {noPlayers && (
        <Card className="glass-card mb-4 border-[color:var(--draw)]/40">
          <CardContent className="py-4 text-sm">
            {t("match.need_players")}{" "}
            <a href="/players" className="text-primary underline font-semibold">{t("match.add_players_first")}</a>.
          </CardContent>
        </Card>
      )}

      <Card className="glass-card max-w-3xl mx-auto">
        <CardContent className="p-4 md:p-6 space-y-5">
          {/* Date */}
          <div>
            <Label htmlFor="date" className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">{t("common.date")}</Label>
            <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className="rounded-xl h-12 text-base" />
          </div>

          {/* VS layout */}
          <div className="grid grid-cols-[1fr_auto_1fr] items-stretch gap-2 md:gap-4">
            <PlayerSide
              label={t("match.player_n", { n: 1 })}
              players={players.data ?? []} teams={teams.data ?? []}
              playerId={p1} onPlayerChange={setP1}
              teamId={t1} onTeamChange={setT1}
              team={team1}
              score={s1} onScoreChange={setS1}
              accent="primary"
              winning={!!winner && s1 > s2}
            />
            <div className="grid place-items-center px-1">
              <div className="font-display font-black text-2xl md:text-3xl text-muted-foreground">VS</div>
            </div>
            <PlayerSide
              label={t("match.player_n", { n: 2 })}
              players={players.data ?? []} teams={teams.data ?? []}
              playerId={p2} onPlayerChange={setP2}
              teamId={t2} onTeamChange={setT2}
              team={team2}
              score={s2} onScoreChange={setS2}
              accent="accent"
              winning={!!winner && s2 > s1}
            />
          </div>

          {/* Winner preview */}
          {(p1 || p2) && (s1 !== 0 || s2 !== 0) && (
            <div className={cn(
              "rounded-2xl p-3 text-center font-display font-bold flex items-center justify-center gap-2 transition-all",
              winner ? "bg-[color:var(--win)]/15 text-[color:var(--win)] celebrate" : "bg-[color:var(--draw)]/15 text-[color:var(--draw)]"
            )}>
              <Trophy className="size-5" />
              {winner ? t("celebration.winner", { name: winner }) : t("match.draw")}
            </div>
          )}

          {/* Notes */}
          <div>
            <Label htmlFor="notes" className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">{t("common.notes_optional")}</Label>
            <Textarea id="notes" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={t("match.notes_placeholder")} className="rounded-xl" />
          </div>

          <Button size="lg" className="w-full gap-2 rounded-2xl h-14 text-base font-bold tap pulse-glow" disabled={save.isPending || noPlayers} onClick={() => save.mutate()}>
            <Swords className="size-5" /> {save.isPending ? t("common.saving") : t("common.save")}
          </Button>
        </CardContent>
      </Card>
    </AppLayout>
  );
}


function PlayerSide(props: {
  label: string;
  players: { id: string; name: string }[];
  teams: { id: string; name: string; country: string; crest_url: string; created_at: string }[];
  playerId: string; onPlayerChange: (v: string) => void;
  teamId: string; onTeamChange: (v: string) => void;
  team?: { id: string; name: string; country: string; crest_url: string; created_at: string };
  score: number; onScoreChange: (v: number) => void;
  accent: "primary" | "accent";
  winning: boolean;
}) {
  const t = useT();
  const ring = props.winning
    ? "border-[color:var(--win)] shadow-[0_0_40px_-12px_var(--win)]"
    : props.accent === "primary"
      ? "border-primary/30"
      : "border-[color:var(--accent)]/30";
  return (
    <div className={cn("rounded-3xl border bg-foreground/[0.02] p-3 md:p-4 space-y-3 transition-all", ring)}>
      <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-bold">
        {props.label}
      </div>
      <Select value={props.playerId} onValueChange={props.onPlayerChange}>
        <SelectTrigger className="rounded-xl"><SelectValue placeholder={t("match.select_player")} /></SelectTrigger>
        <SelectContent>
          {props.players.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
        </SelectContent>
      </Select>

      <TeamGalleryButton teams={props.teams} value={props.teamId} onChange={props.onTeamChange} accent={props.accent} />

      <div className="grid place-items-center py-2">
        <TeamCrest team={props.team} size={72} className={props.winning ? "celebrate" : ""} />
      </div>

      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => props.onScoreChange(Math.max(0, props.score - 1))}
          className="tap size-11 rounded-full grid place-items-center bg-foreground/5 hover:bg-foreground/10"
          aria-label="-"
        >
          <Minus className="size-5" />
        </button>
        <div key={props.score} className="font-display text-5xl font-black tabular-nums pop">{props.score}</div>
        <button
          type="button"
          onClick={() => props.onScoreChange(props.score + 1)}
          className="tap size-11 rounded-full grid place-items-center bg-primary text-primary-foreground hover:opacity-90"
          aria-label="+"
        >
          <Plus className="size-5" />
        </button>
      </div>
    </div>
  );
}
