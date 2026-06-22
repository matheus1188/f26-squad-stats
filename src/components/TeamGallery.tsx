import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Input } from "@/components/ui/input";
import { TeamCrest } from "@/components/TeamCrest";
import { Search, X, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n";
import type { Team } from "@/lib/db";

export function TeamGalleryButton({
  teams,
  value,
  onChange,
  accent = "primary",
}: {
  teams: Team[];
  value: string;
  onChange: (id: string) => void;
  accent?: "primary" | "accent";
}) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const selected = teams.find((x) => x.id === value);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "tap w-full rounded-2xl border bg-foreground/[0.03] px-3 py-2 text-left text-sm font-semibold flex items-center gap-2 min-w-0 transition-all",
          selected
            ? accent === "primary"
              ? "border-primary/50 shadow-[0_0_18px_-6px_var(--primary)]"
              : "border-[color:var(--accent)]/50 shadow-[0_0_18px_-6px_var(--accent)]"
            : "border-border/60"
        )}
      >
        {selected ? (
          <>
            <TeamCrest team={selected} size={28} />
            <span className="truncate flex-1">{selected.name}</span>
          </>
        ) : (
          <span className="text-muted-foreground flex-1 py-1">{t("match.select_team")}</span>
        )}
      </button>

      <TeamGalleryModal
        open={open}
        onOpenChange={setOpen}
        teams={teams}
        selectedId={value}
        onPick={(id) => {
          onChange(id);
          setOpen(false);
        }}
      />
    </>
  );
}

export function TeamGalleryModal({
  open,
  onOpenChange,
  teams,
  selectedId,
  onPick,
}: {
  open: boolean;
  onOpenChange: (b: boolean) => void;
  teams: Team[];
  selectedId?: string;
  onPick: (id: string) => void;
}) {
  const t = useT();
  const [q, setQ] = useState("");
  const [country, setCountry] = useState<string>("");

  const countries = useMemo(() => {
    const set = new Set(teams.map((x) => x.country).filter(Boolean));
    return Array.from(set).sort();
  }, [teams]);

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    return teams.filter((tm) => {
      if (country && tm.country !== country) return false;
      if (!qq) return true;
      return (
        tm.name.toLowerCase().includes(qq) ||
        tm.country.toLowerCase().includes(qq)
      );
    });
  }, [teams, q, country]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="p-0 gap-0 max-w-full sm:max-w-2xl w-screen h-[100dvh] sm:h-[88vh] sm:rounded-3xl rounded-none overflow-hidden border-primary/20 flex flex-col [&>button.absolute]:hidden"
      >
        <VisuallyHidden><DialogTitle>{t("teams.title")}</DialogTitle></VisuallyHidden>
        {/* Header */}
        <div className="px-4 pt-[max(env(safe-area-inset-top),1rem)] pb-3 border-b border-border/60 bg-gradient-to-b from-background/95 to-background/80 backdrop-blur-xl">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="tap size-10 rounded-full grid place-items-center hover:bg-foreground/5"
              aria-label="Close"
            >
              <ChevronLeft className="size-5" />
            </button>
            <div className="flex-1 font-display font-black text-lg tracking-wide">
              {t("teams.title")}
            </div>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="tap size-10 rounded-full grid place-items-center hover:bg-foreground/5"
              aria-label="Close"
            >
              <X className="size-5" />
            </button>
          </div>

          <div className="relative mt-3">
            <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t("teams.search_placeholder")}
              className="pl-9 h-12 rounded-2xl bg-foreground/[0.04] border-border/60"
            />
          </div>

          {countries.length > 1 && (
            <div className="mt-3 flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
              <CountryChip active={country === ""} onClick={() => setCountry("")}>
                {t("common.all")}
              </CountryChip>
              {countries.map((c) => (
                <CountryChip key={c} active={country === c} onClick={() => setCountry(c)}>
                  {c}
                </CountryChip>
              ))}
            </div>
          )}
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto px-3 py-4">
          {filtered.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground text-sm">
              {t("teams.empty")}
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              {filtered.map((tm, i) => {
                const isSel = tm.id === selectedId;
                return (
                  <button
                    key={tm.id}
                    type="button"
                    onClick={() => onPick(tm.id)}
                    className={cn(
                      "tap glass-card rounded-2xl p-3 flex flex-col items-center gap-2 transition-all float-in",
                      "active:scale-[0.96]",
                      isSel
                        ? "ring-2 ring-primary shadow-[0_0_24px_-4px_var(--primary)]"
                        : "hover:ring-1 hover:ring-primary/40"
                    )}
                    style={{ animationDelay: `${Math.min(i, 20) * 18}ms` }}
                  >
                    <TeamCrest team={tm} size={56} />
                    <div className="min-w-0 w-full text-center">
                      <div className="truncate font-bold text-[12px] leading-tight">
                        {tm.name}
                      </div>
                      <div className="truncate text-[9px] uppercase tracking-widest text-muted-foreground mt-0.5">
                        {tm.country}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CountryChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "tap shrink-0 px-3 h-8 rounded-full text-[11px] font-bold uppercase tracking-wider border transition-all",
        active
          ? "bg-primary text-primary-foreground border-primary shadow-[0_0_14px_-4px_var(--primary)]"
          : "bg-foreground/[0.04] border-border/60 text-muted-foreground hover:text-foreground"
      )}
    >
      {children}
    </button>
  );
}
