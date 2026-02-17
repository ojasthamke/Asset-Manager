import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  Pressable,
  ActivityIndicator,
  Platform,
  RefreshControl,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, { FadeIn, Layout } from "react-native-reanimated";
import { useOrder } from "@/lib/OrderContext";
import { useTheme } from "@/lib/useTheme";
import { Vendor } from "@/lib/store";

function VendorCard({ vendor, theme }: { vendor: Vendor; theme: any }) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.vendorCard,
        {
          backgroundColor: theme.card,
          borderColor: theme.border,
          opacity: pressed ? 0.8 : 1,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        },
      ]}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push({
          pathname: "/vendor-items",
          params: { vendorId: vendor.id, vendorName: vendor.name, vendorPhone: vendor.phone },
        });
      }}
    >
      <View style={[styles.vendorIcon, { backgroundColor: theme.tint + "10" }]}>
        <Ionicons name="storefront" size={24} color={theme.tint} />
      </View>
      <View style={styles.vendorInfo}>
        <Text style={[styles.vendorName, { color: theme.text, fontFamily: "Poppins_600SemiBold" }]}>
          {vendor.name}
        </Text>
        <Text style={[styles.vendorPhone, { color: theme.textSecondary, fontFamily: "Poppins_400Regular" }]}>
          +{vendor.phone}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
    </Pressable>
  );
}

export default function HomeScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { vendors, isLoading } = useOrder();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    // In a real app, you'd trigger a re-fetch here
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.tint} />
      </View>
    );
  }

  const webTopInset = Platform.OS === "web" ? 67 : 0;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <Text style={[styles.headerTitle, { color: theme.text, fontFamily: "Poppins_800ExtraBold" }]}>
          QuickOrder
        </Text>
        <Text style={[styles.headerSubtitle, { color: theme.textSecondary, fontFamily: "Poppins_500Medium" }]}>
          Select a vendor to start ordering
        </Text>
      </View>

      <FlatList
        data={vendors}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.listContent, { paddingBottom: 100 }]}
        showsVerticalScrollIndicator={false}
        itemLayoutAnimation={Layout.springify()}
        renderItem={({ item }) => <VendorCard vendor={item} theme={theme} />}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.tint} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={[styles.emptyIconContainer, { backgroundColor: theme.inputBg }]}>
              <Ionicons name="people-outline" size={48} color={theme.textSecondary} />
            </View>
            <Text style={[styles.emptyText, { color: theme.text, fontFamily: "Poppins_700Bold" }]}>
              No Vendors Found
            </Text>
            <Text style={[styles.emptySubtext, { color: theme.textSecondary, fontFamily: "Poppins_400Regular" }]}>
              Add vendors using the Admin Panel to see them here.
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { paddingHorizontal: 24, paddingBottom: 20 },
  headerTitle: { fontSize: 32, letterSpacing: -0.5 },
  headerSubtitle: { fontSize: 14, opacity: 0.7, marginTop: 4 },
  listContent: { padding: 20 },
  vendorCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 24,
    borderWidth: 1.5,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  vendorIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  vendorInfo: { flex: 1 },
  vendorName: { fontSize: 17, marginBottom: 2 },
  vendorPhone: { fontSize: 13 },
  emptyState: { alignItems: "center", justifyContent: "center", paddingTop: 100, paddingHorizontal: 40 },
  emptyIconContainer: { width: 100, height: 100, borderRadius: 50, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  emptyText: { fontSize: 20, textAlign: "center" as const, marginBottom: 8 },
  emptySubtext: { fontSize: 14, textAlign: "center" as const, lineHeight: 22, opacity: 0.7 },
});
