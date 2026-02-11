import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  TextInput,
  Modal,
  Alert,
  Platform,
  Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useOrder } from "@/lib/OrderContext";
import { useTheme } from "@/lib/useTheme";
import { Category, CATEGORIES, UnitType, UNIT_OPTIONS, getItemImage } from "@/lib/store";

export default function SettingsScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const {
    items,
    vendors,
    restaurantName,
    updateRestaurantName,
    addItem,
    removeItem,
    addVendor,
    removeVendor,
    updateVendor,
  } = useOrder();

  const [editingName, setEditingName] = useState(false);
  const [tempName, setTempName] = useState(restaurantName);
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [newItemName, setNewItemName] = useState("");
  const [newItemUnit, setNewItemUnit] = useState<UnitType>("kg");
  const [newItemCategory, setNewItemCategory] = useState<Category>("Vegetables");
  const [showVendorModal, setShowVendorModal] = useState(false);
  const [editingVendor, setEditingVendor] = useState<string | null>(null);
  const [vendorName, setVendorName] = useState("");
  const [vendorPhone, setVendorPhone] = useState("");

  const handleSaveName = () => {
    if (tempName.trim()) {
      updateRestaurantName(tempName.trim());
      setEditingName(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const handleAddItem = () => {
    if (newItemName.trim()) {
      addItem(newItemName.trim(), newItemUnit, newItemCategory);
      setNewItemName("");
      setNewItemUnit("kg");
      setNewItemCategory("Vegetables");
      setShowAddItemModal(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const handleDeleteItem = (id: string, name: string) => {
    Alert.alert("Delete Item", `Remove "${name}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          removeItem(id);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        },
      },
    ]);
  };

  const handleOpenVendorModal = (vendor?: { id: string; name: string; phone: string }) => {
    if (vendor) {
      setEditingVendor(vendor.id);
      setVendorName(vendor.name);
      setVendorPhone(vendor.phone);
    } else {
      setEditingVendor(null);
      setVendorName("");
      setVendorPhone("");
    }
    setShowVendorModal(true);
  };

  const handleSaveVendor = () => {
    if (!vendorName.trim() || !vendorPhone.trim()) return;
    if (editingVendor) {
      updateVendor(editingVendor, vendorName.trim(), vendorPhone.trim());
    } else {
      addVendor(vendorName.trim(), vendorPhone.trim());
    }
    setShowVendorModal(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleDeleteVendor = (id: string, name: string) => {
    Alert.alert("Delete Vendor", `Remove "${name}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          removeVendor(id);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        },
      },
    ]);
  };

  const webTopInset = Platform.OS === "web" ? 67 : 0;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { paddingTop: (insets.top || webTopInset) + 4, backgroundColor: theme.background }]}>
        <Text style={[styles.headerTitle, { color: theme.text, fontFamily: "Poppins_700Bold" }]}>
          Settings
        </Text>
        <Text style={[styles.headerSubtitle, { color: theme.textSecondary, fontFamily: "Poppins_400Regular" }]}>
          Manage items, vendors & preferences
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: (insets.bottom || (Platform.OS === "web" ? 34 : 0)) + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary, fontFamily: "Poppins_500Medium" }]}>
            Restaurant
          </Text>
          <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            {editingName ? (
              <View style={styles.nameEditRow}>
                <TextInput
                  style={[styles.nameInput, { backgroundColor: theme.inputBg, color: theme.text, fontFamily: "Poppins_400Regular", borderColor: theme.border }]}
                  value={tempName}
                  onChangeText={setTempName}
                  autoFocus
                  onSubmitEditing={handleSaveName}
                />
                <Pressable onPress={handleSaveName} style={[styles.saveBtn, { backgroundColor: theme.tint }]}>
                  <Ionicons name="checkmark" size={20} color="#fff" />
                </Pressable>
              </View>
            ) : (
              <Pressable
                style={styles.nameRow}
                onPress={() => { setTempName(restaurantName); setEditingName(true); }}
              >
                <View style={[styles.nameIcon, { backgroundColor: theme.tint + "15" }]}>
                  <Ionicons name="restaurant-outline" size={20} color={theme.tint} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.nameLabel, { color: theme.textSecondary, fontFamily: "Poppins_400Regular" }]}>Restaurant Name</Text>
                  <Text style={[styles.nameText, { color: theme.text, fontFamily: "Poppins_500Medium" }]}>{restaurantName}</Text>
                </View>
                <Feather name="edit-2" size={16} color={theme.textSecondary} />
              </Pressable>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.textSecondary, fontFamily: "Poppins_500Medium" }]}>
              Items ({items.length})
            </Text>
            <Pressable
              onPress={() => setShowAddItemModal(true)}
              style={[styles.addChip, { backgroundColor: theme.tint + "15" }]}
            >
              <Feather name="plus" size={14} color={theme.tint} />
              <Text style={[styles.addChipText, { color: theme.tint, fontFamily: "Poppins_500Medium" }]}>Add</Text>
            </Pressable>
          </View>
          <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            {items.map((item, index) => {
              const imgSource = getItemImage(item.imageKey);
              return (
                <View
                  key={item.id}
                  style={[
                    styles.listItem,
                    index < items.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.border },
                  ]}
                >
                  <View style={styles.listItemLeft}>
                    <View style={[styles.itemThumb, { backgroundColor: theme.inputBg }]}>
                      {imgSource ? (
                        <Image source={imgSource} style={styles.thumbImg} resizeMode="cover" />
                      ) : (
                        <Ionicons name="cube-outline" size={16} color={theme.textSecondary} />
                      )}
                    </View>
                    <View>
                      <Text style={[styles.listItemName, { color: theme.text, fontFamily: "Poppins_400Regular" }]}>{item.name}</Text>
                      <Text style={[styles.listItemSub, { color: theme.textSecondary, fontFamily: "Poppins_400Regular" }]}>
                        {item.category} - {UNIT_OPTIONS.find((u) => u.value === item.unit)?.label || item.unit}
                      </Text>
                    </View>
                  </View>
                  <Pressable
                    onPress={() => handleDeleteItem(item.id, item.name)}
                    style={({ pressed }) => [{ opacity: pressed ? 0.5 : 1, padding: 8 }]}
                  >
                    <Feather name="trash-2" size={16} color={theme.danger} />
                  </Pressable>
                </View>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.textSecondary, fontFamily: "Poppins_500Medium" }]}>
              Vendors ({vendors.length})
            </Text>
            <Pressable
              onPress={() => handleOpenVendorModal()}
              style={[styles.addChip, { backgroundColor: theme.tint + "15" }]}
            >
              <Feather name="plus" size={14} color={theme.tint} />
              <Text style={[styles.addChipText, { color: theme.tint, fontFamily: "Poppins_500Medium" }]}>Add</Text>
            </Pressable>
          </View>
          <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            {vendors.map((vendor, index) => (
              <View
                key={vendor.id}
                style={[
                  styles.listItem,
                  index < vendors.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.border },
                ]}
              >
                <Pressable style={styles.listItemLeft} onPress={() => handleOpenVendorModal(vendor)}>
                  <View style={[styles.vendorAvatar, { backgroundColor: theme.tint + "15" }]}>
                    <Ionicons name="storefront-outline" size={18} color={theme.tint} />
                  </View>
                  <View>
                    <Text style={[styles.listItemName, { color: theme.text, fontFamily: "Poppins_400Regular" }]}>{vendor.name}</Text>
                    <Text style={[styles.listItemSub, { color: theme.textSecondary, fontFamily: "Poppins_400Regular" }]}>+{vendor.phone}</Text>
                  </View>
                </Pressable>
                <Pressable
                  onPress={() => handleDeleteVendor(vendor.id, vendor.name)}
                  style={({ pressed }) => [{ opacity: pressed ? 0.5 : 1, padding: 8 }]}
                >
                  <Feather name="trash-2" size={16} color={theme.danger} />
                </Pressable>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      <Modal visible={showAddItemModal} transparent animationType="fade" onRequestClose={() => setShowAddItemModal(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setShowAddItemModal(false)}>
          <Pressable style={[styles.modalContent, { backgroundColor: theme.surface }]} onPress={() => {}}>
            <Text style={[styles.modalTitle, { color: theme.text, fontFamily: "Poppins_600SemiBold" }]}>Add New Item</Text>
            <TextInput
              style={[styles.modalInput, { backgroundColor: theme.inputBg, color: theme.text, fontFamily: "Poppins_400Regular", borderColor: theme.border }]}
              placeholder="Item name"
              placeholderTextColor={theme.textSecondary}
              value={newItemName}
              onChangeText={setNewItemName}
              autoFocus
            />
            <Text style={[styles.fieldLabel, { color: theme.textSecondary, fontFamily: "Poppins_500Medium" }]}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
              {CATEGORIES.map((cat) => (
                <Pressable
                  key={cat}
                  style={[styles.modalChip, { backgroundColor: newItemCategory === cat ? theme.tint : theme.inputBg, borderColor: newItemCategory === cat ? theme.tint : theme.border }]}
                  onPress={() => setNewItemCategory(cat)}
                >
                  <Text style={[styles.modalChipText, { color: newItemCategory === cat ? "#fff" : theme.text, fontFamily: "Poppins_400Regular" }]}>{cat}</Text>
                </Pressable>
              ))}
            </ScrollView>
            <Text style={[styles.fieldLabel, { color: theme.textSecondary, fontFamily: "Poppins_500Medium" }]}>Unit</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
              {UNIT_OPTIONS.map((u) => (
                <Pressable
                  key={u.value}
                  style={[styles.modalChip, { backgroundColor: newItemUnit === u.value ? theme.tint : theme.inputBg, borderColor: newItemUnit === u.value ? theme.tint : theme.border }]}
                  onPress={() => setNewItemUnit(u.value)}
                >
                  <Text style={[styles.modalChipText, { color: newItemUnit === u.value ? "#fff" : theme.text, fontFamily: "Poppins_400Regular" }]}>{u.label}</Text>
                </Pressable>
              ))}
            </ScrollView>
            <View style={styles.modalActions}>
              <Pressable onPress={() => setShowAddItemModal(false)} style={[styles.modalBtn, { backgroundColor: theme.inputBg }]}>
                <Text style={[styles.modalBtnText, { color: theme.textSecondary, fontFamily: "Poppins_500Medium" }]}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleAddItem}
                style={[styles.modalBtn, { backgroundColor: theme.tint, opacity: newItemName.trim() ? 1 : 0.5 }]}
                disabled={!newItemName.trim()}
              >
                <Text style={[styles.modalBtnText, { color: "#fff", fontFamily: "Poppins_600SemiBold" }]}>Add</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={showVendorModal} transparent animationType="fade" onRequestClose={() => setShowVendorModal(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setShowVendorModal(false)}>
          <Pressable style={[styles.modalContent, { backgroundColor: theme.surface }]} onPress={() => {}}>
            <Text style={[styles.modalTitle, { color: theme.text, fontFamily: "Poppins_600SemiBold" }]}>
              {editingVendor ? "Edit Vendor" : "Add Vendor"}
            </Text>
            <TextInput
              style={[styles.modalInput, { backgroundColor: theme.inputBg, color: theme.text, fontFamily: "Poppins_400Regular", borderColor: theme.border }]}
              placeholder="Vendor name"
              placeholderTextColor={theme.textSecondary}
              value={vendorName}
              onChangeText={setVendorName}
              autoFocus
            />
            <TextInput
              style={[styles.modalInput, { backgroundColor: theme.inputBg, color: theme.text, fontFamily: "Poppins_400Regular", borderColor: theme.border }]}
              placeholder="WhatsApp number (e.g., 919876543210)"
              placeholderTextColor={theme.textSecondary}
              value={vendorPhone}
              onChangeText={setVendorPhone}
              keyboardType="phone-pad"
            />
            <View style={styles.modalActions}>
              <Pressable onPress={() => setShowVendorModal(false)} style={[styles.modalBtn, { backgroundColor: theme.inputBg }]}>
                <Text style={[styles.modalBtnText, { color: theme.textSecondary, fontFamily: "Poppins_500Medium" }]}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleSaveVendor}
                style={[styles.modalBtn, { backgroundColor: theme.tint, opacity: vendorName.trim() && vendorPhone.trim() ? 1 : 0.5 }]}
                disabled={!vendorName.trim() || !vendorPhone.trim()}
              >
                <Text style={[styles.modalBtnText, { color: "#fff", fontFamily: "Poppins_600SemiBold" }]}>{editingVendor ? "Save" : "Add"}</Text>
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
  header: { paddingHorizontal: 20, paddingBottom: 12 },
  headerTitle: { fontSize: 28, lineHeight: 34 },
  headerSubtitle: { fontSize: 13, marginTop: 2 },
  scrollContent: { padding: 16, gap: 24 },
  section: {},
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  sectionTitle: { fontSize: 12, textTransform: "uppercase" as const, letterSpacing: 0.5, marginBottom: 8 },
  card: { borderRadius: 16, borderWidth: 1, overflow: "hidden" },
  nameRow: { flexDirection: "row", alignItems: "center", padding: 16, gap: 12 },
  nameIcon: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  nameLabel: { fontSize: 11 },
  nameText: { fontSize: 16, marginTop: 1 },
  nameEditRow: { flexDirection: "row", alignItems: "center", gap: 10, padding: 12 },
  nameInput: { flex: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, borderWidth: 1 },
  saveBtn: { width: 42, height: 42, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  addChip: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 16 },
  addChipText: { fontSize: 12 },
  listItem: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 10, paddingHorizontal: 14 },
  listItemLeft: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  itemThumb: { width: 36, height: 36, borderRadius: 10, overflow: "hidden", alignItems: "center", justifyContent: "center" },
  thumbImg: { width: "100%", height: "100%" },
  vendorAvatar: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  listItemName: { fontSize: 14 },
  listItemSub: { fontSize: 11, marginTop: 1 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center", padding: 24 },
  modalContent: { width: "100%", maxWidth: 400, borderRadius: 20, padding: 24 },
  modalTitle: { fontSize: 20, marginBottom: 16 },
  modalInput: { borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, marginBottom: 12, borderWidth: 1 },
  fieldLabel: { fontSize: 12, marginBottom: 8, textTransform: "uppercase" as const, letterSpacing: 0.5 },
  chipScroll: { marginBottom: 16 },
  modalChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, marginRight: 8 },
  modalChipText: { fontSize: 13 },
  modalActions: { flexDirection: "row", gap: 12, marginTop: 4 },
  modalBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: "center" },
  modalBtnText: { fontSize: 15 },
});
