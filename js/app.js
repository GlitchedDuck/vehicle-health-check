// DriveWell v11 application entry point.
//
// During the baseline migration the proven v10b runtime remains in the root
// `app.js`. This bridge gives us a stable v11 entry point so the legacy file can
// be decomposed incrementally without another full repository rebuild.

export const DRIVEWELL_VERSION = '11.0.0-baseline';

await import('../app.js');
