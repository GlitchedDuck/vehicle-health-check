// Curated dealership-workflow demo data for the DriveWell Technician Assistant.
// Live deployments must replace these demo playbooks with vehicle-specific,
// manufacturer-approved workshop information and dealer/DMS integrations.

export const TECHNICIAN_LEVELS = {
  apprentice: {
    label: 'Apprentice',
    description: 'More context, prompts and verification checkpoints.'
  },
  technician: {
    label: 'Technician',
    description: 'Concise guided workflow with the important checks surfaced.'
  },
  master: {
    label: 'Master technician',
    description: 'Minimal prompts with fast access to evidence, data and sign-off.'
  }
};

const commonQc = [
  'Confirm the repair matches the authorised work.',
  'Record final measurements or diagnostic result.',
  'Check for warning messages, leaks, loose items or obvious secondary concerns.',
  'Complete the applicable road-test or functional check.',
  'Attach required evidence and technician sign-off.'
];

export const REPAIR_GUIDES = {
  'tyre-fl': {
    symptom: 'Low tread / uneven wear',
    source: 'OEM workshop information + approved tyre data',
    diagnosticChecks: [
      'Confirm tread depth across the principal grooves and record the lowest result.',
      'Check tyre pressure, visible damage and the wear pattern.',
      'Consider alignment, steering or suspension factors if the wear is uneven.'
    ],
    procedure: [
      'Confirm the exact tyre specification and customer authorisation.',
      'Open the approved fitting procedure for the vehicle, wheel and TPMS configuration.',
      'Carry out the tyre replacement using approved workshop equipment.',
      'Record final pressure and complete any required TPMS verification or reset.'
    ],
    parts: ['Approved tyre to exact vehicle specification', 'Valve / TPMS service item if required'],
    qc: commonQc
  },
  'brake-rr': {
    symptom: 'Brake pad wear',
    source: 'OEM braking-system workshop procedure',
    diagnosticChecks: [
      'Confirm pad thickness and inspect the matching axle components.',
      'Check disc condition and look for uneven wear, heat damage or contamination.',
      'Record any related warning messages or diagnostic information.'
    ],
    procedure: [
      'Confirm customer authorisation and the exact parts required.',
      'Open the OEM procedure and vehicle-specific tightening data before dismantling.',
      'Carry out the approved brake repair and replace single-use items where specified.',
      'Complete the manufacturer-required bedding, pedal and system checks.'
    ],
    parts: ['Approved brake pad set', 'Related fitting hardware / wear sensor if specified'],
    qc: commonQc
  },
  battery: {
    symptom: 'Reduced 12V battery state of health',
    source: 'OEM electrical diagnosis + approved battery tester workflow',
    diagnosticChecks: [
      'Confirm battery tester result and capture the tester evidence.',
      'Check charging-system result and relevant stored faults.',
      'Confirm the vehicle has no obvious key-off load or usage pattern requiring further diagnosis.'
    ],
    procedure: [
      'Confirm the correct battery technology and specification for the vehicle.',
      'Open the OEM battery replacement / support procedure before disconnecting power.',
      'Carry out the approved replacement or support action.',
      'Complete battery registration, adaptation or relearn steps where the manufacturer requires them.'
    ],
    parts: ['Approved 12V battery to vehicle specification'],
    qc: commonQc
  },
  'lamp-fr': {
    symptom: 'Reduced headlamp output',
    source: 'OEM lighting-system diagnosis',
    diagnosticChecks: [
      'Confirm the reported output difference and inspect the lamp unit for damage or contamination.',
      'Check relevant faults, connectors and power supply where applicable.',
      'Confirm whether the issue is serviceable or requires lamp-unit replacement.'
    ],
    procedure: [
      'Confirm customer authorisation and the approved repair route.',
      'Open the OEM removal / installation and calibration procedure.',
      'Carry out the approved repair without substituting generic settings.',
      'Complete any required aim, calibration or functional test.'
    ],
    parts: ['Lighting component identified by OEM parts lookup'],
    qc: commonQc
  },
  'wiper-front': {
    symptom: 'Poor windscreen clearing',
    source: 'OEM wiper-system service information',
    diagnosticChecks: [
      'Confirm the streaking or missed area during a wet-screen test.',
      'Inspect blade rubber, arm condition and windscreen contamination.',
      'Check washer operation if the customer concern includes poor cleaning.'
    ],
    procedure: [
      'Confirm the correct blade specification.',
      'Follow the approved service-position / replacement method for the vehicle.',
      'Replace the affected blade or blades.',
      'Complete a wet-screen functional check.'
    ],
    parts: ['Approved front wiper blade set'],
    qc: commonQc
  },
  'air-filter': {
    symptom: 'Restricted / contaminated engine air filter',
    source: 'OEM scheduled-maintenance information',
    diagnosticChecks: [
      'Confirm filter condition and contamination.',
      'Inspect the housing and intake path for debris or damage.',
      'Check the service interval and any related customer concern.'
    ],
    procedure: [
      'Confirm the correct filter element by vehicle specification.',
      'Open the OEM service procedure for housing access and sealing checks.',
      'Replace the filter and remove loose debris from the service area.',
      'Confirm the housing is correctly closed and sealed.'
    ],
    parts: ['Approved engine air-filter element'],
    qc: commonQc
  },
  'cabin-filter': {
    symptom: 'Dirty cabin / pollen filter',
    source: 'OEM scheduled-maintenance information',
    diagnosticChecks: [
      'Confirm filter contamination and airflow concern.',
      'Check the filter housing for debris or water ingress.',
      'Confirm any customer allergy / odour concern is captured separately.'
    ],
    procedure: [
      'Confirm the correct filter specification and airflow orientation.',
      'Open the OEM access procedure.',
      'Replace the filter and clean loose debris from the housing area.',
      'Confirm HVAC airflow operation.'
    ],
    parts: ['Approved cabin / pollen filter'],
    qc: commonQc
  },
  exhaust: {
    symptom: 'Rear exhaust corrosion',
    source: 'OEM exhaust-system inspection criteria',
    diagnosticChecks: [
      'Confirm the location and extent of corrosion.',
      'Check for leakage, insecure mounting or abnormal noise.',
      'Record whether the condition is monitor-only or requires further action.'
    ],
    procedure: [
      'Confirm customer authorisation if repair is required.',
      'Open the OEM exhaust removal / installation procedure for the affected section.',
      'Carry out the approved repair using the specified replacement parts and hardware.',
      'Complete a leak, mounting and noise check.'
    ],
    parts: ['OEM exhaust section / hardware if replacement is authorised'],
    qc: commonQc
  }
};

export function getRepairGuide(id) {
  return REPAIR_GUIDES[id] || null;
}
