import React, { useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuthStore } from '@/store/authStore';
import { useCourseStore } from '@/store/courseStore';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { authApi } from '@/services/api';
import { Colors, Radius, Shadow, Spacing, Typography } from '@/constants/theme';

type IoniconsName = keyof typeof Ionicons.glyphMap;

interface MenuItemProps {
  icon: IoniconsName;
  label: string;
  value?: string;
  onPress?: () => void;
  danger?: boolean;
  showChevron?: boolean;
}

function MenuItem({ icon, label, value, onPress, danger = false, showChevron = true }: MenuItemProps) {
  return (
    <Pressable
      style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed]}
      onPress={onPress}
    >
      <View style={[styles.menuIconWrap, danger && styles.menuIconDanger]}>
        <Ionicons name={icon} size={18} color={danger ? Colors.error : Colors.primary} />
      </View>
      <View style={styles.menuContent}>
        <Text style={[styles.menuLabel, danger && styles.menuLabelDanger]}>{label}</Text>
        {value && <Text style={styles.menuValue} numberOfLines={1}>{value}</Text>}
      </View>
      {showChevron && !danger && (
        <Ionicons name="chevron-forward" size={16} color={Colors.textDisabled} />
      )}
    </Pressable>
  );
}

interface StatItemProps {
  icon: IoniconsName;
  label: string;
  value: string;
  color: string;
}

function StatItem({ icon, label, value, color }: StatItemProps) {
  return (
    <View style={styles.statItem}>
      <Ionicons name={icon} size={22} color={color} />
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export default function ProfileScreen() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const setUser = useAuthStore((s) => s.setUser);
  const bookmarkedIds = useCourseStore((s) => s.bookmarkedIds);
  const courses = useCourseStore((s) => s.courses);
  const [loggingOut, setLoggingOut] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // ── Avatar Upload ────────────────────────────────────────────────────────────

  async function handleAvatarEdit() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please allow access to your photo library to update your avatar.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    const formData = new FormData();
    // @ts-expect-error — React Native FormData accepts this object shape
    formData.append('avatar', {
      uri: asset.uri,
      type: asset.mimeType ?? 'image/jpeg',
      name: asset.fileName ?? 'avatar.jpg',
    });

    setUploadingAvatar(true);
    try {
      const response = await authApi.updateAvatar(formData);
      setUser(response.data.data);
      Alert.alert('Success', 'Profile picture updated!');
    } catch {
      Alert.alert('Upload Failed', 'Could not update your profile picture. Please try again.');
    } finally {
      setUploadingAvatar(false);
    }
  }

  // ── Logout ───────────────────────────────────────────────────────────────────

  function confirmLogout() {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: handleLogout },
    ]);
  }

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await logout();
      router.replace('/(auth)/login');
    } catch {
      Alert.alert('Error', 'Failed to log out. Please try again.');
    } finally {
      setLoggingOut(false);
    }
  }

  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : '—';

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>Profile</Text>
        </View>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <Pressable onPress={handleAvatarEdit} disabled={uploadingAvatar}>
            <Avatar
              uri={user?.avatar?.url}
              name={user?.username}
              size={90}
              showEditOverlay={!uploadingAvatar}
            />
            {uploadingAvatar && (
              <View style={styles.uploadingOverlay}>
                <Ionicons name="cloud-upload-outline" size={22} color={Colors.textInverse} />
              </View>
            )}
          </Pressable>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{user?.username ?? '—'}</Text>
            <Text style={styles.profileEmail}>{user?.email ?? '—'}</Text>
            <View style={styles.badgeRow}>
              <View style={styles.badge}>
                <Ionicons
                  name={user?.role === 'ADMIN' ? 'shield-checkmark' : 'school'}
                  size={12}
                  color={Colors.primary}
                />
                <Text style={styles.badgeText}>
                  {user?.role === 'ADMIN' ? 'Admin' : 'Learner'}
                </Text>
              </View>
              {user?.isEmailVerified && (
                <View style={[styles.badge, styles.verifiedBadge]}>
                  <Ionicons name="checkmark-circle" size={12} color={Colors.success} />
                  <Text style={[styles.badgeText, styles.verifiedText]}>Verified</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsCard}>
          <StatItem icon="book-outline" label="Enrolled" value={String(courses.length)} color={Colors.primary} />
          <View style={styles.statDivider} />
          <StatItem icon="checkmark-done-outline" label="Completed" value="0" color={Colors.success} />
          <View style={styles.statDivider} />
          <StatItem icon="bookmark-outline" label="Bookmarks" value={String(bookmarkedIds.size)} color={Colors.accent} />
        </View>

        {/* Account */}
        <Text style={styles.sectionLabel}>ACCOUNT</Text>
        <View style={styles.menuCard}>
          <MenuItem icon="person-outline" label="Username" value={user?.username} showChevron={false} />
          <View style={styles.menuDivider} />
          <MenuItem icon="mail-outline" label="Email" value={user?.email} showChevron={false} />
          <View style={styles.menuDivider} />
          <MenuItem icon="calendar-outline" label="Member Since" value={memberSince} showChevron={false} />
          <View style={styles.menuDivider} />
          <MenuItem icon="image-outline" label="Update Avatar" onPress={handleAvatarEdit} />
        </View>

        {/* Preferences */}
        <Text style={styles.sectionLabel}>PREFERENCES</Text>
        <View style={styles.menuCard}>
          <MenuItem icon="notifications-outline" label="Notifications" onPress={() => {}} />
          <View style={styles.menuDivider} />
          <MenuItem icon="globe-outline" label="Language" value="English" onPress={() => {}} />
          <View style={styles.menuDivider} />
          <MenuItem icon="color-palette-outline" label="Appearance" value="Light" onPress={() => {}} />
        </View>

        {/* Support */}
        <Text style={styles.sectionLabel}>SUPPORT</Text>
        <View style={styles.menuCard}>
          <MenuItem icon="help-circle-outline" label="Help & FAQ" onPress={() => {}} />
          <View style={styles.menuDivider} />
          <MenuItem icon="chatbubble-outline" label="Send Feedback" onPress={() => {}} />
          <View style={styles.menuDivider} />
          <MenuItem icon="information-circle-outline" label="About" value="v1.0.0" showChevron={false} />
        </View>

        {/* Logout */}
        <View style={styles.logoutContainer}>
          <Button
            title={loggingOut ? 'Logging out...' : 'Log Out'}
            variant="outline"
            onPress={confirmLogout}
            loading={loggingOut}
            style={styles.logoutBtn}
          />
        </View>

        <Text style={styles.footer}>LearnHub · v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.surface },
  scroll: { paddingHorizontal: Spacing.base, paddingBottom: Spacing['4xl'] },
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Spacing.base,
    paddingBottom: Spacing.base,
  },
  pageTitle: {
    fontSize: Typography['2xl'],
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -0.3,
  },
  profileCard: {
    backgroundColor: Colors.background,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    marginBottom: Spacing.base,
    ...Shadow.md,
  },
  uploadingOverlay: {
    ...StyleSheet.absoluteFill,
    borderRadius: 45,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInfo: { alignItems: 'center', marginTop: Spacing.base },
  profileName: {
    fontSize: Typography.xl,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -0.3,
    marginBottom: 2,
  },
  profileEmail: { fontSize: Typography.sm, color: Colors.textSecondary, marginBottom: Spacing.sm },
  badgeRow: { flexDirection: 'row', gap: Spacing.sm },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primarySoft,
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  badgeText: { fontSize: Typography.xs, color: Colors.primary, fontWeight: '600' },
  verifiedBadge: { backgroundColor: Colors.successLight },
  verifiedText: { color: Colors.success },
  statsCard: {
    backgroundColor: Colors.background,
    borderRadius: Radius.xl,
    padding: Spacing.base,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xl,
    ...Shadow.sm,
  },
  statItem: { flex: 1, alignItems: 'center', paddingVertical: Spacing.sm, gap: 4 },
  statValue: { fontSize: Typography.xl, fontWeight: '800' },
  statLabel: { fontSize: Typography.xs, color: Colors.textSecondary, fontWeight: '500' },
  statDivider: { width: 1, height: 44, backgroundColor: Colors.border },
  sectionLabel: {
    fontSize: Typography.xs,
    fontWeight: '700',
    color: Colors.textSecondary,
    letterSpacing: 1.2,
    marginBottom: Spacing.sm,
    marginLeft: Spacing.xs,
  },
  menuCard: {
    backgroundColor: Colors.background,
    borderRadius: Radius.xl,
    marginBottom: Spacing.xl,
    overflow: 'hidden',
    ...Shadow.sm,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.base,
    gap: Spacing.md,
  },
  menuItemPressed: { backgroundColor: Colors.surfaceHover },
  menuIconWrap: {
    width: 34,
    height: 34,
    borderRadius: Radius.sm,
    backgroundColor: Colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuIconDanger: { backgroundColor: Colors.errorLight },
  menuContent: { flex: 1 },
  menuLabel: { fontSize: Typography.base, color: Colors.textPrimary, fontWeight: '500' },
  menuLabelDanger: { color: Colors.error },
  menuValue: { fontSize: Typography.xs, color: Colors.textSecondary, marginTop: 1 },
  menuDivider: { height: 1, backgroundColor: Colors.borderLight, marginLeft: 66 },
  logoutContainer: { marginTop: Spacing.sm, marginBottom: Spacing.xl },
  logoutBtn: { borderColor: Colors.error },
  footer: {
    textAlign: 'center',
    fontSize: Typography.xs,
    color: Colors.textDisabled,
    marginTop: Spacing.sm,
  },
});
