// SPDX-License-Identifier: AGPL-3.0-only
import React, { useState } from "react";
import { View } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { Button, Txt } from "./ui";
export default function Scanner({
  onCode,
  onClose,
}: {
  onCode: (code: string) => void;
  onClose: () => void;
}) {
  const [permission, request] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  return (
    <View style={{ gap: 14 }}>
      <Txt size={22} weight="700">
        Scan a Fieldplay QR code
      </Txt>
      {!permission?.granted ? (
        <>
          <Txt>Camera access is used only while this scanner is open.</Txt>
          <Button
            label="Allow camera"
            icon="camera"
            onPress={() => {
              void request();
            }}
          />
        </>
      ) : (
        <CameraView
          style={{ height: 320, borderRadius: 15, overflow: "hidden" }}
          facing="back"
          barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
          onBarcodeScanned={
            scanned
              ? undefined
              : (r) => {
                  setScanned(true);
                  onCode(r.data);
                }
          }
        />
      )}
      <Button label="Close scanner" kind="secondary" onPress={onClose} />
    </View>
  );
}
