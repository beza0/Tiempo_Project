import type { SkillDto } from "../api/skills";
import type { Messages } from "../language";
import { formatTemplate } from "../language";

/** Nötr kapak; gerçek kapak URL’i API’de yok. */
const BROWSE_COVER_FALLBACK =
  "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&q=80";

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
  duration: string;
  location: string;
  /** Tek oturumun süresi (saat), filtre/sıralama için */
  sessionHours: number;
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
  const rawCat = skill.category?.trim();
  const categoryValue = rawCat || "Programming";
  const categoryLabel =
    b.categoryLabels[categoryValue as keyof typeof b.categoryLabels] ??
    categoryValue;
  const duration = formatTemplate(b.durationMinutesLabel, {
    n: String(skill.durationMinutes),
  });
  const tags = rawCat ? [categoryLabel] : [];
  const searchBlob = [
    skill.title,
    skill.ownerName,
    categoryLabel,
    skill.description ?? "",
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
    duration,
    location: "Online",
    sessionHours: skill.durationMinutes / 60,
    image: BROWSE_COVER_FALLBACK,
    tags,
    createdAt: skill.createdAt,
    searchBlob,
  };
}
