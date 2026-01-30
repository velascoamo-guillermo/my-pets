import { useCallback, useEffect, useState } from "react";
import {
  getFilesByPetId,
  createPetFile,
  deletePetFile,
} from "@/db/repositories/petFiles";
import { File as FSFile } from "expo-file-system";
import type { PetFile, NewPetFile } from "@/db/schema";

export function useFilesByPet(petId: string | undefined) {
  const [files, setFiles] = useState<PetFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadFiles = useCallback(async () => {
    if (!petId) {
      setFiles([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const data = await getFilesByPetId(petId);
      setFiles(data);
    } catch (err) {
      setError(
        err instanceof Error ? err : new Error("Failed to load files")
      );
    } finally {
      setIsLoading(false);
    }
  }, [petId]);

  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  return {
    files,
    isLoading,
    error,
    refetch: loadFiles,
  };
}

export function useAddPetFile() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const addFile = useCallback(
    async (data: Omit<NewPetFile, "id" | "createdAt">) => {
      try {
        setIsLoading(true);
        setError(null);
        const file = await createPetFile(data);
        return file;
      } catch (err) {
        const error =
          err instanceof Error ? err : new Error("Failed to add file");
        setError(error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return {
    addFile,
    isLoading,
    error,
  };
}

export function useDeletePetFile() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const removeFile = useCallback(async (id: string, fileUri: string) => {
    try {
      setIsLoading(true);
      setError(null);
      try {
        const file = new FSFile(fileUri);
        if (file.exists) {
          file.delete();
        }
      } catch {
        // File might already be gone, continue with DB deletion
      }
      await deletePetFile(id);
    } catch (err) {
      const error =
        err instanceof Error ? err : new Error("Failed to delete file");
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    removeFile,
    isLoading,
    error,
  };
}
