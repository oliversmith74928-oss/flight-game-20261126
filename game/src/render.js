// Drawing only: the world's state and the current screen in, pixels out.
// The 1280x720 playfield is scaled to fit the window and centred, the margin
// filled with the backdrop colour. A chase view: the Courier flies away from
// the viewer over patchwork terrain toward a runway, through golden rings.

import { FIELD, FONT, HORIZON_Y, PALETTE } from './config.js';
import { KIND_BALLOON, KIND_BIRD, KIND_RING, KIND_STORM } from './world.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_OVER = 'over';

function lerp(a, b, t) {
  return a + (b - a) * t;
}

export function createRenderer(canvas) {
  const context = canvas.getContext('2d');
  const view = { scale: 1, x: 0, y: 0 };
  let flashRed = 0;
  let flashGold = 0;

  function resize() {
    const ratio = window.devicePixelRatio || 1;
    const width = Math.round(window.innerWidth * ratio);
    const height = Math.round(window.innerHeight * ratio);
    canvas.width = width;
    canvas.height = height;
    view.scale = Math.min(width / FIELD.width, height / FIELD.height);
    view.x = (width - FIELD.width * view.scale) / 2;
    view.y = (height - FIELD.height * view.scale) / 2;
  }

  const fonts = new Map();
  function text(value, x, y, size, color, align = 'left', bold = false) {
    const key = size + (bold ? 'b' : '');
    if (!fonts.has(key)) fonts.set(key, `${bold ? '700 ' : ''}${size}px ${FONT}`);
    context.font = fonts.get(key);
    context.fillStyle = color;
    context.textAlign = align;
    context.textBaseline = 'alphabetic';
    context.fillText(value, x, y);
  }

  function roundRect(x, y, w, h, r) {
    context.beginPath();
    context.moveTo(x + r, y);
    context.arcTo(x + w, y, x + w, y + h, r);
    context.arcTo(x + w, y + h, x, y + h, r);
    context.arcTo(x, y + h, x, y, r);
    context.arcTo(x, y, x + w, y, r);
    context.closePath();
  }

  function drawSky(state, time) {
    const plane = state.plane;
    const horizon = HORIZON_Y - (plane.alt - 0.55) * 70 - plane.roll * 18;
    const g = context.createLinearGradient(0, 0, 0, horizon + 40);
    g.addColorStop(0, PALETTE.skyTop);
    g.addColorStop(0.55, PALETTE.skyMid);
    g.addColorStop(1, PALETTE.skyLow);
    context.fillStyle = g;
    context.fillRect(0, 0, FIELD.width, horizon + 40);

    // Sun, upper right, with a soft glow.
    const sunX = 1050 - plane.heading * 1.2;
    const sunY = 92;
    const glow = context.createRadialGradient(sunX, sunY, 8, sunX, sunY, 110);
    glow.addColorStop(0, PALETTE.sunGlow);
    glow.addColorStop(1, 'rgba(255,214,106,0)');
    context.fillStyle = glow;
    context.fillRect(sunX - 110, sunY - 110, 220, 220);
    context.fillStyle = PALETTE.sun;
    context.beginPath();
    context.arc(sunX, sunY, 34, 0, Math.PI * 2);
    context.fill();

    // Clouds, drifting with the heading.
    for (const c of state.clouds) {
      const cx = c.x * FIELD.width - plane.heading * 0.6;
      const cy = c.y * FIELD.height;
      const s = c.s;
      context.fillStyle = 'rgba(255,255,255,0.92)';
      context.beginPath();
      context.ellipse(cx, cy, 62 * s, 20 * s, 0, 0, Math.PI * 2);
      context.ellipse(cx - 34 * s, cy + 6 * s, 36 * s, 15 * s, 0, 0, Math.PI * 2);
      context.ellipse(cx + 36 * s, cy + 5 * s, 38 * s, 16 * s, 0, 0, Math.PI * 2);
      context.fill();
      context.fillStyle = 'rgba(219,233,242,0.7)';
      context.beginPath();
      context.ellipse(cx, cy + 10 * s, 58 * s, 10 * s, 0, 0, Math.PI);
      context.fill();
    }

    // Distant mountain ridges, parallax by heading.
    for (const [base, amp, color, lift] of [
      [0.42, 46, PALETTE.mountainFar, 0],
      [0.62, 34, PALETTE.mountainNear, 8],
    ]) {
      context.fillStyle = color;
      context.beginPath();
      context.moveTo(0, horizon + lift);
      for (let x = 0; x <= FIELD.width; x += 16) {
        const y = horizon + lift - (Math.sin(x * 0.006 + base * 9 + plane.heading * 0.02) * 0.5 + 0.5) * amp
          - Math.sin(x * 0.017 + base * 23) * amp * 0.35;
        context.lineTo(x, y);
      }
      context.lineTo(FIELD.width, horizon + lift);
      context.closePath();
      context.fill();
    }
    return horizon;
  }

  function drawGround(state, horizon, time) {
    // Ground from the horizon down, with scrolling patchwork fields.
    const g = context.createLinearGradient(0, horizon, 0, FIELD.height);
    g.addColorStop(0, PALETTE.groundFar);
    g.addColorStop(1, PALETTE.groundNear);
    context.fillStyle = g;
    context.fillRect(0, horizon, FIELD.width, FIELD.height - horizon);

    const plane = state.plane;
    const scroll = (state.distance * 260) % 120;
    // Field bands rushing toward the viewer.
    for (let row = 0; row < 7; row += 1) {
      const t = row / 7;
      const y0 = horizon + (FIELD.height - horizon) * t * t + scroll * t * t;
      const y1 = horizon + (FIELD.height - horizon) * (row + 1) / 7 * ((row + 1) / 7) + scroll * ((row + 1) / 7) * ((row + 1) / 7);
      if (y1 < horizon + 2) continue;
      const tones = [PALETTE.fieldA, PALETTE.fieldB, PALETTE.fieldC, PALETTE.fieldD];
      for (let col = 0; col < 6; col += 1) {
        const f = state.fields[(row + col) % state.fields.length];
        const x0 = ((col * 240 + f.x * 120 - plane.heading * 2 - plane.lat * 60 * t) % 1440 + 1440) % 1440 - 160;
        context.fillStyle = tones[(row + col) % 4];
        context.globalAlpha = 0.5 + t * 0.5;
        context.fillRect(x0, Math.min(y0, FIELD.height), 220 + f.w * 200, Math.max(2, y1 - y0));
      }
      context.globalAlpha = 1;
    }
    // A river winding across the fields.
    context.strokeStyle = PALETTE.river;
    context.lineWidth = 10;
    context.beginPath();
    context.moveTo(180 - plane.heading, horizon + 30);
    context.bezierCurveTo(420, horizon + 90, 180, horizon + 170, 520, FIELD.height);
    context.stroke();
    context.lineWidth = 4;
    context.strokeStyle = 'rgba(255,255,255,0.5)';
    context.beginPath();
    context.moveTo(180 - plane.heading, horizon + 30);
    context.bezierCurveTo(420, horizon + 90, 180, horizon + 170, 520, FIELD.height);
    context.stroke();

    // The runway ahead: a perspective strip converging on the horizon,
    // offset by the heading, with a scrolling centreline.
    const rx = 640 - plane.heading * 2.2 - plane.lat * 90;
    context.fillStyle = PALETTE.runway;
    context.beginPath();
    context.moveTo(rx - 8, horizon + 4);
    context.lineTo(rx + 8, horizon + 4);
    context.lineTo(rx + 150, FIELD.height);
    context.lineTo(rx - 150, FIELD.height);
    context.closePath();
    context.fill();
    context.strokeStyle = PALETTE.runwayMark;
    context.lineWidth = 5;
    context.setLineDash([26, 22]);
    context.lineDashOffset = -scroll * 2;
    context.beginPath();
    context.moveTo(rx, horizon + 6);
    context.lineTo(rx, FIELD.height);
    context.stroke();
    context.setLineDash([]);
    // Runway threshold bars.
    context.fillStyle = PALETTE.runwayMark;
    for (const off of [-46, -16, 16, 46]) {
      context.fillRect(rx + off - 8, horizon + 14, 16, 5);
    }
    text('RWY 27', rx, horizon + 44, 15, PALETTE.runwayMark, 'center', true);
  }

  function project(state, item, horizon) {
    const plane = state.plane;
    const t = 1 - item.z; // 0 far, 1 at the plane
    const farX = 640 + (item.lat - plane.lat * 0.3) * 90;
    const farY = horizon - (item.alt - 0.2) * 46;
    const nearX = 640 + (item.lat - plane.lat) * 760;
    const nearY = 486 - (item.alt - plane.alt) * 400;
    return {
      x: lerp(farX, nearX, t),
      y: lerp(farY, nearY, t),
      size: lerp(13, 170, t * t),
      t,
    };
  }

  function drawRing(item, p, time) {
    const pulse = 1 + Math.sin(time * 4 + p.x) * 0.04;
    const r = p.size * pulse;
    context.save();
    context.translate(p.x, p.y);
    context.shadowColor = PALETTE.ringGlow;
    context.shadowBlur = 26;
    context.strokeStyle = PALETTE.ring;
    context.lineWidth = Math.max(3, r * 0.13);
    context.beginPath();
    context.ellipse(0, 0, r, r * 0.82, 0, 0, Math.PI * 2);
    context.stroke();
    context.shadowBlur = 0;
    context.strokeStyle = '#fff3c4';
    context.lineWidth = Math.max(1.5, r * 0.035);
    context.beginPath();
    context.ellipse(0, 0, r * 0.86, r * 0.7, 0, 0, Math.PI * 2);
    context.stroke();
    // Chevrons pointing through the ring.
    context.fillStyle = PALETTE.ring;
    for (const a of [-0.5, 0, 0.5]) {
      context.beginPath();
      context.moveTo(-r * 0.16, r * a * 0.3 - 6);
      context.lineTo(r * 0.16, r * a * 0.3);
      context.lineTo(-r * 0.16, r * a * 0.3 + 6);
      context.closePath();
      context.fill();
    }
    context.restore();
  }

  function drawStorm(item, p, time) {
    const s = p.size;
    context.fillStyle = PALETTE.storm;
    context.beginPath();
    context.ellipse(p.x, p.y, s * 0.9, s * 0.55, 0, 0, Math.PI * 2);
    context.ellipse(p.x - s * 0.5, p.y + s * 0.14, s * 0.55, s * 0.4, 0, 0, Math.PI * 2);
    context.ellipse(p.x + s * 0.5, p.y + s * 0.12, s * 0.6, s * 0.42, 0, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = '#5a6478';
    context.beginPath();
    context.ellipse(p.x, p.y - s * 0.18, s * 0.6, s * 0.32, 0, 0, Math.PI * 2);
    context.fill();
    // Lightning, flickering.
    if (Math.sin(time * 9 + p.x) > 0.2) {
      context.strokeStyle = PALETTE.stormBolt;
      context.lineWidth = Math.max(2, s * 0.07);
      context.beginPath();
      context.moveTo(p.x - s * 0.1, p.y + s * 0.3);
      context.lineTo(p.x + s * 0.08, p.y + s * 0.75);
      context.lineTo(p.x - s * 0.06, p.y + s * 0.8);
      context.lineTo(p.x + s * 0.14, p.y + s * 1.25);
      context.stroke();
    }
  }

  function drawBalloon(item, p, time) {
    const s = p.size;
    const bob = Math.sin(time * 2 + item.flap) * s * 0.05;
    context.save();
    context.translate(p.x, p.y + bob);
    context.fillStyle = PALETTE.balloonRed;
    context.beginPath();
    context.ellipse(0, -s * 0.28, s * 0.62, s * 0.72, 0, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = PALETTE.balloonYellow;
    context.beginPath();
    context.ellipse(0, -s * 0.28, s * 0.22, s * 0.72, 0, 0, Math.PI * 2);
    context.fill();
    context.strokeStyle = '#7a4a21';
    context.lineWidth = Math.max(1.5, s * 0.04);
    context.beginPath();
    context.moveTo(-s * 0.4, s * 0.32);
    context.lineTo(-s * 0.22, s * 0.62);
    context.moveTo(s * 0.4, s * 0.32);
    context.lineTo(s * 0.22, s * 0.62);
    context.stroke();
    context.fillStyle = '#8a5a2b';
    context.fillRect(-s * 0.24, s * 0.6, s * 0.48, s * 0.34);
    context.restore();
  }

  function drawBird(item, p, time) {
    const s = Math.max(6, p.size * 0.4);
    const flap = Math.sin(item.flap) * 0.6;
    context.strokeStyle = '#2c3440';
    context.lineWidth = 3;
    context.lineCap = 'round';
    context.beginPath();
    context.moveTo(p.x - s, p.y - flap * s * 0.4);
    context.quadraticCurveTo(p.x - s * 0.4, p.y, p.x, p.y);
    context.quadraticCurveTo(p.x + s * 0.4, p.y, p.x + s, p.y - flap * s * 0.4);
    context.stroke();
  }

  function drawEntities(state, horizon, time) {
    // Far to near so near things overlap far ones.
    const list = [];
    for (const item of state.items) if (item.active) list.push(item);
    list.sort((a, b) => b.z - a.z);
    for (const item of list) {
      const p = project(state, item, horizon);
      if (item.kind === KIND_RING) drawRing(item, p, time);
      else if (item.kind === KIND_STORM) drawStorm(item, p, time);
      else if (item.kind === KIND_BALLOON) drawBalloon(item, p, time);
      else drawBird(item, p, time);
    }
  }

  function drawPlane(state, time) {
    const plane = state.plane;
    const blink = Math.floor(time * 2) % 2 === 0;
    context.save();
    context.translate(640, 486);
    context.rotate(plane.roll * 0.9);
    // Soft shadow on the ground below.
    context.fillStyle = 'rgba(10, 20, 30, 0.25)';
    context.beginPath();
    context.ellipse(6, 128, 86, 12, 0, 0, Math.PI * 2);
    context.fill();
    // Wings.
    context.fillStyle = PALETTE.planeWing;
    roundRect(-128, -14, 256, 30, 14);
    context.fill();
    context.fillStyle = 'rgba(255,255,255,0.35)';
    context.fillRect(-128, -14, 256, 7);
    // Tailplane.
    context.fillStyle = PALETTE.planeWing;
    roundRect(-58, 74, 116, 18, 8);
    context.fill();
    // Fuselage, nose away from the viewer.
    const fg = context.createLinearGradient(-16, -120, 16, 110);
    fg.addColorStop(0, '#ffffff');
    fg.addColorStop(0.5, PALETTE.planeBody);
    fg.addColorStop(1, '#9fb2c4');
    context.fillStyle = fg;
    context.beginPath();
    context.moveTo(0, -128);
    context.quadraticCurveTo(20, -70, 17, 10);
    context.quadraticCurveTo(15, 82, 10, 104);
    context.lineTo(-10, 104);
    context.quadraticCurveTo(-15, 82, -17, 10);
    context.quadraticCurveTo(-20, -70, 0, -128);
    context.closePath();
    context.fill();
    // Cheatline.
    context.fillStyle = PALETTE.planeTrim;
    context.fillRect(-17, 18, 34, 7);
    // Canopy glass.
    context.fillStyle = PALETTE.planeGlass;
    context.beginPath();
    context.ellipse(0, -58, 11, 30, 0, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = 'rgba(255,255,255,0.75)';
    context.beginPath();
    context.ellipse(-3, -68, 4, 12, 0.2, 0, Math.PI * 2);
    context.fill();
    // Propeller blur at the nose.
    context.fillStyle = 'rgba(200, 220, 235, 0.5)';
    context.beginPath();
    context.ellipse(0, -128, 26, 5, 0.5, 0, Math.PI * 2);
    context.fill();
    context.beginPath();
    context.ellipse(0, -128, 26, 5, -0.5, 0, Math.PI * 2);
    context.fill();
    // Navigation lights.
    if (blink) {
      context.fillStyle = '#ff4d4d';
      context.beginPath(); context.arc(-128, 1, 5, 0, Math.PI * 2); context.fill();
      context.fillStyle = '#4dff88';
      context.beginPath(); context.arc(128, 1, 5, 0, Math.PI * 2); context.fill();
    }
    context.restore();
  }

  function bar(x, y, w, h, frac, color, bg = 'rgba(255,255,255,0.18)') {
    context.fillStyle = bg;
    roundRect(x, y, w, h, h / 2);
    context.fill();
    context.fillStyle = color;
    if (frac > 0) {
      roundRect(x, y, Math.max(h, w * Math.max(0, Math.min(1, frac))), h, h / 2);
      context.fill();
    }
  }

  function drawHud(state, screen) {
    const plane = state.plane;
    const altFt = Math.round(800 + plane.alt * 4400);
    const hdg = ((Math.round(270 + plane.heading) % 360) + 360) % 360;
    // Top bar.
    context.fillStyle = PALETTE.hudBar;
    context.fillRect(0, 0, FIELD.width, 64);
    text('SKYLARK COURIER', 20, 26, 17, PALETTE.text, 'left', true);
    text('MAIL RUN · RWY 27', 20, 48, 12, PALETTE.muted);
    text(`ALT  ${altFt.toLocaleString('en-US')} FT`, 300, 28, 20, PALETTE.text, 'left', true);
    text(`SPD  ${Math.round(plane.speed)} KT`, 500, 28, 20, PALETTE.text, 'left', true);
    text(`HDG  ${String(hdg).padStart(3, '0')}°`, 690, 28, 20, PALETTE.text, 'left', true);
    text(`SCORE  ${state.score}`, 880, 28, 20, PALETTE.text, 'left', true);
    text(`RINGS  ${state.rings}/10`, 1060, 28, 20, PALETTE.ring, 'left', true);
    // Fuel and hull bars.
    text('FUEL', 300, 52, 12, PALETTE.muted);
    bar(350, 42, 130, 11, plane.fuel / 100, plane.fuel < 25 ? PALETTE.bad : PALETTE.good);
    text('HULL', 500, 52, 12, PALETTE.muted);
    bar(550, 42, 130, 11, plane.hull / 100, plane.hull < 30 ? PALETTE.bad : '#7fb8e8');
    text(`TIME ${Math.floor(state.elapsed / 60)}:${String(Math.floor(state.elapsed % 60)).padStart(2, '0')}`, 1060, 52, 13, PALETTE.muted);
    // Compass tape.
    context.fillStyle = 'rgba(12,20,32,0.88)';
    context.fillRect(440, 64, 400, 26);
    const points = [['N', 0], ['E', 90], ['S', 180], ['W', 270]];
    for (const [label, deg] of points) {
      let d = ((deg - hdg + 540) % 360) - 180;
      if (Math.abs(d) < 90) text(label, 640 + d * 2.1, 83, 14, PALETTE.text, 'center', true);
    }
    context.fillStyle = PALETTE.ring;
    context.beginPath();
    context.moveTo(640, 64); context.lineTo(634, 74); context.lineTo(646, 74);
    context.closePath(); context.fill();

    // Next-ring pointer.
    if (state.nextRing && screen === SCREEN_PLAY) {
      const ring = state.nextRing;
      const dx = ring.lat - plane.lat;
      const dy = ring.alt - plane.alt;
      const dist = Math.round(ring.z * 800);
      const ax = 640 + Math.max(-1, Math.min(1, dx * 3)) * 150;
      context.fillStyle = PALETTE.ring;
      context.beginPath();
      context.moveTo(ax, 116);
      context.lineTo(ax - 9, 100);
      context.lineTo(ax + 9, 100);
      context.closePath();
      context.fill();
      context.fillStyle = 'rgba(12,20,32,0.8)';
      roundRect(520, 118, 240, 24, 12);
      context.fill();
      text(`NEXT RING ${dist}m ${dx > 0.12 ? '→' : dx < -0.12 ? '←' : '·'} ${dy > 0.12 ? '↑' : dy < -0.12 ? '↓' : ''}`, 640, 135, 13, PALETTE.ring, 'center', true);
    }
    drawInstruments(state);
  }

  function drawInstruments(state) {
    const plane = state.plane;
    // Artificial horizon, bottom left.
    const cx = 92; const cy = 618; const r = 52;
    context.save();
    context.beginPath(); context.arc(cx, cy, r, 0, Math.PI * 2); context.clip();
    context.translate(cx, cy);
    context.rotate(-plane.roll);
    context.translate(0, (plane.alt - 0.55) * 60);
    context.fillStyle = '#3f8fd2'; context.fillRect(-r, -r, r * 2, r);
    context.fillStyle = '#8a6a42'; context.fillRect(-r, 0, r * 2, r);
    context.restore();
    context.strokeStyle = PALETTE.panelEdge; context.lineWidth = 3;
    context.beginPath(); context.arc(cx, cy, r, 0, Math.PI * 2); context.stroke();
    context.strokeStyle = '#fff'; context.lineWidth = 2;
    context.beginPath(); context.moveTo(cx - 26, cy); context.lineTo(cx - 8, cy); context.moveTo(cx + 8, cy); context.lineTo(cx + 26, cy); context.stroke();
    context.fillStyle = PALETTE.ring;
    context.beginPath(); context.arc(cx, cy, 4, 0, Math.PI * 2); context.fill();
    text('ATTITUDE', cx, cy - r - 10, 11, PALETTE.muted, 'center');
    // Altimeter dial, bottom left centre.
    const ax = 196; const ay = 618;
    context.fillStyle = PALETTE.panel;
    context.beginPath(); context.arc(ax, ay, 44, 0, Math.PI * 2); context.fill();
    context.strokeStyle = PALETTE.panelEdge; context.lineWidth = 2;
    context.beginPath(); context.arc(ax, ay, 44, 0, Math.PI * 2); context.stroke();
    for (let i = 0; i < 8; i += 1) {
      const a = (i / 8) * Math.PI * 2;
      context.strokeStyle = PALETTE.muted; context.lineWidth = 2;
      context.beginPath();
      context.moveTo(ax + Math.cos(a) * 38, ay + Math.sin(a) * 38);
      context.lineTo(ax + Math.cos(a) * 32, ay + Math.sin(a) * 32);
      context.stroke();
    }
    const altA = -Math.PI / 2 + plane.alt * Math.PI * 2;
    context.strokeStyle = PALETTE.text; context.lineWidth = 3;
    context.beginPath(); context.moveTo(ax, ay); context.lineTo(ax + Math.cos(altA) * 30, ay + Math.sin(altA) * 30); context.stroke();
    text(`${Math.round(800 + plane.alt * 4400)}`, ax, ay + 62, 12, PALETTE.text, 'center', true);
    text('ALT FT', ax, ay + 76, 10, PALETTE.muted, 'center');
    // Speed dial, bottom right.
    const sx = FIELD.width - 196; const sy = 618;
    context.fillStyle = PALETTE.panel;
    context.beginPath(); context.arc(sx, sy, 44, 0, Math.PI * 2); context.fill();
    context.strokeStyle = PALETTE.panelEdge; context.lineWidth = 2;
    context.beginPath(); context.arc(sx, sy, 44, 0, Math.PI * 2); context.stroke();
    const spdFrac = (plane.speed - 100) / 210;
    const spdA = -Math.PI / 2 + Math.max(0, Math.min(1, spdFrac)) * Math.PI * 2;
    context.strokeStyle = PALETTE.good; context.lineWidth = 3;
    context.beginPath(); context.moveTo(sx, sy); context.lineTo(sx + Math.cos(spdA) * 30, sy + Math.sin(spdA) * 30); context.stroke();
    text(`${Math.round(plane.speed)}`, sx, sy + 62, 12, PALETTE.text, 'center', true);
    text('KT', sx, sy + 76, 10, PALETTE.muted, 'center');
    // Throttle bar, far right edge, filling bottom-up.
    text('THR', FIELD.width - 30, 566, 11, PALETTE.muted, 'center');
    context.fillStyle = 'rgba(255,255,255,0.18)';
    roundRect(FIELD.width - 40, 576, 18, 108, 9);
    context.fill();
    context.fillStyle = PALETTE.warn;
    const thH = 108 * Math.max(0, Math.min(1, plane.throttle));
    roundRect(FIELD.width - 40, 576 + (108 - thH), 18, thH, 9);
    context.fill();
    // Controls hint.
    text('← → / A D steer · ↑ ↓ climb / descend · Shift boost · P pause · M sound', 640, 706, 12, 'rgba(238,244,248,0.75)', 'center');
  }

  function drawPanel(title, lines, prompt, accent = PALETTE.ring) {
    const width = 640;
    const height = 150 + lines.length * 32;
    const x = (FIELD.width - width) / 2;
    const y = (FIELD.height - height) / 2 - 30;
    context.fillStyle = PALETTE.panel;
    roundRect(x, y, width, height, 16);
    context.fill();
    context.strokeStyle = PALETTE.panelEdge;
    context.lineWidth = 2;
    roundRect(x, y, width, height, 16);
    context.stroke();
    text(title, FIELD.width / 2, y + 62, 44, PALETTE.text, 'center', true);
    lines.forEach((line, i) => text(line, FIELD.width / 2, y + 104 + i * 32, 19, PALETTE.muted, 'center'));
    text(prompt, FIELD.width / 2, y + height - 26, 20, accent, 'center', true);
  }

  function draw(state, screen, best, time, muted) {
    resize();
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.fillStyle = '#0c1420';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.setTransform(view.scale, 0, 0, view.scale, view.x, view.y);
    const horizon = drawSky(state, time);
    drawGround(state, horizon, time);
    drawEntities(state, horizon, time);
    if (screen !== SCREEN_TITLE) drawPlane(state, time);
    else {
      // Title backdrop: the plane cruises over the valley, unsteered.
      drawPlane(state, time);
    }
    drawHud(state, screen);
    if (muted) text('SOUND OFF (M)', FIELD.width - 20, 110, 13, PALETTE.muted, 'right');
    if (state.flash > 0) {
      context.fillStyle = `rgba(255, 201, 60, ${state.flash * 0.25})`;
      context.fillRect(0, 0, FIELD.width, FIELD.height);
    }
    if (flashRed > 0.02) {
      context.fillStyle = `rgba(255, 80, 60, ${flashRed * 0.3})`;
      context.fillRect(0, 0, FIELD.width, FIELD.height);
    }
    if (screen === SCREEN_TITLE) {
      drawPanel('SKYLARK COURIER', [
        'Fly the mail run: through 10 golden rings to Runway 27.',
        'Steer with ← → or A D, climb with ↑ or W, descend with ↓ or S.',
        'Mouse steers too. Shift boosts. Storms, balloons and birds hurt.',
        `Best score ${best} · Rings refill fuel · Watch the fuel gauge`,
      ], 'Press Enter, Space or click to take off');
    } else if (screen === SCREEN_PAUSED) {
      drawPanel('PAUSED', ['The valley waits below.', 'P or Enter to keep flying · R to restart'], 'Paused');
    } else if (screen === SCREEN_OVER) {
      const won = state.won;
      drawPanel(won ? 'DELIVERY COMPLETE!' : 'FLIGHT OVER', [
        state.overReason || '',
        `Score ${state.score} · Rings ${state.rings}/10 · Best ${best}`,
        won ? 'The mail is on the runway. The valley sends its thanks.' : 'Press R to fly the run again.',
      ], 'Press Enter or R to fly again', won ? PALETTE.good : PALETTE.bad);
    }
    // Hit flash decays here, in the only place that runs every frame.
    flashRed = Math.max(0, flashRed - 0.03);
    flashGold = Math.max(0, flashGold - 0.03);
  }

  return {
    draw(state, screen, best, time, muted, hit) {
      if (hit) flashRed = 0.9;
      draw(state, screen, best, time, muted);
    },
    resize,
  };
}
