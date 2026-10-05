// DriveWell predictive maintenance demo data.
// In production these observed change mileages should come from DMS/service history.

export const VEHICLE_FORECAST_CONTEXT = {
  vehicleKey: '2021-example-suv',
  registration: 'AB12 CDE',
  currentMileage: 41280
};

export const COMPONENT_FORECASTS = {
  'brake-rr': {
    findingId: 'brake-rr',
    title: 'Rear right brake pads',
    component: 'Rear brake pads',
    source: 'This vehicle service history',
    observedChangeMileages: [15000, 25000, 35000],
    confidence: 'High'
  }
};

function average(values){
  if(!values.length) return null;
  return values.reduce((sum,value)=>sum+value,0)/values.length;
}

export function calculateForecast(findingId,currentMileage=VEHICLE_FORECAST_CONTEXT.currentMileage){
  const profile=COMPONENT_FORECASTS[findingId];
  if(!profile || profile.observedChangeMileages.length<2) return null;

  const changes=profile.observedChangeMileages;
  const intervals=changes.slice(1).map((mileage,index)=>mileage-changes[index]);
  const averageIntervalMiles=Math.round(average(intervals));
  const lastChangedMileage=changes.at(-1);
  const nextDueMileage=lastChangedMileage+averageIntervalMiles;
  const milesRemaining=nextDueMileage-currentMileage;

  return {
    ...profile,
    averageIntervalMiles,
    lastChangedMileage,
    nextDueMileage,
    milesRemaining,
    sampleIntervals: intervals.length
  };
}
