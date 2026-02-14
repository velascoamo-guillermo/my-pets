import { usePdfViewerScreen } from "@/hooks/usePdfViewerScreen";
import { Stack } from "expo-router";
import { ActivityIndicator, StyleSheet, View, useColorScheme } from "react-native";
import { WebView } from "react-native-webview";

const colors = {
  light: {
    background: "#ffffff",
  },
  dark: {
    background: "#000000",
  },
};

export default function PdfViewerScreen() {
  const colorScheme = useColorScheme();
  const theme = colors[colorScheme ?? "light"];
  const { file, isLoading } = usePdfViewerScreen();

  if (isLoading || !file) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // Prefer the remote URL (avoids special-char issues in local paths)
  // Fall back to the local file URI for unsynced files
  const pdfUri = file.remoteUri ?? file.uri;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Stack.Screen options={{ headerTitle: file.name }} />
      <WebView
        source={{ uri: pdfUri }}
        style={styles.pdf}
        originWhitelist={["*"]}
        allowFileAccess
        allowFileAccessFromFileURLs
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  pdf: {
    flex: 1,
  },
});
