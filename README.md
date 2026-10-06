# DriveWell v26 — Technician Assist

DriveWell is a browser-based dealership vehicle-health and workshop workflow prototype.

The current demo connects:

- manager workshop dashboard
- technician vehicle-health inspection capture
- 3D customer vehicle-health report
- customer approvals and questions
- Technician Assist: guided diagnosis, manufacturer-procedure checkpoints, parts, evidence, QC and repair-note generation

## Technician Assist

The Technician Assist workspace is designed around a qualified technician, not AI replacing a technician.

It connects a repair finding to:

1. the inspection measurement and technician notes
2. customer authorisation
3. curated diagnostic prompts
4. manufacturer-approved workshop information
5. parts requests
6. photo / video evidence
7. technician-confirmed quality control
8. a structured draft repair summary

The prototype deliberately does **not** invent live torque values, repair specifications or manufacturer procedures. A production deployment should integrate approved OEM workshop data, the dealership DMS, parts systems and identity / audit services.

## Demo vehicle

The repository currently uses the Lowpoly Generic SUV GLB and the existing DriveWell component-view system.

## Run locally

The application is static and can be served with any local HTTP server. It is also structured for GitHub Pages deployment.

## Current architecture

See [ARCHITECTURE.md](./ARCHITECTURE.md) for the migration and component structure.
