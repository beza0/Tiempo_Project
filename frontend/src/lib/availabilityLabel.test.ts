import { describe, expect, it } from "vitest";
import { compactDays, compactTimeRange } from "./availabilityLabel";

const tr = {
  short: ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"],
  everyDay: "Her gün",
  weekdays: "Hafta içi",
  weekend: "Hafta sonu",
};

describe("compactDays", () => {
  it("summarises common sets", () => {
    expect(
      compactDays(["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"], tr),
    ).toBe("Her gün");
    expect(compactDays(["FRIDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY"], tr)).toBe("Hafta içi");
    expect(compactDays(["SUNDAY", "SATURDAY"], tr)).toBe("Hafta sonu");
  });

  it("uses ranges and short lists", () => {
    expect(compactDays(["TUESDAY", "WEDNESDAY", "THURSDAY"], tr)).toBe("Sal–Per");
    expect(compactDays(["MONDAY", "WEDNESDAY", "FRIDAY"], tr)).toBe("Pzt, Çar, Cum");
    expect(compactDays([], tr)).toBe("");
  });

  it("formats time ranges", () => {
    expect(compactTimeRange("00:00", "23:59")).toBe("00:00–24:00");
    expect(compactTimeRange(null, "10:00")).toBe("");
  });
});
