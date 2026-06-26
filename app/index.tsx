import { useRouter } from "expo-router";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  Image,
  Platform,
  StyleSheet,
  Text,
  View,
} from "react-native";

const { width, height } = Dimensions.get("window");

export default function SplashScreen() {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.7)).current;
  const titleFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 60,
          friction: 8,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(titleFade, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();

    const timer = setTimeout(() => {
      router.replace("/home");
    }, 2200);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.iconWrapper,
          { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
        ]}
      >
        <Image
          source={require("../assets/images/icon.png")}
          style={styles.icon}
          resizeMode="contain"
        />
      </Animated.View>

      <Animated.View style={{ opacity: titleFade, alignItems: "center" }}>
        <Text style={styles.title}>خلفيات الكرة</Text>
        <Text style={styles.subtitle}>Football Wallpapers</Text>
      </Animated.View>

      <View style={styles.dotsRow}>
        {[0, 1, 2].map((i) => (
          <View
            key={i}
            style={[styles.dot, i === 1 && { backgroundColor: "#00C853" }]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0D0D0D",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    paddingTop: Platform.OS === "web" ? 67 : 0,
    paddingBottom: Platform.OS === "web" ? 34 : 0,
  },
  iconWrapper: {
    width: 120,
    height: 120,
    borderRadius: 28,
    backgroundColor: "#1A1A1A",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#00C853",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 24,
    elevation: 12,
  },
  icon: {
    width: 90,
    height: 90,
  },
  title: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: "#888888",
    letterSpacing: 2,
    marginTop: 4,
  },
  dotsRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 32,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#333333",
  },
});
