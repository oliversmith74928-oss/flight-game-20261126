// Skylark Courier — every tuning number and colour in one place.
// The playfield is a fixed 1280x720 logical area; the renderer scales it to
// the window, so no rule below depends on the screen size.

export const FIELD = { width: 1280, height: 720 };

/** The simulation's fixed step, in seconds: 60 updates a second whatever the display's rate. */
export const STEP = 1 / 60;

/** The horizon sits this far down the screen when flying level. */
export const HORIZON_Y = 300;

export const PLANE = {
  /** Lateral position, -1 (far left) to 1 (far right). */
  latSpeed: 0.85,
  /** Altitude, 0 (treetops) to 1 (high cruise). */
  altSpeed: 0.55,
  /** How fast the nose follows the bank. */
  turnRate: 9,
};

export const FLIGHT = {
  minSpeed: 110, // knots, slowest the Courier can stay airborne
  maxSpeed: 260,
  cruiseSpeed: 180,
  boostSpeed: 300,
  accel: 42, // knots per second toward the throttle target
  fuelDrain: 0.55, // percent per second at cruise; faster when boosting
  fuelPerRing: 14,
  ringsToDeliver: 10,
  ringPoints: 100,
  nearRingPoints: 25,
  hullHit: 25,
  startFuel: 100,
  startHull: 100,
};

export const RING = {
  spawnInterval: 2.6,
  approachTime: 6.5, // seconds from the horizon to the plane
  passLat: 0.22, // how close, laterally, counts as flying through
  passAlt: 0.20,
  nearLat: 0.38,
  nearAlt: 0.34,
};

export const OBSTACLE = {
  spawnInterval: 3.4,
  hitLat: 0.20,
  hitAlt: 0.18,
};

export const BEST_KEY = 'skylark-courier.best';
export const BEST_RINGS_KEY = 'skylark-courier.best-rings';

export const PALETTE = {
  skyTop: '#1d4e89',
  skyMid: '#5fa8d3',
  skyLow: '#bfe3f0',
  sun: '#ffd76a',
  sunGlow: 'rgba(255, 214, 106, 0.35)',
  cloud: '#ffffff',
  cloudShade: '#dbe9f2',
  mountainFar: '#7d94b5',
  mountainNear: '#4d6a8a',
  groundFar: '#7fae62',
  groundNear: '#5d8f4a',
  fieldA: '#8fbf6a',
  fieldB: '#e3c878',
  fieldC: '#6fae5f',
  fieldD: '#c98f5a',
  river: '#4f9fd8',
  road: '#6b5a44',
  runway: '#3a3f46',
  runwayMark: '#f5f2e8',
  ring: '#ffc93c',
  ringGlow: 'rgba(255, 201, 60, 0.45)',
  storm: '#3c4454',
  stormBolt: '#ffe45e',
  balloonRed: '#e5534b',
  balloonYellow: '#f2c94c',
  planeBody: '#e8edf2',
  planeWing: '#c63b2f',
  planeTrim: '#2456a6',
  planeGlass: '#9fd8ef',
  panel: 'rgba(12, 20, 32, 0.82)',
  panelEdge: '#3d5a76',
  text: '#eef4f8',
  muted: '#a9c2d4',
  good: '#7be495',
  warn: '#ffc93c',
  bad: '#ff6b5e',
  hudBar: 'rgba(12, 20, 32, 0.94)',
};

export const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';
