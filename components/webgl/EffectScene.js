import dynamic from "next/dynamic";

/**
 * Lazy wrapper so effect bundles can be split per route.
 */
export function createEffectScene(SceneComponent) {
  return dynamic(() => Promise.resolve(SceneComponent), {
    ssr: false,
    loading: () => (
      <div
        style={{
          width: "100%",
          height: "100vh",
          background: "#000",
        }}
      />
    ),
  });
}
