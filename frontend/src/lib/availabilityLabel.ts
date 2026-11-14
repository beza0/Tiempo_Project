const ORDER = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];

export type DayLabels = {
  short: readonly string[];
  everyDay: string;
  weekdays: string;
  weekend: string;
};

/**
 * Uygun günleri kısa ve okunur biçimde verir: "Her gün", "Hafta içi", "Hafta sonu",
 * ardışık aralık "Pzt–Per" ya da "Pzt, Çar, Cum". Önceden yedi günün tam adı yan yana
 * yazılıyor, beceri kartlarını kalabalıklaştırıyordu.
 */
export function compactDays(days: readonly string[] | null | undefined, l: DayLabels): string {
  const idx = Array.from(
    new Set((days ?? []).map((d) => ORDER.indexOf(d.trim().toUpperCase())).filter((i) => i >= 0)),
  ).sort((a, b) => a - b);
  if (idx.length === 0) return "";
  if (idx.length === 7) return l.everyDay;
  const key = idx.join(",");
  if (key === "0,1,2,3,4") return l.weekdays;
  if (key === "5,6") return l.weekend;
  const contiguous = idx.every((v, i) => i === 0 || v === idx[i - 1] + 1);
  if (contiguous && idx.length >= 3) {
    return `${l.short[idx[0]]}–${l.short[idx[idx.length - 1]]}`;
  }
  return idx.map((i) => l.short[i]).join(", ");
}

/** "09:00–21:00"; 23:59 bitişi "24:00" olarak gösterilir. */
export function compactTimeRange(from?: string | null, until?: string | null): string {
  if (!from || !until) return "";
  const end = until === "23:59" ? "24:00" : until;
  return `${from}–${end}`;
}
