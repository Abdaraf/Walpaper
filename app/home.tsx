import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as MediaLibrary from "expo-media-library";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Dimensions,
  FlatList,
  Image,
  Modal,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  BannerAd,
  BannerAdSize,
  IS_AD_SUPPORTED,
  useInterstitialAd,
  useRewardedAd,
} from "../lib/ads";

const { width, height } = Dimensions.get("window");
const CARD_SIZE = (width - 48) / 2;
const AD_DURATION = 5;
const INTERSTITIAL_EVERY = 5;

// ─── Ad Unit IDs ──────────────────────────────────────────────────────────────
const BANNER_ID        = "ca-app-pub-8908825045510893/5136203765";
const REWARDED_ID      = "ca-app-pub-8908825045510893/4911440112";
const INTERSTITIAL_ID  = "ca-app-pub-8908825045510893/2454200106";

// ─── Wallpapers ───────────────────────────────────────────────────────────────
type Wallpaper = { id: string; source: number };

const WALLPAPERS: Wallpaper[] = [
  // CR7
  { id: "cr7_portugal_lightning2", source: require("../assets/images/wp_cr7_portugal_lightning2.png") },
  { id: "cr7_cyber_portugal",      source: require("../assets/images/wp_cr7_cyber_portugal.png") },
  { id: "cr7_alnassr_stadium",     source: require("../assets/images/wp_cr7_alnassr_stadium.png") },
  { id: "cr7_alnassr_yellow",      source: require("../assets/images/wp_cr7_alnassr_yellow.png") },
  { id: "cr7_vs",                  source: require("../assets/images/wp_cr7_vs.png") },
  { id: "cr7_galaxy_pt",           source: require("../assets/images/wp_cr7_galaxy_portugal.png") },
  { id: "cr7_alnassr_galaxy",      source: require("../assets/images/wp_cr7_alnassr_galaxy.png") },
  { id: "cr7_rm_crown_front",      source: require("../assets/images/wp_cr7_rm_crown_front.png") },
  { id: "cr7_rm_crown_back",       source: require("../assets/images/wp_cr7_rm_crown_back.png") },
  { id: "cr7_portugal_vs",         source: require("../assets/images/wp_cr7_portugal_vs.png") },
  // Messi
  { id: "messi_galaxy_arg",        source: require("../assets/images/wp_messi_galaxy_arg.png") },
  { id: "messi_miami_pink",        source: require("../assets/images/wp_messi_miami_pink.png") },
  { id: "messi_miami2",            source: require("../assets/images/wp_messi_miami2.png") },
  // Mbappe
  { id: "mbappe_bicycle",          source: require("../assets/images/wp_mbappe_bicycle.png") },
  { id: "mbappe_galaxy",           source: require("../assets/images/wp_mbappe_galaxy.png") },
  // Haaland
  { id: "haaland_cosmic",          source: require("../assets/images/wp_haaland_cosmic.png") },
  // Salah
  { id: "salah_cosmic",            source: require("../assets/images/wp_salah_cosmic.png") },
  // Bellingham
  { id: "bellingham_cosmic",       source: require("../assets/images/wp_bellingham_cosmic.png") },
  // Lewandowski
  { id: "lewandowski_cosmic",      source: require("../assets/images/wp_lewandowski_cosmic.png") },
  // Vinicius
  { id: "vinicius_galaxy",         source: require("../assets/images/wp_vinicius_galaxy.png") },
  // Neymar
  { id: "neymar_galaxy",           source: require("../assets/images/wp_neymar_galaxy.png") },
  // Yamal
  { id: "yamal_wings",             source: require("../assets/images/wp_yamal_wings.png") },
  { id: "yamal_galaxy2",           source: require("../assets/images/wp_yamal_galaxy2.png") },
  // Others
  { id: "valverde_crown",          source: require("../assets/images/wp_valverde_crown.png") },
  { id: "guler_ucl",               source: require("../assets/images/wp_guler_ucl.png") },
  { id: "bounou_cosmic",           source: require("../assets/images/wp_bounou_cosmic.png") },
  { id: "bounou_lightning",        source: require("../assets/images/wp_bounou_lightning.png") },
  { id: "hakimi_celestial",        source: require("../assets/images/wp_hakimi_celestial.png") },
  { id: "goalkeeper_rm",           source: require("../assets/images/wp_goalkeeper_rm.png") },
];

// ─── Component ───────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const insets    = useSafeAreaInsets();
  const topPad    = Platform.OS === "web" ? 56 : insets.top;
  const bottomPad = Platform.OS === "web" ? 24 : insets.bottom;

  // ── state ──────────────────────────────────────────────────────────────
  const [simAdVisible, setSimAdVisible]   = useState(false);
  const [viewerVisible, setViewerVisible] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [currentIndex, setCurrentIndex]   = useState(0);
  const [countdown, setCountdown]         = useState(AD_DURATION);
  const [canSkip, setCanSkip]             = useState(false);
  const [saving, setSaving]               = useState(false);
  const [tapCount, setTapCount]           = useState(0);

  // ── animated values ────────────────────────────────────────────────────
  const listFade   = useRef(new Animated.Value(0)).current;
  const sheetSlide = useRef(new Animated.Value(200)).current;
  const adProgress = useRef(new Animated.Value(0)).current;
  const adScale    = useRef(new Animated.Value(0.85)).current;
  const adOpacity  = useRef(new Animated.Value(0)).current;
  const viewerRef  = useRef<FlatList>(null);
  const pendingIdx = useRef(0);

  // ── AdMob hooks (no-ops on web via platform file) ─────────────────────
  const rewarded     = useRewardedAd(REWARDED_ID,     { requestNonPersonalizedAdsOnly: false });
  const interstitial = useInterstitialAd(INTERSTITIAL_ID, { requestNonPersonalizedAdsOnly: false });

  // ── init ───────────────────────────────────────────────────────────────
  useEffect(() => {
    Animated.timing(listFade, { toValue: 1, duration: 500, useNativeDriver: true }).start();
    if (IS_AD_SUPPORTED) {
      rewarded.load();
      interstitial.load();
    }
  }, []);

  // rewarded: open viewer when reward earned
  useEffect(() => {
    if (rewarded.reward) openViewer(pendingIdx.current);
  }, [rewarded.reward]);

  // rewarded: reload after close
  useEffect(() => {
    if (rewarded.isClosed) rewarded.load();
  }, [rewarded.isClosed]);

  // interstitial: open viewer after it closes (no reward needed)
  useEffect(() => {
    if (interstitial.isClosed) {
      interstitial.load();
      openViewer(pendingIdx.current);
    }
  }, [interstitial.isClosed]);

  // ── simulated ad countdown (web / fallback) ────────────────────────────
  useEffect(() => {
    if (!simAdVisible) return;
    setCountdown(AD_DURATION);
    setCanSkip(false);
    adProgress.setValue(0);
    adScale.setValue(0.85);
    adOpacity.setValue(0);

    Animated.parallel([
      Animated.timing(adOpacity,  { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.spring(adScale,    { toValue: 1, tension: 60, friction: 10, useNativeDriver: true }),
      Animated.timing(adProgress, { toValue: 1, duration: AD_DURATION * 1000, useNativeDriver: false }),
    ]).start();

    const interval = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) { clearInterval(interval); finishSimAd(); return 0; }
        return c - 1;
      });
    }, 1000);
    const skipTimer = setTimeout(() => setCanSkip(true), 3000);
    return () => { clearInterval(interval); clearTimeout(skipTimer); };
  }, [simAdVisible]);

  // ── handlers ───────────────────────────────────────────────────────────
  const openViewer = (index: number) => {
    sheetSlide.setValue(200);
    setSelectedIndex(index);
    setCurrentIndex(index);
    setViewerVisible(true);
    setTimeout(() => {
      viewerRef.current?.scrollToIndex({ index, animated: false });
      Animated.spring(sheetSlide, { toValue: 0, tension: 70, friction: 13, useNativeDriver: true }).start();
    }, 100);
  };

  const finishSimAd = () => {
    setSimAdVisible(false);
    openViewer(pendingIdx.current);
  };

  const handleWallpaperTap = (index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    pendingIdx.current = index;

    const newCount = tapCount + 1;
    setTapCount(newCount);

    // Web: use simulated ad
    if (!IS_AD_SUPPORTED) {
      setSimAdVisible(true);
      return;
    }

    // Every INTERSTITIAL_EVERY taps → show interstitial (viewer opens via isClosed effect)
    if (newCount % INTERSTITIAL_EVERY === 0 && interstitial.isLoaded) {
      interstitial.show();
      return;
    }

    // Normal tap → rewarded ad
    if (rewarded.isLoaded) {
      rewarded.show();
    } else {
      // Ad not yet loaded → open directly
      openViewer(index);
    }
  };

  const closeViewer = () => {
    Animated.timing(sheetSlide, { toValue: 200, duration: 200, useNativeDriver: true }).start(() => {
      setViewerVisible(false);
    });
  };

  const getLocalUri = async (source: number): Promise<string> => {
    const { Asset } = await import("expo-asset");
    const asset = await Asset.fromModule(source).downloadAsync();
    return asset.localUri ?? asset.uri;
  };

  const saveToDevice = async () => {
    if (Platform.OS === "web") { Alert.alert("غير متاح", "الحفظ غير متاح على الويب"); return; }
    setSaving(true);
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== "granted") { Alert.alert("إذن مطلوب", "يرجى السماح بالوصول إلى معرض الصور"); return; }
      const uri = await getLocalUri(WALLPAPERS[currentIndex].source);
      await MediaLibrary.saveToLibraryAsync(uri);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("✅ تم الحفظ", "تم حفظ الخلفية في معرض صورك");
    } catch { Alert.alert("خطأ", "حدث خطأ أثناء الحفظ"); }
    finally { setSaving(false); }
  };

  const setAsWallpaper = async () => {
    await saveToDevice();
    if (Platform.OS !== "web") Alert.alert("تعيين كخلفية", "افتح الصورة في تطبيق الصور، ثم اختر «تعيين كخلفية»");
  };

  // ── render helpers ──────────────────────────────────────────────────────
  const renderCard = useCallback(({ item, index }: { item: Wallpaper; index: number }) => (
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={() => handleWallpaperTap(index)}
      style={[styles.card, index % 2 === 0 ? { marginRight: 8 } : { marginLeft: 8 }]}
    >
      <Image source={item.source} style={styles.cardImage} resizeMode="cover" />
    </TouchableOpacity>
  ), [tapCount]);

  const renderViewerPage = useCallback(({ item }: { item: Wallpaper }) => (
    <View style={styles.viewerPage}>
      <Image source={item.source} style={styles.viewerImage} resizeMode="contain" />
    </View>
  ), []);

  // ── render ──────────────────────────────────────────────────────────────
  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <StatusBar barStyle="light-content" backgroundColor="#0D0D0D" />

      {/* ─── Header ─── */}
      <View style={styles.header}>
        <Image
          source={require("../assets/images/store_icon.png")}
          style={styles.headerIcon}
          resizeMode="contain"
        />
        <Text style={styles.headerTitle}>خلفيات الكرة</Text>
      </View>

      {/* ─── Wallpaper Grid ─── */}
      <Animated.View style={{ flex: 1, opacity: listFade }}>
        <FlatList
          data={WALLPAPERS}
          keyExtractor={(w) => w.id}
          renderItem={renderCard}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={[styles.grid, { paddingBottom: bottomPad + 80 }]}
          showsVerticalScrollIndicator={false}
        />
      </Animated.View>

      {/* ─── 1. BANNER AD — bottom of home screen ─── */}
      {IS_AD_SUPPORTED && (
        <View style={[styles.bannerWrapper, { paddingBottom: bottomPad }]}>
          <BannerAd
            unitId={BANNER_ID}
            size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
            requestOptions={{ requestNonPersonalizedAdsOnly: false }}
          />
        </View>
      )}

      {/* ─── 2. REWARDED AD — simulated overlay (works on web + native fallback) ─── */}
      {simAdVisible && (
        <Animated.View style={[styles.adOverlay, { opacity: adOpacity }]}>
          <View style={[styles.adTopBar, { paddingTop: topPad + 4 }]}>
            <View style={styles.adLabel}>
              <Text style={styles.adLabelText}>إعلان بمكافأة</Text>
            </View>
            <View style={styles.countdownBadge}>
              <Text style={styles.countdownText}>{countdown}</Text>
            </View>
          </View>

          <Animated.View style={[styles.adCard, { transform: [{ scale: adScale }] }]}>
            <View style={styles.adBrand}>
              <View style={styles.adBrandIcon}>
                <Feather name="zap" size={28} color="#FFD700" />
              </View>
              <Text style={styles.adBrandName}>Football Pro+</Text>
              <Text style={styles.adBrandSub}>شاهد الإعلان واحصل على الخلفية مجاناً</Text>
            </View>
            <View style={styles.adProgressBar}>
              <Animated.View
                style={[
                  styles.adProgressFill,
                  { width: adProgress.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] }) },
                ]}
              />
            </View>
            <Text style={styles.adProgressLabel}>
              {canSkip ? "يمكنك التخطي الآن" : `انتظر ${countdown} ثانية...`}
            </Text>
          </Animated.View>

          <View style={styles.adBottomRow}>
            {canSkip ? (
              <TouchableOpacity style={styles.skipBtn} onPress={finishSimAd} activeOpacity={0.8}>
                <Feather name="skip-forward" size={16} color="#fff" />
                <Text style={styles.skipText}>تخطي والحصول على الخلفية</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.skipPlaceholder} />
            )}
          </View>
        </Animated.View>
      )}

      {/* ─── Full-Screen Wallpaper Viewer ─── */}
      {viewerVisible && (
        <View style={styles.viewer}>
          <FlatList
            ref={viewerRef}
            data={WALLPAPERS}
            keyExtractor={(w) => w.id}
            renderItem={renderViewerPage}
            horizontal
            pagingEnabled
            initialScrollIndex={selectedIndex}
            getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
            onMomentumScrollEnd={(e) => {
              const i = Math.round(e.nativeEvent.contentOffset.x / width);
              setCurrentIndex(i);
            }}
            showsHorizontalScrollIndicator={false}
          />

          <TouchableOpacity
            onPress={closeViewer}
            style={[styles.closeBtn, { top: (insets.top || 44) + 8 }]}
            activeOpacity={0.8}
          >
            <Feather name="x" size={20} color="#fff" />
          </TouchableOpacity>

          <View style={[styles.dotsRow, { top: (insets.top || 44) + 16 }]}>
            {WALLPAPERS.map((_, i) => (
              <View key={i} style={[styles.dot, i === currentIndex && styles.dotActive]} />
            ))}
          </View>

          {/* Bottom sheet */}
          <Animated.View style={[styles.sheet, { transform: [{ translateY: sheetSlide }], paddingBottom: bottomPad + 12 }]}>
            <View style={styles.sheetHandle} />

            {/* 3. BANNER AD inside viewer sheet */}
            {IS_AD_SUPPORTED ? (
              <View style={styles.viewerBannerWrapper}>
                <BannerAd
                  unitId={BANNER_ID}
                  size={BannerAdSize.BANNER}
                  requestOptions={{ requestNonPersonalizedAdsOnly: false }}
                />
              </View>
            ) : (
              <View style={styles.adSlot}>
                <Text style={styles.adSlotText}>مساحة إعلانية</Text>
              </View>
            )}

            <View style={styles.buttonsRow}>
              <TouchableOpacity style={[styles.btn, styles.btnSave]} onPress={saveToDevice} disabled={saving} activeOpacity={0.8}>
                <Feather name="download" size={18} color="#000" />
                <Text style={[styles.btnText, { color: "#000" }]}>حفظ</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btn, styles.btnWallpaper]} onPress={setAsWallpaper} disabled={saving} activeOpacity={0.8}>
                <Feather name="image" size={18} color="#fff" />
                <Text style={styles.btnText}>تعيين كخلفية</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: "#0D0D0D" },
  header:      { paddingHorizontal: 20, paddingVertical: 14, flexDirection: "row", alignItems: "center", gap: 10 },
  headerIcon:  { width: 38, height: 38, borderRadius: 10 },
  headerTitle: { fontSize: 24, fontFamily: "Inter_700Bold", color: "#fff" },
  grid:        { paddingHorizontal: 16 },
  row:         { marginBottom: 12 },
  card:        { width: CARD_SIZE, height: CARD_SIZE * 1.6, borderRadius: 14, overflow: "hidden", backgroundColor: "#1A1A1A" },
  cardImage:   { width: "100%", height: "100%" },

  /* Banner */
  bannerWrapper:       { backgroundColor: "#0D0D0D", alignItems: "center", paddingTop: 4, borderTopWidth: 1, borderTopColor: "#1A1A1A" },
  viewerBannerWrapper: { alignItems: "center", marginBottom: 14, borderRadius: 10, overflow: "hidden" },

  /* Simulated Rewarded Ad */
  adOverlay:      { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "#050505", zIndex: 999 },
  adTopBar:       { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingBottom: 12 },
  adLabel:        { backgroundColor: "#FFD700", borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4 },
  adLabelText:    { fontSize: 11, fontFamily: "Inter_700Bold", color: "#000", letterSpacing: 0.5 },
  countdownBadge: { width: 38, height: 38, borderRadius: 19, borderWidth: 2, borderColor: "#FFD700", alignItems: "center", justifyContent: "center" },
  countdownText:  { fontSize: 16, fontFamily: "Inter_700Bold", color: "#FFD700" },
  adCard:         { flex: 1, marginHorizontal: 20, borderRadius: 20, backgroundColor: "#111", alignItems: "center", justifyContent: "center", gap: 24, padding: 32 },
  adBrand:        { alignItems: "center", gap: 10 },
  adBrandIcon:    { width: 64, height: 64, borderRadius: 16, backgroundColor: "#1A1A1A", alignItems: "center", justifyContent: "center" },
  adBrandName:    { fontSize: 22, fontFamily: "Inter_700Bold", color: "#fff" },
  adBrandSub:     { fontSize: 13, fontFamily: "Inter_400Regular", color: "#888", textAlign: "center" },
  adProgressBar:  { width: "100%", height: 4, borderRadius: 2, backgroundColor: "#222", overflow: "hidden" },
  adProgressFill: { height: "100%", backgroundColor: "#FFD700", borderRadius: 2 },
  adProgressLabel:{ fontSize: 12, fontFamily: "Inter_400Regular", color: "#555", textAlign: "center" },
  adBottomRow:    { paddingHorizontal: 20, paddingBottom: 40, paddingTop: 16 },
  skipBtn:        { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: "#1A1A1A", borderRadius: 14, paddingVertical: 16 },
  skipText:       { fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#fff" },
  skipPlaceholder:{ height: 54 },

  /* Viewer */
  viewer:      { flex: 1, backgroundColor: "#0D0D0D" },
  viewerPage:  { width, height, backgroundColor: "#0D0D0D", alignItems: "center", justifyContent: "center", paddingTop: 60, paddingBottom: 200 },
  viewerImage: { width: width * 0.82, height: height * 0.62, borderRadius: 18 },
  closeBtn:    { position: "absolute", right: 16, width: 38, height: 38, borderRadius: 19, backgroundColor: "rgba(0,0,0,0.55)", alignItems: "center", justifyContent: "center" },
  dotsRow:     { position: "absolute", left: 0, right: 0, flexDirection: "row", justifyContent: "center", gap: 6 },
  dot:         { width: 6, height: 6, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.3)" },
  dotActive:   { backgroundColor: "#fff", width: 18 },
  sheet:       { backgroundColor: "#111", borderTopLeftRadius: 22, borderTopRightRadius: 22, paddingTop: 10, paddingHorizontal: 20 },
  sheetHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: "#333", alignSelf: "center", marginBottom: 14 },
  adSlot:      { height: 60, borderRadius: 10, backgroundColor: "#1A1A1A", borderWidth: 1, borderColor: "#2A2A2A", borderStyle: "dashed", alignItems: "center", justifyContent: "center", marginBottom: 16 },
  adSlotText:  { color: "#444", fontSize: 11, fontFamily: "Inter_400Regular", letterSpacing: 1 },
  buttonsRow:  { flexDirection: "row", gap: 12, marginBottom: 4 },
  btn:         { flex: 1, height: 52, borderRadius: 14, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  btnSave:     { backgroundColor: "#00C853" },
  btnWallpaper:{ backgroundColor: "#1A1A1A", borderWidth: 1, borderColor: "#333" },
  btnText:     { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#fff" },
});
