// SPDX-License-Identifier: AGPL-3.0-only
export function uid() {
  const bytes = new Uint8Array(16);
  globalThis.crypto.getRandomValues(bytes);
  return Array.from(bytes, (n) => n.toString(16).padStart(2, "0")).join("");
}

export function secretOffset() {
  const v = new Uint32Array(2);
  globalThis.crypto.getRandomValues(v);
  return {
    angle: (v[0] / 0x100000000) * Math.PI * 2,
    fraction: 0.1 + (v[1] / 0x100000000) * 0.5,
  };
}
