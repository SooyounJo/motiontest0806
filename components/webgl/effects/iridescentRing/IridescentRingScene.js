import { useCallback, useRef, useState } from "react";
import { useWebGL } from "@/hooks/useWebGL";
import WebGLCanvas from "@/components/webgl/WebGLCanvas";
import { setupIridescentRing } from "./setupIridescentRing";
import { createAnimState, startAnim, stopAnim } from "./animState";
import styles from "./IridescentRingScene.module.css";

export default function IridescentRingScene({ fullscreen = true, showControls = true }) {
  const animRef = useRef(createAnimState());
  const [running, setRunning] = useState(false);

  const setup = useCallback(
    (gl) => setupIridescentRing(gl, animRef),
    []
  );
  const { canvasRef, error } = useWebGL({ setup });

  const handleGo = () => {
    startAnim(animRef.current);
    setRunning(true);
  };

  const handleStop = () => {
    stopAnim(animRef.current);
    setRunning(false);
  };

  if (error) {
    return (
      <div style={{ padding: "2rem", color: "#f88" }}>
        WebGL error: {error.message}
      </div>
    );
  }

  return (
    <>
      <WebGLCanvas canvasRef={canvasRef} fullscreen={fullscreen} />
      {showControls ? (
        <div className={styles.controlsWrap}>
          <button
            type="button"
            className={styles.ctrlBtn}
            onClick={handleGo}
            disabled={running}
          >
            Go
          </button>
          <button
            type="button"
            className={styles.ctrlBtn}
            onClick={handleStop}
            disabled={!running}
          >
            Stop
          </button>
        </div>
      ) : null}
    </>
  );
}
