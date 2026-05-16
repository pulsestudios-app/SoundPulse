import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

import type { AppThemeValue } from "@/src/theme";

export type ThemedAlertButton = {
  label: string;
  style?: "default" | "cancel" | "destructive";
  onPress: () => void;
};

export type ThemedAlertModalProps = {
  visible: boolean;
  theme: AppThemeValue;
  title: string;
  message: string;
  buttons: ThemedAlertButton[];
  onRequestClose: () => void;
};

export function ThemedAlertModal({
  visible,
  theme,
  title,
  message,
  buttons,
  onRequestClose,
}: ThemedAlertModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onRequestClose}>
      <Pressable style={styles.backdrop} onPress={onRequestClose}>
        <Pressable
          style={[styles.card, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}
          onPress={(e) => e.stopPropagation()}
        >
          <Text style={[styles.title, { color: theme.colors.textPrimary }]}>{title}</Text>
          <Text style={[styles.message, { color: theme.colors.textSecondary }]}>{message}</Text>
          <View style={styles.btnRow}>
            {buttons.map((b, i) => (
              <Pressable
                key={`${b.label}-${i}`}
                style={[
                  styles.btn,
                  {
                    backgroundColor:
                      b.style === "destructive"
                        ? `${theme.colors.coral}28`
                        : b.style === "cancel"
                          ? theme.colors.surface
                          : `${theme.colors.primary}35`,
                    borderColor:
                      b.style === "destructive"
                        ? theme.colors.coral
                        : b.style === "cancel"
                          ? theme.colors.border
                          : theme.colors.primary,
                  },
                ]}
                onPress={() => {
                  b.onPress();
                }}
              >
                <Text
                  style={[
                    styles.btnText,
                    {
                      color:
                        b.style === "destructive"
                          ? theme.colors.coral
                          : b.style === "cancel"
                            ? theme.colors.textSecondary
                            : theme.colors.primary,
                    },
                  ]}
                >
                  {b.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    padding: 24,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    gap: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
  },
  message: {
    fontSize: 15,
    lineHeight: 22,
  },
  btnRow: {
    gap: 10,
    marginTop: 4,
  },
  btn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
  },
  btnText: {
    fontSize: 16,
    fontWeight: "700",
  },
});
