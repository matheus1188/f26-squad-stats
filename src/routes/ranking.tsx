import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppLayout } from "@/components/AppLayout";
import { fetchMatches, fetchPlayers, queryKeys } from "@/lib/db";
import { computePlayerStats } from "@/lib/stats";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trophy } from "lucide-react";

export const Route = createFileRoute("/ranking")({
  head: () => ({ meta: [{ title: "Ranking — F26 Tracker" }] }),
  component: RankingPage,
});

function RankingPage() {
  const players = useQuery({ queryKey: queryKeys.players, queryFn: fetchPlayers });
  const matches = useQuery({ queryKey: queryKeys.matches, queryFn: fetchMatches });
  const stats = computePlayerStats(players.data ?? [], matches.data ?? []);

  return (
    <AppLayout title="Ranking" subtitle="Win = 3 pts · Draw = 1 pt · Loss = 0">
      {stats.length === 0 ? (
        <Card className="glass-card">
          <CardContent className="py-12 text-center text-muted-foreground">
            <Trophy className="size-10 mx-auto mb-3 opacity-50" />
            Add players and matches to see the leaderboard.
          </CardContent>
        </Card>
      ) : (
        <Card className="glass-card overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-10">#</TableHead>
                    <TableHead>Player</TableHead>
                    <TableHead className="text-right">P</TableHead>
                    <TableHead className="text-right">W</TableHead>
                    <TableHead className="text-right">D</TableHead>
                    <TableHead className="text-right">L</TableHead>
                    <TableHead className="text-right">GF</TableHead>
                    <TableHead className="text-right">GA</TableHead>
                    <TableHead className="text-right">GD</TableHead>
                    <TableHead className="text-right">Win%</TableHead>
                    <TableHead className="text-right pr-4">PTS</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.map((s, i) => (
                    <TableRow key={s.player.id} className={i === 0 ? "bg-primary/5" : ""}>
                      <TableCell className="font-display font-black">
                        {i === 0 ? <span className="neon-text">1</span> : i + 1}
                      </TableCell>
                      <TableCell className="font-semibold truncate max-w-[140px]">
                        {i === 0 && <Trophy className="inline size-4 text-[color:var(--draw)] mr-1.5 -mt-0.5" />}
                        {s.player.name}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">{s.played}</TableCell>
                      <TableCell className="text-right text-[color:var(--win)]">{s.wins}</TableCell>
                      <TableCell className="text-right text-[color:var(--draw)]">{s.draws}</TableCell>
                      <TableCell className="text-right text-[color:var(--loss)]">{s.losses}</TableCell>
                      <TableCell className="text-right text-muted-foreground">{s.goalsFor}</TableCell>
                      <TableCell className="text-right text-muted-foreground">{s.goalsAgainst}</TableCell>
                      <TableCell className="text-right font-semibold">{s.goalDiff >= 0 ? "+" : ""}{s.goalDiff}</TableCell>
                      <TableCell className="text-right text-muted-foreground">{Math.round(s.winRate * 100)}%</TableCell>
                      <TableCell className="text-right pr-4 font-display font-black text-lg neon-text">{s.points}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </AppLayout>
  );
}
