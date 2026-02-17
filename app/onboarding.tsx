import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  ScrollView,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTheme } from "@/lib/useTheme";
import { getApiUrl } from "@/lib/query-client";

export default function OnboardingScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const [formData, setFormData] = useState({
    shopName: "",
    ownerName: "",
    phone: "",
    address: "",
    gst: "",
    turnover: "",
    role: "shop_owner", // 'shop_owner' or 'agency'
    language: "English",
  });

  const [loading, setLoading] = useState(false);

  const roles = [
    { label: "Shop Owner", value: "shop_owner", icon: "storefront-outline" },
    { label: "Agency", value: "agency", icon: "business-outline" },
  ];

  const languages = ["English", "Hindi", "Marathi", "Gujarati"];

  const handleFinish = async () => {
    // Validation (GST is optional)
    const requiredFields = ["shopName", "ownerName", "phone", "address", "turnover", "role", "language"];
    const isMissing = requiredFields.some(field => !formData[field as keyof typeof formData]);

    if (isMissing) {
      Alert.alert("Required Fields", "Please fill in all fields except GST.");
      return;
    }

    setLoading(true);
    try {
      const baseUrl = getApiUrl();
      const response = await fetch(`${baseUrl}/api/profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        await AsyncStorage.setItem("@onboarding_complete", "true");
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.replace("/(tabs)");
      } else {
        throw new Error("Failed to save profile");
      }
    } catch (error) {
      Alert.alert("Connection Error", "Could not save profile. Is the server running?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={[styles.iconBox, { backgroundColor: theme.tint + "15" }]}>
            <Ionicons name="rocket" size={32} color={theme.tint} />
          </View>
          <Text style={[styles.title, { color: theme.text, fontFamily: "Poppins_700Bold" }]}>Welcome!</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary, fontFamily: "Poppins_400Regular" }]}>
            Let's set up your profile to customize your experience.
          </Text>
        </View>

        <View style={styles.form}>
          <Text style={[styles.label, { color: theme.text, fontFamily: "Poppins_600SemiBold" }]}>Shop Details</Text>

          <TextInput
            style={[styles.input, { backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }]}
            placeholder="Shop Name"
            placeholderTextColor={theme.textSecondary}
            value={formData.shopName}
            onChangeText={(t) => setFormData({ ...formData, shopName: t })}
          />

          <TextInput
            style={[styles.input, { backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }]}
            placeholder="Owner Name"
            placeholderTextColor={theme.textSecondary}
            value={formData.ownerName}
            onChangeText={(t) => setFormData({ ...formData, ownerName: t })}
          />

          <TextInput
            style={[styles.input, { backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }]}
            placeholder="Phone Number"
            placeholderTextColor={theme.textSecondary}
            keyboardType="phone-pad"
            value={formData.phone}
            onChangeText={(t) => setFormData({ ...formData, phone: t })}
          />

          <TextInput
            style={[styles.input, { backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border, height: 80, textAlignVertical: 'top' }]}
            placeholder="Full Address"
            placeholderTextColor={theme.textSecondary}
            multiline
            value={formData.address}
            onChangeText={(t) => setFormData({ ...formData, address: t })}
          />

          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <TextInput
                style={[styles.input, { backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }]}
                placeholder="GST (Optional)"
                placeholderTextColor={theme.textSecondary}
                value={formData.gst}
                onChangeText={(t) => setFormData({ ...formData, gst: t })}
              />
            </View>
            <View style={{ width: 12 }} />
            <View style={{ flex: 1 }}>
              <TextInput
                style={[styles.input, { backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }]}
                placeholder="Turnover"
                placeholderTextColor={theme.textSecondary}
                value={formData.turnover}
                onChangeText={(t) => setFormData({ ...formData, turnover: t })}
              />
            </View>
          </View>

          <Text style={[styles.label, { color: theme.text, fontFamily: "Poppins_600SemiBold", marginTop: 10 }]}>I am a...</Text>
          <View style={styles.roleRow}>
            {roles.map((r) => (
              <Pressable
                key={r.value}
                style={[
                  styles.roleCard,
                  {
                    backgroundColor: formData.role === r.value ? theme.tint : theme.inputBg,
                    borderColor: formData.role === r.value ? theme.tint : theme.border
                  }
                ]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setFormData({ ...formData, role: r.value });
                }}
              >
                <Ionicons name={r.icon as any} size={24} color={formData.role === r.value ? "#fff" : theme.textSecondary} />
                <Text style={[styles.roleLabel, { color: formData.role === r.value ? "#fff" : theme.text, fontFamily: "Poppins_500Medium" }]}>
                  {r.label}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={[styles.label, { color: theme.text, fontFamily: "Poppins_600SemiBold", marginTop: 10 }]}>Language</Text>
          <View style={styles.langGrid}>
            {languages.map((l) => (
              <Pressable
                key={l}
                style={[
                  styles.langChip,
                  {
                    backgroundColor: formData.language === l ? theme.tint + "15" : "transparent",
                    borderColor: formData.language === l ? theme.tint : theme.border
                  }
                ]}
                onPress={() => setFormData({ ...formData, language: l })}
              >
                <Text style={[styles.langText, { color: formData.language === l ? theme.tint : theme.text, fontFamily: "Poppins_500Medium" }]}>
                  {l}
                </Text>
              </Pressable>
            ))}
          </View>

          <Pressable
            style={[styles.submitBtn, { backgroundColor: theme.tint, opacity: loading ? 0.7 : 1 }]}
            onPress={handleFinish}
            disabled={loading}
          >
            <Text style={[styles.submitBtnText, { fontFamily: "Poppins_700Bold" }]}>
              {loading ? "Saving Profile..." : "Get Started"}
            </Text>
            <Ionicons name="arrow-forward" size={20} color="#fff" />
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: 24 },
  header: { alignItems: "center", marginBottom: 32 },
  iconBox: { width: 64, height: 64, borderRadius: 20, alignItems: "center", justifyContent: "center", marginBottom: 16 },
  title: { fontSize: 28, marginBottom: 8 },
  subtitle: { fontSize: 15, textAlign: "center", lineHeight: 22 },
  form: { gap: 16 },
  label: { fontSize: 16, marginBottom: 4 },
  input: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    borderWidth: 1,
  },
  row: { flexDirection: "row" },
  roleRow: { flexDirection: "row", gap: 12 },
  roleCard: { flex: 1, padding: 16, borderRadius: 16, borderWidth: 1, alignItems: "center", gap: 8 },
  roleLabel: { fontSize: 13 },
  langGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  langChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, borderWidth: 1 },
  langText: { fontSize: 14 },
  submitBtn: {
    marginTop: 20,
    paddingVertical: 18,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  submitBtnText: { color: "#fff", fontSize: 17 },
});
