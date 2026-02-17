import React from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  Platform,
  Alert,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as Linking from "expo-linking";
import { useOrder } from "@/lib/OrderContext";
import { useTheme } from "@/lib/useTheme";
import { getApiUrl } from "@/lib/query-client";
import { generateOrderMessage, getWhatsAppUrl, getUnitLabel } from "@/lib/store";

export default function PreviewScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { vendorId } = useLocalSearchParams<{ vendorId: string }>();
  const { items, vendors, restaurantName, resetSelections, addHistoryEntry } = useOrder();

  const vendor = vendors.find((v) => v.id === vendorId);
  const selectedItems = items.filter((i) => i.selected);

  if (!vendor) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background, justifyContent: "center", alignItems: "center" }]}>
        <Ionicons name="alert-circle-outline" size={48} color={theme.danger} />
        <Text style={[{ color: theme.text, fontFamily: "Poppins_500Medium", fontSize: 16, marginTop: 12 }]}>Vendor not found</Text>
        <Pressable onPress={() => router.back()} style={[styles.retryBtn, { backgroundColor: theme.tint }]}>
          <Text style={[{ color: "#fff", fontFamily: "Poppins_500Medium" }]}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  const message = generateOrderMessage(selectedItems, vendor.name, restaurantName);
  const whatsappUrl = getWhatsAppUrl(vendor.phone, message);

  // Calculate total amount for the order record
  const totalAmount = selectedItems.reduce((sum, i) => sum + (parseFloat(i.price || "0") * i.quantity), 0);

  const handleSend = async () => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // 1. Record the transaction on the server
      try {
        const baseUrl = getApiUrl();
        await fetch(`${baseUrl}/api/orders`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            vendorId: vendor.id,
            totalAmount: totalAmount.toString(),
            itemsCount: selectedItems.length,
          }),
        });
      } catch (e) {
        console.warn("Failed to record order on server, but proceeding to WhatsApp", e);
      }

      // 2. Add to local history
      addHistoryEntry({
        date: new Date().toISOString(),
        vendorName: vendor.name,
        vendorPhone: vendor.phone,
        items: selectedItems.map((i) => ({
          name: i.name,
          quantity: i.quantity,
          unit: getUnitLabel(i.unit),
        })),
        message,
      });

      // 3. Open WhatsApp
      await Linking.openURL(whatsappUrl);
      resetSelections();
      router.dismissAll();
    } catch {
      Alert.alert(
        "Could not open WhatsApp",
        "Please make sure you have WhatsApp installed to send orders."
      );
    }
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
              Order Preview
            </Text>
            <Text style={[styles.headerSubtitle, { color: theme.textSecondary, fontFamily: "Poppins_400Regular" }]}>
              Review before sending
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 130 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.vendorBanner, { backgroundColor: theme.tint + "10", borderColor: theme.tint + "30" }]}>
          <View style={[styles.vendorIcon, { backgroundColor: theme.tint + "20" }]}>
            <Ionicons name="storefront-outline" size={22} color={theme.tint} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.vendorBannerName, { color: theme.text, fontFamily: "Poppins_600SemiBold" }]}>
              {vendor.name}
            </Text>
            <Text style={[styles.vendorBannerPhone, { color: theme.textSecondary, fontFamily: "Poppins_400Regular" }]}>
              +{vendor.phone}
            </Text>
          </View>
          <View style={[styles.whatsappBadge, { backgroundColor: theme.whatsapp }]}>
            <Ionicons name="logo-whatsapp" size={16} color="#fff" />
          </View>
        </View>

        <View style={[styles.messageCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={styles.messageHeader}>
            <Ionicons name="chatbubble-outline" size={16} color={theme.tint} />
            <Text style={[styles.messageLabel, { color: theme.tint, fontFamily: "Poppins_600SemiBold" }]}>
              Message Preview
            </Text>
          </View>
          <View style={[styles.messageBubble, { backgroundColor: theme.inputBg }]}>
            <Text style={[styles.messageText, { color: theme.text, fontFamily: "Poppins_400Regular" }]} selectable>
              {message}
            </Text>
          </View>
        </View>

        <View style={styles.itemsSummary}>
          <Text style={[styles.summaryTitle, { color: theme.textSecondary, fontFamily: "Poppins_500Medium" }]}>
            Items ({selectedItems.length})
          </Text>
          <View style={[styles.summaryCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            {selectedItems.map((item, index) => (
              <View
                key={item.id}
                style={[
                  styles.summaryItem,
                  index < selectedItems.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.border },
                ]}
              >
                <View style={styles.summaryItemLeft}>
                  <View style={[styles.summaryDot, { backgroundColor: theme.tint }]} />
                  <Text style={[styles.summaryItemName, { color: theme.text, fontFamily: "Poppins_400Regular" }]}>
                    {item.name}
                  </Text>
                </View>
                <View style={[styles.qtyBadge, { backgroundColor: theme.tint + "12" }]}>
                  <Text style={[styles.summaryItemQty, { color: theme.tint, fontFamily: "Poppins_600SemiBold" }]}>
                    {item.quantity} {getUnitLabel(item.unit)}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

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
          onPress={handleSend}
          style={({ pressed }) => [
            styles.sendButton,
            {
              backgroundColor: theme.whatsapp,
              opacity: pressed ? 0.9 : 1,
              transform: [{ scale: pressed ? 0.97 : 1 }],
            },
          ]}
        >
          <Ionicons name="logo-whatsapp" size={24} color="#fff" />
          <Text style={[styles.sendButtonText, { fontFamily: "Poppins_700Bold" }]}>
            Send via WhatsApp
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 12 },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  backBtn: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 24, lineHeight: 30 },
  headerSubtitle: { fontSize: 13, marginTop: 2 },
  retryBtn: { marginTop: 16, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  scrollContent: { padding: 20, gap: 16 },
  vendorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  vendorIcon: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  vendorBannerName: { fontSize: 16 },
  vendorBannerPhone: { fontSize: 12, marginTop: 2 },
  whatsappBadge: { width: 32, height: 32, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  messageCard: { borderRadius: 16, padding: 16, borderWidth: 1 },
  messageHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  messageLabel: { fontSize: 13 },
  messageBubble: { borderRadius: 12, padding: 14 },
  messageText: { fontSize: 13, lineHeight: 20 },
  itemsSummary: {},
  summaryTitle: { fontSize: 12, marginBottom: 8, textTransform: "uppercase" as const, letterSpacing: 0.5 },
  summaryCard: { borderRadius: 16, borderWidth: 1, overflow: "hidden" },
  summaryItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  summaryItemLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  summaryDot: { width: 6, height: 6, borderRadius: 3 },
  summaryItemName: { fontSize: 14 },
  qtyBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  summaryItemQty: { fontSize: 13 },
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
    paddingVertical: 18,
    borderRadius: 16,
  },
  sendButtonText: { color: "#fff", fontSize: 18 },
});
