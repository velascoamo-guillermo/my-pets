import type { Pet } from "@/db/schema";
import { Ionicons } from "@expo/vector-icons";
import { GlassView, isLiquidGlassAvailable } from "expo-glass-effect";
import { Image } from "expo-image";
import {
  Pressable,
  StyleSheet,
  Text,
  useColorScheme,
  useWindowDimensions,
  View,
} from "react-native";

const GRID_PADDING = 16;
const CARD_GAP = 12;
const NUM_COLUMNS = 2;

const glassAvailable = isLiquidGlassAvailable();

type PetCardProps = {
  pet: Pet;
  onPress: () => void;
};

export function PetCard({ pet, onPress }: PetCardProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const { width } = useWindowDimensions();

  const cardWidth = (width - GRID_PADDING * 2 - CARD_GAP) / NUM_COLUMNS;
  const cardHeight = cardWidth * 1.25;

  const NameOverlay = glassAvailable ? GlassView : View;

  return (
    <Pressable
      testID={`pet-card-${pet.id}`}
      accessibilityLabel={pet.name}
      style={({ pressed }) => [
        styles.card,
        {
          width: cardWidth,
          height: cardHeight,
          backgroundColor: isDark ? "#1c1c1e" : "#ffffff",
        },
        pressed && styles.cardPressed,
      ]}
      onPress={onPress}
    >
      {pet.imageUri ? (
        <Image
          source={{ uri: pet.imageUri }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
        />
      ) : (
        <View
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: isDark ? "#2c2c2e" : "#f0f0f0",
              justifyContent: "center",
              alignItems: "center",
            },
          ]}
        >
          <Ionicons name="paw" size={56} color={isDark ? "#555" : "#ccc"} />
        </View>
      )}
      {pet.syncStatus === "pending" && (
        <View style={styles.syncBadge}>
          <Ionicons name="cloud-upload-outline" size={14} color="#fff" />
        </View>
      )}
      <NameOverlay
        style={[
          styles.nameContainer,
          !glassAvailable && styles.nameContainerFallback,
        ]}
      >
        <Text style={styles.name} numberOfLines={1}>
          {pet.name}
        </Text>
      </NameOverlay>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderCurve: "continuous",
    overflow: "hidden",
  },
  cardPressed: {
    opacity: 0.85,
  },
  nameContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  nameContainerFallback: {
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  name: {
    color: "#ffffff",
    fontSize: 17,
    fontWeight: "700",
  },
  syncBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "rgba(255,149,0,0.85)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
});
