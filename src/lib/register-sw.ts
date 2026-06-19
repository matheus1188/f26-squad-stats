// Guarded service worker registration.
// Registers only in published production builds and never inside Lovable preview/dev/iframe contexts.

export function registerServiceWorker(): void {
  if (typeof window === "undefined") return;
  if (!("serviceWorker" in navigator)) return;

  const url = new URL(window.location.href);
  const host = window.location.hostname;
  const inIframe = window.self !== window.top;

  const isLovablePreview =
    host.startsWith("id-preview--") ||
    host.startsWith("preview--") ||
    host === "lovableproject.com" ||
    host.endsWith(".lovableproject.com") ||
    host === "lovableproject-dev.com" ||
    host.endsWith(".lovableproject-dev.com") ||
    host === "beta.lovable.dev" ||
    host.endsWith(".beta.lovable.dev");

  const killSwitch = url.searchParams.get("sw") === "off";
  const refuse = !import.meta.env.PROD || inIframe || isLovablePreview || killSwitch;

  if (refuse) {
    // Unregister any stale SW that matches our scope so preview/dev stays clean.
    navigator.serviceWorker.getRegistrations().then((regs) => {
      regs.forEach((reg) => {
        const swUrl = reg.active?.scriptURL ?? reg.installing?.scriptURL ?? reg.waiting?.scriptURL ?? "";
        if (swUrl.endsWith("/sw.js")) {
          reg.unregister().catch(() => {});
        }
      });
    }).catch(() => {});
    return;
  }

  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch((err) => {
      console.warn("SW registration failed", err);
    });
  });
}
