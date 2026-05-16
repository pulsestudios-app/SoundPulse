import type { ReactNode } from "react";
import { Modal, type ModalProps } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

interface SafeModalProps extends ModalProps {
  children: ReactNode;
}

export function SafeModal({ visible, children, ...props }: SafeModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" {...props}>
      <SafeAreaProvider>
        <SafeAreaView edges={["bottom"]} style={{ flex: 1 }}>
          {children}
        </SafeAreaView>
      </SafeAreaProvider>
    </Modal>
  );
}
