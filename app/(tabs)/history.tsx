import React, { useMemo } from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  Pressable,
  Platform,
  Alert,
} from "react-native";
import { router } from "expo-router";
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
  onRepeat,
}: {
  entry: any;
  theme: ReturnType<typeof useTheme>;
  onDelete: (id: string) => void;
  onRepeat: (entry: any) => void;
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

  // Calculate total for this specific order
  const orderTotal = entry.items.reduce((sum: number, i: any) => sum + (parseFloat(i.price || "0") * i.quantity), 0);

  return (
    <View style={[styles.historyCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
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
        {entry.items.map((item: any, index: number) => (
          <View key={index} style={styles.historyItem}>
            <View style={[styles.itemDot, { backgroundColor: theme.tint + "40" }]} />
            <Text style={[styles.historyItemName, { color: theme.text, fontFamily: "Poppins_400Regular" }]}>
              {item.name}
            </Text>
            <Text style={[styles.historyItemQty, { color: theme.textSecondary, fontFamily: "Poppins_500Medium" }]}>
              {item.quantity} {item.unit}
            </Text>
          </View>
        ))}
      </View>

      <View style={[styles.cardFooter, { borderTopColor: theme.border }]}>
        <View>
          <Text style={[styles.totalLabel, { color: theme.textSecondary }]}>Order Total</Text>
          <Text style={[styles.totalValue, { color: theme.text, fontFamily: "Poppins_700Bold" }]}>₹{orderTotal.toFixed(2)}</Text>
        </View>
        <Pressable
          onPress={() => onRepeat(entry)}
          style={({ pressed }) => [
            styles.repeatBtn,
            { backgroundColor: theme.tint, opacity: pressed ? 0.8 : 1 }
          ]}
        >
          <Ionicons name="refresh" size={16} color="#fff" />
          <Text style={[styles.repeatBtnText, { fontFamily: "Poppins_600SemiBold" }]}>Repeat</Text>
        </Pressable>
      </View>
    </View>
  );
}

export default function HistoryScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { history, deleteHistoryEntry, clearHistory, vendors, items: allItems, setItemsDirectly } = useOrder();

  const totalSpent = useMemo(() => {
    return history.reduce((total, entry: any) => {
      const entryTotal = entry.items.reduce((sum: number, i: any) => sum + (parseFloat(i.price || "0") * i.quantity), 0);
      return total + entryTotal;
    }, 0);
  }, [history]);

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

  const handleRepeatOrder = (entry: any) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Find the vendor ID from the name (safest way given history schema)
    const vendor = vendors.find(v => v.name === entry.vendorName);
    if (!vendor) {
      Alert.alert("Error", "This vendor is no longer available.");
      return;
    }

    // Create selection list based on history items
    const repeatItems = allItems.map(item => {
      const historyItem = entry.items.find((hi: any) => hi.name === item.name);
      if (historyItem) {
        return { ...item, selected: true, quantity: historyItem.quantity };
      }
      return { ...item, selected: false };
    });

    setItemsDirectly(repeatItems);

    router.push({
      pathname: "/preview",
      params: { vendorId: vendor.id }
    });
  };

  const handleClearAll = () => {
    Alert.alert("Clear History", "Remove all orders? This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      { text: "Clear All", style: "destructive", onPress: () => clearHistory() },
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <View style={styles.headerRow}>
          <View>
            <Text style={[styles.headerTitle, { color: theme.text, fontFamily: "Poppins_800ExtraBold" }]}>History</Text>
            <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>Track your spending</Text>
          </View>
          {history.length > 0 && (
            <Pressable onPress={handleClearAll} style={styles.clearBtn}>
              <Text style={[styles.clearText, { color: theme.danger, fontFamily: 'Poppins_600SemiBold' }]}>Clear All</Text>
            </Pressable>
          )}
        </View>

        {/* Stats Card */}
        <View style={[styles.statsCard, { backgroundColor: theme.tint }]}>
          <View>
            <Text style={styles.statsLabel}>TOTAL SPENT</Text>
            <Text style={styles.statsValue}>₹{totalSpent.toFixed(2)}</Text>
          </View>
          <View style={styles.statsIcon}>
            <Ionicons name="wallet" size={32} color="rgba(255,255,255,0.3)" />
          </View>
        </View>
      </View>

      <FlatList
        data={history}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.listContent, { paddingBottom: 100 }]}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <HistoryCard entry={item} theme={theme} onDelete={handleDeleteEntry} onRepeat={handleRepeatOrder} />
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="time-outline" size={64} color={theme.textSecondary} />
            <Text style={[styles.emptyTitle, { color: theme.text, fontFamily: "Poppins_700Bold" }]}>No History</Text>
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>Your sent orders will appear here.</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 24, paddingBottom: 20 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  headerTitle: { fontSize: 32 },
  headerSubtitle: { fontSize: 14, opacity: 0.6 },
  clearBtn: { padding: 4 },
  clearText: { fontSize: 13 },
  statsCard: { padding: 24, borderRadius: 24, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', shadowColor: "#000", shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 20, elevation: 8 },
  statsLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 12, fontFamily: 'Poppins_700Bold', letterSpacing: 1 },
  statsValue: { color: '#fff', fontSize: 32, fontFamily: 'Poppins_800ExtraBold', marginTop: 4 },
  statsIcon: {},
  listContent: { padding: 20, gap: 16 },
  historyCard: { borderRadius: 24, borderWidth: 1.5, overflow: "hidden" },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16 },
  cardHeaderLeft: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  vendorDot: { width: 10, height: 10, borderRadius: 5 },
  vendorName: { fontSize: 16 },
  dateText: { fontSize: 11 },
  deleteBtn: { padding: 8 },
  itemsList: { paddingHorizontal: 16, paddingBottom: 12, borderTopWidth: StyleSheet.hairlineWidth },
  historyItem: { flexDirection: "row", alignItems: "center", paddingVertical: 6, gap: 10 },
  itemDot: { width: 6, height: 6, borderRadius: 3 },
  historyItemName: { flex: 1, fontSize: 14 },
  historyItemQty: { fontSize: 12 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: 'rgba(0,0,0,0.02)', borderTopWidth: StyleSheet.hairlineWidth },
  totalLabel: { fontSize: 10, fontFamily: 'Poppins_700Bold', letterSpacing: 0.5, textTransform: 'uppercase' },
  totalValue: { fontSize: 18, marginTop: 2 },
  repeatBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
  repeatBtnText: { color: '#fff', fontSize: 13 },
  emptyState: { alignItems: "center", justifyContent: "center", paddingTop: 100, gap: 12 },
  emptyTitle: { fontSize: 20 },
  emptyText: { fontSize: 14, textAlign: "center" },
});
