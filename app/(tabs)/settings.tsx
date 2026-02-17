import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  Alert,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTheme } from "@/lib/useTheme";
import { loadProfile, Profile } from "@/lib/store";

export default function SettingsScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getProfile() {
      const p = await loadProfile();
      setProfile(p);
      setLoading(false);
    }
    getProfile();
  }, []);

  const handleReset = () => {
    Alert.alert(
      "Reset App",
      "This will clear all your local data and take you back to the onboarding form. Continue?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset Everything",
          style: "destructive",
          onPress: async () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            await AsyncStorage.clear();
            router.replace("/onboarding");
          },
        },
      ]
    );
  };

  if (loading) {
    return <View style={[styles.loading, { backgroundColor: theme.background }]}><ActivityIndicator color={theme.tint} /></View>;
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <Text style={[styles.title, { color: theme.text, fontFamily: "Poppins_700Bold" }]}>Settings</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {profile && (
          <View style={[styles.section, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.sectionHeader}>
              <Ionicons name="person-outline" size={20} color={theme.tint} />
              <Text style={[styles.sectionTitle, { color: theme.text, fontFamily: "Poppins_600SemiBold" }]}>Profile Information</Text>
            </View>
            <View style={styles.profileRow}>
              <Text style={[styles.label, { color: theme.textSecondary }]}>Shop Name</Text>
              <Text style={[styles.value, { color: theme.text }]}>{profile.shopName}</Text>
            </View>
            <View style={styles.profileRow}>
              <Text style={[styles.label, { color: theme.textSecondary }]}>Owner</Text>
              <Text style={[styles.value, { color: theme.text }]}>{profile.ownerName}</Text>
            </View>
            <View style={styles.profileRow}>
              <Text style={[styles.label, { color: theme.textSecondary }]}>Phone</Text>
              <Text style={[styles.value, { color: theme.text }]}>{profile.phone}</Text>
            </View>
            <View style={styles.profileRow}>
              <Text style={[styles.label, { color: theme.textSecondary }]}>Role</Text>
              <Text style={[styles.value, { color: theme.text, textTransform: 'capitalize' }]}>{profile.role.replace('_', ' ')}</Text>
            </View>
          </View>
        )}

        <View style={[styles.section, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="options-outline" size={20} color={theme.tint} />
            <Text style={[styles.sectionTitle, { color: theme.text, fontFamily: "Poppins_600SemiBold" }]}>App Actions</Text>
          </View>
          {profile && profile.role === 'agency' && (
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                router.push("/vendors/manage");
              }}
              style={styles.actionBtn}
            >
              <Ionicons name="people-outline" size={24} color={theme.tint} />
              <Text style={[styles.actionText, { color: theme.text, fontFamily: "Poppins_500Medium" }]}>Manage Vendors</Text>
            </Pressable>
          )}
          <Pressable onPress={handleReset} style={styles.actionBtn}>
            <Ionicons name="refresh-circle-outline" size={24} color={theme.danger} />
            <Text style={[styles.actionText, { color: theme.danger, fontFamily: "Poppins_500Medium" }]}>Reset App & Re-onboard</Text>
          </Pressable>
        </View>

        <Text style={[styles.version, { color: theme.textSecondary }]}>QuickOrder Pro v1.0.0</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { paddingHorizontal: 24, paddingBottom: 20 },
  title: { fontSize: 28 },
  scrollContent: { padding: 20, gap: 20 },
  section: { padding: 20, borderRadius: 24, borderWidth: 1.5 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20 },
  sectionTitle: { fontSize: 16 },
  profileRow: { marginBottom: 16 },
  label: { fontSize: 12, marginBottom: 2, uppercase: true, letterSpacing: 0.5 },
  value: { fontSize: 15, fontFamily: 'Poppins_500Medium' },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  actionText: { fontSize: 15 },
  version: { textAlign: 'center', fontSize: 12, marginTop: 20, opacity: 0.5 },
});
