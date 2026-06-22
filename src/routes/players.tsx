import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { fetchMatches, fetchPlayers, fetchTeams, queryKeys, type Player, type Team } from "@/lib/db";
import { computePlayerStats } from "@/lib/stats";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { TeamCrest } from "@/components/TeamCrest";
import { Plus, Pencil, Trash2, User2, ChevronDown, Flame, Heart, StickyNote, Shield } from "lucide-react";
import { toast } from "sonner";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/players")({
  head: () => ({ meta: [{ title: "Players — GOLAÇO CUP" }] }),
  component: PlayersPage,
});

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function PlayersPage() {
  const t = useT();
  const qc = useQueryClient();
  const players = useQuery({ queryKey: queryKeys.players, queryFn: fetchPlayers });
  const teams = useQuery({ queryKey: queryKeys.teams, queryFn: fetchTeams });
  const matches = useQuery({ queryKey: queryKeys.matches, queryFn: fetchMatches });
  const stats = computePlayerStats(players.data ?? [], matches.data ?? []);
  const teamById = useMemo(
    () => new Map((teams.data ?? []).map((tm) => [tm.id, tm])),
    [teams.data],
  );
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Player | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("players").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.players });
      qc.invalidateQueries({ queryKey: queryKeys.matches });
      toast.success(t("players.removed"));
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <AppLayout
      title={t("players.title")}
      subtitle={t("players.registered", { n: players.data?.length ?? 0 })}
      action={
        <Button
          onClick={() => {
            setEditing(null);
            setOpen(true);
          }}
          className="gap-1.5 rounded-2xl tap bg-gradient-to-r from-[#39FF14] to-[#00BFFF] text-[#02101f] font-bold"
        >
          <Plus className="size-4" /> <span className="hidden sm:inline">{t("players.add")}</span>
        </Button>
      }
    >
      {players.data?.length === 0 ? (
        <Card className="glass-card">
          <CardContent className="py-12 text-center text-muted-foreground">
            <User2 className="size-10 mx-auto mb-3 opacity-50" />
            <p className="mb-4">{t("players.empty")}</p>
            <Button
              className="rounded-xl tap"
              onClick={() => {
                setEditing(null);
                setOpen(true);
              }}
            >
              {t("players.add_first")}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
          {stats.map((s, i) => {
            const isOpen = expanded === s.player.id;
            const winPct = Math.round(s.winRate * 100);
            const favTeam = s.player.favorite_team_id ? teamById.get(s.player.favorite_team_id) : null;
            return (
              <Card
                key={s.player.id}
                className="glass-card overflow-hidden float-in relative pop"
                style={{ animationDelay: `${i * 30}ms` }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-[color:var(--accent)]/5 pointer-events-none" />
                <CardContent className="p-4 relative">
                  <div className="flex items-start gap-3">
                    <div className="relative">
                      <Avatar className="size-14 ring-2 ring-primary/40 shadow-lg shadow-primary/20">
                        {s.player.avatar_url && <AvatarImage src={s.player.avatar_url} alt={s.player.name} />}
                        <AvatarFallback className="bg-gradient-to-br from-primary to-[color:var(--accent)] text-primary-foreground font-display font-black">
                          {initials(s.player.name)}
                        </AvatarFallback>
                      </Avatar>
                      {favTeam && (
                        <div className="absolute -bottom-1 -right-1 rounded-full ring-2 ring-card bg-card">
                          <TeamCrest team={favTeam} size={22} />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-display font-bold truncate flex items-center gap-1.5">
                        {s.player.name}
                        {i === 0 && s.played > 0 && <Flame className="size-4 text-[color:var(--accent)]" />}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {t("players.x_matches", { n: s.played })} · <span className="neon-text">{winPct}%</span>
                      </p>
                      {favTeam && (
                        <p className="mt-1 text-[10px] uppercase tracking-widest font-bold text-[color:var(--accent)] flex items-center gap-1 truncate">
                          <Heart className="size-3 fill-current" /> {favTeam.name}
                        </p>
                      )}
                    </div>
                    <button
                      className="tap size-8 rounded-full grid place-items-center hover:bg-foreground/10"
                      onClick={() => setExpanded(isOpen ? null : s.player.id)}
                      aria-label="Expand"
                    >
                      <ChevronDown className={cn("size-4 transition-transform", isOpen && "rotate-180")} />
                    </button>
                  </div>

                  {/* Win rate bar */}
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-1">
                      <span>{t("players.win_rate", { n: winPct })}</span>
                      <span className="text-foreground">{s.wins}/{s.played || 0}</span>
                    </div>
                    <div className="h-2 rounded-full bg-foreground/10 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-primary to-[color:var(--win)] transition-all duration-700"
                        style={{ width: `${winPct}%`, boxShadow: "0 0 10px rgba(0,191,255,0.6)" }}
                      />
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-4 gap-2 text-center">
                    <Stat label="W" value={s.wins} color="text-[color:var(--win)]" />
                    <Stat label="D" value={s.draws} color="text-[color:var(--draw)]" />
                    <Stat label="L" value={s.losses} color="text-[color:var(--loss)]" />
                    <Stat label="GD" value={(s.goalDiff >= 0 ? "+" : "") + s.goalDiff} />
                  </div>

                  {isOpen && (
                    <div className="mt-3 space-y-2 float-in">
                      <div className="grid grid-cols-3 gap-2 text-center text-xs">
                        <div className="rounded-xl bg-foreground/5 py-2">
                          GF <span className="font-bold neon-text-green">{s.goalsFor}</span>
                        </div>
                        <div className="rounded-xl bg-foreground/5 py-2">
                          GA <span className="font-bold text-[color:var(--loss)]">{s.goalsAgainst}</span>
                        </div>
                        <div className="rounded-xl bg-foreground/5 py-2">
                          PTS <span className="font-bold neon-text">{s.points}</span>
                        </div>
                      </div>
                      {s.player.notes && (
                        <div className="rounded-xl bg-foreground/5 p-3 text-xs text-muted-foreground flex gap-2">
                          <StickyNote className="size-3.5 shrink-0 mt-0.5 text-primary" />
                          <span className="whitespace-pre-wrap break-words">{s.player.notes}</span>
                        </div>
                      )}
                      <div className="flex gap-2 justify-end pt-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="gap-1.5"
                          onClick={() => {
                            setEditing(s.player);
                            setOpen(true);
                          }}
                        >
                          <Pencil className="size-3.5" /> {t("common.edit")}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="gap-1.5 text-destructive"
                          onClick={() => {
                            if (confirm(t("players.confirm_delete", { name: s.player.name })))
                              del.mutate(s.player.id);
                          }}
                        >
                          <Trash2 className="size-3.5" /> {t("common.delete")}
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <PlayerDialog open={open} onOpenChange={setOpen} player={editing} teams={teams.data ?? []} />
    </AppLayout>
  );
}

function Stat({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="rounded-xl bg-foreground/[0.04] py-1.5">
      <div className={`font-display text-lg font-black leading-none ${color ?? ""}`}>{value}</div>
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mt-0.5">{label}</div>
    </div>
  );
}

function PlayerDialog({
  open,
  onOpenChange,
  player,
  teams,
}: {
  open: boolean;
  onOpenChange: (b: boolean) => void;
  player: Player | null;
  teams: Team[];
}) {
  const t = useT();
  const qc = useQueryClient();
  const [name, setName] = useState(player?.name ?? "");
  const [avatar, setAvatar] = useState(player?.avatar_url ?? "");
  const [favTeam, setFavTeam] = useState<string>(player?.favorite_team_id ?? "");
  const [notes, setNotes] = useState(player?.notes ?? "");

  const save = useMutation({
    mutationFn: async () => {
      if (!name.trim()) throw new Error(t("players.name_required"));
      const payload = {
        name: name.trim(),
        avatar_url: avatar.trim() || null,
        favorite_team_id: favTeam || null,
        notes: notes.trim() || null,
      };
      if (player) {
        const { error } = await supabase.from("players").update(payload).eq("id", player.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("players").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.players });
      toast.success(player ? t("players.updated") : t("players.added"));
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (o) {
          setName(player?.name ?? "");
          setAvatar(player?.avatar_url ?? "");
          setFavTeam(player?.favorite_team_id ?? "");
          setNotes(player?.notes ?? "");
        }
      }}
    >
      <DialogContent className="glass-card max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">
            {player ? t("players.edit") : t("players.add")}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Avatar className="size-16 ring-2 ring-primary/40">
              {avatar && <AvatarImage src={avatar} alt={name} />}
              <AvatarFallback className="bg-gradient-to-br from-primary to-[color:var(--accent)] text-primary-foreground font-display font-black">
                {initials(name || "?")}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <Label htmlFor="name">{t("common.name")}</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Marco"
                autoFocus
                className="rounded-xl mt-1"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="avatar">{t("players.avatar_url")}</Label>
            <Input
              id="avatar"
              value={avatar}
              onChange={(e) => setAvatar(e.target.value)}
              placeholder="https://..."
              className="rounded-xl mt-1"
            />
          </div>

          <div>
            <Label htmlFor="favteam" className="flex items-center gap-2">
              <Shield className="size-4 text-primary" /> {t("players.favorite_team")}
            </Label>
            {teams.length === 0 ? (
              <p className="text-xs text-muted-foreground mt-1">{t("players.no_teams_yet")}</p>
            ) : (
              <select
                id="favteam"
                value={favTeam}
                onChange={(e) => setFavTeam(e.target.value)}
                className="mt-1 w-full rounded-xl bg-input border border-border px-3 py-2 text-sm"
              >
                <option value="">— {t("common.none")} —</option>
                {teams.map((tm) => (
                  <option key={tm.id} value={tm.id}>
                    {tm.name} {tm.country ? `(${tm.country})` : ""}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <Label htmlFor="notes" className="flex items-center gap-2">
              <StickyNote className="size-4 text-primary" /> {t("common.notes_optional")}
            </Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t("players.notes_placeholder")}
              rows={3}
              className="rounded-xl mt-1 resize-none"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            {t("common.cancel")}
          </Button>
          <Button
            onClick={() => save.mutate()}
            disabled={save.isPending}
            className="rounded-xl tap bg-gradient-to-r from-[#39FF14] to-[#00BFFF] text-[#02101f] font-bold"
          >
            {save.isPending ? t("common.saving") : t("common.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
