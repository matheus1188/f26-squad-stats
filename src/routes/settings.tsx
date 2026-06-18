import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useI18n, LANGUAGES, type Theme, type Lang } from "@/lib/i18n";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useState } from "react";
import { Moon, Sun, MonitorSmartphone, Trash2, Sparkles, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/db";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Settings — F26 Arena" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const { t, lang, setLang, theme, setTheme, appName, setAppName } = useI18n();
  const [name, setName] = useState(appName);
  const [confirm, setConfirm] = useState(false);
  const qc = useQueryClient();
  const [resetting, setResetting] = useState(false);

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

  return (
    <AppLayout title={t("settings.title")} subtitle={t("settings.subtitle")}>
      <div className="grid gap-4 max-w-2xl mx-auto w-full">
        {/* Language */}
        <Card className="glass-card">
          <CardContent className="p-5">
            <h2 className="font-display font-bold text-base mb-3">{t("settings.language")}</h2>
            <div className="grid gap-2">
              {LANGUAGES.map((l) => (
                <button
                  key={l.code}
                  onClick={() => setLang(l.code as Lang)}
                  className={cn(
                    "tap flex items-center gap-3 rounded-2xl border px-4 py-3 text-left transition-all",
                    lang === l.code ? "border-primary bg-primary/10" : "border-border bg-foreground/[0.02] hover:bg-foreground/5"
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
        <Card className="glass-card">
          <CardContent className="p-5">
            <h2 className="font-display font-bold text-base mb-3">{t("settings.theme")}</h2>
            <div className="grid grid-cols-3 gap-2">
              {themes.map(({ key, icon: Icon, label }) => (
                <button
                  key={key}
                  onClick={() => setTheme(key)}
                  className={cn(
                    "tap flex flex-col items-center gap-2 rounded-2xl border py-4 transition-all",
                    theme === key ? "border-primary bg-primary/10 text-primary" : "border-border bg-foreground/[0.02]"
                  )}
                >
                  <Icon className="size-6" />
                  <span className="text-xs font-semibold">{label}</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* App name */}
        <Card className="glass-card">
          <CardContent className="p-5">
            <Label htmlFor="appname" className="font-display font-bold text-base">{t("settings.app_name")}</Label>
            <p className="text-xs text-muted-foreground mt-1 mb-3">{t("settings.app_name_help")}</p>
            <div className="flex gap-2">
              <Input id="appname" value={name} onChange={(e) => setName(e.target.value)} className="rounded-xl" />
              <Button
                onClick={() => { setAppName(name.trim() || "F26 Arena"); toast.success("✓"); }}
                className="rounded-xl tap"
              >
                {t("common.save")}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Reset data */}
        <Card className="glass-card border-destructive/30">
          <CardContent className="p-5">
            <h2 className="font-display font-bold text-base text-destructive">{t("settings.reset")}</h2>
            <p className="text-xs text-muted-foreground mt-1 mb-3">{t("settings.reset_help")}</p>
            <Button variant="destructive" className="tap rounded-xl gap-2" onClick={() => setConfirm(true)}>
              <Trash2 className="size-4" /> {t("settings.reset")}
            </Button>
          </CardContent>
        </Card>

        <Card className="glass-card">
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("settings.reset_confirm_title")}</DialogTitle>
            <DialogDescription>{t("settings.reset_confirm_body")}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setConfirm(false)}>{t("common.cancel")}</Button>
            <Button variant="destructive" onClick={resetAll} disabled={resetting}>
              {resetting ? t("common.saving") : t("common.confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
