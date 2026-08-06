/** @returns {{ running: boolean, startTime: number, unwind: number, screw: number }} */
export function createAnimState() {
  return {
    running: false,
    startTime: -1,
    unwind: 0,
    screw: 0,
  };
}

export const UNWIND_DURATION = 2.4;

/** @param {ReturnType<createAnimState>} anim @param {number} time seconds */
export function tickAnim(anim, time, lastTime) {
  if (!anim.running) return;

  if (anim.startTime < 0) {
    anim.startTime = time;
    lastTime.value = time;
    return;
  }

  const elapsed = time - anim.startTime;

  if (elapsed < UNWIND_DURATION) {
    const t = elapsed / UNWIND_DURATION;
    anim.unwind = 1 - Math.pow(1 - t, 2.5);
  } else {
    anim.unwind = 1;
    const dt = Math.max(0, time - lastTime.value);
    anim.screw += dt * 0.42;
  }

  lastTime.value = time;
}

export function startAnim(anim) {
  anim.running = true;
  anim.startTime = -1;
  anim.unwind = 0;
  anim.screw = 0;
}

export function stopAnim(anim) {
  anim.running = false;
  anim.startTime = -1;
  anim.unwind = 0;
  anim.screw = 0;
}
