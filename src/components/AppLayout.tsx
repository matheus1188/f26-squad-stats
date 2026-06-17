import { Link, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, Users, Shield, Swords, History, Trophy, BarChart3 } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/players", label: "Players", icon: Users },
  { to: "/teams", label: "Teams", icon: Shield },
  { to: "/matches/new", label: "New", icon: Swords, primary: true },
  { to: "/matches", label: "History", icon: History },
  { to: "/ranking", label: "Ranking", icon: Trophy },
  { to: "/stats", label: "Stats", icon: BarChart3 },
] as const;

export function AppLayout({ children, title, subtitle, action }: {
  children: ReactNode;
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="min-h-screen pb-28 md:pb-10 md:pl-64">
      {/* Sidebar (desktop) */}
      <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-64 flex-col glass-card rounded-none border-y-0 border-l-0 z-30">
        <div className="p-6">
          <div className="font-display text-xl font-black tracking-widest neon-text">F26</div>
          <div className="text-xs uppercase tracking-[0.3em] text-muted-foreground mt-1">Match Tracker</div>
        </div>
        <nav className="flex-1 px-3 space-y-1">
          {nav.map((item) => {
            const active = item.exact ? pathname === item.to : pathname === item.to || pathname.startsWith(item.to + "/");
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                  active
                    ? "bg-primary/15 text-primary neon-border"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/5",
                )}
              >
                <Icon className="size-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="p-4 text-[10px] uppercase tracking-widest text-muted-foreground">
          Friendly Matches · v1
        </div>
      </aside>

      {/* Header */}
      <header className="sticky top-0 z-20 px-4 pt-4 md:px-8 md:pt-8">
        <div className="glass-card rounded-2xl px-4 py-3 md:px-6 md:py-5 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
          <div className="min-w-0">
            <div className="md:hidden text-[10px] uppercase tracking-[0.3em] text-primary font-display">F26 Tracker</div>
            <h1 className="truncate text-lg md:text-2xl font-display font-black">{title}</h1>
            {subtitle && <p className="truncate text-xs md:text-sm text-muted-foreground mt-0.5">{subtitle}</p>}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      </header>

      <main className="px-4 md:px-8 py-5 md:py-6">{children}</main>

      {/* Bottom nav (mobile) */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 px-3 pb-3 pt-2 pointer-events-none">
        <div className="glass-card rounded-2xl px-2 py-2 grid grid-cols-7 gap-1 pointer-events-auto">
          {nav.map((item) => {
            const active = item.exact ? pathname === item.to : pathname === item.to || pathname.startsWith(item.to + "/");
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 py-1.5 rounded-xl text-[10px] font-medium transition-all",
                  item.primary && "bg-primary text-primary-foreground pulse-glow",
                  !item.primary && active && "text-primary",
                  !item.primary && !active && "text-muted-foreground",
                )}
              >
                <Icon className={cn("size-5", item.primary && "size-5")} />
                <span className="truncate max-w-full">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
