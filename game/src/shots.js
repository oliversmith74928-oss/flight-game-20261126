// The screenshot scenes behind ?shot=start|play|rings|end. Each one plays the
// real rules forward from a fresh world for a fixed number of steps, steered
// by a simple autopilot (steer toward the nearest ring, climb or descend to
// its height, ease off when a hazard sits in the way), so the frame is what
// a real flight looks like and the same seed always gives the same frame.
import { STEP } from './config.js';
import { EVENT_OVER, EVENT_WIN } from './world.js';
import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE } from './render.js';

const START_SECONDS = 6;
const PLAY_SECONDS = 24;
const RINGS_SECONDS = 46;
const END_LIMIT_SECONDS = 600;

function autopilot(state, mode) {
  const plane = state.plane;
  if (mode === 'end') {
    // A hurried pilot: chase the nearest hazard instead of the rings, with
    // the tank nearly dry — this is how a real run ends.
    let hazard = null;
    for (const item of state.items) {
      if (!item.active || item.kind === 0) continue;
      if (!hazard || item.z < hazard.z) hazard = item;
    }
    if (hazard) {
      const dx = hazard.lat - plane.lat;
      const dy = hazard.alt - plane.alt;
      return {
        steer: dx > 0.06 ? 1 : dx < -0.06 ? -1 : 0,
        pitch: dy > 0.05 ? 1 : dy < -0.05 ? -1 : 0,
      };
    }
    return { steer: 0, pitch: 0 };
  }
  const ring = state.nextRing;
  let steer = 0;
  let pitch = 0;
  if (ring) {
    const dx = ring.lat - plane.lat;
    const dy = ring.alt - plane.alt;
    steer = dx > 0.06 ? 1 : dx < -0.06 ? -1 : 0;
    pitch = dy > 0.05 ? 1 : dy < -0.05 ? -1 : 0;
  }
  return { steer, pitch };
}

/**
 * Set `world` to the named scene (start, play, rings or end; any other name
 * is start) and return the screen to draw over it and the best score to show.
 */
export function stageShot(name, world) {
  world.reset();
  if (name !== 'play' && name !== 'rings' && name !== 'end') {
    for (let i = 0; i < START_SECONDS / STEP; i += 1) world.step(STEP, 0, 0, false, true);
    return { screen: SCREEN_TITLE, best: 0 };
  }
  const limit = name === 'end' ? END_LIMIT_SECONDS : name === 'rings' ? RINGS_SECONDS : PLAY_SECONDS;
  const mode = name === 'end' ? 'end' : 'fly';
  if (name === 'end') {
    // Stage a run that is already nearly out of fuel and hull, so the
    // reckless pilot's flight ends on screen instead of winning.
    world.state.plane.fuel = 22;
    world.state.plane.hull = 25;
  }
  for (let i = 0; i < limit / STEP; i += 1) {
    const { steer, pitch } = autopilot(world.state, mode);
    const events = world.step(STEP, steer, pitch, false, false);
    if (events & (EVENT_OVER | EVENT_WIN)) break;
  }
  const over = world.state.over;
  return { screen: over ? SCREEN_OVER : SCREEN_PLAY, best: world.state.score };
}
