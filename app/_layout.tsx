import { QueryClientProvider } from "@tanstack/react-query";
import { Stack, router, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { queryClient } from "@/lib/query-client";
import { OrderProvider } from "@/lib/OrderContext";
import {
  useFonts,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
  Poppins_800ExtraBold,
} from "@expo-google-fonts/poppins";

SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="vendor-items" />
      <Stack.Screen name="preview" />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
    Poppins_800ExtraBold,
  });

  const [appIsReady, setAppIsReady] = useState(false);
  const segments = useSegments();

  useEffect(() => {
    async function checkOnboarding() {
      try {
        const onboardingComplete = await AsyncStorage.getItem("@onboarding_complete");
        const inOnboardingGroup = segments[0] === "onboarding";

        if (onboardingComplete !== "true") {
          // If not complete, force to onboarding
          if (!inOnboardingGroup) {
            router.replace("/onboarding");
          }
        } else {
          // If complete, force to main app if trying to go to onboarding
          if (inOnboardingGroup) {
            router.replace("/(tabs)");
          }
        }
      } catch (e) {
        console.error("Onboarding check failed", e);
      } finally {
        setAppIsReady(true);
      }
    }

    if (fontsLoaded || fontError) {
      checkOnboarding();
    }
  }, [fontsLoaded, fontError, segments]);

  useEffect(() => {
    if (appIsReady) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [appIsReady]);

  if (!fontsLoaded && !fontError) return null;
  if (!appIsReady) return null;

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <KeyboardProvider>
            <OrderProvider>
              <RootLayoutNav />
            </OrderProvider>
          </KeyboardProvider>
        </GestureHandlerRootView>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
