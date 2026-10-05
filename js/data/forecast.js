// DriveWell predictive maintenance demo data.
// Production values should be derived from DMS/service history and, where needed,
// similar-vehicle/model cohorts. The current inspection always takes priority.

export const VEHICLE_FORECAST_CONTEXT = {
  vehicleKey: '2021-example-suv',
  registration: 'AB12 CDE',
  currentMileage: 41280
};

export const COMPONENT_FORECASTS = {
  'tyre-fl': {
    findingId: 'tyre-fl',
    title: 'Front left tyre',
    component: 'Front tyres',
    source: 'This vehicle service history',
    observedChangeMileages: [10000, 20000, 30000],
    confidence: 'High'
  },
  'brake-rr': {
    findingId: 'brake-rr',
    title: 'Rear right brake pads',
    component: 'Rear brake pads',
    source: 'This vehicle service history',
    observedChangeMileages: [15000, 25000, 35000],
    confidence: 'High'
  },
  'battery': {
    findingId: 'battery',
    title: '12V battery',
    component: '12V battery',
    source: 'Similar vehicle/model pattern',
    lastChangedMileage: 18000,
    expectedIntervalMiles: 32000,
    confidence: 'Medium'
  },
  'wiper-front': {
    findingId: 'wiper-front',
    title: 'Front wiper blades',
    component: 'Front wiper blades',
    source: 'Similar vehicle/model pattern',
    lastChangedMileage: 32000,
    expectedIntervalMiles: 12000,
    confidence: 'Medium'
  },
  'air-filter': {
    findingId: 'air-filter',
    title: 'Engine air filter',
    component: 'Engine air filter',
    source: 'Similar vehicle/model pattern',
    lastChangedMileage: 26000,
    expectedIntervalMiles: 18000,
    confidence: 'Medium'
  },
  'cabin-filter': {
    findingId: 'cabin-filter',
    title: 'Cabin pollen filter',
    component: 'Cabin pollen filter',
    source: 'Similar vehicle/model pattern',
    lastChangedMileage: 30000,
    expectedIntervalMiles: 15000,
    confidence: 'Medium'
  }
};

function average(values){
  if(!values.length) return null;
  return values.reduce((sum,value)=>sum+value,0)/values.length;
}

function forecastFromVehicleHistory(profile){
  const changes=profile.observedChangeMileages;
  if(!Array.isArray(changes) || changes.length<2) return null;

  const intervals=changes.slice(1).map((mileage,index)=>mileage-changes[index]);
  const averageIntervalMiles=Math.round(average(intervals));
  const lastChangedMileage=changes.at(-1);

  return {
    averageIntervalMiles,
    lastChangedMileage,
    nextDueMileage:lastChangedMileage+averageIntervalMiles,
    sampleIntervals:intervals.length,
    method:'vehicle-history'
  };
}

function forecastFromPattern(profile){
  if(!Number.isFinite(profile.lastChangedMileage) || !Number.isFinite(profile.expectedIntervalMiles)) return null;

  return {
    averageIntervalMiles:Math.round(profile.expectedIntervalMiles),
    lastChangedMileage:Math.round(profile.lastChangedMileage),
    nextDueMileage:Math.round(profile.lastChangedMileage+profile.expectedIntervalMiles),
    sampleIntervals:null,
    method:'model-pattern'
  };
}

export function calculateForecast(findingId,currentMileage=VEHICLE_FORECAST_CONTEXT.currentMileage){
  const profile=COMPONENT_FORECASTS[findingId];
  if(!profile) return null;

  const base=forecastFromVehicleHistory(profile) || forecastFromPattern(profile);
  if(!base) return null;

  return {
    ...profile,
    ...base,
    milesRemaining:base.nextDueMileage-currentMileage
  };
}
