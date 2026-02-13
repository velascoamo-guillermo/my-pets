jest.mock("@/db/client", () => ({
  db: {
    select: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
}));

jest.mock("expo-crypto", () => ({
  randomUUID: () => "test-uuid-123",
}));

jest.mock("@/services/sync", () => ({
  pushDeleteToSupabase: jest.fn(),
}));

import { db } from "@/db/client";
import { pets } from "@/db/schema";
import * as syncService from "@/services/sync";
import {
  getAllPets,
  getPetById,
  createPet,
  updatePet,
  deletePet,
} from "@/db/repositories/pets";

const mockDb = db as jest.Mocked<typeof db>;

function chainMock(returnValue: unknown = []) {
  const chain: Record<string, jest.Mock> = {};
  chain.from = jest.fn().mockReturnValue(chain);
  chain.where = jest.fn().mockReturnValue(chain);
  chain.limit = jest.fn().mockResolvedValue(returnValue);
  chain.all = jest.fn().mockResolvedValue(returnValue);
  chain.set = jest.fn().mockReturnValue(chain);
  chain.values = jest.fn().mockResolvedValue(undefined);
  return chain;
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("pets repository", () => {
  describe("getAllPets", () => {
    it("returns all pets from db", async () => {
      const mockPets = [{ id: "1", name: "Buddy" }];
      const chain = chainMock(mockPets);
      (mockDb.select as jest.Mock).mockReturnValue(chain);

      const result = await getAllPets();

      expect(mockDb.select).toHaveBeenCalled();
      expect(chain.from).toHaveBeenCalledWith(pets);
      expect(result).toEqual(mockPets);
    });
  });

  describe("getPetById", () => {
    it("returns pet when found", async () => {
      const mockPet = { id: "1", name: "Buddy" };
      const chain = chainMock([mockPet]);
      (mockDb.select as jest.Mock).mockReturnValue(chain);

      const result = await getPetById("1");

      expect(result).toEqual(mockPet);
    });

    it("returns undefined when not found", async () => {
      const chain = chainMock([]);
      (mockDb.select as jest.Mock).mockReturnValue(chain);

      const result = await getPetById("nonexistent");

      expect(result).toBeUndefined();
    });
  });

  describe("createPet", () => {
    it("creates pet with UUID and pending sync status", async () => {
      const chain = chainMock();
      (mockDb.insert as jest.Mock).mockReturnValue(chain);

      const result = await createPet({
        name: "Buddy",
        species: "dog",
      });

      expect(result.id).toBe("test-uuid-123");
      expect(result.name).toBe("Buddy");
      expect(result.species).toBe("dog");
      expect(result.syncStatus).toBe("pending");
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.updatedAt).toBeInstanceOf(Date);
      expect(mockDb.insert).toHaveBeenCalledWith(pets);
    });
  });

  describe("updatePet", () => {
    it("sets updatedAt and syncStatus to pending", async () => {
      const updateChain = chainMock();
      (mockDb.update as jest.Mock).mockReturnValue(updateChain);

      const selectChain = chainMock([{ id: "1", name: "Updated" }]);
      (mockDb.select as jest.Mock).mockReturnValue(selectChain);

      await updatePet("1", { name: "Updated" });

      expect(mockDb.update).toHaveBeenCalledWith(pets);
      const setArg = updateChain.set.mock.calls[0][0];
      expect(setArg.name).toBe("Updated");
      expect(setArg.syncStatus).toBe("pending");
      expect(setArg.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe("deletePet", () => {
    it("pushes delete to Supabase when pet is synced", async () => {
      const syncedPet = { id: "1", name: "Buddy", syncStatus: "synced" };
      const selectChain = chainMock([syncedPet]);
      (mockDb.select as jest.Mock).mockReturnValue(selectChain);

      const deleteChain = chainMock();
      (mockDb.delete as jest.Mock).mockReturnValue(deleteChain);

      await deletePet("1");

      expect(syncService.pushDeleteToSupabase).toHaveBeenCalledWith("pets", "1");
      expect(mockDb.delete).toHaveBeenCalledWith(pets);
    });

    it("skips Supabase delete when pet is pending", async () => {
      const pendingPet = { id: "1", name: "Buddy", syncStatus: "pending" };
      const selectChain = chainMock([pendingPet]);
      (mockDb.select as jest.Mock).mockReturnValue(selectChain);

      const deleteChain = chainMock();
      (mockDb.delete as jest.Mock).mockReturnValue(deleteChain);

      await deletePet("1");

      expect(syncService.pushDeleteToSupabase).not.toHaveBeenCalled();
      expect(mockDb.delete).toHaveBeenCalledWith(pets);
    });
  });
});
