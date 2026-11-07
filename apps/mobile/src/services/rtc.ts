// SPDX-License-Identifier: AGPL-3.0-only
import { registerGlobals } from "react-native-webrtc";
export function prepareRTC() {
  registerGlobals();
}
