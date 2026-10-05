import { COMPONENT_FORECASTS, calculateForecast } from './data/forecast.js';

const reportTitle=document.getElementById('reportTitle');
const historyCard=document.querySelector('#route-report .history-card');
const findings=document.getElementById('customerFindings');
const findingsPanel=document.querySelector('#route-report .findings-panel');

function formatMiles(value){
  return new Intl.NumberFormat('en-GB',{maximumFractionDigits:0}).format(Math.abs(Math.round(value)));
}

function maintenanceDueText(forecast,{short=false}={}){
  if(forecast.milesRemaining<=0) return short ? 'Likely due now' : 'Likely due now';
  return short
    ? `Likely due ~${formatMiles(forecast.milesRemaining)} mi`
    : `Likely due in about ${formatMiles(forecast.milesRemaining)} miles`;
}

function ensureForecastStrip(){
  if(!historyCard) return null;
  let strip=historyCard.querySelector('.forecast-strip');
  if(strip) return strip;

  strip=document.createElement('div');
  strip.className='forecast-strip hidden';
  strip.innerHTML=`
    <div class="forecast-strip-head">
      <span>MAINTENANCE OUTLOOK</span>
      <b id="forecastConfidence"></b>
    </div>
    <strong id="forecastHeadline"></strong>
    <small id="forecastDetail"></small>
    <small id="forecastSource" class="forecast-source"></small>
    <em>Based on previous wear patterns. The current inspection result takes priority.</em>
  `;
  historyCard.append(strip);
  return strip;
}

function ensureUpcomingMaintenance(){
  if(!findingsPanel) return null;
  let outlook=findingsPanel.querySelector('.maintenance-outlook');
  if(outlook) return outlook;

  outlook=document.createElement('section');
  outlook.className='maintenance-outlook';
  outlook.innerHTML=`
    <div class="maintenance-outlook-head">
      <span>UPCOMING MAINTENANCE</span>
      <small>Based on vehicle and similar-model history</small>
    </div>
    <div class="maintenance-outlook-list"></div>
  `;

  findingsPanel.querySelector('.findings-head')?.after(outlook);
  return outlook;
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

  const headline=forecast.milesRemaining>0
    ? `${forecast.component} likely due around ${formatMiles(forecast.nextDueMileage)} miles`
    : `${forecast.component} has reached its typical replacement interval`;

  const detail=forecast.milesRemaining>0
    ? `${maintenanceDueText(forecast)} · typical replacement interval ${formatMiles(forecast.averageIntervalMiles)} miles`
    : `Around ${formatMiles(forecast.milesRemaining)} miles beyond the typical interval · use the current inspection result to decide action`;

  document.getElementById('forecastHeadline').textContent=headline;
  document.getElementById('forecastDetail').textContent=detail;
  document.getElementById('forecastSource').textContent=`Based on: ${forecast.source}`;
  document.getElementById('forecastConfidence').textContent=`${forecast.confidence} confidence`;
}

function renderUpcomingMaintenance(){
  const outlook=ensureUpcomingMaintenance();
  if(!outlook) return;

  const list=outlook.querySelector('.maintenance-outlook-list');
  if(!list) return;

  const upcoming=Object.values(COMPONENT_FORECASTS)
    .map(profile=>calculateForecast(profile.findingId))
    .filter(Boolean)
    .sort((a,b)=>a.milesRemaining-b.milesRemaining)
    .slice(0,4);

  list.innerHTML=upcoming.map(item=>`
    <button type="button" class="maintenance-outlook-item" data-maintenance-finding="${item.findingId}">
      <span>
        <strong>${item.component}</strong>
        <small>${maintenanceDueText(item)}</small>
      </span>
      <b>${item.confidence}</b>
    </button>
  `).join('');

  list.querySelectorAll('[data-maintenance-finding]').forEach(button=>{
    button.addEventListener('click',()=>{
      findings?.querySelector(`[data-finding="${button.dataset.maintenanceFinding}"]`)?.click();
    });
  });
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

    const nextText=maintenanceDueText(forecast,{short:true});
    if(badge.textContent!==nextText) badge.textContent=nextText;
    badge.classList.toggle('due-now',forecast.milesRemaining<=0);
  }
}

if(reportTitle){
  new MutationObserver(renderForecast).observe(reportTitle,{childList:true,subtree:true,characterData:true});
}

if(findings){
  new MutationObserver(()=>{
    decorateFindingCards();
    renderUpcomingMaintenance();
    renderForecast();
  }).observe(findings,{childList:true});
}

requestAnimationFrame(()=>{
  decorateFindingCards();
  renderUpcomingMaintenance();
  renderForecast();
});
