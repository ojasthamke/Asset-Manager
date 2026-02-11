import React from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  Pressable,
  Platform,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useOrder } from "@/lib/OrderContext";
import { useTheme } from "@/lib/useTheme";
import { OrderHistoryEntry } from "@/lib/store";

function HistoryCard({
  entry,
  theme,
  onDelete,
}: {
  entry: OrderHistoryEntry;
  theme: ReturnType<typeof useTheme>;
  onDelete: (id: string) => void;
}) {
  const date = new Date(entry.date);
  const formattedDate = date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const formattedTime = date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <View style={[styles.historyCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <View style={[styles.vendorDot, { backgroundColor: theme.tint }]} />
          <View>
            <Text style={[styles.vendorName, { color: theme.text, fontFamily: "Poppins_600SemiBold" }]}>
              {entry.vendorName}
            </Text>
            <Text style={[styles.dateText, { color: theme.textSecondary, fontFamily: "Poppins_400Regular" }]}>
              {formattedDate} at {formattedTime}
            </Text>
          </View>
        </View>
        <Pressable
          onPress={() => onDelete(entry.id)}
          style={({ pressed }) => [styles.deleteBtn, { opacity: pressed ? 0.5 : 1 }]}
        >
          <Feather name="trash-2" size={16} color={theme.danger} />
        </Pressable>
      </View>

      <View style={[styles.itemsList, { borderTopColor: theme.border }]}>
        {entry.items.map((item, index) => (
          <View key={index} style={styles.historyItem}>
            <View style={[styles.itemDot, { backgroundColor: theme.tint + "40" }]} />
            <Text style={[styles.historyItemName, { color: theme.text, fontFamily: "Poppins_400Regular" }]}>
              {item.name}
            </Text>
            <Text style={[styles.historyItemQty, { color: theme.tint, fontFamily: "Poppins_500Medium" }]}>
              {item.quantity} {item.unit}
            </Text>
          </View>
        ))}
      </View>

      <View style={[styles.itemCountRow, { borderTopColor: theme.border }]}>
        <Ionicons name="cube-outline" size={14} color={theme.textSecondary} />
        <Text style={[styles.itemCountText, { color: theme.textSecondary, fontFamily: "Poppins_400Regular" }]}>
          {entry.items.length} item{entry.items.length !== 1 ? "s" : ""}
        </Text>
      </View>
    </View>
  );
}

export default function HistoryScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { history, deleteHistoryEntry, clearHistory } = useOrder();

  const handleDeleteEntry = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert("Delete Order", "Remove this order from history?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          deleteHistoryEntry(id);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        },
      },
    ]);
  };

  const handleClearAll = () => {
    Alert.alert("Clear History", "Remove all orders from history? This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Clear All",
        style: "destructive",
        onPress: () => {
          clearHistory();
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        },
      },
    ]);
  };

  const webTopInset = Platform.OS === "web" ? 67 : 0;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View
        style={[
          styles.header,
          {
            paddingTop: (insets.top || webTopInset) + 4,
            backgroundColor: theme.background,
          },
        ]}
      >
        <View style={styles.headerRow}>
          <View>
            <Text style={[styles.headerTitle, { color: theme.text, fontFamily: "Poppins_700Bold" }]}>
              Order History
            </Text>
            <Text style={[styles.headerSubtitle, { color: theme.textSecondary, fontFamily: "Poppins_400Regular" }]}>
              {history.length > 0 ? `${history.length} past order${history.length !== 1 ? "s" : ""}` : "No orders yet"}
            </Text>
          </View>
          {history.length > 0 && (
            <Pressable
              onPress={handleClearAll}
              style={({ pressed }) => [styles.clearBtn, { backgroundColor: theme.danger + "12", opacity: pressed ? 0.7 : 1 }]}
            >
              <Feather name="trash" size={14} color={theme.danger} />
              <Text style={[styles.clearBtnText, { color: theme.danger, fontFamily: "Poppins_500Medium" }]}>
                Clear
              </Text>
            </Pressable>
          )}
        </View>
      </View>

      <FlatList
        data={history}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.listContent, { paddingBottom: 100 }]}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <HistoryCard entry={item} theme={theme} onDelete={handleDeleteEntry} />
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={[styles.emptyIcon, { backgroundColor: theme.inputBg }]}>
              <Ionicons name="time-outline" size={40} color={theme.textSecondary} />
            </View>
            <Text style={[styles.emptyTitle, { color: theme.text, fontFamily: "Poppins_600SemiBold" }]}>
              No orders yet
            </Text>
            <Text style={[styles.emptyText, { color: theme.textSecondary, fontFamily: "Poppins_400Regular" }]}>
              Your sent orders will appear here so you can track what you ordered
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 12 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  headerTitle: { fontSize: 28, lineHeight: 34 },
  headerSubtitle: { fontSize: 13, marginTop: 2 },
  clearBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  clearBtnText: { fontSize: 12 },
  listContent: { padding: 16, gap: 12 },
  historyCard: { borderRadius: 16, borderWidth: 1, overflow: "hidden" },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 14,
  },
  cardHeaderLeft: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  vendorDot: { width: 8, height: 8, borderRadius: 4 },
  vendorName: { fontSize: 15 },
  dateText: { fontSize: 11, marginTop: 1 },
  deleteBtn: { padding: 8 },
  itemsList: { paddingHorizontal: 14, paddingBottom: 10, borderTopWidth: StyleSheet.hairlineWidth },
  historyItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    gap: 8,
  },
  itemDot: { width: 6, height: 6, borderRadius: 3 },
  historyItemName: { flex: 1, fontSize: 14 },
  historyItemQty: { fontSize: 13 },
  itemCountRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  itemCountText: { fontSize: 12 },
  emptyState: { alignItems: "center", justifyContent: "center", paddingTop: 100, gap: 12, paddingHorizontal: 40 },
  emptyIcon: { width: 80, height: 80, borderRadius: 40, alignItems: "center", justifyContent: "center", marginBottom: 8 },
  emptyTitle: { fontSize: 18 },
  emptyText: { fontSize: 14, textAlign: "center" as const, lineHeight: 20 },
});
