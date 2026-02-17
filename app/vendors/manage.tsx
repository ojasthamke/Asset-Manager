import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  Alert,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/lib/useTheme";
import { Vendor, loadVendors } from "@/lib/store"; // Assuming loadVendors is in lib/store

// Helper to get the correct API URL - assuming it's also in lib/store or a utility file
const getBaseUrl = () => "https://quick-order-server-y11j.onrender.com";

interface VendorFormState {
  id?: string; // For editing
  name: string;
  phone: string;
}

export default function ManageVendorsScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<VendorFormState>({ name: "", phone: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false); // State to control form visibility

  useEffect(() => {
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    setLoading(true);
    try {
      // Assuming loadVendors handles fetching from API and caching
      const fetchedVendors = await loadVendors();
      setVendors(fetchedVendors);
    } catch (error) {
      Alert.alert("Error", "Failed to load vendors. Please check your connection.");
      console.error("Failed to load vendors:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof VendorFormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    if (!form.name.trim()) {
      Alert.alert("Validation Error", "Vendor name cannot be empty.");
      return false;
    }
    // Basic phone validation (can be enhanced with regex)
    if (!form.phone.trim() || !/^\d+$/.test(form.phone.trim())) {
      Alert.alert("Validation Error", "Phone number must be numeric and not empty.");
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (!validateForm()) return;

    setIsSubmitting(true);
    const baseUrl = getBaseUrl();
    const method = form.id ? "PUT" : "POST";
    const url = form.id ? `${baseUrl}/api/vendors/${form.id}` : `${baseUrl}/api/vendors`;

    try {
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: form.name, phone: form.phone }),
      });

      if (response.ok) {
        Alert.alert("Success", `Vendor ${form.id ? "updated" : "added"} successfully!`);
        setForm({ name: "", phone: "" }); // Clear form
        setShowForm(false); // Hide form after submission
        fetchVendors(); // Refresh list
      } else {
        const errorData = await response.json();
        Alert.alert("Error", `Failed to ${form.id ? "update" : "add"} vendor: ${errorData.error || response.statusText}`);
      }
    } catch (error) {
      Alert.alert("Network Error", `Could not connect to the server. Please try again.`);
      console.error("Vendor submission error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (vendor: Vendor) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setForm({ id: vendor.id, name: vendor.name, phone: vendor.phone });
    setShowForm(true); // Show form for editing
  };

  const handleDelete = (vendorId: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert(
      "Delete Vendor",
      "Are you sure you want to delete this vendor? This action cannot be undone and will delete all associated items and orders.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setIsSubmitting(true); // Use submitting state for delete too
            try {
              const response = await fetch(`${getBaseUrl()}/api/vendors/${vendorId}`, {
                method: "DELETE",
              });

              if (response.ok) {
                Alert.alert("Success", "Vendor deleted successfully!");
                fetchVendors(); // Refresh list
              } else {
                const errorData = await response.json();
                Alert.alert("Error", `Failed to delete vendor: ${errorData.error || response.statusText}`);
              }
            } catch (error) {
              Alert.alert("Network Error", "Could not connect to the server.");
              console.error("Vendor deletion error:", error);
            } finally {
              setIsSubmitting(false);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.tint} />
        <Text style={{ color: theme.textSecondary, marginTop: 10 }}>Loading Vendors...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </Pressable>
        <Text style={[styles.title, { color: theme.text, fontFamily: "Poppins_700Bold" }]}>Manage Vendors</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Toggle Form Button */}
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setShowForm((prev) => !prev);
            setForm({ name: "", phone: "" }); // Clear form on toggle
          }}
          style={[styles.toggleFormButton, { backgroundColor: theme.tint, borderColor: theme.tint }]}
        >
          <Ionicons name={showForm ? "remove-circle-outline" : "add-circle-outline"} size={20} color="#fff" />
          <Text style={[styles.toggleFormButtonText, { color: '#fff' }]}>{showForm ? "Hide Form" : "Add New Vendor"}</Text>
        </Pressable>

        {showForm && (
          <View style={[styles.formContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.formTitle, { color: theme.text, fontFamily: "Poppins_600SemiBold" }]}>
              {form.id ? "Edit Vendor" : "Add New Vendor"}
            </Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }]}
              placeholder="Vendor Name"
              placeholderTextColor={theme.textSecondary}
              value={form.name}
              onChangeText={(text) => handleInputChange("name", text)}
              editable={!isSubmitting}
            />
            <TextInput
              style={[styles.input, { backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }]}
              placeholder="Phone (e.g., 91XXXXXXXXXX)"
              placeholderTextColor={theme.textSecondary}
              keyboardType="phone-pad"
              value={form.phone}
              onChangeText={(text) => handleInputChange("phone", text)}
              editable={!isSubmitting}
            />
            <Pressable
              onPress={handleSubmit}
              style={({ pressed }) => [
                styles.submitButton,
                {
                  backgroundColor: theme.tint,
                  opacity: pressed || isSubmitting ? 0.7 : 1,
                },
              ]}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitButtonText}>{form.id ? "Update Vendor" : "Add Vendor"}</Text>
              )}
            </Pressable>
            {form.id && ( // Show cancel edit button only when editing
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setForm({ name: "", phone: "" });
                  setShowForm(false);
                }}
                style={({ pressed }) => [
                  styles.cancelButton,
                  { opacity: pressed ? 0.7 : 1 },
                ]}
                disabled={isSubmitting}
              >
                <Text style={[styles.cancelButtonText, { color: theme.textSecondary }]}>Cancel Edit</Text>
              </Pressable>
            )}
          </View>
        )}

        <Text style={[styles.listTitle, { color: theme.text, fontFamily: "Poppins_600SemiBold" }]}>
          Existing Vendors
        </Text>
        {vendors.length === 0 ? (
          <Text style={[styles.noVendorsText, { color: theme.textSecondary }]}>No vendors added yet.</Text>
        ) : (
          vendors.map((vendor) => (
            <View
              key={vendor.id}
              style={[styles.vendorCard, { backgroundColor: theme.card, borderColor: theme.border }]}
            >
              <View style={styles.vendorInfo}>
                <Text style={[styles.vendorCardName, { color: theme.text, fontFamily: "Poppins_500Medium" }]}>
                  {vendor.name}
                </Text>
                <Text style={[styles.vendorCardPhone, { color: theme.textSecondary }]}>+{vendor.phone}</Text>
              </View>
              <View style={styles.vendorActions}>
                <Pressable onPress={() => handleEdit(vendor)} style={styles.actionIcon}>
                  <Ionicons name="create-outline" size={22} color={theme.tint} />
                </Pressable>
                <Pressable onPress={() => handleDelete(vendor.id)} style={styles.actionIcon}>
                  <Ionicons name="trash-outline" size={22} color={theme.danger} />
                </Pressable>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#eee", // Use a dynamic border color from theme if available
  },
  backButton: {
    position: "absolute",
    left: 24,
    top: 0, // Adjusted with insets.top for proper alignment
    paddingTop: 10,
    paddingRight: 10,
    zIndex: 1,
  },
  title: { fontSize: 24, flex: 1, textAlign: "center" },
  scrollContent: { padding: 20, gap: 15 },

  toggleFormButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 15,
    borderRadius: 14,
    borderWidth: 1.5,
    marginBottom: 15,
    gap: 8,
  },
  toggleFormButtonText: {
    fontSize: 16,
    fontFamily: "Poppins_600SemiBold",
  },

  formContainer: {
    padding: 20,
    borderRadius: 24,
    borderWidth: 1.5,
    marginBottom: 20,
    gap: 15,
  },
  formTitle: {
    fontSize: 18,
    marginBottom: 10,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
  },
  submitButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Poppins_600SemiBold",
  },
  cancelButton: {
    marginTop: 10,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    fontFamily: "Poppins_500Medium",
  },

  listTitle: {
    fontSize: 18,
    marginBottom: 10,
    marginTop: 5,
  },
  noVendorsText: {
    textAlign: "center",
    marginTop: 20,
    fontSize: 14,
  },
  vendorCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 15,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 10,
  },
  vendorInfo: {
    flex: 1,
  },
  vendorCardName: {
    fontSize: 16,
  },
  vendorCardPhone: {
    fontSize: 12,
    marginTop: 4,
  },
  vendorActions: {
    flexDirection: "row",
    gap: 15,
  },
  actionIcon: {
    padding: 5,
  },
});