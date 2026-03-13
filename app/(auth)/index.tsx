import { useAuthScreen } from "@/hooks/useAuthScreen";
import { Ionicons } from "@expo/vector-icons";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useColorScheme,
  View,
} from "react-native";

const PINK_DEEP = "#D4517A";

const colors = {
  light: {
    background: "#FFF0F5",
    card: "#ffffff",
    text: "#1a1a1a",
    textSecondary: "#888",
    input: "#ffffff",
    inputBorder: "#f0c4d4",
    inputText: "#1a1a1a",
    placeholder: "#bbb",
    tint: PINK_DEEP,
    google: "#ffffff",
    googleBorder: "#dadce0",
    googleText: "#3c4043",
    apple: "#000000",
    appleText: "#ffffff",
    separator: "#f0c4d4",
    separatorText: "#bbb",
    error: "#FF3B30",
    toggleText: PINK_DEEP,
  },
  dark: {
    background: "#1a0d12",
    card: "#2a1520",
    text: "#ffffff",
    textSecondary: "#aaaaaa",
    input: "#3a1f2a",
    inputBorder: "#5a2f3f",
    inputText: "#ffffff",
    placeholder: "#636366",
    tint: "#F07098",
    google: "#2a1520",
    googleBorder: "#5a2f3f",
    googleText: "#ffffff",
    apple: "#ffffff",
    appleText: "#000000",
    separator: "#5a2f3f",
    separatorText: "#636366",
    error: "#FF453A",
    toggleText: "#F07098",
  },
};


export default function AuthScreen() {
  const colorScheme = useColorScheme();
  const theme = colors[colorScheme ?? "light"];
  const {
    mode,
    email,
    password,
    isLoading,
    error,
    showApple,
    setEmail,
    setPassword,
    handleToggleMode,
    handleEmailSubmit,
    handleGoogleSignIn,
    handleAppleSignIn,
  } = useAuthScreen();

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>🐾</Text>
          <Text style={[styles.appName, { color: theme.text }]}>My Pets</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            {mode === "login"
              ? "Sign in to access your pets"
              : "Create an account to get started"}
          </Text>
        </View>

        {/* Card */}
        <View style={[styles.card, { backgroundColor: theme.card }]}>
          {/* Email input */}
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: theme.input,
                borderColor: theme.inputBorder,
                color: theme.inputText,
              },
            ]}
            placeholder="Email"
            placeholderTextColor={theme.placeholder}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            returnKeyType="next"
          />

          {/* Password input */}
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: theme.input,
                borderColor: theme.inputBorder,
                color: theme.inputText,
              },
            ]}
            placeholder="Password"
            placeholderTextColor={theme.placeholder}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            returnKeyType="done"
            onSubmitEditing={handleEmailSubmit}
          />

          {/* Error */}
          {error ? (
            <Text style={[styles.errorText, { color: theme.error }]}>
              {error}
            </Text>
          ) : null}

          {/* Submit */}
          <Pressable
            style={[
              styles.primaryButton,
              { backgroundColor: theme.tint },
              isLoading && styles.buttonDisabled,
            ]}
            onPress={handleEmailSubmit}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryButtonText}>
                {mode === "login" ? "Sign In" : "Create Account"}
              </Text>
            )}
          </Pressable>

          {/* Separator */}
          <View style={styles.separatorRow}>
            <View
              style={[styles.separatorLine, { backgroundColor: theme.separator }]}
            />
            <Text style={[styles.separatorText, { color: theme.separatorText }]}>
              or
            </Text>
            <View
              style={[styles.separatorLine, { backgroundColor: theme.separator }]}
            />
          </View>

          {/* Google */}
          <Pressable
            style={[
              styles.socialButton,
              {
                backgroundColor: theme.google,
                borderColor: theme.googleBorder,
              },
              isLoading && styles.buttonDisabled,
            ]}
            onPress={handleGoogleSignIn}
            disabled={isLoading}
          >
            <Ionicons name="logo-google" size={20} color={theme.googleText} />
            <Text style={[styles.socialButtonText, { color: theme.googleText }]}>
              Continue with Google
            </Text>
          </Pressable>

          {/* Apple */}
          {showApple ? (
            <Pressable
              style={[
                styles.socialButton,
                {
                  backgroundColor: theme.apple,
                  borderColor: theme.apple,
                },
                isLoading && styles.buttonDisabled,
              ]}
              onPress={handleAppleSignIn}
              disabled={isLoading}
            >
              <Ionicons name="logo-apple" size={20} color={theme.appleText} />
              <Text
                style={[styles.socialButtonText, { color: theme.appleText }]}
              >
                Continue with Apple
              </Text>
            </Pressable>
          ) : null}
        </View>

        {/* Toggle mode */}
        <Pressable style={styles.toggleRow} onPress={handleToggleMode}>
          <Text style={[styles.toggleText, { color: theme.textSecondary }]}>
            {mode === "login"
              ? "Don't have an account? "
              : "Already have an account? "}
          </Text>
          <Text style={[styles.toggleLink, { color: theme.toggleText }]}>
            {mode === "login" ? "Sign up" : "Sign in"}
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 24,
  },
  header: { alignItems: "center", marginBottom: 32 },
  logo: { fontSize: 64, marginBottom: 8 },
  appName: { fontSize: 32, fontWeight: "700", marginBottom: 8 },
  subtitle: { fontSize: 16, textAlign: "center" },
  card: {
    borderRadius: 16,
    padding: 20,
    gap: 12,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 16,
  },
  errorText: { fontSize: 14, textAlign: "center" },
  primaryButton: {
    height: 48,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonDisabled: { opacity: 0.6 },
  primaryButtonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  separatorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginVertical: 4,
  },
  separatorLine: { flex: 1, height: 1 },
  separatorText: { fontSize: 14 },
  socialButton: {
    height: 48,
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
  },
  socialButtonText: { fontSize: 16, fontWeight: "500" },
  toggleRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 24,
  },
  toggleText: { fontSize: 15 },
  toggleLink: { fontSize: 15, fontWeight: "600" },
});
