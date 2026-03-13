import {
  useAnalysisDetailScreen,
  type Comparison,
} from "@/hooks/useAnalysisDetailScreen";
import type { LabValue } from "@/db/schema";
import { Ionicons } from "@expo/vector-icons";
import { Stack } from "expo-router";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from "react-native";

const colors = {
  light: {
    background: "#FFF0F5",
    cardBackground: "#ffffff",
    text: "#333",
    textSecondary: "#666",
    textTertiary: "#999",
    tint: "#D4517A",
    normal: "#4CAF50",
    high: "#FF9500",
    low: "#FF9500",
    critical: "#FF3B30",
    divider: "#f0c4d4",
  },
  dark: {
    background: "#1a0d12",
    cardBackground: "#2a1520",
    text: "#ffffff",
    textSecondary: "#aaaaaa",
    textTertiary: "#777",
    tint: "#F07098",
    normal: "#32D74B",
    high: "#FF9F0A",
    low: "#FF9F0A",
    critical: "#FF453A",
    divider: "#5a2f3f",
  },
};

function groupByCategory(labValues: LabValue[]): Record<string, LabValue[]> {
  const grouped: Record<string, LabValue[]> = {};
  for (const value of labValues) {
    const category = value.category ?? "Other Tests";
    if (!grouped[category]) {
      grouped[category] = [];
    }
    grouped[category].push(value);
  }
  return grouped;
}

export default function AnalysisDetailScreen() {
  const colorScheme = useColorScheme();
  const theme = colors[colorScheme ?? "light"];

  const { analysis, labValues, comparisons, isLoading } =
    useAnalysisDetailScreen();

  if (isLoading || !analysis) {
    return (
      <>
        <Stack.Screen options={{ title: "Lab Results" }} />
        <View style={[styles.loading, { backgroundColor: theme.background }]}>
          <ActivityIndicator size="large" color={theme.tint} />
        </View>
      </>
    );
  }

  if (analysis.status === "failed") {
    return (
      <>
        <Stack.Screen options={{ title: "Analysis Failed" }} />
        <View style={[styles.container, { backgroundColor: theme.background }]}>
          <View
            style={[
              styles.errorCard,
              { backgroundColor: theme.cardBackground },
            ]}
          >
            <Ionicons name="alert-circle" size={48} color={theme.critical} />
            <Text style={[styles.errorTitle, { color: theme.text }]}>
              Analysis Failed
            </Text>
            <Text
              style={[styles.errorText, { color: theme.textSecondary }]}
            >
              {analysis.errorMessage ?? "An unknown error occurred"}
            </Text>
          </View>
        </View>
      </>
    );
  }

  if (analysis.status !== "completed") {
    return (
      <>
        <Stack.Screen options={{ title: "Analyzing..." }} />
        <View style={[styles.loading, { backgroundColor: theme.background }]}>
          <ActivityIndicator size="large" color={theme.tint} />
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
            Analyzing PDF...
          </Text>
        </View>
      </>
    );
  }

  const groupedValues = groupByCategory(labValues);

  return (
    <>
      <Stack.Screen options={{ title: "Lab Results" }} />
      <ScrollView
        style={[styles.container, { backgroundColor: theme.background }]}
        contentInsetAdjustmentBehavior="automatic"
      >
        {analysis.summary && (
          <View style={styles.section}>
            <View
              style={[
                styles.card,
                { backgroundColor: theme.cardBackground },
              ]}
            >
              <View style={styles.cardHeader}>
                <Ionicons
                  name="document-text-outline"
                  size={22}
                  color={theme.tint}
                />
                <Text style={[styles.cardTitle, { color: theme.text }]}>
                  Summary
                </Text>
              </View>
              <Text style={[styles.cardBody, { color: theme.text }]}>
                {analysis.summary}
              </Text>
            </View>
          </View>
        )}

        {analysis.interpretation && (
          <View style={styles.section}>
            <View
              style={[
                styles.card,
                { backgroundColor: theme.cardBackground },
              ]}
            >
              <View style={styles.cardHeader}>
                <Ionicons name="medical" size={22} color={theme.tint} />
                <Text style={[styles.cardTitle, { color: theme.text }]}>
                  Clinical Interpretation
                </Text>
              </View>
              <Text style={[styles.cardBody, { color: theme.text }]}>
                {analysis.interpretation}
              </Text>
            </View>
          </View>
        )}

        {Object.entries(groupedValues).map(([category, values]) => (
          <View key={category} style={styles.section}>
            <Text style={[styles.categoryTitle, { color: theme.text }]}>
              {category}
            </Text>
            <View
              style={[
                styles.card,
                { backgroundColor: theme.cardBackground },
              ]}
            >
              {values.map((value, index) => (
                <LabValueRow
                  key={`${value.name}-${index}`}
                  value={value}
                  comparison={comparisons[value.name]}
                  theme={theme}
                  showDivider={index < values.length - 1}
                />
              ))}
            </View>
          </View>
        ))}

        <View style={styles.section}>
          <View
            style={[styles.metaCard, { backgroundColor: theme.cardBackground }]}
          >
            <Text style={[styles.metaText, { color: theme.textTertiary }]}>
              Analyzed on {analysis.analyzedAt?.toLocaleString()}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <View
            style={[styles.disclaimerCard, { backgroundColor: theme.high + "12" }]}
          >
            <Ionicons name="information-circle" size={20} color={theme.high} />
            <Text style={[styles.disclaimerText, { color: theme.textSecondary }]}>
              This analysis was generated by AI and is for informational
              purposes only. Always consult your veterinarian to confirm
              results and guide treatment decisions.
            </Text>
          </View>
        </View>
      </ScrollView>
    </>
  );
}

function LabValueRow({
  value,
  comparison,
  theme,
  showDivider,
}: {
  value: LabValue;
  comparison?: Comparison;
  theme: (typeof colors)["light"];
  showDivider: boolean;
}) {
  const statusColor = theme[value.status] ?? theme.textSecondary;

  return (
    <View style={styles.valueRow}>
      <View style={styles.valueTitleRow}>
        <Text style={[styles.valueName, { color: theme.text }]}>
          {value.name}
        </Text>
        <View
          style={[styles.statusBadge, { backgroundColor: statusColor + "20" }]}
        >
          <Text style={[styles.statusText, { color: statusColor }]}>
            {value.status.toUpperCase()}
          </Text>
        </View>
      </View>

      <Text style={[styles.valueNumber, { color: statusColor }]}>
        {value.value} {value.unit}
      </Text>
      <Text style={[styles.referenceRange, { color: theme.textSecondary }]}>
        Reference: {value.referenceRange}
      </Text>

      {comparison && (
        <View style={styles.comparisonRow}>
          <Ionicons
            name={
              comparison.trend === "up" ? "trending-up" : comparison.trend === "down" ? "trending-down" : "remove"
            }
            size={16}
            color={theme.textSecondary}
          />
          <Text style={[styles.comparisonText, { color: theme.textSecondary }]}>
            {comparison.change} from {comparison.previousValue} {value.unit} (
            {comparison.previousDate})
          </Text>
        </View>
      )}

      {showDivider && (
        <View style={[styles.divider, { backgroundColor: theme.divider }]} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  loadingText: { fontSize: 16 },
  errorCard: {
    margin: 16,
    padding: 24,
    borderRadius: 12,
    alignItems: "center",
    gap: 12,
  },
  errorTitle: { fontSize: 18, fontWeight: "600" },
  errorText: { fontSize: 16, textAlign: "center" },
  section: { marginTop: 16, paddingHorizontal: 16 },
  card: { borderRadius: 12, padding: 16 },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  cardTitle: { fontSize: 18, fontWeight: "600" },
  cardBody: { fontSize: 16, lineHeight: 24 },
  categoryTitle: { fontSize: 18, fontWeight: "600", marginBottom: 12 },
  valueRow: { marginVertical: 8 },
  valueTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  valueName: { fontSize: 16, fontWeight: "600", flex: 1, marginRight: 8 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 11, fontWeight: "700" },
  valueNumber: { fontSize: 20, fontWeight: "700", marginTop: 4 },
  referenceRange: { fontSize: 14, marginTop: 2 },
  comparisonRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
  },
  comparisonText: { fontSize: 14, flex: 1 },
  divider: { height: 1, marginTop: 16 },
  metaCard: {
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
  },
  metaText: { fontSize: 13 },
  disclaimerCard: {
    flexDirection: "row",
    borderRadius: 12,
    borderCurve: "continuous",
    padding: 14,
    gap: 10,
    alignItems: "flex-start",
    marginBottom: 32,
  },
  disclaimerText: {
    fontSize: 13,
    lineHeight: 18,
    flex: 1,
  },
});
