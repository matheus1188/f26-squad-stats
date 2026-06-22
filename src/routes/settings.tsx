import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  useI18n,
  LANGUAGES,
  ACCENTS,
  type Theme,
  type Lang,
  type Accent,
} from "@/lib/i18n";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState } from "react";
import {
  Moon,
  Sun,
  MonitorSmartphone,
  Trash2,
  Sparkles,
  Check,
  Download,
  Palette,
  Languages,
  Type,
  Database,
  Zap,
  Vibrate,
  Volume2,
  Music,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { fetchMatches, fetchPlayers, fetchTeams, queryKeys } from "@/lib/db";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Settings — GOLAÇO CUP" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const {
    t, lang, setLang, theme, setTheme, appName, setAppName, accent, setAccent,
    animations, setAnimations, haptics, setHaptics, sfx, setSfx, music, setMusic,
  } = useI18n();
  const [name, setName] = useState(appName);
  const [confirm, setConfirm] = useState(false);
  const qc = useQueryClient();
  const [resetting, setResetting] = useState(false);
  const [exporting, setExporting] = useState(false);

  const themes: { key: Theme; icon: typeof Sun; label: string }[] = [
    { key: "light", icon: Sun, label: t("settings.theme_light") },
    { key: "dark", icon: Moon, label: t("settings.theme_dark") },
    { key: "system", icon: MonitorSmartphone, label: t("settings.theme_system") },
  ];

  async function resetAll() {
    setResetting(true);
    try {
      await supabase.from("matches").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      await supabase.from("players").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      await supabase.from("teams").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      qc.invalidateQueries({ queryKey: queryKeys.matches });
      qc.invalidateQueries({ queryKey: queryKeys.players });
      qc.invalidateQueries({ queryKey: queryKeys.teams });
      toast.success(t("settings.reset_done"));
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setResetting(false);
      setConfirm(false);
    }
  }

  async function exportData() {
    setExporting(true);
    try {
      const [players, teams, matches] = await Promise.all([
        fetchPlayers(),
        fetchTeams(),
        fetchMatches(),
      ]);
      const payload = {
        app: "GOLAÇO CUP",
        exported_at: new Date().toISOString(),
        players,
        teams,
        matches,
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `golaco-cup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success(t("settings.exported"));
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setExporting(false);
    }
  }

  return (
    <AppLayout title={t("settings.title")} subtitle={t("settings.subtitle")}>
      <div className="grid gap-4 max-w-2xl mx-auto w-full">
        {/* Language */}
        <Card className="glass-card float-in">
          <CardContent className="p-5">
            <SectionHeader icon={<Languages className="size-4" />} label={t("settings.language")} />
            <div className="grid gap-2 mt-3">
              {LANGUAGES.map((l) => (
                <button
                  key={l.code}
                  onClick={() => setLang(l.code as Lang)}
                  className={cn(
                    "tap flex items-center gap-3 rounded-2xl border px-4 py-3 text-left transition-all",
                    lang === l.code
                      ? "border-primary bg-primary/10 neon-border"
                      : "border-border bg-foreground/[0.02] hover:bg-foreground/5"
                  )}
                >
                  <span className="text-2xl">{l.flag}</span>
                  <span className="flex-1 font-semibold">{l.label}</span>
                  {lang === l.code && <Check className="size-5 text-primary" />}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Theme */}
        <Card className="glass-card float-in">
          <CardContent className="p-5">
            <SectionHeader icon={<Sun className="size-4" />} label={t("settings.theme")} />
            <div className="grid grid-cols-3 gap-2 mt-3">
              {themes.map(({ key, icon: Icon, label }) => (
                <button
                  key={key}
                  onClick={() => setTheme(key)}
                  className={cn(
                    "tap flex flex-col items-center gap-2 rounded-2xl border py-4 transition-all",
                    theme === key
                      ? "border-primary bg-primary/10 text-primary neon-border"
                      : "border-border bg-foreground/[0.02]"
                  )}
                >
                  <Icon className="size-6" />
                  <span className="text-xs font-semibold">{label}</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Customization: app name + primary color */}
        <Card className="glass-card float-in">
          <CardContent className="p-5 space-y-5">
            <SectionHeader icon={<Sparkles className="size-4" />} label={t("settings.customization")} />

            <div>
              <Label htmlFor="appname" className="font-display font-bold text-sm flex items-center gap-2">
                <Type className="size-4 text-primary" /> {t("settings.app_name")}
              </Label>
              <p className="text-xs text-muted-foreground mt-1 mb-3">
                {t("settings.app_name_help")}
              </p>
              <div className="flex gap-2">
                <Input
                  id="appname"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="rounded-xl"
                />
                <Button
                  onClick={() => {
                    setAppName(name.trim() || "GOLAÇO CUP");
                    toast.success("✓");
                  }}
                  className="rounded-xl tap"
                >
                  {t("common.save")}
                </Button>
              </div>
            </div>

            <div>
              <Label className="font-display font-bold text-sm flex items-center gap-2">
                <Palette className="size-4 text-primary" /> {t("settings.primary_color")}
              </Label>
              <div className="grid grid-cols-4 gap-2 mt-3">
                {ACCENTS.map((a) => (
                  <button
                    key={a.key}
                    onClick={() => setAccent(a.key as Accent)}
                    className={cn(
                      "tap group flex flex-col items-center gap-2 rounded-2xl border py-3 transition-all",
                      accent === a.key
                        ? "border-primary bg-primary/10"
                        : "border-border bg-foreground/[0.02] hover:bg-foreground/5"
                    )}
                    aria-label={a.label}
                  >
                    <span
                      className="size-9 rounded-full ring-2 ring-white/20"
                      style={{
                        background: a.hex,
                        boxShadow: `0 0 18px rgba(${a.glow},0.6), 0 0 0 3px rgba(${a.glow},0.15)`,
                      }}
                    />
                    <span className="text-[10px] font-bold uppercase tracking-wider">
                      {t(`settings.color_${a.key}`)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data */}
        <Card className="glass-card float-in">
          <CardContent className="p-5 space-y-4">
            <SectionHeader icon={<Database className="size-4" />} label={t("settings.data")} />

            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="font-semibold text-sm">{t("settings.export")}</div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {t("settings.export_help")}
                </p>
              </div>
              <Button
                onClick={exportData}
                disabled={exporting}
                variant="outline"
                className="tap rounded-xl gap-2 shrink-0 border-primary/40 hover:bg-primary/10"
              >
                <Download className="size-4" />
                {exporting ? t("common.saving") : t("settings.export")}
              </Button>
            </div>

            <div className="border-t border-border pt-4 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="font-semibold text-sm text-destructive">{t("settings.reset")}</div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {t("settings.reset_help")}
                </p>
              </div>
              <Button
                variant="destructive"
                className="tap rounded-xl gap-2 shrink-0"
                onClick={() => setConfirm(true)}
              >
                <Trash2 className="size-4" /> {t("common.reset")}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card float-in">
          <CardContent className="p-5 flex items-center gap-3">
            <Sparkles className="size-5 text-primary" />
            <div>
              <div className="font-semibold text-sm">{t("settings.about")}</div>
              <div className="text-xs text-muted-foreground">{appName} · v2</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={confirm} onOpenChange={setConfirm}>
        <DialogContent className="glass-card border-destructive/40">
          <DialogHeader>
            <DialogTitle>{t("settings.reset_confirm_title")}</DialogTitle>
            <DialogDescription>{t("settings.reset_confirm_body")}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setConfirm(false)}>
              {t("common.cancel")}
            </Button>
            <Button variant="destructive" onClick={resetAll} disabled={resetting}>
              {resetting ? t("common.saving") : t("common.confirm")}
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
      <h2 className="font-display font-bold text-[11px] uppercase tracking-[0.25em] text-foreground">
        {label}
      </h2>
    </div>
  );
}
