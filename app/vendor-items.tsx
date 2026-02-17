import React, { useState, useMemo, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  Pressable,
  ActivityIndicator,
  Modal,
  ScrollView,
  Image,
  Alert,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, { FadeIn } from "react-native-reanimated";
import { useOrder } from "@/lib/OrderContext";
import { useTheme } from "@/lib/useTheme";
import { getApiUrl } from "@/lib/query-client";
import {
  Category,
  CATEGORIES,
  UnitType,
  UNIT_OPTIONS,
  getItemImage,
  GroceryItem,
} from "@/lib/store";

const CATEGORY_ICONS: Record<Category, { name: string; family: string }> = {
  Vegetables: { name: "leaf", family: "ionicons" },
  Dairy: { name: "water", family: "ionicons" },
  "Meat & Eggs": { name: "food-drumstick", family: "material-community" },
  Staples: { name: "grain", family: "material-community" },
  "Spices & Herbs": { name: "flower", family: "ionicons" },
};

function CategoryIcon({ category, color, size }: { category: Category; color: string; size: number }) {
  const icon = CATEGORY_ICONS[category];
  return <Ionicons name={icon.name as any} size={size} color={color} />;
}

function ItemCard({
  item,
  theme,
  onToggle,
  onQuantityChange,
  onUnitChange,
}: {
  item: GroceryItem;
  theme: any;
  onToggle: (id: string) => void;
  onQuantityChange: (id: string, qty: number) => void;
  onUnitChange: (id: string, unit: UnitType) => void;
}) {
  const [showUnitPicker, setShowUnitPicker] = useState(false);
  const imageSource = getItemImage(item.imageKey);

  return (
    <Pressable
      style={[
        styles.itemCard,
        {
          backgroundColor: item.selected ? theme.tint + "08" : theme.card,
          borderColor: item.selected ? theme.tint : theme.border,
          elevation: item.selected ? 4 : 2,
        },
      ]}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onToggle(item.id);
      }}
    >
      <View style={styles.cardTop}>
        <View style={[styles.imageContainer, { backgroundColor: theme.inputBg }]}>
          {imageSource ? (
            <Image source={imageSource} style={styles.itemImage} resizeMode="cover" />
          ) : (
            <CategoryIcon category={item.category} color={theme.textSecondary} size={32} />
          )}
          {item.selected && (
            <View style={[styles.checkBadge, { backgroundColor: theme.tint }]}>
              <Ionicons name="checkmark" size={14} color="#fff" />
            </View>
          )}
        </View>
        <Text style={[styles.itemName, { color: theme.text, fontFamily: "Poppins_600SemiBold" }]} numberOfLines={1}>
          {item.name}
        </Text>
        {/* Price Tag added here */}
        <Text style={[styles.itemPrice, { color: theme.tint, fontFamily: "Poppins_700Bold" }]}>
          ₹{parseFloat(item.price || "0").toFixed(2)}
        </Text>
      </View>

      {item.selected && (
        <Animated.View entering={FadeIn.duration(200)} style={styles.cardControls}>
          <View style={[styles.quantityControl, { backgroundColor: theme.inputBg }]}>
            <Pressable onPress={() => onQuantityChange(item.id, Math.max(0.5, item.quantity - 1))} style={styles.qtyBtn}>
              <Feather name="minus" size={16} color={theme.tint} />
            </Pressable>
            <Text style={[styles.qtyText, { color: theme.text, fontFamily: "Poppins_700Bold" }]}>{item.quantity}</Text>
            <Pressable onPress={() => onQuantityChange(item.id, item.quantity + 1)} style={styles.qtyBtn}>
              <Feather name="plus" size={16} color={theme.tint} />
            </Pressable>
          </View>
          <Pressable style={[styles.unitChip, { backgroundColor: theme.tint + "15" }]} onPress={() => setShowUnitPicker(true)}>
            <Text style={[styles.unitChipText, { color: theme.tint, fontFamily: "Poppins_600SemiBold" }]}>{item.unit}</Text>
            <Feather name="chevron-down" size={14} color={theme.tint} />
          </Pressable>
        </Animated.View>
      )}

      <Modal visible={showUnitPicker} transparent animationType="fade">
        <Pressable style={styles.unitOverlay} onPress={() => setShowUnitPicker(false)}>
          <View style={[styles.unitModal, { backgroundColor: theme.card }]}>
            {UNIT_OPTIONS.map((u) => (
              <Pressable key={u.value} style={styles.unitOption} onPress={() => { onUnitChange(item.id, u.value); setShowUnitPicker(false); }}>
                <Text style={[styles.unitOptionText, { color: theme.text, fontFamily: "Poppins_500Medium" }]}>{u.label}</Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </Pressable>
  );
}

export default function VendorItemsScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { vendorId, vendorName } = useLocalSearchParams<{ vendorId: string; vendorName: string }>();
  const { setItemsDirectly } = useOrder();

  const [items, setItems] = useState<GroceryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<Category | "All">("All");

  useEffect(() => {
    async function fetchItems() {
      try {
        const baseUrl = getApiUrl();
        const response = await fetch(`${baseUrl}/api/items?vendorId=${vendorId}`);
        const data = await response.json();
        setItems(data.map((i: any) => ({ ...i, selected: false, quantity: 1 })));
      } catch (error) {
        Alert.alert("Error", "Could not load items for this vendor.");
      } finally {
        setLoading(false);
      }
    }
    fetchItems();
  }, [vendorId]);

  const filteredItems = useMemo(() => {
    if (activeCategory === "All") return items;
    return items.filter((i) => i.category === activeCategory);
  }, [items, activeCategory]);

  const selectedCount = items.filter((i) => i.selected).length;

  const toggleItem = (id: string) => {
    setItems(items.map(i => i.id === id ? { ...i, selected: !i.selected } : i));
  };

  const setItemQuantity = (id: string, qty: number) => {
    setItems(items.map(i => i.id === id ? { ...i, quantity: qty } : i));
  };

  const setItemUnit = (id: string, unit: UnitType) => {
    setItems(items.map(i => i.id === id ? { ...i, unit } : i));
  };

  const handleProceed = () => {
    setItemsDirectly(items);
    router.push({
      pathname: "/preview",
      params: { vendorId }
    });
  };

  if (loading) {
    return <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}><ActivityIndicator size="large" color={theme.tint} /></View>;
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: theme.text, fontFamily: "Poppins_700Bold" }]} numberOfLines={1}>{vendorName}</Text>
          <Text style={[styles.headerSubtitle, { color: theme.textSecondary, fontFamily: "Poppins_500Medium" }]}>Select items to order</Text>
        </View>
      </View>

      <View style={styles.categoryContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
          <Pressable style={[styles.categoryChip, { backgroundColor: activeCategory === "All" ? theme.tint : theme.card, borderColor: activeCategory === "All" ? theme.tint : theme.border }]} onPress={() => setActiveCategory("All")}>
            <Text style={{ color: activeCategory === "All" ? "#fff" : theme.text, fontFamily: "Poppins_600SemiBold", fontSize: 13 }}>All</Text>
          </Pressable>
          {CATEGORIES.map(cat => (
            <Pressable key={cat} style={[styles.categoryChip, { backgroundColor: activeCategory === cat ? theme.tint : theme.card, borderColor: activeCategory === cat ? theme.tint : theme.border }]} onPress={() => setActiveCategory(cat)}>
              <Text style={{ color: activeCategory === cat ? "#fff" : theme.text, fontFamily: "Poppins_600SemiBold", fontSize: 13 }}>{cat}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={filteredItems}
        numColumns={2}
        columnWrapperStyle={styles.gridRow}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <ItemCard item={item} theme={theme} onToggle={toggleItem} onQuantityChange={setItemQuantity} onUnitChange={setItemUnit} />
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      {selectedCount > 0 && (
        <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 20 }]}>
          <Pressable onPress={handleProceed} style={[styles.nextButton, { backgroundColor: theme.tint }]}>
            <Text style={[styles.nextButtonText, { fontFamily: "Poppins_700Bold" }]}>Review Order ({selectedCount})</Text>
            <Ionicons name="arrow-forward" size={20} color="#fff" />
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { paddingHorizontal: 20, paddingBottom: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 22, lineHeight: 28 },
  headerSubtitle: { fontSize: 13, opacity: 0.6 },
  categoryContainer: { height: 50, marginBottom: 8 },
  categoryScroll: { gap: 8, paddingHorizontal: 20 },
  categoryChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12, borderWidth: 1 },
  listContent: { padding: 16, paddingBottom: 120 },
  gridRow: { justifyContent: "space-between", marginBottom: 16 },
  itemCard: { width: "48%", borderRadius: 20, borderWidth: 1.5, overflow: "hidden", paddingBottom: 12 },
  cardTop: { alignItems: "center", paddingTop: 12, paddingHorizontal: 12 },
  imageContainer: { width: "100%", height: 90, borderRadius: 14, overflow: "hidden", alignItems: "center", justifyContent: "center", marginBottom: 10 },
  itemImage: { width: "100%", height: "100%" },
  checkBadge: { position: "absolute", top: 6, right: 6, width: 22, height: 22, borderRadius: 11, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: "#fff" },
  itemName: { fontSize: 13, textAlign: "center" },
  itemPrice: { fontSize: 14, textAlign: "center", marginTop: 2 },
  cardControls: { paddingHorizontal: 10, paddingTop: 8, gap: 6 },
  quantityControl: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderRadius: 10, padding: 2 },
  qtyBtn: { width: 28, height: 28, alignItems: "center", justifyContent: "center" },
  qtyText: { fontSize: 14 },
  unitChip: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4, paddingVertical: 6, borderRadius: 8 },
  unitChipText: { fontSize: 11 },
  unitOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", padding: 40 },
  unitModal: { borderRadius: 20, padding: 20 },
  unitOption: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
  unitOptionText: { fontSize: 16, textAlign: 'center' },
  bottomBar: { position: "absolute", bottom: 0, left: 0, right: 0, paddingHorizontal: 20 },
  nextButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, paddingVertical: 16, borderRadius: 18, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 5 },
  nextButtonText: { color: "#fff", fontSize: 16 },
});
