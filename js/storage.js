const KEYS = Object.freeze({ sound: 'obvio.soundEnabled', record: 'obvio.bestPhase' });

function read(key) {
  try { return window.localStorage.getItem(key); } catch { return null; }
}

function write(key, value) {
  try { window.localStorage.setItem(key, String(value)); } catch { /* Private browsing may disable storage. */ }
}

export function getSoundEnabled() { return read(KEYS.sound) !== 'false'; }
export function setSoundEnabled(enabled) { write(KEYS.sound, enabled); }
export function getBestPhase() {
  const value = Number.parseInt(read(KEYS.record), 10);
  return Number.isFinite(value) && value > 0 ? value : 0;
}
export function saveBestPhase(phase) {
  const best = Math.max(getBestPhase(), Math.max(0, Math.floor(Number(phase) || 0)));
  write(KEYS.record, best);
  return best;
}
