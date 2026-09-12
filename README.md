# DriveWell Vehicle Health Platform — v7

v7 fixes the blank component-focus scene by preserving the complete GLB hierarchy.

## 3D fix

The previous build cloned individual child nodes out of the source GLB. That discarded inherited parent transforms and could leave the component view empty.

v7 instead:

- clones the complete, normalised vehicle scene
- keeps the entire source hierarchy intact
- ghosts the real car as component context
- separates the actual `Wheel_FL` for the front-left tyre
- separates the actual `Wheel_RR` for the rear-right brake context
- leaves a ghost wheel in the original position to make the separation clear
- camera-fits every component scene from its real calculated bounding box
- grounds every component scene from its real calculated bounding box
- keeps the requested white body finish
- uses no fake procedural tyre, wiper, battery, filter, lamp or exhaust models

Where the free source GLB does not contain a component as a separate mesh, DriveWell highlights the correct area on the real vehicle rather than inventing low-quality geometry.

## Clean deployment

`deploy-clean.ps1` still deletes every existing application file from the repository working tree, preserving `.git` only, before copying v7 and pushing `main`.

## Attribution

Vehicle: “Lowpoly Generic SUV” by mk2design, CC BY 4.0.
