import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { fetchPlayers, fetchTeams, queryKeys } from "@/lib/db";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TeamBadge } from "@/components/TeamBadge";
import { format } from "date-fns";
import { toast } from "sonner";
import { Swords } from "lucide-react";

export const Route = createFileRoute("/matches/new")({
  head: () => ({ meta: [{ title: "Register match — F26 Tracker" }] }),
  component: NewMatch,
});

function NewMatch() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const players = useQuery({ queryKey: queryKeys.players, queryFn: fetchPlayers });
  const teams = useQuery({ queryKey: queryKeys.teams, queryFn: fetchTeams });

  const [p1, setP1] = useState<string>("");
  const [p2, setP2] = useState<string>("");
  const [t1, setT1] = useState<string>("");
  const [t2, setT2] = useState<string>("");
  const [s1, setS1] = useState<string>("0");
  const [s2, setS2] = useState<string>("0");
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [notes, setNotes] = useState("");

  const team1 = teams.data?.find(t => t.id === t1);
  const team2 = teams.data?.find(t => t.id === t2);

  const save = useMutation({
    mutationFn: async () => {
      if (!p1 || !p2) throw new Error("Select both players");
      if (p1 === p2) throw new Error("Players must be different");
      const score1 = parseInt(s1, 10);
      const score2 = parseInt(s2, 10);
      if (Number.isNaN(score1) || Number.isNaN(score2) || score1 < 0 || score2 < 0) {
        throw new Error("Enter valid scores");
      }
      const { error } = await supabase.from("matches").insert({
        played_at: date,
        player1_id: p1, player2_id: p2,
        team1_id: t1 || null, team2_id: t2 || null,
        score1, score2,
        notes: notes.trim() || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.matches });
      toast.success("Match saved!");
      navigate({ to: "/matches" });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const noPlayers = (players.data?.length ?? 0) < 2;

  return (
    <AppLayout title="New match" subtitle="Log the result of your F26 battle">
      {noPlayers && (
        <Card className="glass-card mb-4 border-[color:var(--draw)]/40">
          <CardContent className="py-4 text-sm">
            You need at least 2 players. <a href="/players" className="text-primary underline">Add players first</a>.
          </CardContent>
        </Card>
      )}

      <Card className="glass-card">
        <CardContent className="p-4 md:p-6 space-y-6">
          {/* Date */}
          <div>
            <Label htmlFor="date">Date</Label>
            <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>

          {/* Players & teams */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <PlayerSide
              label="Player 1" players={players.data ?? []} teams={teams.data ?? []}
              playerId={p1} onPlayerChange={setP1}
              teamId={t1} onTeamChange={setT1}
              team={team1}
              score={s1} onScoreChange={setS1}
              accent="primary"
            />
            <PlayerSide
              label="Player 2" players={players.data ?? []} teams={teams.data ?? []}
              playerId={p2} onPlayerChange={setP2}
              teamId={t2} onTeamChange={setT2}
              team={team2}
              score={s2} onScoreChange={setS2}
              accent="accent"
            />
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea id="notes" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Hat-trick from Mbappé, last-minute winner..." />
          </div>

          <Button size="lg" className="w-full gap-2 pulse-glow" disabled={save.isPending || noPlayers} onClick={() => save.mutate()}>
            <Swords className="size-4" /> {save.isPending ? "Saving..." : "Save match"}
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
  score: string; onScoreChange: (v: string) => void;
  accent: "primary" | "accent";
}) {
  const accentColor = props.accent === "primary"
    ? "border-primary/40 shadow-[0_0_30px_-12px_var(--primary)]"
    : "border-[color:var(--accent)]/40 shadow-[0_0_30px_-12px_var(--accent)]";
  return (
    <div className={`rounded-xl border bg-white/[0.03] p-4 ${accentColor}`}>
      <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-3 font-display">
        {props.label}
      </div>
      <div className="space-y-3">
        <Select value={props.playerId} onValueChange={props.onPlayerChange}>
          <SelectTrigger><SelectValue placeholder="Select player" /></SelectTrigger>
          <SelectContent>
            {props.players.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={props.teamId} onValueChange={props.onTeamChange}>
          <SelectTrigger><SelectValue placeholder="Select team" /></SelectTrigger>
          <SelectContent>
            {props.teams.map(t => (
              <SelectItem key={t.id} value={t.id}>
                <span className="flex items-center gap-2">
                  <img src={t.crest_url} alt="" className="size-4 object-contain" />
                  {t.name}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {props.team && (
          <div className="rounded-lg bg-white/5 p-2">
            <TeamBadge team={props.team} size="lg" />
          </div>
        )}
        <div>
          <Label className="text-xs text-muted-foreground">Score</Label>
          <Input type="number" min={0} value={props.score}
            onChange={(e) => props.onScoreChange(e.target.value)}
            className="font-display text-2xl font-black text-center h-14" />
        </div>
      </div>
    </div>
  );
}
