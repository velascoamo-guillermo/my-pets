import { useCallback, useEffect, useState } from "react";
import {
  getAllPets,
  getPetById,
  createPet,
  updatePet,
  deletePet,
} from "@/db/repositories/pets";
import type { Pet, NewPet } from "@/db/schema";

export function usePets() {
  const [pets, setPets] = useState<Pet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadPets = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getAllPets();
      setPets(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to load pets"));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPets();
  }, [loadPets]);

  return {
    pets,
    isLoading,
    error,
    refetch: loadPets,
  };
}

export function usePet(id: string | undefined) {
  const [pet, setPet] = useState<Pet | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadPet = useCallback(async () => {
    if (!id) {
      setPet(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const data = await getPetById(id);
      setPet(data ?? null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to load pet"));
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadPet();
  }, [loadPet]);

  return {
    pet,
    isLoading,
    error,
    refetch: loadPet,
  };
}

export function useCreatePet() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const create = useCallback(
    async (
      data: Omit<NewPet, "id" | "createdAt" | "updatedAt" | "syncStatus">
    ) => {
      try {
        setIsLoading(true);
        setError(null);
        const pet = await createPet(data);
        return pet;
      } catch (err) {
        const error =
          err instanceof Error ? err : new Error("Failed to create pet");
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

export function useUpdatePet() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const update = useCallback(
    async (id: string, data: Partial<Omit<NewPet, "id" | "createdAt">>) => {
      try {
        setIsLoading(true);
        setError(null);
        const pet = await updatePet(id, data);
        return pet;
      } catch (err) {
        const error =
          err instanceof Error ? err : new Error("Failed to update pet");
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

export function useDeletePet() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const remove = useCallback(async (id: string) => {
    try {
      setIsLoading(true);
      setError(null);
      await deletePet(id);
    } catch (err) {
      const error =
        err instanceof Error ? err : new Error("Failed to delete pet");
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
