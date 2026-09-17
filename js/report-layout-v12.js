const report = document.getElementById('route-report');
const reportGrid = report?.querySelector('.report-grid');
const viewerPanel = reportGrid?.querySelector('.viewer-panel');
const detailPanel = reportGrid?.querySelector('.detail-panel');
const findingsPanel = report?.querySelector('.findings-panel');
const reportIntro = report?.querySelector('.report-intro');

function buildHealthSummary(){
  const health = document.createElement('aside');
  health.className = 'panel report-health-summary';
  health.innerHTML = `
    <div class="report-health-heading">
      <div class="report-health-icon" aria-hidden="true">⌁</div>
      <div>
        <span>VEHICLE CONDITION</span>
        <h2>Vehicle health</h2>
        <p>A snapshot of your vehicle's overall condition</p>
      </div>
    </div>
    <div class="report-health-main">
      <div class="report-health-gauge" aria-label="Vehicle health score 68 out of 100">
        <div class="report-health-gauge-inner"><strong>68</strong><span>Vehicle health</span></div>
      </div>
      <div class="report-health-copy">
        <strong>Fair condition</strong>
        <p>Your vehicle is running well but has a few areas that may need attention soon.</p>
        <div class="report-health-legend">
          <div><span><i class="health-dot healthy"></i>Healthy</span><b id="reportHealthyCount">16</b></div>
          <div><span><i class="health-dot advisory"></i>Advisory</span><b id="reportAdvisoryCount">7</b></div>
          <div><span><i class="health-dot urgent"></i>Urgent</span><b id="reportUrgentCount">1</b></div>
        </div>
      </div>
    </div>
    <button class="report-health-action" type="button">
      <span class="report-health-action-icon">⌕</span>
      <span><strong><b id="reportAttentionTotal">8</b> items need attention</strong><small>Review the findings below for recommended work.</small></span>
      <b aria-hidden="true">›</b>
    </button>
  `;
  health.querySelector('.report-health-action')?.addEventListener('click', () => {
    findingsPanel?.scrollIntoView({ behavior:'smooth', block:'start' });
  });
  return health;
}

function addViewerHeading(){
  if(!viewerPanel || viewerPanel.querySelector('.report-viewer-heading')) return;
  const heading = document.createElement('div');
  heading.className = 'report-viewer-heading';
  heading.innerHTML = `
    <div class="report-viewer-heading-icon" aria-hidden="true">◇</div>
    <div><strong>Interactive vehicle view</strong><span>Explore highlighted systems and components</span></div>
  `;
  viewerPanel.prepend(heading);
}

function buildReportLayout(){
  if(!report || !reportGrid || !viewerPanel || !detailPanel || !findingsPanel || report.querySelector('.report-hero-grid')) return;

  addViewerHeading();
  reportIntro?.setAttribute('aria-hidden','true');

  const hero = document.createElement('div');
  hero.className = 'report-hero-grid';
  hero.append(viewerPanel, buildHealthSummary());

  const lower = document.createElement('div');
  lower.className = 'report-lower-grid';
  lower.append(detailPanel, findingsPanel);

  reportGrid.replaceWith(hero);
  report.append(lower);
}

function addVehicleSummary(){
  const heading = document.querySelector('.page-heading');
  if(!heading || heading.querySelector('.page-vehicle-summary')) return;
  const summary = document.createElement('span');
  summary.className = 'page-vehicle-summary';
  summary.textContent = '2021 Example SUV · AB12 CDE · 41,280 miles';
  heading.append(summary);
}

function updateHealthCounts(){
  const urgent = Number(document.getElementById('urgentCount')?.textContent || 1);
  const advisory = Number(document.getElementById('attentionCount')?.textContent || 7);
  const totalChecks = 24;
  const healthy = Math.max(0,totalChecks-urgent-advisory);
  const map = {
    reportUrgentCount: urgent,
    reportAdvisoryCount: advisory,
    reportHealthyCount: healthy,
    reportAttentionTotal: urgent + advisory
  };
  Object.entries(map).forEach(([id,value]) => {
    const el = document.getElementById(id);
    if(el) el.textContent = String(value);
  });
}

function syncReportMode(){
  const active = document.getElementById('route-report')?.classList.contains('active');
  document.body.classList.toggle('report-active', !!active);
  if(active) updateHealthCounts();
}

function setShellModeForRoute(route){
  // Apply the shell state in the same click turn as navigation. This prevents a
  // one-frame sidebar/header/font jump while the legacy router swaps routes.
  document.body.classList.toggle('report-active', route === 'report');
}

buildReportLayout();
addVehicleSummary();

const pageTitle = document.getElementById('pageTitle');
if(pageTitle){
  new MutationObserver(syncReportMode).observe(pageTitle,{childList:true,subtree:true,characterData:true});
}

document.querySelectorAll('[data-route]').forEach(button => button.addEventListener('click', () => {
  setShellModeForRoute(button.dataset.route);
  if(button.dataset.route === 'report') requestAnimationFrame(updateHealthCounts);
}));

syncReportMode();
