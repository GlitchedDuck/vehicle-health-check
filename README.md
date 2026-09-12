# DriveWell Vehicle Health Platform — v6

DriveWell v6 is a clean rebuild of the 3D experience.

## What changed

- Restored the vehicle to a clean white finish
- Kept the original free SUV GLB geometry
- Removed the fake procedural tyre, brake, wiper, battery, filter, lamp and exhaust models
- Removed the exploded-view pedestal that was causing components to visually intersect the ground
- Component focus now uses cloned geometry from the actual vehicle GLB
- Front-left tyre uses the actual `Wheel_FL` vehicle node
- Rear-right brake focus uses the actual `Wheel_RR` vehicle node as real context
- Body, glass, interior, details and wheels separate using the original vehicle geometry
- Items that are not separate meshes in the GLB are highlighted in the real vehicle context instead of being represented by invented boxes/cylinders
- All component scenes are automatically grounded above the floor
- The overview vehicle is larger and sits clear of the floor

## Important limitation

The current free SUV GLB does not contain separate geometry for brake pads, battery, wiper blades, air filter, pollen filter, exhaust or headlamp internals.

v6 deliberately does **not** fake those parts.

A later asset pass can add licensed/CC0 component GLBs for true component-level exploded views.

## Clean deployment

`deploy-clean.ps1` deletes everything except `.git` before copying v6 into the repository and pushing `main`.

## Attribution

Vehicle: “Lowpoly Generic SUV” by mk2design, CC BY 4.0.
