import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, useColorScheme } from "react-native";
import Animated, {
  useAnimatedStyle,
  useDerivedValue,
  withTiming,
} from "react-native-reanimated";

const colors = {
  light: {
    background: "#FFF3E0",
    text: "#E65100",
    icon: "#F57C00",
  },
  dark: {
    background: "#3E2723",
    text: "#FFB74D",
    icon: "#FFA726",
  },
};

export function OfflineBanner() {
  const { isConnected } = useNetworkStatus();
  const colorScheme = useColorScheme();
  const theme = colors[colorScheme ?? "light"];

  const height = useDerivedValue(() =>
    withTiming(isConnected ? 0 : 44, { duration: 300 }),
  );

  const opacity = useDerivedValue(() =>
    withTiming(isConnected ? 0 : 1, { duration: 300 }),
  );

  const animatedStyle = useAnimatedStyle(() => ({
    height: height.value,
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.container,
        { backgroundColor: theme.background },
        animatedStyle,
      ]}
    >
      <Ionicons name="cloud-offline-outline" size={16} color={theme.icon} />
      <Text style={[styles.text, { color: theme.text }]}>
        You are offline — changes will sync when connected
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    overflow: "hidden",
    paddingHorizontal: 16,
  },
  text: {
    fontSize: 13,
    fontWeight: "500",
  },
});
