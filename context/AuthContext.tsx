import { supabase } from "@/services/supabase";
import { type Session, type User } from "@supabase/supabase-js";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type PropsWithChildren,
} from "react";

type AuthContextValue = {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
};

const AuthContext = createContext<AuthContextValue>({
  user: null,
  session: null,
  isLoading: true,
});

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
      },
    );

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider
      value={{ user: session?.user ?? null, session, isLoading }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
