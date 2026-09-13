# DriveWell Vehicle Health Platform — v8

v8 replaces the ghost-car component view with service assemblies.

## 3D changes

- White vehicle retained
- No giant focus sphere in the final component scene
- Tyre view uses the actual vehicle wheel geometry
- Brake, battery, headlamp, air-filter and exhaust views use generic CC0 service-component GLB assets at runtime
- Front-wiper and cabin-filter views use more detailed DriveWell service assemblies
- A small ghost vehicle is used only as location/scale context
- Components animate apart into a readable service layout
- Every assembly is centred and grounded from calculated bounds
- Camera framing is calculated from the assembly bounds

## External assets

Several generic service components are loaded from the CC0 Survivor Vehicle Maintenance pack on 3DAssets.dev.

The SUV remains “Lowpoly Generic SUV” by mk2design under CC BY 4.0.

## Clean deployment

`deploy-clean.ps1` deletes every old application file except `.git`, copies v8 as a complete snapshot, commits and pushes `main`.
