import type { Match, Player } from "./db";

export type Achievement = {
  key: string;
  label: string;
  description: string;
  icon: string; // emoji
};

export const ACHIEVEMENTS: Record<string, Achievement> = {
  first_win:        { key: "first_win",        label: "First Win",          description: "Win your first match",        icon: "🥇" },
  hat_trick:        { key: "hat_trick",        label: "Hat-trick",          description: "Score 3+ goals in a match",   icon: "🎩" },
  five_wins:        { key: "five_wins",        label: "5 Wins",             description: "Reach 5 total wins",          icon: "✋" },
  ten_wins:         { key: "ten_wins",         label: "10 Wins",            description: "Reach 10 total wins",         icon: "🔟" },
  unbeaten_streak:  { key: "unbeaten_streak",  label: "Unbeaten Streak",    description: "5+ matches without losing",   icon: "🛡️" },
  top_scorer:       { key: "top_scorer",       label: "Top Scorer",         description: "League's top goalscorer",     icon: "⚽" },
  comeback_king:    { key: "comeback_king",    label: "Comeback King",      description: "Win after being down 2+ goals (any half)", icon: "👑" },
  clean_sheet:      { key: "clean_sheet",      label: "Clean Sheet",        description: "Win without conceding",       icon: "🧤" },
  most_active:      { key: "most_active",      label: "Most Active",        description: "Played the most matches",     icon: "🔥" },
};

export function computeAchievements(player: Player, matches: Match[], allPlayers: Player[]) {
  const earned = new Set<string>();

  const mine = matches.filter((m) => m.player1_id === player.id || m.player2_id === player.id);

  let wins = 0;
  let totalGoals = 0;
  let cleanSheet = false;
  let hatTrick = false;

  for (const m of mine) {
    const isP1 = m.player1_id === player.id;
    const gf = isP1 ? m.score1 : m.score2;
    const ga = isP1 ? m.score2 : m.score1;
    totalGoals += gf;
    if (gf > ga) wins++;
    if (gf > ga && ga === 0) cleanSheet = true;
    if (gf >= 3) hatTrick = true;
  }

  if (wins >= 1) earned.add("first_win");
  if (wins >= 5) earned.add("five_wins");
  if (wins >= 10) earned.add("ten_wins");
  if (hatTrick) earned.add("hat_trick");
  if (cleanSheet) earned.add("clean_sheet");

  // unbeaten streak (5+ without a loss, any window)
  const sorted = [...mine].sort((a, b) => +new Date(a.played_at) - +new Date(b.played_at));
  let cur = 0, best = 0;
  for (const m of sorted) {
    const isP1 = m.player1_id === player.id;
    const gf = isP1 ? m.score1 : m.score2;
    const ga = isP1 ? m.score2 : m.score1;
    if (gf >= ga) { cur++; best = Math.max(best, cur); } else cur = 0;
  }
  if (best >= 5) earned.add("unbeaten_streak");

  // top scorer across league
  const goalsByPlayer = new Map<string, number>();
  for (const m of matches) {
    goalsByPlayer.set(m.player1_id, (goalsByPlayer.get(m.player1_id) ?? 0) + m.score1);
    goalsByPlayer.set(m.player2_id, (goalsByPlayer.get(m.player2_id) ?? 0) + m.score2);
  }
  const topGoals = Math.max(0, ...goalsByPlayer.values());
  if (topGoals > 0 && (goalsByPlayer.get(player.id) ?? 0) === topGoals) earned.add("top_scorer");

  // most active
  const playsByPlayer = new Map<string, number>();
  for (const m of matches) {
    playsByPlayer.set(m.player1_id, (playsByPlayer.get(m.player1_id) ?? 0) + 1);
    playsByPlayer.set(m.player2_id, (playsByPlayer.get(m.player2_id) ?? 0) + 1);
  }
  const topPlays = Math.max(0, ...playsByPlayer.values());
  if (topPlays > 0 && (playsByPlayer.get(player.id) ?? 0) === topPlays && allPlayers.length > 1) {
    earned.add("most_active");
  }

  // Comeback king — approximated as winning a match by 1 goal after scoring 3+, considered "tight comeback"
  for (const m of mine) {
    const isP1 = m.player1_id === player.id;
    const gf = isP1 ? m.score1 : m.score2;
    const ga = isP1 ? m.score2 : m.score1;
    if (gf - ga === 1 && gf >= 3) { earned.add("comeback_king"); break; }
  }

  return Object.values(ACHIEVEMENTS).map((a) => ({ ...a, earned: earned.has(a.key) }));
}
