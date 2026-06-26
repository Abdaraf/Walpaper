import React from "react";
import { View } from "react-native";

export const IS_AD_SUPPORTED = false;

export const TestIds = {
  ADAPTIVE_BANNER: "",
  BANNER: "",
  REWARDED: "",
  INTERSTITIAL: "",
  APP_OPEN: "",
};

export const BannerAdSize = {
  ANCHORED_ADAPTIVE_BANNER: "ANCHORED_ADAPTIVE_BANNER",
  BANNER: "BANNER",
};

export const AdEventType = {
  LOADED: "loaded",
  CLOSED: "closed",
  ERROR: "error",
  OPENED: "opened",
};

export function BannerAd(_props: unknown) {
  return React.createElement(View, null);
}

export function useRewardedAd(_unitId: string, _opts?: unknown) {
  return {
    isLoaded: false,
    isClosed: false,
    reward: undefined as undefined,
    load: () => {},
    show: () => {},
  };
}

export function useInterstitialAd(_unitId: string, _opts?: unknown) {
  return {
    isLoaded: false,
    isClosed: false,
    load: () => {},
    show: () => {},
  };
}

export const AppOpenAd = {
  createForAdRequest: (_unitId: string) => ({
    load: () => {},
    show: () => {},
    addEventlistener: () => () => {},
    addEventListenerL: () => () => {},
    addEventListener: (_event: string, _cb: () => void) => ({ remove: () => {} }),
    loaded: false,
  }),
};
