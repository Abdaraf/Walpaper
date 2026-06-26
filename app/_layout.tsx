import {
  Inter_400Regular,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useRef } from "react";
import { AppState, AppStateStatus, Platform } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AdEventType, AppOpenAd, IS_AD_SUPPORTED } from "../lib/ads";

SplashScreen.preventAutoHideAsync();

// ─── App Open Ad ─────────────────────────────────────────────────────────────
const APP_OPEN_ID = "ca-app-pub-8908825045510893/7206430961";

let appOpenAdInstance: ReturnType<typeof AppOpenAd.createForAdRequest> | null = null;
let isAdLoaded = false;
let isAdShowing = false;

function loadAppOpenAd() {
  if (!IS_AD_SUPPORTED || Platform.OS === "web") return;
  try {
    appOpenAdInstance = AppOpenAd.createForAdRequest(APP_OPEN_ID, {
      requestNonPersonalizedAdsOnly: false,
    });
    appOpenAdInstance.addEventListener(AdEventType.LOADED, () => {
      isAdLoaded = true;
    });
    appOpenAdInstance.addEventListener(AdEventType.CLOSED, () => {
      isAdShowing = false;
      isAdLoaded = false;
      loadAppOpenAd(); // reload for next time
    });
    appOpenAdInstance.addEventListener(AdEventType.ERROR, () => {
      isAdLoaded = false;
      isAdShowing = false;
    });
    appOpenAdInstance.load();
  } catch {
    // ignore if module not available in this environment
  }
}

function showAppOpenAd() {
  if (!IS_AD_SUPPORTED || Platform.OS === "web") return;
  if (!appOpenAdInstance || !isAdLoaded || isAdShowing) return;
  try {
    isAdShowing = true;
    appOpenAdInstance.show();
  } catch {
    isAdShowing = false;
  }
}

// ─── Root Layout ──────────────────────────────────────────────────────────────
export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  const appState = useRef(AppState.currentState);
  const isFirstLaunch = useRef(true);

  // Load App Open ad on mount
  useEffect(() => {
    loadAppOpenAd();
  }, []);

  // Show on first launch after fonts ready
  useEffect(() => {
    if ((fontsLoaded || fontError) && isFirstLaunch.current) {
      isFirstLaunch.current = false;
      SplashScreen.hideAsync();
      // Small delay so splash hides before ad appears
      setTimeout(showAppOpenAd, 800);
    }
  }, [fontsLoaded, fontError]);

  // Show when app returns from background
  useEffect(() => {
    const sub = AppState.addEventListener("change", (nextState: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && nextState === "active") {
        showAppOpenAd();
      }
      appState.current = nextState;
    });
    return () => sub.remove();
  }, []);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <Stack screenOptions={{ headerShown: false, animation: "fade" }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="home" />
        </Stack>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
