import { compactDays, compactTimeRange } from "./availabilityLabel";
import type { SkillDto } from "../api/skills";
import type { Messages } from "../language";
import {
  resolveSkillCoverImageUrl,
  skillCoverImageFallbackUrl,
} from "./skillCoverImageUrl";

function parseMetaField(text: string, labels: string[]): string | null {
  for (const label of labels) {
    const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const m = text.match(new RegExp(`${escaped}\\s*:\\s*([^\\n]+)`, "i"));
    if (m?.[1]?.trim()) return m[1].trim();
  }
  return null;
}

export type BrowseSkillCardModel = {
  id: string;
  ownerId: string;
  title: string;
  instructor: {
    name: string;
    image: string;
    rating: number;
    reviews: number;
  };
  category: string;
  availability: string;
  location: string | null;
  isOnline: boolean;
  isInPerson: boolean;
  image: string;
  /** Proxy başarısız olursa ImageWithFallback için */
  coverFallbackUrl?: string;
  tags: string[];
  createdAt: string;
  searchBlob: string;
};

export function mapSkillDtoToBrowseCard(
  skill: SkillDto,
  messages: Messages,
): BrowseSkillCardModel {
  const b = messages.browse;
  const rawCat = skill.category?.trim();
  const categoryValue = rawCat || "Programming";
  const categoryLabel =
    b.categoryLabels[categoryValue as keyof typeof b.categoryLabels] ??
    categoryValue;
  const meta = skill.description ?? "";
  const fallbackDays = parseMetaField(meta, ["Available Days *", "Müsait günler *"]);
  const fallbackTime = parseMetaField(
    meta,
    ["Available From *– Available Until *", "Başlangıç *–Bitiş *"],
  );
  const compact = compactDays(skill.availableDays, {
    short: b.dayShort,
    everyDay: b.everyDay,
    weekdays: b.weekdays,
    weekend: b.weekend,
  });
  const availability = compact && skill.availableFrom && skill.availableUntil
    ? `${compact} · ${compactTimeRange(skill.availableFrom, skill.availableUntil)}`
    : fallbackDays && fallbackTime
      ? `${fallbackDays} · ${fallbackTime}`
      : "";
  const sessionTypes = skill.sessionTypes ?? [];
  const fallbackSessionType = parseMetaField(meta, ["Session Type *", "Oturum türü *"]);
  const isOnline = sessionTypes.includes("online");
  const isInPerson = sessionTypes.includes("in-person");
  const inPersonByFallback = (fallbackSessionType ?? "").toLowerCase().includes("in-person")
    || (fallbackSessionType ?? "").toLowerCase().includes("yüz yüze");
  const location = (isInPerson || inPersonByFallback)
    ? (skill.inPersonLocation ?? parseMetaField(meta, ["Location", "Konum"]))
    : null;
  // Kategori kapak görselinin üstünde zaten gösteriliyor; alt etiket tekrarıydı.
  const tags: string[] = [];
  const searchBlob = [
    skill.title,
    skill.ownerName,
    categoryLabel,
    skill.description ?? "",
    availability,
    location ?? "",
  ]
    .join(" ")
    .toLowerCase();
  return {
    id: skill.id,
    ownerId: skill.ownerId,
    title: skill.title,
    instructor: {
      name: skill.ownerName,
      image: "",
      rating: 0,
      reviews: 0,
    },
    category: categoryValue,
    availability,
    location,
    isOnline,
    isInPerson,
    image: resolveSkillCoverImageUrl(skill),
    coverFallbackUrl: skillCoverImageFallbackUrl(skill),
    tags,
    createdAt: skill.createdAt,
    searchBlob,
  };
}
