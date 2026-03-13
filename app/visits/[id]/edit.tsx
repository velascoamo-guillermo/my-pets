import { VisitForm } from "@/components/VisitForm";
import { useEditVisitScreen } from "@/hooks/useEditVisitScreen";
import { Stack } from "expo-router";
import {
  View,
  ActivityIndicator,
  StyleSheet,
  useColorScheme,
} from "react-native";

const colors = {
  light: {
    background: "#FFF0F5",
    tint: "#D4517A",
  },
  dark: {
    background: "#1a0d12",
    tint: "#F07098",
  },
};

export default function EditVisitScreen() {
  const colorScheme = useColorScheme();
  const theme = colors[colorScheme ?? "light"];
  const { visit, isLoading, handleSubmit } = useEditVisitScreen();

  if (isLoading || !visit) {
    return (
      <>
        <Stack.Screen options={{ title: "Edit Visit" }} />
        <View style={[styles.loading, { backgroundColor: theme.background }]}>
          <ActivityIndicator size="large" color={theme.tint} />
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: "Edit Visit" }} />
      <VisitForm
        initialData={visit}
        onSubmit={handleSubmit}
        submitLabel="Save Changes"
      />
    </>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
