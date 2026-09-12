# DriveWell Vehicle Health Platform — v4

DriveWell v4 is a **clean rebuild**, not a patch on v3.

## Main v4 change: premium 3D interaction

The vehicle overview now uses a cleaner 3/4 presentation with only four subtle, component-anchored hotspots:

- front-left tyre
- rear-right brakes
- front-right headlamp
- front wipers

Battery, air filter, cabin filter and exhaust remain in the findings list but do not clutter the vehicle overview.

Selecting an exterior hotspot now follows a progressive interaction:

1. other hotspots fade
2. camera glides toward the affected area
3. a compact callout identifies the finding
4. the experience transitions into the exploded component view
5. Back to vehicle restores the overview

The exploded component scenes have also been rebuilt for clearer part separation and context.

## Platform flow

- Manager dashboard
- Simple technician data capture
- Customer vehicle health report
- 3D component education
- Approve / ask / defer
- Communications & approvals

## Clean GitHub deployment

Run `deploy-clean.ps1` after placing both the script and `drivewell-platform-v4-clean.zip` in Downloads.

The script:

1. clones `GlitchedDuck/vehicle-health-check`
2. deletes everything except `.git`
3. copies the complete v4 build
4. stages all deletions and additions
5. commits
6. pushes `main`

No old application files are retained.

## Attribution

The vehicle demo uses “Lowpoly Generic SUV” by mk2design under CC BY 4.0.
