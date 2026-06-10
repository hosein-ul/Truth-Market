"use client";

import { ACTIVE_THEME } from "@/theme.config";
import { CipherLightBg } from "./art/CipherLightBg";
import { QuantumMeshBg } from "./art/QuantumMeshBg";
import { TruthLatticeBg } from "./art/TruthLatticeBg";

export function ThemedBackground() {
  if (ACTIVE_THEME === "premium") return null;
  if (ACTIVE_THEME === "noir") return <CipherLightBg />;   // light ink-on-paper cipher
  if (ACTIVE_THEME === "quantum") return <QuantumMeshBg />;
  return <TruthLatticeBg />;
}
