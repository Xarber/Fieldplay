# Motion and accessible materials

Frequency/purpose gate: buttons use near-imperceptible feedback; disclosures and dialogs use occasional state/spatial feedback. High-frequency peer tabs, GPS markers, map positions, timers and input text do not receive decorative transitions.

`components/motion.ts` defines the shared strong ease-out curve `(0.23,1,0.32,1)`. Reanimated 4.7 uses its supported `cubicBezier()` value for CSS-style transitions; older string examples do not type-check against this version. Buttons scale to 0.97 over 120 ms on press-in, with retained touch area and visible opacity feedback. Disclosure content fades in 160 ms/out 120 ms without animating layout height. Dialog opacity uses 200/140 ms; its small scale settles with a 300 ms critically damped spring. Closing content remains stable throughout dismissal, and reopening can retarget from current shared values.

Animations run through Reanimated transforms/opacity, not per-frame React state or core Animated. Reduced Motion removes scale and uses a short opacity alternative; layout builders use the system reduce-motion policy. There are no full-screen moving backgrounds, parallax or endless decorative pulses.

Supported iOS Liquid Glass is capability-detected for bottom navigation, with current theme and Reduce Transparency respected. Other platforms retain solid readable surfaces. Glass intensity and shadows are not animated. The landing uses bounded CSS transform/opacity feedback, fine-pointer-only hover and reduced-motion/transparency/contrast media queries.

Native release-mode feel, interruption and accessibility rendering must be tested on actual supported iOS and slower Android hardware. Web/headless success is implementation evidence only.
