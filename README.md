# Vehicle Health Check POC

A customer-facing digital vehicle health check proof of concept.

The aim is to translate workshop inspection findings into clear, plain-English explanations that help a customer understand what has been found, why it matters, how urgent it is, and what the workshop recommends.

## Current POC

- Mobile-first customer report
- Vehicle health score
- Red / amber / green severity system
- Interactive Three.js vehicle
- Clickable affected components
- Plain-English explanations for each finding
- Expandable technical details for workshop terminology
- Technician evidence placeholders
- Estimated repair pricing
- Approve / Decline / Ask-about-this interactions
- Approved-work running total

## Demo data

The current report uses sample vehicle and inspection data only. It does not call DVSA, a DMS, or a workshop system yet.

The sample findings include:

- Front-left tyre below the sample legal tread threshold
- Rear-right brake pads wearing low
- Reduced front-right headlamp output
- Declining 12V battery health

## Product direction

The intended production workflow is:

1. Technician completes a vehicle inspection.
2. Findings, measurements, images and video are captured by the workshop system.
3. Technical findings are normalised into a component taxonomy.
4. Each issue is mapped to the relevant area of a vehicle model.
5. Customer receives a mobile report link by SMS or email.
6. Customer sees a plain-English explanation, evidence, urgency and price.
7. Customer can approve work, decline it for now, or ask the service adviser a question.
8. The workshop receives the customer's decisions immediately.

## Architecture direction

A production build could integrate with:

- DVSA MOT history data
- Dealer Management Systems
- Workshop inspection platforms
- Technician photo/video capture
- Parts and labour pricing
- SMS/email delivery
- Customer authorisation and audit history

The current GitHub Pages POC is deliberately front-end only and self-contained in `index.html`.

## Run locally

The page imports Three.js from jsDelivr, so an internet connection is required.

You can serve the project with:

```bash
python -m http.server 8080
```

or:

```bash
npx serve .
```

Then open the local URL shown by the server.

## Status

Proof of concept only. Vehicle details, measurements, prices and inspection findings are sample data and must not be treated as real vehicle advice.
