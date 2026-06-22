import { supabase } from "@/integrations/supabase/client";

export type Player = {
  id: string;
  name: string;
  avatar_url: string | null;
  favorite_team_id: string | null;
  notes: string | null;
  created_at: string;
};

export type Team = {
  id: string;
  name: string;
  country: string;
  crest_url: string;
  created_at: string;
};

export type Match = {
  id: string;
  played_at: string;
  player1_id: string;
  player2_id: string;
  team1_id: string | null;
  team2_id: string | null;
  score1: number;
  score2: number;
  notes: string | null;
  created_at: string;
};

export async function fetchPlayers(): Promise<Player[]> {
  const { data, error } = await supabase.from("players").select("*").order("name");
  if (error) throw error;
  return data as Player[];
}

export async function fetchTeams(): Promise<Team[]> {
  const { data, error } = await supabase.from("teams").select("*").order("name");
  if (error) throw error;
  return data as Team[];
}

export async function fetchMatches(): Promise<Match[]> {
  const { data, error } = await supabase
    .from("matches")
    .select("*")
    .order("played_at", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data as Match[];
}

export const queryKeys = {
  players: ["players"] as const,
  teams: ["teams"] as const,
  matches: ["matches"] as const,
};
