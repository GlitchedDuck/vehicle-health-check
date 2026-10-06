import { getRepairGuide, TECHNICIAN_LEVELS } from './js/data/repair-guides.js';

const $=id=>document.getElementById(id);
const money=v=>v===0?'No charge':new Intl.NumberFormat('en-GB',{style:'currency',currency:'GBP',maximumFractionDigits:0}).format(v);

const MODULE_LABELS={tyre:'Tyre / wheel exploded view',brake:'Brake pad + disc exploded view',battery:'12V battery exploded view',lamp:'Headlamp exploded view',wiper:'Wiper blade exploded view',airFilter:'Engine air filter exploded view',cabinFilter:'Cabin / pollen filter exploded view',exhaust:'Exhaust system exploded view'};
const FINDINGS=[
{id:'tyre-fl',icon:'◉',category:'Tyres',module:'tyre',title:'Front left tyre',location:'Nearside front',measurementLabel:'Tread depth',value:1.3,unit:'mm',min:0,max:8,red:1.6,amber:3,direction:'lowBad',condition:'Uneven wear',recommendation:'Replace',price:145,note:'NSF tyre measured at 1.3 mm across principal grooves.',found:'The front left tyre has worn below the legal tread limit.',why:'Tyre tread helps the vehicle grip the road and clear standing water. Low tread can reduce wet-weather grip and increase stopping distance.',history:[5.6,4.2,2.8,1.3],historyDates:['Mar 25','Sep 25','Mar 26','Today']},
{id:'brake-rr',icon:'◎',category:'Brakes',module:'brake',title:'Rear right brake pads',location:'Offside rear',measurementLabel:'Pad thickness',value:3.0,unit:'mm',min:0,max:10,red:2,amber:4,direction:'lowBad',condition:'Worn',recommendation:'Replace soon',price:210,note:'OSR brake pad approximately 3 mm remaining.',found:'The rear right brake pads are getting low.',why:'Brake pads are designed to wear as they slow the vehicle. If they become too thin they can affect braking and damage the brake disc.',history:[7.5,6.1,4.4,3.0],historyDates:['Mar 25','Sep 25','Mar 26','Today']},
{id:'battery',icon:'⚡',category:'Battery',module:'battery',title:'12V battery',location:'Engine bay',measurementLabel:'State of health',value:71,unit:'%',min:0,max:100,red:50,amber:75,direction:'lowBad',condition:'Reduced performance',recommendation:'Monitor',price:189,note:'Battery tester reports 71% state of health. Charging system normal.',found:'The battery is still usable but its health is starting to decline.',why:'The 12V battery powers vehicle electronics and provides the energy needed to start the vehicle. A weakening battery can eventually lead to slow or failed starting.',history:[94,87,79,71],historyDates:['Mar 25','Sep 25','Mar 26','Today']},
{id:'lamp-fr',icon:'✦',category:'Lighting',module:'lamp',title:'Front right headlamp',location:'Offside front',measurementLabel:'Relative light output',value:72,unit:'%',min:0,max:100,red:50,amber:80,direction:'lowBad',condition:'Reduced performance',recommendation:'Repair',price:65,note:'OSF headlamp output visually reduced compared with NSF.',found:'The front right headlamp is producing less light than expected.',why:'Headlamps help you see the road and help other road users see you. Reduced output can affect night-time visibility and may become an MOT issue.',history:[100,94,83,72],historyDates:['Mar 25','Sep 25','Mar 26','Today']},
{id:'wiper-front',icon:'⌁',category:'Wipers',module:'wiper',title:'Front wiper blades',location:'Windscreen',measurementLabel:'Blade condition',value:45,unit:'%',min:0,max:100,red:30,amber:60,direction:'lowBad',condition:'Worn',recommendation:'Replace soon',price:42,note:'Front blades leave visible streaks during wet test.',found:'The front wiper blades are leaving streaks on the windscreen.',why:'Wiper blades need to clear water cleanly so you can see properly in rain. Worn rubber can smear the screen instead.',history:[100,82,65,45],historyDates:['Mar 25','Sep 25','Mar 26','Today']},
{id:'air-filter',icon:'▤',category:'Service',module:'airFilter',title:'Engine air filter',location:'Engine bay',measurementLabel:'Filter condition',value:52,unit:'%',min:0,max:100,red:25,amber:60,direction:'lowBad',condition:'Worn',recommendation:'Replace soon',price:58,note:'Filter element visibly contaminated with dust and debris.',found:'The engine air filter is becoming dirty and restricted.',why:'The air filter helps keep dirt out of the engine. A heavily contaminated filter can restrict airflow and reduce efficiency.',history:[100,88,70,52],historyDates:['Mar 25','Sep 25','Mar 26','Today']},
{id:'cabin-filter',icon:'▥',category:'Service',module:'cabinFilter',title:'Cabin pollen filter',location:'Passenger compartment',measurementLabel:'Filter condition',value:40,unit:'%',min:0,max:100,red:25,amber:60,direction:'lowBad',condition:'Worn',recommendation:'Replace soon',price:49,note:'Pollen filter visibly dark with debris trapped in pleats.',found:'The cabin pollen filter is dirty.',why:'This filter cleans the air entering the cabin. When it becomes blocked it can reduce airflow and allow more dust and pollen through.',history:[100,85,61,40],historyDates:['Mar 25','Sep 25','Mar 26','Today']},
{id:'exhaust',icon:'≈',category:'Exhaust',module:'exhaust',title:'Rear exhaust section',location:'Underbody',measurementLabel:'Condition score',value:58,unit:'%',min:0,max:100,red:30,amber:65,direction:'lowBad',condition:'Corroded',recommendation:'Monitor',price:260,note:'Surface corrosion visible on rear silencer and joint. No major leak detected.',found:'The rear exhaust section is showing corrosion.',why:'The exhaust carries gases safely away from the vehicle. Corrosion can eventually lead to leaks, increased noise or an MOT failure.',history:[100,88,72,58],historyDates:['Mar 25','Sep 25','Mar 26','Today']}
];

const VISIBLE_IDS=new Set(['tyre-fl','brake-rr','lamp-fr','wiper-front']);
const state=(()=>{try{return JSON.parse(localStorage.getItem('drivewellV5State'))||{findings:structuredClone(FINDINGS),decisions:{},messages:[]}}catch{return{findings:structuredClone(FINDINGS),decisions:{},messages:[]}}})();
if(!state.messages.length)state.messages=[
{id:'m1',person:'Sarah Mitchell',initials:'SM',vehicle:'2024 Example SUV',time:'2 min ago',finding:'Front tyres',text:'Can you confirm if this tyre replacement includes alignment?'},
{id:'m2',person:'James Carter',initials:'JC',vehicle:'2022 Family SUV',time:'18 min ago',finding:'Front brake pads',text:'Approved front brake pads and wiper blades.'},
{id:'m3',person:'Priya Desai',initials:'PD',vehicle:'2023 Saloon',time:'1 hour ago',finding:'12V battery',text:'Is the battery covered by a warranty?'}];

let evidenceUrls={},selectedFindingId=state.findings[0].id,selectedTechId=state.findings[0].id,selectedConversation=0;
const persist=()=>localStorage.setItem('drivewellV5State',JSON.stringify(state));
const findingById=id=>state.findings.find(f=>f.id===id);
const ASSISTANT_STATE_KEY='drivewellTechAssistantV1';
const assistantState=(()=>{
  const fallback={
    selectedId:state.findings[0].id,
    level:'technician',
    completed:{},
    diagnostics:{},
    parts:{},
    qcSigned:{},
    summaries:{},
    evidence:{}
  };
  try{
    const saved=JSON.parse(localStorage.getItem(ASSISTANT_STATE_KEY));
    if(!saved)return fallback;
    return{
      ...fallback,
      ...saved,
      completed:saved.completed||{},
      diagnostics:saved.diagnostics||{},
      parts:saved.parts||{},
      qcSigned:saved.qcSigned||{},
      summaries:saved.summaries||{},
      evidence:saved.evidence||{}
    };
  }catch{return fallback}
})();
let selectedAssistantId=state.findings.some(f=>f.id===assistantState.selectedId)?assistantState.selectedId:state.findings[0].id;
const persistAssistant=()=>{
  assistantState.selectedId=selectedAssistantId;
  localStorage.setItem(ASSISTANT_STATE_KEY,JSON.stringify(assistantState));
};

function severityFor(f){if(f.direction==='lowBad'){if(f.value<=f.red)return'red';if(f.value<=f.amber)return'amber';return'green'}if(f.value>=f.red)return'red';if(f.value>=f.amber)return'amber';return'green'}
const severityLabel=s=>s==='red'?'Urgent':s==='amber'?'Attention':'Healthy';
function recommendationText(f){const s=severityFor(f);if(s==='red')return`${f.recommendation}. This item needs dealing with before normal use.`;if(s==='amber')return`${f.recommendation}. It is not shown as an immediate stop-driving issue, but it should be planned.`;return'No action is currently required beyond routine monitoring.'}
function toast(text){const e=$('toast');e.textContent=text;e.classList.add('show');clearTimeout(toast.t);toast.t=setTimeout(()=>e.classList.remove('show'),2000)}
let viewerRuntimePromise=null;
let viewerRuntime=null;
let viewerRouteActive=false;
let queuedViewerFinding=null;

function ensureViewerRuntime(){
  if(viewerRuntime)return Promise.resolve(viewerRuntime);
  if(viewerRuntimePromise)return viewerRuntimePromise;

  const loading=$('viewerLoading');
  if(loading)loading.classList.remove('hidden');

  viewerRuntimePromise=import('./js/three/viewer-runtime.js')
    .then(module=>{
      viewerRuntime=module;
      module.configureViewer({
        getFindings:()=>state.findings,
        onSelectFinding:id=>{
          selectedFindingId=id;
          renderSelected(false);
        }
      });

      if(!viewerRouteActive)module.setViewerActive(false);

      if(queuedViewerFinding){
        const queued=queuedViewerFinding;
        queuedViewerFinding=null;
        module.focusFinding(queued);
      }
      return module;
    })
    .catch(error=>{
      console.error('DriveWell 3D runtime failed to load',error);
      viewerRuntimePromise=null;
      const loading=$('viewerLoading');
      const fallback=$('viewerError');
      if(loading)loading.classList.add('hidden');
      if(fallback){
        fallback.classList.remove('hidden');
        const title=fallback.querySelector('strong');
        if(title)title.textContent='3D view unavailable';
      }
      throw error;
    });

  return viewerRuntimePromise;
}

function setViewerRoute(active){
  viewerRouteActive=!!active;
  if(!viewerRouteActive){
    viewerRuntime?.setViewerActive(false);
    return;
  }

  // Do not block the report UI on Three.js or model loading.
  ensureViewerRuntime()
    .then(module=>{
      module.setViewerActive(true);
      requestAnimationFrame(()=>module.resizeViewer());
    })
    .catch(()=>{});
}

function focusFinding(f){
  if(viewerRuntime){
    viewerRuntime.focusFinding(f);
    return;
  }
  queuedViewerFinding=f;
  ensureViewerRuntime().catch(()=>{});
}

function routeTo(route){
  document.querySelectorAll('.route').forEach(r=>r.classList.toggle('active',r.id===`route-${route}`));
  document.querySelectorAll('.nav-button').forEach(n=>n.classList.toggle('active',n.dataset.route===route));
  $('pageTitle').textContent={
    dashboard:'Manager Dashboard',
    inspection:'Technician Inspection',
    assistant:'Technician Assistant',
    report:'Vehicle Health Report',
    communications:'Communications & Approvals'
  }[route]||'DriveWell';

  setViewerRoute(route==='report');
  window.scrollTo({top:0,left:0,behavior:'auto'});

  if(route==='dashboard')renderDashboard();
  if(route==='inspection')renderTechnician();
  if(route==='assistant')renderAssistant();
  if(route==='report')renderCustomer();
  if(route==='communications')renderCommunications();
}
document.querySelectorAll('[data-route]').forEach(b=>b.addEventListener('click',()=>routeTo(b.dataset.route)));

function renderDashboard(){$('urgentCount').textContent=state.findings.filter(f=>severityFor(f)==='red').length;$('attentionCount').textContent=state.findings.filter(f=>severityFor(f)==='amber').length;const a=Object.values(state.decisions).filter(d=>d.action==='approved').length;$('reportState').textContent=a?`${a} item${a===1?'':'s'} approved`:'Awaiting decision'}
function techButton(f){const s=severityFor(f);return`<button class="tech-component ${f.id===selectedTechId?'active':''}" data-tech="${f.id}" type="button"><span class="tech-component-icon">${f.icon}</span><span><strong>${f.title}</strong><small>${f.value} ${f.unit} · ${f.condition}</small></span><span class="severity ${s}">${severityLabel(s)}</span></button>`}
function renderTechnician(){$('techComponentList').innerHTML=state.findings.map(techButton).join('');document.querySelectorAll('[data-tech]').forEach(b=>b.addEventListener('click',()=>{selectedTechId=b.dataset.tech;renderTechnician()}));const f=findingById(selectedTechId),s=severityFor(f);$('techCategory').textContent=f.category;$('techTitle').textContent=f.title;$('techLocation').textContent=f.location;$('techAutoSeverity').className=`severity ${s}`;$('techAutoSeverity').textContent=`${severityLabel(s)} · automatic`;$('measurementFieldLabel').textContent=f.measurementLabel;$('techMeasurement').value=f.value;$('techUnit').textContent=f.unit;$('techCondition').value=f.condition;$('techRecommendation').value=f.recommendation;$('techNote').value=f.note||'';$('techModuleName').textContent=MODULE_LABELS[f.module];$('evidenceFileName').textContent=f.evidenceName||'No additional evidence selected';$('captureProgress').textContent=`${state.findings.length} / ${state.findings.length}`;$('captureSaved').textContent=''}
$('techMeasurement').addEventListener('input',()=>{const f={...findingById(selectedTechId),value:Number($('techMeasurement').value)},s=severityFor(f);$('techAutoSeverity').className=`severity ${s}`;$('techAutoSeverity').textContent=`${severityLabel(s)} · automatic`});
$('evidenceInput').addEventListener('change',e=>{const file=e.target.files[0];if(!file)return;evidenceUrls[selectedTechId]=URL.createObjectURL(file);$('evidenceFileName').textContent=file.name});
$('saveFinding').addEventListener('click',()=>{const f=findingById(selectedTechId);f.value=Number($('techMeasurement').value);f.condition=$('techCondition').value;f.recommendation=$('techRecommendation').value;f.note=$('techNote').value.trim();const file=$('evidenceInput').files[0];if(file)f.evidenceName=file.name;persist();$('captureSaved').textContent='Saved · customer report updated';toast(`${f.title} saved`);renderTechnician()});


function assistantCheckKey(id,group,index){return \`\${id}:\${group}:\${index}\`}
function assistantAuth(f){
  const action=state.decisions[f.id]?.action;
  if(action==='approved')return{label:'Approved by customer',className:'auth-approved',approved:true};
  if(action==='deferred')return{label:'Deferred by customer',className:'auth-deferred',approved:false};
  if(action==='question')return{label:'Customer question open',className:'auth-pending',approved:false};
  return{label:'Awaiting decision',className:'auth-pending',approved:false};
}
function assistantProgress(f,guide){
  const groups=[['diagnostic',guide.diagnosticChecks],['procedure',guide.procedure],['qc',guide.qc]];
  const total=groups.reduce((sum,[,items])=>sum+items.length,0);
  const done=groups.reduce((sum,[group,items])=>sum+items.filter((_,i)=>assistantState.completed[assistantCheckKey(f.id,group,i)]).length,0);
  return{done,total,pct:total?Math.round(done/total*100):0};
}
function assistantFindingButton(f){
  const s=severityFor(f);
  return \`<button class="assistant-finding \${f.id===selectedAssistantId?'active':''}" data-assistant-finding="\${f.id}" type="button"><span class="assistant-find-icon">\${f.icon}</span><span><strong>\${f.title}</strong><small>\${f.value} \${f.unit} · \${f.condition}</small></span><span class="severity \${s}">\${severityLabel(s)}</span></button>\`;
}
function assistantChecksHtml(f,items,group){
  return items.map((item,i)=>{
    const checked=!!assistantState.completed[assistantCheckKey(f.id,group,i)];
    return \`<label class="assistant-check \${checked?'done':''}"><input type="checkbox" data-assistant-check data-group="\${group}" data-index="\${i}" \${checked?'checked':''}><span>\${item}</span></label>\`;
  }).join('');
}
function ensureAssistantDiagnostics(id){
  if(!assistantState.diagnostics[id])assistantState.diagnostics[id]={codes:'',result:'',notes:''};
  return assistantState.diagnostics[id];
}
function renderAssistant(){
  const f=findingById(selectedAssistantId)||state.findings[0];
  if(!f)return;
  selectedAssistantId=f.id;
  assistantState.selectedId=f.id;
  const guide=getRepairGuide(f.id);
  if(!guide)return;

  $('assistantFindingList').innerHTML=state.findings.map(assistantFindingButton).join('');
  document.querySelectorAll('[data-assistant-finding]').forEach(button=>button.addEventListener('click',()=>{
    selectedAssistantId=button.dataset.assistantFinding;
    persistAssistant();
    renderAssistant();
  }));

  const s=severityFor(f);
  $('assistantSeverity').className=\`severity \${s}\`;
  $('assistantSeverity').textContent=severityLabel(s);
  $('assistantTitle').textContent=f.title;
  $('assistantLocation').textContent=f.location;
  $('assistantSymptom').textContent=guide.symptom;
  $('assistantMeasurement').textContent=\`\${f.value} \${f.unit} · \${f.condition}\`;
  $('assistantSource').textContent=guide.source;

  const auth=assistantAuth(f);
  $('assistantAuthStatus').textContent=auth.label;
  $('assistantAuthStatus').className=auth.className;

  $('assistantLevel').value=assistantState.level;
  $('assistantLevelDescription').textContent=TECHNICIAN_LEVELS[assistantState.level]?.description||'';

  $('assistantDiagnosticChecks').innerHTML=assistantChecksHtml(f,guide.diagnosticChecks,'diagnostic');
  $('assistantProcedureChecks').innerHTML=assistantChecksHtml(f,guide.procedure,'procedure');
  $('assistantQcChecks').innerHTML=assistantChecksHtml(f,guide.qc,'qc');

  const diagnostic=ensureAssistantDiagnostics(f.id);
  $('assistantFaultCodes').value=diagnostic.codes||'';
  $('assistantDiagnosticResult').value=diagnostic.result||'';
  $('assistantDiagnosticNotes').value=diagnostic.notes||'';

  $('assistantPartsList').innerHTML=guide.parts.map(part=>\`<div class="part-line"><span>\${part}</span><b>Parts lookup required</b></div>\`).join('');
  const partsRequested=!!assistantState.parts[f.id];
  $('assistantPartsStatus').textContent=partsRequested?'Parts request sent':auth.approved?'Ready to request':'Waiting for customer authorisation';
  $('assistantPartsButton').textContent=partsRequested?'Parts requested ✓':'Request parts';

  const evidenceName=assistantState.evidence[f.id]||f.evidenceName||'No additional evidence selected';
  $('assistantEvidenceName').textContent=evidenceName;
  $('assistantEvidenceStatus').textContent=evidenceName==='No additional evidence selected'?'No added evidence':evidenceName;

  const qcSigned=!!assistantState.qcSigned[f.id];
  $('assistantQcStatus').textContent=qcSigned?'Signed off by technician':'Technician sign-off required';
  $('assistantQcSignoff').textContent=qcSigned?'Technician sign-off complete ✓':'Complete technician sign-off';

  $('assistantSummary').textContent=assistantState.summaries[f.id]||'Complete the workflow or generate a draft summary at any time.';

  const progress=assistantProgress(f,guide);
  $('assistantProgressBar').style.width=\`\${progress.pct}%\`;
  $('assistantProgressText').textContent=\`\${progress.pct}% complete · \${progress.done}/\${progress.total} checks\`;
  persistAssistant();
}

function updateAssistantDiagnostic(field,value){
  const diagnostic=ensureAssistantDiagnostics(selectedAssistantId);
  diagnostic[field]=value;
  persistAssistant();
}

$('assistantLevel').addEventListener('change',e=>{
  assistantState.level=e.target.value;
  persistAssistant();
  renderAssistant();
});
$('route-assistant').addEventListener('change',e=>{
  const input=e.target.closest('[data-assistant-check]');
  if(!input)return;
  assistantState.completed[assistantCheckKey(selectedAssistantId,input.dataset.group,Number(input.dataset.index))]=input.checked;
  persistAssistant();
  renderAssistant();
});
$('assistantFaultCodes').addEventListener('input',e=>updateAssistantDiagnostic('codes',e.target.value));
$('assistantDiagnosticResult').addEventListener('input',e=>updateAssistantDiagnostic('result',e.target.value));
$('assistantDiagnosticNotes').addEventListener('input',e=>updateAssistantDiagnostic('notes',e.target.value));

$('assistantVoiceButton').addEventListener('click',()=>{
  const SpeechRecognition=window.SpeechRecognition||window.webkitSpeechRecognition;
  if(!SpeechRecognition){toast('Voice dictation is not supported in this browser');return}
  const recognition=new SpeechRecognition();
  recognition.lang='en-GB';
  recognition.interimResults=false;
  recognition.maxAlternatives=1;
  $('assistantVoiceButton').textContent='Listening…';
  recognition.onresult=event=>{
    const transcript=event.results[0][0].transcript.trim();
    const box=$('assistantDiagnosticNotes');
    box.value=[box.value.trim(),transcript].filter(Boolean).join(' ');
    updateAssistantDiagnostic('notes',box.value);
  };
  recognition.onerror=()=>toast('Voice dictation could not start');
  recognition.onend=()=>{$('assistantVoiceButton').textContent='🎙 Dictate note'};
  recognition.start();
});

$('assistantPartsButton').addEventListener('click',()=>{
  const f=findingById(selectedAssistantId);
  const auth=assistantAuth(f);
  if(!auth.approved){toast('Customer authorisation is required before the parts request');return}
  assistantState.parts[f.id]=true;
  persistAssistant();
  renderAssistant();
  toast('Parts request linked to the repair order');
});

$('assistantEvidenceInput').addEventListener('change',e=>{
  const file=e.target.files[0];
  if(!file)return;
  const f=findingById(selectedAssistantId);
  assistantState.evidence[f.id]=file.name;
  f.evidenceName=file.name;
  evidenceUrls[f.id]=URL.createObjectURL(file);
  persist();
  persistAssistant();
  renderAssistant();
  toast('Evidence attached to the finding');
});

$('assistantQcSignoff').addEventListener('click',()=>{
  const f=findingById(selectedAssistantId),guide=getRepairGuide(f.id);
  const complete=guide.qc.every((_,i)=>assistantState.completed[assistantCheckKey(f.id,'qc',i)]);
  if(!complete){toast('Complete every QC check before technician sign-off');return}
  assistantState.qcSigned[f.id]=true;
  persistAssistant();
  renderAssistant();
  toast('Technician QC sign-off recorded');
});

$('assistantGenerateSummary').addEventListener('click',()=>{
  const f=findingById(selectedAssistantId),guide=getRepairGuide(f.id),diagnostic=ensureAssistantDiagnostics(f.id),auth=assistantAuth(f);
  const procedureDone=guide.procedure.filter((_,i)=>assistantState.completed[assistantCheckKey(f.id,'procedure',i)]).length;
  const summary=[
    \`Repair order RO-261006-0147 — \${f.title} (\${f.location})\`,
    \`Inspection finding: \${f.value} \${f.unit}; \${f.condition}. Recommendation: \${f.recommendation}.\`,
    \`Diagnosis: \${diagnostic.notes||f.note||'Technician diagnostic narrative not yet added.'}\`,
    \`Fault / tester data: \${diagnostic.codes||'Not recorded'}; result: \${diagnostic.result||'Not recorded'}.\`,
    \`Workshop procedure: \${procedureDone}/\${guide.procedure.length} guided checkpoints technician-confirmed. Source: \${guide.source}.\`,
    \`Customer authorisation: \${auth.label}. Parts: \${assistantState.parts[f.id]?'request sent':'not requested'}.\`,
    \`Evidence: \${assistantState.evidence[f.id]||f.evidenceName||'none added'}. QC sign-off: \${assistantState.qcSigned[f.id]?'complete':'outstanding'}.\`,
    'Technician review required before this note is submitted to the DMS, warranty system or customer record.'
  ].join('\\n');
  assistantState.summaries[f.id]=summary;
  persistAssistant();
  $('assistantSummary').textContent=summary;
  toast('Draft repair summary generated');
});

$('assistantOpenInspection').addEventListener('click',()=>{
  selectedTechId=selectedAssistantId;
  routeTo('inspection');
});
$('assistantOpenApprovals').addEventListener('click',()=>routeTo('communications'));
$('assistantOpenReport').addEventListener('click',()=>{
  selectedFindingId=selectedAssistantId;
  routeTo('report');
});
$('openAssistantFromInspection').addEventListener('click',()=>{
  selectedAssistantId=selectedTechId;
  assistantState.selectedId=selectedAssistantId;
  persistAssistant();
  routeTo('assistant');
});

function measurementPct(f){return Math.max(0,Math.min(100,((f.value-f.min)/(f.max-f.min))*100))}
function findingCard(f){const s=severityFor(f);return`<button class="finding-card ${f.id===selectedFindingId?'active':''}" data-finding="${f.id}" type="button"><span class="finding-card-icon">${f.icon}</span><span><strong>${f.title}</strong><small>${f.value} ${f.unit} · ${severityLabel(s)}</small></span></button>`}
function historySvg(f){const w=400,h=88,px=22,py=13,uw=w-px*2,uh=h-py*2-13,x=i=>px+uw*(i/(f.history.length-1)),y=v=>py+uh*(1-(v-f.min)/(f.max-f.min)),pts=f.history.map((v,i)=>`${x(i)},${y(v)}`).join(' '),dots=f.history.map((v,i)=>`<circle cx="${x(i)}" cy="${y(v)}" r="${i===f.history.length-1?4.6:3}" fill="${i===f.history.length-1?(severityFor(f)==='red'?'#cd4551':'#b87914'):'#2f73e4'}" stroke="#fff" stroke-width="2"/>`).join(''),labels=f.historyDates.map((d,i)=>`<text x="${x(i)}" y="${h-3}" text-anchor="middle" font-size="7" fill="#7f8d9e">${d}</text>`).join('');return`<svg viewBox="0 0 ${w} ${h}"><polyline points="${pts}" fill="none" stroke="#2f73e4" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>${dots}${labels}</svg>`}
function evidenceSvg(f){const s=severityFor(f),col=s==='red'?'#cd4551':s==='amber'?'#ba7b15':'#26966b',tag=f.module==='tyre'?'TREAD':f.module==='brake'?'PAD':f.module==='battery'?'SOH':f.module==='lamp'?'OUTPUT':f.module==='wiper'?'WIPE':f.module==='airFilter'?'AIR':f.module==='cabinFilter'?'CABIN':'EXHAUST';return`<svg viewBox="0 0 420 150"><defs><linearGradient id="ev-${f.id}" x1="0" x2="1"><stop stop-color="#1b2837"/><stop offset="1" stop-color="#09111b"/></linearGradient></defs><rect width="420" height="150" rx="12" fill="url(#ev-${f.id})"/><rect x="18" y="18" width="180" height="114" rx="11" fill="#263647"/><circle cx="108" cy="75" r="42" fill="none" stroke="#8898aa" stroke-width="13"/><path d="M74 75h68M108 41v68" stroke="#405166" stroke-width="7"/><rect x="226" y="28" width="154" height="31" rx="15" fill="${col}" opacity=".2"/><text x="303" y="49" fill="${col}" font-size="13" font-weight="800" text-anchor="middle">${tag}</text><text x="226" y="91" fill="#f4f7fb" font-size="29" font-weight="900">${f.value} ${f.unit}</text><text x="226" y="114" fill="#a5b2c1" font-size="11">${f.condition}</text></svg>`}
function renderCustomer(){$('customerFindings').innerHTML=state.findings.map(findingCard).join('');document.querySelectorAll('[data-finding]').forEach(b=>b.addEventListener('click',()=>selectFinding(b.dataset.finding,true)));renderSelected(false)}
function renderSelected(change3d=true){const f=findingById(selectedFindingId),s=severityFor(f);$('reportSeverity').className=`severity ${s}`;$('reportSeverity').textContent=severityLabel(s);$('reportTitle').textContent=f.title;$('reportLocation').textContent=f.location;$('reportPrice').textContent=money(f.price);$('reportMeasurementLabel').textContent=f.measurementLabel;$('reportMeasurement').textContent=Number.isInteger(f.value)?f.value:f.value.toFixed(1);$('reportUnit').textContent=f.unit;$('measurementMarker').style.left=`${measurementPct(f)}%`;$('reportFound').textContent=f.found;$('reportWhy').textContent=f.why;$('reportRecommendationText').textContent=recommendationText(f);$('reportEvidenceTitle').textContent=f.evidenceName||'Sample workshop evidence';const src=evidenceUrls[f.id];$('reportEvidenceVisual').innerHTML=src?`<img src="${src}" alt="Technician evidence">`:evidenceSvg(f);const delta=f.history.at(-1)-f.history.at(-2);$('historyDelta').textContent=`${delta>0?'+':''}${delta.toFixed(1)} ${f.unit}`;$('historyChart').innerHTML=historySvg(f);$('approveAmount').textContent=money(f.price);const d=state.decisions[f.id];$('decisionStatus').textContent=d?d.action==='approved'?'Approved by customer':d.action==='deferred'?'Deferred by customer':'Customer asked a question':'';document.querySelectorAll('.finding-card').forEach(c=>c.classList.toggle('active',c.dataset.finding===f.id));if(change3d)focusFinding(f)}
function selectFinding(id,show3d=true){selectedFindingId=id;renderSelected(show3d)}
function decide(action){const f=findingById(selectedFindingId);state.decisions[f.id]={action,time:new Date().toISOString()};if(action==='question')state.messages.unshift({id:`own-${Date.now()}`,person:'Alex Morgan',initials:'AM',vehicle:'2021 Example SUV',time:'just now',finding:f.title,text:`I have a question about the ${f.title.toLowerCase()} recommendation.`});persist();renderSelected(false);renderDashboard();toast(action==='approved'?'Work approved':action==='deferred'?'Item deferred':'Question sent')}
$('approveBtn').addEventListener('click',()=>decide('approved'));$('askBtn').addEventListener('click',()=>decide('question'));$('deferBtn').addEventListener('click',()=>decide('deferred'));

function renderCommunications(){const own=Object.entries(state.decisions).map(([id,d])=>{const f=findingById(id);return{id:`d-${id}`,person:'Alex Morgan',initials:'AM',vehicle:'AB12 CDE',time:'just now',finding:f.title,text:d.action==='approved'?`Approved ${f.title}.`:d.action==='deferred'?`Deferred ${f.title} for now.`:`Asked a question about ${f.title}.`}}),feed=[...own,...state.messages];$('conversationFeed').innerHTML=feed.map((m,i)=>`<button class="conversation-row ${i===selectedConversation?'active':''}" data-conv="${i}"><span class="person-avatar">${m.initials}</span><span><strong>${m.person}</strong><small>${m.vehicle} · ${m.finding}</small><p>${m.text}</p></span><time>${m.time}</time></button>`).join('');document.querySelectorAll('[data-conv]').forEach(b=>b.addEventListener('click',()=>{selectedConversation=Number(b.dataset.conv);renderCommunications()}));const current=feed[selectedConversation]||feed[0];if(current){$('conversationFinding').textContent=current.finding;const f=state.findings.find(x=>x.title===current.finding);$('conversationPrice').textContent=f?money(f.price):'';$('conversationMessages').innerHTML=`<div class="message customer">${current.text}<small>${current.time}</small></div>`}const ds=Object.values(state.decisions);$('commApproved').textContent=6+ds.filter(d=>d.action==='approved').length;$('commQuestions').textContent=2+ds.filter(d=>d.action==='question').length;$('commAwaiting').textContent=Math.max(0,7-ds.length)}
$('sendReply').addEventListener('click',()=>{const text=$('replyText').value.trim();if(!text)return;const msg=document.createElement('div');msg.className='message dealer';msg.innerHTML=`${text}<small>just now</small>`;$('conversationMessages').appendChild(msg);$('replyText').value='';toast('Reply added')});

routeTo('dashboard');
renderTechnician();
renderCustomer();
renderCommunications();
