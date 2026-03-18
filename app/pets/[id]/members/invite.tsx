import { useInviteMemberScreen } from "@/hooks/useInviteMemberScreen";
import { Ionicons } from "@expo/vector-icons";
import { Stack } from "expo-router";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  useColorScheme,
  View,
} from "react-native";

const colors = {
  light: {
    background: "#FFF0F5",
    cardBackground: "#ffffff",
    text: "#333",
    textSecondary: "#666",
    textTertiary: "#999",
    tint: "#D4517A",
    inputBorder: "#e0c0cc",
  },
  dark: {
    background: "#1a0d12",
    cardBackground: "#2a1520",
    text: "#ffffff",
    textSecondary: "#aaaaaa",
    textTertiary: "#777",
    tint: "#F07098",
    inputBorder: "#4a2535",
  },
};

export default function InviteMemberScreen() {
  const colorScheme = useColorScheme();
  const theme = colors[colorScheme ?? "light"];
  const { email, setEmail, isLoading, handleSubmit } = useInviteMemberScreen();

  return (
    <>
      <Stack.Screen options={{ title: "Invite Member" }} />
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: theme.background }]}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.content}>
          <View style={[styles.iconContainer, { backgroundColor: "#fce4ec" }]}>
            <Ionicons name="person-add-outline" size={36} color={theme.tint} />
          </View>

          <Text style={[styles.title, { color: theme.text }]}>
            Invite someone
          </Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            They'll receive an invitation to access this pet's data.
          </Text>

          <View
            style={[
              styles.inputContainer,
              { backgroundColor: theme.cardBackground, borderColor: theme.inputBorder },
            ]}
          >
            <Ionicons name="mail-outline" size={20} color={theme.textTertiary} />
            <TextInput
              style={[styles.input, { color: theme.text }]}
              placeholder="Email address"
              placeholderTextColor={theme.textTertiary}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoFocus
              returnKeyType="send"
              onSubmitEditing={handleSubmit}
            />
          </View>

          <Pressable
            style={[
              styles.sendButton,
              { backgroundColor: theme.tint },
              isLoading && styles.sendButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="send-outline" size={18} color="#fff" />
                <Text style={styles.sendButtonText}>Send Invitation</Text>
              </>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 40,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  title: { fontSize: 24, fontWeight: "700", marginBottom: 8 },
  subtitle: { fontSize: 15, textAlign: "center", marginBottom: 32, lineHeight: 22 },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 4,
    gap: 10,
    marginBottom: 16,
  },
  input: { flex: 1, fontSize: 16, paddingVertical: 12 },
  sendButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    width: "100%",
    padding: 16,
    borderRadius: 12,
  },
  sendButtonDisabled: { opacity: 0.6 },
  sendButtonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
