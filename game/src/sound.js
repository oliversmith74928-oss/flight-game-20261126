// All sound is synthesised with WebAudio — no audio files, no network.
// An engine drone follows the speed, a chime marks a ring, a thud marks a hit,
// and a short arpeggio celebrates a delivery. Mute with M.

export function createSound() {
  let context = null;
  let engineOsc = null;
  let engineGain = null;
  let muted = false;

  function ensure() {
    if (context) return true;
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return false;
      context = new Ctx();
      engineOsc = context.createOscillator();
      engineOsc.type = 'sawtooth';
      engineOsc.frequency.value = 55;
      const filter = context.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 320;
      engineGain = context.createGain();
      engineGain.gain.value = 0;
      engineOsc.connect(filter).connect(engineGain).connect(context.destination);
      engineOsc.start();
      return true;
    } catch {
      return false;
    }
  }

  function blip(freq, dur, type, vol, when = 0) {
    if (!context || muted) return;
    try {
      const t = context.currentTime + when;
      const osc = context.createOscillator();
      const gain = context.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(vol, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
      osc.connect(gain).connect(context.destination);
      osc.start(t);
      osc.stop(t + dur + 0.02);
    } catch {
      // Sound is garnish: never let it break the game.
    }
  }

  return {
    unlock() {
      if (ensure() && context.state === 'suspended') context.resume().catch(() => {});
    },
    engine(speed01, running) {
      if (!ensure() || muted) {
        if (engineGain) engineGain.gain.value = 0;
        return;
      }
      const target = running ? 0.035 + speed01 * 0.05 : 0;
      engineGain.gain.setTargetAtTime(target, context.currentTime, 0.1);
      engineOsc.frequency.setTargetAtTime(48 + speed01 * 62, context.currentTime, 0.1);
    },
    ring() {
      blip(880, 0.18, 'sine', 0.22);
      blip(1318, 0.28, 'sine', 0.18, 0.08);
    },
    near() {
      blip(660, 0.12, 'sine', 0.12);
    },
    hit() {
      blip(90, 0.3, 'square', 0.25);
      blip(55, 0.35, 'sawtooth', 0.2, 0.02);
    },
    win() {
      [523, 659, 784, 1046].forEach((f, i) => blip(f, 0.35, 'triangle', 0.2, i * 0.11));
    },
    toggleMute() {
      muted = !muted;
      if (engineGain) engineGain.gain.value = 0;
      return muted;
    },
    isMuted() {
      return muted;
    },
  };
}
