# DriveWell — v10 Front Left Tyre

This release deliberately focuses on **one component only**: the front-left tyre.

## What is different

The tyre service scene no longer uses the generic remote wheel asset.

It extracts the actual `Wheel_FL` node from the same SUV GLB used in the vehicle overview, preserves its world transform, isolates it, rescales it as a hero model and applies premium wheel/tyre materials.

The red tread marker is an overlay showing the 1.3 mm low-tread issue; it is not used as fake component geometry.

The tyre scene:
- uses the real vehicle wheel geometry
- is independently centred and grounded
- fills the viewer
- has a restrained locator vehicle
- has a dedicated 1.3 mm inspection panel
- does not fall back to wipers or any unrelated component

Other component scenes are intentionally left alone while the tyre view is refined and approved.

## Clean deployment

`deploy-clean.ps1` removes all existing repo files except `.git`, then copies this complete release and pushes main.

## Vehicle attribution

“Lowpoly Generic SUV” by mk2design, CC BY 4.0.
