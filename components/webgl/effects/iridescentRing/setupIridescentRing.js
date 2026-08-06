import {
  bindFullscreenTriangle,
  createProgram,
} from "@/lib/webgl/glUtils";
import { FRAGMENT_SHADER, VERTEX_SHADER } from "./shaders";
import { tickAnim } from "./animState";

/**
 * @param {WebGLRenderingContext} gl
 * @param {{ current: { running: boolean, startTime: number, unwind: number, screw: number } }} animRef
 */
export function setupIridescentRing(gl, animRef) {
  const program = createProgram(gl, VERTEX_SHADER, FRAGMENT_SHADER);
  gl.useProgram(program);

  const uResolution = gl.getUniformLocation(program, "u_resolution");
  const uTime = gl.getUniformLocation(program, "u_time");
  const uUnwind = gl.getUniformLocation(program, "u_unwind");
  const uScrew = gl.getUniformLocation(program, "u_screw");
  const positionBuffer = bindFullscreenTriangle(gl, program);
  const lastTime = { value: 0 };

  return {
    render(time, size) {
      const anim = animRef.current;
      tickAnim(anim, time, lastTime);

      gl.clearColor(0, 0, 0, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);

      gl.useProgram(program);
      gl.uniform2f(uResolution, size.width, size.height);
      gl.uniform1f(uTime, time);
      gl.uniform1f(uUnwind, anim.unwind);
      gl.uniform1f(uScrew, anim.screw);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    },
    dispose() {
      gl.deleteBuffer(positionBuffer);
      gl.deleteProgram(program);
    },
  };
}
