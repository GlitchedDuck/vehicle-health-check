# Vehicle Health Check — v15

## Run or upload

Extract the complete ZIP and keep its folder structure. Upload its contents to the root of the existing GitHub Pages site, or serve the extracted folder using a local HTTP server. For example, with Python installed, run `python -m http.server 8765` in the extracted folder and open `http://localhost:8765/`.

Do not double-click index.html: browser security may block module and GLB loading under file://.

The complete build includes index.html, app.js, styles.css, assets/lowpoly_generic_suv.glb and vendor/. All 3D dependencies are local; no runtime CDN is required. The three individual source downloads require the assets/ and vendor/ folders from the ZIP. App, stylesheet, model and vendor module references use v15 cache keys.

## v15 component refinements

Original procedural geometry now includes staggered tyre tread, alloy spokes and wheel hardware; a ventilated disc, shaped friction pads and an open caliper; lead-acid plate stacks, vents and terminals; and a headlamp housing, reflector bowls, bulb and outer lens. Repeated details use instancing to reduce draw calls. The v14.1 surface marker correction is retained. These remain generic educational illustrations, not manufacturer-specific assemblies. No paid assets were added.

## Interaction

- Starts with the complete original SUV. Select a coloured marker, component button or finding to open its local exploded illustration.
- Tyre: worn tread, tyre, rim and hub separate.
- Brakes: the original model's rear-right wheel moves out alongside a procedural disc, pads and caliper.
- Battery: case, six cells, cover and terminals separate vertically.
- Headlamp: housing, reflector, bulb and lens separate.
- Back to vehicle restores the overview. The separation slider assembles/disassembles the active component; Reset view reframes it. Camera transitions yield to manual dragging. Reduced-motion preference skips the entry transition.
- Findings, measurement bands, evidence records, sample history and approve/ask/defer decisions stay linked to the selected issue. No forced page scrolling is used.
- Choices and questions remain in memory for the current page session. Reloading clears them. Nothing is sent to a workshop and no payments or bookings occur.

## Source and limitations

The public repository contained v12. The v13 generated downloads were not recoverable from the referenced conversation. v14 therefore builds on that existing source and the original uploaded GLB, recreating the measurement, evidence and history features described in the v13 conversation.

The exploded components are first-pass explanatory geometry, not manufacturer CAD or scale-accurate mechanical assemblies. The SUV fades during the transition into each isolated local module. Its body has no separately articulated bonnet or headlamp, so these views use component illustrations rather than opening the original body panels.

No actual technician photo/video was supplied for the four findings. Evidence is explicitly labelled sample data; historical readings, lamp output and thresholds are illustrative. Prices and report content are carried forward as demo data. Vehicle-specific inspection standards must be supplied before production use.

## Validation

JavaScript syntax check passed. Automated logic checks passed using the actual GLB parser and Three.js geometry with mocked browser rendering: all modules, named-wheel reuse, separation, return, rapid switching, decisions, questions, review, HTML references and absence of forced scroll calls. See VALIDATION.md. Visual browser/WebGL testing was not performed.

## Credits

Lowpoly Generic SUV by mk2design, licensed CC BY 4.0.
Original: https://sketchfab.com/3d-models/lowpoly-generic-suv-edc994ad28ed438cb365c0e0389ac177
Licence: https://creativecommons.org/licenses/by/4.0/
The web presentation normalises its scale/orientation and changes the body material. Original GLB bytes are unchanged. Procedural component geometry and v14 interactions are additional work.

Three.js 0.179.1 is bundled under the MIT licence; see vendor/LICENSE.txt.
