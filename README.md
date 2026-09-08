# Vehicle Health Check — v16

## Run or upload

Extract the complete ZIP and keep its folder structure. Upload its contents to the root of the existing GitHub Pages site, or serve the extracted folder using a local HTTP server. For example, with Python installed, run `python -m http.server 8765` in the extracted folder and open `http://localhost:8765/`.

Do not double-click index.html: browser security may block module and GLB loading under file://.

The complete build includes index.html, app.js, styles.css, assets/car_v2.glb and vendor/. All 3D dependencies are local; no runtime CDN is required. The three individual source downloads require the assets/ and vendor/ folders from the ZIP. App, stylesheet, model and vendor module references use v16 cache keys.

## v16 overview model

The overview now uses the supplied 11497_Car_v2.obj, converted to a 2.4 MB indexed GLB. The original geometry is preserved at 97,536 triangles, reoriented from Z-up and normalised for the viewer. The material/image files supplied with it were empty, so a neutral body finish and basic tyre/alloy surface regions are assigned. The source is one joined mesh: custom ray anchors place the issue markers on the actual surfaces, and exploded views use the existing procedural components. The previous SUV is no longer loaded.

## Component refinements

Original procedural geometry now includes staggered tyre tread, alloy spokes and wheel hardware; a ventilated disc, shaped friction pads and an open caliper; lead-acid plate stacks, vents and terminals; and a headlamp housing, reflector bowls, bulb and outer lens. Repeated details use instancing to reduce draw calls. The v14.1 surface marker correction is retained. These remain generic educational illustrations, not manufacturer-specific assemblies. No paid assets were added.

## Interaction

- Starts with the supplied coupé. Select a coloured marker, component button or finding to open its local exploded illustration.
- Tyre: worn tread, tyre, rim and hub separate.
- Brakes: an illustrative wheel moves out alongside a procedural disc, pads and caliper.
- Battery: case, six cells, cover and terminals separate vertically.
- Headlamp: housing, reflector, bulb and lens separate.
- Back to vehicle restores the overview. The separation slider assembles/disassembles the active component; Reset view reframes it. Camera transitions yield to manual dragging. Reduced-motion preference skips the entry transition.
- Findings, measurement bands, evidence records, sample history and approve/ask/defer decisions stay linked to the selected issue. No forced page scrolling is used.
- Choices and questions remain in memory for the current page session. Reloading clears them. Nothing is sent to a workshop and no payments or bookings occur.

## Source and limitations

The public repository contained v12. The v13 generated downloads were not recoverable from the referenced conversation. v14 therefore builds on that existing source and the original uploaded GLB, recreating the measurement, evidence and history features described in the v13 conversation.

The exploded components are explanatory geometry, not manufacturer CAD or scale-accurate mechanical assemblies. The car fades during the transition into each isolated local module. Its joined mesh does not supply separately articulated wheels, bonnet or lamps.

No actual technician photo/video was supplied for the four findings. Evidence is explicitly labelled sample data; historical readings, lamp output and thresholds are illustrative. Prices and report content are carried forward as demo data. Vehicle-specific inspection standards must be supplied before production use.

## Validation

JavaScript syntax check passed. Automated logic checks passed using the actual GLB parser and Three.js geometry with mocked browser rendering: all modules, named-wheel reuse, separation, return, rapid switching, decisions, questions, review, HTML references and absence of forced scroll calls. See VALIDATION.md. Visual browser/WebGL testing was not performed.

## Model sources

Current overview: user-supplied 11497_Car_v2.obj. The accompanying Blank.mtl and Blank image.jpg were empty. Author and licence metadata were not included in those files. The conversion retains the source geometry and adds basic materials and non-rendered marker anchors.

The earlier SUV credit belongs to previous builds, not the current overview. Original procedural exploded components are retained from v15.

Three.js 0.179.1 is bundled under the MIT licence; see vendor/LICENSE.txt.
