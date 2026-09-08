import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js?v=14';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js?v=14';

const ISSUES = [
  {
    id:'tyre-fl', icon:'◉', component:'Wheel_FL', title:'Front left tyre', location:'Nearside front wheel',
    severity:'red', severityLabel:'Urgent', price:145,
    summary:'The tyre has worn past the legal tread limit.',
    found:'The grooves in this tyre have worn down too far. We measured the tread at 1.3 mm.',
    why:'Those grooves help the tyre grip the road and move water away from underneath it. When they become too shallow, the tyre cannot do that job as effectively.',
    risk:'Grip can be reduced in wet weather and stopping distances can increase. Because the tyre is below the legal minimum, the vehicle should not be used normally until it has been replaced.',
    recommend:'Replace this tyre before normal road use. We would also check the opposite tyre for uneven wear and confirm the tyre pressures.',
    technical:'Technician note: NSF tyre measured at 1.3 mm across the principal grooves. Sample classification: urgent.',
    evidenceTitle:'Tread depth measurement',
    evidenceText:'In production, the technician photo would show the tread gauge so you can see the measurement.'
  },
  {
    id:'brake-rr', icon:'◌', component:'Wheel_RR', hotspot:'brake', title:'Rear right brake pads', location:'Offside rear wheel',
    severity:'amber', severityLabel:'Attention', price:210,
    summary:'The brake pads are getting low and will need replacing soon.',
    found:'The rear brake pads still work, but there is much less friction material left than when they were new.',
    why:'Brake pads are designed to wear down as they slow the car. Once they become thin, there is less material remaining before the metal backing reaches the brake disc.',
    risk:'If they wear too far, braking performance can be affected and the brake discs can also be damaged. That can turn a routine pad replacement into a more expensive repair.',
    recommend:'Plan to replace the rear brake pads soon. They are not shown as an immediate stop-driving issue in this sample.',
    technical:'Technician note: OSR pad approximately 3 mm remaining. Rear axle inspection recommended.',
    evidenceTitle:'Brake pad thickness',
    evidenceText:'A close-up workshop photo could show the remaining pad material beside a reference scale.'
  },
  {
    id:'lamp-fr', icon:'✦', hotspot:'lampFR', title:'Front right headlamp', location:'Offside front lamp',
    severity:'amber', severityLabel:'Attention', price:65,
    summary:'The lamp is working, but its light output is weaker than expected.',
    found:'The front right lamp is producing less light than the other side.',
    why:'Your headlamps help you see the road and help other road users see you. Both sides should provide a clear and balanced light output.',
    risk:'Visibility may be reduced at night or in poor weather, and a lamp fault can become an MOT issue depending on the cause and severity.',
    recommend:'Inspect the bulb, lens and electrical connection and repair the cause of the reduced output.',
    technical:'Technician note: OSF headlamp output visually reduced compared with NSF. Confirm beam pattern during repair.',
    evidenceTitle:'Lamp comparison',
    evidenceText:'A photo showing both lamps switched on would make the difference easy to understand.'
  },
  {
    id:'battery', icon:'⚡', hotspot:'battery', title:'12V battery', location:'Engine bay',
    severity:'amber', severityLabel:'Attention', price:0,
    summary:'The battery is still usable, but its health is starting to decline.',
    found:'The battery health test returned 71%. It is currently starting the vehicle, but it is no longer at full strength.',
    why:'The 12V battery powers the vehicle electronics and provides the energy needed to start the car. Batteries gradually lose capacity as they age.',
    risk:'A weakening battery can eventually cause slow starting or leave the vehicle unable to start, especially during colder weather or after the car has been left standing.',
    recommend:'No replacement is required today in this sample. Retest it at the next service or sooner if starting becomes slower.',
    technical:'Technician note: battery state of health 71% in sample test. Charging system normal. Recommendation: monitor.',
    evidenceTitle:'Battery health test',
    evidenceText:'The production report could show a photo or screenshot of the workshop battery tester result.'
  }
];

// v14: session-only report state; no workshop submissions or forced scrolling.
const $ = id => document.getElementById(id);
const money = value => value === 0 ? 'No charge' : `£${value}`;
const measurements = {
  'tyre-fl': {label:'Tread depth',value:1.3,unit:'mm',max:8,stops:[20,37.5],labels:['Replace','Plan soon','Healthy'],note:'Illustrative tread bands: below 1.6 mm / 1.6–3 mm / above 3 mm.',history:[5.6,4.2,2.8,1.3],parts:['Tyre & worn tread','Wheel rim','Hub'],short:'Tyre'},
  'brake-rr': {label:'Pad material remaining',value:3,unit:'mm',max:12,stops:[16.7,33.3],labels:['Replace','Plan soon','Healthy'],note:'Demo pad bands only; replacement limits depend on the vehicle.',history:[10,7,5,3],parts:['Wheel','Outer pad','Brake disc','Inner pad','Caliper'],short:'Brakes'},
  battery: {label:'Battery state of health',value:71,unit:'%',max:100,stops:[50,75],labels:['Investigate','Monitor','Healthy'],note:'Sample health bands; interpret with the complete battery test.',history:[96,88,79,71],parts:['Battery cover','Cell pack','Battery case','Terminals'],short:'Battery'},
  'lamp-fr': {label:'Relative lamp output',value:62,unit:'%',max:100,stops:[40,80],labels:['Investigate','Reduced','Reference'],note:'Illustrative output relative to the other lamp; not a calibrated beam test.',history:[100,94,80,62],parts:['Clear lens','Reflector','Bulb','Lamp housing'],short:'Headlamp'}
};
const decisions = new Map(), questions = new Map();
let selectedId = ISSUES[0].id, currentFilter = 'all', viewMode = 'overview', engine = null;
const currentIssue = () => ISSUES.find(issue => issue.id === selectedId);
function toast(text){ $('toast').textContent=text; $('toast').classList.add('show'); clearTimeout(toast.timer); toast.timer=setTimeout(()=>$('toast').classList.remove('show'),3000); }
function renderFindings(){
  $('findings').replaceChildren(); $('issueNav').replaceChildren();
  ISSUES.forEach(issue=>{
    const decision=decisions.get(issue.id);
    const nav=document.createElement('button'); nav.type='button'; nav.textContent=measurements[issue.id].short;
    nav.setAttribute('aria-label',`Inspect ${issue.title}`); nav.setAttribute('aria-pressed',String(viewMode==='focus'&&selectedId===issue.id));
    nav.onclick=()=>selectIssue(issue.id); $('issueNav').append(nav);
    if(currentFilter!=='all' && (currentFilter==='approved'?decision!=='approved':issue.severity!==currentFilter))return;
    const button=document.createElement('button'); button.type='button';button.className='finding';button.setAttribute('aria-pressed',String(selectedId===issue.id));
    button.innerHTML=`<span><strong>${issue.title}</strong><small>${money(issue.price)}${decision?` · ${decision==='approved'?'Approved':'Deferred'}`:''}${questions.has(issue.id)?' · Question saved':''}</small></span><span class="severity ${issue.severity}">${issue.severityLabel}</span>`;
    button.onclick=()=>selectIssue(issue.id);$('findings').append(button);
  });
  if(!$('findings').children.length){const p=document.createElement('p');p.textContent='No findings match this filter.';$('findings').append(p);}
}
function renderDetail(){
  const issue=currentIssue(), m=measurements[issue.id];
  for(const [element,field] of Object.entries({detailTitle:'title',detailLocation:'location',detailFound:'found',detailWhy:'why',detailRisk:'risk',detailRecommend:'recommend',technical:'technical',evidenceTitle:'evidenceTitle'}))$(element).textContent=issue[field];
  $('detailSeverity').className=`severity ${issue.severity}`;$('detailSeverity').textContent=issue.severityLabel;$('detailPrice').textContent=money(issue.price);
  $('evidenceText').textContent=`Sample inspection: ${m.label.toLowerCase()} recorded as ${m.value}${m.unit==='%'?'':' '}${m.unit}. ${issue.evidenceText}`;
  $('measureTitle').textContent=m.label;$('measureValue').textContent=`${m.value}${m.unit==='%'?'':' '}${m.unit}`;$('measureNote').textContent=m.note;
  $('gauge').style.background=`linear-gradient(90deg,#db6473 0 ${m.stops[0]}%,#e4b457 ${m.stops[0]}% ${m.stops[1]}%,#63ae96 ${m.stops[1]}%)`;
  $('gauge').setAttribute('aria-label',`${m.label}: ${m.value} ${m.unit}. ${m.note}`);$('gaugePointer').style.left=`${m.value/m.max*100}%`;
  $('gaugeLabels').replaceChildren(...m.labels.map(label=>{const el=document.createElement('span');el.textContent=label;return el;}));
  const points=m.history.map((v,i)=>`${16+i*109},${70-v/m.max*55}`);
  $('historyChart').innerHTML=`<path d="M16 73H344" stroke="#dce3eb"/><polyline points="${points.join(' ')}" fill="none" stroke="#4971a7" stroke-width="2.5"/>${points.map((point,i)=>`<circle cx="${point.split(',')[0]}" cy="${point.split(',')[1]}" r="4" fill="${i===3?'#b77e31':'#4971a7'}"/>`).join('')}`;
  $('historyChart').setAttribute('aria-label',`${m.label} history: ${m.history.join(', ')} ${m.unit}`);
  $('historyValues').innerHTML=m.history.map((value,i)=>`<span><small>${['Mar 2024','Mar 2025','Mar 2026','Today'][i]}</small>${value}${m.unit==='%'?'':' '}${m.unit}</span>`).join('');
  const delta=+(m.value-m.history[2]).toFixed(1);$('historyDelta').textContent=`${delta} ${m.unit==='%'?'points':m.unit} since last visit`;
  const decision=decisions.get(issue.id);$('approve').textContent=decision==='approved'?'Approved ✓':'Approve this work';$('approve').setAttribute('aria-pressed',String(decision==='approved'));
  $('defer').textContent=decision==='deferred'?'Deferred ✓':'Defer for now';$('defer').setAttribute('aria-pressed',String(decision==='deferred'));
  $('ask').textContent=questions.has(issue.id)?'Edit question':'Ask a question';
  $('decisionNote').textContent=`${decision?`${decision==='approved'?'Approved':'Deferred'} in this demo. `:''}${questions.has(issue.id)?'Question saved. ':''}Session only; nothing is sent to the workshop.`;
  const approved=ISSUES.filter(i=>decisions.get(i.id)==='approved');$('approvedTotal').textContent=`£${approved.reduce((s,i)=>s+i.price,0)} approved · ${approved.length} item${approved.length===1?'':'s'}`;
  renderFindings();
}
function renderMode(){
  const focused=viewMode==='focus';$('backVehicle').hidden=!focused;$('explodeControl').hidden=!focused;$('schematicNote').hidden=!focused;
  $('viewMode').textContent=focused?'Exploded part view':'Vehicle overview';$('viewTitle').textContent=focused?currentIssue().title:'Explore your vehicle';
  $('viewHint').textContent=focused?'Drag to rotate. Use the slider to bring the parts together.':'Choose a finding or a coloured marker. Drag to rotate; pinch to zoom.';
  $('viewer').setAttribute('aria-label',focused?`${currentIssue().title}: ${measurements[selectedId].parts.join(', ')}`:'Interactive full vehicle overview');
}
function selectIssue(id){selectedId=id;viewMode='focus';$('explodeRange').value='100';renderDetail();renderMode();engine?.focus(currentIssue());}
function backToVehicle(){viewMode='overview';renderMode();renderFindings();engine?.overview();$('backVehicle').hidden=true;}
$('backVehicle').onclick=()=>{backToVehicle();$('resetView').focus({preventScroll:true});};
$('approve').onclick=()=>{decisions.set(selectedId,'approved');renderDetail();toast('Approval saved in this demo.');};
$('defer').onclick=()=>{decisions.set(selectedId,'deferred');renderDetail();toast('Deferral saved in this demo.');};
let questionIssueId=null;
$('ask').onclick=()=>{questionIssueId=selectedId;$('questionSubject').textContent=currentIssue().title;$('questionText').value=questions.get(selectedId)||'';$('questionDialog').showModal();};
$('cancelQuestion').onclick=()=>$('questionDialog').close();
$('questionForm').onsubmit=e=>{e.preventDefault();const value=$('questionText').value.trim();if(!value){$('questionText').setCustomValidity('Please enter a question.');$('questionText').reportValidity();return;}questions.set(questionIssueId,value);$('questionDialog').close();renderDetail();toast('Question saved locally for this session.');};
$('questionText').oninput=()=>$('questionText').setCustomValidity('');
$('reviewApprovals').onclick=()=>{
  $('reviewList').replaceChildren();
  ISSUES.forEach(issue=>{const row=document.createElement('p');row.textContent=`${issue.title} · ${decisions.get(issue.id)||'No decision'} · ${money(issue.price)}${questions.has(issue.id)?` — Question: ${questions.get(issue.id)}`:''}`;$('reviewList').append(row);});
  $('reviewDialog').showModal();
};
$('closeReview').onclick=()=>$('reviewDialog').close();
document.querySelectorAll('[data-filter]').forEach(button=>button.onclick=()=>{currentFilter=button.dataset.filter;document.querySelectorAll('[data-filter]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));renderFindings();});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!document.querySelector('dialog[open]')&&viewMode==='focus')backToVehicle();});
$('resetView').onclick=()=>engine?.reset();$('toggleRotate').onclick=()=>engine?.toggleRotate();$('explodeRange').oninput=e=>engine?.separate(Number(e.target.value)/100);
renderDetail();renderMode();

function createViewer(){
  const viewer=$('viewer'), scene=new THREE.Scene();scene.background=new THREE.Color(0x0a1220);
  const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;viewer.prepend(renderer.domElement);
  const camera=new THREE.PerspectiveCamera(36,1,.05,100);camera.position.set(5,3.2,6);
  const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.enablePan=false;controls.target.set(0,.8,0);controls.minDistance=2;controls.maxDistance=10;controls.maxPolarAngle=Math.PI*.86;controls.autoRotateSpeed=.7;
  const reduceMotion=matchMedia('(prefers-reduced-motion: reduce)');
  scene.add(new THREE.HemisphereLight(0xd5eaff,0x303044,2.5));
  for(const [position,color,power] of [[[4,6,4],0xfff1df,4],[[-4,3,-2],0xa4c6ff,3]]){const light=new THREE.DirectionalLight(color,power);light.position.set(...position);scene.add(light);}
  const floor=new THREE.Mesh(new THREE.CircleGeometry(3.8,64),new THREE.MeshStandardMaterial({color:0x111e31,roughness:.9}));floor.rotation.x=-Math.PI/2;floor.position.y=.01;scene.add(floor);
  let car=null, bounds=null, module=null, animation=null, carOpacity=1, separation=1, targetSeparation=1;
  const overviewPosition=new THREE.Vector3(5,3.2,6),overviewTarget=new THREE.Vector3(0,.85,0),markers=[],clickables=[],carMaterials=[];
  const markerGroup=new THREE.Group();scene.add(markerGroup);
  function stopRotation(){controls.autoRotate=false;$('toggleRotate').textContent='Rotate';$('toggleRotate').setAttribute('aria-pressed','false');}
  controls.addEventListener('start',()=>{stopRotation();if(animation)animation.cameraEnabled=false;});
  function fadeCar(value){carOpacity=value;if(!car)return;car.visible=value>.015;carMaterials.forEach(({material,opacity,transparent,depthWrite})=>{material.opacity=opacity*value;material.transparent=value<.999||transparent;material.depthWrite=value<.999?false:depthWrite;});}
  function clearModule(){if(!module)return;scene.remove(module.root);module.root.traverse(obj=>{if(obj.isMesh){if(!obj.userData.sharedGeometry)obj.geometry.dispose();const mats=Array.isArray(obj.material)?obj.material:[obj.material];mats.forEach(m=>m.dispose());}});module=null;$('partLabels').replaceChildren();}
  function transition(position,target,opacity,onEnd){animation={start:performance.now(),duration:reduceMotion.matches?0:950,from:camera.position.clone(),to:position.clone(),targetFrom:controls.target.clone(),targetTo:target.clone(),opacityFrom:carOpacity,opacityTo:opacity,cameraEnabled:true,onEnd};}
  function pointFor(issue){
    if(!car||!bounds)return new THREE.Vector3(0,.9,0);
    const wheel=issue.component&&car.getObjectByName(issue.component);if(wheel)return new THREE.Box3().setFromObject(wheel).getCenter(new THREE.Vector3());
    const size=bounds.getSize(new THREE.Vector3());return issue.id==='battery'?new THREE.Vector3(.1,size.y*.75,size.z*.27):new THREE.Vector3(-size.x*.36,size.y*.43,size.z*.45);
  }
  function material(color,extra={}){return new THREE.MeshStandardMaterial({color,roughness:.48,metalness:.25,...extra});}
  function makeModule(issue){
    const root=new THREE.Group(),pieces=[],labels=[];root.position.set(0,1.05,0);scene.add(root);
    function piece(name,geometry,mat,start,end){const mesh=new THREE.Mesh(geometry,mat);root.add(mesh);mesh.position.set(...start);const item={object:mesh,start:new THREE.Vector3(...start),end:new THREE.Vector3(...end)};pieces.push(item);if(name){const label=document.createElement('span');label.className='part-label';label.textContent=name;$('partLabels').append(label);labels.push({label,object:mesh});}return mesh;}
    const metal=()=>material(0xbac7d6,{metalness:.8,roughness:.3}), rubber=()=>material(0x242934,{roughness:.93,metalness:0}), amber=()=>material(0xe5aa43), red=()=>material(0xc65461);
    const torus=(radius,tube)=>new THREE.TorusGeometry(radius,tube,16,64);
    const cylinder=(radius,depth)=>{const geo=new THREE.CylinderGeometry(radius,radius,depth,64);geo.rotateX(Math.PI/2);return geo;};
    const box=(x,y,z)=>new THREE.BoxGeometry(x,y,z);
    if(issue.id==='tyre-fl'){
      const tyre=piece('Tyre · 1.3 mm tread',torus(.48,.145),rubber(),[0,0,0],[0,0,.62]);
      // Raised tread blocks and coloured centre band expose the worn surface.
      for(let i=0;i<44;i++){const tread=new THREE.Mesh(box(.045,.017,.19),rubber());const a=i/44*Math.PI*2;tread.position.set(Math.sin(a)*.62,Math.cos(a)*.62,0);tread.rotation.z=-a;tyre.add(tread);}
      const band=new THREE.Mesh(torus(.613,.012),red());tyre.add(band);
      const rim=piece('Wheel rim',torus(.32,.065),metal(),[0,0,0],[0,0,-.05]);
      for(let i=0;i<5;i++){const spoke=new THREE.Mesh(box(.055,.53,.06),metal());spoke.rotation.z=i*Math.PI/5;rim.add(spoke);}
      piece('Hub',cylinder(.11,.18),metal(),[0,0,-.1],[0,0,-.73]);
    }else if(issue.id==='brake-rr'){
      let reused=false;const wheel=car?.getObjectByName('Wheel_RR');
      if(wheel){
        const clone=wheel.clone(true);wheel.updateWorldMatrix(true,true);wheel.matrixWorld.decompose(clone.position,clone.quaternion,clone.scale);
        clone.traverse(obj=>{if(obj.isMesh){obj.userData.sharedGeometry=true;const copy=m=>{const result=m.clone(),original=carMaterials.find(entry=>entry.material===m);if(original){result.opacity=original.opacity;result.transparent=original.transparent;result.depthWrite=original.depthWrite;}return result;};obj.material=Array.isArray(obj.material)?obj.material.map(copy):copy(obj.material);}});
        const wrap=new THREE.Group();wrap.add(clone);wrap.updateMatrixWorld(true);const b=new THREE.Box3().setFromObject(wrap),c=b.getCenter(new THREE.Vector3()),s=b.getSize(new THREE.Vector3());clone.position.sub(c);wrap.scale.setScalar(1.1/Math.max(s.x,s.y,s.z));wrap.rotation.y=Math.PI/2;
        const carrier=piece('Wheel',box(.01,.01,.01),metal(),[0,0,.2],[0,0,1.25]);carrier.add(wrap);reused=true;
      }
      if(!reused)piece('Wheel',torus(.46,.12),rubber(),[0,0,.2],[0,0,1.25]);
      const disc=piece('Brake disc',cylinder(.4,.065),metal(),[0,0,0],[0,0,-.15]);
      const hub=new THREE.Mesh(cylinder(.14,.13),metal());disc.add(hub);
      for(let i=0;i<16;i++){const hole=new THREE.Mesh(cylinder(.014,.07),rubber());const a=i/16*Math.PI*2;hole.position.set(Math.cos(a)*.32,Math.sin(a)*.32,0);disc.add(hole);}
      piece('Outer pad · 3 mm',box(.17,.37,.04),amber(),[.24,0,.07],[.53,.15,.65]);
      piece('Inner pad',box(.17,.37,.04),amber(),[.24,0,-.07],[.53,.15,-.72]);
      piece('Caliper',box(.25,.51,.22),red(),[.35,0,0],[-.61,.18,-.35]);
    }else if(issue.id==='battery'){
      // An open case, removable cover and six cells reveal the battery structure.
      const base=piece('Battery case',box(1.08,.09,.68),rubber(),[0,-.27,0],[0,-.49,0]);
      for(const [size,pos] of [[[1.08,.46,.04],[0,.25,-.32]],[[.04,.46,.64],[-.52,.25,0]],[[.04,.46,.64],[.52,.25,0]]]){const wall=new THREE.Mesh(box(...size),rubber());wall.position.set(...pos);base.add(wall);}
      const cells=piece('Six-cell pack',box(.01,.01,.01),metal(),[0,0,0],[0,.03,.23]);
      for(let i=0;i<6;i++){const cell=new THREE.Mesh(box(.14,.4,.47),material(i===5?0xd9a948:0x7598b7));cell.position.x=(i-2.5)*.16;cells.add(cell);}
      piece('Battery cover',box(1.12,.085,.7),rubber(),[0,.28,0],[0,.74,0]);
      const terminals=piece('Terminals + / −',box(.01,.01,.01),metal(),[0,.35,0],[0,.94,0]);
      for(const x of [-.38,.38]){const pole=new THREE.Mesh(new THREE.CylinderGeometry(.055,.055,.09,24),material(x<0?0xd36a68:0x8293a9));pole.position.set(x,0,.14);terminals.add(pole);}
    }else{
      piece('Lamp housing',new THREE.SphereGeometry(.46,40,24,0,Math.PI*2,0,Math.PI/2).rotateX(-Math.PI/2),rubber(),[0,0,-.12],[0,0,-.72]);
      const reflector=piece('Reflector',new THREE.ConeGeometry(.38,.25,48,1,true).rotateX(-Math.PI/2),material(0xd4dfeb,{metalness:.95,roughness:.16,side:THREE.DoubleSide}),[0,0,0],[0,0,-.22]);reflector.scale.y=.78;
      piece('Bulb · reduced output',new THREE.SphereGeometry(.095,24,16),material(0xffda86,{emissive:0xffae33,emissiveIntensity:.65}),[0,0,.05],[0,0,.38]);
      const lens=piece('Clear lens',new THREE.SphereGeometry(.43,40,24),material(0xb7d9ef,{transparent:true,opacity:.32,metalness:0,roughness:.13,depthWrite:false}),[0,0,.19],[0,0,.94]);lens.scale.set(1,.78,.15);
    }
    return {root,pieces,labels,origin:pointFor(issue),progress:0};
  }
  function focus(issue){stopRotation();clearModule();module=makeModule(issue);separation=targetSeparation=1;markerGroup.visible=false;controls.minDistance=1.7;
    const target=new THREE.Vector3(0,1.05,0);const distance=viewer.clientWidth/viewer.clientHeight<1?5.1:4.25;
    transition(target.clone().add(new THREE.Vector3(1.3,.68,1.85).normalize().multiplyScalar(distance)),target,0);
  }
  function overview(){stopRotation();markerGroup.visible=true;controls.minDistance=2.9;transition(overviewPosition,overviewTarget,1,clearModule);}
  function reset(){stopRotation();if(viewMode==='focus'){const target=new THREE.Vector3(0,1.05,0),distance=viewer.clientWidth/viewer.clientHeight<1?5.1:4.25;transition(target.clone().add(new THREE.Vector3(1.3,.68,1.85).normalize().multiplyScalar(distance)),target,0);}else transition(overviewPosition,overviewTarget,1);}
  function buildMarkers(){
    ISSUES.forEach(issue=>{const marker=new THREE.Mesh(new THREE.SphereGeometry(.09,20,16),new THREE.MeshBasicMaterial({color:issue.severity==='red'?0xf77583:0xffc657,depthTest:false}));marker.position.copy(pointFor(issue)).add(new THREE.Vector3(0,.18,0));marker.renderOrder=5;marker.userData.issueId=issue.id;markerGroup.add(marker);markers.push(marker);clickables.push(marker);});
    ISSUES.filter(issue=>issue.component).forEach(issue=>car.getObjectByName(issue.component)?.traverse(obj=>{if(obj.isMesh){obj.userData.issueId=issue.id;clickables.push(obj);}}));
  }
  new GLTFLoader().load('./assets/lowpoly_generic_suv.glb?v=14',gltf=>{
    car=gltf.scene;scene.add(car);car.updateMatrixWorld(true);
    // Derive forward from the named axles instead of assuming exporter orientation.
    const front=car.getObjectByName('Wheel_FL'),rear=car.getObjectByName('Wheel_RL');
    if(front&&rear){const a=new THREE.Box3().setFromObject(front).getCenter(new THREE.Vector3()),b=new THREE.Box3().setFromObject(rear).getCenter(new THREE.Vector3());const delta=a.sub(b);const orient=new THREE.Group();scene.remove(car);orient.add(car);scene.add(orient);orient.rotation.y=-Math.atan2(delta.x,delta.z);car=orient;}
    let b=new THREE.Box3().setFromObject(car),size=b.getSize(new THREE.Vector3());car.scale.multiplyScalar(4.3/Math.max(size.x,size.y,size.z));b=new THREE.Box3().setFromObject(car);const center=b.getCenter(new THREE.Vector3());car.position.x-=center.x;car.position.z-=center.z;car.position.y+=.07-b.min.y;car.updateMatrixWorld(true);bounds=new THREE.Box3().setFromObject(car);
    car.traverse(obj=>{if(!obj.isMesh)return;const mats=(Array.isArray(obj.material)?obj.material:[obj.material]).map(original=>{const mat=original.clone();if(mat.name.toLowerCase()==='body'){mat.map=null;mat.color.set(0xaebacb);mat.metalness=.5;mat.roughness=.32;}carMaterials.push({material:mat,opacity:mat.opacity,transparent:mat.transparent,depthWrite:mat.depthWrite});return mat;});obj.material=Array.isArray(obj.material)?mats:mats[0];});
    buildMarkers();$('loading').hidden=true;
    if(viewMode==='focus')focus(currentIssue());else reset();
  },undefined,error=>{console.error('Vehicle model loading failed',error);$('loading').hidden=true;$('viewerError').textContent='Vehicle unavailable. Choose a finding to explore its component illustration.';$('viewerError').hidden=viewMode==='focus';});
  let down=null;const raycaster=new THREE.Raycaster();
  renderer.domElement.addEventListener('pointerdown',e=>{down={x:e.clientX,y:e.clientY,id:e.pointerId};});
  renderer.domElement.addEventListener('pointercancel',()=>{down=null;});
  renderer.domElement.addEventListener('pointerup',e=>{if(!down||down.id!==e.pointerId)return;const moved=Math.hypot(e.clientX-down.x,e.clientY-down.y);down=null;if(moved>7||viewMode!=='overview')return;const rect=renderer.domElement.getBoundingClientRect();raycaster.setFromCamera(new THREE.Vector2((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1),camera);const hit=raycaster.intersectObjects(clickables,false)[0];if(hit)selectIssue(hit.object.userData.issueId);});
  function resize(){const w=viewer.clientWidth,h=viewer.clientHeight;if(!w||!h)return;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();}
  new ResizeObserver(resize).observe(viewer);resize();
  let last=performance.now();
  renderer.setAnimationLoop(now=>{
    const dt=Math.min((now-last)/1000,.05);last=now;
    if(animation){const a=animation,p=a.duration?Math.min(1,(now-a.start)/a.duration):1,e=p*p*(3-2*p);if(a.cameraEnabled){camera.position.lerpVectors(a.from,a.to,e);controls.target.lerpVectors(a.targetFrom,a.targetTo,e);}fadeCar(THREE.MathUtils.lerp(a.opacityFrom,a.opacityTo,e));if(p===1){animation=null;a.onEnd?.();}}
    separation=THREE.MathUtils.damp(separation,targetSeparation,12,dt);
    if(module){
      const goal=viewMode==='focus'?1:0;module.progress=reduceMotion.matches?goal:THREE.MathUtils.damp(module.progress,goal,6,dt);
      module.root.position.lerpVectors(module.origin,new THREE.Vector3(0,1.05,0),module.progress);module.root.scale.setScalar(.18+.82*module.progress);
      module.pieces.forEach(piece=>piece.object.position.lerpVectors(piece.start,piece.end,separation*module.progress));
      module.root.updateMatrixWorld(true);
      module.labels.forEach(({label,object},index)=>{const point=object.getWorldPosition(new THREE.Vector3());point.y+=.18+(index%2)*.12;point.project(camera);label.style.left=`${(point.x*.5+.5)*viewer.clientWidth}px`;label.style.top=`${(-point.y*.5+.5)*viewer.clientHeight}px`;label.hidden=module.progress<.9||point.z>1||point.z< -1||separation<.25;});
    }
    controls.update();renderer.render(scene,camera);
  });
  renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();$('viewerError').textContent='3D view interrupted. Reload the page to restore it. Findings remain available.';$('viewerError').hidden=false;});
  return {focus:issue=>{$('viewerError').hidden=true;$('loading').hidden=true;focus(issue);},overview,reset,separate:value=>{targetSeparation=value;},toggleRotate:()=>{controls.autoRotate=!controls.autoRotate;$('toggleRotate').textContent=controls.autoRotate?'Pause rotation':'Rotate';$('toggleRotate').setAttribute('aria-pressed',String(controls.autoRotate));}};
}
try{engine=createViewer();}catch(error){console.error('3D viewer unavailable',error);$('loading').hidden=true;$('viewerError').textContent='3D is unavailable on this device. All findings, evidence records and choices remain available below.';$('viewerError').hidden=false;$('toggleRotate').disabled=true;$('resetView').disabled=true;$('explodeRange').disabled=true;}

