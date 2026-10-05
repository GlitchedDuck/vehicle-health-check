import { COMPONENT_FORECASTS, calculateForecast } from './data/forecast.js';

const reportTitle=document.getElementById('reportTitle');
const historyCard=document.querySelector('#route-report .history-card');
const findings=document.getElementById('customerFindings');

function formatMiles(value){
  return new Intl.NumberFormat('en-GB',{maximumFractionDigits:0}).format(Math.abs(Math.round(value)));
}

function ensureForecastStrip(){
  if(!historyCard) return null;
  let strip=historyCard.querySelector('.forecast-strip');
  if(strip) return strip;

  strip=document.createElement('div');
  strip.className='forecast-strip hidden';
  strip.innerHTML=`
    <div class="forecast-strip-head">
      <span>PREDICTED MAINTENANCE</span>
      <b id="forecastConfidence"></b>
    </div>
    <strong id="forecastHeadline"></strong>
    <small id="forecastDetail"></small>
    <small id="forecastSource" class="forecast-source"></small>
    <em>Forecast only — the current inspection result always takes priority.</em>
  `;
  historyCard.append(strip);
  return strip;
}

function selectedForecast(){
  const title=reportTitle?.textContent?.trim();
  const entry=Object.values(COMPONENT_FORECASTS).find(profile=>profile.title===title);
  return entry ? calculateForecast(entry.findingId) : null;
}

function renderForecast(){
  const strip=ensureForecastStrip();
  if(!strip) return;

  const forecast=selectedForecast();
  if(!forecast){
    strip.classList.add('hidden');
    return;
  }

  strip.classList.remove('hidden');
  const remaining=forecast.milesRemaining;
  const headline=remaining>0
    ? `Likely due around ${formatMiles(forecast.nextDueMileage)} miles`
    : `Forecast interval reached around ${formatMiles(forecast.nextDueMileage)} miles`;

  const detail=remaining>0
    ? `~${formatMiles(remaining)} miles remaining · typical interval ${formatMiles(forecast.averageIntervalMiles)} miles`
    : `~${formatMiles(remaining)} miles beyond the forecast interval · review the current inspection result`;

  document.getElementById('forecastHeadline').textContent=headline;
  document.getElementById('forecastDetail').textContent=detail;
  document.getElementById('forecastSource').textContent=`Basis: ${forecast.source}`;
  document.getElementById('forecastConfidence').textContent=`${forecast.confidence} confidence`;
}

function decorateFindingCards(){
  if(!findings) return;

  for(const profile of Object.values(COMPONENT_FORECASTS)){
    const card=findings.querySelector(`[data-finding="${profile.findingId}"]`);
    if(!card) continue;

    const forecast=calculateForecast(profile.findingId);
    if(!forecast) continue;

    let badge=card.querySelector('.forecast-badge');
    if(!badge){
      badge=document.createElement('span');
      badge.className='forecast-badge';
      card.append(badge);
    }

    badge.textContent=forecast.milesRemaining>0
      ? `Forecast ${formatMiles(forecast.milesRemaining)} mi`
      : 'Forecast due';
  }
}

if(reportTitle){
  new MutationObserver(renderForecast).observe(reportTitle,{childList:true,subtree:true,characterData:true});
}

if(findings){
  new MutationObserver(()=>{
    decorateFindingCards();
    renderForecast();
  }).observe(findings,{childList:true,subtree:true});
}

requestAnimationFrame(()=>{
  decorateFindingCards();
  renderForecast();
});
