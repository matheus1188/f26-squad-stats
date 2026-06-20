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
import { TeamCrest } from "@/components/TeamCrest";
import { ImageUpload } from "@/components/ImageUpload";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/teams")({
  head: () => ({ meta: [{ title: "Teams — GolaçoCup" }] }),
  component: TeamsPage,
});

function TeamsPage() {
  const t = useT();
  const qc = useQueryClient();
  const teams = useQuery({ queryKey: queryKeys.teams, queryFn: fetchTeams });
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Team | null>(null);

  const filtered = (teams.data ?? []).filter(tm =>
    tm.name.toLowerCase().includes(q.toLowerCase()) ||
    tm.country.toLowerCase().includes(q.toLowerCase())
  );

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("teams").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.teams });
      qc.invalidateQueries({ queryKey: queryKeys.matches });
      toast.success(t("teams.removed"));
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <AppLayout
      title={t("teams.title")}
      subtitle={t("teams.count", { n: teams.data?.length ?? 0 })}
      action={
        <Button onClick={() => { setEditing(null); setOpen(true); }} className="gap-1.5 rounded-2xl tap">
          <Plus className="size-4" /> <span className="hidden sm:inline">{t("teams.add")}</span>
        </Button>
      }
    >
      <div className="relative mb-4">
        <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("teams.search_placeholder")} className="pl-9 rounded-2xl h-12" />
      </div>

      {filtered.length === 0 ? (
        <Card className="glass-card">
          <CardContent className="py-10 text-center text-muted-foreground">
            <Shield className="size-10 mx-auto mb-3 opacity-50" />
            {t("teams.empty")}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {filtered.map((tm, i) => (
            <Card key={tm.id} className="glass-card tap float-in" style={{ animationDelay: `${i * 15}ms` }}>
              <CardContent className="p-4">
                <div className="grid place-items-center mb-3">
                  <TeamCrest team={tm} size={84} />
                </div>
                <div className="min-w-0 text-center">
                  <div className="font-bold text-sm truncate">{tm.name}</div>
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground truncate mt-0.5">{tm.country}</div>
                </div>
                <div className="mt-2 flex gap-1 justify-center">
                  <Button size="icon" variant="ghost" className="size-8 rounded-full"
                    onClick={() => { setEditing(tm); setOpen(true); }}>
                    <Pencil className="size-3.5" />
                  </Button>
                  <Button size="icon" variant="ghost" className="size-8 rounded-full text-destructive"
                    onClick={() => { if (confirm(t("teams.confirm_delete", { name: tm.name }))) del.mutate(tm.id); }}>
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
  const t = useT();
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [country, setCountry] = useState("");
  const [crest, setCrest] = useState("");

  const save = useMutation({
    mutationFn: async () => {
      if (!name.trim() || !country.trim()) throw new Error(t("teams.all_required"));
      const payload = { name: name.trim(), country: country.trim(), crest_url: crest.trim() || "vector://generated" };
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
      toast.success(team ? t("teams.updated") : t("teams.added"));
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
        <DialogHeader><DialogTitle>{team ? t("teams.edit") : t("teams.add")}</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="t-name">{t("common.name")}</Label>
            <Input id="t-name" value={name} onChange={(e) => setName(e.target.value)} autoFocus className="rounded-xl" />
          </div>
          <div>
            <Label htmlFor="t-country">{t("common.country")}</Label>
            <Input id="t-country" value={country} onChange={(e) => setCountry(e.target.value)} className="rounded-xl" />
          </div>
          <div>
            <Label>Escudo / imagem do time</Label>
            <div className="mt-2">
              <ImageUpload
                value={/^https?:\/\//i.test(crest) ? crest : ""}
                onChange={setCrest}
                bucket="team-images"
                shape="rounded"
                size={88}
                placeholder={<TeamCrest team={{ name: name || "?", country, crest_url: "" }} size={88} />}
              />
            </div>
            <p className="mt-1.5 text-[11px] text-muted-foreground">
              Sem imagem? Mostramos a bandeira do país ou um escudo padrão.
            </p>
          </div>
          {(name || country) && (
            <div className="flex items-center gap-3 rounded-2xl bg-foreground/[0.04] p-3">
              <TeamCrest team={{ name: name || "Preview", country, crest_url: crest }} size={56} />
              <div className="min-w-0">
                <div className="text-xs text-muted-foreground">{t("common.preview")}</div>
                <div className="font-bold truncate">{name || "—"}</div>
                <div className="text-xs text-muted-foreground truncate">{country}</div>
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>{t("common.cancel")}</Button>
          <Button onClick={() => save.mutate()} disabled={save.isPending} className="rounded-xl tap">{save.isPending ? t("common.saving") : t("common.save")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
