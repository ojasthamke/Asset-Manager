import React, { useState, useMemo } from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  Pressable,
  TextInput,
  Platform,
  ActivityIndicator,
  Modal,
  ScrollView,
  Image,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { useOrder } from "@/lib/OrderContext";
import { useTheme } from "@/lib/useTheme";
import {
  Category,
  CATEGORIES,
  UnitType,
  UNIT_OPTIONS,
  getItemImage,
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
  if (icon.family === "material-community") {
    return <MaterialCommunityIcons name={icon.name as any} size={size} color={color} />;
  }
  return <Ionicons name={icon.name as any} size={size} color={color} />;
}

function ItemCard({
  item,
  theme,
  onToggle,
  onQuantityChange,
  onUnitChange,
  onDelete,
}: {
  item: {
    id: string;
    name: string;
    unit: UnitType;
    category: Category;
    imageKey?: string;
    selected: boolean;
    quantity: number;
  };
  theme: ReturnType<typeof useTheme>;
  onToggle: (id: string) => void;
  onQuantityChange: (id: string, qty: number) => void;
  onUnitChange: (id: string, unit: UnitType) => void;
  onDelete: (id: string) => void;
}) {
  const [showUnitPicker, setShowUnitPicker] = useState(false);
  const imageSource = getItemImage(item.imageKey);

  return (
    <Pressable
      style={[
        styles.itemCard,
        {
          backgroundColor: item.selected ? theme.tint + "0D" : theme.surface,
          borderColor: item.selected ? theme.tint + "50" : theme.border,
        },
      ]}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onToggle(item.id);
      }}
      onLongPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onDelete(item.id);
      }}
    >
      <View style={styles.cardTop}>
        <View style={[styles.imageContainer, { backgroundColor: theme.inputBg }]}>
          {imageSource ? (
            <Image source={imageSource} style={styles.itemImage} resizeMode="cover" />
          ) : (
            <CategoryIcon category={item.category} color={theme.textSecondary} size={28} />
          )}
          {item.selected && (
            <View style={[styles.checkBadge, { backgroundColor: theme.tint }]}>
              <Ionicons name="checkmark" size={12} color="#fff" />
            </View>
          )}
        </View>
        <Text
          style={[styles.itemName, { color: theme.text, fontFamily: "Poppins_500Medium" }]}
          numberOfLines={1}
        >
          {item.name}
        </Text>
        <Text
          style={[styles.itemCategory, { color: theme.textSecondary, fontFamily: "Poppins_400Regular" }]}
          numberOfLines={1}
        >
          {item.category}
        </Text>
      </View>

      {item.selected && (
        <Animated.View entering={FadeIn.duration(200)} style={styles.cardControls}>
          <View style={[styles.quantityControl, { backgroundColor: theme.inputBg }]}>
            <Pressable
              style={styles.qtyBtn}
              onPress={(e) => {
                e.stopPropagation();
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onQuantityChange(item.id, item.quantity - (item.unit === "g" ? 100 : 1));
              }}
            >
              <Feather name="minus" size={14} color={theme.tint} />
            </Pressable>
            <TextInput
              style={[styles.qtyInput, { color: theme.text, fontFamily: "Poppins_600SemiBold" }]}
              value={String(item.quantity)}
              onChangeText={(text) => {
                const num = parseFloat(text);
                if (!isNaN(num)) onQuantityChange(item.id, num);
              }}
              keyboardType="decimal-pad"
              selectTextOnFocus
            />
            <Pressable
              style={styles.qtyBtn}
              onPress={(e) => {
                e.stopPropagation();
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onQuantityChange(item.id, item.quantity + (item.unit === "g" ? 100 : 1));
              }}
            >
              <Feather name="plus" size={14} color={theme.tint} />
            </Pressable>
          </View>
          <Pressable
            style={[styles.unitChip, { backgroundColor: theme.tint + "18" }]}
            onPress={(e) => {
              e.stopPropagation();
              setShowUnitPicker(true);
            }}
          >
            <Text style={[styles.unitChipText, { color: theme.tint, fontFamily: "Poppins_500Medium" }]}>
              {UNIT_OPTIONS.find((u) => u.value === item.unit)?.label || item.unit}
            </Text>
            <Feather name="chevron-down" size={12} color={theme.tint} />
          </Pressable>
        </Animated.View>
      )}

      <Modal
        visible={showUnitPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowUnitPicker(false)}
      >
        <Pressable style={styles.unitOverlay} onPress={() => setShowUnitPicker(false)}>
          <View style={[styles.unitModal, { backgroundColor: theme.surface }]}>
            <Text style={[styles.unitModalTitle, { color: theme.text, fontFamily: "Poppins_600SemiBold" }]}>
              Select Unit
            </Text>
            {UNIT_OPTIONS.map((u) => (
              <Pressable
                key={u.value}
                style={[
                  styles.unitOption,
                  {
                    backgroundColor: item.unit === u.value ? theme.tint + "15" : "transparent",
                    borderColor: theme.border,
                  },
                ]}
                onPress={() => {
                  onUnitChange(item.id, u.value);
                  setShowUnitPicker(false);
                }}
              >
                <Text
                  style={[
                    styles.unitOptionText,
                    {
                      color: item.unit === u.value ? theme.tint : theme.text,
                      fontFamily: item.unit === u.value ? "Poppins_600SemiBold" : "Poppins_400Regular",
                    },
                  ]}
                >
                  {u.label}
                </Text>
                {item.unit === u.value && (
                  <Ionicons name="checkmark" size={18} color={theme.tint} />
                )}
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </Pressable>
  );
}

export default function HomeScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const {
    items,
    isLoading,
    toggleItem,
    setItemQuantity,
    setItemUnit,
    selectAllItems,
    deselectAllItems,
    addItem,
    removeItem,
  } = useOrder();

  const [activeCategory, setActiveCategory] = useState<Category | "All">("All");
  const [showAddModal, setShowAddModal] = useState(false);
  const [newItemName, setNewItemName] = useState("");
  const [newItemUnit, setNewItemUnit] = useState<UnitType>("kg");
  const [newItemCategory, setNewItemCategory] = useState<Category>("Vegetables");

  const filteredItems = useMemo(() => {
    if (activeCategory === "All") return items;
    return items.filter((i) => i.category === activeCategory);
  }, [items, activeCategory]);

  const selectedCount = items.filter((i) => i.selected).length;
  const allSelected = filteredItems.length > 0 && filteredItems.every((i) => i.selected);

  const handleNext = () => {
    if (selectedCount === 0) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push("/vendor");
  };

  const handleAddItem = () => {
    if (newItemName.trim()) {
      addItem(newItemName.trim(), newItemUnit, newItemCategory);
      setNewItemName("");
      setNewItemUnit("kg");
      setNewItemCategory("Vegetables");
      setShowAddModal(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const handleDeleteItem = (id: string) => {
    const item = items.find((i) => i.id === id);
    if (!item) return;
    removeItem(id);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  };

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
      <View
        style={[
          styles.header,
          {
            paddingTop: (insets.top || webTopInset) + 4,
            backgroundColor: theme.background,
          },
        ]}
      >
        <View style={styles.headerTop}>
          <View>
            <Text style={[styles.headerTitle, { color: theme.text, fontFamily: "Poppins_700Bold" }]}>
              QuickOrder
            </Text>
            <Text style={[styles.headerSubtitle, { color: theme.textSecondary, fontFamily: "Poppins_400Regular" }]}>
              {selectedCount > 0 ? `${selectedCount} item${selectedCount !== 1 ? "s" : ""} selected` : "Tap items to add to order"}
            </Text>
          </View>
          <View style={styles.headerBtns}>
            {selectedCount > 0 && (
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  deselectAllItems();
                }}
                style={({ pressed }) => [styles.headerIconBtn, { opacity: pressed ? 0.6 : 1 }]}
              >
                <Ionicons name="close-circle-outline" size={24} color={theme.textSecondary} />
              </Pressable>
            )}
            <Pressable
              onPress={() => setShowAddModal(true)}
              style={({ pressed }) => [
                styles.addBtn,
                { backgroundColor: theme.tint, opacity: pressed ? 0.9 : 1 },
              ]}
            >
              <Feather name="plus" size={18} color="#fff" />
            </Pressable>
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScroll}
        >
          <Pressable
            style={[
              styles.categoryChip,
              {
                backgroundColor: activeCategory === "All" ? theme.tint : theme.surface,
                borderColor: activeCategory === "All" ? theme.tint : theme.border,
              },
            ]}
            onPress={() => setActiveCategory("All")}
          >
            <Ionicons
              name="grid-outline"
              size={14}
              color={activeCategory === "All" ? "#fff" : theme.textSecondary}
            />
            <Text
              style={[
                styles.categoryChipText,
                {
                  color: activeCategory === "All" ? "#fff" : theme.text,
                  fontFamily: "Poppins_500Medium",
                },
              ]}
            >
              All
            </Text>
          </Pressable>
          {CATEGORIES.map((cat) => {
            const count = items.filter((i) => i.category === cat).length;
            const isActive = activeCategory === cat;
            return (
              <Pressable
                key={cat}
                style={[
                  styles.categoryChip,
                  {
                    backgroundColor: isActive ? theme.tint : theme.surface,
                    borderColor: isActive ? theme.tint : theme.border,
                  },
                ]}
                onPress={() => setActiveCategory(cat)}
              >
                <CategoryIcon category={cat} color={isActive ? "#fff" : theme.textSecondary} size={14} />
                <Text
                  style={[
                    styles.categoryChipText,
                    {
                      color: isActive ? "#fff" : theme.text,
                      fontFamily: "Poppins_500Medium",
                    },
                  ]}
                >
                  {cat}
                </Text>
                <View
                  style={[
                    styles.categoryCount,
                    { backgroundColor: isActive ? "rgba(255,255,255,0.3)" : theme.inputBg },
                  ]}
                >
                  <Text
                    style={[
                      styles.categoryCountText,
                      {
                        color: isActive ? "#fff" : theme.textSecondary,
                        fontFamily: "Poppins_500Medium",
                      },
                    ]}
                  >
                    {count}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <FlatList
        data={filteredItems}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.gridRow}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: selectedCount > 0 ? 130 : 100 },
        ]}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <ItemCard
            item={item}
            theme={theme}
            onToggle={toggleItem}
            onQuantityChange={setItemQuantity}
            onUnitChange={setItemUnit}
            onDelete={handleDeleteItem}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="basket-outline" size={48} color={theme.textSecondary} />
            <Text style={[styles.emptyText, { color: theme.textSecondary, fontFamily: "Poppins_400Regular" }]}>
              No items in this category
            </Text>
          </View>
        }
      />

      {selectedCount > 0 && (
        <Animated.View
          entering={FadeIn.duration(250)}
          style={[
            styles.bottomBar,
            {
              paddingBottom: (insets.bottom || (Platform.OS === "web" ? 34 : 0)) + 80,
              backgroundColor: theme.surface,
              borderTopColor: theme.border,
            },
          ]}
        >
          <Pressable
            onPress={handleNext}
            style={({ pressed }) => [
              styles.nextButton,
              {
                backgroundColor: theme.tint,
                opacity: pressed ? 0.9 : 1,
                transform: [{ scale: pressed ? 0.97 : 1 }],
              },
            ]}
          >
            <View style={styles.nextBtnInner}>
              <Ionicons name="cart" size={20} color="#fff" />
              <Text style={[styles.nextButtonText, { fontFamily: "Poppins_600SemiBold" }]}>
                Choose Vendor
              </Text>
            </View>
            <View style={[styles.countBadge, { backgroundColor: "rgba(255,255,255,0.25)" }]}>
              <Text style={[styles.countBadgeText, { fontFamily: "Poppins_600SemiBold" }]}>
                {selectedCount}
              </Text>
            </View>
          </Pressable>
        </Animated.View>
      )}

      <Modal visible={showAddModal} transparent animationType="fade" onRequestClose={() => setShowAddModal(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setShowAddModal(false)}>
          <Pressable style={[styles.modalContent, { backgroundColor: theme.surface }]} onPress={() => {}}>
            <Text style={[styles.modalTitle, { color: theme.text, fontFamily: "Poppins_600SemiBold" }]}>
              Add New Item
            </Text>
            <TextInput
              style={[styles.modalInput, { backgroundColor: theme.inputBg, color: theme.text, fontFamily: "Poppins_400Regular", borderColor: theme.border }]}
              placeholder="Item name"
              placeholderTextColor={theme.textSecondary}
              value={newItemName}
              onChangeText={setNewItemName}
              autoFocus
            />
            <Text style={[styles.fieldLabel, { color: theme.textSecondary, fontFamily: "Poppins_500Medium" }]}>
              Category
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
              {CATEGORIES.map((cat) => (
                <Pressable
                  key={cat}
                  style={[
                    styles.modalChip,
                    {
                      backgroundColor: newItemCategory === cat ? theme.tint : theme.inputBg,
                      borderColor: newItemCategory === cat ? theme.tint : theme.border,
                    },
                  ]}
                  onPress={() => setNewItemCategory(cat)}
                >
                  <Text
                    style={[
                      styles.modalChipText,
                      {
                        color: newItemCategory === cat ? "#fff" : theme.text,
                        fontFamily: "Poppins_400Regular",
                      },
                    ]}
                  >
                    {cat}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
            <Text style={[styles.fieldLabel, { color: theme.textSecondary, fontFamily: "Poppins_500Medium" }]}>
              Default Unit
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
              {UNIT_OPTIONS.map((u) => (
                <Pressable
                  key={u.value}
                  style={[
                    styles.modalChip,
                    {
                      backgroundColor: newItemUnit === u.value ? theme.tint : theme.inputBg,
                      borderColor: newItemUnit === u.value ? theme.tint : theme.border,
                    },
                  ]}
                  onPress={() => setNewItemUnit(u.value)}
                >
                  <Text
                    style={[
                      styles.modalChipText,
                      {
                        color: newItemUnit === u.value ? "#fff" : theme.text,
                        fontFamily: "Poppins_400Regular",
                      },
                    ]}
                  >
                    {u.label}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
            <View style={styles.modalActions}>
              <Pressable onPress={() => setShowAddModal(false)} style={[styles.modalBtn, { backgroundColor: theme.inputBg }]}>
                <Text style={[styles.modalBtnText, { color: theme.textSecondary, fontFamily: "Poppins_500Medium" }]}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleAddItem}
                style={[styles.modalBtn, { backgroundColor: theme.tint, opacity: newItemName.trim() ? 1 : 0.5 }]}
                disabled={!newItemName.trim()}
              >
                <Text style={[styles.modalBtnText, { color: "#fff", fontFamily: "Poppins_600SemiBold" }]}>Add Item</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { paddingHorizontal: 20, paddingBottom: 8 },
  headerTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 },
  headerTitle: { fontSize: 28, lineHeight: 34 },
  headerSubtitle: { fontSize: 13, marginTop: 2 },
  headerBtns: { flexDirection: "row", alignItems: "center", gap: 8 },
  headerIconBtn: { padding: 6 },
  addBtn: { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  categoryScroll: { gap: 8, paddingBottom: 6 },
  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 22,
    borderWidth: 1,
  },
  categoryChipText: { fontSize: 13 },
  categoryCount: { paddingHorizontal: 6, paddingVertical: 1, borderRadius: 8 },
  categoryCountText: { fontSize: 10 },
  listContent: { padding: 12 },
  gridRow: { justifyContent: "space-between", marginBottom: 12, paddingHorizontal: 4 },
  itemCard: {
    width: "48%",
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
    paddingBottom: 10,
  },
  cardTop: { alignItems: "center", paddingTop: 8, paddingHorizontal: 8 },
  imageContainer: {
    width: "100%",
    height: 90,
    borderRadius: 12,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  itemImage: { width: "100%", height: "100%" },
  checkBadge: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  itemName: { fontSize: 14, textAlign: "center" as const },
  itemCategory: { fontSize: 11, textAlign: "center" as const, marginTop: 1 },
  cardControls: { paddingHorizontal: 8, paddingTop: 8, gap: 6 },
  quantityControl: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 10,
    padding: 2,
  },
  qtyBtn: { width: 30, height: 30, alignItems: "center", justifyContent: "center" },
  qtyInput: { flex: 1, textAlign: "center" as const, fontSize: 15, paddingVertical: 2 },
  unitChip: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 6,
    borderRadius: 8,
  },
  unitChipText: { fontSize: 12 },
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
  nextButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 16,
  },
  nextBtnInner: { flexDirection: "row", alignItems: "center", gap: 10 },
  nextButtonText: { color: "#fff", fontSize: 16 },
  countBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  countBadgeText: { color: "#fff", fontSize: 14 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center", padding: 24 },
  modalContent: { width: "100%", maxWidth: 400, borderRadius: 20, padding: 24 },
  modalTitle: { fontSize: 20, marginBottom: 16 },
  modalInput: { borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, marginBottom: 16, borderWidth: 1 },
  fieldLabel: { fontSize: 12, marginBottom: 8, textTransform: "uppercase" as const, letterSpacing: 0.5 },
  chipScroll: { marginBottom: 16 },
  modalChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, marginRight: 8 },
  modalChipText: { fontSize: 13 },
  modalActions: { flexDirection: "row", gap: 12, marginTop: 4 },
  modalBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: "center" },
  modalBtnText: { fontSize: 15 },
  unitOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center", padding: 24 },
  unitModal: { width: "100%", maxWidth: 320, borderRadius: 20, padding: 20 },
  unitModalTitle: { fontSize: 18, marginBottom: 12 },
  unitOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginBottom: 4,
  },
  unitOptionText: { fontSize: 15 },
});
