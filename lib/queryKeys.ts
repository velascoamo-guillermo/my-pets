export const queryKeys = {
  pets: {
    all: ["pets"] as const,
    detail: (id: string) => ["pets", id] as const,
  },
  visits: {
    all: ["visits"] as const,
    byPet: (petId: string) => ["visits", { petId }] as const,
    detail: (id: string) => ["visits", id] as const,
    upcoming: ["visits", "upcoming"] as const,
    byDateRange: (start: number, end: number) =>
      ["visits", { start, end }] as const,
  },
  files: {
    byPet: (petId: string) => ["files", { petId }] as const,
    byVisit: (visitId: string) => ["files", { visitId }] as const,
  },
  analyses: {
    byFile: (fileId: string) => ["analyses", { fileId }] as const,
    byPet: (petId: string) => ["analyses", { petId }] as const,
    detail: (id: string) => ["analyses", id] as const,
  },
  syncStats: ["syncStats"] as const,
} as const;
