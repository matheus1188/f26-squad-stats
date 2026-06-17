import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { fetchTeams, queryKeys, type Team } from "@/lib/db";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Search, Shield } from "lucide-react";
import { toast } from "sonner";
import { TeamBadge } from "@/components/TeamBadge";

export const Route = createFileRoute("/teams")({
  head: () => ({ meta: [{ title: "Teams — F26 Tracker" }] }),
  component: TeamsPage,
});

function TeamsPage() {
  const qc = useQueryClient();
  const teams = useQuery({ queryKey: queryKeys.teams, queryFn: fetchTeams });
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Team | null>(null);

  const filtered = (teams.data ?? []).filter(t =>
    t.name.toLowerCase().includes(q.toLowerCase()) ||
    t.country.toLowerCase().includes(q.toLowerCase())
  );

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("teams").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.teams });
      qc.invalidateQueries({ queryKey: queryKeys.matches });
      toast.success("Team removed");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <AppLayout
      title="Teams"
      subtitle={`${teams.data?.length ?? 0} teams`}
      action={
        <Button onClick={() => { setEditing(null); setOpen(true); }} className="gap-1.5">
          <Plus className="size-4" /> <span className="hidden sm:inline">Add team</span>
        </Button>
      }
    >
      <div className="relative mb-4">
        <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search teams or countries..." className="pl-9" />
      </div>

      {filtered.length === 0 ? (
        <Card className="glass-card">
          <CardContent className="py-10 text-center text-muted-foreground">
            <Shield className="size-10 mx-auto mb-3 opacity-50" />
            No teams match your search.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {filtered.map((t) => (
            <Card key={t.id} className="glass-card">
              <CardContent className="p-3">
                <div className="aspect-square grid place-items-center bg-white/5 rounded-lg mb-3 p-3">
                  <img src={t.crest_url} alt={t.name} className="size-full object-contain" loading="lazy" />
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-sm truncate">{t.name}</div>
                  <div className="text-xs text-muted-foreground truncate">{t.country}</div>
                </div>
                <div className="mt-2 flex gap-1 justify-end">
                  <Button size="icon" variant="ghost" className="size-7"
                    onClick={() => { setEditing(t); setOpen(true); }}>
                    <Pencil className="size-3.5" />
                  </Button>
                  <Button size="icon" variant="ghost" className="size-7 text-destructive"
                    onClick={() => { if (confirm(`Remove ${t.name}?`)) del.mutate(t.id); }}>
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <TeamDialog open={open} onOpenChange={setOpen} team={editing} />
    </AppLayout>
  );
}

function TeamDialog({ open, onOpenChange, team }: { open: boolean; onOpenChange: (b: boolean) => void; team: Team | null }) {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [country, setCountry] = useState("");
  const [crest, setCrest] = useState("");

  const save = useMutation({
    mutationFn: async () => {
      if (!name.trim() || !country.trim() || !crest.trim()) throw new Error("All fields required");
      const payload = { name: name.trim(), country: country.trim(), crest_url: crest.trim() };
      if (team) {
        const { error } = await supabase.from("teams").update(payload).eq("id", team.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("teams").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.teams });
      toast.success(team ? "Team updated" : "Team added");
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={(o) => {
      onOpenChange(o);
      if (o) {
        setName(team?.name ?? ""); setCountry(team?.country ?? ""); setCrest(team?.crest_url ?? "");
      }
    }}>
      <DialogContent>
        <DialogHeader><DialogTitle>{team ? "Edit team" : "Add team"}</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="t-name">Name</Label>
            <Input id="t-name" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
          </div>
          <div>
            <Label htmlFor="t-country">Country</Label>
            <Input id="t-country" value={country} onChange={(e) => setCountry(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="t-crest">Flag / crest URL</Label>
            <Input id="t-crest" value={crest} onChange={(e) => setCrest(e.target.value)} placeholder="https://..." />
            {crest && (
              <div className="mt-3 flex items-center gap-3">
                <span className="text-xs text-muted-foreground">Preview:</span>
                <TeamBadge team={{ id: "preview", name: name || "Preview", country: country, crest_url: crest, created_at: "" }} size="lg" />
              </div>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => save.mutate()} disabled={save.isPending}>{save.isPending ? "Saving..." : "Save"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
