import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js?v=15';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js?v=15';

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
  function clearModule(){if(!module)return;scene.remove(module.root);module.root.traverse(obj=>{if(obj.isMesh){if(!obj.userData.sharedGeometry)obj.geometry.dispose();if(obj.isInstancedMesh)obj.dispose();const mats=Array.isArray(obj.material)?obj.material:[obj.material];mats.forEach(m=>m.dispose());}});module=null;$('partLabels').replaceChildren();}
  function transition(position,target,opacity,onEnd){animation={start:performance.now(),duration:reduceMotion.matches?0:950,from:camera.position.clone(),to:position.clone(),targetFrom:controls.target.clone(),targetTo:target.clone(),opacityFrom:carOpacity,opacityTo:opacity,cameraEnabled:true,onEnd};}
  function pointFor(issue){
    if(!car||!bounds)return new THREE.Vector3(0,.9,0);
    const wheel=issue.component&&car.getObjectByName(issue.component);
    const size=bounds.getSize(new THREE.Vector3()),center=bounds.getCenter(new THREE.Vector3());
    // Intersect the actual component surface, rather than a padded scene box.
    // The imported Shadow plane is deliberately excluded from body anchoring.
    let origin,direction,target;
    if(wheel){
      const box=new THREE.Box3().setFromObject(wheel),c=box.getCenter(new THREE.Vector3());
      const side=Math.sign(c.x-center.x)||1;
      origin=c.clone().add(new THREE.Vector3(side*size.x,0,0));direction=new THREE.Vector3(-side,0,0);target=wheel;
    }else if(issue.id==='battery'){
      origin=new THREE.Vector3(center.x,bounds.max.y+1,center.z+size.z*.28);direction=new THREE.Vector3(0,-1,0);target=car.getObjectByName('Body');
    }else{
      const rightWheel=car.getObjectByName('Wheel_FR');
      const side=rightWheel?Math.sign(new THREE.Box3().setFromObject(rightWheel).getCenter(new THREE.Vector3()).x-center.x):-1;
      origin=new THREE.Vector3(center.x+side*size.x*.32,bounds.min.y+size.y*.42,bounds.max.z+1);direction=new THREE.Vector3(0,0,-1);target=car.getObjectByName('Body');
    }
    const ray=new THREE.Raycaster(origin,direction);
    const hit=target&&ray.intersectObject(target,true)[0];
    if(hit)return hit.point.clone().addScaledVector(direction,-.025);
    return wheel?new THREE.Box3().setFromObject(wheel).getCenter(new THREE.Vector3()):center;
  }
  function material(color,extra={}){return new THREE.MeshStandardMaterial({color,roughness:.48,metalness:.25,...extra});}
  function makeModule(issue){
    const root=new THREE.Group(),pieces=[],labels=[];root.position.set(0,1.05,0);scene.add(root);
    function piece(name,geometry,mat,start,end){const mesh=new THREE.Mesh(geometry,mat);root.add(mesh);mesh.position.set(...start);const item={object:mesh,start:new THREE.Vector3(...start),end:new THREE.Vector3(...end)};pieces.push(item);if(name){const label=document.createElement('span');label.className='part-label';label.textContent=name;$('partLabels').append(label);labels.push({label,object:mesh});}return mesh;}
    const metal=()=>material(0xbac7d6,{metalness:.8,roughness:.3}), rubber=()=>material(0x242934,{roughness:.93,metalness:0}), amber=()=>material(0xe5aa43), red=()=>material(0xc65461);
    const torus=(radius,tube)=>new THREE.TorusGeometry(radius,tube,16,64);
    const cylinder=(radius,depth)=>{const geo=new THREE.CylinderGeometry(radius,radius,depth,64);geo.rotateX(Math.PI/2);return geo;};
    const box=(x,y,z)=>new THREE.BoxGeometry(x,y,z);
    // Original reusable parts: centimetre-scale details, no purchased meshes.
    function ring(outer,inner,depth){const shape=new THREE.Shape();shape.absarc(0,0,outer,0,Math.PI*2,false);const hole=new THREE.Path();hole.absarc(0,0,inner,0,Math.PI*2,true);shape.holes.push(hole);const geo=new THREE.ExtrudeGeometry(shape,{depth,bevelEnabled:false,curveSegments:48});geo.translate(0,0,-depth/2);return geo;}
    function rounded(width,height,depth,radius=.035){const s=new THREE.Shape(),x=-width/2,y=-height/2,r=Math.min(radius,width/2,height/2);s.moveTo(x+r,y);s.lineTo(x+width-r,y);s.quadraticCurveTo(x+width,y,x+width,y+r);s.lineTo(x+width,y+height-r);s.quadraticCurveTo(x+width,y+height,x+width-r,y+height);s.lineTo(x+r,y+height);s.quadraticCurveTo(x,y+height,x,y+height-r);s.lineTo(x,y+r);s.quadraticCurveTo(x,y,x+r,y);const geo=new THREE.ExtrudeGeometry(s,{depth,bevelEnabled:true,bevelSegments:2,steps:1,bevelSize:.007,bevelThickness:.007,curveSegments:5});geo.translate(0,0,-depth/2);return geo;}
    function attach(parent,geometry,mat,position=[0,0,0]){const mesh=new THREE.Mesh(geometry,mat);mesh.position.set(...position);parent.add(mesh);return mesh;}
    function repeat(parent,geometry,mat,count,transform){const mesh=new THREE.InstancedMesh(geometry,mat,count),dummy=new THREE.Object3D();for(let i=0;i<count;i++){dummy.position.set(0,0,0);dummy.rotation.set(0,0,0);dummy.scale.set(1,1,1);transform(dummy,i);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);}mesh.instanceMatrix.needsUpdate=true;parent.add(mesh);return mesh;}
    function circleBolts(parent,radius,z,count=5){repeat(parent,cylinder(.018,.025),metal(),count,(o,i)=>{const a=i/count*Math.PI*2;o.position.set(Math.cos(a)*radius,Math.sin(a)*radius,z);});}
    function tyreGeometry(){const profile=[[.345,-.115],[.39,-.145],[.52,-.165],[.59,-.145],[.619,-.108],[.627,-.055],[.627,.055],[.619,.108],[.59,.145],[.52,.165],[.39,.145],[.345,.115],[.345,-.115]].map(([r,z])=>new THREE.Vector2(r,z));const geo=new THREE.LatheGeometry(profile,72);geo.rotateX(Math.PI/2);return geo;}
    if(issue.id==='tyre-fl'){
      const tyre=piece('Tyre · worn tread',tyreGeometry(),rubber(),[0,0,0],[0,0,.7]);
      // Four staggered rows form a tread pattern with visible drainage channels.
      repeat(tyre,box(.065,.014,.046),material(0x333a43,{roughness:.95,metalness:0}),192,(o,i)=>{const row=Math.floor(i/48),a=(i%48+(row%2)*.5)/48*Math.PI*2;o.position.set(Math.sin(a)*.626,Math.cos(a)*.626,(row-1.5)*.057);o.rotation.z=-a;});
      for(const z of [-.149,.149]){attach(tyre,torus(.43,.004),material(0x525963,{roughness:.85}),[0,0,z]);attach(tyre,torus(.56,.003),rubber(),[0,0,z]);}
      // Highlight only the inspected patch; the measurement stays in the report.
      const patch=attach(tyre,new THREE.TorusGeometry(.634,.009,8,18,.48),red());patch.rotation.z=.9;
      const rim=piece('Alloy wheel rim',ring(.346,.309,.235),metal(),[0,0,0],[0,0,-.09]);
      attach(rim,torus(.332,.012),metal(),[0,0,.123]);attach(rim,cylinder(.087,.07),metal(),[0,0,.07]);
      repeat(rim,rounded(.04,.245,.045,.012),metal(),10,(o,i)=>{const a=Math.floor(i/2)/5*Math.PI*2+(i%2===0?-.10:.10);o.position.set(Math.sin(a)*.19,Math.cos(a)*.19,.065);o.rotation.z=-a;});
      circleBolts(rim,.061,.117);attach(rim,cylinder(.035,.016),material(0x586579),[0,0,.117]);
      const valve=attach(rim,new THREE.CylinderGeometry(.008,.01,.055,12),rubber(),[.29,.08,.13]);valve.rotation.x=Math.PI/3;
      const hub=piece('Wheel hub',cylinder(.105,.15),metal(),[0,0,-.18],[0,0,-.73]);circleBolts(hub,.072,.095);
      tyre.userData.labelOffset=[0,.74,0];rim.userData.labelOffset=[-.5,-.48,0];hub.userData.labelOffset=[0,.24,0];
    }else if(issue.id==='brake-rr'){
      let reused=false;const wheel=car?.getObjectByName('Wheel_RR');
      if(wheel){
        const clone=wheel.clone(true);wheel.updateWorldMatrix(true,true);wheel.matrixWorld.decompose(clone.position,clone.quaternion,clone.scale);
        clone.traverse(obj=>{if(obj.isMesh){obj.userData.sharedGeometry=true;const copy=m=>{const result=m.clone(),original=carMaterials.find(entry=>entry.material===m);if(original){result.opacity=original.opacity;result.transparent=original.transparent;result.depthWrite=original.depthWrite;}return result;};obj.material=Array.isArray(obj.material)?obj.material.map(copy):copy(obj.material);}});
        const wrap=new THREE.Group();wrap.add(clone);wrap.updateMatrixWorld(true);const b=new THREE.Box3().setFromObject(wrap),c=b.getCenter(new THREE.Vector3()),s=b.getSize(new THREE.Vector3());clone.position.sub(c);wrap.scale.setScalar(1.1/Math.max(s.x,s.y,s.z));wrap.rotation.y=Math.PI/2;
        const carrier=piece('Wheel',box(.01,.01,.01),metal(),[0,0,.2],[0,0,1.25]);carrier.add(wrap);reused=true;
      }
      if(!reused)piece('Wheel',torus(.46,.12),rubber(),[0,0,.2],[0,0,1.25]);
      const disc=piece('Ventilated brake disc',ring(.4,.145,.016),metal(),[0,0,0],[0,0,-.15]);
      attach(disc,ring(.4,.145,.016),metal(),[0,0,-.045]);
      repeat(disc,box(.17,.009,.03),material(0x687687,{metalness:.7}),32,(o,i)=>{const a=i/32*Math.PI*2;o.position.set(Math.cos(a)*.27,Math.sin(a)*.27,-.0225);o.rotation.z=a;});
      attach(disc,ring(.165,.052,.105),material(0x75808e,{metalness:.7}),[0,0,.018]);circleBolts(disc,.108,.084);
      for(const radius of [.2,.27,.35,.388])attach(disc,torus(radius,.0016),material(0x8995a3,{metalness:.7,roughness:.5}),[0,0,.009]);
      function pad(name,start,end){const backing=piece(name,rounded(.14,.3,.018,.052),material(0x526274),start,end);const friction=attach(backing,rounded(.12,.264,.021,.045),material(0xc39a57,{roughness:.92,metalness:0}),[0,0,.025]);attach(friction,box(.124,.009,.023),material(0x3b3a37),[0,0,0]);for(const y of [-.135,.135])attach(backing,box(.05,.025,.022),metal(),[0,y,0]);return backing;}
      const outer=pad('Outer pad · 3 mm',[.29,0,.047],[.61,.17,.58]);
      const inner=pad('Inner pad',[.29,0,-.092],[.61,.17,-.73]);inner.rotation.y=Math.PI;
      const caliper=piece('Brake caliper',rounded(.1,.41,.10,.045),material(0x748397),[.46,0,-.02],[-.64,.13,-.28]);
      for(const y of [-.155,.155])attach(caliper,rounded(.21,.082,.17,.025),material(0x748397),[-.10,y,0]);
      attach(caliper,cylinder(.085,.04),material(0x445061),[-.12,0,-.09]);
      repeat(caliper,box(.008,.22,.025),metal(),4,(o,i)=>o.position.set((i-1.5)*.02,0,.064));
      disc.userData.labelOffset=[-.15,-.55,0];outer.userData.labelOffset=[.12,.35,0];inner.userData.labelOffset=[.2,-.34,0];caliper.userData.labelOffset=[-.1,.4,0];
    }else if(issue.id==='battery'){
      // An open case, removable cover and six cells reveal the battery structure.
      const base=piece('Battery case',rounded(1.08,.09,.68,.025),rubber(),[0,-.27,0],[0,-.49,0]);
      for(const [size,pos] of [[[1.08,.46,.04],[0,.25,-.32]],[[.04,.46,.64],[-.52,.25,0]],[[.04,.46,.64],[.52,.25,0]]]){const wall=new THREE.Mesh(box(...size),rubber());wall.position.set(...pos);base.add(wall);}
      // A low front wall exposes the illustrative lead-acid plate stacks.
      attach(base,rounded(1.06,.12,.04,.015),rubber(),[0,.105,.32]);
      repeat(base,box(.025,.36,.025),rubber(),9,(o,i)=>o.position.set((i-4)*.112,.22,-.346));
      const cells=piece('Six-cell plate pack',box(.001,.001,.001),metal(),[0,0,0],[0,.04,.27]);
      repeat(cells,box(.012,.345,.42),material(0x738899,{roughness:.73}),42,(o,i)=>{const cell=Math.floor(i/7),plate=i%7;o.position.set((cell-2.5)*.164+(plate-3)*.018,0,0);});
      repeat(cells,box(.01,.35,.42),material(0xc3c4b2,{roughness:.95,metalness:0}),36,(o,i)=>{const cell=Math.floor(i/6),plate=i%6;o.position.set((cell-2.5)*.164+(plate-2.5)*.018,0,0);});
      repeat(cells,box(.13,.025,.045),metal(),6,(o,i)=>o.position.set((i-2.5)*.164,.181,.13));
      const cover=piece('Vented cover',rounded(1.12,.085,.7,.03),rubber(),[0,.28,0],[0,.68,0]);
      repeat(cover,new THREE.CylinderGeometry(.033,.033,.018,16),material(0x576576),6,(o,i)=>o.position.set((i-2.5)*.164,.054,0));
      const handle=attach(cover,rounded(.44,.11,.045,.035),material(0x536070),[0,.1,-.18]);attach(handle,rounded(.35,.055,.048,.02),rubber(),[0,-.019,0]);
      const terminals=piece('Terminals + / −',box(.01,.01,.01),metal(),[0,.35,0],[0,.94,0]);
      for(const x of [-.38,.38]){attach(terminals,new THREE.CylinderGeometry(.041,.052,.09,24),metal(),[x,0,.19]);attach(terminals,rounded(.12,.018,.12,.025),material(x<0?0xb64951:0x445061),[x,-.05,.19]);attach(terminals,box(.057,.01,.012),material(0xe4e9ef),[x,-.038,.24]);if(x<0)attach(terminals,box(.012,.01,.057),material(0xe4e9ef),[x,-.038,.24]);}
      base.userData.labelOffset=[-.15,-.16,.1];cells.userData.labelOffset=[.12,-.05,.36];cover.userData.labelOffset=[-.63,.1,0];terminals.userData.labelOffset=[.3,.17,0];
    }else{
      const housing=piece('Headlamp housing',rounded(1,.5,.14,.13),rubber(),[0,0,-.16],[0,0,-.72]);
      attach(housing,cylinder(.145,.12),rubber(),[-.16,0,-.11]);attach(housing,rounded(.15,.1,.14,.02),material(0x536175),[.22,-.05,-.14]);
      for(const x of [-.49,.49]){const tab=attach(housing,rounded(.14,.065,.045,.02),rubber(),[x,.20,0]);attach(tab,ring(.02,.01,.048),metal());}
      const bowlProfile=[new THREE.Vector2(.055,-.1),new THREE.Vector2(.09,-.085),new THREE.Vector2(.14,-.04),new THREE.Vector2(.20,.035),new THREE.Vector2(.225,.095)];
      const bowlGeo=new THREE.LatheGeometry(bowlProfile,48);bowlGeo.rotateX(Math.PI/2);
      const reflector=piece('Reflector assembly',rounded(.93,.43,.035,.1),material(0x8598ad,{metalness:.8,roughness:.24}),[0,0,-.02],[0,0,-.26]);
      attach(reflector,bowlGeo,material(0xdde5ef,{metalness:.85,roughness:.19,side:THREE.DoubleSide}),[-.18,0,.10]);
      attach(reflector,ring(.228,.217,.013),metal(),[-.18,0,.015]);
      const secondary=attach(reflector,bowlGeo.clone(),material(0xc6d5e6,{metalness:.85,side:THREE.DoubleSide}),[.26,0,.075]);secondary.scale.set(.65,.65,.65);
      const bulb=piece('Bulb · reduced output',cylinder(.055,.10),metal(),[-.18,0,.04],[-.18,0,.39]);
      attach(bulb,cylinder(.032,.115),material(0xe2e6e9,{transparent:true,opacity:.4,depthWrite:false}),[0,0,.095]);attach(bulb,new THREE.TorusGeometry(.013,.003,6,16),material(0xffdd8a,{emissive:0xffb237,emissiveIntensity:1.4}),[0,0,.11]);
      repeat(bulb,box(.008,.012,.08),metal(),2,(o,i)=>o.position.set((i-.5)*.025,0,.045));
      const lens=piece('Clear outer lens',rounded(.99,.49,.03,.13),material(0xc2dce9,{transparent:true,opacity:.2,metalness:0,roughness:.1,depthWrite:false}),[0,0,.19],[0,0,.96]);
      repeat(lens,box(.005,.32,.009),material(0xdbeaf1,{transparent:true,opacity:.4}),9,(o,i)=>o.position.set(.22+i*.021,0,.021));
      housing.userData.labelOffset=[-.4,.4,0];reflector.userData.labelOffset=[-.2,-.4,0];bulb.userData.labelOffset=[-.17,.28,0];lens.userData.labelOffset=[.25,-.4,0];
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
    ISSUES.forEach(issue=>{const marker=new THREE.Mesh(new THREE.SphereGeometry(.07,20,16),new THREE.MeshBasicMaterial({color:issue.severity==='red'?0xf77583:0xffc657}));marker.position.copy(pointFor(issue));marker.userData.issueId=issue.id;markerGroup.add(marker);markers.push(marker);clickables.push(marker);});
    ISSUES.filter(issue=>issue.component).forEach(issue=>car.getObjectByName(issue.component)?.traverse(obj=>{if(obj.isMesh){obj.userData.issueId=issue.id;clickables.push(obj);}}));
  }
  new GLTFLoader().load('./assets/lowpoly_generic_suv.glb?v=15',gltf=>{
    car=gltf.scene;scene.add(car);car.updateMatrixWorld(true);
    // Derive forward from the named axles instead of assuming exporter orientation.
    const front=car.getObjectByName('Wheel_FL'),rear=car.getObjectByName('Wheel_RL');
    if(front&&rear){const a=new THREE.Box3().setFromObject(front).getCenter(new THREE.Vector3()),b=new THREE.Box3().setFromObject(rear).getCenter(new THREE.Vector3());const delta=a.sub(b);const orient=new THREE.Group();scene.remove(car);orient.add(car);scene.add(orient);orient.rotation.y=-Math.atan2(delta.x,delta.z);car=orient;}
    let b=new THREE.Box3().setFromObject(car),size=b.getSize(new THREE.Vector3());car.scale.multiplyScalar(4.3/Math.max(size.x,size.y,size.z));b=new THREE.Box3().setFromObject(car);const center=b.getCenter(new THREE.Vector3());car.position.x-=center.x;car.position.z-=center.z;car.position.y+=.07-b.min.y;car.updateMatrixWorld(true);bounds=new THREE.Box3().setFromObject(car);
    car.traverse(obj=>{if(!obj.isMesh)return;const mats=(Array.isArray(obj.material)?obj.material:[obj.material]).map(original=>{const mat=original.clone();if(mat.name.toLowerCase()==='body'){mat.map=null;mat.color.set(0xaebacb);mat.metalness=.5;mat.roughness=.32;}carMaterials.push({material:mat,opacity:mat.opacity,transparent:mat.transparent,depthWrite:mat.depthWrite});return mat;});obj.material=Array.isArray(obj.material)?mats:mats[0];});
    // Scene bounds include the baked ground shadow; use only the vehicle body
    // to place non-wheel markers. Keep the existing overview framing unchanged.
    const body=car.getObjectByName('Body');if(body)bounds=new THREE.Box3().setFromObject(body);
    buildMarkers();$('loading').hidden=true;
    if(viewMode==='focus')focus(currentIssue());else reset();
  },undefined,error=>{console.error('Vehicle model loading failed',error);$('loading').hidden=true;$('viewerError').textContent='Vehicle unavailable. Choose a finding to explore its component illustration.';$('viewerError').hidden=viewMode==='focus';});
  let down=null;const raycaster=new THREE.Raycaster();
  renderer.domElement.addEventListener('pointerdown',e=>{down={x:e.clientX,y:e.clientY,id:e.pointerId};});
  renderer.domElement.addEventListener('pointercancel',()=>{down=null;});
  renderer.domElement.addEventListener('pointerup',e=>{if(!down||down.id!==e.pointerId)return;const moved=Math.hypot(e.clientX-down.x,e.clientY-down.y);down=null;if(moved>7||viewMode!=='overview')return;const rect=renderer.domElement.getBoundingClientRect();raycaster.setFromCamera(new THREE.Vector2((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1),camera);const hit=raycaster.intersectObjects(clickables,false)[0];if(hit){const obstruction=car&&raycaster.intersectObject(car,true)[0];if(!obstruction||obstruction.distance>=hit.distance-.01)selectIssue(hit.object.userData.issueId);}});
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
      module.labels.forEach(({label,object},index)=>{const point=object.userData.labelOffset?new THREE.Vector3(...object.userData.labelOffset).applyMatrix4(object.matrixWorld):object.getWorldPosition(new THREE.Vector3()).add(new THREE.Vector3(0,.18+(index%2)*.12,0));point.project(camera);label.style.left=`${Math.max(75,Math.min(viewer.clientWidth-75,(point.x*.5+.5)*viewer.clientWidth))}px`;label.style.top=`${Math.max(18,Math.min(viewer.clientHeight-18,(-point.y*.5+.5)*viewer.clientHeight))}px`;label.hidden=module.progress<.9||point.z>1||point.z< -1||separation<.25;});
    }
    controls.update();renderer.render(scene,camera);
  });
  renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();$('viewerError').textContent='3D view interrupted. Reload the page to restore it. Findings remain available.';$('viewerError').hidden=false;});
  return {focus:issue=>{$('viewerError').hidden=true;$('loading').hidden=true;focus(issue);},overview,reset,separate:value=>{targetSeparation=value;},toggleRotate:()=>{controls.autoRotate=!controls.autoRotate;$('toggleRotate').textContent=controls.autoRotate?'Pause rotation':'Rotate';$('toggleRotate').setAttribute('aria-pressed',String(controls.autoRotate));}};
}
try{engine=createViewer();}catch(error){console.error('3D viewer unavailable',error);$('loading').hidden=true;$('viewerError').textContent='3D is unavailable on this device. All findings, evidence records and choices remain available below.';$('viewerError').hidden=false;$('toggleRotate').disabled=true;$('resetView').disabled=true;$('explodeRange').disabled=true;}

