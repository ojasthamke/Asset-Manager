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
  Dimensions,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, {
  FadeIn,
  Layout,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
  interpolate
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { useOrder } from "@/lib/OrderContext";
import { useTheme } from "@/lib/useTheme";
import { Vendor } from "@/lib/store";

const { width: SCREEN_WIDTH } = Dimensions.get('window');

function VendorCard({ vendor, theme, isTop }: { vendor: Vendor; theme: any; isTop: boolean }) {
  const shimmerProgress = useSharedValue(0);

  useEffect(() => {
    shimmerProgress.value = withRepeat(
      withTiming(1, {
        duration: 3000,
        easing: Easing.bezier(0.4, 0, 0.6, 1)
      }),
      -1,
      false
    );
  }, [shimmerProgress]);

  const animatedShimmerStyle = useAnimatedStyle(() => {
    const translateX = interpolate(
      shimmerProgress.value,
      [0, 1],
      [SCREEN_WIDTH, -SCREEN_WIDTH]
    );
    return {
      transform: [{ translateX }],
    };
  });

  return (
    <Pressable
      style={({ pressed }) => [
        styles.vendorCard,
        {
          backgroundColor: theme.card,
          borderColor: theme.tint + "40",
          borderWidth: 1.5,
          opacity: pressed ? 0.8 : 1,
          transform: [{ scale: pressed ? 0.98 : 1 }],
          shadowColor: theme.tint,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.3,
          shadowRadius: 12,
          elevation: 6,
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
      <View style={styles.cardContentContainer}>
        {/* Animated Glass/Shimmer Effect */}
        <Animated.View style={[StyleSheet.absoluteFill, animatedShimmerStyle]}>
          <LinearGradient
            colors={['transparent', 'rgba(255, 255, 255, 0.05)', 'rgba(255, 255, 255, 0.2)', 'rgba(255, 255, 255, 0.05)', 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>

        {isTop && (
          <View style={styles.topBadgeContainer}>
            <LinearGradient
              colors={[theme.tint, theme.tint + 'CC']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.badgeGradient}
            >
              <Text style={styles.badgeText}>SPECIAL VENDER</Text>
            </LinearGradient>
          </View>
        )}

        <View style={[styles.vendorIcon, { backgroundColor: theme.tint + "15" }]}>
          <Ionicons name="storefront" size={24} color={theme.tint} />
        </View>
        <View style={styles.vendorInfo}>
          <View style={styles.vendorTitleRow}>
            <Text style={[styles.vendorName, { color: theme.text, fontFamily: "Poppins_600SemiBold" }]}>
              {vendor.name}
            </Text>
          </View>
          <Text style={[styles.vendorPhone, { color: theme.textSecondary, fontFamily: "Poppins_400Regular" }]}>
            +{vendor.phone}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
      </View>
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
    setTimeout(() => setRefreshing(false), 1500);
  }, []);

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.tint} />
        <Text style={{ marginTop: 12, color: theme.textSecondary, fontFamily: 'Poppins_400Regular' }}>Loading your store...</Text>
      </View>
    );
  }

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
        renderItem={({ item, index }) => <VendorCard vendor={item} theme={theme} isTop={index === 0} />}
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
    borderRadius: 24,
    marginBottom: 20,
    marginHorizontal: 4,
    overflow: 'hidden', // Required to clip the glass shimmer
  },
  cardContentContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    width: '100%',
    position: 'relative',
  },
  topBadgeContainer: {
    position: 'absolute',
    top: 0,
    right: 0,
    zIndex: 10,
  },
  badgeGradient: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderBottomLeftRadius: 16,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontFamily: 'Poppins_700Bold',
    letterSpacing: 0.5,
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
  vendorTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  vendorName: { fontSize: 17 },
  vendorPhone: { fontSize: 13 },
  emptyState: { alignItems: "center", justifyContent: "center", paddingTop: 100, paddingHorizontal: 40 },
  emptyIconContainer: { width: 100, height: 100, borderRadius: 50, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  emptyText: { fontSize: 20, textAlign: "center" as const, marginBottom: 8 },
  emptySubtext: { fontSize: 14, textAlign: "center" as const, lineHeight: 22, opacity: 0.7 },
});
