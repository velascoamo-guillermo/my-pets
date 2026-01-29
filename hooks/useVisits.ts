import { useCallback, useEffect, useState } from "react";
import {
  getAllVisits,
  getVisitsByPetId,
  getUpcomingVisits,
  getVisitsByDateRange,
  getVisitById,
  createVisit,
  updateVisit,
  markVisitComplete,
  deleteVisit,
} from "@/db/repositories/visits";
import type { VetVisit, NewVetVisit } from "@/db/schema";

export function useVisits() {
  const [visits, setVisits] = useState<VetVisit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadVisits = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getAllVisits();
      setVisits(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to load visits"));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadVisits();
  }, [loadVisits]);

  return {
    visits,
    isLoading,
    error,
    refetch: loadVisits,
  };
}

export function useVisitsByPet(petId: string | undefined) {
  const [visits, setVisits] = useState<VetVisit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadVisits = useCallback(async () => {
    if (!petId) {
      setVisits([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const data = await getVisitsByPetId(petId);
      setVisits(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to load visits"));
    } finally {
      setIsLoading(false);
    }
  }, [petId]);

  useEffect(() => {
    loadVisits();
  }, [loadVisits]);

  return {
    visits,
    isLoading,
    error,
    refetch: loadVisits,
  };
}

export function useUpcomingVisits() {
  const [visits, setVisits] = useState<VetVisit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadVisits = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getUpcomingVisits();
      setVisits(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to load visits"));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadVisits();
  }, [loadVisits]);

  return {
    visits,
    isLoading,
    error,
    refetch: loadVisits,
  };
}

export function useVisitsByDateRange(startDate: Date, endDate: Date) {
  const [visits, setVisits] = useState<VetVisit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadVisits = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getVisitsByDateRange(startDate, endDate);
      setVisits(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to load visits"));
    } finally {
      setIsLoading(false);
    }
  }, [startDate.getTime(), endDate.getTime()]);

  useEffect(() => {
    loadVisits();
  }, [loadVisits]);

  return {
    visits,
    isLoading,
    error,
    refetch: loadVisits,
  };
}

export function useVisit(id: string | undefined) {
  const [visit, setVisit] = useState<VetVisit | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadVisit = useCallback(async () => {
    if (!id) {
      setVisit(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const data = await getVisitById(id);
      setVisit(data ?? null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to load visit"));
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadVisit();
  }, [loadVisit]);

  return {
    visit,
    isLoading,
    error,
    refetch: loadVisit,
  };
}

export function useCreateVisit() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const create = useCallback(
    async (
      data: Omit<NewVetVisit, "id" | "createdAt" | "updatedAt" | "syncStatus">
    ) => {
      try {
        setIsLoading(true);
        setError(null);
        const visit = await createVisit(data);
        return visit;
      } catch (err) {
        const error =
          err instanceof Error ? err : new Error("Failed to create visit");
        setError(error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return {
    create,
    isLoading,
    error,
  };
}

export function useUpdateVisit() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const update = useCallback(
    async (id: string, data: Partial<Omit<NewVetVisit, "id" | "createdAt">>) => {
      try {
        setIsLoading(true);
        setError(null);
        const visit = await updateVisit(id, data);
        return visit;
      } catch (err) {
        const error =
          err instanceof Error ? err : new Error("Failed to update visit");
        setError(error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return {
    update,
    isLoading,
    error,
  };
}

export function useMarkVisitComplete() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const markComplete = useCallback(async (id: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const visit = await markVisitComplete(id);
      return visit;
    } catch (err) {
      const error =
        err instanceof Error ? err : new Error("Failed to mark visit complete");
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    markComplete,
    isLoading,
    error,
  };
}

export function useDeleteVisit() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const remove = useCallback(async (id: string) => {
    try {
      setIsLoading(true);
      setError(null);
      await deleteVisit(id);
    } catch (err) {
      const error =
        err instanceof Error ? err : new Error("Failed to delete visit");
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    remove,
    isLoading,
    error,
  };
}
