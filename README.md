# DriveWell Vehicle Health Platform — v5

DriveWell v5 is a **clean rebuild**.

## v5 3D changes

- Larger 3/4 vehicle view
- HTML/CSS billboard hotspots rather than 3D ring markers
- Hotspots stay crisp and circular regardless of camera angle
- Front-left tyre and rear-right brake anchors derive from named GLB wheel geometry
- Headlamp and wiper anchors derive from the vehicle bounding geometry
- Other service items remain in the findings list and do not clutter the car
- Selecting a visible fault:
  1. fades other hotspots
  2. highlights the affected area
  3. glides the camera towards it
  4. fades the vehicle into context
  5. transitions into the exploded component
- Exploded views include ghosted surrounding context to improve comprehension
- Back to vehicle restores the overview

## Platform

- Manager dashboard
- Simple technician structured-data capture
- Customer vehicle health report
- Approve / ask / defer
- Communications and approvals

## Clean deployment

Use `deploy-clean.ps1`.

It clones the repo, deletes everything except `.git`, copies v5 as a complete snapshot, stages deletions/additions and pushes `main`.

## Attribution

The demo uses “Lowpoly Generic SUV” by mk2design under CC BY 4.0.
