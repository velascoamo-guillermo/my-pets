jest.mock("@/db/client", () => ({
  db: {
    select: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
}));

jest.mock("expo-crypto", () => ({
  randomUUID: () => "test-visit-uuid",
}));

jest.mock("@/services/sync", () => ({
  pushDeleteToSupabase: jest.fn(),
}));

import { db } from "@/db/client";
import { vetVisits } from "@/db/schema";
import * as syncService from "@/services/sync";
import {
  getAllVisits,
  createVisit,
  updateVisit,
  markVisitComplete,
  deleteVisit,
} from "@/db/repositories/visits";

const mockDb = db as jest.Mocked<typeof db>;

function chainMock(returnValue: unknown = []) {
  const chain: Record<string, jest.Mock> = {};
  chain.from = jest.fn().mockReturnValue(chain);
  chain.where = jest.fn().mockReturnValue(chain);
  chain.limit = jest.fn().mockResolvedValue(returnValue);
  chain.all = jest.fn().mockResolvedValue(returnValue);
  chain.orderBy = jest.fn().mockReturnValue(chain);
  chain.set = jest.fn().mockReturnValue(chain);
  chain.values = jest.fn().mockResolvedValue(undefined);
  return chain;
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("visits repository", () => {
  describe("getAllVisits", () => {
    it("returns visits ordered by scheduled date", async () => {
      const mockVisits = [{ id: "1", title: "Checkup" }];
      const chain = chainMock(mockVisits);
      (mockDb.select as jest.Mock).mockReturnValue(chain);

      const result = await getAllVisits();

      expect(mockDb.select).toHaveBeenCalled();
      expect(chain.from).toHaveBeenCalledWith(vetVisits);
      expect(chain.orderBy).toHaveBeenCalled();
      expect(result).toEqual(mockVisits);
    });
  });

  describe("createVisit", () => {
    it("creates visit with UUID and pending sync status", async () => {
      const chain = chainMock();
      (mockDb.insert as jest.Mock).mockReturnValue(chain);

      const result = await createVisit({
        petId: "pet-1",
        type: "checkup",
        title: "Annual checkup",
        notes: undefined,
        scheduledDate: new Date("2025-06-15"),
        reminderDays: 1,
        completed: false,
      });

      expect(result.id).toBe("test-visit-uuid");
      expect(result.petId).toBe("pet-1");
      expect(result.type).toBe("checkup");
      expect(result.title).toBe("Annual checkup");
      expect(result.syncStatus).toBe("pending");
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.updatedAt).toBeInstanceOf(Date);
      expect(mockDb.insert).toHaveBeenCalledWith(vetVisits);
    });
  });

  describe("updateVisit", () => {
    it("sets updatedAt and syncStatus to pending", async () => {
      const updateChain = chainMock();
      (mockDb.update as jest.Mock).mockReturnValue(updateChain);

      const selectChain = chainMock([{ id: "1", title: "Updated" }]);
      (mockDb.select as jest.Mock).mockReturnValue(selectChain);

      await updateVisit("1", { title: "Updated" });

      expect(mockDb.update).toHaveBeenCalledWith(vetVisits);
      const setArg = updateChain.set.mock.calls[0][0];
      expect(setArg.title).toBe("Updated");
      expect(setArg.syncStatus).toBe("pending");
      expect(setArg.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe("markVisitComplete", () => {
    it("sets completed to true with completedDate", async () => {
      const updateChain = chainMock();
      (mockDb.update as jest.Mock).mockReturnValue(updateChain);

      const selectChain = chainMock([{ id: "1", completed: true }]);
      (mockDb.select as jest.Mock).mockReturnValue(selectChain);

      await markVisitComplete("1");

      const setArg = updateChain.set.mock.calls[0][0];
      expect(setArg.completed).toBe(true);
      expect(setArg.completedDate).toBeInstanceOf(Date);
      expect(setArg.syncStatus).toBe("pending");
    });
  });

  describe("deleteVisit", () => {
    it("pushes delete to Supabase when visit is synced", async () => {
      const syncedVisit = { id: "1", syncStatus: "synced" };
      const selectChain = chainMock([syncedVisit]);
      (mockDb.select as jest.Mock).mockReturnValue(selectChain);

      const deleteChain = chainMock();
      (mockDb.delete as jest.Mock).mockReturnValue(deleteChain);

      await deleteVisit("1");

      expect(syncService.pushDeleteToSupabase).toHaveBeenCalledWith("vet_visits", "1");
      expect(mockDb.delete).toHaveBeenCalledWith(vetVisits);
    });

    it("skips Supabase delete when visit is pending", async () => {
      const pendingVisit = { id: "1", syncStatus: "pending" };
      const selectChain = chainMock([pendingVisit]);
      (mockDb.select as jest.Mock).mockReturnValue(selectChain);

      const deleteChain = chainMock();
      (mockDb.delete as jest.Mock).mockReturnValue(deleteChain);

      await deleteVisit("1");

      expect(syncService.pushDeleteToSupabase).not.toHaveBeenCalled();
      expect(mockDb.delete).toHaveBeenCalledWith(vetVisits);
    });
  });
});
