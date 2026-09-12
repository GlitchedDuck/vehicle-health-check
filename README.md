# Vehicle Health Platform — Working Demo v1

A static working demo of a connected dealership vehicle-health platform.

## Included flows

- Manager dashboard
- Simple technician capture workflow
- Structured inspection data with automatic severity classification
- Customer interactive 3D vehicle report
- Working exploded component views for:
  - tyre / wheel
  - brake pads + disc
  - 12V battery
  - headlamp
  - wiper blade
  - engine air filter
  - cabin / pollen filter
  - exhaust
- Measurement, evidence, explanation and component history
- Approve / ask / defer customer actions
- Communications / approval feed back into the dealer portal
- Mobile responsive layout
- No forced page scrolling from issue selection

## Run

This is a static site. Serve the folder from any HTTP server, or deploy the root to GitHub Pages.

Example:

```bash
python -m http.server 8000
```

Then open `http://localhost:8000`.

## Important

The 3D component modules are procedural customer-education models, not engineering CAD and not make/model-specific.

The technician does **not** interact with 3D. The technician only captures structured facts; the customer visualisation is generated from that data.

## Model attribution

The demo uses “Lowpoly Generic SUV” by mk2design under CC BY 4.0.
