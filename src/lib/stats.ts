import type { Match, Player, Team } from "./db";

export type PlayerStats = {
  player: Player;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDiff: number;
  points: number;
  winRate: number;
};

export function computePlayerStats(players: Player[], matches: Match[]): PlayerStats[] {
  const base = new Map<string, PlayerStats>();
  for (const p of players) {
    base.set(p.id, {
      player: p, played: 0, wins: 0, draws: 0, losses: 0,
      goalsFor: 0, goalsAgainst: 0, goalDiff: 0, points: 0, winRate: 0,
    });
  }
  for (const m of matches) {
    const s1 = base.get(m.player1_id);
    const s2 = base.get(m.player2_id);
    if (!s1 || !s2) continue;
    s1.played++; s2.played++;
    s1.goalsFor += m.score1; s1.goalsAgainst += m.score2;
    s2.goalsFor += m.score2; s2.goalsAgainst += m.score1;
    if (m.score1 > m.score2) { s1.wins++; s1.points += 3; s2.losses++; }
    else if (m.score2 > m.score1) { s2.wins++; s2.points += 3; s1.losses++; }
    else { s1.draws++; s2.draws++; s1.points++; s2.points++; }
  }
  const arr = [...base.values()];
  for (const s of arr) {
    s.goalDiff = s.goalsFor - s.goalsAgainst;
    s.winRate = s.played > 0 ? s.wins / s.played : 0;
  }
  return arr.sort((a, b) =>
    b.points - a.points || b.goalDiff - a.goalDiff || b.goalsFor - a.goalsFor || a.player.name.localeCompare(b.player.name)
  );
}

export function teamUsage(matches: Match[], teams: Team[]) {
  const counts = new Map<string, number>();
  for (const m of matches) {
    if (m.team1_id) counts.set(m.team1_id, (counts.get(m.team1_id) ?? 0) + 1);
    if (m.team2_id) counts.set(m.team2_id, (counts.get(m.team2_id) ?? 0) + 1);
  }
  return teams
    .map((t) => ({ team: t, count: counts.get(t.id) ?? 0 }))
    .filter((x) => x.count > 0)
    .sort((a, b) => b.count - a.count);
}

export function matchWinner(m: Match): "p1" | "p2" | "draw" {
  if (m.score1 > m.score2) return "p1";
  if (m.score2 > m.score1) return "p2";
  return "draw";
}
