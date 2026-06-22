import { useEffect, useState } from "react";
import { TrophyHero } from "@/components/TrophyHero";
import { useI18n } from "@/lib/i18n";

/**
 * Premium splash screen. Shows once per tab session.
 * Fades out after ~1.4s.
 */
export function Splash() {
  const { appName, t } = useI18n();
  const [show, setShow] = useState(() => {
    if (typeof window === "undefined") return false;
    return !window.sessionStorage.getItem("golaco.splash.seen");
  });
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (!show) return;
    const a = setTimeout(() => setLeaving(true), 1300);
    const b = setTimeout(() => {
      setShow(false);
      try { window.sessionStorage.setItem("golaco.splash.seen", "1"); } catch { /* ignore */ }
    }, 1750);
    return () => { clearTimeout(a); clearTimeout(b); };
  }, [show]);

  if (!show) return null;

  return (
    <div
      className={`splash-root ${leaving ? "splash-leaving" : ""}`}
      aria-hidden={leaving}
    >
      <div className="splash-glow splash-glow-a" />
      <div className="splash-glow splash-glow-b" />
      <div className="relative flex flex-col items-center gap-6 px-6 text-center">
        <TrophyHero size={200} />
        <div>
          <div className="font-display font-black text-3xl md:text-5xl tracking-tight brand-cup">
            {appName}
          </div>
          <div className="mt-2 text-[11px] md:text-xs font-bold uppercase tracking-[0.4em] text-white/70">
            {t("splash.tagline")}
          </div>
        </div>
        <div className="splash-bar" aria-label={t("splash.loading")}>
          <span />
        </div>
      </div>
    </div>
  );
}
