import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type Lang = "en" | "pt" | "es";
export type Theme = "light" | "dark" | "system";
export type Accent = "blue" | "green" | "purple" | "pink";

export const ACCENTS: { key: Accent; label: string; hex: string; glow: string }[] = [
  { key: "blue",   label: "Blue",   hex: "#00BFFF", glow: "0,191,255" },
  { key: "green",  label: "Green",  hex: "#39FF14", glow: "57,255,20" },
  { key: "purple", label: "Purple", hex: "#b388ff", glow: "179,136,255" },
  { key: "pink",   label: "Pink",   hex: "#ff5fa2", glow: "255,95,162" },
];

type Dict = Record<string, string>;

const en: Dict = {
  "app.name": "GOLAÇO CUP",
  "app.tagline": "Battle Your Friends",
  "nav.dashboard": "Home",
  "nav.players": "Players",
  "nav.teams": "Teams",
  "nav.new": "New",
  "nav.matches": "History",
  "nav.ranking": "Ranking",
  "nav.stats": "Stats",
  "nav.settings": "Settings",
  "common.new_match": "New match",
  "common.save": "Save",
  "common.cancel": "Cancel",
  "common.edit": "Edit",
  "common.delete": "Delete",
  "common.add": "Add",
  "common.search": "Search",
  "common.saving": "Saving…",
  "common.all": "All",
  "common.view_all": "View all",
  "common.notes": "Notes",
  "common.notes_optional": "Notes (optional)",
  "common.preview": "Preview",
  "common.player": "Player",
  "common.team": "Team",
  "common.country": "Country",
  "common.score": "Score",
  "common.date": "Date",
  "common.name": "Name",
  "common.confirm": "Confirm",
  "common.reset": "Reset",
  "dashboard.title": "Dashboard",
  "dashboard.subtitle": "Live overview of your F26 friendly battles",
  "dashboard.matches": "Matches",
  "dashboard.most_matches": "Most matches",
  "dashboard.most_wins": "Most wins",
  "dashboard.top_scorer": "Top scorer",
  "dashboard.champion_week": "Champion of the week",
  "dashboard.most_active": "Most active player",
  "dashboard.recent": "Recent matches",
  "dashboard.no_matches": "No matches yet. Register your first F26 battle.",
  "dashboard.register": "Register match",
  "dashboard.latest_winner": "Latest winner",
  "match.draw": "Draw",
  "match.winner": "Winner",
  "match.saved": "Match saved!",
  "match.deleted": "Match deleted",
  "match.confirm_delete": "Delete this match?",
  "match.new_title": "New match",
  "match.new_subtitle": "Log the result of your F26 battle",
  "match.player_n": "Player {n}",
  "match.need_players": "You need at least 2 players.",
  "match.add_players_first": "Add players first",
  "match.select_player": "Select player",
  "match.select_team": "Select team",
  "match.history_title": "Match history",
  "match.history_count_one": "{n} match",
  "match.history_count_other": "{n} matches",
  "match.no_history": "No matches to show.",
  "match.filter_player": "Player",
  "match.filter_team": "Team",
  "match.filter_period": "Period",
  "match.period_7": "Last 7 days",
  "match.period_30": "Last 30 days",
  "match.period_90": "Last 90 days",
  "match.notes_placeholder": "Hat-trick from Mbappé, last-minute winner…",
  "players.title": "Players",
  "players.registered": "{n} registered",
  "players.empty": "No players yet. Add your friends to get started.",
  "players.add_first": "Add first player",
  "players.add": "Add player",
  "players.edit": "Edit player",
  "players.name_required": "Name required",
  "players.added": "Player added",
  "players.updated": "Player updated",
  "players.removed": "Player removed",
  "players.confirm_delete": "Delete {name}? This removes their matches too.",
  "players.avatar_url": "Avatar URL (optional)",
  "players.favorite_team": "Favorite team",
  "players.no_teams_yet": "Add teams first to pick a favorite.",
  "players.notes_placeholder": "Plays as striker, loves Real Madrid…",
  "common.none": "None",
  "players.x_matches": "{n} matches",
  "players.win_rate": "{n}% win rate",
  "players.streak": "Streak",
  "teams.title": "Teams",
  "teams.count": "{n} teams",
  "teams.add": "Add team",
  "teams.edit": "Edit team",
  "teams.empty": "No teams match your search.",
  "teams.search_placeholder": "Search teams or countries…",
  "teams.all_required": "All fields required",
  "teams.added": "Team added",
  "teams.updated": "Team updated",
  "teams.removed": "Team removed",
  "teams.confirm_delete": "Remove {name}?",
  "teams.crest_url": "Flag / crest URL",
  "ranking.title": "Ranking",
  "ranking.subtitle": "Win = 3 pts · Draw = 1 pt · Loss = 0",
  "ranking.empty": "Add players and matches to see the leaderboard.",
  "ranking.podium": "Podium",
  "ranking.leader": "Leader",
  "stats.title": "Statistics",
  "stats.subtitle": "Charts across players and teams",
  "stats.empty": "Play some matches to unlock stats.",
  "stats.most_active": "Most active players",
  "stats.most_wins": "Most wins",
  "stats.top_scorers": "Top scorers (goals)",
  "stats.win_rate": "Win rate (%)",
  "stats.team_usage": "Team usage frequency",
  "settings.title": "Settings",
  "settings.subtitle": "Personalize your arena",
  "settings.language": "Language",
  "settings.theme": "Appearance",
  "settings.theme_light": "Light",
  "settings.theme_dark": "Dark",
  "settings.theme_system": "System",
  "settings.app_name": "App name",
  "settings.app_name_help": "Shown in the header and bottom nav.",
  "settings.reset": "Reset all data",
  "settings.reset_help": "Delete every match, player and custom team. Cannot be undone.",
  "settings.reset_confirm_title": "Reset all data?",
  "settings.reset_confirm_body": "This permanently deletes all players, teams and matches.",
  "settings.reset_done": "All data reset",
  "settings.about": "About",
  "settings.customization": "Customization",
  "settings.primary_color": "Primary color",
  "settings.color_blue": "Blue",
  "settings.color_green": "Green",
  "settings.color_purple": "Purple",
  "settings.color_pink": "Pink",
  "settings.data": "Data",
  "settings.export": "Export data",
  "settings.export_help": "Download all your players, teams and matches as JSON.",
  "settings.exported": "Data exported",
  "celebration.winner": "{name} wins!",
};

const pt: Dict = {
  "app.name": "GOLAÇO CUP",
  "app.tagline": "Desafie seus amigos",
  "nav.dashboard": "Início",
  "nav.players": "Jogadores",
  "nav.teams": "Times",
  "nav.new": "Nova",
  "nav.matches": "Histórico",
  "nav.ranking": "Ranking",
  "nav.stats": "Estatísticas",
  "nav.settings": "Ajustes",
  "common.new_match": "Nova partida",
  "common.save": "Salvar",
  "common.cancel": "Cancelar",
  "common.edit": "Editar",
  "common.delete": "Excluir",
  "common.add": "Adicionar",
  "common.search": "Buscar",
  "common.saving": "Salvando…",
  "common.all": "Todos",
  "common.view_all": "Ver tudo",
  "common.notes": "Notas",
  "common.notes_optional": "Notas (opcional)",
  "common.preview": "Prévia",
  "common.player": "Jogador",
  "common.team": "Time",
  "common.country": "País",
  "common.score": "Placar",
  "common.date": "Data",
  "common.name": "Nome",
  "common.confirm": "Confirmar",
  "common.reset": "Resetar",
  "dashboard.title": "Início",
  "dashboard.subtitle": "Visão geral das suas partidas F26",
  "dashboard.matches": "Partidas",
  "dashboard.most_matches": "Mais partidas",
  "dashboard.most_wins": "Mais vitórias",
  "dashboard.top_scorer": "Artilheiro",
  "dashboard.champion_week": "Campeão da semana",
  "dashboard.most_active": "Jogador mais ativo",
  "dashboard.recent": "Partidas recentes",
  "dashboard.no_matches": "Ainda sem partidas. Registre sua primeira batalha F26.",
  "dashboard.register": "Registrar partida",
  "dashboard.latest_winner": "Último vencedor",
  "match.draw": "Empate",
  "match.winner": "Vencedor",
  "match.saved": "Partida salva!",
  "match.deleted": "Partida excluída",
  "match.confirm_delete": "Excluir esta partida?",
  "match.new_title": "Nova partida",
  "match.new_subtitle": "Registre o resultado da sua batalha F26",
  "match.player_n": "Jogador {n}",
  "match.need_players": "Você precisa de pelo menos 2 jogadores.",
  "match.add_players_first": "Adicione jogadores primeiro",
  "match.select_player": "Selecionar jogador",
  "match.select_team": "Selecionar time",
  "match.history_title": "Histórico de partidas",
  "match.history_count_one": "{n} partida",
  "match.history_count_other": "{n} partidas",
  "match.no_history": "Nenhuma partida para exibir.",
  "match.filter_player": "Jogador",
  "match.filter_team": "Time",
  "match.filter_period": "Período",
  "match.period_7": "Últimos 7 dias",
  "match.period_30": "Últimos 30 dias",
  "match.period_90": "Últimos 90 dias",
  "match.notes_placeholder": "Hat-trick do Mbappé, gol no último minuto…",
  "players.title": "Jogadores",
  "players.registered": "{n} cadastrados",
  "players.empty": "Sem jogadores. Adicione seus amigos para começar.",
  "players.add_first": "Adicionar primeiro jogador",
  "players.add": "Adicionar jogador",
  "players.edit": "Editar jogador",
  "players.name_required": "Nome obrigatório",
  "players.added": "Jogador adicionado",
  "players.updated": "Jogador atualizado",
  "players.removed": "Jogador removido",
  "players.confirm_delete": "Excluir {name}? Isso remove suas partidas também.",
  "players.avatar_url": "URL do avatar (opcional)",
  "players.favorite_team": "Time favorito",
  "players.no_teams_yet": "Adicione times antes de escolher um favorito.",
  "players.notes_placeholder": "Atacante, torce pelo Real Madrid…",
  "common.none": "Nenhum",
  "players.x_matches": "{n} partidas",
  "players.win_rate": "{n}% de vitórias",
  "players.streak": "Sequência",
  "teams.title": "Times",
  "teams.count": "{n} times",
  "teams.add": "Adicionar time",
  "teams.edit": "Editar time",
  "teams.empty": "Nenhum time corresponde à busca.",
  "teams.search_placeholder": "Buscar times ou países…",
  "teams.all_required": "Todos os campos obrigatórios",
  "teams.added": "Time adicionado",
  "teams.updated": "Time atualizado",
  "teams.removed": "Time removido",
  "teams.confirm_delete": "Remover {name}?",
  "teams.crest_url": "URL do escudo / bandeira",
  "ranking.title": "Ranking",
  "ranking.subtitle": "Vitória = 3 pts · Empate = 1 pt · Derrota = 0",
  "ranking.empty": "Adicione jogadores e partidas para ver o ranking.",
  "ranking.podium": "Pódio",
  "ranking.leader": "Líder",
  "stats.title": "Estatísticas",
  "stats.subtitle": "Gráficos de jogadores e times",
  "stats.empty": "Jogue partidas para desbloquear as estatísticas.",
  "stats.most_active": "Jogadores mais ativos",
  "stats.most_wins": "Mais vitórias",
  "stats.top_scorers": "Artilheiros (gols)",
  "stats.win_rate": "Vitórias (%)",
  "stats.team_usage": "Uso de times",
  "settings.title": "Ajustes",
  "settings.subtitle": "Personalize sua arena",
  "settings.language": "Idioma",
  "settings.theme": "Aparência",
  "settings.theme_light": "Claro",
  "settings.theme_dark": "Escuro",
  "settings.theme_system": "Sistema",
  "settings.app_name": "Nome do app",
  "settings.app_name_help": "Exibido no cabeçalho e na barra inferior.",
  "settings.reset": "Resetar todos os dados",
  "settings.reset_help": "Apaga partidas, jogadores e times personalizados. Não pode ser desfeito.",
  "settings.reset_confirm_title": "Resetar todos os dados?",
  "settings.reset_confirm_body": "Isso apaga permanentemente todos os jogadores, times e partidas.",
  "settings.reset_done": "Dados resetados",
  "settings.about": "Sobre",
  "settings.customization": "Personalização",
  "settings.primary_color": "Cor principal",
  "settings.color_blue": "Azul",
  "settings.color_green": "Verde",
  "settings.color_purple": "Roxo",
  "settings.color_pink": "Rosa",
  "settings.data": "Dados",
  "settings.export": "Exportar dados",
  "settings.export_help": "Baixe todos os jogadores, times e partidas em JSON.",
  "settings.exported": "Dados exportados",
  "celebration.winner": "{name} venceu!",
};

const es: Dict = {
  "app.name": "GOLAÇO CUP",
  "app.tagline": "Desafía a tus amigos",
  "nav.dashboard": "Inicio",
  "nav.players": "Jugadores",
  "nav.teams": "Equipos",
  "nav.new": "Nuevo",
  "nav.matches": "Historial",
  "nav.ranking": "Ranking",
  "nav.stats": "Stats",
  "nav.settings": "Ajustes",
  "common.new_match": "Nuevo partido",
  "common.save": "Guardar",
  "common.cancel": "Cancelar",
  "common.edit": "Editar",
  "common.delete": "Eliminar",
  "common.add": "Añadir",
  "common.search": "Buscar",
  "common.saving": "Guardando…",
  "common.all": "Todos",
  "common.view_all": "Ver todo",
  "common.notes": "Notas",
  "common.notes_optional": "Notas (opcional)",
  "common.preview": "Vista previa",
  "common.player": "Jugador",
  "common.team": "Equipo",
  "common.country": "País",
  "common.score": "Marcador",
  "common.date": "Fecha",
  "common.name": "Nombre",
  "common.confirm": "Confirmar",
  "common.reset": "Reiniciar",
  "dashboard.title": "Inicio",
  "dashboard.subtitle": "Vista en vivo de tus partidos F26",
  "dashboard.matches": "Partidos",
  "dashboard.most_matches": "Más partidos",
  "dashboard.most_wins": "Más victorias",
  "dashboard.top_scorer": "Goleador",
  "dashboard.champion_week": "Campeón de la semana",
  "dashboard.most_active": "Jugador más activo",
  "dashboard.recent": "Partidos recientes",
  "dashboard.no_matches": "Sin partidos aún. Registra tu primera batalla F26.",
  "dashboard.register": "Registrar partido",
  "dashboard.latest_winner": "Último ganador",
  "match.draw": "Empate",
  "match.winner": "Ganador",
  "match.saved": "¡Partido guardado!",
  "match.deleted": "Partido eliminado",
  "match.confirm_delete": "¿Eliminar este partido?",
  "match.new_title": "Nuevo partido",
  "match.new_subtitle": "Registra el resultado de tu batalla F26",
  "match.player_n": "Jugador {n}",
  "match.need_players": "Necesitas al menos 2 jugadores.",
  "match.add_players_first": "Añade jugadores primero",
  "match.select_player": "Seleccionar jugador",
  "match.select_team": "Seleccionar equipo",
  "match.history_title": "Historial de partidos",
  "match.history_count_one": "{n} partido",
  "match.history_count_other": "{n} partidos",
  "match.no_history": "No hay partidos.",
  "match.filter_player": "Jugador",
  "match.filter_team": "Equipo",
  "match.filter_period": "Periodo",
  "match.period_7": "Últimos 7 días",
  "match.period_30": "Últimos 30 días",
  "match.period_90": "Últimos 90 días",
  "match.notes_placeholder": "Hat-trick de Mbappé, gol en el último minuto…",
  "players.title": "Jugadores",
  "players.registered": "{n} registrados",
  "players.empty": "Sin jugadores. Añade a tus amigos para empezar.",
  "players.add_first": "Añadir primer jugador",
  "players.add": "Añadir jugador",
  "players.edit": "Editar jugador",
  "players.name_required": "Nombre requerido",
  "players.added": "Jugador añadido",
  "players.updated": "Jugador actualizado",
  "players.removed": "Jugador eliminado",
  "players.confirm_delete": "¿Eliminar {name}? También se borran sus partidos.",
  "players.avatar_url": "URL de avatar (opcional)",
  "players.favorite_team": "Equipo favorito",
  "players.no_teams_yet": "Añade equipos antes de elegir un favorito.",
  "players.notes_placeholder": "Delantero, hincha del Real Madrid…",
  "common.none": "Ninguno",
  "players.x_matches": "{n} partidos",
  "players.win_rate": "{n}% de victorias",
  "players.streak": "Racha",
  "teams.title": "Equipos",
  "teams.count": "{n} equipos",
  "teams.add": "Añadir equipo",
  "teams.edit": "Editar equipo",
  "teams.empty": "Ningún equipo coincide con tu búsqueda.",
  "teams.search_placeholder": "Buscar equipos o países…",
  "teams.all_required": "Todos los campos son obligatorios",
  "teams.added": "Equipo añadido",
  "teams.updated": "Equipo actualizado",
  "teams.removed": "Equipo eliminado",
  "teams.confirm_delete": "¿Eliminar {name}?",
  "teams.crest_url": "URL del escudo / bandera",
  "ranking.title": "Ranking",
  "ranking.subtitle": "Victoria = 3 pts · Empate = 1 pt · Derrota = 0",
  "ranking.empty": "Añade jugadores y partidos para ver el ranking.",
  "ranking.podium": "Podio",
  "ranking.leader": "Líder",
  "stats.title": "Estadísticas",
  "stats.subtitle": "Gráficos de jugadores y equipos",
  "stats.empty": "Juega partidos para desbloquear las estadísticas.",
  "stats.most_active": "Jugadores más activos",
  "stats.most_wins": "Más victorias",
  "stats.top_scorers": "Goleadores (goles)",
  "stats.win_rate": "Victorias (%)",
  "stats.team_usage": "Uso de equipos",
  "settings.title": "Ajustes",
  "settings.subtitle": "Personaliza tu arena",
  "settings.language": "Idioma",
  "settings.theme": "Apariencia",
  "settings.theme_light": "Claro",
  "settings.theme_dark": "Oscuro",
  "settings.theme_system": "Sistema",
  "settings.app_name": "Nombre de la app",
  "settings.app_name_help": "Se muestra en el encabezado y la barra inferior.",
  "settings.reset": "Restablecer todos los datos",
  "settings.reset_help": "Elimina partidos, jugadores y equipos personalizados. No se puede deshacer.",
  "settings.reset_confirm_title": "¿Restablecer todos los datos?",
  "settings.reset_confirm_body": "Esto elimina permanentemente todos los jugadores, equipos y partidos.",
  "settings.reset_done": "Datos restablecidos",
  "settings.about": "Acerca de",
  "settings.customization": "Personalización",
  "settings.primary_color": "Color principal",
  "settings.color_blue": "Azul",
  "settings.color_green": "Verde",
  "settings.color_purple": "Morado",
  "settings.color_pink": "Rosa",
  "settings.data": "Datos",
  "settings.export": "Exportar datos",
  "settings.export_help": "Descarga todos los jugadores, equipos y partidos en JSON.",
  "settings.exported": "Datos exportados",
  "celebration.winner": "¡{name} gana!",
};

const dicts: Record<Lang, Dict> = { en, pt, es };

export const LANGUAGES: { code: Lang; label: string; flag: string }[] = [
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "pt", label: "Português (Brasil)", flag: "🇧🇷" },
  { code: "es", label: "Español", flag: "🇪🇸" },
];

type Settings = {
  lang: Lang;
  theme: Theme;
  appName: string;
  accent: Accent;
};

type Ctx = Settings & {
  setLang: (l: Lang) => void;
  setTheme: (t: Theme) => void;
  setAppName: (n: string) => void;
  setAccent: (a: Accent) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
};

const I18nCtx = createContext<Ctx | null>(null);

const LS_KEY = "f26.settings.v1";

function readLS(): Partial<Settings> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

function detectLang(): Lang {
  if (typeof navigator === "undefined") return "en";
  const l = navigator.language.toLowerCase();
  if (l.startsWith("pt")) return "pt";
  if (l.startsWith("es")) return "es";
  return "en";
}

function applyTheme(theme: Theme) {
  if (typeof document === "undefined") return;
  const isDark = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", isDark);
  document.documentElement.classList.toggle("light", !isDark);
}

function applyAccent(accent: Accent) {
  if (typeof document === "undefined") return;
  const def = ACCENTS.find((a) => a.key === accent) ?? ACCENTS[0];
  const r = document.documentElement.style;
  r.setProperty("--primary", def.hex);
  r.setProperty("--ring", `rgba(${def.glow},0.55)`);
  r.setProperty("--border", `rgba(${def.glow},0.18)`);
  r.setProperty("--neon-blue", def.hex);
  r.setProperty("--accent-glow", def.glow);
}

const DEFAULT_NAME = "GOLAÇO CUP";

export function I18nProvider({ children }: { children: ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [lang, setLangState] = useState<Lang>("en");
  const [theme, setThemeState] = useState<Theme>("dark");
  const [appName, setAppNameState] = useState<string>(DEFAULT_NAME);
  const [accent, setAccentState] = useState<Accent>("blue");

  useEffect(() => {
    const saved = readLS();
    setLangState((saved.lang as Lang) ?? detectLang());
    setThemeState((saved.theme as Theme) ?? "dark");
    const savedName = saved.appName && saved.appName !== "F26 Arena" ? saved.appName : DEFAULT_NAME;
    setAppNameState(savedName);
    setAccentState((saved.accent as Accent) ?? "blue");
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    applyTheme(theme);
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => theme === "system" && applyTheme("system");
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [theme, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    applyAccent(accent);
  }, [accent, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(LS_KEY, JSON.stringify({ lang, theme, appName, accent }));
  }, [lang, theme, appName, accent, hydrated]);

  const value = useMemo<Ctx>(() => ({
    lang, theme, appName, accent,
    setLang: setLangState,
    setTheme: setThemeState,
    setAppName: setAppNameState,
    setAccent: setAccentState,
    t: (key, vars) => {
      const dict = dicts[lang] ?? en;
      let str = dict[key] ?? en[key] ?? key;
      if (vars) for (const [k, v] of Object.entries(vars)) str = str.replace(`{${k}}`, String(v));
      return str;
    },
  }), [lang, theme, appName, accent]);

  return <I18nCtx.Provider value={value}>{children}</I18nCtx.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nCtx);
  if (!ctx) throw new Error("useI18n must be used inside I18nProvider");
  return ctx;
}

export function useT() {
  return useI18n().t;
}
