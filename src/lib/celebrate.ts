import confetti from "canvas-confetti";

export function celebrate() {
  if (typeof window === "undefined") return;
  const end = Date.now() + 700;
  const colors = ["#60a5fa", "#a78bfa", "#34d399", "#fbbf24", "#f472b6"];
  (function frame() {
    confetti({
      particleCount: 5,
      angle: 60,
      spread: 60,
      origin: { x: 0, y: 0.8 },
      colors,
      scalar: 0.9,
    });
    confetti({
      particleCount: 5,
      angle: 120,
      spread: 60,
      origin: { x: 1, y: 0.8 },
      colors,
      scalar: 0.9,
    });
    if (Date.now() < end) requestAnimationFrame(frame);
  })();
  confetti({
    particleCount: 80,
    spread: 100,
    origin: { y: 0.6 },
    colors,
  });
}
