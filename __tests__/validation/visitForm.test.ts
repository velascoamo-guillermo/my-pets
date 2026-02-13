import { visitFormSchema } from "@/lib/schemas/visitForm";

describe("visitFormSchema", () => {
  const validData = {
    type: "checkup" as const,
    title: "Annual checkup",
    notes: "",
    scheduledDate: new Date("2025-06-15"),
    reminderDays: 1,
  };

  it("accepts valid visit data", () => {
    const result = visitFormSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("accepts all visit types", () => {
    const types = ["vaccination", "checkup", "emergency", "other"] as const;
    for (const type of types) {
      const result = visitFormSchema.safeParse({ ...validData, type });
      expect(result.success).toBe(true);
    }
  });

  it("rejects empty title", () => {
    const result = visitFormSchema.safeParse({ ...validData, title: "" });
    expect(result.success).toBe(false);
  });

  it("rejects missing title", () => {
    const { title, ...withoutTitle } = validData;
    const result = visitFormSchema.safeParse(withoutTitle);
    expect(result.success).toBe(false);
  });

  it("rejects invalid visit type", () => {
    const result = visitFormSchema.safeParse({ ...validData, type: "surgery" });
    expect(result.success).toBe(false);
  });

  it("accepts zero reminder days", () => {
    const result = visitFormSchema.safeParse({ ...validData, reminderDays: 0 });
    expect(result.success).toBe(true);
  });

  it("accepts notes with content", () => {
    const result = visitFormSchema.safeParse({
      ...validData,
      notes: "Bring vaccination records",
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing scheduledDate", () => {
    const { scheduledDate, ...withoutDate } = validData;
    const result = visitFormSchema.safeParse(withoutDate);
    expect(result.success).toBe(false);
  });
});
