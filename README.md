# DriveWell v10b — Front Left Tyre

This release corrects the tyre model only.

- Uses the actual `Wheel_FL` mesh from the SUV GLB.
- Preserves the original wheel material/UV texture instead of replacing it with a flat metallic material.
- Removes the oversized red torus.
- Uses a small tread-warning arc on the outer circumference.
- Removes the ghost car from the tyre service scene.
- Uses a tyre-specific side-on camera so the wheel face is visible.
- Grounds the real wheel from its calculated bounds.
- Does not pretend the tyre and rim can be separated: this source GLB stores `Wheel_FL` as one combined mesh.

Other component scenes are unchanged.
