
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

const FINDINGS = [
  {id:'tyre-fl',icon:'◉',category:'Tyres',module:'tyre',title:'Front left tyre',location:'Nearside front',measurementLabel:'Tread depth',value:1.3,unit:'mm',min:0,max:8,red:1.6,amber:3,direction:'lowBad',condition:'Uneven wear',recommendation:'Replace',price:145,note:'NSF tyre measured at 1.3 mm across principal grooves.',found:'The front left tyre has worn below the legal tread limit.',why:'Tyre tread helps the vehicle grip the road and clear standing water. Low tread can reduce wet-weather grip and increase stopping distance.',history:[5.6,4.2,2.8,1.3],historyDates:['Mar 25','Sep 25','Mar 26','Today']},
  {id:'brake-rr',icon:'◎',category:'Brakes',module:'brake',title:'Rear right brake pads',location:'Offside rear',measurementLabel:'Pad thickness',value:3.0,unit:'mm',min:0,max:10,red:2,amber:4,direction:'lowBad',condition:'Worn',recommendation:'Replace soon',price:210,note:'OSR brake pad approximately 3 mm remaining.',found:'The rear right brake pads are getting low.',why:'Brake pads are designed to wear as they slow the vehicle. If they become too thin they can affect braking and damage the brake disc.',history:[7.5,6.1,4.4,3.0],historyDates:['Mar 25','Sep 25','Mar 26','Today']},
  {id:'battery',icon:'⚡',category:'Battery',module:'battery',title:'12V battery',location:'Engine bay',measurementLabel:'State of health',value:71,unit:'%',min:0,max:100,red:50,amber:75,direction:'lowBad',condition:'Reduced performance',recommendation:'Monitor',price:189,note:'Battery tester reports 71% state of health. Charging system normal.',found:'The battery is still usable but its health is starting to decline.',why:'The 12V battery powers the vehicle electronics and provides the energy needed to start the vehicle. A weakening battery can eventually lead to slow or failed starting.',history:[94,87,79,71],historyDates:['Mar 25','Sep 25','Mar 26','Today']},
  {id:'lamp-fr',icon:'✦',category:'Lighting',module:'lamp',title:'Front right headlamp',location:'Offside front',measurementLabel:'Relative light output',value:72,unit:'%',min:0,max:100,red:50,amber:80,direction:'lowBad',condition:'Reduced performance',recommendation:'Repair',price:65,note:'OSF headlamp output visually reduced compared with NSF.',found:'The front right headlamp is producing less light than expected.',why:'Headlamps help you see the road and help other road users see you. Reduced output can affect night-time visibility and may become an MOT issue.',history:[100,94,83,72],historyDates:['Mar 25','Sep 25','Mar 26','Today']},
  {id:'wiper-front',icon:'⌁',category:'Wipers',module:'wiper',title:'Front wiper blades',location:'Windscreen',measurementLabel:'Blade condition',value:45,unit:'%',min:0,max:100,red:30,amber:60,direction:'lowBad',condition:'Worn',recommendation:'Replace soon',price:42,note:'Front blades leave visible streaks during wet test.',found:'The front wiper blades are leaving streaks on the windscreen.',why:'Wiper blades need to clear water cleanly so you can see properly in rain. Worn rubber can smear the screen instead.',history:[100,82,65,45],historyDates:['Mar 25','Sep 25','Mar 26','Today']},
  {id:'air-filter',icon:'▤',category:'Service',module:'airFilter',title:'Engine air filter',location:'Engine bay',measurementLabel:'Filter condition',value:52,unit:'%',min:0,max:100,red:25,amber:60,direction:'lowBad',condition:'Worn',recommendation:'Replace soon',price:58,note:'Filter element visibly contaminated with dust and debris.',found:'The engine air filter is becoming dirty and restricted.',why:'The air filter helps keep dirt out of the engine. A heavily contaminated filter can restrict airflow and reduce efficiency.',history:[100,88,70,52],historyDates:['Mar 25','Sep 25','Mar 26','Today']},
  {id:'cabin-filter',icon:'▥',category:'Service',module:'cabinFilter',title:'Cabin pollen filter',location:'Passenger compartment',measurementLabel:'Filter condition',value:40,unit:'%',min:0,max:100,red:25,amber:60,direction:'lowBad',condition:'Worn',recommendation:'Replace soon',price:49,note:'Pollen filter visibly dark with debris trapped in pleats.',found:'The cabin pollen filter is dirty.',why:'This filter cleans the air entering the cabin. When it becomes blocked it can reduce airflow and allow more dust and pollen through.',history:[100,85,61,40],historyDates:['Mar 25','Sep 25','Mar 26','Today']},
  {id:'exhaust',icon:'≈',category:'Exhaust',module:'exhaust',title:'Rear exhaust section',location:'Underbody',measurementLabel:'Condition score',value:58,unit:'%',min:0,max:100,red:30,amber:65,direction:'lowBad',condition:'Corroded',recommendation:'Monitor',price:260,note:'Surface corrosion visible on rear silencer and joint. No major leak detected.',found:'The rear exhaust section is showing corrosion.',why:'The exhaust carries gases safely away from the vehicle. Corrosion can eventually lead to leaks, increased noise or an MOT failure.',history:[100,88,72,58],historyDates:['Mar 25','Sep 25','Mar 26','Today']}
];

const freshState = () => ({
  findings:JSON.parse(JSON.stringify(FINDINGS)),
  decisions:{},
  messages:[
    {id:'m1',person:'Sarah Mitchell',initials:'SM',vehicle:'2024 Example SUV',time:'2 min ago',type:'question',finding:'Front tyres',text:'Can you confirm if this tyre replacement includes alignment?'},
    {id:'m2',person:'James Carter',initials:'JC',vehicle:'2022 Family SUV',time:'18 min ago',type:'approved',finding:'Front brake pads',text:'Approved front brake pads and wiper blades.'},
    {id:'m3',person:'Priya Desai',initials:'PD',vehicle:'2023 Saloon',time:'1 hour ago',type:'question',finding:'12V battery',text:'Is the battery covered by a warranty?'}
  ]
});

let state;
try {
  state = JSON.parse(localStorage.getItem('drivewellV3State')) || freshState();
} catch {
  state = freshState();
}

let evidenceUrls = {};
let selectedFindingId = state.findings[0].id;
let selectedTechId = state.findings[0].id;
let selectedConversation = 0;

function persist(){ localStorage.setItem('drivewellV3State',JSON.stringify(state)); }
function findingById(id){ return state.findings.find(f=>f.id===id); }
function severityFor(f){
  if(f.direction==='lowBad'){
    if(f.value<=f.red) return 'red';
    if(f.value<=f.amber) return 'amber';
    return 'green';
  }
  if(f.value>=f.red) return 'red';
  if(f.value>=f.amber) return 'amber';
  return 'green';
}
function severityLabel(s){ return s==='red'?'Urgent':s==='amber'?'Attention':'Healthy'; }
function recommendationText(f){
  const s=severityFor(f);
  if(s==='red') return `${f.recommendation}. This item needs dealing with before normal use.`;
  if(s==='amber') return `${f.recommendation}. It is not shown as an immediate stop-driving issue, but it should be planned.`;
  return 'No action is currently required beyond routine monitoring.';
}
function toast(text){
  const el=$('toast');
  el.textContent=text;
  el.classList.add('show');
  clearTimeout(toast.timer);
  toast.timer=setTimeout(()=>el.classList.remove('show'),2100);
}

function routeTo(route){
  document.querySelectorAll('.route').forEach(r=>r.classList.toggle('active',r.id===`route-${route}`));
  document.querySelectorAll('.side-nav-item').forEach(n=>n.classList.toggle('active',n.dataset.route===route));
  const titles={dashboard:'Manager Dashboard',inspection:'Technician Inspection',report:'Vehicle Health Report',communications:'Communications & Approvals'};
  $('pageTitle').textContent=titles[route]||'DriveWell';
  if(route==='dashboard') renderDashboard();
  if(route==='inspection') renderTechnician();
  if(route==='report'){ renderCustomer(); requestAnimationFrame(resizeViewer); }
  if(route==='communications') renderCommunications();
}
document.querySelectorAll('[data-route]').forEach(b=>b.addEventListener('click',()=>routeTo(b.dataset.route)));

function renderDashboard(){
  $('urgentCount').textContent=state.findings.filter(f=>severityFor(f)==='red').length;
  $('attentionCount').textContent=state.findings.filter(f=>severityFor(f)==='amber').length;
  const approved=Object.values(state.decisions).filter(d=>d.action==='approved').length;
  $('reportState').textContent=approved?`${approved} item${approved===1?'':'s'} approved`:'Awaiting decision';
}

function techButton(f){
  const s=severityFor(f);
  return `<button class="tech-component ${f.id===selectedTechId?'active':''}" data-tech="${f.id}" type="button">
    <span class="tech-component-icon">${f.icon}</span>
    <span><strong>${f.title}</strong><small>${f.value} ${f.unit} · ${f.condition}</small></span>
    <span class="severity ${s}">${severityLabel(s)}</span>
  </button>`;
}
function renderTechnician(){
  $('techComponentList').innerHTML=state.findings.map(techButton).join('');
  document.querySelectorAll('[data-tech]').forEach(b=>b.addEventListener('click',()=>{selectedTechId=b.dataset.tech;renderTechnician();}));
  const f=findingById(selectedTechId);
  const s=severityFor(f);
  $('techCategory').textContent=f.category;
  $('techTitle').textContent=f.title;
  $('techLocation').textContent=f.location;
  $('techAutoSeverity').className=`severity ${s}`;
  $('techAutoSeverity').textContent=`${severityLabel(s)} · automatic`;
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
  const s=severityFor(f);
  $('techAutoSeverity').className=`severity ${s}`;
  $('techAutoSeverity').textContent=`${severityLabel(s)} · automatic`;
});
$('evidenceInput').addEventListener('change',e=>{
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
  $('captureSaved').textContent='Saved · customer report updated';
  toast(`${f.title} saved`);
  renderTechnician();
});

function measurementPct(f){ return Math.max(0,Math.min(100,((f.value-f.min)/(f.max-f.min))*100)); }
function findingCard(f){
  const s=severityFor(f);
  return `<button class="finding-card ${f.id===selectedFindingId?'active':''}" data-finding="${f.id}" type="button">
    <span class="finding-card-icon">${f.icon}</span>
    <span><strong>${f.title}</strong><small>${f.value} ${f.unit} · ${severityLabel(s)}</small></span>
  </button>`;
}
function historySvg(f){
  const w=400,h=88,px=22,py=13;
  const usableW=w-px*2, usableH=h-py*2-13;
  const x=i=>px+usableW*(i/(f.history.length-1));
  const y=v=>py+usableH*(1-(v-f.min)/(f.max-f.min));
  const pts=f.history.map((v,i)=>`${x(i)},${y(v)}`).join(' ');
  const dots=f.history.map((v,i)=>`<circle cx="${x(i)}" cy="${y(v)}" r="${i===f.history.length-1?4.6:3}" fill="${i===f.history.length-1?(severityFor(f)==='red'?'#cc4450':'#b77813'):'#2f73e4'}" stroke="#fff" stroke-width="2"/>`).join('');
  const labels=f.historyDates.map((d,i)=>`<text x="${x(i)}" y="${h-3}" text-anchor="middle" font-size="7" fill="#7f8d9e">${d}</text>`).join('');
  return `<svg viewBox="0 0 ${w} ${h}"><polyline points="${pts}" fill="none" stroke="#2f73e4" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>${dots}${labels}</svg>`;
}
function evidenceSvg(f){
  const s=severityFor(f), col=s==='red'?'#cc4450':s==='amber'?'#ba7a14':'#26966b';
  const tag=f.module==='tyre'?'TREAD':f.module==='brake'?'PAD':f.module==='battery'?'SOH':f.module==='lamp'?'OUTPUT':f.module==='wiper'?'WIPE':f.module==='airFilter'?'AIR':f.module==='cabinFilter'?'CABIN':'EXHAUST';
  return `<svg viewBox="0 0 420 150">
    <defs><linearGradient id="ev-${f.id}" x1="0" x2="1"><stop stop-color="#1b2837"/><stop offset="1" stop-color="#09111b"/></linearGradient></defs>
    <rect width="420" height="150" rx="12" fill="url(#ev-${f.id})"/>
    <rect x="18" y="18" width="180" height="114" rx="11" fill="#263647"/>
    <circle cx="108" cy="75" r="42" fill="none" stroke="#8898aa" stroke-width="13"/>
    <path d="M74 75h68M108 41v68" stroke="#405166" stroke-width="7"/>
    <rect x="226" y="28" width="154" height="31" rx="15" fill="${col}" opacity=".2"/>
    <text x="303" y="49" fill="${col}" font-size="13" font-weight="800" text-anchor="middle">${tag}</text>
    <text x="226" y="91" fill="#f4f7fb" font-size="29" font-weight="900">${f.value} ${f.unit}</text>
    <text x="226" y="114" fill="#a5b2c1" font-size="11">${f.condition}</text>
  </svg>`;
}
function renderCustomer(){
  $('customerFindings').innerHTML=state.findings.map(findingCard).join('');
  document.querySelectorAll('[data-finding]').forEach(b=>b.addEventListener('click',()=>selectFinding(b.dataset.finding,true)));
  renderSelected(false);
}
function renderSelected(change3d=true){
  const f=findingById(selectedFindingId);
  const s=severityFor(f);
  $('reportSeverity').className=`severity ${s}`;
  $('reportSeverity').textContent=severityLabel(s);
  $('reportTitle').textContent=f.title;
  $('reportLocation').textContent=f.location;
  $('reportPrice').textContent=money(f.price);
  $('reportMeasurementLabel').textContent=f.measurementLabel;
  $('reportMeasurement').textContent=Number.isInteger(f.value)?f.value:f.value.toFixed(1);
  $('reportUnit').textContent=f.unit;
  $('measurementMarker').style.left=`${measurementPct(f)}%`;
  $('reportFound').textContent=f.found;
  $('reportWhy').textContent=f.why;
  $('reportRecommendationText').textContent=recommendationText(f);
  $('reportEvidenceTitle').textContent=f.evidenceName||'Sample workshop evidence';
  const src=evidenceUrls[f.id];
  $('reportEvidenceVisual').innerHTML=src?`<img src="${src}" alt="Technician evidence" style="width:100%;height:100%;object-fit:cover">`:evidenceSvg(f);
  const delta=f.history.at(-1)-f.history.at(-2);
  $('historyDelta').textContent=`${delta>0?'+':''}${delta.toFixed(1)} ${f.unit}`;
  $('historyChart').innerHTML=historySvg(f);
  $('approveAmount').textContent=money(f.price);
  const d=state.decisions[f.id];
  $('decisionStatus').textContent=d?d.action==='approved'?'Approved by customer':d.action==='deferred'?'Deferred by customer':'Customer asked a question':'';
  document.querySelectorAll('.finding-card').forEach(c=>c.classList.toggle('active',c.dataset.finding===f.id));
  if(change3d) showExploded(f);
}
function selectFinding(id,show3d=true){ selectedFindingId=id; renderSelected(show3d); }

function makeDecision(action){
  const f=findingById(selectedFindingId);
  state.decisions[f.id]={action,time:new Date().toISOString()};
  if(action==='question'){
    state.messages.unshift({id:`own-${Date.now()}`,person:'Alex Morgan',initials:'AM',vehicle:'2021 Example SUV',time:'just now',type:'question',finding:f.title,text:`I have a question about the ${f.title.toLowerCase()} recommendation.`});
  }
  persist();
  renderSelected(false);
  renderDashboard();
  toast(action==='approved'?'Work approved':action==='deferred'?'Item deferred':'Question sent');
}
$('approveBtn').addEventListener('click',()=>makeDecision('approved'));
$('askBtn').addEventListener('click',()=>makeDecision('question'));
$('deferBtn').addEventListener('click',()=>makeDecision('deferred'));

function renderCommunications(){
  const own=Object.entries(state.decisions).map(([id,d])=>{
    const f=findingById(id);
    return {id:`decision-${id}`,person:'Alex Morgan',initials:'AM',vehicle:'AB12 CDE',time:'just now',type:d.action,finding:f.title,text:d.action==='approved'?`Approved ${f.title}.`:d.action==='deferred'?`Deferred ${f.title} for now.`:`Asked a question about ${f.title}.`};
  });
  const feed=[...own,...state.messages];
  $('conversationFeed').innerHTML=feed.map((m,i)=>`<button class="conversation-row ${i===selectedConversation?'active':''}" data-conv="${i}" type="button"><span class="person-avatar">${m.initials}</span><span><strong>${m.person}</strong><small>${m.vehicle} · ${m.finding}</small><p>${m.text}</p></span><time>${m.time}</time></button>`).join('');
  document.querySelectorAll('[data-conv]').forEach(b=>b.addEventListener('click',()=>{selectedConversation=Number(b.dataset.conv);renderCommunications();}));
  const current=feed[selectedConversation]||feed[0];
  if(current){
    $('conversationFinding').textContent=current.finding;
    const ownF=state.findings.find(f=>f.title===current.finding);
    $('conversationPrice').textContent=ownF?money(ownF.price):'';
    $('conversationMessages').innerHTML=`<div class="message customer">${current.text}<small>${current.time}</small></div>`;
  } else {
    $('conversationMessages').innerHTML='<div class="message customer">No customer messages yet.</div>';
  }
  const decisions=Object.values(state.decisions);
  $('commApproved').textContent=6+decisions.filter(d=>d.action==='approved').length;
  $('commQuestions').textContent=2+decisions.filter(d=>d.action==='question').length;
  $('commAwaiting').textContent=Math.max(0,7-decisions.length);
}
$('sendReply').addEventListener('click',()=>{
  const text=$('replyText').value.trim();
  if(!text) return;
  const msg=document.createElement('div');
  msg.className='message dealer';
  msg.innerHTML=`${text}<small>just now</small>`;
  $('conversationMessages').appendChild(msg);
  $('replyText').value='';
  toast('Reply added');
});

// ---------- PREMIUM 3D ----------
const viewer=$('viewer');
const scene=new THREE.Scene();
scene.background=new THREE.Color(0x08111b);
scene.fog=new THREE.Fog(0x08111b,9,24);

const camera=new THREE.PerspectiveCamera(34,1,.05,100);
camera.position.set(5.2,2.35,5.8);

const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.04;
renderer.shadowMap.enabled=true;
renderer.shadowMap.type=THREE.PCFSoftShadowMap;
viewer.appendChild(renderer.domElement);

const controls=new OrbitControls(camera,renderer.domElement);
controls.enableDamping=true;
controls.dampingFactor=.075;
controls.minDistance=2.6;
controls.maxDistance=9;
controls.maxPolarAngle=Math.PI/1.95;
controls.target.set(0,.8,0);

scene.add(new THREE.HemisphereLight(0xeaf2ff,0x0a1019,1.45));
const key=new THREE.DirectionalLight(0xfffbf4,2.9);key.position.set(4.5,6.7,5.2);key.castShadow=true;key.shadow.mapSize.set(2048,2048);scene.add(key);
const fill=new THREE.DirectionalLight(0x7fa8ff,1.0);fill.position.set(-4.8,2.8,-3.2);scene.add(fill);
const rim=new THREE.DirectionalLight(0xffffff,1.2);rim.position.set(-3.2,4.6,5.4);scene.add(rim);
const floor=new THREE.Mesh(new THREE.PlaneGeometry(24,24),new THREE.MeshStandardMaterial({color:0x101a27,roughness:.97,metalness:.02}));
floor.rotation.x=-Math.PI/2;floor.position.y=-.005;floor.receiveShadow=true;scene.add(floor);
const studioRing=new THREE.Mesh(new THREE.RingGeometry(3.6,3.63,96),new THREE.MeshBasicMaterial({color:0x335888,transparent:true,opacity:.42,side:THREE.DoubleSide}));
studioRing.rotation.x=-Math.PI/2;studioRing.position.y=.005;scene.add(studioRing);

const vehicleRoot=new THREE.Group();scene.add(vehicleRoot);
const carGroup=new THREE.Group();vehicleRoot.add(carGroup);
const markerRoot=new THREE.Group();vehicleRoot.add(markerRoot);
const moduleRoot=new THREE.Group();moduleRoot.visible=false;scene.add(moduleRoot);

let vehicleModel=null;
let activeParts=[];
let explodeStart=0;
let exploding=false;
let pointerDown={x:0,y:0};
let markers=[];

function m(col,metal=.25,rough=.45){ return new THREE.MeshStandardMaterial({color:col,metalness:metal,roughness:rough}); }
function glassMaterial(){ return new THREE.MeshPhysicalMaterial({color:0x26384b,transparent:true,opacity:.58,roughness:.08,metalness:.05,clearcoat:.8,clearcoatRoughness:.1}); }
function makeMesh(geo,mat,x=0,y=0,z=0){ const o=new THREE.Mesh(geo,mat);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;return o; }
function addPart(obj,offset={x:0,y:0,z:0},highlight=false,spin=0){
  obj.userData.base=obj.position.clone();
  obj.userData.offset=new THREE.Vector3(offset.x||0,offset.y||0,offset.z||0);
  obj.userData.highlight=highlight;
  obj.userData.spin=spin;
  activeParts.push(obj);
  moduleRoot.add(obj);
  return obj;
}
function clearModule(){
  while(moduleRoot.children.length){
    const c=moduleRoot.children.pop();
    c.traverse?.(o=>{
      if(o.geometry) o.geometry.dispose?.();
      if(o.material){
        (Array.isArray(o.material)?o.material:[o.material]).forEach(mm=>{
          if(mm.map) mm.map.dispose?.();
          mm.dispose?.();
        });
      }
    });
  }
  activeParts=[];
}
function roundedLabel(text){
  const canvas=document.createElement('canvas');
  canvas.width=900;canvas.height=180;
  const ctx=canvas.getContext('2d');
  ctx.fillStyle='rgba(7,15,26,.91)';
  ctx.strokeStyle='rgba(112,148,199,.35)';
  ctx.lineWidth=3;
  const r=30,x=12,y=12,w=876,h=156;
  ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath();ctx.fill();ctx.stroke();
  ctx.fillStyle='#eff5fc';ctx.font='700 54px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,450,90);
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
  const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,transparent:true,depthTest:false}));
  sprite.scale.set(3.8,.76,1);
  return sprite;
}
function stage(title){
  const p1=makeMesh(new THREE.CylinderGeometry(3.05,3.18,.22,72),m(0x111d2b,.12,.9),0,.05,0);addPart(p1);
  const p2=makeMesh(new THREE.CylinderGeometry(2.38,2.55,.06,72),m(0x263c5c,.08,.82),0,.2,0);addPart(p2);
  const line=makeMesh(new THREE.RingGeometry(2.65,2.67,90),new THREE.MeshBasicMaterial({color:0x4676b5,transparent:true,opacity:.55,side:THREE.DoubleSide}),0,.235,0);line.rotation.x=-Math.PI/2;addPart(line);
  const label=roundedLabel(title);label.position.set(0,3.0,0);moduleRoot.add(label);
}
function addBolt(x,y,z,offset){
  const bolt=makeMesh(new THREE.CylinderGeometry(.07,.07,.18,14),m(0xb4bdc7,.75,.24),x,y,z);
  bolt.rotation.z=Math.PI/2;
  addPart(bolt,offset);
}
function buildTyre(){
  stage('Tyre / wheel assembly');
  const rubber=m(0x12171d,.02,.86),alloy=m(0xa7b0ba,.85,.25),steel=m(0x7c8792,.6,.33),red=m(0xc94954,.2,.42);
  const tyre=makeMesh(new THREE.TorusGeometry(1.05,.34,30,86),rubber,0,1.18,0);tyre.rotation.y=Math.PI/2;addPart(tyre,{x:-1.45},false,.001);
  const tread=makeMesh(new THREE.TorusGeometry(1.06,.08,14,74),red,0,1.18,0);tread.rotation.y=Math.PI/2;addPart(tread,{x:-1.75},true,.001);
  const rim=makeMesh(new THREE.CylinderGeometry(.73,.73,.26,56),alloy,0,1.18,0);rim.rotation.z=Math.PI/2;addPart(rim,{x:-.46});
  for(let i=0;i<7;i++){const spoke=makeMesh(new THREE.BoxGeometry(.11,.58,.10),alloy,0,1.18,0);spoke.rotation.z=Math.PI/2;spoke.rotation.x=i*(Math.PI*2/7);addPart(spoke,{x:-.46});}
  const disc=makeMesh(new THREE.CylinderGeometry(.48,.48,.11,52),steel,0,1.18,0);disc.rotation.z=Math.PI/2;addPart(disc,{x:.25});
  const hub=makeMesh(new THREE.CylinderGeometry(.18,.18,.38,28),steel,0,1.18,0);hub.rotation.z=Math.PI/2;addPart(hub,{x:.78});
  for(let i=0;i<5;i++){const a=i*Math.PI*2/5;addBolt(0,1.18+Math.cos(a)*.23,Math.sin(a)*.23,{x:1.13});}
}
function buildBrake(){
  stage('Brake pad + disc assembly');
  const steel=m(0xa9b1bb,.78,.28),dark=m(0x28313a,.25,.5),cal=m(0x8d2630,.42,.35),pad=m(0xd45b66,.15,.46);
  const disc=makeMesh(new THREE.CylinderGeometry(1.02,1.02,.16,72),steel,0,1.18,0);disc.rotation.z=Math.PI/2;addPart(disc,{x:-.65});
  const bell=makeMesh(new THREE.CylinderGeometry(.32,.32,.36,36),dark,0,1.18,0);bell.rotation.z=Math.PI/2;addPart(bell,{x:-.12});
  const pad1=makeMesh(new THREE.BoxGeometry(.14,.86,.36),pad,.42,1.18,.31);addPart(pad1,{x:.78,z:.34},true);
  const pad2=makeMesh(new THREE.BoxGeometry(.14,.86,.36),pad,.42,1.18,-.31);addPart(pad2,{x:.78,z:-.34},true);
  const bracket=makeMesh(new THREE.BoxGeometry(.20,1.28,.94),dark,.8,1.18,0);bracket.rotation.z=.09;addPart(bracket,{x:1.22});
  const caliper=makeMesh(new THREE.BoxGeometry(.58,1.38,.88),cal,1.10,1.18,0);caliper.rotation.z=.11;addPart(caliper,{x:1.62},false,.001);
  for(let i=0;i<5;i++){const a=i*Math.PI*2/5;addBolt(0,1.18+Math.cos(a)*.23,Math.sin(a)*.23,{x:.38});}
}
function buildBattery(){
  stage('12V battery');
  const shell=m(0x202a34,.08,.64),top=m(0x0e151e,.08,.5),plate=m(0x7c8791,.62,.33);
  const body=makeMesh(new THREE.BoxGeometry(2.45,1.26,1.62),shell,0,1.08,0);addPart(body,{x:-.35});
  const cover=makeMesh(new THREE.BoxGeometry(2.30,.17,1.47),top,0,1.81,0);addPart(cover,{y:.63});
  const terminalP=makeMesh(new THREE.CylinderGeometry(.14,.14,.27,24),m(0xc3404a,.56,.24),-.68,1.95,.34);addPart(terminalP,{x:-.4,y:.7},true);
  const terminalN=makeMesh(new THREE.CylinderGeometry(.14,.14,.27,24),m(0xb5bec8,.62,.24),.68,1.95,.34);addPart(terminalN,{x:.4,y:.7});
  for(let i=-2;i<=2;i++){const cell=makeMesh(new THREE.BoxGeometry(.20,1.00,1.22),plate,i*.32,1.08,0);addPart(cell,{x:i*.24,y:.03});}
  const strap=makeMesh(new THREE.BoxGeometry(2.65,.11,.18),m(0x52616f,.32,.43),0,1.53,0);addPart(strap,{z:.48});
}
function buildLamp(){
  stage('Headlamp assembly');
  const housing=makeMesh(new THREE.BoxGeometry(2.45,1.06,.78),m(0x202c38,.2,.43),0,1.25,0);housing.rotation.y=-.1;addPart(housing,{x:-.72});
  const lens=makeMesh(new THREE.BoxGeometry(2.40,.98,.11),glassMaterial(),0,1.25,.43);addPart(lens,{z:1.03});
  const positions=[-.64,.05,.68];
  positions.forEach((x,i)=>{
    const ref=makeMesh(new THREE.CylinderGeometry(i===2?.24:.28,i===2?.38:.45,.34,34),m(0xc1c9d2,.88,.16),x,1.25,.08);
    ref.rotation.x=Math.PI/2;addPart(ref,{z:.44});
  });
  const bulb=makeMesh(new THREE.SphereGeometry(.17,28,20),m(0xffbd46,.08,.18),.68,1.25,.28);addPart(bulb,{x:.55,z:.82},true);
  const ecu=makeMesh(new THREE.BoxGeometry(.64,.44,.18),m(0x394756,.26,.42),-.78,.78,-.15);addPart(ecu,{x:-.42,z:-.45});
}
function buildWiper(){
  stage('Front wiper blade');
  const windscreen=makeMesh(new THREE.BoxGeometry(2.95,1.85,.07),glassMaterial(),0,1.42,-.06);windscreen.rotation.x=-.42;addPart(windscreen,{y:.18,z:-.2});
  const arm=makeMesh(new THREE.BoxGeometry(2.42,.12,.12),m(0x2b3239,.22,.58),0,1.24,.06);arm.rotation.z=.18;arm.rotation.x=-.34;addPart(arm,{y:.28});
  const blade=makeMesh(new THREE.BoxGeometry(2.95,.10,.22),m(0x13181e,.04,.82),.18,.87,.25);blade.rotation.z=-.03;blade.rotation.x=-.34;addPart(blade,{y:-.45,z:.17},true);
  const rubber=makeMesh(new THREE.BoxGeometry(2.77,.04,.07),m(0xc84b55,.04,.74),.18,.80,.31);rubber.rotation.z=-.03;rubber.rotation.x=-.34;addPart(rubber,{y:-.61,z:.26},true);
  const pivot=makeMesh(new THREE.CylinderGeometry(.18,.18,.2,26),m(0xa0aab4,.68,.3),-1.04,1.00,-.02);pivot.rotation.x=Math.PI/2;addPart(pivot,{x:-.34});
}
function filterGroup(width,height,depth,dirty){
  const g=new THREE.Group();
  const frame=makeMesh(new THREE.BoxGeometry(width,height,depth),m(0x2c343d,.14,.56));g.add(frame);
  for(let i=0;i<16;i++){const pleat=makeMesh(new THREE.BoxGeometry(width*.80,.028,depth*1.03),m(dirty?0x8d7b61:0xe7d5aa,.04,.82),0,-height*.41+i*(height*.82/15),0);g.add(pleat);}
  return g;
}
function buildAirFilter(){
  stage('Engine air filter');
  const box=makeMesh(new THREE.BoxGeometry(2.95,1.55,1.88),m(0x222b35,.08,.64),0,1.06,0);addPart(box,{x:-1.00});
  const filter=filterGroup(2.42,1.14,.32,true);filter.position.set(.12,1.06,0);addPart(filter,{x:1.52},true);
  const lid=makeMesh(new THREE.BoxGeometry(3.02,.15,1.95),m(0x101821,.08,.63),0,1.89,0);addPart(lid,{y:.70});
  const clip1=makeMesh(new THREE.BoxGeometry(.17,.38,.09),m(0xa0abb5,.58,.34),1.27,1.18,.97);addPart(clip1,{x:.32});
  const clip2=makeMesh(new THREE.BoxGeometry(.17,.38,.09),m(0xa0abb5,.58,.34),-1.27,1.18,.97);addPart(clip2,{x:-.32});
}
function buildCabinFilter(){
  stage('Cabin / pollen filter');
  const housing=makeMesh(new THREE.BoxGeometry(2.92,1.60,1.15),m(0x2d3741,.08,.58),0,1.05,0);addPart(housing,{x:-1.02});
  const filter=filterGroup(2.50,1.22,.35,true);filter.position.set(.12,1.05,0);addPart(filter,{x:1.52},true);
  const cover=makeMesh(new THREE.BoxGeometry(.18,1.41,1.10),m(0x111922,.08,.6),1.55,1.05,0);addPart(cover,{x:1.08});
  const flow=makeMesh(new THREE.ConeGeometry(.11,.25,4),m(0x3275df,.2,.42),-.48,1.92,.2);flow.rotation.z=-Math.PI/2;addPart(flow,{y:.28});
}
function buildExhaust(){
  stage('Rear exhaust section');
  const pipe=m(0x9aa3ac,.70,.35),dark=m(0x68717a,.55,.39),rust=m(0xb66a47,.27,.58);
  const front=makeMesh(new THREE.CylinderGeometry(.14,.14,1.95,26),pipe,-1.60,1.02,0);front.rotation.z=Math.PI/2;addPart(front,{x:-1.05});
  const cat=makeMesh(new THREE.CylinderGeometry(.34,.34,.84,30),dark,-.45,1.02,0);cat.rotation.z=Math.PI/2;addPart(cat,{x:-.35});
  const mid=makeMesh(new THREE.CylinderGeometry(.14,.14,1.48,26),pipe,.52,1.02,0);mid.rotation.z=Math.PI/2;addPart(mid,{x:.26});
  const silencer=makeMesh(new THREE.CylinderGeometry(.51,.51,1.30,32),rust,1.77,1.02,0);silencer.rotation.z=Math.PI/2;addPart(silencer,{x:1.05},true);
  const tail=makeMesh(new THREE.CylinderGeometry(.13,.13,.82,22),pipe,2.92,1.02,0);tail.rotation.z=Math.PI/2;addPart(tail,{x:1.48});
  const clamp=makeMesh(new THREE.TorusGeometry(.21,.027,10,34),m(0xd4dae0,.38,.27),1.08,1.02,0);clamp.rotation.y=Math.PI/2;addPart(clamp,{x:.56});
}

const moduleBuilders={tyre:buildTyre,brake:buildBrake,battery:buildBattery,lamp:buildLamp,wiper:buildWiper,airFilter:buildAirFilter,cabinFilter:buildCabinFilter,exhaust:buildExhaust};

function markerCanvas(number,severity){
  const c=document.createElement('canvas');c.width=160;c.height=200;
  const ctx=c.getContext('2d');
  const col=severity==='red'?'#d24c58':severity==='amber'?'#d99624':'#2ca273';
  ctx.clearRect(0,0,160,200);
  ctx.fillStyle='rgba(7,15,26,.94)';
  ctx.strokeStyle=col;ctx.lineWidth=6;
  ctx.beginPath();ctx.roundRect(15,15,130,108,28);ctx.fill();ctx.stroke();
  ctx.beginPath();ctx.moveTo(68,123);ctx.lineTo(80,154);ctx.lineTo(92,123);ctx.closePath();ctx.fillStyle='rgba(7,15,26,.94)';ctx.fill();ctx.stroke();
  ctx.fillStyle='#fff';ctx.font='700 40px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(number,80,63);
  ctx.fillStyle=col;ctx.font='800 18px sans-serif';ctx.fillText(severity==='red'?'URGENT':'CHECK',80,100);
  const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;return tex;
}
function addMarker(f,pos,num){
  const s=severityFor(f),col=s==='red'?0xd24c58:s==='amber'?0xd99624:0x2ca273;
  const group=new THREE.Group();group.position.copy(pos);group.userData.findingId=f.id;
  const anchor=makeMesh(new THREE.SphereGeometry(.055,18,14),new THREE.MeshStandardMaterial({color:col,emissive:col,emissiveIntensity:.55}),0,0,0);group.add(anchor);
  const line=makeMesh(new THREE.CylinderGeometry(.012,.012,.22,10),m(0xe3ebf4,.05,.42),0,.12,0);group.add(line);
  const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:markerCanvas(num,s),transparent:true,depthTest:false}));
  sprite.position.set(0,.34,0);sprite.scale.set(.30,.38,.30);group.add(sprite);
  markerRoot.add(group);markers.push(group);
}
function rebuildMarkers(){
  while(markerRoot.children.length) markerRoot.remove(markerRoot.children[0]);
  markers=[];
  const positions={
    'tyre-fl':[-1.20,.58,1.35],
    'brake-rr':[1.14,.60,-1.30],
    'battery':[-.38,1.38,.28],
    'lamp-fr':[1.19,1.02,1.38],
    'wiper-front':[.08,1.48,.64],
    'air-filter':[-.78,1.23,.22],
    'cabin-filter':[.42,1.30,-.16],
    'exhaust':[.48,.35,-1.36]
  };
  state.findings.forEach((f,i)=>{
    const p=positions[f.id]||[0,1,0];
    addMarker(f,new THREE.Vector3(...p),i+1);
  });
}

const loader=new GLTFLoader();
loader.load('./assets/lowpoly_generic_suv.glb',(gltf)=>{
  vehicleModel=gltf.scene;
  vehicleModel.traverse(obj=>{
    if(!obj.isMesh) return;
    obj.castShadow=true;obj.receiveShadow=true;
    if(obj.material){
      const mats=Array.isArray(obj.material)?obj.material:[obj.material];
      const newMats=mats.map(mat=>{
        const name=(mat.name||'').toLowerCase();
        if(name==='body'){
          return new THREE.MeshPhysicalMaterial({color:0x7c8796,metalness:.55,roughness:.28,clearcoat:.65,clearcoatRoughness:.13});
        }
        if(name==='glass'){
          return glassMaterial();
        }
        return mat.clone();
      });
      obj.material=Array.isArray(obj.material)?newMats:newMats[0];
    }
  });
  carGroup.add(vehicleModel);
  const box=new THREE.Box3().setFromObject(vehicleModel);
  const size=box.getSize(new THREE.Vector3());
  const scale=4.8/Math.max(size.x,size.z);
  vehicleModel.scale.setScalar(scale);
  const box2=new THREE.Box3().setFromObject(vehicleModel);
  const center=box2.getCenter(new THREE.Vector3());
  vehicleModel.position.sub(center);
  vehicleModel.position.y-=box2.min.y;
  carGroup.rotation.y=.72;
  rebuildMarkers();
  markerRoot.rotation.y=.72;
  resetVehicleView();
  $('viewerLoading').classList.add('hidden');
},undefined,()=>{
  $('viewerLoading').classList.add('hidden');
  $('viewerError').classList.remove('hidden');
});

function resetVehicleView(){
  moduleRoot.visible=false;
  vehicleRoot.visible=true;
  $('backToVehicle').classList.add('hidden');
  $('viewerModeLabel').textContent='VEHICLE OVERVIEW';
  $('viewerTitle').textContent='Tap an issue to explore it';
  camera.position.set(5.0,2.35,5.6);
  controls.target.set(0,.82,0);
  controls.update();
}
$('backToVehicle').addEventListener('click',resetVehicleView);
$('resetView').addEventListener('click',()=>{
  if(moduleRoot.visible){
    camera.position.set(4.6,2.45,5.35);
    controls.target.set(0,1.02,0);
    controls.update();
  } else resetVehicleView();
});

function showExploded(f){
  clearModule();
  vehicleRoot.visible=false;
  moduleRoot.visible=true;
  $('backToVehicle').classList.remove('hidden');
  $('viewerModeLabel').textContent='EXPLODED COMPONENT';
  $('viewerTitle').textContent=f.title;
  moduleBuilders[f.module]?.();
  explodeStart=performance.now();
  exploding=true;
  camera.position.set(4.6,2.45,5.35);
  controls.target.set(0,1.02,0);
  controls.update();
}

renderer.domElement.addEventListener('pointerdown',e=>{pointerDown={x:e.clientX,y:e.clientY};});
renderer.domElement.addEventListener('pointerup',e=>{
  if(moduleRoot.visible) return;
  if(Math.hypot(e.clientX-pointerDown.x,e.clientY-pointerDown.y)>8) return;
  const rect=renderer.domElement.getBoundingClientRect();
  const mouse=new THREE.Vector2((e.clientX-rect.left)/rect.width*2-1,-((e.clientY-rect.top)/rect.height)*2+1);
  const ray=new THREE.Raycaster();ray.setFromCamera(mouse,camera);
  const hits=ray.intersectObjects(markerRoot.children,true);
  if(!hits.length) return;
  let o=hits[0].object;
  while(o && !o.userData?.findingId) o=o.parent;
  if(o?.userData?.findingId){
    selectedFindingId=o.userData.findingId;
    renderSelected(true);
  }
});

function resizeViewer(){
  const rect=viewer.getBoundingClientRect();
  if(!rect.width||!rect.height) return;
  renderer.setSize(rect.width,rect.height,false);
  camera.aspect=rect.width/rect.height;
  camera.updateProjectionMatrix();
}
window.addEventListener('resize',resizeViewer);
resizeViewer();

function animate(now){
  requestAnimationFrame(animate);

  if(moduleRoot.visible && exploding){
    const p=Math.min(1,(now-explodeStart)/900);
    const ease=1-Math.pow(1-p,3);
    activeParts.forEach((obj,i)=>{
      const base=obj.userData.base,off=obj.userData.offset;
      obj.position.set(base.x+off.x*ease,base.y+off.y*ease,base.z+off.z*ease);
      if(obj.userData.spin) obj.rotation.y+=obj.userData.spin;
      if(obj.userData.highlight && obj.material?.emissive){
        obj.material.emissive.setHex(0x7b1e28);
        obj.material.emissiveIntensity=.12+.08*Math.sin(now*.004+i);
      }
    });
    if(p>=1) exploding=false;
  }

  markers.forEach((mark,i)=>{
    const sprite=mark.children[2];
    if(sprite){
      const pulse=1+Math.sin(now*.0032+i*.6)*.035;
      sprite.scale.set(.30*pulse,.38*pulse,.30*pulse);
    }
  });

  controls.update();
  renderer.render(scene,camera);
}
requestAnimationFrame(animate);

routeTo('dashboard');
renderTechnician();
renderCustomer();
renderCommunications();
