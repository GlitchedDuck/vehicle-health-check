# Vehicle Health Check

A mobile-first customer-facing digital vehicle health check proof of concept.

## Current POC — v12

The report demonstrates a workshop-to-customer experience:

- interactive self-hosted 3D vehicle rendered with Three.js
- dealership-style neutral vehicle presentation with smaller inspection pins
- 3D marker/part clicks stay in place and no longer force the page to scroll
- side-by-side 3D viewer and inspection findings on desktop/tablet
- finding selection never auto-scrolls the page
- clickable inspection markers and wheel components
- red / amber issue severity
- plain-English customer explanations
- expandable workshop technical detail
- technician photo/video placeholders
- estimated repair pricing
- approve / decline / ask-about-this interactions
- running approved-work total
- responsive mobile layout

## 3D implementation

The app uses a self-hosted GLB at:

`assets/lowpoly_generic_suv.glb`

The model is loaded with Three.js `GLTFLoader`; the site does **not** embed the Sketchfab viewer.

Current directly addressable model parts include the four wheel objects (`Wheel_FL`, `Wheel_FR`, `Wheel_RL`, `Wheel_RR`). Other inspection locations use our own 3D hotspots until a more componentised model is available.

## Run

This is a static GitHub Pages project. No build step is required.

Open `index.html` via a local web server, or use the published GitHub Pages site.

## Production direction

A production version could receive inspection data from a DMS/workshop system and normalise it to component keys, then map those keys to 3D meshes or hotspot zones. Technician media and customer decisions would be persisted server-side.

## 3D model attribution

**Lowpoly Generic SUV** by **mk2design**, licensed under **CC BY 4.0**.

Source: https://sketchfab.com/3d-models/lowpoly-generic-suv-edc994ad28ed438cb365c0e0389ac177

Licence: https://creativecommons.org/licenses/by/4.0/
