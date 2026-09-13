
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

// ---------- PREMIUM 3D V8: ASSET-BACKED SERVICE ASSEMBLIES ----------
const viewer=$('viewer'),hotspotLayer=$('hotspotLayer'),scene=new THREE.Scene();
scene.background=new THREE.Color(0x08111b);
scene.fog=new THREE.Fog(0x08111b,12,34);

const camera=new THREE.PerspectiveCamera(31,1,.05,100);
camera.position.set(5.7,2.9,5.9);

const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.06;
renderer.shadowMap.enabled=true;
renderer.shadowMap.type=THREE.PCFSoftShadowMap;
viewer.appendChild(renderer.domElement);

const controls=new OrbitControls(camera,renderer.domElement);
controls.enableDamping=true;
controls.dampingFactor=.075;
controls.minDistance=2.3;
controls.maxDistance=11;
controls.maxPolarAngle=Math.PI/1.95;
controls.target.set(0,1.0,0);

scene.add(new THREE.HemisphereLight(0xeaf2ff,0x09101a,1.55));
const key=new THREE.DirectionalLight(0xfffbf3,3.05);key.position.set(4.8,7,5.4);key.castShadow=true;key.shadow.mapSize.set(2048,2048);scene.add(key);
const fill=new THREE.DirectionalLight(0x7fa8ff,1.15);fill.position.set(-5,3,-3.2);scene.add(fill);
const rim=new THREE.DirectionalLight(0xffffff,1.25);rim.position.set(-3,4.6,5.5);scene.add(rim);

const floor=new THREE.Mesh(new THREE.PlaneGeometry(22,22),new THREE.MeshStandardMaterial({color:0x101a28,roughness:.98}));
floor.rotation.x=-Math.PI/2;floor.position.y=-.11;floor.receiveShadow=true;scene.add(floor);

const studioRing=new THREE.Mesh(new THREE.RingGeometry(3.85,3.87,96),new THREE.MeshBasicMaterial({color:0x315483,transparent:true,opacity:.42,side:THREE.DoubleSide}));
studioRing.rotation.x=-Math.PI/2;studioRing.position.y=-.09;scene.add(studioRing);

const vehicleRoot=new THREE.Group(),carGroup=new THREE.Group(),focusRoot=new THREE.Group(),componentRoot=new THREE.Group();
vehicleRoot.add(carGroup,focusRoot);
scene.add(vehicleRoot,componentRoot);
componentRoot.visible=false;

let vehicleModel=null;
let vehicleMaterials=[];
let hotspotAnchors=new Map();
let hotspotButtons=new Map();
let cameraTween=null;
let pendingComponent=null;
let focusGlow=null;
let componentScene=null;
let componentAnimStart=0;
let componentAnimating=false;
let explodedItems=[];
let maintenancePack=null;
let maintenancePackPromise=null;

const WHITE_BODY=0xf4f6f8, ISSUE_RED=0xd34e5a, ISSUE_AMBER=0xd89725;
const SERVICE_PACK_URL='https://cdn.3dassets.dev/assets/26684/v1/model.glb';

function cloneMaterialDeep(material){
  if(!material)return material;
  if(Array.isArray(material))return material.map(m=>m.clone());
  return material.clone();
}
function whitePaint(){return new THREE.MeshPhysicalMaterial({color:WHITE_BODY,metalness:.30,roughness:.24,clearcoat:.85,clearcoatRoughness:.09})}
function glassMaterial(){return new THREE.MeshPhysicalMaterial({color:0x172638,transparent:true,opacity:.62,roughness:.05,metalness:.02,clearcoat:.85,clearcoatRoughness:.07})}

function boundsOf(root){root.updateMatrixWorld(true);return new THREE.Box3().setFromObject(root)}
function centreAndGround(root,clearance=.14){
  root.updateMatrixWorld(true);
  let box=boundsOf(root);
  const centre=box.getCenter(new THREE.Vector3());
  root.position.x-=centre.x;root.position.z-=centre.z;
  root.updateMatrixWorld(true);
  box=boundsOf(root);
  root.position.y+=(-box.min.y)+clearance;
  root.updateMatrixWorld(true);
}
function fitCameraToObject(root,padding=1.35,angle=.72){
  root.updateMatrixWorld(true);
  const box=boundsOf(root),size=box.getSize(new THREE.Vector3()),centre=box.getCenter(new THREE.Vector3());
  const maxDim=Math.max(size.x,size.y,size.z);
  const fov=THREE.MathUtils.degToRad(camera.fov);
  const distance=(maxDim*.5/Math.tan(fov*.5))*padding;
  const dir=new THREE.Vector3(Math.sin(angle),.36,Math.cos(angle)).normalize();
  camera.position.copy(centre).add(dir.multiplyScalar(distance));
  controls.target.copy(centre);
  controls.update();
}

function normalName(value){return (value||'').toLowerCase().replace(/[_-]+/g,' ')}
function findNodeLike(root,...names){
  let found=null;const terms=names.map(normalName);
  root?.traverse(o=>{if(found)return;const n=normalName(o.name);if(terms.some(t=>n===t||n.includes(t)))found=o});
  return found;
}
function findNodeTokens(root,tokens){
  let found=null;
  root?.traverse(o=>{if(found)return;const n=normalName(o.name);if(tokens.every(t=>n.includes(t.toLowerCase())))found=o});
  return found;
}
function nodeWorldCentre(node){return new THREE.Box3().setFromObject(node).getCenter(new THREE.Vector3())}

function makeAnchor(id,world){
  const a=new THREE.Object3D();a.position.copy(vehicleRoot.worldToLocal(world.clone()));vehicleRoot.add(a);hotspotAnchors.set(id,a);
}
function deriveAnchors(){
  hotspotAnchors.forEach(a=>vehicleRoot.remove(a));hotspotAnchors.clear();
  const fl=findNodeLike(vehicleModel,'Wheel_FL'),rr=findNodeLike(vehicleModel,'Wheel_RR');
  if(fl)makeAnchor('tyre-fl',nodeWorldCentre(fl));
  if(rr)makeAnchor('brake-rr',nodeWorldCentre(rr));
  const box=boundsOf(vehicleModel),size=box.getSize(new THREE.Vector3()),c=box.getCenter(new THREE.Vector3());
  makeAnchor('lamp-fr',new THREE.Vector3(box.max.x-size.x*.13,c.y+size.y*.04,box.max.z-size.z*.05));
  makeAnchor('wiper-front',new THREE.Vector3(c.x,c.y+size.y*.28,box.max.z-size.z*.27));
}

function hotspotColour(f){const s=severityFor(f);return s==='red'?'#d34e5a':s==='amber'?'#d89725':'#2ca273'}
function buildHotspotButtons(){
  hotspotLayer.innerHTML='';hotspotButtons.clear();
  state.findings.filter(f=>VISIBLE_IDS.has(f.id)).forEach(f=>{
    const b=document.createElement('button');
    b.className='vehicle-hotspot';b.type='button';b.dataset.id=f.id;
    b.style.setProperty('--hotspot-colour',hotspotColour(f));
    b.innerHTML=`<span class="hotspot-label"><span>${severityLabel(severityFor(f)).toUpperCase()}</span><strong>${f.title}</strong><small>${f.value} ${f.unit} · select to explore</small></span>`;
    b.addEventListener('click',e=>{e.stopPropagation();selectedFindingId=f.id;renderSelected(true)});
    hotspotLayer.appendChild(b);hotspotButtons.set(f.id,b);
  });
}
function updateHotspots(){
  if(!vehicleRoot.visible||componentRoot.visible){hotspotLayer.style.display='none';return}
  hotspotLayer.style.display='block';
  const rect=viewer.getBoundingClientRect();
  hotspotAnchors.forEach((anchor,id)=>{
    const b=hotspotButtons.get(id);if(!b)return;
    const world=new THREE.Vector3();anchor.getWorldPosition(world);
    const p=world.clone().project(camera),x=(p.x*.5+.5)*rect.width,y=(-p.y*.5+.5)*rect.height;
    const hidden=p.z>1||p.z<-1||x<-30||x>rect.width+30||y<-30||y>rect.height+30;
    b.classList.toggle('occluded',hidden);b.style.left=`${x}px`;b.style.top=`${y}px`;
  });
}
function setHotspotSelection(id=null){hotspotButtons.forEach((b,key)=>{b.classList.toggle('selected',key===id);b.classList.toggle('dim',!!id&&key!==id)})}
function setVehicleFade(opacity){vehicleMaterials.forEach(({mat,baseOpacity,baseTransparent})=>{mat.transparent=opacity<.99?true:baseTransparent;mat.opacity=baseOpacity*opacity;mat.needsUpdate=true})}
function createFocusGlow(world,colour){
  if(focusGlow){focusRoot.remove(focusGlow);focusGlow.geometry?.dispose();focusGlow.material?.dispose()}
  focusGlow=new THREE.Mesh(new THREE.SphereGeometry(.20,28,20),new THREE.MeshBasicMaterial({color:colour,transparent:true,opacity:.16,depthWrite:false,blending:THREE.AdditiveBlending}));
  focusGlow.position.copy(vehicleRoot.worldToLocal(world.clone()));focusRoot.add(focusGlow);
}
function startCameraTween(endPos,endTarget,duration=700,onDone){cameraTween={start:performance.now(),duration,startPos:camera.position.clone(),startTarget:controls.target.clone(),endPos:endPos.clone(),endTarget:endTarget.clone(),onDone}}

function loadServicePack(){
  if(maintenancePack)return Promise.resolve(maintenancePack);
  if(maintenancePackPromise)return maintenancePackPromise;
  maintenancePackPromise=new Promise((resolve,reject)=>{
    new GLTFLoader().load(SERVICE_PACK_URL,gltf=>{
      maintenancePack=gltf.scene;
      maintenancePack.traverse(o=>{if(o.isMesh){o.material=cloneMaterialDeep(o.material);o.castShadow=true;o.receiveShadow=true}});
      resolve(maintenancePack);
    },undefined,reject);
  });
  return maintenancePackPromise;
}
function cleanAssetMaterials(root,accent=false){
  root.traverse(o=>{
    if(!o.isMesh)return;
    const old=Array.isArray(o.material)?o.material[0]:o.material;
    const name=((o.name||'')+' '+(old?.name||'')).toLowerCase();
    let colour=0x8d98a6,metal=.45,rough=.34;
    if(name.includes('rubber')||name.includes('tyre')||name.includes('hose')){colour=0x151a20;metal=.02;rough=.82}
    if(name.includes('plastic')||name.includes('battery')||name.includes('housing')){colour=0x293543;metal=.08;rough=.48}
    if(name.includes('lens')||name.includes('glass')){o.material=glassMaterial();return}
    if(accent){colour=0xcd4551;metal=.18;rough=.38}
    o.material=new THREE.MeshStandardMaterial({color:colour,metalness:metal,roughness:rough});
  });
}
function clonePackAsset(tokens){
  const n=findNodeTokens(maintenancePack,tokens);
  if(!n)return null;
  const c=n.clone(true);
  c.traverse(o=>{if(o.isMesh)o.material=cloneMaterialDeep(o.material)});
  return c;
}

function createRoundedRectShape(w,h,r){
  const s=new THREE.Shape(),x=-w/2,y=-h/2;
  s.moveTo(x+r,y);s.lineTo(x+w-r,y);s.quadraticCurveTo(x+w,y,x+w,y+r);
  s.lineTo(x+w,y+h-r);s.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
  s.lineTo(x+r,y+h);s.quadraticCurveTo(x,y+h,x,y+h-r);
  s.lineTo(x,y+r);s.quadraticCurveTo(x,y,x+r,y);
  return s;
}
function extrudedRounded(w,h,d,r,material){
  const g=new THREE.ExtrudeGeometry(createRoundedRectShape(w,h,r),{depth:d,bevelEnabled:true,bevelSegments:3,steps:1,bevelSize:Math.min(r*.45,.025),bevelThickness:Math.min(d*.18,.02)});
  g.center();const m=new THREE.Mesh(g,material);m.castShadow=true;m.receiveShadow=true;return m;
}

function buildPremiumWiper(){
  const g=new THREE.Group();
  const dark=new THREE.MeshPhysicalMaterial({color:0x161c23,metalness:.42,roughness:.32,clearcoat:.38,clearcoatRoughness:.2});
  const rubber=new THREE.MeshStandardMaterial({color:0x080b0f,metalness:.01,roughness:.92});
  const metal=new THREE.MeshStandardMaterial({color:0x8d99a7,metalness:.82,roughness:.24});
  const red=new THREE.MeshStandardMaterial({color:0xcd4551,metalness:.08,roughness:.5});
  const glass=extrudedRounded(4.1,2.05,.05,.16,new THREE.MeshPhysicalMaterial({color:0x284563,transparent:true,opacity:.22,roughness:.05,metalness:.02,clearcoat:.9}));
  glass.rotation.x=-.35;glass.position.set(0,1.7,-.48);g.add(glass);

  function bladeAssembly(y,z,scale=.95){
    const bg=new THREE.Group();
    const armCurve=new THREE.CatmullRomCurve3([new THREE.Vector3(-1.65,0,0),new THREE.Vector3(-1.0,.18,.02),new THREE.Vector3(-.25,.12,.02),new THREE.Vector3(.55,.02,0)]);
    const arm=new THREE.Mesh(new THREE.TubeGeometry(armCurve,48,.055,10,false),dark);arm.castShadow=true;bg.add(arm);
    const pivot=new THREE.Mesh(new THREE.CylinderGeometry(.16,.16,.20,32),metal);pivot.rotation.x=Math.PI/2;pivot.position.set(-1.65,0,0);pivot.castShadow=true;bg.add(pivot);
    const hinge=new THREE.Mesh(new THREE.CylinderGeometry(.095,.095,.18,28),metal);hinge.rotation.x=Math.PI/2;hinge.position.set(.52,.02,0);bg.add(hinge);
    const carrier=extrudedRounded(2.65,.12,.12,.05,dark);carrier.position.set(1.68,.01,0);carrier.rotation.z=-.04;bg.add(carrier);
    const insert=extrudedRounded(2.82,.045,.055,.018,rubber);insert.position.set(1.72,-.09,.02);insert.rotation.z=-.04;bg.add(insert);
    for(const x of [.72,1.35,2.02,2.60]){const clip=new THREE.Mesh(new THREE.TorusGeometry(.10,.027,10,26,Math.PI),metal);clip.rotation.z=Math.PI/2;clip.position.set(x,.02,.01);bg.add(clip)}
    bg.position.set(-.10,y,z);bg.scale.setScalar(scale);return bg;
  }

  const left=bladeAssembly(1.22,.12,1.0),right=bladeAssembly(.78,.38,.82);
  left.userData.explodeFrom=left.position.clone();left.userData.explodeTo=left.position.clone().add(new THREE.Vector3(-.25,.72,.55));
  right.userData.explodeFrom=right.position.clone();right.userData.explodeTo=right.position.clone().add(new THREE.Vector3(.30,.22,1.0));
  g.add(left,right);

  const worn=extrudedRounded(1.3,.045,.058,.018,red);worn.position.set(1.5,2.27,.76);worn.rotation.z=-.04;worn.userData.pulse=true;g.add(worn);
  return g;
}
function buildPremiumCabinFilter(){
  const g=new THREE.Group();
  const frameMat=new THREE.MeshPhysicalMaterial({color:0x263442,metalness:.08,roughness:.48,clearcoat:.2});
  const paperMat=new THREE.MeshStandardMaterial({color:0xd5c6a7,metalness:.01,roughness:.82});
  const issueMat=new THREE.MeshStandardMaterial({color:0xb67a43,metalness:.01,roughness:.88});
  const housing=extrudedRounded(3.4,1.85,.65,.14,frameMat);housing.position.set(-.55,1.25,0);housing.userData.explodeFrom=housing.position.clone();housing.userData.explodeTo=housing.position.clone().add(new THREE.Vector3(-1.0,0,0));g.add(housing);
  const filter=new THREE.Group();filter.position.set(.55,1.25,0);
  const outer=extrudedRounded(2.75,1.35,.26,.08,frameMat);filter.add(outer);
  for(let i=0;i<22;i++){const x=-1.12+i*(2.24/21);const p=new THREE.Mesh(new THREE.BoxGeometry(.045,1.12,.30),i>15?issueMat:paperMat);p.position.set(x,0,0);p.rotation.z=(i%2?.08:-.08);filter.add(p)}
  filter.userData.explodeFrom=filter.position.clone();filter.userData.explodeTo=filter.position.clone().add(new THREE.Vector3(1.3,.15,.25));g.add(filter);
  return g;
}

function clearComponentScene(){
  if(!componentScene)return;
  componentRoot.remove(componentScene);
  componentScene.traverse(o=>{if(o.material)(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>m.dispose?.())});
  componentScene=null;explodedItems=[];
}
function addExplodeItem(obj,from,to){obj.userData.explodeFrom=from.clone();obj.userData.explodeTo=to.clone();obj.position.copy(from);explodedItems.push(obj)}
function addContextCar(group,opacity=.07){
  const clone=vehicleModel.clone(true);
  clone.traverse(o=>{if(!o.isMesh)return;o.material=cloneMaterialDeep(o.material);const mats=Array.isArray(o.material)?o.material:[o.material];mats.forEach(m=>{if(m.color)m.color.setHex(0x7c8b9d);m.transparent=true;m.opacity=opacity;m.depthWrite=false})});
  clone.scale.setScalar(.44);clone.rotation.y=.68;clone.position.set(-2.5,.18,-.7);group.add(clone);
}

async function buildAssembly(f){
  clearComponentScene();
  const group=new THREE.Group();
  addContextCar(group,.07);

  let usedPack=false;
  try{await loadServicePack();usedPack=true}catch{}

  if(f.id==='tyre-fl'){
    const source=findNodeLike(vehicleModel,'Wheel_FL');
    if(source){
      const wheel=source.clone(true);wheel.traverse(o=>{if(o.isMesh)o.material=cloneMaterialDeep(o.material)});cleanAssetMaterials(wheel,false);wheel.scale.setScalar(1.65);group.add(wheel);addExplodeItem(wheel,new THREE.Vector3(-.35,1.25,.1),new THREE.Vector3(-1.05,1.35,.25));
      const hub=usedPack?clonePackAsset(['brake','disc','hub']):null;
      if(hub){cleanAssetMaterials(hub,true);hub.scale.setScalar(2.2);group.add(hub);addExplodeItem(hub,new THREE.Vector3(.40,1.25,.1),new THREE.Vector3(.82,1.25,.2))}
    }
  }else if(f.id==='brake-rr'){
    const disc=usedPack?clonePackAsset(['brake','disc','hub']):null;
    const caliper=usedPack?clonePackAsset(['brake','caliper']):null;
    const wheel=usedPack?clonePackAsset(['offroad','wheel']):null;
    if(wheel){cleanAssetMaterials(wheel,false);wheel.scale.setScalar(2.15);group.add(wheel);addExplodeItem(wheel,new THREE.Vector3(-.8,1.25,0),new THREE.Vector3(-1.55,1.3,0))}
    if(disc){cleanAssetMaterials(disc,false);disc.scale.setScalar(2.4);group.add(disc);addExplodeItem(disc,new THREE.Vector3(.05,1.25,0),new THREE.Vector3(.0,1.25,0))}
    if(caliper){cleanAssetMaterials(caliper,true);caliper.scale.setScalar(2.6);group.add(caliper);addExplodeItem(caliper,new THREE.Vector3(.55,1.28,.12),new THREE.Vector3(1.35,1.45,.35))}
  }else if(f.id==='battery'){
    const battery=usedPack?clonePackAsset(['vehicle','battery']):null;
    const tray=usedPack?clonePackAsset(['battery','tray']):null;
    const clamp=usedPack?clonePackAsset(['battery','terminal','clamp']):null;
    if(battery){cleanAssetMaterials(battery,false);battery.scale.setScalar(5.0);group.add(battery);addExplodeItem(battery,new THREE.Vector3(0,1.15,0),new THREE.Vector3(0,1.25,0))}
    if(tray){cleanAssetMaterials(tray,false);tray.scale.setScalar(5.0);group.add(tray);addExplodeItem(tray,new THREE.Vector3(0,.65,0),new THREE.Vector3(0,.38,0))}
    if(clamp){cleanAssetMaterials(clamp,true);clamp.scale.setScalar(5.0);group.add(clamp);addExplodeItem(clamp,new THREE.Vector3(.55,1.85,.15),new THREE.Vector3(1.25,2.15,.35))}
  }else if(f.id==='lamp-fr'){
    const lamp=usedPack?clonePackAsset(['headlight','housing']):null;
    if(lamp){cleanAssetMaterials(lamp,true);lamp.scale.setScalar(4.2);group.add(lamp);addExplodeItem(lamp,new THREE.Vector3(0,1.25,0),new THREE.Vector3(.35,1.45,.5))}
  }else if(f.id==='air-filter'){
    const af=usedPack?clonePackAsset(['air','filter','housing']):null;
    if(af){cleanAssetMaterials(af,true);af.scale.setScalar(4.0);group.add(af);addExplodeItem(af,new THREE.Vector3(0,1.15,0),new THREE.Vector3(.55,1.35,.35))}
  }else if(f.id==='exhaust'){
    const ex=usedPack?clonePackAsset(['exhaust','silencer']):null;
    if(ex){cleanAssetMaterials(ex,true);ex.scale.setScalar(3.6);group.add(ex);addExplodeItem(ex,new THREE.Vector3(0,1.1,0),new THREE.Vector3(.65,1.25,.45))}
  }else if(f.id==='wiper-front'){
    const w=buildPremiumWiper();group.add(w);w.children.forEach(c=>{if(c.userData.explodeFrom)explodedItems.push(c)});
  }else if(f.id==='cabin-filter'){
    const cf=buildPremiumCabinFilter();group.add(cf);cf.children.forEach(c=>{if(c.userData.explodeFrom)explodedItems.push(c)});
  }

  if(group.children.length<=1){
    const fallback=buildPremiumWiper();fallback.scale.setScalar(.8);group.add(fallback);
  }

  componentRoot.add(group);componentScene=group;centreAndGround(group,.16);
  componentAnimStart=performance.now();componentAnimating=true;
  return group;
}

function focusFinding(f){
  if(!VISIBLE_IDS.has(f.id)||!hotspotAnchors.has(f.id)){showComponentScene(f);return}
  const anchor=hotspotAnchors.get(f.id),world=new THREE.Vector3();anchor.getWorldPosition(world);
  setHotspotSelection(f.id);createFocusGlow(world,severityFor(f)==='red'?ISSUE_RED:ISSUE_AMBER);
  $('focusBannerTitle').textContent=f.title;$('focusBannerValue').textContent=`${f.value} ${f.unit} · ${severityLabel(severityFor(f))}`;
  $('focusBanner').classList.remove('hidden');$('viewerModeLabel').textContent='COMPONENT FOCUS';$('viewerTitle').textContent=f.title;$('backToVehicle').classList.remove('hidden');
  controls.enabled=false;
  const carCentre=new THREE.Vector3(0,1,0),outward=world.clone().sub(carCentre).normalize(),side=new THREE.Vector3(outward.z,0,-outward.x).normalize().multiplyScalar(1.55);
  const camPos=world.clone().add(side).add(new THREE.Vector3(0,1.0,0)).add(outward.multiplyScalar(2.35));
  startCameraTween(camPos,world.clone().add(new THREE.Vector3(0,.12,0)),700,()=>{setVehicleFade(.42);pendingComponent={f,at:performance.now()+230}});
}

async function showComponentScene(f){
  pendingComponent=null;cameraTween=null;
  $('viewerLoading').classList.remove('hidden');
  const loadingText=$('viewerLoading').querySelector('strong');if(loadingText)loadingText.textContent='Loading service assembly…';
  try{await buildAssembly(f)}finally{$('viewerLoading').classList.add('hidden')}
  vehicleRoot.visible=false;componentRoot.visible=true;hotspotLayer.style.display='none';
  $('focusBanner').classList.add('hidden');$('explodedCaption').classList.remove('hidden');$('explodedCaptionTitle').textContent=f.title;
  $('explodedCaptionSub').textContent=(f.id==='wiper-front'||f.id==='cabin-filter'?'Detailed DriveWell service assembly':'Asset-backed service component assembly')+' · rotate to explore';
  $('backToVehicle').classList.remove('hidden');$('viewerModeLabel').textContent='SERVICE ASSEMBLY';$('viewerTitle').textContent=f.title;
  controls.enabled=true;fitCameraToObject(componentScene,1.28,.80);
}

function resetVehicleView(){
  pendingComponent=null;cameraTween=null;componentRoot.visible=false;vehicleRoot.visible=true;setVehicleFade(1);setHotspotSelection();
  $('focusBanner').classList.add('hidden');$('explodedCaption').classList.add('hidden');$('backToVehicle').classList.add('hidden');$('viewerModeLabel').textContent='VEHICLE OVERVIEW';$('viewerTitle').textContent='Choose a highlighted area';
  controls.enabled=true;camera.position.set(5.7,2.9,5.9);controls.target.set(0,1.05,0);controls.update();
  if(focusGlow){focusRoot.remove(focusGlow);focusGlow=null}
}
$('backToVehicle').addEventListener('click',resetVehicleView);
$('resetView').addEventListener('click',()=>{if(componentRoot.visible&&componentScene)fitCameraToObject(componentScene,1.28,.80);else resetVehicleView()});

const loader=new GLTFLoader();
loader.load('./assets/lowpoly_generic_suv.glb',gltf=>{
  vehicleModel=gltf.scene;
  vehicleModel.traverse(o=>{
    if(!o.isMesh)return;o.castShadow=true;o.receiveShadow=true;
    const name=(o.name||'').toLowerCase();
    if(name.includes('body'))o.material=whitePaint();
    else if(name.includes('glass'))o.material=glassMaterial();
    else if(o.material)o.material=cloneMaterialDeep(o.material);
    (Array.isArray(o.material)?o.material:[o.material]).forEach(m=>vehicleMaterials.push({mat:m,baseOpacity:m.opacity??1,baseTransparent:!!m.transparent}));
  });
  carGroup.add(vehicleModel);
  const raw=boundsOf(vehicleModel),size=raw.getSize(new THREE.Vector3()),scale=6.0/Math.max(size.x,size.z);
  vehicleModel.scale.setScalar(scale);centreAndGround(vehicleModel,.13);
  carGroup.rotation.y=.68;vehicleRoot.updateMatrixWorld(true);
  deriveAnchors();buildHotspotButtons();resetVehicleView();$('viewerLoading').classList.add('hidden');
  loadServicePack().catch(()=>{});
},undefined,()=>{$('viewerLoading').classList.add('hidden');$('viewerError').classList.remove('hidden')});

function resizeViewer(){
  const r=viewer.getBoundingClientRect();if(!r.width||!r.height)return;
  renderer.setSize(r.width,r.height,false);camera.aspect=r.width/r.height;camera.updateProjectionMatrix();updateHotspots();
}
window.addEventListener('resize',resizeViewer);resizeViewer();

function animate(now){
  requestAnimationFrame(animate);
  if(cameraTween){
    const p=Math.min(1,(now-cameraTween.start)/cameraTween.duration),e=1-Math.pow(1-p,3);
    camera.position.lerpVectors(cameraTween.startPos,cameraTween.endPos,e);controls.target.lerpVectors(cameraTween.startTarget,cameraTween.endTarget,e);
    if(p>=1){const done=cameraTween.onDone;cameraTween=null;done?.()}
  }
  if(pendingComponent&&now>=pendingComponent.at){const f=pendingComponent.f;pendingComponent=null;showComponentScene(f)}
  if(componentRoot.visible&&componentAnimating&&componentScene){
    const p=Math.min(1,(now-componentAnimStart)/900),e=1-Math.pow(1-p,3);
    explodedItems.forEach(o=>{const a=o.userData.explodeFrom,b=o.userData.explodeTo;if(a&&b)o.position.lerpVectors(a,b,e)});
    if(p>=1)componentAnimating=false;
  }
  componentScene?.traverse(o=>{if(o.userData.pulse&&o.material){const s=1+Math.sin(now*.005)*.07;o.scale.setScalar(s)}});
  if(focusGlow){const s=1+Math.sin(now*.005)*.08;focusGlow.scale.setScalar(s);focusGlow.material.opacity=.14+.04*Math.sin(now*.004)}
  controls.update();updateHotspots();renderer.render(scene,camera);
}
requestAnimationFrame(animate);

routeTo('dashboard');renderTechnician();renderCustomer();renderCommunications();
