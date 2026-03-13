import { useAnalyzingScreen } from "@/hooks/useAnalyzingScreen";
import { Ionicons } from "@expo/vector-icons";
import { GlassView, isLiquidGlassAvailable } from "expo-glass-effect";
import { useEffect } from "react";
import { Pressable, StyleSheet, Text, View, useColorScheme } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from "react-native-reanimated";

const colors = {
  light: {
    background: "#FFF0F5",
    cardBackground: "#ffffff",
    text: "#333",
    textSecondary: "#666",
    tint: "#D4517A",
    critical: "#FF3B30",
  },
  dark: {
    background: "#1a0d12",
    cardBackground: "#2a1520",
    text: "#ffffff",
    textSecondary: "#aaaaaa",
    tint: "#F07098",
    critical: "#FF453A",
  },
};

function PulsingIcon({ color }: { color: string }) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.6);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.15, { duration: 800, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
    );
    opacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.6, { duration: 800, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
    );
  }, [scale, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.iconCircle, { backgroundColor: color + "15" }, animatedStyle]}>
      <Ionicons name="document-text" size={40} color={color} />
    </Animated.View>
  );
}

function LoadingDots({ color }: { color: string }) {
  const dot1 = useSharedValue(0);
  const dot2 = useSharedValue(0);
  const dot3 = useSharedValue(0);

  useEffect(() => {
    const duration = 400;
    const delay = 150;

    dot1.value = withRepeat(
      withSequence(
        withTiming(1, { duration }),
        withTiming(0, { duration }),
        withTiming(0, { duration: delay * 2 }),
      ),
      -1,
    );
    dot2.value = withRepeat(
      withSequence(
        withTiming(0, { duration: delay }),
        withTiming(1, { duration }),
        withTiming(0, { duration }),
        withTiming(0, { duration: delay }),
      ),
      -1,
    );
    dot3.value = withRepeat(
      withSequence(
        withTiming(0, { duration: delay * 2 }),
        withTiming(1, { duration }),
        withTiming(0, { duration }),
      ),
      -1,
    );
  }, [dot1, dot2, dot3]);

  const style1 = useAnimatedStyle(() => ({ opacity: 0.3 + dot1.value * 0.7 }));
  const style2 = useAnimatedStyle(() => ({ opacity: 0.3 + dot2.value * 0.7 }));
  const style3 = useAnimatedStyle(() => ({ opacity: 0.3 + dot3.value * 0.7 }));

  return (
    <View style={styles.dotsContainer}>
      <Animated.View style={[styles.dot, { backgroundColor: color }, style1]} />
      <Animated.View style={[styles.dot, { backgroundColor: color }, style2]} />
      <Animated.View style={[styles.dot, { backgroundColor: color }, style3]} />
    </View>
  );
}

const hasGlass = isLiquidGlassAvailable();
const CardWrapper = hasGlass ? GlassView : View;

export default function AnalyzingScreen() {
  const colorScheme = useColorScheme();
  const theme = colors[colorScheme ?? "light"];
  const { isError, errorMessage, handleClose } = useAnalyzingScreen();

  const containerBg = hasGlass ? "transparent" : theme.background;
  const cardBg = hasGlass ? undefined : theme.cardBackground;

  if (isError) {
    return (
      <View style={[styles.container, { backgroundColor: containerBg }]}>
        <CardWrapper style={[styles.card, cardBg && { backgroundColor: cardBg }]}>
          <View style={[styles.iconCircle, { backgroundColor: theme.critical + "15" }]}>
            <Ionicons name="alert-circle" size={40} color={theme.critical} />
          </View>
          <Text style={[styles.title, { color: theme.text }]}>
            Analysis Failed
          </Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            {errorMessage}
          </Text>
          <Pressable
            style={[styles.closeButton, { backgroundColor: theme.tint }]}
            onPress={handleClose}
          >
            <Text style={styles.closeButtonText}>Close</Text>
          </Pressable>
        </CardWrapper>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: containerBg }]}>
      <CardWrapper style={[styles.card, cardBg && { backgroundColor: cardBg }]}>
        <PulsingIcon color={theme.tint} />
        <Text style={[styles.title, { color: theme.text }]}>
          Analyzing your PDF
        </Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          Extracting lab values and generating interpretation...
        </Text>
        <LoadingDots color={theme.tint} />
      </CardWrapper>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  card: {
    width: "100%",
    borderRadius: 20,
    borderCurve: "continuous",
    padding: 32,
    alignItems: "center",
    gap: 16,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
  },
  dotsContainer: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  closeButton: {
    marginTop: 8,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 12,
    borderCurve: "continuous",
  },
  closeButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
