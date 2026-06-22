import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Trophy, Plus, Archive, Trash2, Share2, Download, Upload, QrCode,
  FileSpreadsheet, FileText, Wifi, WifiOff, Crown, Award, Medal, Sparkles,
  Settings as Cog, Calendar, Copy, Check,
} from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchMatches, fetchPlayers, fetchTeams, queryKeys,
  type Match, type Player, type Team,
} from "@/lib/db";
import { useLeague, matchInSeason, DEFAULT_RULES, type LeagueRules } from "@/lib/league";
import { computePlayerStats, teamUsage } from "@/lib/stats";
import { ACHIEVEMENTS, computeAchievements } from "@/lib/achievements";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import QRCode from "qrcode";
import jsPDF from "jspdf";

export const Route = createFileRoute("/league")({
  head: () => ({ meta: [{ title: "League — GOLAÇO CUP" }] }),
  component: LeaguePage,
});

function useOnline() {
  const [online, setOnline] = useState(typeof navigator !== "undefined" ? navigator.onLine : true);
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);
  return online;
}

function LeaguePage() {
  const { cfg, currentSeason, setLeagueName, setRules, setCurrentSeason, addSeason, archiveSeason, deleteSeason, updateSeason } = useLeague();
  const online = useOnline();
  const qc = useQueryClient();
  const players = useQuery({ queryKey: queryKeys.players, queryFn: fetchPlayers });
  const teams = useQuery({ queryKey: queryKeys.teams, queryFn: fetchTeams });
  const matches = useQuery({ queryKey: queryKeys.matches, queryFn: fetchMatches });

  const seasonMatches = useMemo(
    () => (matches.data ?? []).filter((m) => matchInSeason(m.played_at, currentSeason)),
    [matches.data, currentSeason],
  );
  const stats = useMemo(
    () => computePlayerStats(players.data ?? [], seasonMatches, cfg.rules),
    [players.data, seasonMatches, cfg.rules],
  );

  const [leagueNameDraft, setLeagueNameDraft] = useState(cfg.leagueName);
  useEffect(() => setLeagueNameDraft(cfg.leagueName), [cfg.leagueName]);

  const [showNewSeason, setShowNewSeason] = useState(false);
  const [newSeasonName, setNewSeasonName] = useState("");
  const [newSeasonDate, setNewSeasonDate] = useState(new Date().toISOString().slice(0, 10));

  const [shareOpen, setShareOpen] = useState(false);
  const [qrData, setQrData] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);

  const inviteText = useMemo(() => {
    const playerNames = (players.data ?? []).map((p) => p.name).slice(0, 12).join(", ") || "—";
    const top = stats[0]?.player.name ?? "—";
    return [
      `⚽ Join our ${cfg.leagueName} league!`,
      `Season: ${currentSeason?.name ?? "—"}`,
      `Players: ${playerNames}`,
      `Leader: ${top}`,
      `App: GOLAÇO CUP`,
    ].join("\n");
  }, [cfg.leagueName, currentSeason, players.data, stats]);

  async function openShare() {
    setShareOpen(true);
    setCopied(false);
    try {
      const url = await QRCode.toDataURL(inviteText, { margin: 1, width: 280, color: { dark: "#000000", light: "#ffffff" } });
      setQrData(url);
    } catch {
      setQrData(null);
    }
  }

  async function copyInvite() {
    try {
      await navigator.clipboard.writeText(inviteText);
      setCopied(true);
      toast.success("Invite copied");
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Copy failed");
    }
  }

  async function shareInvite() {
    if (navigator.share) {
      try { await navigator.share({ title: cfg.leagueName, text: inviteText }); }
      catch { /* user cancelled */ }
    } else {
      copyInvite();
    }
  }

  function exportJSON() {
    const payload = {
      app: "GOLAÇO CUP",
      exported_at: new Date().toISOString(),
      league: cfg,
      players: players.data ?? [],
      teams: teams.data ?? [],
      matches: matches.data ?? [],
    };
    download(`golaco-backup-${dateStamp()}.json`, JSON.stringify(payload, null, 2), "application/json");
    toast.success("Backup downloaded");
  }

  async function importJSON(file: File) {
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (!data?.players || !data?.teams || !data?.matches) throw new Error("Invalid backup file");
      if (!confirm("Replace ALL current players, teams and matches with the backup?")) return;
      // Wipe
      await supabase.from("matches").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      await supabase.from("players").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      await supabase.from("teams").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      // Insert (chunked, ignore failures per row)
      if (data.teams.length) await supabase.from("teams").insert(data.teams);
      if (data.players.length) await supabase.from("players").insert(data.players);
      if (data.matches.length) await supabase.from("matches").insert(data.matches);
      if (data.league) localStorage.setItem("golaco.league.v1", JSON.stringify(data.league));
      qc.invalidateQueries({ queryKey: queryKeys.players });
      qc.invalidateQueries({ queryKey: queryKeys.teams });
      qc.invalidateQueries({ queryKey: queryKeys.matches });
      window.dispatchEvent(new CustomEvent("league-config-changed"));
      toast.success("Backup restored");
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  function exportRankingPDF() {
    const doc = new jsPDF();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text(cfg.leagueName, 14, 18);
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(`Season: ${currentSeason?.name ?? "—"}`, 14, 26);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 32);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    const header = ["#", "Player", "P", "W", "D", "L", "GF", "GA", "GD", "Pts"];
    const colsX = [14, 24, 90, 102, 114, 126, 138, 150, 162, 178];
    header.forEach((h, i) => doc.text(h, colsX[i], 44));
    doc.setLineWidth(0.3);
    doc.line(14, 46, 196, 46);

    doc.setFont("helvetica", "normal");
    stats.forEach((s, i) => {
      const y = 52 + i * 7;
      if (y > 280) return;
      const row = [
        String(i + 1),
        s.player.name.slice(0, 22),
        String(s.played),
        String(s.wins),
        String(s.draws),
        String(s.losses),
        String(s.goalsFor),
        String(s.goalsAgainst),
        String(s.goalDiff),
        String(s.points),
      ];
      row.forEach((c, j) => doc.text(c, colsX[j], y));
    });

    doc.save(`ranking-${dateStamp()}.pdf`);
    toast.success("Ranking PDF downloaded");
  }

  function exportStatsCSV() {
    const rows = [
      ["Player", "Played", "Wins", "Draws", "Losses", "GoalsFor", "GoalsAgainst", "GoalDiff", "WinRate", "Points"],
      ...stats.map((s) => [
        csv(s.player.name),
        s.played, s.wins, s.draws, s.losses,
        s.goalsFor, s.goalsAgainst, s.goalDiff,
        (s.winRate * 100).toFixed(1) + "%",
        s.points,
      ]),
    ];
    const csvBody = rows.map((r) => r.join(",")).join("\n");
    download(`stats-${dateStamp()}.csv`, csvBody, "text/csv");
    toast.success("CSV downloaded");
  }

  // Hall of champions: derived from archived seasons + match data
  const champions = useMemo(() => buildChampions(cfg.seasons, players.data ?? [], teams.data ?? [], matches.data ?? [], cfg.rules), [cfg.seasons, players.data, teams.data, matches.data, cfg.rules]);

  // Achievements per player (current season)
  const playerAchievements = useMemo(
    () =>
      (players.data ?? []).map((p) => ({
        player: p,
        items: computeAchievements(p, seasonMatches, players.data ?? []),
      })),
    [players.data, seasonMatches],
  );

  return (
    <AppLayout
      title="League"
      subtitle={cfg.leagueName}
      action={
        <span className={cn(
          "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider border",
          online ? "bg-green-500/10 text-green-400 border-green-500/30" : "bg-orange-500/10 text-orange-400 border-orange-500/30",
        )}>
          {online ? <Wifi className="size-3.5" /> : <WifiOff className="size-3.5" />}
          {online ? "Online" : "Offline"}
        </span>
      }
    >
      <div className="grid gap-4 max-w-3xl mx-auto w-full">

        {/* League identity */}
        <Card className="glass-card neon-border float-in">
          <CardContent className="p-5">
            <SectionHeader icon={<Trophy className="size-4" />} label="League" />
            <Label className="text-xs font-semibold mt-3 block">League name</Label>
            <div className="flex gap-2 mt-1.5">
              <Input value={leagueNameDraft} onChange={(e) => setLeagueNameDraft(e.target.value)} className="rounded-xl" />
              <Button className="rounded-xl tap" onClick={() => { setLeagueName(leagueNameDraft.trim() || "GOLAÇO CUP"); toast.success("✓"); }}>
                Save
              </Button>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              <Stat icon={<Sparkles className="size-3.5" />} label="Players" value={players.data?.length ?? 0} />
              <Stat icon={<Calendar className="size-3.5" />} label="Seasons" value={cfg.seasons.length} />
              <Stat icon={<Trophy className="size-3.5" />} label="Matches" value={seasonMatches.length} />
            </div>
          </CardContent>
        </Card>

        {/* Seasons */}
        <Card className="glass-card float-in">
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <SectionHeader icon={<Calendar className="size-4" />} label="Seasons" />
              <Button size="sm" onClick={() => setShowNewSeason(true)} className="rounded-xl tap gap-1.5">
                <Plus className="size-4" /> New
              </Button>
            </div>
            <div className="grid gap-2">
              {cfg.seasons.length === 0 && (
                <p className="text-xs text-muted-foreground">No seasons yet. Create one to start tracking.</p>
              )}
              {cfg.seasons.map((s) => {
                const active = s.id === cfg.currentSeasonId;
                return (
                  <div
                    key={s.id}
                    className={cn(
                      "rounded-2xl border p-3 transition-all",
                      active ? "border-primary bg-primary/10 neon-border" : "border-border bg-foreground/[0.02]",
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="font-semibold truncate flex items-center gap-2">
                          {s.name}
                          {s.archived && <Badge variant="outline" className="text-[10px] uppercase">Archived</Badge>}
                          {active && <Badge className="text-[10px] uppercase bg-primary text-primary-foreground">Current</Badge>}
                        </div>
                        <div className="text-[11px] text-muted-foreground mt-0.5">
                          {s.startDate} → {s.endDate ?? "ongoing"}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {!active && (
                          <Button size="icon" variant="ghost" className="size-8" onClick={() => setCurrentSeason(s.id)} title="Switch">
                            <Check className="size-4" />
                          </Button>
                        )}
                        {!s.archived && (
                          <Button size="icon" variant="ghost" className="size-8" onClick={() => archiveSeason(s.id)} title="Archive">
                            <Archive className="size-4" />
                          </Button>
                        )}
                        <Button
                          size="icon"
                          variant="ghost"
                          className="size-8 text-destructive"
                          onClick={() => { if (confirm(`Delete season "${s.name}"?`)) deleteSeason(s.id); }}
                          title="Delete"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </div>
                    {active && (
                      <div className="mt-2 grid grid-cols-2 gap-2">
                        <Input
                          type="date"
                          value={s.startDate}
                          onChange={(e) => updateSeason(s.id, { startDate: e.target.value })}
                          className="rounded-lg h-9 text-xs"
                        />
                        <Input
                          type="date"
                          value={s.endDate ?? ""}
                          onChange={(e) => updateSeason(s.id, { endDate: e.target.value || null })}
                          className="rounded-lg h-9 text-xs"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Rules */}
        <Card className="glass-card float-in">
          <CardContent className="p-5 space-y-4">
            <SectionHeader icon={<Cog className="size-4" />} label="League rules" />
            <div className="grid grid-cols-3 gap-2">
              <NumberField label="Win" value={cfg.rules.winPoints} onChange={(v) => setRules({ ...cfg.rules, winPoints: v })} />
              <NumberField label="Draw" value={cfg.rules.drawPoints} onChange={(v) => setRules({ ...cfg.rules, drawPoints: v })} />
              <NumberField label="Loss" value={cfg.rules.lossPoints} onChange={(v) => setRules({ ...cfg.rules, lossPoints: v })} />
            </div>
            <div className="space-y-2">
              <RuleToggle label="Goal difference tiebreaker" checked={cfg.rules.useGoalDiff} onChange={(v) => setRules({ ...cfg.rules, useGoalDiff: v })} />
              <RuleToggle label="Goals scored tiebreaker" checked={cfg.rules.useGoalsFor} onChange={(v) => setRules({ ...cfg.rules, useGoalsFor: v })} />
              <RuleToggle label="Win rate tiebreaker" checked={cfg.rules.useWinRate} onChange={(v) => setRules({ ...cfg.rules, useWinRate: v })} />
            </div>
            <Button variant="outline" className="w-full rounded-xl" onClick={() => setRules({ ...DEFAULT_RULES })}>
              Reset to default (3-1-0)
            </Button>
          </CardContent>
        </Card>

        {/* Share */}
        <Card className="glass-card float-in">
          <CardContent className="p-5 space-y-3">
            <SectionHeader icon={<Share2 className="size-4" />} label="Invite friends" />
            <p className="text-xs text-muted-foreground">No login required — share a link, text or QR code.</p>
            <div className="grid grid-cols-2 gap-2">
              <Button onClick={shareInvite} className="rounded-xl tap gap-2">
                <Share2 className="size-4" /> Share
              </Button>
              <Button onClick={openShare} variant="outline" className="rounded-xl tap gap-2">
                <QrCode className="size-4" /> QR code
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Backup */}
        <Card className="glass-card float-in">
          <CardContent className="p-5 space-y-3">
            <SectionHeader icon={<Download className="size-4" />} label="Backup & export" />
            <div className="grid grid-cols-2 gap-2">
              <Button onClick={exportJSON} variant="outline" className="rounded-xl tap gap-2">
                <Download className="size-4" /> JSON
              </Button>
              <Button onClick={() => fileRef.current?.click()} variant="outline" className="rounded-xl tap gap-2">
                <Upload className="size-4" /> Import
              </Button>
              <Button onClick={exportRankingPDF} variant="outline" className="rounded-xl tap gap-2">
                <FileText className="size-4" /> Ranking PDF
              </Button>
              <Button onClick={exportStatsCSV} variant="outline" className="rounded-xl tap gap-2">
                <FileSpreadsheet className="size-4" /> Stats CSV
              </Button>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) importJSON(f); e.target.value = ""; }}
            />
          </CardContent>
        </Card>

        {/* Hall of Champions */}
        <Card className="glass-card float-in">
          <CardContent className="p-5 space-y-3">
            <SectionHeader icon={<Crown className="size-4" />} label="Hall of Champions" />
            {champions.length === 0 ? (
              <p className="text-xs text-muted-foreground">Archive a season to enshrine its champions here.</p>
            ) : (
              <div className="grid gap-3">
                {champions.map((c) => (
                  <div key={c.seasonId} className="rounded-2xl border border-amber-400/30 bg-gradient-to-br from-amber-500/10 via-transparent to-amber-500/5 p-4">
                    <div className="flex items-center gap-2 text-amber-300 font-bold text-sm">
                      <Crown className="size-4" /> {c.seasonName}
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                      <ChampLine icon={<Trophy className="size-3.5 text-amber-300" />} label="Champion" value={c.champion} />
                      <ChampLine icon={<Award className="size-3.5 text-blue-300" />} label="Top scorer" value={c.topScorer} />
                      <ChampLine icon={<Medal className="size-3.5 text-emerald-300" />} label="Best defense" value={c.bestDefense} />
                      <ChampLine icon={<Sparkles className="size-3.5 text-pink-300" />} label="Most active" value={c.mostActive} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Achievements */}
        <Card className="glass-card float-in">
          <CardContent className="p-5 space-y-3">
            <SectionHeader icon={<Award className="size-4" />} label="Achievements" />
            {playerAchievements.length === 0 ? (
              <p className="text-xs text-muted-foreground">Add players to unlock badges.</p>
            ) : (
              <div className="grid gap-3">
                {playerAchievements.map(({ player, items }) => {
                  const earned = items.filter((i) => i.earned);
                  return (
                    <div key={player.id} className="rounded-2xl border border-border bg-foreground/[0.02] p-3">
                      <div className="flex items-center justify-between">
                        <div className="font-semibold text-sm truncate">{player.name}</div>
                        <Badge variant="outline" className="text-[10px]">{earned.length}/{items.length}</Badge>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {items.map((b) => (
                          <span
                            key={b.key}
                            title={`${b.label} — ${b.description}`}
                            className={cn(
                              "inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-semibold border transition-all",
                              b.earned
                                ? "border-primary/40 bg-primary/15 text-primary"
                                : "border-border bg-foreground/[0.02] text-muted-foreground opacity-50",
                            )}
                          >
                            <span>{b.icon}</span>
                            <span>{b.label}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* New season dialog */}
      <Dialog open={showNewSeason} onOpenChange={setShowNewSeason}>
        <DialogContent className="glass-card">
          <DialogHeader><DialogTitle>New season</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            <div>
              <Label className="text-xs">Name</Label>
              <Input value={newSeasonName} onChange={(e) => setNewSeasonName(e.target.value)} placeholder="Season 2" className="rounded-xl mt-1" />
            </div>
            <div>
              <Label className="text-xs">Start date</Label>
              <Input type="date" value={newSeasonDate} onChange={(e) => setNewSeasonDate(e.target.value)} className="rounded-xl mt-1" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowNewSeason(false)}>Cancel</Button>
            <Button
              onClick={() => {
                if (!newSeasonName.trim()) { toast.error("Name required"); return; }
                addSeason(newSeasonName.trim(), newSeasonDate);
                setShowNewSeason(false);
                setNewSeasonName("");
                toast.success("Season created");
              }}
            >Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Share dialog */}
      <Dialog open={shareOpen} onOpenChange={setShareOpen}>
        <DialogContent className="glass-card">
          <DialogHeader><DialogTitle>Share invite</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            {qrData && (
              <div className="mx-auto rounded-2xl bg-white p-3">
                <img src={qrData} alt="QR" width={240} height={240} />
              </div>
            )}
            <pre className="text-xs whitespace-pre-wrap rounded-xl bg-foreground/[0.04] p-3 border border-border">
{inviteText}
            </pre>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShareOpen(false)}>Close</Button>
            <Button onClick={copyInvite} className="gap-2">
              {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
              {copied ? "Copied" : "Copy"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}

function SectionHeader({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 text-primary">
      {icon}
      <h2 className="font-display font-bold text-[11px] uppercase tracking-[0.25em] text-foreground">{label}</h2>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: number | string }) {
  return (
    <div className="rounded-2xl border border-border bg-foreground/[0.02] py-2.5">
      <div className="flex items-center justify-center gap-1 text-muted-foreground text-[10px] uppercase tracking-wider">
        {icon} {label}
      </div>
      <div className="text-xl font-display font-black mt-0.5">{value}</div>
    </div>
  );
}

function NumberField({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div>
      <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</Label>
      <Input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
        className="rounded-xl mt-1 text-center font-bold"
      />
    </div>
  );
}

function RuleToggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-border bg-foreground/[0.02] px-3 py-2.5">
      <span className="text-sm font-medium">{label}</span>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

function ChampLine({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl bg-foreground/[0.04] border border-border p-2">
      <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-muted-foreground">
        {icon} {label}
      </div>
      <div className="text-sm font-semibold truncate mt-0.5">{value}</div>
    </div>
  );
}

function csv(v: string) {
  if (/[",\n]/.test(v)) return `"${v.replace(/"/g, '""')}"`;
  return v;
}

function dateStamp() {
  return new Date().toISOString().slice(0, 10);
}

function download(name: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function buildChampions(
  seasons: ReturnType<typeof useLeague>["cfg"]["seasons"],
  players: Player[],
  _teams: Team[],
  matches: Match[],
  rules: LeagueRules,
) {
  return seasons
    .filter((s) => s.archived)
    .map((s) => {
      const sm = matches.filter((m) => matchInSeason(m.played_at, s));
      const stats = computePlayerStats(players, sm, rules);
      const topScorer = [...stats].sort((a, b) => b.goalsFor - a.goalsFor)[0];
      const bestDef = [...stats].filter((x) => x.played > 0).sort((a, b) => a.goalsAgainst - b.goalsAgainst)[0];
      const mostActive = [...stats].sort((a, b) => b.played - a.played)[0];
      return {
        seasonId: s.id,
        seasonName: s.name,
        champion: stats[0]?.player.name ?? "—",
        topScorer: topScorer?.player.name ?? "—",
        bestDefense: bestDef?.player.name ?? "—",
        mostActive: mostActive?.player.name ?? "—",
      };
    });
}
