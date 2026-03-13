import {
  signInWithApple,
  signInWithEmail,
  signInWithGoogle,
  signUpWithEmail,
} from "@/services/auth";
import { useCallback, useState } from "react";
import { Platform } from "react-native";

type AuthMode = "login" | "signup";

export function useAuthScreen() {
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleToggleMode = useCallback(() => {
    setMode((prev) => (prev === "login" ? "signup" : "login"));
    setError(null);
  }, []);

  const handleEmailSubmit = useCallback(async () => {
    if (!email.trim() || !password.trim()) {
      setError("Please fill in all fields");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      if (mode === "login") {
        await signInWithEmail(email.trim(), password);
      } else {
        await signUpWithEmail(email.trim(), password);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setIsLoading(false);
    }
  }, [email, password, mode]);

  const handleGoogleSignIn = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      await signInWithGoogle();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Google sign-in failed");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleAppleSignIn = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      await signInWithApple();
    } catch (err) {
      // Ignore user cancel
      const isCancel =
        err instanceof Error && err.message.includes("canceled");
      if (!isCancel) {
        setError(err instanceof Error ? err.message : "Apple sign-in failed");
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    mode,
    email,
    password,
    isLoading,
    error,
    showApple: Platform.OS === "ios",
    setEmail,
    setPassword,
    handleToggleMode,
    handleEmailSubmit,
    handleGoogleSignIn,
    handleAppleSignIn,
  };
}
