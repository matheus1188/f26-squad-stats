// Country name → ISO 3166-1 alpha-2 mapping (PT/EN common names)
const MAP: Record<string, string> = {
  brasil: "br", brazil: "br",
  argentina: "ar",
  uruguai: "uy", uruguay: "uy",
  paraguai: "py", paraguay: "py",
  chile: "cl",
  colombia: "co", colômbia: "co",
  peru: "pe", perú: "pe",
  equador: "ec", ecuador: "ec",
  bolivia: "bo", bolívia: "bo",
  venezuela: "ve",
  "estados unidos": "us", eua: "us", usa: "us", "united states": "us",
  mexico: "mx", méxico: "mx",
  canada: "ca", canadá: "ca",
  inglaterra: "gb-eng", england: "gb-eng",
  escocia: "gb-sct", escócia: "gb-sct", scotland: "gb-sct",
  "pais de gales": "gb-wls", "país de gales": "gb-wls", wales: "gb-wls",
  "irlanda do norte": "gb-nir", "northern ireland": "gb-nir",
  "reino unido": "gb", "united kingdom": "gb", uk: "gb",
  espanha: "es", spain: "es", españa: "es",
  franca: "fr", frança: "fr", france: "fr",
  alemanha: "de", germany: "de",
  italia: "it", itália: "it", italy: "it",
  portugal: "pt",
  holanda: "nl", "países baixos": "nl", netherlands: "nl",
  belgica: "be", bélgica: "be", belgium: "be",
  suica: "ch", suíça: "ch", switzerland: "ch",
  austria: "at", áustria: "at",
  polonia: "pl", polônia: "pl", poland: "pl",
  croacia: "hr", croácia: "hr", croatia: "hr",
  servia: "rs", sérvia: "rs", serbia: "rs",
  dinamarca: "dk", denmark: "dk",
  suecia: "se", suécia: "se", sweden: "se",
  noruega: "no", norway: "no",
  finlandia: "fi", finlândia: "fi", finland: "fi",
  russia: "ru", rússia: "ru",
  ucrania: "ua", ucrânia: "ua", ukraine: "ua",
  turquia: "tr", turkey: "tr",
  grecia: "gr", grécia: "gr", greece: "gr",
  "republica tcheca": "cz", "república tcheca": "cz", "czech republic": "cz", czechia: "cz",
  hungria: "hu", hungary: "hu",
  romenia: "ro", romênia: "ro", romania: "ro",
  japao: "jp", japão: "jp", japan: "jp",
  "coreia do sul": "kr", "coréia do sul": "kr", "south korea": "kr",
  china: "cn",
  australia: "au", austrália: "au",
  "nova zelandia": "nz", "nova zelândia": "nz", "new zealand": "nz",
  marrocos: "ma", morocco: "ma",
  senegal: "sn",
  nigeria: "ng", nigéria: "ng",
  "costa do marfim": "ci", "ivory coast": "ci",
  camaroes: "cm", camarões: "cm", cameroon: "cm",
  gana: "gh", ghana: "gh",
  egito: "eg", egypt: "eg",
  argelia: "dz", argélia: "dz", algeria: "dz",
  tunisia: "tn", tunísia: "tn",
  "africa do sul": "za", "south africa": "za",
  arabia: "sa", "arabia saudita": "sa", "arábia saudita": "sa", "saudi arabia": "sa",
  catar: "qa", qatar: "qa",
  ira: "ir", irã: "ir", iran: "ir",
  iraque: "iq", iraq: "iq",
  israel: "il",
  india: "in", índia: "in",
};

export function countryToISO(country?: string | null): string | null {
  if (!country) return null;
  const key = country.trim().toLowerCase();
  return MAP[key] ?? null;
}

export function flagUrl(country?: string | null, size: "w40" | "w80" | "w160" | "w320" = "w160"): string | null {
  const iso = countryToISO(country);
  if (!iso) return null;
  return `https://flagcdn.com/${size}/${iso}.png`;
}
