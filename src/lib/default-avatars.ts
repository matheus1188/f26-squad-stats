// Preset avatars for players — DiceBear avataaars (no API key, SVG)
const SEEDS = [
  "Goleador", "Capitão", "Camisa10", "Maestro", "Artilheiro",
  "Defensor", "Ponta", "Volante", "Lateral", "Reserva",
  "Craque", "Veterano",
];

export const DEFAULT_AVATARS: string[] = SEEDS.map(
  (s) => `https://api.dicebear.com/9.x/adventurer/svg?seed=${encodeURIComponent(s)}&backgroundType=gradientLinear`
);
