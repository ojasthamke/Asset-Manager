import React, { useState } from "react";
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
  useColorScheme,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useOrder } from "@/lib/OrderContext";
import { useTheme } from "@/lib/useTheme";

function ItemRow({
  item,
  theme,
  onToggle,
  onQuantityChange,
}: {
  item: { id: string; name: string; unit: string; selected: boolean; quantity: number };
  theme: ReturnType<typeof useTheme>;
  onToggle: (id: string) => void;
  onQuantityChange: (id: string, qty: number) => void;
}) {
  return (
    <Pressable
      style={[
        styles.itemRow,
        {
          backgroundColor: item.selected ? theme.tint + "12" : theme.surface,
          borderColor: item.selected ? theme.tint + "40" : theme.border,
        },
      ]}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onToggle(item.id);
      }}
    >
      <View style={styles.itemLeft}>
        <View
          style={[
            styles.checkbox,
            {
              backgroundColor: item.selected ? theme.tint : "transparent",
              borderColor: item.selected ? theme.tint : theme.border,
            },
          ]}
        >
          {item.selected && (
            <Ionicons name="checkmark" size={16} color="#fff" />
          )}
        </View>
        <View>
          <Text
            style={[
              styles.itemName,
              { color: theme.text, fontFamily: "Poppins_500Medium" },
            ]}
          >
            {item.name}
          </Text>
          <Text
            style={[
              styles.itemUnit,
              { color: theme.textSecondary, fontFamily: "Poppins_400Regular" },
            ]}
          >
            {item.unit}
          </Text>
        </View>
      </View>

      {item.selected && (
        <View style={[styles.quantityRow, { backgroundColor: theme.quantityBg }]}>
          <Pressable
            style={[styles.qtyBtn, { backgroundColor: theme.tint + "20" }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onQuantityChange(item.id, item.quantity - 1);
            }}
          >
            <Feather name="minus" size={16} color={theme.tint} />
          </Pressable>
          <TextInput
            style={[
              styles.qtyInput,
              { color: theme.text, fontFamily: "Poppins_600SemiBold" },
            ]}
            value={String(item.quantity)}
            onChangeText={(text) => {
              const num = parseFloat(text);
              if (!isNaN(num)) onQuantityChange(item.id, num);
            }}
            keyboardType="decimal-pad"
            selectTextOnFocus
          />
          <Pressable
            style={[styles.qtyBtn, { backgroundColor: theme.tint + "20" }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onQuantityChange(item.id, item.quantity + 1);
            }}
          >
            <Feather name="plus" size={16} color={theme.tint} />
          </Pressable>
        </View>
      )}
    </Pressable>
  );
}

export default function HomeScreen() {
  const theme = useTheme();
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const {
    items,
    isLoading,
    toggleItem,
    setItemQuantity,
    selectAllItems,
    deselectAllItems,
    addItem,
  } = useOrder();

  const [showAddModal, setShowAddModal] = useState(false);
  const [newItemName, setNewItemName] = useState("");
  const [newItemUnit, setNewItemUnit] = useState("kg");

  const selectedCount = items.filter((i) => i.selected).length;
  const allSelected = items.length > 0 && selectedCount === items.length;

  const handleNext = () => {
    if (selectedCount === 0) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push("/vendor");
  };

  const handleAddItem = () => {
    if (newItemName.trim()) {
      addItem(newItemName.trim(), newItemUnit.trim() || "kg");
      setNewItemName("");
      setNewItemUnit("kg");
      setShowAddModal(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
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
            paddingTop: (insets.top || webTopInset) + 8,
            backgroundColor: theme.surface,
            borderBottomColor: theme.border,
          },
        ]}
      >
        <View style={styles.headerTop}>
          <View>
            <Text
              style={[
                styles.headerTitle,
                { color: theme.text, fontFamily: "Poppins_700Bold" },
              ]}
            >
              QuickOrder
            </Text>
            <Text
              style={[
                styles.headerSubtitle,
                { color: theme.textSecondary, fontFamily: "Poppins_400Regular" },
              ]}
            >
              Select items for your order
            </Text>
          </View>
          <Pressable
            onPress={() => router.push("/settings")}
            style={({ pressed }) => [
              styles.iconBtn,
              { opacity: pressed ? 0.6 : 1 },
            ]}
          >
            <Ionicons name="settings-outline" size={24} color={theme.text} />
          </Pressable>
        </View>
        <View style={styles.headerActions}>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              allSelected ? deselectAllItems() : selectAllItems();
            }}
            style={[styles.chipBtn, { backgroundColor: theme.tint + "15" }]}
          >
            <Ionicons
              name={allSelected ? "close-circle-outline" : "checkmark-done-outline"}
              size={16}
              color={theme.tint}
            />
            <Text
              style={[
                styles.chipText,
                { color: theme.tint, fontFamily: "Poppins_500Medium" },
              ]}
            >
              {allSelected ? "Clear All" : "Select All"}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setShowAddModal(true)}
            style={[styles.chipBtn, { backgroundColor: theme.tint + "15" }]}
          >
            <Feather name="plus" size={16} color={theme.tint} />
            <Text
              style={[
                styles.chipText,
                { color: theme.tint, fontFamily: "Poppins_500Medium" },
              ]}
            >
              Add Item
            </Text>
          </Pressable>
        </View>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: selectedCount > 0 ? 120 : 40 },
        ]}
        renderItem={({ item }) => (
          <ItemRow
            item={item}
            theme={theme}
            onToggle={toggleItem}
            onQuantityChange={setItemQuantity}
          />
        )}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="basket-outline" size={48} color={theme.textSecondary} />
            <Text
              style={[
                styles.emptyText,
                { color: theme.textSecondary, fontFamily: "Poppins_400Regular" },
              ]}
            >
              No items yet. Tap "Add Item" to get started.
            </Text>
          </View>
        }
      />

      {selectedCount > 0 && (
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
          <Text
            style={[
              styles.selectedText,
              { color: theme.textSecondary, fontFamily: "Poppins_400Regular" },
            ]}
          >
            {selectedCount} item{selectedCount !== 1 ? "s" : ""} selected
          </Text>
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
            <Text
              style={[styles.nextButtonText, { fontFamily: "Poppins_600SemiBold" }]}
            >
              Choose Vendor
            </Text>
            <Ionicons name="arrow-forward" size={20} color="#fff" />
          </Pressable>
        </View>
      )}

      <Modal
        visible={showAddModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAddModal(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowAddModal(false)}
        >
          <Pressable
            style={[styles.modalContent, { backgroundColor: theme.surface }]}
            onPress={() => {}}
          >
            <Text
              style={[
                styles.modalTitle,
                { color: theme.text, fontFamily: "Poppins_600SemiBold" },
              ]}
            >
              Add New Item
            </Text>
            <TextInput
              style={[
                styles.modalInput,
                {
                  backgroundColor: theme.inputBg,
                  color: theme.text,
                  fontFamily: "Poppins_400Regular",
                  borderColor: theme.border,
                },
              ]}
              placeholder="Item name (e.g., Mushroom)"
              placeholderTextColor={theme.textSecondary}
              value={newItemName}
              onChangeText={setNewItemName}
              autoFocus
            />
            <TextInput
              style={[
                styles.modalInput,
                {
                  backgroundColor: theme.inputBg,
                  color: theme.text,
                  fontFamily: "Poppins_400Regular",
                  borderColor: theme.border,
                },
              ]}
              placeholder="Unit (e.g., kg, litre, bunch)"
              placeholderTextColor={theme.textSecondary}
              value={newItemUnit}
              onChangeText={setNewItemUnit}
            />
            <View style={styles.modalActions}>
              <Pressable
                onPress={() => setShowAddModal(false)}
                style={[styles.modalBtn, { backgroundColor: theme.inputBg }]}
              >
                <Text
                  style={[
                    styles.modalBtnText,
                    { color: theme.textSecondary, fontFamily: "Poppins_500Medium" },
                  ]}
                >
                  Cancel
                </Text>
              </Pressable>
              <Pressable
                onPress={handleAddItem}
                style={[
                  styles.modalBtn,
                  {
                    backgroundColor: theme.tint,
                    opacity: newItemName.trim() ? 1 : 0.5,
                  },
                ]}
                disabled={!newItemName.trim()}
              >
                <Text
                  style={[
                    styles.modalBtnText,
                    { color: "#fff", fontFamily: "Poppins_600SemiBold" },
                  ]}
                >
                  Add
                </Text>
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
  header: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  headerTitle: { fontSize: 28, lineHeight: 34 },
  headerSubtitle: { fontSize: 14, marginTop: 2 },
  iconBtn: { padding: 8 },
  headerActions: { flexDirection: "row", gap: 10, marginTop: 12 },
  chipBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  chipText: { fontSize: 13 },
  listContent: { padding: 16, gap: 10 },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
  },
  itemLeft: { flexDirection: "row", alignItems: "center", gap: 14, flex: 1 },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  itemName: { fontSize: 16, lineHeight: 22 },
  itemUnit: { fontSize: 12, marginTop: 1 },
  quantityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 10,
    padding: 4,
  },
  qtyBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  qtyInput: {
    width: 44,
    textAlign: "center" as const,
    fontSize: 16,
    paddingVertical: 2,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
    gap: 12,
  },
  emptyText: { fontSize: 14, textAlign: "center" as const, maxWidth: 240 },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  selectedText: { fontSize: 14 },
  nextButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 14,
  },
  nextButtonText: { color: "#fff", fontSize: 16 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalContent: {
    width: "100%",
    maxWidth: 380,
    borderRadius: 20,
    padding: 24,
  },
  modalTitle: { fontSize: 20, marginBottom: 16 },
  modalInput: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    marginBottom: 12,
    borderWidth: 1,
  },
  modalActions: { flexDirection: "row", gap: 12, marginTop: 4 },
  modalBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  modalBtnText: { fontSize: 15 },
});
