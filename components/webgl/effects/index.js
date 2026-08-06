/**
 * Effect registry — add new WebGL demos here for pages & deep links.
 *
 * Each entry:
 * - id: URL slug (/effects/[id])
 * - title: display name
 * - description: short blurb for gallery
 * - Scene: React component (client) that mounts the effect
 */
import IridescentRingScene from "./iridescentRing/IridescentRingScene";

export const effects = [
  {
    id: "iridescent-ring",
    title: "Iridescent Ring",
    description: "SDF torus with pearlescent shader on black.",
    Scene: IridescentRingScene,
  },
];

export function getEffectById(id) {
  return effects.find((e) => e.id === id) ?? null;
}
