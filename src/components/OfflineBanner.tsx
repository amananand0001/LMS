/**
 * OfflineBanner.tsx
 *
 * Displays a sticky amber banner at the top of the screen when the device
 * has no internet connection. Animates in on disconnect, slides out on reconnect.
 */

import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNetworkStore } from '@/store/networkStore';
import { Colors, Spacing, Typography } from '@/constants/theme';

const BANNER_HEIGHT = 44;

export default function OfflineBanner() {
  const isConnected = useNetworkStore((s) => s.isConnected);
  const slideAnim = useRef(new Animated.Value(-BANNER_HEIGHT)).current;

  // Track whether we should keep the component mounted (for the slide-out animation)
  const [isMounted, setIsMounted] = useState(!isConnected);

  useEffect(() => {
    if (!isConnected) {
      // Mount first, then animate in
      setIsMounted(true);
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 80,
        friction: 10,
      }).start();
    } else {
      // Animate out, then unmount
      Animated.timing(slideAnim, {
        toValue: -BANNER_HEIGHT,
        duration: 280,
        useNativeDriver: true,
      }).start(() => setIsMounted(false));
    }
  }, [isConnected, slideAnim]);

  if (!isMounted) return null;

  return (
    <Animated.View style={[styles.banner, { transform: [{ translateY: slideAnim }] }]}>
      <View style={styles.inner}>
        <Ionicons name="cloud-offline-outline" size={16} color={Colors.textInverse} />
        <View style={styles.textWrap}>
          <Text style={styles.title}>No Internet Connection</Text>
          <Text style={styles.subtitle}>Showing cached data — some actions are unavailable</Text>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    backgroundColor: '#D97706', // amber-600
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.base,
    height: BANNER_HEIGHT,
    justifyContent: 'center',
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  textWrap: { flex: 1 },
  title: {
    color: Colors.textInverse,
    fontSize: Typography.xs,
    fontWeight: '700',
  },
  subtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 10,
    marginTop: 1,
  },
});
