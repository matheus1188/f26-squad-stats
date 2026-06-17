import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { fetchMatches, fetchPlayers, queryKeys, type Player } from "@/lib/db";
import { computePlayerStats } from "@/lib/stats";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Plus, Pencil, Trash2, User2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/players")({
  head: () => ({ meta: [{ title: "Players — F26 Tracker" }] }),
  component: PlayersPage,
});

function initials(name: string) {
  return name.split(" ").map(p => p[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
}

function PlayersPage() {
  const qc = useQueryClient();
  const players = useQuery({ queryKey: queryKeys.players, queryFn: fetchPlayers });
  const matches = useQuery({ queryKey: queryKeys.matches, queryFn: fetchMatches });
  const stats = computePlayerStats(players.data ?? [], matches.data ?? []);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Player | null>(null);

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("players").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.players });
      qc.invalidateQueries({ queryKey: queryKeys.matches });
      toast.success("Player removed");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <AppLayout
      title="Players"
      subtitle={`${players.data?.length ?? 0} registered`}
      action={
        <Button onClick={() => { setEditing(null); setOpen(true); }} className="gap-1.5">
          <Plus className="size-4" /> <span className="hidden sm:inline">Add player</span>
        </Button>
      }
    >
      {players.data?.length === 0 ? (
        <Card className="glass-card">
          <CardContent className="py-12 text-center text-muted-foreground">
            <User2 className="size-10 mx-auto mb-3 opacity-50" />
            <p className="mb-4">No players yet. Add your friends to get started.</p>
            <Button onClick={() => { setEditing(null); setOpen(true); }}>Add first player</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
          {stats.map((s) => (
            <Card key={s.player.id} className="glass-card overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Avatar className="size-14 ring-2 ring-primary/30">
                    {s.player.avatar_url && <AvatarImage src={s.player.avatar_url} alt={s.player.name} />}
                    <AvatarFallback className="bg-primary/15 text-primary font-display font-bold">
                      {initials(s.player.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-display font-bold truncate">{s.player.name}</h3>
                    <p className="text-xs text-muted-foreground">{s.played} matches · {Math.round(s.winRate * 100)}% win rate</p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button size="icon" variant="ghost" className="size-8"
                      onClick={() => { setEditing(s.player); setOpen(true); }}>
                      <Pencil className="size-4" />
                    </Button>
                    <Button size="icon" variant="ghost" className="size-8 text-destructive"
                      onClick={() => { if (confirm(`Delete ${s.player.name}? This removes their matches too.`)) del.mutate(s.player.id); }}>
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-4 gap-2 text-center">
                  <Stat label="W" value={s.wins} color="text-[color:var(--win)]" />
                  <Stat label="D" value={s.draws} color="text-[color:var(--draw)]" />
                  <Stat label="L" value={s.losses} color="text-[color:var(--loss)]" />
                  <Stat label="GD" value={(s.goalDiff >= 0 ? "+" : "") + s.goalDiff} />
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-center text-xs">
                  <div className="rounded-md bg-white/5 py-1.5">GF <span className="font-bold text-foreground">{s.goalsFor}</span></div>
                  <div className="rounded-md bg-white/5 py-1.5">GA <span className="font-bold text-foreground">{s.goalsAgainst}</span></div>
                </div>
              </CardContent>
            </Card>
          ))}
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
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
    </div>
  );
}

function PlayerDialog({ open, onOpenChange, player }: { open: boolean; onOpenChange: (b: boolean) => void; player: Player | null }) {
  const qc = useQueryClient();
  const [name, setName] = useState(player?.name ?? "");
  const [avatar, setAvatar] = useState(player?.avatar_url ?? "");


  const save = useMutation({
    mutationFn: async () => {
      if (!name.trim()) throw new Error("Name required");
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
      toast.success(player ? "Player updated" : "Player added");
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={(o) => {
      onOpenChange(o);
      if (o) { setName(player?.name ?? ""); setAvatar(player?.avatar_url ?? ""); }
    }}>
      <DialogContent>
        <DialogHeader><DialogTitle>{player ? "Edit player" : "Add player"}</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Marco" autoFocus />
          </div>
          <div>
            <Label htmlFor="avatar">Avatar URL (optional)</Label>
            <Input id="avatar" value={avatar} onChange={(e) => setAvatar(e.target.value)} placeholder="https://..." />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => save.mutate()} disabled={save.isPending}>
            {save.isPending ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
