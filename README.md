# DriveWell Vehicle Health Platform — v9

v9 fixes the component-scene problems visible in v8.

## v9 fixes

- No generic fallback assembly is reused for unrelated findings.
- Front-left tyre has its own dedicated wheel asset.
- Rear-right brake uses dedicated brake disc, caliper and wheel assets.
- 12V battery uses dedicated battery, tray and terminal-clamp assets.
- Front-right headlamp uses a dedicated headlamp asset.
- Engine air filter uses a dedicated air-filter asset.
- Rear exhaust uses a dedicated exhaust-silencer asset.
- Front wipers have their own detailed DriveWell assembly.
- Cabin/pollen filter has its own detailed DriveWell assembly.
- Every scene is independently scaled, centred, grounded and camera-fitted.
- The small ghost vehicle is reduced to subtle location context only.
- Asset load failure now shows an error instead of silently substituting the wrong component.

## Service assets

The generic service parts use individual CC0 assets from the Survivor Vehicle Maintenance pack on 3DAssets.dev.

The vehicle remains “Lowpoly Generic SUV” by mk2design, CC BY 4.0.

## Clean deployment

`deploy-clean.ps1` clones the repository, removes every existing working-tree file except `.git`, copies the complete v9 release, commits and pushes `main`.
