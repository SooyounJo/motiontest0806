import { useEffect, useRef, useState } from "react";

/**
 * Manages WebGL context lifecycle: resize, DPR, animation frame, cleanup.
 *
 * @param {Object} options
 * @param {(gl: WebGLRenderingContext, canvas: HTMLCanvasElement) => {
 *   render: (time: number, size: { width: number, height: number }) => void;
 *   dispose?: () => void;
 * }} options.setup
 * @param {boolean} [options.active=true]
 */
export function useWebGL({ setup, active = true }) {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const apiRef = useRef(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!active) return undefined;

    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    let disposed = false;
    let gl;

    try {
      gl =
        canvas.getContext("webgl2", {
          alpha: false,
          antialias: false,
          premultipliedAlpha: false,
        }) ||
        canvas.getContext("webgl", {
          alpha: false,
          antialias: false,
          premultipliedAlpha: false,
        });

      if (!gl) {
        throw new Error("WebGL is not supported in this browser.");
      }

      apiRef.current = setup(gl, canvas);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      return undefined;
    }

    const resize = () => {
      if (disposed || !gl) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = Math.floor(canvas.clientWidth * dpr);
      const height = Math.floor(canvas.clientHeight * dpr);
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        gl.viewport(0, 0, width, height);
      }
    };

    const loop = (time) => {
      if (disposed || !apiRef.current) return;
      resize();
      apiRef.current.render(time * 0.001, {
        width: canvas.width,
        height: canvas.height,
      });
      rafRef.current = requestAnimationFrame(loop);
    };

    resize();
    rafRef.current = requestAnimationFrame(loop);

    window.addEventListener("resize", resize);

    return () => {
      disposed = true;
      window.removeEventListener("resize", resize);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      apiRef.current?.dispose?.();
      apiRef.current = null;
    };
  }, [setup, active]);

  return { canvasRef, error };
}
