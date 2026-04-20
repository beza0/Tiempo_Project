import type { SkillDto } from "../api/skills";
import type { Messages } from "../language";
import { resolveSkillCoverImageUrl } from "./skillCoverImageUrl";

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
  tags: string[];
  createdAt: string;
  searchBlob: string;
};

export function mapSkillDtoToBrowseCard(
  skill: SkillDto,
  messages: Messages,
): BrowseSkillCardModel {
  const b = messages.browse;
  const dayLabels = messages.addSkill.days;
  const rawCat = skill.category?.trim();
  const categoryValue = rawCat || "Programming";
  const categoryLabel =
    b.categoryLabels[categoryValue as keyof typeof b.categoryLabels] ??
    categoryValue;
  const dayIndex: Record<string, number> = {
    MONDAY: 0,
    TUESDAY: 1,
    WEDNESDAY: 2,
    THURSDAY: 3,
    FRIDAY: 4,
    SATURDAY: 5,
    SUNDAY: 6,
  };
  const localizedDays = (skill.availableDays ?? [])
    .map((d) => dayLabels[dayIndex[d]] ?? d)
    .join(", ");
  const meta = skill.description ?? "";
  const fallbackDays = parseMetaField(meta, ["Available Days *", "Müsait günler *"]);
  const fallbackTime = parseMetaField(
    meta,
    ["Available From *– Available Until *", "Başlangıç *–Bitiş *"],
  );
  const availability = localizedDays && skill.availableFrom && skill.availableUntil
    ? `${localizedDays} · ${skill.availableFrom} - ${skill.availableUntil}`
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
  const tags = rawCat ? [categoryLabel] : [];
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
    tags,
    createdAt: skill.createdAt,
    searchBlob,
  };
}
