import * as AppleAuthentication from "expo-apple-authentication";
import * as WebBrowser from "expo-web-browser";
import { supabase } from "./supabase";

WebBrowser.maybeCompleteAuthSession();

export async function signInWithEmail(
  email: string,
  password: string,
): Promise<void> {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
}

export async function signUpWithEmail(
  email: string,
  password: string,
): Promise<void> {
  const { error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
}

export async function signInWithGoogle(): Promise<void> {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: "mypets://",
      skipBrowserRedirect: true,
      queryParams: {
        prompt: "select_account",
      },
    },
  });

  if (error) throw error;
  if (!data.url) throw new Error("No OAuth URL returned");

  const result = await WebBrowser.openAuthSessionAsync(data.url, "mypets://");

  if (result.type === "success") {
    const codeMatch = result.url.match(/[?&]code=([^&%#]+)/);
    if (!codeMatch) throw new Error("No auth code in redirect URL");
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(codeMatch[1]);
    if (exchangeError) throw exchangeError;
  }
}

export async function signInWithApple(): Promise<void> {
  const credential = await AppleAuthentication.signInAsync({
    requestedScopes: [
      AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      AppleAuthentication.AppleAuthenticationScope.EMAIL,
    ],
  });

  if (!credential.identityToken) {
    throw new Error("No identity token from Apple");
  }

  const { error } = await supabase.auth.signInWithIdToken({
    provider: "apple",
    token: credential.identityToken,
  });

  if (error) throw error;
}

export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}
