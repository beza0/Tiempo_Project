import locationsJson from "./profileLocations.json";
import languagesJson from "./profileLanguages.json";

export type ProfileLanguageRow = {
  value: string;
  label: { en: string; tr: string };
};

/** Konum: "Şehir, Ülke" — `profileLocations.json` */
export const PROFILE_LOCATIONS: string[] = locationsJson as string[];

/** Dil satırları — `profileLanguages.json` (kayıtta `value` İngilizce kanonik) */
export const PROFILE_LANGUAGE_ROWS: ProfileLanguageRow[] =
  languagesJson as ProfileLanguageRow[];

export function locationOptions(): { value: string; label: string }[] {
  return PROFILE_LOCATIONS.map((loc) => ({ value: loc, label: loc }));
}

export function languageOptions(locale: string): { value: string; label: string }[] {
  const key = locale === "tr" ? "tr" : "en";
  return PROFILE_LANGUAGE_ROWS.map((row) => ({
    value: row.value,
    label: row.label[key],
  }));
}

/** API'den gelen değer listede yoksa (eski veri) seçeneklere eklenir */
export function mergeLegacyOption(
  options: { value: string; label: string }[],
  current: string,
): { value: string; label: string }[] {
  const t = current.trim();
  if (!t) return options;
  const hit = options.some((o) => o.value === t || o.label === t);
  if (hit) return options;
  return [{ value: t, label: t }, ...options];
}
