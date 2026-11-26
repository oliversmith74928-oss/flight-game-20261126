// Keyboard, mouse and pointer input. Held keys steer; one-shot presses
// (start, pause, mute, restart) are queued as bit flags and taken once by the
// loop, so a press between two frames is never lost and never counted twice.
// The mouse steers too: moving it left/right/up/down banks and pitches the plane.

export const ACTION_CONFIRM = 1;
export const ACTION_PAUSE = 2;
export const ACTION_MUTE = 4;
export const ACTION_RESTART = 8;
export const ACTION_BOOST = 16;

const LEFT = new Set(['ArrowLeft', 'KeyA']);
const RIGHT = new Set(['ArrowRight', 'KeyD']);
const UP = new Set(['ArrowUp', 'KeyW']);
const DOWN = new Set(['ArrowDown', 'KeyS']);
const CONFIRM = new Set(['Space', 'Enter']);
const PAUSE = new Set(['KeyP', 'Escape']);
const MUTE = new Set(['KeyM']);
const RESTART = new Set(['KeyR']);
const BOOST = new Set(['ShiftLeft', 'ShiftRight']);

export function createInput(target) {
  let left = false;
  let right = false;
  let up = false;
  let down = false;
  let boost = false;
  let actions = 0;
  // Mouse steering: -1..1 each way, eased toward the pointer's position.
  let mouse = { x: 0, y: 0, active: false };

  window.addEventListener('keydown', (event) => {
    if (LEFT.has(event.code)) left = true;
    else if (RIGHT.has(event.code)) right = true;
    else if (UP.has(event.code)) up = true;
    else if (DOWN.has(event.code)) down = true;
    else if (BOOST.has(event.code)) boost = true;
    else if (CONFIRM.has(event.code)) {
      if (!event.repeat) actions |= ACTION_CONFIRM;
    } else if (PAUSE.has(event.code)) {
      if (!event.repeat) actions |= ACTION_PAUSE;
    } else if (MUTE.has(event.code)) {
      if (!event.repeat) actions |= ACTION_MUTE;
    } else if (RESTART.has(event.code)) {
      if (!event.repeat) actions |= ACTION_RESTART;
    } else return;
    event.preventDefault();
  });
  window.addEventListener('keyup', (event) => {
    if (LEFT.has(event.code)) left = false;
    else if (RIGHT.has(event.code)) right = false;
    else if (UP.has(event.code)) up = false;
    else if (DOWN.has(event.code)) down = false;
    else if (BOOST.has(event.code)) boost = false;
  });
  window.addEventListener('blur', () => {
    left = right = up = down = boost = false;
  });
  target.addEventListener('pointermove', (event) => {
    const rect = target.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = ((event.clientY - rect.top) / rect.height) * 2 - 1;
    mouse.active = true;
  });
  target.addEventListener('pointerdown', () => {
    actions |= ACTION_CONFIRM;
  });

  return {
    /** Lateral steering -1..1: keys first, then the mouse. */
    steer() {
      const keys = (right ? 1 : 0) - (left ? 1 : 0);
      if (keys !== 0) return keys;
      if (mouse.active) return Math.max(-1, Math.min(1, mouse.x * 1.4));
      return 0;
    },
    /** Pitch -1..1: up is positive (climb). */
    pitch() {
      const keys = (up ? 1 : 0) - (down ? 1 : 0);
      if (keys !== 0) return keys;
      if (mouse.active) return Math.max(-1, Math.min(1, -mouse.y * 1.2));
      return 0;
    },
    boosting() {
      return boost;
    },
    takeActions() {
      const taken = actions;
      actions = 0;
      return taken;
    },
  };
}
