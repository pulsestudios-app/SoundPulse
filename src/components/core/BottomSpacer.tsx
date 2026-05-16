import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export function BottomSpacer({ extra = 0 }: { extra?: number }) {
  const { bottom } = useSafeAreaInsets();
  return <View style={{ height: bottom + extra }} />;
}
