// SPDX-License-Identifier: AGPL-3.0-only
import {
  Easing,
  FadeIn,
  FadeOut,
  ReduceMotion,
  cubicBezier,
} from "react-native-reanimated";
// One vocabulary: 120ms feedback, 160ms disclosure, 200/140ms dialog opacity.
export const EASE_OUT = Easing.bezier(0.23, 1, 0.32, 1);
export const DISCLOSURE_IN = FadeIn.duration(160)
  .easing(EASE_OUT)
  .reduceMotion(ReduceMotion.System);
export const DISCLOSURE_OUT = FadeOut.duration(120)
  .easing(EASE_OUT)
  .reduceMotion(ReduceMotion.System);
export const RESULT_IN = FadeIn.duration(200)
  .easing(EASE_OUT)
  .reduceMotion(ReduceMotion.System);

export const CSS_EASE_OUT = cubicBezier(0.23, 1, 0.32, 1);
