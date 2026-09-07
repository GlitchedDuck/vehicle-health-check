# Vehicle Health Visualiser POC

A front-end proof of concept showing how MOT and service findings can be mapped onto an interactive 3D vehicle.

## What it demonstrates

- Enter a vehicle registration.
- Load mock MOT/service inspection data.
- Rotate and zoom a 3D vehicle.
- Highlight affected components using a traffic-light system.
- Click a highlighted component or finding to view severity, source and recommended action.
- Separate issue `componentKey` values from 3D mesh names so future data providers can map into the same model.

## Run it

This POC imports Three.js from jsDelivr, so the browser needs internet access.

### Simplest option

Open `index.html` in a modern browser. If your browser blocks module imports from local files, run a tiny local web server instead.

### Python

From this folder:

```bash
python -m http.server 8080
```

Then browse to:

```text
http://localhost:8080
```

### Node

```bash
npx serve .
```

## Where real DVSA data plugs in

Replace the mock `sampleVehicle` object in `app.js` with a server-side API call that returns the same normalised shape:

```json
{
  "registration": "AB12 CDE",
  "name": "Vehicle description",
  "mileage": "41,280 mi",
  "inspectionDate": "2 Sep 2026",
  "issues": [
    {
      "componentKey": "tyre.FL",
      "meshName": "TYRE_FL",
      "title": "Nearside front tyre",
      "location": "Front left wheel",
      "severity": "red",
      "officialSeverity": "Major",
      "source": "MOT",
      "action": "Replace before driving",
      "description": "..."
    }
  ]
}
```

Recommended production flow:

1. Backend receives registration.
2. Backend calls DVSA MOT History API using server-side credentials.
3. MOT defects are normalised into a vehicle component taxonomy.
4. A rule/mapping engine converts positions such as near-side/front into keys such as `tyre.FL`.
5. The front-end maps those keys to named meshes in the GLB/Three.js vehicle model.

## Good next steps

1. Add a Node/Express backend and real DVSA adapter.
2. Replace the primitive car with a GLB model containing named components.
3. Add technician service inspection entry.
4. Add photos against each issue.
5. Add customer approval and estimated repair cost.
6. Add historic inspections so each component has a trend over time.
