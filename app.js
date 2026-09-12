
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

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
function severityFor(f){if(f.direction==='lowBad'){if(f.value<=f.red)return'red';if(f.value<=f.amber)return'amber';return'green'}if(f.value>=f.red)return'red';if(f.value>=f.amber)return'amber';return'green'}
const severityLabel=s=>s==='red'?'Urgent':s==='amber'?'Attention':'Healthy';
function recommendationText(f){const s=severityFor(f);if(s==='red')return`${f.recommendation}. This item needs dealing with before normal use.`;if(s==='amber')return`${f.recommendation}. It is not shown as an immediate stop-driving issue, but it should be planned.`;return'No action is currently required beyond routine monitoring.'}
function toast(text){const e=$('toast');e.textContent=text;e.classList.add('show');clearTimeout(toast.t);toast.t=setTimeout(()=>e.classList.remove('show'),2000)}
function routeTo(route){document.querySelectorAll('.route').forEach(r=>r.classList.toggle('active',r.id===`route-${route}`));document.querySelectorAll('.nav-button').forEach(n=>n.classList.toggle('active',n.dataset.route===route));$('pageTitle').textContent={dashboard:'Manager Dashboard',inspection:'Technician Inspection',report:'Vehicle Health Report',communications:'Communications & Approvals'}[route]||'DriveWell';if(route==='dashboard')renderDashboard();if(route==='inspection')renderTechnician();if(route==='report'){renderCustomer();requestAnimationFrame(resizeViewer)}if(route==='communications')renderCommunications()}
document.querySelectorAll('[data-route]').forEach(b=>b.addEventListener('click',()=>routeTo(b.dataset.route)));

function renderDashboard(){$('urgentCount').textContent=state.findings.filter(f=>severityFor(f)==='red').length;$('attentionCount').textContent=state.findings.filter(f=>severityFor(f)==='amber').length;const a=Object.values(state.decisions).filter(d=>d.action==='approved').length;$('reportState').textContent=a?`${a} item${a===1?'':'s'} approved`:'Awaiting decision'}
function techButton(f){const s=severityFor(f);return`<button class="tech-component ${f.id===selectedTechId?'active':''}" data-tech="${f.id}" type="button"><span class="tech-component-icon">${f.icon}</span><span><strong>${f.title}</strong><small>${f.value} ${f.unit} · ${f.condition}</small></span><span class="severity ${s}">${severityLabel(s)}</span></button>`}
function renderTechnician(){$('techComponentList').innerHTML=state.findings.map(techButton).join('');document.querySelectorAll('[data-tech]').forEach(b=>b.addEventListener('click',()=>{selectedTechId=b.dataset.tech;renderTechnician()}));const f=findingById(selectedTechId),s=severityFor(f);$('techCategory').textContent=f.category;$('techTitle').textContent=f.title;$('techLocation').textContent=f.location;$('techAutoSeverity').className=`severity ${s}`;$('techAutoSeverity').textContent=`${severityLabel(s)} · automatic`;$('measurementFieldLabel').textContent=f.measurementLabel;$('techMeasurement').value=f.value;$('techUnit').textContent=f.unit;$('techCondition').value=f.condition;$('techRecommendation').value=f.recommendation;$('techNote').value=f.note||'';$('techModuleName').textContent=MODULE_LABELS[f.module];$('evidenceFileName').textContent=f.evidenceName||'No additional evidence selected';$('captureProgress').textContent=`${state.findings.length} / ${state.findings.length}`;$('captureSaved').textContent=''}
$('techMeasurement').addEventListener('input',()=>{const f={...findingById(selectedTechId),value:Number($('techMeasurement').value)},s=severityFor(f);$('techAutoSeverity').className=`severity ${s}`;$('techAutoSeverity').textContent=`${severityLabel(s)} · automatic`});
$('evidenceInput').addEventListener('change',e=>{const file=e.target.files[0];if(!file)return;evidenceUrls[selectedTechId]=URL.createObjectURL(file);$('evidenceFileName').textContent=file.name});
$('saveFinding').addEventListener('click',()=>{const f=findingById(selectedTechId);f.value=Number($('techMeasurement').value);f.condition=$('techCondition').value;f.recommendation=$('techRecommendation').value;f.note=$('techNote').value.trim();const file=$('evidenceInput').files[0];if(file)f.evidenceName=file.name;persist();$('captureSaved').textContent='Saved · customer report updated';toast(`${f.title} saved`);renderTechnician()});

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

// ---------- PREMIUM 3D V6: REAL VEHICLE GEOMETRY ----------
const viewer=$('viewer'),hotspotLayer=$('hotspotLayer'),scene=new THREE.Scene();
scene.background=new THREE.Color(0x08111b);
scene.fog=new THREE.Fog(0x08111b,11,30);

const camera=new THREE.PerspectiveCamera(31,1,.05,100);
camera.position.set(5.7,2.8,5.9);

const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.05;
renderer.shadowMap.enabled=true;
renderer.shadowMap.type=THREE.PCFSoftShadowMap;
viewer.appendChild(renderer.domElement);

const controls=new OrbitControls(camera,renderer.domElement);
controls.enableDamping=true;
controls.dampingFactor=.075;
controls.minDistance=2.5;
controls.maxDistance=10;
controls.maxPolarAngle=Math.PI/1.95;
controls.target.set(0,1.0,0);

scene.add(new THREE.HemisphereLight(0xeaf2ff,0x09101a,1.5));
const key=new THREE.DirectionalLight(0xfffbf3,2.9);
key.position.set(4.8,6.8,5.4);key.castShadow=true;key.shadow.mapSize.set(2048,2048);scene.add(key);
const fill=new THREE.DirectionalLight(0x7fa8ff,1.1);fill.position.set(-5,3,-3.2);scene.add(fill);
const rim=new THREE.DirectionalLight(0xffffff,1.2);rim.position.set(-3,4.6,5.5);scene.add(rim);

const floor=new THREE.Mesh(
  new THREE.PlaneGeometry(22,22),
  new THREE.MeshStandardMaterial({color:0x101a28,roughness:.98})
);
floor.rotation.x=-Math.PI/2;
floor.position.y=-.08;
floor.receiveShadow=true;
scene.add(floor);

const studioRing=new THREE.Mesh(
  new THREE.RingGeometry(3.75,3.77,96),
  new THREE.MeshBasicMaterial({color:0x315483,transparent:true,opacity:.42,side:THREE.DoubleSide})
);
studioRing.rotation.x=-Math.PI/2;
studioRing.position.y=-.065;
scene.add(studioRing);

const vehicleRoot=new THREE.Group();
const carGroup=new THREE.Group();
const focusRoot=new THREE.Group();
const componentRoot=new THREE.Group();
vehicleRoot.add(carGroup,focusRoot);
scene.add(vehicleRoot,componentRoot);
componentRoot.visible=false;

let vehicleModel=null;
let vehicleMaterials=[];
let hotspotAnchors=new Map();
let hotspotButtons=new Map();
let selectedVisualId=null;
let cameraTween=null;
let pendingComponent=null;
let focusGlow=null;
let componentScene=null;
let componentExplodeStart=0;
let componentAnimating=false;

const WHITE_BODY=0xf4f6f8;
const ISSUE_RED=0xd34e5a;
const ISSUE_AMBER=0xd89725;

function cloneMaterial(material){
  if(!material)return material;
  if(Array.isArray(material))return material.map(m=>m.clone());
  return material.clone();
}

function makeWhitePaint(){
  return new THREE.MeshPhysicalMaterial({
    color:WHITE_BODY,
    metalness:.32,
    roughness:.26,
    clearcoat:.82,
    clearcoatRoughness:.1
  });
}

function realGlass(){
  return new THREE.MeshPhysicalMaterial({
    color:0x172638,
    transparent:true,
    opacity:.62,
    roughness:.06,
    metalness:.02,
    clearcoat:.8,
    clearcoatRoughness:.08
  });
}

function visibleBounds(root){
  const box=new THREE.Box3();
  const tmp=new THREE.Box3();
  let has=false;
  root.updateMatrixWorld(true);
  root.traverse(o=>{
    if(!o.isMesh||!o.visible||!o.geometry)return;
    if(!o.geometry.boundingBox)o.geometry.computeBoundingBox();
    tmp.copy(o.geometry.boundingBox).applyMatrix4(o.matrixWorld);
    if(!has){box.copy(tmp);has=true}else box.union(tmp);
  });
  return has?box:null;
}

function groundRoot(root,clearance=.08){
  root.updateMatrixWorld(true);
  const box=visibleBounds(root);
  if(!box)return;
  root.position.y+=(-box.min.y)+clearance;
  root.updateMatrixWorld(true);
}

function findNodeLike(...names){
  let found=null;
  vehicleModel?.traverse(o=>{
    if(found)return;
    const n=(o.name||'').toLowerCase();
    if(names.some(x=>n===x.toLowerCase()||n.includes(x.toLowerCase())))found=o;
  });
  return found;
}

function nodeWorldCentre(node){
  return new THREE.Box3().setFromObject(node).getCenter(new THREE.Vector3());
}

function makeAnchor(id,world){
  const anchor=new THREE.Object3D();
  anchor.position.copy(vehicleRoot.worldToLocal(world.clone()));
  vehicleRoot.add(anchor);
  hotspotAnchors.set(id,anchor);
}

function deriveAnchors(){
  hotspotAnchors.forEach(a=>vehicleRoot.remove(a));
  hotspotAnchors.clear();

  const fl=findNodeLike('Wheel_FL');
  const rr=findNodeLike('Wheel_RR');
  if(fl)makeAnchor('tyre-fl',nodeWorldCentre(fl));
  if(rr)makeAnchor('brake-rr',nodeWorldCentre(rr));

  const box=new THREE.Box3().setFromObject(vehicleModel);
  const min=box.min,max=box.max,size=box.getSize(new THREE.Vector3()),c=box.getCenter(new THREE.Vector3());

  makeAnchor('lamp-fr',new THREE.Vector3(max.x-size.x*.13,c.y+size.y*.05,max.z-size.z*.055));
  makeAnchor('wiper-front',new THREE.Vector3(c.x,c.y+size.y*.29,max.z-size.z*.27));
}

function hotspotColour(f){
  const s=severityFor(f);
  return s==='red'?'#d34e5a':s==='amber'?'#d89725':'#2ca273';
}

function buildHotspotButtons(){
  hotspotLayer.innerHTML='';
  hotspotButtons.clear();

  state.findings.filter(f=>VISIBLE_IDS.has(f.id)).forEach(f=>{
    const b=document.createElement('button');
    b.className='vehicle-hotspot';
    b.type='button';
    b.dataset.id=f.id;
    b.style.setProperty('--hotspot-colour',hotspotColour(f));
    b.innerHTML=`<span class="hotspot-label"><span>${severityLabel(severityFor(f)).toUpperCase()}</span><strong>${f.title}</strong><small>${f.value} ${f.unit} · select to explore</small></span>`;
    b.addEventListener('click',e=>{
      e.stopPropagation();
      selectedFindingId=f.id;
      renderSelected(true);
    });
    hotspotLayer.appendChild(b);
    hotspotButtons.set(f.id,b);
  });
}

function updateHotspots(){
  if(!vehicleRoot.visible||componentRoot.visible){
    hotspotLayer.style.display='none';
    return;
  }
  hotspotLayer.style.display='block';
  const rect=viewer.getBoundingClientRect();

  hotspotAnchors.forEach((anchor,id)=>{
    const btn=hotspotButtons.get(id);
    if(!btn)return;

    const world=new THREE.Vector3();
    anchor.getWorldPosition(world);
    const p=world.clone().project(camera);
    const x=(p.x*.5+.5)*rect.width;
    const y=(-p.y*.5+.5)*rect.height;
    const hidden=p.z>1||p.z<-1||x<-30||x>rect.width+30||y<-30||y>rect.height+30;

    btn.classList.toggle('occluded',hidden);
    btn.style.left=`${x}px`;
    btn.style.top=`${y}px`;
  });
}

function setHotspotSelection(id=null){
  hotspotButtons.forEach((b,key)=>{
    b.classList.toggle('selected',key===id);
    b.classList.toggle('dim',!!id&&key!==id);
  });
}

function createFocusGlow(world,colour){
  if(focusGlow){
    focusRoot.remove(focusGlow);
    focusGlow.geometry?.dispose();
    focusGlow.material?.dispose();
  }
  focusGlow=new THREE.Mesh(
    new THREE.SphereGeometry(.27,28,20),
    new THREE.MeshBasicMaterial({
      color:colour,
      transparent:true,
      opacity:.25,
      depthWrite:false,
      blending:THREE.AdditiveBlending
    })
  );
  focusGlow.position.copy(vehicleRoot.worldToLocal(world.clone()));
  focusRoot.add(focusGlow);
}

function setVehicleFade(opacity){
  vehicleMaterials.forEach(({mat,baseOpacity,baseTransparent})=>{
    mat.transparent=opacity<.99?true:baseTransparent;
    mat.opacity=baseOpacity*opacity;
    mat.needsUpdate=true;
  });
}

function startCameraTween(endPos,endTarget,duration=720,onDone){
  cameraTween={
    start:performance.now(),
    duration,
    startPos:camera.position.clone(),
    startTarget:controls.target.clone(),
    endPos:endPos.clone(),
    endTarget:endTarget.clone(),
    onDone
  };
}

function cloneVehicleSection(name){
  const node=findNodeLike(name);
  if(!node)return null;
  const clone=node.clone(true);
  clone.traverse(o=>{
    if(o.isMesh){
      o.material=cloneMaterial(o.material);
      o.castShadow=true;
      o.receiveShadow=true;
    }
  });
  return clone;
}

function tintObject(root,colour,opacity=1,emissive=0){
  root?.traverse(o=>{
    if(!o.isMesh)return;
    const mats=Array.isArray(o.material)?o.material:[o.material];
    mats.forEach(m=>{
      if(m.color)m.color.setHex(colour);
      if('transparent' in m)m.transparent=opacity<1;
      if('opacity' in m)m.opacity=opacity;
      if(m.emissive){
        m.emissive.setHex(colour);
        m.emissiveIntensity=emissive;
      }
    });
  });
}

function clearComponentScene(){
  if(componentScene){
    componentRoot.remove(componentScene);
    componentScene.traverse(o=>{
      if(o.geometry)o.geometry.dispose?.();
      if(o.material)(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>m.dispose?.());
    });
  }
  componentScene=null;
}

function addSection(group,nodeName,offset,ghosted=false,highlight=false){
  const obj=cloneVehicleSection(nodeName);
  if(!obj)return;
  obj.userData.base=obj.position.clone();
  obj.userData.offset=new THREE.Vector3(offset.x||0,offset.y||0,offset.z||0);
  obj.userData.highlight=highlight;
  if(ghosted)tintObject(obj,0x8492a4,.16,0);
  if(highlight)tintObject(obj,0xd34e5a,1,.08);
  group.add(obj);
}

function buildRealComponentScene(f){
  clearComponentScene();
  const g=new THREE.Group();
  g.rotation.y=.68;

  // Real geometry from the loaded vehicle model only.
  // No procedural tyres, brake discs, boxes or fake wipers.
  addSection(g,'Body',{x:0,y:.15,z:0},true,false);
  addSection(g,'Glass',{x:0,y:.7,z:0},true,false);
  addSection(g,'Interior',{x:0,y:1.15,z:0},true,false);
  addSection(g,'Details',{x:0,y:.35,z:.45},true,false);

  const wheelOffsets={
    'Wheel_FL':{x:-1.45,y:.05,z:.65},
    'Wheel_FR':{x:1.0,y:.05,z:.35},
    'Wheel_RL':{x:-.9,y:.05,z:-.65},
    'Wheel_RR':{x:1.25,y:.05,z:-.55}
  };

  Object.entries(wheelOffsets).forEach(([name,offset])=>{
    const isTyre=f.id==='tyre-fl'&&name==='Wheel_FL';
    const isBrake=f.id==='brake-rr'&&name==='Wheel_RR';
    addSection(g,name,offset,!isTyre&&!isBrake,isTyre||isBrake);
  });

  // For items that are not separable meshes in this GLB, use the real full-car
  // geometry as cutaway context and a precise focus glow rather than fake geometry.
  const box=new THREE.Box3().setFromObject(vehicleModel);
  const size=box.getSize(new THREE.Vector3());
  const centre=box.getCenter(new THREE.Vector3());

  const localPoints={
    'lamp-fr':new THREE.Vector3(size.x*.36,size.y*.07,size.z*.43),
    'wiper-front':new THREE.Vector3(0,size.y*.25,size.z*.18),
    'battery':new THREE.Vector3(-size.x*.15,size.y*.18,size.z*.10),
    'air-filter':new THREE.Vector3(size.x*.15,size.y*.18,size.z*.07),
    'cabin-filter':new THREE.Vector3(0,size.y*.20,-size.z*.02),
    'exhaust':new THREE.Vector3(size.x*.18,-size.y*.18,-size.z*.30)
  };

  if(localPoints[f.id]){
    const p=localPoints[f.id].clone().add(new THREE.Vector3(0,1.15,0));
    const colour=severityFor(f)==='red'?ISSUE_RED:ISSUE_AMBER;
    const glow=new THREE.Mesh(
      new THREE.SphereGeometry(.34,28,20),
      new THREE.MeshBasicMaterial({
        color:colour,
        transparent:true,
        opacity:.34,
        depthWrite:false,
        blending:THREE.AdditiveBlending
      })
    );
    glow.position.copy(p);
    glow.userData.base=glow.position.clone();
    glow.userData.offset=new THREE.Vector3(0,.1,.25);
    glow.userData.highlight=true;
    g.add(glow);
  }

  componentRoot.add(g);
  componentScene=g;

  // Centre the actual cloned vehicle geometry above the floor.
  g.updateMatrixWorld(true);
  const bounds=visibleBounds(g);
  if(bounds){
    const c=bounds.getCenter(new THREE.Vector3());
    g.position.x-=c.x;
    g.position.z-=c.z;
    g.position.y+=(-bounds.min.y)+.12;
  }
  g.updateMatrixWorld(true);

  // Capture stable animation bases after centring.
  g.traverse(o=>{
    if(o!==g && !o.userData.base && (o.isMesh||o.type==='Group')){
      o.userData.base=o.position.clone();
      o.userData.offset=o.userData.offset||new THREE.Vector3();
    }
  });

  return g;
}

function focusFinding(f){
  selectedVisualId=f.id;

  if(!VISIBLE_IDS.has(f.id)||!hotspotAnchors.has(f.id)){
    showComponentScene(f);
    return;
  }

  const anchor=hotspotAnchors.get(f.id);
  const world=new THREE.Vector3();
  anchor.getWorldPosition(world);

  setHotspotSelection(f.id);
  createFocusGlow(world,severityFor(f)==='red'?ISSUE_RED:ISSUE_AMBER);

  $('focusBannerTitle').textContent=f.title;
  $('focusBannerValue').textContent=`${f.value} ${f.unit} · ${severityLabel(severityFor(f))}`;
  $('focusBanner').classList.remove('hidden');
  $('viewerModeLabel').textContent='COMPONENT FOCUS';
  $('viewerTitle').textContent=f.title;
  $('backToVehicle').classList.remove('hidden');

  controls.enabled=false;

  const carCentre=new THREE.Vector3(0,1,0);
  const outward=world.clone().sub(carCentre).normalize();
  const side=new THREE.Vector3(outward.z,0,-outward.x).normalize().multiplyScalar(1.6);
  const camPos=world.clone().add(side).add(new THREE.Vector3(0,1.0,0)).add(outward.multiplyScalar(2.4));

  startCameraTween(
    camPos,
    world.clone().add(new THREE.Vector3(0,.12,0)),
    720,
    ()=>{
      setVehicleFade(.4);
      pendingComponent={f,at:performance.now()+260};
    }
  );
}

function showComponentScene(f){
  pendingComponent=null;
  cameraTween=null;

  buildRealComponentScene(f);

  vehicleRoot.visible=false;
  componentRoot.visible=true;
  hotspotLayer.style.display='none';

  $('focusBanner').classList.add('hidden');
  $('explodedCaption').classList.remove('hidden');
  $('explodedCaptionTitle').textContent=f.title;
  $('explodedCaptionSub').textContent=
    (f.id==='tyre-fl'||f.id==='brake-rr')
      ?'Actual wheel geometry separated from the vehicle'
      :'Actual vehicle geometry with the affected area highlighted';

  $('backToVehicle').classList.remove('hidden');
  $('viewerModeLabel').textContent='COMPONENT FOCUS';
  $('viewerTitle').textContent=f.title;

  componentExplodeStart=performance.now();
  componentAnimating=true;
  controls.enabled=true;
  camera.position.set(5.3,3.0,6.2);
  controls.target.set(0,1.3,0);
  controls.update();
}

function resetVehicleView(){
  pendingComponent=null;
  cameraTween=null;
  selectedVisualId=null;

  componentRoot.visible=false;
  vehicleRoot.visible=true;

  setVehicleFade(1);
  setHotspotSelection();

  $('focusBanner').classList.add('hidden');
  $('explodedCaption').classList.add('hidden');
  $('backToVehicle').classList.add('hidden');
  $('viewerModeLabel').textContent='VEHICLE OVERVIEW';
  $('viewerTitle').textContent='Choose a highlighted area';

  controls.enabled=true;
  camera.position.set(5.7,2.8,5.9);
  controls.target.set(0,1.0,0);
  controls.update();

  if(focusGlow){
    focusRoot.remove(focusGlow);
    focusGlow=null;
  }
}

$('backToVehicle').addEventListener('click',resetVehicleView);
$('resetView').addEventListener('click',()=>{
  if(componentRoot.visible){
    camera.position.set(5.3,3.0,6.2);
    controls.target.set(0,1.3,0);
    controls.update();
  }else{
    resetVehicleView();
  }
});

const loader=new GLTFLoader();
loader.load('./assets/lowpoly_generic_suv.glb',gltf=>{
  vehicleModel=gltf.scene;

  vehicleModel.traverse(o=>{
    if(!o.isMesh)return;

    o.castShadow=true;
    o.receiveShadow=true;

    const name=(o.name||'').toLowerCase();

    // Restore the clean white vehicle requested for the demo.
    if(name.includes('body')){
      o.material=makeWhitePaint();
    }else if(name.includes('glass')){
      o.material=realGlass();
    }else if(o.material){
      o.material=cloneMaterial(o.material);
    }

    (Array.isArray(o.material)?o.material:[o.material]).forEach(m=>{
      vehicleMaterials.push({
        mat:m,
        baseOpacity:m.opacity??1,
        baseTransparent:!!m.transparent
      });
    });
  });

  carGroup.add(vehicleModel);

  const rawBox=new THREE.Box3().setFromObject(vehicleModel);
  const size=rawBox.getSize(new THREE.Vector3());
  const scale=6.05/Math.max(size.x,size.z);
  vehicleModel.scale.setScalar(scale);

  const box=new THREE.Box3().setFromObject(vehicleModel);
  const centre=box.getCenter(new THREE.Vector3());

  vehicleModel.position.x-=centre.x;
  vehicleModel.position.z-=centre.z;
  vehicleModel.position.y+=(-box.min.y)+.12;

  carGroup.rotation.y=.68;
  vehicleRoot.updateMatrixWorld(true);

  deriveAnchors();
  buildHotspotButtons();
  resetVehicleView();

  $('viewerLoading').classList.add('hidden');
},undefined,()=>{
  $('viewerLoading').classList.add('hidden');
  $('viewerError').classList.remove('hidden');
});

function resizeViewer(){
  const r=viewer.getBoundingClientRect();
  if(!r.width||!r.height)return;
  renderer.setSize(r.width,r.height,false);
  camera.aspect=r.width/r.height;
  camera.updateProjectionMatrix();
  updateHotspots();
}
window.addEventListener('resize',resizeViewer);
resizeViewer();

function animate(now){
  requestAnimationFrame(animate);

  if(cameraTween){
    const p=Math.min(1,(now-cameraTween.start)/cameraTween.duration);
    const eased=1-Math.pow(1-p,3);
    camera.position.lerpVectors(cameraTween.startPos,cameraTween.endPos,eased);
    controls.target.lerpVectors(cameraTween.startTarget,cameraTween.endTarget,eased);
    if(p>=1){
      const done=cameraTween.onDone;
      cameraTween=null;
      done?.();
    }
  }

  if(pendingComponent&&now>=pendingComponent.at){
    showComponentScene(pendingComponent.f);
  }

  if(componentRoot.visible&&componentAnimating&&componentScene){
    const p=Math.min(1,(now-componentExplodeStart)/850);
    const eased=1-Math.pow(1-p,3);

    componentScene.traverse(o=>{
      if(!o.userData.base||!o.userData.offset)return;
      const b=o.userData.base;
      const d=o.userData.offset;
      o.position.set(
        b.x+d.x*eased,
        b.y+d.y*eased,
        b.z+d.z*eased
      );

      if(o.userData.highlight&&o.material){
        const mats=Array.isArray(o.material)?o.material:[o.material];
        mats.forEach(m=>{
          if(m.emissive){
            m.emissiveIntensity=.08+.06*Math.sin(now*.004);
          }
        });
      }
    });

    if(p>=1)componentAnimating=false;
  }

  if(focusGlow){
    const s=1+Math.sin(now*.005)*.1;
    focusGlow.scale.setScalar(s);
    focusGlow.material.opacity=.20+.06*Math.sin(now*.004);
  }

  controls.update();
  updateHotspots();
  renderer.render(scene,camera);
}

requestAnimationFrame(animate);

routeTo('dashboard');
renderTechnician();
renderCustomer();
renderCommunications();
