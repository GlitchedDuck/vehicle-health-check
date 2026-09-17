const CURRENT_STATE_KEY = 'drivewellV11State';
const LEGACY_STATE_KEYS = ['drivewellV5State'];

export function readState(fallbackFactory) {
  for (const key of [CURRENT_STATE_KEY, ...LEGACY_STATE_KEYS]) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const parsed = JSON.parse(raw);
      if (key !== CURRENT_STATE_KEY) {
        localStorage.setItem(CURRENT_STATE_KEY, JSON.stringify(parsed));
      }
      return parsed;
    } catch {
      // Ignore malformed local demo state and continue to the next source.
    }
  }

  return fallbackFactory();
}

export function writeState(state) {
  localStorage.setItem(CURRENT_STATE_KEY, JSON.stringify(state));
}

export function clearState() {
  localStorage.removeItem(CURRENT_STATE_KEY);
}

export { CURRENT_STATE_KEY };
