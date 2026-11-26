// The game's rules and state, with no drawing and no browser in it: the
// Courier plane, the rings it must fly through, the hazards in its way,
// fuel, hull, score and the delivery. step() advances one fixed step and
// returns what happened as bit flags, so the caller can react without the
// world knowing about screens or sound. Nothing here allocates after
// createWorld returns.

import { FLIGHT, OBSTACLE, PLANE, RING, STEP } from './config.js';

export const KIND_RING = 0;
export const KIND_STORM = 1;
export const KIND_BALLOON = 2;
export const KIND_BIRD = 3;

export const EVENT_RING = 1;
export const EVENT_NEAR = 2;
export const EVENT_HIT = 4;
export const EVENT_OVER = 8;
export const EVENT_WIN = 16;
export const EVENT_FUEL = 32;

const POOL_SIZE = 48;

function clamp(v, lo, hi) {
  return v < lo ? lo : v > hi ? hi : v;
}

export function createWorld(random) {
  const plane = {
    lat: 0, alt: 0.55, heading: 0, roll: 0,
    speed: FLIGHT.cruiseSpeed, throttle: 0.62,
    fuel: FLIGHT.startFuel, hull: FLIGHT.startHull,
  };
  const items = [];
  for (let i = 0; i < POOL_SIZE; i += 1) {
    items.push({ active: false, kind: KIND_RING, lat: 0, alt: 0.5, z: 1, drift: 0, flap: 0 });
  }
  // Decorative clouds and terrain features, seeded once per run.
  const clouds = [];
  for (let i = 0; i < 14; i += 1) {
    clouds.push({ x: random(), y: 0.14 + random() * 0.18, s: 0.5 + random() * 0.9, speed: 0.008 + random() * 0.02 });
  }
  const fields = [];
  for (let i = 0; i < 10; i += 1) fields.push({ x: random(), tone: i % 4, w: 0.12 + random() * 0.2 });
  const state = {
    plane, items, clouds, fields,
    score: 0, rings: 0, elapsed: 0, distance: 0,
    ringTimer: 1.2, obstacleTimer: 2.4, over: false, won: false, overReason: '',
    nextRing: null, flash: 0,
  };

  function reset() {
    plane.lat = 0; plane.alt = 0.55; plane.heading = 0; plane.roll = 0;
    plane.speed = FLIGHT.cruiseSpeed; plane.throttle = 0.62;
    plane.fuel = FLIGHT.startFuel; plane.hull = FLIGHT.startHull;
    for (const item of items) item.active = false;
    state.score = 0; state.rings = 0; state.elapsed = 0; state.distance = 0;
    state.ringTimer = 1.2; state.obstacleTimer = 2.4;
    state.over = false; state.won = false; state.overReason = ''; state.nextRing = null; state.flash = 0;
  }

  function freeItem() {
    for (let i = 0; i < items.length; i += 1) if (!items[i].active) return items[i];
    return null;
  }

  function spawn(kind) {
    const item = freeItem();
    if (!item) return;
    item.active = true;
    item.kind = kind;
    item.z = 1;
    item.drift = (random() - 0.5) * 0.12;
    item.flap = random() * 6;
    if (kind === KIND_RING) {
      // Rings weave gently so the pilot has to fly, not sit still.
      item.lat = (random() - 0.5) * 1.3;
      item.alt = 0.3 + random() * 0.55;
    } else if (kind === KIND_STORM) {
      item.lat = (random() - 0.5) * 1.6;
      item.alt = 0.25 + random() * 0.6;
    } else if (kind === KIND_BALLOON) {
      item.lat = (random() - 0.5) * 1.5;
      item.alt = 0.2 + random() * 0.4;
    } else {
      item.lat = (random() - 0.5) * 1.6;
      item.alt = 0.3 + random() * 0.6;
    }
  }

  function end(reason, won) {
    state.over = true;
    state.won = won;
    state.overReason = reason;
    return won ? EVENT_WIN : EVENT_OVER;
  }

  /**
   * One fixed step. `steer` is -1..1 (bank left/right), `pitch` -1..1
   * (up positive), `boost` holds the throttle open. With `harmless` set
   * (the title screen's backdrop) the plane flies itself and nothing scores.
   */
  function step(dt, steer, pitch, boost, harmless) {
    let events = 0;
    if (state.over) return events;
    state.elapsed += dt;
    state.flash = Math.max(0, state.flash - dt);

    // Steering: bank, turn, climb and descend. The plane eases back to level.
    const targetRoll = steer * 0.65;
    plane.roll += (targetRoll - plane.roll) * Math.min(1, dt * 6);
    plane.heading += plane.roll * PLANE.turnRate * dt;
    if (plane.heading > 180) plane.heading -= 360;
    if (plane.heading < -180) plane.heading += 360;
    plane.lat = clamp(plane.lat + steer * PLANE.latSpeed * dt * (0.7 + Math.abs(plane.roll)), -1.15, 1.15);
    plane.alt = clamp(plane.alt + pitch * PLANE.altSpeed * dt, 0.08, 0.98);

    // Speed follows the throttle; boosting burns fuel faster.
    const targetSpeed = boost ? FLIGHT.boostSpeed : FLIGHT.minSpeed + plane.throttle * (FLIGHT.maxSpeed - FLIGHT.minSpeed);
    plane.speed += clamp(targetSpeed - plane.speed, -FLIGHT.accel * dt, FLIGHT.accel * dt);
    plane.throttle = clamp(plane.throttle + (boost ? dt * 0.25 : -dt * 0.05), 0.35, 1);
    state.distance += (plane.speed / 3600) * dt; // nautical miles, roughly

    if (!harmless) {
      plane.fuel -= FLIGHT.fuelDrain * (boost ? 2.1 : 1) * (plane.speed / FLIGHT.cruiseSpeed) * dt;
      if (plane.fuel <= 0) {
        plane.fuel = 0;
        return end('Out of fuel — the Courier glided down short of the runway.', false) | EVENT_FUEL;
      }
    }

    // Spawning.
    state.ringTimer -= dt;
    if (state.ringTimer <= 0 && state.rings < FLIGHT.ringsToDeliver) {
      spawn(KIND_RING);
      state.ringTimer = RING.spawnInterval * (0.85 + random() * 0.3);
    }
    state.obstacleTimer -= dt;
    if (state.obstacleTimer <= 0) {
      const roll = random();
      spawn(roll < 0.45 ? KIND_STORM : roll < 0.75 ? KIND_BALLOON : KIND_BIRD);
      state.obstacleTimer = OBSTACLE.spawnInterval * (0.8 + random() * 0.5);
    }

    // Approach: everything drifts toward the plane and sideways a little.
    const approach = dt / RING.approachTime;
    state.nextRing = null;
    for (const item of items) {
      if (!item.active) continue;
      item.z -= approach * (plane.speed / FLIGHT.cruiseSpeed);
      item.lat += item.drift * dt;
      item.flap += dt * 6;
      if (item.kind === KIND_RING && item.z > 0 && (!state.nextRing || item.z < state.nextRing.z)) state.nextRing = item;
      if (item.z > 0.02) continue;
      item.active = false;
      if (harmless) continue;
      const dLat = Math.abs(item.lat - plane.lat);
      const dAlt = Math.abs(item.alt - plane.alt);
      if (item.kind === KIND_RING) {
        if (dLat < RING.passLat && dAlt < RING.passAlt) {
          state.rings += 1;
          state.score += FLIGHT.ringPoints;
          plane.fuel = Math.min(100, plane.fuel + FLIGHT.fuelPerRing);
          state.flash = 0.35;
          events |= EVENT_RING;
          if (state.rings >= FLIGHT.ringsToDeliver) {
            state.score += Math.max(0, Math.round(plane.fuel)) * 2 + Math.max(0, Math.round(plane.hull));
            return events | end('Delivery complete — all ten rings flown, mail on the runway!', true);
          }
        } else if (dLat < RING.nearLat && dAlt < RING.nearAlt) {
          state.score += FLIGHT.nearRingPoints;
          events |= EVENT_NEAR;
        }
      } else if (dLat < OBSTACLE.hitLat && dAlt < OBSTACLE.hitAlt) {
        plane.hull -= FLIGHT.hullHit;
        state.flash = 0.5;
        events |= EVENT_HIT;
        if (plane.hull <= 0) {
          plane.hull = 0;
          const what = item.kind === KIND_STORM ? 'a storm cell' : item.kind === KIND_BALLOON ? 'a hot-air balloon' : 'a flock of birds';
          return events | end(`Hull lost — the Courier clipped ${what}.`, false);
        }
      }
    }

    // Clouds drift with the heading; fields scroll under the plane.
    for (const c of clouds) {
      c.x -= (plane.speed / 9000 + c.speed * dt * 0.2) * dt * 10 + plane.roll * dt * 0.05;
      if (c.x < -0.25) { c.x = 1.25; c.y = 0.06 + random() * 0.22; }
      if (c.x > 1.25) c.x = -0.25;
    }
    return events;
  }

  reset();
  return { state, reset, step };
}
