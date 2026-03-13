import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/constants/supabase";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    flowType: "pkce",
  },
});

/**
 * Returns the current authenticated user's ID.
 * The navigation guard in _layout.tsx ensures this is only called
 * when there is an active session.
 */
export async function ensureSession(): Promise<string> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) {
    throw new Error("No active session. User must be signed in.");
  }

  return session.user.id;
}
