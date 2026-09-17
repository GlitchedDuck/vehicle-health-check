// DriveWell v11 application entry point.
//
// The visible v10b runtime remains unchanged while data and viewer concerns are
// extracted behind stable modules. This bridge prepares the runtime cutover
// without changing any current routes, markup or interactions.

import { FINDINGS } from './data/findings.js';
import './three/model-overrides.js';

export const DRIVEWELL_VERSION = '11.1.0-3d-models';

// Preserve the existing v10b storage contract during the refactor. On a fresh
// browser session the demo state now originates from the extracted findings
// catalogue rather than needing another copy in a new v11 module.
const legacyStateKey = 'drivewellV5State';
if (!localStorage.getItem(legacyStateKey)) {
  localStorage.setItem(legacyStateKey, JSON.stringify({
    findings: structuredClone(FINDINGS),
    decisions: {},
    messages: []
  }));
}

await import('../app.js');
