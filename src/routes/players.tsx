import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { fetchMatches, fetchPlayers, queryKeys, type Player } from "@/lib/db";
import { computePlayerStats } from "@/lib/stats";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Plus, Pencil, Trash2, User2, ChevronDown, Flame } from "lucide-react";
import { toast } from "sonner";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { DEFAULT_AVATARS } from "@/lib/default-avatars";

export const Route = createFileRoute("/players")({
  head: () => ({ meta: [{ title: "Players — GolaçoCup" }] }),
  component: PlayersPage,
});

function initials(name: string) {
  return name.split(" ").map(p => p[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
}

function PlayersPage() {
  const t = useT();
  const qc = useQueryClient();
  const players = useQuery({ queryKey: queryKeys.players, queryFn: fetchPlayers });
  const matches = useQuery({ queryKey: queryKeys.matches, queryFn: fetchMatches });
  const stats = computePlayerStats(players.data ?? [], matches.data ?? []);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Player | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error: matchError } = await supabase
        .from("matches")
        .delete()
        .or(`player1_id.eq.${id},player2_id.eq.${id}`);
      if (matchError) throw matchError;

      const { error: playerError } = await supabase.from("players").delete().eq("id", id);
      if (playerError) throw playerError;
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
        <Button onClick={() => { setEditing(null); setOpen(true); }} className="gap-1.5 rounded-2xl tap">
          <Plus className="size-4" /> <span className="hidden sm:inline">{t("players.add")}</span>
        </Button>
      }
    >
      {players.data?.length === 0 ? (
        <Card className="glass-card">
          <CardContent className="py-12 text-center text-muted-foreground">
            <User2 className="size-10 mx-auto mb-3 opacity-50" />
            <p className="mb-4">{t("players.empty")}</p>
            <Button className="rounded-xl tap" onClick={() => { setEditing(null); setOpen(true); }}>{t("players.add_first")}</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
          {stats.map((s, i) => {
            const isOpen = expanded === s.player.id;
            const winPct = Math.round(s.winRate * 100);
            return (
              <Card key={s.player.id} className="glass-card overflow-hidden float-in" style={{ animationDelay: `${i * 30}ms` }}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Avatar className="size-14 ring-2 ring-primary/30">
                      {s.player.avatar_url && <AvatarImage src={s.player.avatar_url} alt={s.player.name} />}
                      <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground font-display font-black">
                        {initials(s.player.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-display font-bold truncate flex items-center gap-1.5">
                        {s.player.name}
                        {i === 0 && s.played > 0 && <Flame className="size-4 text-[color:var(--accent)]" />}
                      </h3>
                      <p className="text-xs text-muted-foreground">{t("players.x_matches", { n: s.played })} · {winPct}%</p>
                    </div>
                    <button
                      className="tap size-8 rounded-full grid place-items-center hover:bg-foreground/10"
                      onClick={() => setExpanded(isOpen ? null : s.player.id)}
                    >
                      <ChevronDown className={cn("size-4 transition-transform", isOpen && "rotate-180")} />
                    </button>
                  </div>

                  {/* Win rate bar */}
                  <div className="mt-3 h-2 rounded-full bg-foreground/10 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary to-[color:var(--win)] transition-all duration-700"
                      style={{ width: `${winPct}%` }}
                    />
                  </div>

                  <div className="mt-4 grid grid-cols-4 gap-2 text-center">
                    <Stat label="W" value={s.wins} color="text-[color:var(--win)]" />
                    <Stat label="D" value={s.draws} color="text-[color:var(--draw)]" />
                    <Stat label="L" value={s.losses} color="text-[color:var(--loss)]" />
                    <Stat label="GD" value={(s.goalDiff >= 0 ? "+" : "") + s.goalDiff} />
                  </div>

                  {isOpen && (
                    <div className="mt-3 space-y-2 float-in">
                      <div className="grid grid-cols-2 gap-2 text-center text-xs">
                        <div className="rounded-xl bg-foreground/5 py-2">GF <span className="font-bold text-foreground">{s.goalsFor}</span></div>
                        <div className="rounded-xl bg-foreground/5 py-2">GA <span className="font-bold text-foreground">{s.goalsAgainst}</span></div>
                        <div className="rounded-xl bg-foreground/5 py-2">PTS <span className="font-bold text-primary">{s.points}</span></div>
                        <div className="rounded-xl bg-foreground/5 py-2">{t("players.win_rate", { n: winPct })}</div>
                      </div>
                      <div className="flex gap-2 justify-end pt-1">
                        <Button size="sm" variant="ghost" className="gap-1.5"
                          onClick={() => { setEditing(s.player); setOpen(true); }}>
                          <Pencil className="size-3.5" /> {t("common.edit")}
                        </Button>
                        <Button size="sm" variant="ghost" className="gap-1.5 text-destructive"
                          onClick={() => { if (confirm(t("players.confirm_delete", { name: s.player.name }))) del.mutate(s.player.id); }}>
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

      <PlayerDialog open={open} onOpenChange={setOpen} player={editing} />
    </AppLayout>
  );
}

function Stat({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <div>
      <div className={`font-display text-lg font-black ${color ?? ""}`}>{value}</div>
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">{label}</div>
    </div>
  );
}

function PlayerDialog({ open, onOpenChange, player }: { open: boolean; onOpenChange: (b: boolean) => void; player: Player | null }) {
  const t = useT();
  const qc = useQueryClient();
  const [name, setName] = useState(player?.name ?? "");
  const [avatar, setAvatar] = useState(player?.avatar_url ?? "");

  useEffect(() => {
    if (!open) return;
    setName(player?.name ?? "");
    setAvatar(player?.avatar_url ?? "");
  }, [open, player]);

  const save = useMutation({
    mutationFn: async () => {
      if (!name.trim()) throw new Error(t("players.name_required"));
      if (player) {
        const { error } = await supabase.from("players").update({ name: name.trim(), avatar_url: avatar || null }).eq("id", player.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("players").insert({ name: name.trim(), avatar_url: avatar || null });
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{player ? t("players.edit") : t("players.add")}</DialogTitle>
          <DialogDescription className="sr-only">{t("players.avatar_url")}</DialogDescription>
        </DialogHeader>
        <div className="space-y-5">
          <div>
            <Label htmlFor="name">{t("common.name")}</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Marco" autoFocus className="rounded-xl" />
          </div>

          <div>
            <Label htmlFor="avatar">{t("players.avatar_url")}</Label>
            <Input
              id="avatar"
              value={avatar}
              onChange={(e) => setAvatar(e.target.value)}
              placeholder="https://..."
              className="mt-1 rounded-xl"
            />
          </div>

          <div>
            <Label className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">
              Ou escolha um avatar
            </Label>
            <div className="mt-2 grid grid-cols-6 gap-2">
              {DEFAULT_AVATARS.map((url) => {
                const selected = avatar === url;
                return (
                  <button
                    key={url}
                    type="button"
                    onClick={() => setAvatar(url)}
                    className={cn(
                      "relative aspect-square rounded-xl overflow-hidden ring-2 transition tap",
                      selected ? "ring-primary scale-105" : "ring-transparent hover:ring-foreground/20"
                    )}
                    aria-label="Escolher avatar"
                  >
                    <img src={url} alt="" className="h-full w-full object-cover bg-foreground/5" />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>{t("common.cancel")}</Button>
          <Button onClick={() => save.mutate()} disabled={save.isPending} className="rounded-xl tap">
            {save.isPending ? t("common.saving") : t("common.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
