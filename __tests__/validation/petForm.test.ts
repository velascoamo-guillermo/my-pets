import { petFormSchema } from "@/lib/schemas/petForm";

describe("petFormSchema", () => {
  const validData = {
    name: "Buddy",
    species: "dog" as const,
    birthDate: new Date("2020-01-01"),
    imageUri: null,
    vetName: "",
    vetPhone: "",
    vetAddress: "",
  };

  it("accepts valid pet data", () => {
    const result = petFormSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("accepts cat species", () => {
    const result = petFormSchema.safeParse({ ...validData, species: "cat" });
    expect(result.success).toBe(true);
  });

  it("accepts null birthDate", () => {
    const result = petFormSchema.safeParse({ ...validData, birthDate: null });
    expect(result.success).toBe(true);
  });

  it("rejects empty name", () => {
    const result = petFormSchema.safeParse({ ...validData, name: "" });
    expect(result.success).toBe(false);
  });

  it("rejects missing name", () => {
    const { name, ...withoutName } = validData;
    const result = petFormSchema.safeParse(withoutName);
    expect(result.success).toBe(false);
  });

  it("rejects invalid species", () => {
    const result = petFormSchema.safeParse({ ...validData, species: "bird" });
    expect(result.success).toBe(false);
  });

  it("accepts string imageUri", () => {
    const result = petFormSchema.safeParse({
      ...validData,
      imageUri: "file:///path/to/image.jpg",
    });
    expect(result.success).toBe(true);
  });

  it("accepts optional vet fields as empty strings", () => {
    const result = petFormSchema.safeParse({
      ...validData,
      vetName: "Dr. Smith",
      vetPhone: "555-1234",
      vetAddress: "123 Main St",
    });
    expect(result.success).toBe(true);
  });
});
