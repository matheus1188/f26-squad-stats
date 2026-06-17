
CREATE TABLE public.players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.players TO anon, authenticated;
GRANT ALL ON public.players TO service_role;
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read players" ON public.players FOR SELECT USING (true);
CREATE POLICY "Public insert players" ON public.players FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update players" ON public.players FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Public delete players" ON public.players FOR DELETE USING (true);

CREATE TABLE public.teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  country text NOT NULL,
  crest_url text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.teams TO anon, authenticated;
GRANT ALL ON public.teams TO service_role;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read teams" ON public.teams FOR SELECT USING (true);
CREATE POLICY "Public insert teams" ON public.teams FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update teams" ON public.teams FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Public delete teams" ON public.teams FOR DELETE USING (true);

CREATE TABLE public.matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  played_at date NOT NULL DEFAULT current_date,
  player1_id uuid NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  player2_id uuid NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  team1_id uuid REFERENCES public.teams(id) ON DELETE SET NULL,
  team2_id uuid REFERENCES public.teams(id) ON DELETE SET NULL,
  score1 int NOT NULL CHECK (score1 >= 0),
  score2 int NOT NULL CHECK (score2 >= 0),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.matches TO anon, authenticated;
GRANT ALL ON public.matches TO service_role;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read matches" ON public.matches FOR SELECT USING (true);
CREATE POLICY "Public insert matches" ON public.matches FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update matches" ON public.matches FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Public delete matches" ON public.matches FOR DELETE USING (true);

CREATE INDEX ON public.matches(played_at DESC);
CREATE INDEX ON public.matches(player1_id);
CREATE INDEX ON public.matches(player2_id);

-- Seed popular teams
INSERT INTO public.teams (name, country, crest_url) VALUES
('Argentina', 'Argentina', 'https://flagcdn.com/w160/ar.png'),
('Brazil', 'Brazil', 'https://flagcdn.com/w160/br.png'),
('France', 'France', 'https://flagcdn.com/w160/fr.png'),
('Germany', 'Germany', 'https://flagcdn.com/w160/de.png'),
('Spain', 'Spain', 'https://flagcdn.com/w160/es.png'),
('Portugal', 'Portugal', 'https://flagcdn.com/w160/pt.png'),
('England', 'England', 'https://flagcdn.com/w160/gb-eng.png'),
('Italy', 'Italy', 'https://flagcdn.com/w160/it.png'),
('Netherlands', 'Netherlands', 'https://flagcdn.com/w160/nl.png'),
('Belgium', 'Belgium', 'https://flagcdn.com/w160/be.png'),
('Croatia', 'Croatia', 'https://flagcdn.com/w160/hr.png'),
('Uruguay', 'Uruguay', 'https://flagcdn.com/w160/uy.png'),
('Mexico', 'Mexico', 'https://flagcdn.com/w160/mx.png'),
('USA', 'United States', 'https://flagcdn.com/w160/us.png'),
('Japan', 'Japan', 'https://flagcdn.com/w160/jp.png'),
('Morocco', 'Morocco', 'https://flagcdn.com/w160/ma.png'),
('Real Madrid', 'Spain', 'https://upload.wikimedia.org/wikipedia/en/5/56/Real_Madrid_CF.svg'),
('FC Barcelona', 'Spain', 'https://upload.wikimedia.org/wikipedia/en/4/47/FC_Barcelona_%28crest%29.svg'),
('Manchester United', 'England', 'https://upload.wikimedia.org/wikipedia/en/7/7a/Manchester_United_FC_crest.svg'),
('Manchester City', 'England', 'https://upload.wikimedia.org/wikipedia/en/e/eb/Manchester_City_FC_badge.svg'),
('Liverpool', 'England', 'https://upload.wikimedia.org/wikipedia/en/0/0c/Liverpool_FC.svg'),
('Chelsea', 'England', 'https://upload.wikimedia.org/wikipedia/en/c/cc/Chelsea_FC.svg'),
('Arsenal', 'England', 'https://upload.wikimedia.org/wikipedia/en/5/53/Arsenal_FC.svg'),
('Bayern Munich', 'Germany', 'https://upload.wikimedia.org/wikipedia/commons/1/1b/FC_Bayern_M%C3%BCnchen_logo_%282017%29.svg'),
('Borussia Dortmund', 'Germany', 'https://upload.wikimedia.org/wikipedia/commons/6/67/Borussia_Dortmund_logo.svg'),
('Paris Saint-Germain', 'France', 'https://upload.wikimedia.org/wikipedia/en/a/a7/Paris_Saint-Germain_F.C..svg'),
('Juventus', 'Italy', 'https://upload.wikimedia.org/wikipedia/commons/b/bc/Juventus_FC_2017_logo.svg'),
('AC Milan', 'Italy', 'https://upload.wikimedia.org/wikipedia/commons/d/d0/Logo_of_AC_Milan.svg'),
('Inter Milan', 'Italy', 'https://upload.wikimedia.org/wikipedia/commons/0/05/FC_Internazionale_Milano_2021.svg'),
('Atletico Madrid', 'Spain', 'https://upload.wikimedia.org/wikipedia/en/f/f4/Atletico_Madrid_2017_logo.svg');
