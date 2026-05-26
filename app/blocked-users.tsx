import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { Button } from "@/src/components/core/Button";
import { ResultsToast } from "@/src/components/core/ResultsToast";
import { Screen } from "@/src/components/core/Screen";
import { ProfileAvatar } from "@/src/components/profile/ProfileAvatar";
import {
  getBlockedUserProfiles,
  unblockUser,
  type BlockedUserProfile,
} from "@/src/features/safety/safetyApi";
import { useScrollContentBottomPad } from "@/src/hooks/useScrollBottomInset";
import { useAppTheme } from "@/src/theme";

export default function BlockedUsersScreen() {
  const router = useRouter();
  const theme = useAppTheme();
  const scrollBottomPad = useScrollContentBottomPad(24);

  const [blockedUsers, setBlockedUsers] = useState<BlockedUserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unblockingId, setUnblockingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const toastOpacity = useRef(new Animated.Value(0)).current;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        scroll: {
          flexGrow: 1,
          gap: theme.spacing.lg,
          paddingBottom: scrollBottomPad,
        },
        topBar: {
          flexDirection: "row",
          alignItems: "center",
          gap: theme.spacing.md,
        },
        backBtn: {
          width: 40,
          height: 40,
          borderRadius: 20,
          alignItems: "center",
          justifyContent: "center",
          borderWidth: 1,
          borderColor: `${theme.colors.primary}55`,
          backgroundColor: `${theme.colors.primary}14`,
        },
        title: {
          ...theme.typography.title,
          color: theme.colors.textPrimary,
          flex: 1,
          fontSize: 22,
        },
        intro: {
          ...theme.typography.body,
          color: theme.colors.textSecondary,
          lineHeight: 22,
        },
        list: {
          gap: theme.spacing.md,
        },
        row: {
          borderRadius: theme.radius.lg,
          borderWidth: 1,
          borderColor: `${theme.colors.sky}33`,
          backgroundColor: theme.colors.surface,
          padding: theme.spacing.lg,
          flexDirection: "row",
          alignItems: "center",
          gap: theme.spacing.md,
        },
        identity: {
          flex: 1,
          minWidth: 0,
        },
        name: {
          ...theme.typography.body,
          color: theme.colors.textPrimary,
          fontWeight: "800",
        },
        userId: {
          ...theme.typography.caption,
          color: theme.colors.textSecondary,
          marginTop: 3,
        },
        state: {
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          gap: theme.spacing.md,
          paddingVertical: theme.spacing.xxl,
        },
        stateIcon: {
          width: 76,
          height: 76,
          borderRadius: 38,
          alignItems: "center",
          justifyContent: "center",
          borderWidth: 1,
          borderColor: `${theme.colors.primary}66`,
          backgroundColor: `${theme.colors.primary}1f`,
        },
        stateTitle: {
          ...theme.typography.title,
          color: theme.colors.textPrimary,
          textAlign: "center",
        },
        error: {
          ...theme.typography.caption,
          color: theme.colors.coral,
          lineHeight: 20,
        },
      }),
    [scrollBottomPad, theme]
  );

  const showToast = useCallback(
    (message: string) => {
      setToastMessage(message);
      setToastVisible(true);
      toastOpacity.stopAnimation();
      toastOpacity.setValue(0);
      Animated.sequence([
        Animated.timing(toastOpacity, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.delay(1800),
        Animated.timing(toastOpacity, {
          toValue: 0,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (finished) {
          setToastVisible(false);
        }
      });
    },
    [toastOpacity]
  );

  const loadBlockedUsers = useCallback(async ({ initial }: { initial: boolean }) => {
    if (initial) {
      setLoading(true);
    }
    setErrorMessage(null);
    try {
      const rows = await getBlockedUserProfiles();
      setBlockedUsers(rows);
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : "Could not load blocked users.");
      setBlockedUsers([]);
    } finally {
      if (initial) {
        setLoading(false);
      }
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadBlockedUsers({ initial: true });
    }, [loadBlockedUsers])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    void loadBlockedUsers({ initial: false }).finally(() => setRefreshing(false));
  }, [loadBlockedUsers]);

  const handleUnblock = useCallback(
    async (user: BlockedUserProfile) => {
      const previous = blockedUsers;
      setUnblockingId(user.id);
      setErrorMessage(null);
      setBlockedUsers((prev) => prev.filter((row) => row.id !== user.id));
      try {
        await unblockUser(user.id);
        showToast("User unblocked");
      } catch (e) {
        setBlockedUsers(previous);
        setErrorMessage(e instanceof Error ? e.message : "Could not unblock this user.");
      } finally {
        setUnblockingId(null);
      }
    },
    [blockedUsers, showToast]
  );

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary, theme.colors.sky]}
          />
        }
      >
        <View style={styles.topBar}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            onPress={() => router.back()}
            style={styles.backBtn}
          >
            <Ionicons name="chevron-back" size={22} color={theme.colors.primary} />
          </Pressable>
          <Text style={styles.title}>Blocked Users</Text>
        </View>

        <Text style={styles.intro}>Manage creators whose sounds are hidden from Discover and Saved.</Text>
        {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}

        {loading ? (
          <View style={styles.state}>
            <ActivityIndicator color={theme.colors.primary} size="large" />
            <Text style={styles.intro}>Loading blocked users...</Text>
          </View>
        ) : blockedUsers.length === 0 ? (
          <View style={styles.state}>
            <View style={styles.stateIcon}>
              <Ionicons name="ban-outline" size={34} color={theme.colors.primary} />
            </View>
            <Text style={styles.stateTitle}>You haven't blocked anyone</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {blockedUsers.map((user) => (
              <View key={user.id} style={styles.row}>
                <ProfileAvatar name={user.displayName} size={44} />
                <View style={styles.identity}>
                  <Text style={styles.name} numberOfLines={1}>
                    {user.displayName}
                  </Text>
                  <Text style={styles.userId} numberOfLines={1}>
                    {user.id}
                  </Text>
                </View>
                <Button
                  label={unblockingId === user.id ? "Unblocking..." : "Unblock"}
                  variant="secondary"
                  disabled={unblockingId === user.id}
                  onPress={() => void handleUnblock(user)}
                />
              </View>
            ))}
          </View>
        )}
      </ScrollView>
      <ResultsToast visible={toastVisible} message={toastMessage} opacityAnim={toastOpacity} theme={theme} />
    </Screen>
  );
}
