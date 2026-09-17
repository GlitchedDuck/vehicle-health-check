# DriveWell v11 architecture baseline

DriveWell v11 keeps the current v10b prototype working while the codebase is moved from a single-file prototype into a maintainable platform structure.

## Goals

- Preserve the current Dashboard -> Technician Inspection -> Vehicle Health Report -> Communications & Approvals journey.
- Stop using clean repository replacement as the normal delivery model.
- Separate state, vehicle/component configuration, UI rendering and Three.js concerns.
- Make component-to-vehicle mapping explicit and testable.
- Prepare the frontend to consume API data instead of hard-coded demo findings.
- Add lightweight CI checks before larger refactors begin.

## Target structure

```text
/
├── index.html
├── app.js                    # v10b runtime kept temporarily during migration
├── styles.css                # v10b styles kept temporarily during migration
├── js/
│   ├── app.js                # v11 entry point / migration bridge
│   ├── state.js              # versioned browser-state helpers
│   └── config/
│       └── component-manifest.js
├── styles/
│   ├── base.css
│   ├── dashboard.css
│   ├── inspection.css
│   ├── report.css
│   └── approvals.css
├── assets/
│   └── lowpoly_generic_suv.glb
└── .github/workflows/
    └── baseline-checks.yml
```

## Component model

Each inspectable item should ultimately have one definition containing:

- finding/component ID
- vehicle node or anchor strategy
- hotspot behaviour
- camera preset
- service-view asset/renderer
- inspection metadata
- customer-report metadata

This replaces component-specific behaviour being spread throughout the viewer code.

## Migration sequence

1. Establish v11 folders, component manifest, state helpers and CI checks.
2. Move the HTML entry points onto the v11 JS/CSS wrappers without changing behaviour.
3. Extract demo findings and persistence from the legacy `app.js`.
4. Extract Three.js vehicle loading, hotspots, camera and component builders.
5. Replace remote component URLs with an explicit managed asset strategy.
6. Add regression checks around routing, state persistence and component definitions.
7. Replace hard-coded demo data with service/API adapters.

## Non-goals for the baseline

The baseline is intentionally not a visual redesign. It should look and behave like the current DriveWell demo while the internals become safer to change.