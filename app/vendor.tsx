import React, { useState } from "react";
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
import { getUnitLabel } from "@/lib/store";

export default function VendorScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { vendors, items } = useOrder();
  const [selectedVendorId, setSelectedVendorId] = useState<string | null>(null);

  const selectedItems = items.filter((i) => i.selected);
  const selectedVendor = vendors.find((v) => v.id === selectedVendorId);

  const handleSendOrder = () => {
    if (!selectedVendor) {
      Alert.alert("Select a vendor", "Please choose a vendor to send your order to.");
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({
      pathname: "/preview",
      params: { vendorId: selectedVendor.id },
    });
  };

  const webTopInset = Platform.OS === "web" ? 67 : 0;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View
        style={[
          styles.header,
          {
            paddingTop: (insets.top || webTopInset) + 8,
            backgroundColor: theme.background,
          },
        ]}
      >
        <View style={styles.headerRow}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [styles.backBtn, { opacity: pressed ? 0.6 : 1, backgroundColor: theme.surface }]}
          >
            <Ionicons name="arrow-back" size={22} color={theme.text} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={[styles.headerTitle, { color: theme.text, fontFamily: "Poppins_700Bold" }]}>
              Choose Vendor
            </Text>
            <Text style={[styles.headerSubtitle, { color: theme.textSecondary, fontFamily: "Poppins_400Regular" }]}>
              {selectedItems.length} item{selectedItems.length !== 1 ? "s" : ""} in your order
            </Text>
          </View>
        </View>

        <View style={[styles.itemSummary, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.summaryLabel, { color: theme.textSecondary, fontFamily: "Poppins_400Regular" }]}>
            Order Summary
          </Text>
          <View style={styles.summaryChips}>
            {selectedItems.slice(0, 4).map((item) => (
              <View key={item.id} style={[styles.summaryChip, { backgroundColor: theme.tint + "12" }]}>
                <Text style={[styles.summaryChipText, { color: theme.tint, fontFamily: "Poppins_500Medium" }]}>
                  {item.name} ({item.quantity} {getUnitLabel(item.unit)})
                </Text>
              </View>
            ))}
            {selectedItems.length > 4 && (
              <View style={[styles.summaryChip, { backgroundColor: theme.inputBg }]}>
                <Text style={[styles.summaryChipText, { color: theme.textSecondary, fontFamily: "Poppins_500Medium" }]}>
                  +{selectedItems.length - 4} more
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>

      <FlatList
        data={vendors}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.listContent, { paddingBottom: 140 }]}
        showsVerticalScrollIndicator={false}
        renderItem={({ item: vendor }) => {
          const isSelected = selectedVendorId === vendor.id;
          return (
            <Pressable
              style={[
                styles.vendorCard,
                {
                  backgroundColor: isSelected ? theme.tint + "0D" : theme.surface,
                  borderColor: isSelected ? theme.tint : theme.border,
                  borderWidth: isSelected ? 2 : 1,
                },
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setSelectedVendorId(vendor.id);
              }}
            >
              <View style={styles.vendorLeft}>
                <View style={[styles.vendorAvatar, { backgroundColor: isSelected ? theme.tint + "20" : theme.inputBg }]}>
                  <Ionicons name="storefront-outline" size={22} color={isSelected ? theme.tint : theme.textSecondary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.vendorName, { color: theme.text, fontFamily: "Poppins_600SemiBold" }]}>
                    {vendor.name}
                  </Text>
                  <View style={styles.phoneRow}>
                    <Feather name="phone" size={11} color={theme.textSecondary} />
                    <Text style={[styles.vendorPhone, { color: theme.textSecondary, fontFamily: "Poppins_400Regular" }]}>
                      +{vendor.phone}
                    </Text>
                  </View>
                </View>
              </View>
              <View
                style={[
                  styles.radio,
                  {
                    borderColor: isSelected ? theme.tint : theme.border,
                    backgroundColor: isSelected ? theme.tint : "transparent",
                  },
                ]}
              >
                {isSelected && <View style={styles.radioInner} />}
              </View>
            </Pressable>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={48} color={theme.textSecondary} />
            <Text style={[styles.emptyText, { color: theme.textSecondary, fontFamily: "Poppins_400Regular" }]}>
              No vendors yet. Add vendors in Settings.
            </Text>
          </View>
        }
      />

      <View
        style={[
          styles.bottomBar,
          {
            paddingBottom: (insets.bottom || (Platform.OS === "web" ? 34 : 0)) + 12,
            backgroundColor: theme.surface,
            borderTopColor: theme.border,
          },
        ]}
      >
        <Pressable
          onPress={handleSendOrder}
          disabled={!selectedVendorId}
          style={({ pressed }) => [
            styles.sendButton,
            {
              backgroundColor: selectedVendorId ? theme.whatsapp : theme.border,
              opacity: pressed && selectedVendorId ? 0.9 : 1,
              transform: [{ scale: pressed && selectedVendorId ? 0.97 : 1 }],
            },
          ]}
        >
          <Ionicons name="logo-whatsapp" size={22} color="#fff" />
          <Text style={[styles.sendButtonText, { fontFamily: "Poppins_600SemiBold" }]}>
            Preview & Send
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 12 },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 14 },
  backBtn: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 24, lineHeight: 30 },
  headerSubtitle: { fontSize: 13, marginTop: 2 },
  itemSummary: { borderRadius: 14, padding: 14, borderWidth: 1 },
  summaryLabel: { fontSize: 11, marginBottom: 8, textTransform: "uppercase" as const, letterSpacing: 0.5 },
  summaryChips: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  summaryChip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  summaryChipText: { fontSize: 11 },
  listContent: { padding: 16, gap: 10 },
  vendorCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 16,
  },
  vendorLeft: { flexDirection: "row", alignItems: "center", gap: 14, flex: 1 },
  vendorAvatar: { width: 48, height: 48, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  vendorName: { fontSize: 16 },
  phoneRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 3 },
  vendorPhone: { fontSize: 12 },
  radio: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#fff" },
  emptyState: { alignItems: "center", justifyContent: "center", paddingTop: 80, gap: 12 },
  emptyText: { fontSize: 14, textAlign: "center" as const, maxWidth: 240 },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  sendButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 16,
    borderRadius: 16,
  },
  sendButtonText: { color: "#fff", fontSize: 16 },
});
