import { useContext } from "react";
import { BottomTabBarHeightContext } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";

function useOptionalTabBarHeight(): number {
  const h = useContext(BottomTabBarHeightContext);
  return typeof h === "number" && Number.isFinite(h) ? h : 0;
}

/** ScrollView content padding: home indicator + tab bar + extra. */
export function useScrollContentBottomPad(extra = 20): number {
  const insets = useSafeAreaInsets();
  return insets.bottom + useOptionalTabBarHeight() + extra;
}
