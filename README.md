# DriveWell Vehicle Health Platform — v3

This is a **clean rebuild** of the DriveWell working demo.

Nothing from v1/v2 is required by the v3 source other than the existing licensed SUV GLB asset.

## v3 goals

- Premium DriveWell branding
- Product-style navigation rather than a generic admin sidebar
- Cleaner customer report layout
- Neutral graphite vehicle presentation
- Smaller, anchored, numbered issue markers
- No floating ring markers
- Rebuilt exploded component scenes
- Improved tyre, brake, battery, headlamp, wiper, filter and exhaust component views
- Customer approve / ask / defer flow
- Dealer communications flow
- Simple technician structured-data capture
- No forced scrolling

## Clean deployment rule

Use `deploy-clean.ps1`.

The deployment script clones the repository and then removes **everything except `.git`** before copying the new build into place.

This means each release is a clean repository snapshot rather than another layer of edits on top of the previous release.

## Run locally

```powershell
python -m http.server 8000
```

Then browse to:

```text
http://localhost:8000
```

## Asset attribution

The demo uses “Lowpoly Generic SUV” by mk2design under CC BY 4.0.
