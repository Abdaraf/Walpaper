// Attempt to load AdMob native module — gracefully falls back if unavailable (e.g. Expo Go)
let admob: typeof import("react-native-google-mobile-ads") | null = null;
try {
  admob = require("react-native-google-mobile-ads");
  // Quick smoke-test: accessing any property forces the native bridge to load
  void admob!.TestIds;
} catch {
  admob = null;
}

export const IS_AD_SUPPORTED = admob !== null;

export const TestIds = admob?.TestIds ?? {
  ADAPTIVE_BANNER: "",
  BANNER: "",
  REWARDED: "",
  INTERSTITIAL: "",
};

export const BannerAdSize = admob?.BannerAdSize ?? {
  ANCHORED_ADAPTIVE_BANNER: "ANCHORED_ADAPTIVE_BANNER",
  BANNER: "BANNER",
};

export const AdEventType = admob?.AdEventType ?? {
  LOADED: "loaded",
  CLOSED: "closed",
  ERROR: "error",
  OPENED: "opened",
};

export const AppOpenAd = admob?.AppOpenAd ?? {
  createForAdRequest: (_unitId: string) => ({
    load: () => {},
    show: () => {},
    addEventListener: (_event: string, _cb: () => void) => ({ remove: () => {} }),
  }),
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const BannerAd: any = admob?.BannerAd ?? (() => null);

export function useRewardedAd(unitId: string, opts?: object) {
  if (admob?.useRewardedAd) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return admob.useRewardedAd(unitId, opts);
  }
  return { isLoaded: false, isClosed: false, reward: undefined, load: () => {}, show: () => {} };
}

export function useInterstitialAd(unitId: string, opts?: object) {
  if (admob?.useInterstitialAd) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return admob.useInterstitialAd(unitId, opts);
  }
  return { isLoaded: false, isClosed: false, load: () => {}, show: () => {} };
}
