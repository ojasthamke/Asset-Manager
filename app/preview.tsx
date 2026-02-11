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
import { generateOrderMessage, getWhatsAppUrl } from "@/lib/store";

export default function PreviewScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { vendorId } = useLocalSearchParams<{ vendorId: string }>();
  const { items, vendors, restaurantName, resetSelections } = useOrder();

  const vendor = vendors.find((v) => v.id === vendorId);
  const selectedItems = items.filter((i) => i.selected);

  if (!vendor) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <Text style={{ color: theme.text }}>Vendor not found</Text>
      </View>
    );
  }

  const message = generateOrderMessage(selectedItems, vendor.name, restaurantName);
  const whatsappUrl = getWhatsAppUrl(vendor.phone, message);

  const handleSend = async () => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const canOpen = await Linking.canOpenURL(whatsappUrl);
      if (canOpen) {
        await Linking.openURL(whatsappUrl);
        resetSelections();
        router.dismissAll();
      } else {
        if (Platform.OS === "web") {
          const webUrl = `https://web.whatsapp.com/send?phone=${vendor.phone}&text=${encodeURIComponent(message)}`;
          await Linking.openURL(webUrl);
          resetSelections();
          router.dismissAll();
        } else {
          Alert.alert(
            "WhatsApp not found",
            "Please install WhatsApp to send orders.",
          );
        }
      }
    } catch (error) {
      Alert.alert("Error", "Could not open WhatsApp. Please try again.");
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
            backgroundColor: theme.surface,
            borderBottomColor: theme.border,
          },
        ]}
      >
        <View style={styles.headerRow}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [
              styles.backBtn,
              { opacity: pressed ? 0.6 : 1 },
            ]}
          >
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text
              style={[
                styles.headerTitle,
                { color: theme.text, fontFamily: "Poppins_700Bold" },
              ]}
            >
              Order Preview
            </Text>
            <Text
              style={[
                styles.headerSubtitle,
                { color: theme.textSecondary, fontFamily: "Poppins_400Regular" },
              ]}
            >
              Review before sending
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 120 }]}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[
            styles.vendorBanner,
            { backgroundColor: theme.tint + "12", borderColor: theme.tint + "30" },
          ]}
        >
          <View
            style={[styles.vendorIcon, { backgroundColor: theme.tint + "25" }]}
          >
            <Ionicons name="storefront-outline" size={22} color={theme.tint} />
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={[
                styles.vendorBannerName,
                { color: theme.text, fontFamily: "Poppins_600SemiBold" },
              ]}
            >
              {vendor.name}
            </Text>
            <Text
              style={[
                styles.vendorBannerPhone,
                { color: theme.textSecondary, fontFamily: "Poppins_400Regular" },
              ]}
            >
              +{vendor.phone}
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.messageCard,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <View style={styles.messageHeader}>
            <Ionicons name="chatbubble-outline" size={18} color={theme.tint} />
            <Text
              style={[
                styles.messageLabel,
                { color: theme.tint, fontFamily: "Poppins_600SemiBold" },
              ]}
            >
              WhatsApp Message
            </Text>
          </View>
          <Text
            style={[
              styles.messageText,
              { color: theme.text, fontFamily: "Poppins_400Regular" },
            ]}
            selectable
          >
            {message}
          </Text>
        </View>

        <View style={styles.itemsSummary}>
          <Text
            style={[
              styles.summaryTitle,
              { color: theme.textSecondary, fontFamily: "Poppins_500Medium" },
            ]}
          >
            Items ({selectedItems.length})
          </Text>
          {selectedItems.map((item) => (
            <View
              key={item.id}
              style={[
                styles.summaryItem,
                { borderBottomColor: theme.border },
              ]}
            >
              <Text
                style={[
                  styles.summaryItemName,
                  { color: theme.text, fontFamily: "Poppins_400Regular" },
                ]}
              >
                {item.name}
              </Text>
              <Text
                style={[
                  styles.summaryItemQty,
                  { color: theme.tint, fontFamily: "Poppins_600SemiBold" },
                ]}
              >
                {item.quantity} {item.unit}
              </Text>
            </View>
          ))}
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
          <Text
            style={[styles.sendButtonText, { fontFamily: "Poppins_700Bold" }]}
          >
            Send via WhatsApp
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 24, lineHeight: 30 },
  headerSubtitle: { fontSize: 13, marginTop: 2 },
  scrollContent: { padding: 20, gap: 16 },
  vendorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  vendorIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  vendorBannerName: { fontSize: 16 },
  vendorBannerPhone: { fontSize: 12, marginTop: 2 },
  messageCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  messageHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  messageLabel: { fontSize: 14 },
  messageText: { fontSize: 14, lineHeight: 22 },
  itemsSummary: { gap: 0 },
  summaryTitle: { fontSize: 13, marginBottom: 8, textTransform: "uppercase" as const, letterSpacing: 0.5 },
  summaryItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  summaryItemName: { fontSize: 15 },
  summaryItemQty: { fontSize: 14 },
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
