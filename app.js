import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const $ = (id) => document.getElementById(id);
const money = (v) => v === 0 ? 'No charge' : new Intl.NumberFormat('en-GB',{style:'currency',currency:'GBP',maximumFractionDigits:0}).format(v);

const MODULE_LABELS = {
  tyre:'Tyre / wheel exploded view',
  brake:'Brake pad + disc exploded view',
  battery:'12V battery exploded view',
  lamp:'Headlamp exploded view',
  wiper:'Wiper blade exploded view',
  airFilter:'Engine air filter exploded view',
  cabinFilter:'Cabin / pollen filter exploded view',
  exhaust:'Exhaust system exploded view'
};

const DEFAULT_FINDINGS = [
  {
    id:'tyre-fl', icon:'◉', category:'Tyres', module:'tyre', title:'Front left tyre', location:'Nearside front',
    measurementLabel:'Tread depth', value:1.3, unit:'mm', min:0, max:8, red:1.6, amber:3,
    direction:'lowBad', condition:'Uneven wear', recommendation:'Replace', price:145,
    note:'NSF tyre measured at 1.3 mm across principal grooves.',
    found:'The front left tyre has worn below the legal tread limit.',
    why:'Tyre tread helps the vehicle grip the road and clear standing water. Low tread can reduce wet-weather grip and increase stopping distance.',
    history:[5.6,4.2,2.8,1.3], historyDates:['Mar 25','Sep 25','Mar 26','Today']
  },
  {
    id:'brake-rr', icon:'◎', category:'Brakes', module:'brake', title:'Rear right brake pads', location:'Offside rear',
    measurementLabel:'Pad thickness', value:3.0, unit:'mm', min:0, max:10, red:2, amber:4,
    direction:'lowBad', condition:'Worn', recommendation:'Replace soon', price:210,
    note:'OSR brake pad approximately 3 mm remaining.',
    found:'The rear right brake pads are getting low.',
    why:'Brake pads are designed to wear as they slow the vehicle. If they become too thin they can affect braking and damage the brake disc.',
    history:[7.5,6.1,4.4,3.0], historyDates:['Mar 25','Sep 25','Mar 26','Today']
  },
  {
    id:'battery', icon:'⚡', category:'Battery', module:'battery', title:'12V battery', location:'Engine bay',
    measurementLabel:'State of health', value:71, unit:'%', min:0, max:100, red:50, amber:75,
    direction:'lowBad', condition:'Reduced performance', recommendation:'Monitor', price:189,
    note:'Battery tester reports 71% state of health. Charging system normal.',
    found:'The battery is still usable but its health is starting to decline.',
    why:'The 12V battery powers the vehicle electronics and provides the energy needed to start the vehicle. A weakening battery can eventually lead to slow or failed starting.',
    history:[94,87,79,71], historyDates:['Mar 25','Sep 25','Mar 26','Today']
  },
  {
    id:'lamp-fr', icon:'✦', category:'Lighting', module:'lamp', title:'Front right headlamp', location:'Offside front',
    measurementLabel:'Relative light output', value:72, unit:'%', min:0, max:100, red:50, amber:80,
    direction:'lowBad', condition:'Reduced performance', recommendation:'Repair', price:65,
    note:'OSF headlamp output visually reduced compared with NSF.',
    found:'The front right headlamp is producing less light than expected.',
    why:'Headlamps help you see the road and help other road users see you. Reduced output can affect night-time visibility and may become an MOT issue.',
    history:[100,94,83,72], historyDates:['Mar 25','Sep 25','Mar 26','Today']
  },
  {
    id:'wiper-front', icon:'⌁', category:'Wipers', module:'wiper', title:'Front wiper blades', location:'Windscreen',
    measurementLabel:'Blade condition', value:45, unit:'%', min:0, max:100, red:30, amber:60,
    direction:'lowBad', condition:'Worn', recommendation:'Replace soon', price:42,
    note:'Front blades leave visible streaks during wet test.',
    found:'The front wiper blades are leaving streaks on the windscreen.',
    why:'Wiper blades need to clear water cleanly so you can see properly in rain. Worn rubber can smear the screen instead.',
    history:[100,82,65,45], historyDates:['Mar 25','Sep 25','Mar 26','Today']
  },
  {
    id:'air-filter', icon:'▤', category:'Service', module:'airFilter', title:'Engine air filter', location:'Engine bay',
    measurementLabel:'Filter condition', value:52, unit:'%', min:0, max:100, red:25, amber:60,
    direction:'lowBad', condition:'Worn', recommendation:'Replace soon', price:58,
    note:'Filter element visibly contaminated with dust and debris.',
    found:'The engine air filter is becoming dirty and restricted.',
    why:'The air filter helps keep dirt out of the engine. A heavily contaminated filter can restrict airflow and reduce efficiency.',
    history:[100,88,70,52], historyDates:['Mar 25','Sep 25','Mar 26','Today']
  },
  {
    id:'cabin-filter', icon:'▥', category:'Service', module:'cabinFilter', title:'Cabin pollen filter', location:'Passenger compartment',
    measurementLabel:'Filter condition', value:40, unit:'%', min:0, max:100, red:25, amber:60,
    direction:'lowBad', condition:'Worn', recommendation:'Replace soon', price:49,
    note:'Pollen filter visibly dark with debris trapped in pleats.',
    found:'The cabin pollen filter is dirty.',
    why:'This filter cleans the air entering the cabin. When it becomes blocked it can reduce airflow and allow more dust and pollen through.',
    history:[100,85,61,40], historyDates:['Mar 25','Sep 25','Mar 26','Today']
  },
  {
    id:'exhaust', icon:'≈', category:'Exhaust', module:'exhaust', title:'Rear exhaust section', location:'Underbody',
    measurementLabel:'Condition score', value:58, unit:'%', min:0, max:100, red:30, amber:65,
    direction:'lowBad', condition:'Corroded', recommendation:'Monitor', price:260,
    note:'Surface corrosion visible on rear silencer and joint. No major leak detected.',
    found:'The rear exhaust section is showing corrosion.',
    why:'The exhaust carries gases safely away from the vehicle. Corrosion can eventually lead to leaks, increased noise or an MOT failure.',
    history:[100,88,72,58], historyDates:['Mar 25','Sep 25','Mar 26','Today']
  }
];

const clone = (v) => JSON.parse(JSON.stringify(v));
const saved = localStorage.getItem('vehicleHealthDemoState');
const state = saved ? JSON.parse(saved) : {
  findings:clone(DEFAULT_FINDINGS),
  decisions:{},
  messages:[
    {id:'m1',person:'Sarah Mitchell',initials:'SM',vehicle:'2024 Example SUV',time:'2 min ago',type:'question',finding:'Front tyres',text:'Can you confirm if this tyre replacement includes alignment?'},
    {id:'m2',person:'James Carter',initials:'JC',vehicle:'2022 Family SUV',time:'18 min ago',type:'approved',finding:'Front brake pads',text:'Approved front brake pads and wiper blades.'},
    {id:'m3',person:'Priya Desai',initials:'PD',vehicle:'2023 Saloon',time:'1 hour ago',type:'question',finding:'12V battery',text:'Is the battery covered by a warranty?'}
  ]
};
let evidenceUrls = {};
let selectedFindingId = state.findings[0].id;
let selectedTechId = state.findings[0].id;
let currentRoute = 'dashboard';
let selectedConversation = 0;

function persist(){ localStorage.setItem('vehicleHealthDemoState',JSON.stringify(state)); }
function findingById(id){ return state.findings.find(x=>x.id===id); }
function severityFor(f){
  if(f.direction === 'lowBad'){
    if(f.value <= f.red) return 'red';
    if(f.value <= f.amber) return 'amber';
    return 'green';
  }
  if(f.value >= f.red) return 'red';
  if(f.value >= f.amber) return 'amber';
  return 'green';
}
function severityLabel(sev){ return sev==='red'?'Urgent':sev==='amber'?'Attention':'Healthy'; }
function recommendationText(f){
  const sev=severityFor(f);
  if(sev==='red') return `${f.recommendation}. This item needs dealing with before normal use.`;
  if(sev==='amber') return `${f.recommendation}. It is not shown as an immediate stop-driving issue, but it should be planned.`;
  return 'No action is currently required beyond routine monitoring.';
}
function toast(text){
  const el=$('toast'); el.textContent=text; el.classList.add('show');
  clearTimeout(toast.t); toast.t=setTimeout(()=>el.classList.remove('show'),2200);
}

function routeTo(route){
  currentRoute=route;
  document.querySelectorAll('.route').forEach(r=>r.classList.toggle('active',r.id===`route-${route}`));
  document.querySelectorAll('.nav-item').forEach(n=>n.classList.toggle('active',n.dataset.route===route));
  const titles={dashboard:'Manager Dashboard',inspection:'Technician Inspection',report:'Customer Report',communications:'Communications & Approvals'};
  $('pageTitle').textContent=titles[route]||'Vehicle Health Platform';
  if(route==='dashboard') renderDashboard();
  if(route==='inspection') renderTechnician();
  if(route==='report'){ renderCustomer(); requestAnimationFrame(resizeViewer); }
  if(route==='communications') renderCommunications();
}
document.querySelectorAll('[data-route]').forEach(btn=>btn.addEventListener('click',()=>routeTo(btn.dataset.route)));

function renderDashboard(){
  const urgent=state.findings.filter(f=>severityFor(f)==='red').length;
  const attention=state.findings.filter(f=>severityFor(f)==='amber').length;
  $('urgentCount').textContent=urgent;
  $('attentionCount').textContent=attention;
  const ownDecisions=Object.values(state.decisions);
  const approved=ownDecisions.filter(x=>x.action==='approved').length;
  $('reportState').textContent=approved ? `${approved} item${approved>1?'s':''} approved` : 'Awaiting decision';
}
function techComponentButton(f){
  const sev=severityFor(f);
  return `<button class="tech-component ${f.id===selectedTechId?'active':''}" data-tech-id="${f.id}" type="button">
    <span class="tech-component-icon">${f.icon}</span>
    <span><strong>${f.title}</strong><small>${f.value} ${f.unit} · ${f.condition}</small></span>
    <span class="severity ${sev}">${severityLabel(sev)}</span>
  </button>`;
}
function renderTechnician(){
  $('techComponentList').innerHTML=state.findings.map(techComponentButton).join('');
  document.querySelectorAll('[data-tech-id]').forEach(btn=>btn.addEventListener('click',()=>{selectedTechId=btn.dataset.techId;renderTechnician();}));
  const f=findingById(selectedTechId);
  const sev=severityFor(f);
  $('techCategory').textContent=f.category;
  $('techTitle').textContent=f.title;
  $('techLocation').textContent=f.location;
  $('techAutoSeverity').className=`severity ${sev}`;
  $('techAutoSeverity').textContent=`${severityLabel(sev)} · automatic`;
  $('measurementFieldLabel').textContent=f.measurementLabel;
  $('techMeasurement').value=f.value;
  $('techUnit').textContent=f.unit;
  $('techCondition').value=[...$('techCondition').options].some(o=>o.value===f.condition)?f.condition:'Normal';
  $('techRecommendation').value=[...$('techRecommendation').options].some(o=>o.value===f.recommendation)?f.recommendation:'Monitor';
  $('techNote').value=f.note||'';
  $('techModuleName').textContent=MODULE_LABELS[f.module];
  $('evidenceFileName').textContent=f.evidenceName||'No additional evidence selected';
  $('captureProgress').textContent=`${state.findings.length} / ${state.findings.length}`;
  $('captureSaved').textContent='';
}
$('techMeasurement').addEventListener('input',()=>{
  const f={...findingById(selectedTechId),value:Number($('techMeasurement').value)};
  const sev=severityFor(f);
  $('techAutoSeverity').className=`severity ${sev}`;
  $('techAutoSeverity').textContent=`${severityLabel(sev)} · automatic`;
});
$('evidenceInput').addEventListener('change',(e)=>{
  const file=e.target.files[0];
  if(!file) return;
  evidenceUrls[selectedTechId]=URL.createObjectURL(file);
  $('evidenceFileName').textContent=file.name;
});
$('saveFinding').addEventListener('click',()=>{
  const f=findingById(selectedTechId);
  f.value=Number($('techMeasurement').value);
  f.condition=$('techCondition').value;
  f.recommendation=$('techRecommendation').value;
  f.note=$('techNote').value.trim();
  const file=$('evidenceInput').files[0];
  if(file) f.evidenceName=file.name;
  persist();
  $('captureSaved').textContent='Saved · customer 3D report updated';
  toast(`${f.title} saved`);
  renderTechnician();
});

function customerFindingCard(f){
  const sev=severityFor(f);
  return `<button class="finding-card ${f.id===selectedFindingId?'active':''}" data-finding-id="${f.id}" type="button">
    <span class="finding-card-icon">${f.icon}</span>
    <span><strong>${f.title}</strong><small>${f.value} ${f.unit} · ${severityLabel(sev)}</small></span>
  </button>`;
}
function measurementPct(f){ return Math.max(0,Math.min(100,((f.value-f.min)/(f.max-f.min))*100)); }
function historySvg(f){
  const w=400,h=88,padX=22,padY=15;
  const usableW=w-padX*2,usableH=h-padY*2-12;
  const x=i=>padX+usableW*(i/(f.history.length-1));
  const y=v=>padY+usableH*(1-(v-f.min)/(f.max-f.min));
  const pts=f.history.map((v,i)=>`${x(i)},${y(v)}`).join(' ');
  const circles=f.history.map((v,i)=>`<circle cx="${x(i)}" cy="${y(v)}" r="${i===f.history.length-1?4.8:3.2}" fill="${i===f.history.length-1?(severityFor(f)==='red'?'#c43844':'#a96300'):'#3271dd'}" stroke="#fff" stroke-width="2"/>`).join('');
  const labels=f.historyDates.map((d,i)=>`<text x="${x(i)}" y="${h-3}" text-anchor="middle" font-size="7" fill="#7b899b">${d}</text>`).join('');
  return `<svg viewBox="0 0 ${w} ${h}" aria-label="${f.title} history"><polyline points="${pts}" fill="none" stroke="#3271dd" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>${circles}${labels}</svg>`;
}
function evidenceSvg(f){
  const sev=severityFor(f), col=sev==='red'?'#cf4450':sev==='amber'?'#d58a17':'#2b9c70';
  const label=f.module==='tyre'?'TREAD':f.module==='brake'?'PAD':f.module==='battery'?'SOH':f.module==='lamp'?'OUTPUT':f.module==='wiper'?'WIPE':f.module==='airFilter'?'AIR':f.module==='cabinFilter'?'CABIN':'EXHAUST';
  return `<svg viewBox="0 0 420 150" role="img" aria-label="Sample technician evidence">
    <defs><linearGradient id="ev-${f.id}" x1="0" x2="1"><stop stop-color="#1b2735"/><stop offset="1" stop-color="#0a111a"/></linearGradient></defs>
    <rect width="420" height="150" rx="12" fill="url(#ev-${f.id})"/>
    <rect x="20" y="20" width="180" height="110" rx="10" fill="#263544"/>
    <circle cx="110" cy="75" r="42" fill="none" stroke="#8796a6" stroke-width="14"/>
    <path d="M76 76h68M110 42v68" stroke="#3c4d5f" stroke-width="7"/>
    <rect x="226" y="30" width="158" height="32" rx="16" fill="${col}" opacity=".22"/>
    <text x="305" y="51" fill="${col}" font-size="14" font-weight="800" text-anchor="middle">${label}</text>
    <text x="226" y="89" fill="#f3f7fb" font-size="30" font-weight="900">${f.value} ${f.unit}</text>
    <text x="226" y="112" fill="#a4b1c0" font-size="11">${f.condition}</text>
  </svg>`;
}
function renderCustomer(){
  $('customerFindings').innerHTML=state.findings.map(customerFindingCard).join('');
  document.querySelectorAll('[data-finding-id]').forEach(btn=>btn.addEventListener('click',()=>selectFinding(btn.dataset.findingId,true)));
  renderSelectedFinding(false);
}
function renderSelectedFinding(change3d=true){
  const f=findingById(selectedFindingId);
  const sev=severityFor(f);
  $('reportSeverity').className=`severity ${sev}`;$('reportSeverity').textContent=severityLabel(sev);
  $('reportTitle').textContent=f.title;$('reportLocation').textContent=f.location;$('reportPrice').textContent=money(f.price);
  $('reportMeasurementLabel').textContent=f.measurementLabel;$('reportMeasurement').textContent=Number.isInteger(f.value)?f.value:f.value.toFixed(1);$('reportUnit').textContent=f.unit;
  const pct=measurementPct(f);$('measurementMarker').style.left=`${pct}%`;
  $('reportFound').textContent=f.found;$('reportWhy').textContent=f.why;$('reportRecommendationText').textContent=recommendationText(f);
  $('reportEvidenceTitle').textContent=f.evidenceName||'Sample workshop evidence';
  const evidenceUrl=evidenceUrls[f.id];
  $('reportEvidenceVisual').innerHTML=evidenceUrl ? `<img src="${evidenceUrl}" alt="Technician evidence" style="width:100%;height:100%;object-fit:cover">` : evidenceSvg(f);
  const delta=f.history.at(-1)-f.history.at(-2);
  $('historyDelta').textContent=`${delta>0?'+':''}${delta.toFixed(1)} ${f.unit}`;
  $('historyChart').innerHTML=historySvg(f);
  $('approveAmount').textContent=money(f.price);
  const decision=state.decisions[f.id];
  $('decisionStatus').textContent=decision ? decision.action==='approved'?'Approved by customer':decision.action==='deferred'?'Deferred by customer':'Customer asked a question' : '';
  document.querySelectorAll('.finding-card').forEach(c=>c.classList.toggle('active',c.dataset.findingId===f.id));
  if(change3d) showExplodedModule(f);
}
function selectFinding(id,show3d=true){ selectedFindingId=id; renderSelectedFinding(show3d); }

function makeDecision(action){
  const f=findingById(selectedFindingId);
  state.decisions[f.id]={action,time:new Date().toISOString()};
  if(action==='question'){
    state.messages.unshift({id:`own-${Date.now()}`,person:'Alex Morgan',initials:'AM',vehicle:'2021 Example SUV',time:'just now',type:'question',finding:f.title,text:`I have a question about the ${f.title.toLowerCase()} recommendation.`});
  }
  persist(); renderSelectedFinding(false); renderDashboard();
  toast(action==='approved'?'Work approved':action==='deferred'?'Item deferred':'Question sent to dealership');
}
$('approveBtn').addEventListener('click',()=>makeDecision('approved'));
$('askBtn').addEventListener('click',()=>makeDecision('question'));
$('deferBtn').addEventListener('click',()=>makeDecision('deferred'));

function renderCommunications(){
  const own = Object.entries(state.decisions).map(([id,d])=>{
    const f=findingById(id);
    return {id:`decision-${id}`,person:'Alex Morgan',initials:'AM',vehicle:'AB12 CDE',time:'just now',type:d.action,finding:f.title,text:d.action==='approved'?`Approved ${f.title}.`:d.action==='deferred'?`Deferred ${f.title} for now.`:`Asked a question about ${f.title}.`};
  });
  const feed=[...own,...state.messages];
  $('conversationFeed').innerHTML=feed.map((m,i)=>`<button class="conversation-row ${i===selectedConversation?'active':''}" data-conv="${i}" type="button">
    <span class="person-avatar">${m.initials}</span>
    <span><strong>${m.person}</strong><small>${m.vehicle} · ${m.finding}</small><p>${m.text}</p></span>
    <time>${m.time}</time>
  </button>`).join('');
  document.querySelectorAll('[data-conv]').forEach(b=>b.addEventListener('click',()=>{selectedConversation=Number(b.dataset.conv);renderCommunications();}));
  const current=feed[selectedConversation]||feed[0];
  if(current){
    $('conversationFinding').textContent=current.finding;
    const ownF=state.findings.find(f=>f.title===current.finding);
    $('conversationPrice').textContent=ownF?money(ownF.price):'';
    $('conversationMessages').innerHTML=`<div class="message customer">${current.text}<small>${current.time}</small></div>`;
  } else $('conversationMessages').innerHTML='<div class="message customer">No customer messages yet.</div>';
  const decisions=Object.values(state.decisions);
  $('commApproved').textContent=6+decisions.filter(d=>d.action==='approved').length;
  $('commQuestions').textContent=2+decisions.filter(d=>d.action==='question').length;
  $('commAwaiting').textContent=Math.max(0,7-decisions.length);
}
$('sendReply').addEventListener('click',()=>{
  const text=$('replyText').value.trim(); if(!text) return;
  const msg=document.createElement('div');msg.className='message dealer';msg.innerHTML=`${text}<small>just now</small>`;
  $('conversationMessages').appendChild(msg);$('replyText').value='';toast('Reply added to demo conversation');
});

// ---------------- 3D VIEWER ----------------
const viewer=$('viewer');
const scene=new THREE.Scene();
scene.background=new THREE.Color(0x08111c);
scene.fog=new THREE.Fog(0x08111c,9,24);
const camera=new THREE.PerspectiveCamera(35,1,.05,100);
camera.position.set(5,2.4,6);
const renderer=new THREE.WebGLRenderer({antialias:true,alpha:false});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));
renderer.shadowMap.enabled=true;
renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.05;
viewer.appendChild(renderer.domElement);

const controls=new OrbitControls(camera,renderer.domElement);
controls.enableDamping=true;controls.dampingFactor=.08;controls.minDistance=2.5;controls.maxDistance=10;controls.maxPolarAngle=Math.PI/1.92;controls.target.set(0,.8,0);
scene.add(new THREE.HemisphereLight(0xe9f3ff,0x101722,1.6));
const key=new THREE.DirectionalLight(0xffffff,3.2);key.position.set(5,7,5);key.castShadow=true;scene.add(key);
const fill=new THREE.DirectionalLight(0x7fa8ff,1.3);fill.position.set(-5,3,-3);scene.add(fill);
const rim=new THREE.DirectionalLight(0xffffff,1.1);rim.position.set(-3,4,6);scene.add(rim);
const floor=new THREE.Mesh(new THREE.CircleGeometry(4.5,80),new THREE.MeshStandardMaterial({color:0x111d2b,roughness:.96,metalness:.02}));
floor.rotation.x=-Math.PI/2;floor.receiveShadow=true;scene.add(floor);

const vehicleRoot=new THREE.Group();scene.add(vehicleRoot);
const moduleRoot=new THREE.Group();moduleRoot.visible=false;scene.add(moduleRoot);
const markers=[];
let vehicleModel=null;
let vehicleBounds=null;
let activeModuleParts=[];
let moduleAnimationStart=0;
let moduleExploded=false;
let pointerDown={x:0,y:0};

function mat(col,metal=.25,rough=.45){return new THREE.MeshStandardMaterial({color:col,metalness:metal,roughness:rough});}
function mesh(geo,material,x=0,y=0,z=0){const m=new THREE.Mesh(geo,material);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;return m;}
function part(obj,explode={x:0,y:0,z:0},highlight=false){
  obj.userData.base=obj.position.clone();obj.userData.explode=new THREE.Vector3(explode.x,explode.y,explode.z);obj.userData.highlight=highlight;
  activeModuleParts.push(obj);moduleRoot.add(obj);return obj;
}
function clearModule(){
  activeModuleParts=[];while(moduleRoot.children.length){const c=moduleRoot.children.pop();c.traverse?.(o=>{if(o.geometry)o.geometry.dispose?.();if(o.material){const ms=Array.isArray(o.material)?o.material:[o.material];ms.forEach(x=>x.dispose?.());}});}
}
function addLabelSprite(text,color=0xffffff){
  const c=document.createElement('canvas');c.width=512;c.height=128;const ctx=c.getContext('2d');ctx.clearRect(0,0,c.width,c.height);ctx.fillStyle='rgba(8,17,28,.88)';ctx.roundRect(4,4,504,120,24);ctx.fill();ctx.fillStyle=`#${color.toString(16).padStart(6,'0')}`;ctx.font='700 42px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,256,64);
  const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;const s=new THREE.Sprite(new THREE.SpriteMaterial({map:tex,transparent:true,depthTest:false}));s.scale.set(2.6,.65,1);return s;
}
function buildTyre(){
  const rubber=mat(0x15191f,.05,.78), alloy=mat(0x9da6b0,.75,.28), issue=mat(0xc83c48,.2,.35);
  const tyre=mesh(new THREE.TorusGeometry(1.18,.34,24,64),rubber,0,1.15,0);tyre.rotation.y=Math.PI/2;part(tyre,{x:-1.0});
  const rim=mesh(new THREE.CylinderGeometry(.78,.78,.34,48),alloy,0,1.15,0);rim.rotation.z=Math.PI/2;part(rim,{x:.1});
  const hub=mesh(new THREE.CylinderGeometry(.23,.23,.52,32),alloy,0,1.15,0);hub.rotation.z=Math.PI/2;part(hub,{x:.55});
  const tread=mesh(new THREE.TorusGeometry(1.19,.12,12,48),issue,0,1.15,0);tread.rotation.y=Math.PI/2;part(tread,{x:-1.22},true);
  const s=addLabelSprite('TYRE TREAD',0xffa9b0);s.position.set(0,2.75,0);moduleRoot.add(s);
}
function buildBrake(){
  const steel=mat(0xaab0b8,.72,.3), dark=mat(0x2c333c,.25,.5), issue=mat(0xd04a52,.35,.34);
  const disc=mesh(new THREE.CylinderGeometry(1.05,1.05,.22,64),steel,0,1.12,0);disc.rotation.z=Math.PI/2;part(disc,{x:-.45});
  const hub=mesh(new THREE.CylinderGeometry(.35,.35,.46,48),dark,0,1.12,0);hub.rotation.z=Math.PI/2;part(hub,{x:-.1});
  const pad1=mesh(new THREE.BoxGeometry(.16,.9,.42),issue,.55,1.12,.38);part(pad1,{x:.85,z:.35},true);
  const pad2=mesh(new THREE.BoxGeometry(.16,.9,.42),issue,.55,1.12,-.38);part(pad2,{x:.85,z:-.35},true);
  const cal=mesh(new THREE.BoxGeometry(.55,1.5,1.02),mat(0x7e2530,.45,.35),.95,1.12,0);cal.rotation.z=.16;part(cal,{x:1.4});
  const s=addLabelSprite('BRAKE PAD + DISC',0xffc3c7);s.position.set(0,2.65,0);moduleRoot.add(s);
}
function buildBattery(){
  const body=mesh(new THREE.BoxGeometry(2.5,1.35,1.65),mat(0x26313b,.1,.55),0,1.0,0);part(body,{y:-.05});
  const top=mesh(new THREE.BoxGeometry(2.35,.18,1.5),mat(0x131a22,.1,.5),0,1.74,0);part(top,{y:.42});
  const terminal1=mesh(new THREE.CylinderGeometry(.14,.14,.32,24),mat(0xcc3e47,.5,.25),-.72,1.95,.36);part(terminal1,{x:-.35,y:.65},true);
  const terminal2=mesh(new THREE.CylinderGeometry(.14,.14,.32,24),mat(0x9eaab6,.6,.25),.72,1.95,.36);part(terminal2,{x:.35,y:.65});
  for(let i=-2;i<=2;i++){const plate=mesh(new THREE.BoxGeometry(.16,1.05,1.3),mat(0x667480,.55,.35),i*.33,1.05,0);part(plate,{x:i*.18,y:.05});}
  const s=addLabelSprite('12V BATTERY',0xaed4ff);s.position.set(0,2.85,0);moduleRoot.add(s);
}
function buildLamp(){
  const housing=mesh(new THREE.BoxGeometry(2.5,1.15,.72),mat(0x1e2833,.2,.4),0,1.25,0);housing.rotation.y=-.08;part(housing,{x:-.45});
  const lens=mesh(new THREE.BoxGeometry(2.35,1.0,.12),new THREE.MeshPhysicalMaterial({color:0xbddcff,transparent:true,opacity:.62,roughness:.1,transmission:.2}),0,1.25,.42);part(lens,{z:.85});
  for(let i=-1;i<=1;i++){const ref=mesh(new THREE.CylinderGeometry(.3,.5,.36,32),mat(0xbcc5cf,.8,.18),i*.72,1.25,.13);ref.rotation.x=Math.PI/2;part(ref,{z:.38});}
  const bulb=mesh(new THREE.SphereGeometry(.19,24,18),mat(0xffb33a,.15,.2),.72,1.25,.34);part(bulb,{x:.5,z:.7},true);
  const s=addLabelSprite('HEADLAMP ASSEMBLY',0xffd690);s.position.set(0,2.6,0);moduleRoot.add(s);
}
function buildWiper(){
  const arm=mesh(new THREE.BoxGeometry(2.7,.12,.12),mat(0x2b3138,.25,.55),0,1.15,0);arm.rotation.z=.24;part(arm,{y:.25});
  const blade=mesh(new THREE.BoxGeometry(3.15,.12,.24),mat(0x12171d,.05,.78),.32,.72,0);blade.rotation.z=-.04;part(blade,{y:-.55},true);
  const rubber=mesh(new THREE.BoxGeometry(3.0,.05,.09),mat(0xc84650,.05,.7),.32,.64,.08);rubber.rotation.z=-.04;part(rubber,{y:-.7,z:.2},true);
  const pivot=mesh(new THREE.CylinderGeometry(.22,.22,.22,24),mat(0x9aa4ae,.65,.3),-1.15,.83,0);pivot.rotation.x=Math.PI/2;part(pivot,{x:-.3});
  const s=addLabelSprite('WIPER BLADE',0xffaab0);s.position.set(0,2.4,0);moduleRoot.add(s);
}
function pleatedFilter(width,height,depth,dirty=false){
  const group=new THREE.Group();const frame=mesh(new THREE.BoxGeometry(width,height,depth),mat(0x2b333c,.15,.55));group.add(frame);
  for(let i=0;i<12;i++){const p=mesh(new THREE.BoxGeometry(width*.78,.035,depth*1.03),mat(dirty?0x806d52:0xe8d6a9,.05,.8),0,-height*.38+i*(height*.76/11),0);group.add(p);}
  return group;
}
function buildAirFilter(){
  const box=mesh(new THREE.BoxGeometry(3.0,1.65,1.95),mat(0x242d36,.08,.62),0,1.05,0);part(box,{x:-.8});
  const filter=pleatedFilter(2.5,1.25,.32,true);filter.position.set(.15,1.05,0);part(filter,{x:1.3},true);
  const lid=mesh(new THREE.BoxGeometry(3.05,.16,1.98),mat(0x121921,.08,.62),0,1.95,0);part(lid,{y:.72});
  const s=addLabelSprite('ENGINE AIR FILTER',0xffd28c);s.position.set(0,2.85,0);moduleRoot.add(s);
}
function buildCabinFilter(){
  const housing=mesh(new THREE.BoxGeometry(3.0,1.75,1.2),mat(0x303943,.08,.58),0,1.05,0);part(housing,{x:-.9});
  const filter=pleatedFilter(2.55,1.35,.35,true);filter.position.set(.1,1.05,0);part(filter,{x:1.45},true);
  const cover=mesh(new THREE.BoxGeometry(.18,1.55,1.15),mat(0x141c24,.08,.58),1.6,1.05,0);part(cover,{x:1.0});
  const s=addLabelSprite('CABIN / POLLEN FILTER',0xffd28c);s.position.set(0,2.75,0);moduleRoot.add(s);
}
function buildExhaust(){
  const pipeMat=mat(0x9199a1,.65,.38), issue=mat(0xba6940,.35,.58);
  const pipe=mesh(new THREE.CylinderGeometry(.18,.18,3.9,24),pipeMat,-.8,1.0,0);pipe.rotation.z=Math.PI/2;part(pipe,{x:-.8});
  const cat=mesh(new THREE.CylinderGeometry(.48,.48,1.25,36),pipeMat,.6,1.0,0);cat.rotation.z=Math.PI/2;part(cat,{x:.35});
  const muffler=mesh(new THREE.CylinderGeometry(.67,.67,1.55,36),issue,1.75,1.0,0);muffler.rotation.z=Math.PI/2;part(muffler,{x:1.15},true);
  const tail=mesh(new THREE.CylinderGeometry(.16,.16,1.35,24),pipeMat,3.0,1.0,0);tail.rotation.z=Math.PI/2;part(tail,{x:1.65});
  const s=addLabelSprite('EXHAUST SYSTEM',0xffbd95);s.position.set(.7,2.55,0);moduleRoot.add(s);
}
const moduleBuilders={tyre:buildTyre,brake:buildBrake,battery:buildBattery,lamp:buildLamp,wiper:buildWiper,airFilter:buildAirFilter,cabinFilter:buildCabinFilter,exhaust:buildExhaust};

function buildMarker(f,pos){
  const sev=severityFor(f), col=sev==='red'?0xd54854:sev==='amber'?0xd99722:0x2da878;
  const g=new THREE.Group();const sphere=mesh(new THREE.SphereGeometry(.085,20,16),new THREE.MeshStandardMaterial({color:col,emissive:col,emissiveIntensity:.65}),0,0,0);
  const ring=mesh(new THREE.TorusGeometry(.14,.022,10,30),mat(0xffffff,.1,.3),0,0,0);ring.rotation.x=Math.PI/2;g.add(sphere,ring);g.position.copy(pos);g.userData.findingId=f.id;vehicleRoot.add(g);markers.push(g);return g;
}
function rebuildMarkers(){
  markers.splice(0).forEach(m=>vehicleRoot.remove(m));
  const positions={
    'tyre-fl':new THREE.Vector3(-1.15,.58,1.45),
    'brake-rr':new THREE.Vector3(1.15,.58,-1.35),
    'battery':new THREE.Vector3(-.3,1.75,.7),
    'lamp-fr':new THREE.Vector3(1.25,1.1,1.52),
    'wiper-front':new THREE.Vector3(.05,1.85,.7),
    'air-filter':new THREE.Vector3(-.75,1.55,.45),
    'cabin-filter':new THREE.Vector3(.4,1.45,-.15),
    'exhaust':new THREE.Vector3(.1,.4,-1.45)
  };
  state.findings.forEach(f=>buildMarker(f,positions[f.id]||new THREE.Vector3()));
}
const loader=new GLTFLoader();
loader.load('./assets/lowpoly_generic_suv.glb',(gltf)=>{
  vehicleModel=gltf.scene;vehicleRoot.add(vehicleModel);
  vehicleModel.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});
  vehicleBounds=new THREE.Box3().setFromObject(vehicleModel);
  const size=vehicleBounds.getSize(new THREE.Vector3()),center=vehicleBounds.getCenter(new THREE.Vector3());
  const scale=4.6/Math.max(size.x,size.z);vehicleModel.scale.setScalar(scale);
  vehicleBounds.setFromObject(vehicleModel);const c=vehicleBounds.getCenter(new THREE.Vector3());
  vehicleModel.position.sub(c);vehicleModel.position.y-=vehicleBounds.min.y;
  rebuildMarkers();
  resetVehicleView();
  $('viewerLoading').classList.add('hidden');
},undefined,()=>{$('viewerLoading').classList.add('hidden');$('viewerError').classList.remove('hidden');});

function resetVehicleView(){
  moduleRoot.visible=false;vehicleRoot.visible=true;$('backToVehicle').classList.add('hidden');$('viewerModeLabel').textContent='Vehicle overview';$('viewerTitle').textContent='Tap an issue to explore it';
  camera.position.set(4.8,2.35,5.4);controls.target.set(0,.9,0);controls.update();
}
$('backToVehicle').addEventListener('click',resetVehicleView);
$('resetView').addEventListener('click',()=>{ if(moduleRoot.visible){camera.position.set(4.3,2.4,5.4);controls.target.set(0,1.0,0);controls.update();} else resetVehicleView(); });

function showExplodedModule(f){
  clearModule();vehicleRoot.visible=false;moduleRoot.visible=true;$('backToVehicle').classList.remove('hidden');
  $('viewerModeLabel').textContent='Exploded component view';$('viewerTitle').textContent=f.title;
  moduleBuilders[f.module]?.();
  moduleAnimationStart=performance.now();moduleExploded=true;
  camera.position.set(4.3,2.4,5.4);controls.target.set(0,1.0,0);controls.update();
}
renderer.domElement.addEventListener('pointerdown',e=>{pointerDown={x:e.clientX,y:e.clientY};});
renderer.domElement.addEventListener('pointerup',e=>{
  if(moduleRoot.visible) return;
  if(Math.hypot(e.clientX-pointerDown.x,e.clientY-pointerDown.y)>8) return;
  const rect=renderer.domElement.getBoundingClientRect();
  const mouse=new THREE.Vector2((e.clientX-rect.left)/rect.width*2-1,-((e.clientY-rect.top)/rect.height)*2+1);
  const ray=new THREE.Raycaster();ray.setFromCamera(mouse,camera);
  const hits=ray.intersectObjects(markers,true);
  if(!hits.length) return;
  let o=hits[0].object;while(o&&!o.userData.findingId)o=o.parent;
  if(o?.userData.findingId){selectedFindingId=o.userData.findingId;renderSelectedFinding(true);}
});
function resizeViewer(){
  const rect=viewer.getBoundingClientRect();if(!rect.width||!rect.height)return;
  renderer.setSize(rect.width,rect.height,false);camera.aspect=rect.width/rect.height;camera.updateProjectionMatrix();
}
window.addEventListener('resize',resizeViewer);resizeViewer();

function animate(t){
  requestAnimationFrame(animate);
  if(moduleRoot.visible && moduleExploded){
    const p=Math.min(1,(t-moduleAnimationStart)/850);const eased=1-Math.pow(1-p,3);
    activeModuleParts.forEach(o=>{const b=o.userData.base,e=o.userData.explode;o.position.set(b.x+e.x*eased,b.y+e.y*eased,b.z+e.z*eased);if(o.userData.highlight && o.material?.emissive){o.material.emissive.setHex(0x8b1d29);o.material.emissiveIntensity=.25+.18*Math.sin(t*.004);}});
    if(p>=1) moduleExploded=false;
  }
  markers.forEach((m,i)=>{const pulse=1+Math.sin(t*.004+i)*.08;m.scale.setScalar(pulse);});
  controls.update();renderer.render(scene,camera);
}
requestAnimationFrame(animate);

// Initial route and data.
routeTo('dashboard');
renderTechnician();
renderCustomer();
renderCommunications();
