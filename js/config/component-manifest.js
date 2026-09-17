export const COMPONENTS = {
  'tyre-fl': {
    id: 'tyre-fl',
    category: 'Tyres',
    vehicleNode: 'Wheel_FL',
    anchor: { type: 'node-centre', node: 'Wheel_FL' },
    camera: { mode: 'component', preset: 'front-left-tyre' },
    serviceView: { type: 'vehicle-node', node: 'Wheel_FL' }
  },
  'brake-rr': {
    id: 'brake-rr',
    category: 'Brakes',
    vehicleNode: 'Wheel_RR',
    anchor: { type: 'node-centre', node: 'Wheel_RR' },
    camera: { mode: 'component', preset: 'rear-right-brake' },
    serviceView: { type: 'assembly', key: 'brake' }
  },
  battery: {
    id: 'battery',
    category: 'Battery',
    anchor: { type: 'component-only' },
    camera: { mode: 'component', preset: 'battery' },
    serviceView: { type: 'assembly', key: 'battery' }
  },
  'lamp-fr': {
    id: 'lamp-fr',
    category: 'Lighting',
    anchor: { type: 'vehicle-bounds', region: 'front-right-headlamp' },
    camera: { mode: 'component', preset: 'front-right-headlamp' },
    serviceView: { type: 'assembly', key: 'headlamp' }
  },
  'wiper-front': {
    id: 'wiper-front',
    category: 'Wipers',
    anchor: { type: 'vehicle-bounds', region: 'windscreen' },
    camera: { mode: 'component', preset: 'front-wipers' },
    serviceView: { type: 'procedural', key: 'wiper' }
  },
  'air-filter': {
    id: 'air-filter',
    category: 'Service',
    anchor: { type: 'component-only' },
    camera: { mode: 'component', preset: 'air-filter' },
    serviceView: { type: 'assembly', key: 'airFilter' }
  },
  'cabin-filter': {
    id: 'cabin-filter',
    category: 'Service',
    anchor: { type: 'component-only' },
    camera: { mode: 'component', preset: 'cabin-filter' },
    serviceView: { type: 'procedural', key: 'cabinFilter' }
  },
  exhaust: {
    id: 'exhaust',
    category: 'Exhaust',
    anchor: { type: 'component-only' },
    camera: { mode: 'component', preset: 'exhaust' },
    serviceView: { type: 'assembly', key: 'exhaust' }
  }
};

export function getComponentDefinition(id) {
  return COMPONENTS[id] || null;
}

export function getComponentDefinitions() {
  return Object.values(COMPONENTS);
}
