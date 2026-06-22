import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Users, Shield, Trophy, BarChart3, Settings, Plus, History, MoreHorizontal } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import { BrandLogo } from "@/components/BrandLogo";

export function AppLayout({ children, title, subtitle, action }: {
  children: ReactNode;
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { t, appName } = useI18n();

  const nav = [
    { to: "/", label: t("nav.dashboard"), icon: Home, exact: true },
    { to: "/players", label: t("nav.players"), icon: Users },
    { to: "/teams", label: t("nav.teams"), icon: Shield },
    { to: "/matches", label: t("nav.matches"), icon: History },
    { to: "/ranking", label: t("nav.ranking"), icon: Trophy },
    { to: "/stats", label: t("nav.stats"), icon: BarChart3 },
    { to: "/settings", label: t("nav.settings"), icon: Settings },
  ];

  const mobileNav = [
    { to: "/", label: t("nav.dashboard"), icon: Home, exact: true },
    { to: "/matches", label: t("nav.matches"), icon: History },
    { to: "/matches/new", label: t("nav.new"), icon: Plus, fab: true },
    { to: "/teams", label: t("nav.teams"), icon: Shield },
    { to: "/ranking", label: t("nav.ranking"), icon: Trophy },
    { to: "/stats", label: t("nav.stats"), icon: BarChart3 },
    { to: "/settings", label: "More", icon: MoreHorizontal },
  ];

  return (
    <div className="min-h-screen pb-32 md:pb-10 md:pl-64">
      {/* Sidebar (desktop) */}
      <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-64 flex-col glass-card rounded-none border-y-0 border-l-0 z-30">
        <div className="p-6 border-b border-white/5">
          <BrandLogo size="sm" />
        </div>
        <nav className="flex-1 px-3 space-y-1">
          {nav.map((item) => {
            const active = item.exact ? pathname === item.to : pathname === item.to || pathname.startsWith(item.to + "/");
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to as never}
                className={cn(
                  "tap flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold transition-all",
                  active
                    ? "bg-primary/12 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-foreground/5",
                )}
              >
                <Icon className="size-5 shrink-0" />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="p-4 text-[10px] uppercase tracking-widest text-muted-foreground">
          {t("app.tagline")} · v2
        </div>
      </aside>

      {/* Header */}
      <header className="sticky top-0 z-20 px-4 pt-4 md:px-8 md:pt-8">
        <div className="glass-card rounded-3xl px-4 py-3 md:px-6 md:py-4 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 float-in">
          <div className="min-w-0">
            <div className="md:hidden text-[10px] uppercase tracking-[0.25em] text-primary font-semibold">{appName}</div>
            <h1 className="truncate text-xl md:text-3xl font-display font-black tracking-tight">{title}</h1>
            {subtitle && <p className="truncate text-xs md:text-sm text-muted-foreground mt-0.5">{subtitle}</p>}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      </header>

      <main key={pathname} className="px-4 md:px-8 py-5 md:py-6 float-in">{children}</main>

      {/* iOS-style bottom nav (mobile) */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 px-3 pb-[max(env(safe-area-inset-bottom),0.75rem)] pt-2 pointer-events-none">
        <div className="glass-card rounded-[28px] px-2 py-2 grid grid-cols-5 gap-1 pointer-events-auto">
          {mobileNav.map((item) => {
            const active = item.exact ? pathname === item.to : pathname === item.to || pathname.startsWith(item.to + "/");
            const Icon = item.icon;
            if (item.fab) {
              return (
                <Link
                  key={item.to}
                  to={item.to as never}
                  className="tap flex items-center justify-center -mt-6"
                  aria-label={item.label}
                >
                  <span className="grid place-items-center size-14 rounded-full bg-primary text-primary-foreground shadow-xl shadow-primary/40 pulse-glow">
                    <Icon className="size-7" />
                  </span>
                </Link>
              );
            }
            return (
              <Link
                key={item.to}
                to={item.to as never}
                className={cn(
                  "tap flex flex-col items-center justify-center gap-1 py-2 rounded-2xl text-[10px] font-semibold transition-all",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                <Icon className="size-5" />
                <span className="truncate max-w-full">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
