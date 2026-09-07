# Vehicle Health Check POC

A mobile-first customer-facing digital vehicle health check that turns workshop findings into a visual, plain-English report.

## Current experience

- Interactive 3D generic SUV rather than a procedural diagram.
- Rotate and zoom the vehicle on desktop or mobile.
- Inspection markers identify affected areas and move the camera to the selected issue.
- Traffic-light severity: urgent, attention and healthy.
- Customer-friendly explanations for what was found, why it matters, what can happen if it is ignored, and what the workshop recommends.
- Expandable technical detail for users who want the workshop measurements.
- Technician photo/video evidence placeholders.
- Example repair pricing.
- Approve, decline and ask-about-this interactions with an approved-work total.

## 3D integration

The POC uses the Sketchfab Viewer API with the public **Lowpoly Generic SUV** model by **mk2design**. The model is lightweight and includes separate wheel objects, allowing the proof of concept to highlight affected wheels and position inspection annotations around the vehicle.

Model: https://sketchfab.com/3d-models/lowpoly-generic-suv-edc994ad28ed438cb365c0e0389ac177

License: **CC BY 4.0**. Attribution must remain in any version that uses this asset.

The user also supplied the GLB during development. A production version can self-host an optimised GLB instead of relying on the Sketchfab viewer while retaining the same component mapping and report UX.

## Sample findings

The demonstration currently includes:

- Front-left tyre below the legal tread limit — urgent.
- Rear-right brake pads wearing low — attention.
- Front-right headlamp output reduced — attention.
- 12V battery health declining — attention.

All vehicle, inspection and pricing information in this POC is sample data.

## Production direction

A production implementation would typically:

1. Receive the vehicle registration or VIN from the workshop/DMS.
2. Combine technician inspection data, service history and MOT data where appropriate.
3. Normalise workshop terminology into a vehicle-component taxonomy.
4. Map each finding to a 3D component or hotspot.
5. Attach technician photos/video and measurements.
6. Generate a customer-facing explanation and severity.
7. Send the customer a secure report link.
8. Return customer approvals/declines to the service adviser or workshop system.

## Hosting

The POC is a static site and is published using GitHub Pages from the `main` branch.
