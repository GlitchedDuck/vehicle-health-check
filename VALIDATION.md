# v14 validation

Marker correction (v14.1 app cache key): all four markers verified within 0.035 scene units of the actual wheel/body surfaces, with depth testing enabled. Removed the vertical marker offset and excluded the shadow plane from body marker bounds.

- `node --check app.js`: passed.
- Actual GLB container and scene parsing: passed. The model contains the named wheel nodes used by the application; model images and buffers are embedded.
- All four module constructors: passed with real Three.js geometry.
- Repeated brake selection while the vehicle is faded: exercised. Reused wheel materials restore their original opacity.
- Separation slider at 0% and 100%: passed for all modules.
- Back to vehicle and rapid select/back/select transitions: passed.
- Approve, defer, question save/edit and choice review: passed in a mocked DOM.
- JavaScript's direct HTML ID references: all present.
- Forced scroll calls: none.
- Local dependency references and ZIP content: checked during packaging.

These are syntax, asset and programmatic interaction checks. The test harness uses mocked DOM, camera controls and renderer, and stubbed image decoding. It does not verify actual browser/WebGL rendering, visual layout, label placement or touch behaviour. Those remain for browser/device acceptance testing.
