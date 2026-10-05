// DriveWell application entry point.

import { FINDINGS } from './data/findings.js';
import './three/model-overrides.js';
import './three/brake-model-overrides.js';
import './three/hotspot-anchor-fix.js';
import './report-layout-v12.js';
import './report-forecast.js';

export const DRIVEWELL_VERSION = '19.0.0-3d-recovery';

// Preserve the existing v10b storage contract during the refactor. On a fresh
// browser session the demo state originates from the extracted findings catalogue.
const legacyStateKey = 'drivewellV5State';
if (!localStorage.getItem(legacyStateKey)) {
  localStorage.setItem(legacyStateKey, JSON.stringify({
    findings: structuredClone(FINDINGS),
    decisions: {},
    messages: []
  }));
}

await import('../app.js');