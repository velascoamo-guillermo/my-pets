import * as Sentry from "@sentry/react-native";
import { supabase } from "@/services/supabase";
import { syncWithSupabase } from "@/services/sync";
import { useEffect, useRef } from "react";
import { useNetworkStatus } from "./useNetworkStatus";

const DEBOUNCE_MS = 500;

export function useRealtimeSync() {
  const { isConnected } = useNetworkStatus();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isConnected) return;

    const channel = supabase
      .channel("db-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "pets" },
        () => debouncedSync(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "vet_visits" },
        () => debouncedSync(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "pet_files" },
        () => debouncedSync(),
      )
      .subscribe();

    function debouncedSync() {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        syncWithSupabase().catch((err) => Sentry.captureException(err));
      }, DEBOUNCE_MS);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      supabase.removeChannel(channel);
    };
  }, [isConnected]);
}
