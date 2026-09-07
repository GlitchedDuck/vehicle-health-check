import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

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

const SEVERITY = {
  red:{colour:0xff4f5f, glow:0x8d101b},
  amber:{colour:0xffbb3d, glow:0x805300}
};

const decisions = new Map();
let currentFilter = 'all';
let selectedId = ISSUES[0].id;

const $ = id => document.getElementById(id);
const els = {
  findings:$('findings'), detail:$('detail'), detailSeverity:$('detailSeverity'), detailTitle:$('detailTitle'),
  detailLocation:$('detailLocation'), detailPrice:$('detailPrice'), detailFound:$('detailFound'),
  detailWhy:$('detailWhy'), detailRisk:$('detailRisk'), detailRecommend:$('detailRecommend'),
  technical:$('technical'), evidenceTitle:$('evidenceTitle'), evidenceText:$('evidenceText'),
  approve:$('approve'), ask:$('ask'), decline:$('decline'), decisionNote:$('decisionNote'),
  approvedTotal:$('approvedTotal'), toast:$('toast')
};

function money(value){ return value === 0 ? 'No charge' : `£${value}`; }
function issueById(id){ return ISSUES.find(x=>x.id===id) || ISSUES[0]; }

function toast(message){
  els.toast.textContent = message;
  els.toast.classList.add('show');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(()=>els.toast.classList.remove('show'),2400);
}

function renderFindings(){
  const visible = ISSUES.filter(issue=>{
    if(currentFilter==='all') return true;
    if(currentFilter==='approved') return decisions.get(issue.id)==='approved';
    return issue.severity===currentFilter;
  });
  els.findings.innerHTML='';
  if(!visible.length){
    const div=document.createElement('div');
    div.className='card';
    div.style.padding='18px';
    div.style.color='var(--muted)';
    div.textContent=currentFilter==='approved'?'You have not approved any work yet.':'No findings match this filter.';
    els.findings.appendChild(div);
    return;
  }
  visible.forEach(issue=>{
    const decision=decisions.get(issue.id);
    const btn=document.createElement('button');
    btn.type='button';
    btn.className=`finding${selectedId===issue.id?' selected':''}`;
    btn.innerHTML=`
      <div class="finding-top">
        <div class="finding-icon ${issue.severity}">${issue.icon}</div>
        <div><h3>${issue.title}</h3><p class="finding-summary">${issue.summary}</p></div>
        <span class="severity ${issue.severity}">${issue.severityLabel}</span>
      </div>
      <div class="finding-bottom">
        <span>${issue.location}${decision?` · ${decision==='approved'?'Approved':'Declined'}`:''}</span>
        <strong>${money(issue.price)}</strong>
      </div>`;
    btn.addEventListener('click',()=>selectIssue(issue.id,{scrollToDetail:true,focus3d:true}));
    els.findings.appendChild(btn);
  });
}

function renderDetail(issue,{focus3d=true}={}){
  selectedId=issue.id;
  els.detailSeverity.className=`severity ${issue.severity}`;
  els.detailSeverity.textContent=issue.severityLabel;
  els.detailTitle.textContent=issue.title;
  els.detailLocation.textContent=issue.location;
  els.detailPrice.textContent=money(issue.price);
  els.detailFound.textContent=issue.found;
  els.detailWhy.textContent=issue.why;
  els.detailRisk.textContent=issue.risk;
  els.detailRecommend.textContent=issue.recommend;
  els.technical.textContent=issue.technical;
  els.evidenceTitle.textContent=issue.evidenceTitle;
  els.evidenceText.textContent=issue.evidenceText;
  const decision=decisions.get(issue.id);
  els.approve.textContent=decision==='approved'?'Approved ✓':'Approve this work';
  els.approve.className=`action ${decision==='approved'?'approved':'primary'}`;
  els.decline.textContent=decision==='declined'?'Declined for now':'Decline for now';
  els.decline.className=`action${decision==='declined'?' declined':''}`;
  if(decision){
    els.decisionNote.textContent=decision==='approved'
      ?'You have approved this item. In a production system the workshop would be notified immediately.'
      :'You have declined this item for now. The workshop would record your choice and can discuss it with you.';
    els.decisionNote.classList.add('show');
  } else {
    els.decisionNote.classList.remove('show');
  }
  renderFindings();
  if(focus3d) focusIssue(issue);
}

function selectIssue(id,{scrollToDetail=false,focus3d=true}={}){
  const issue=issueById(id);
  renderDetail(issue,{focus3d});
  if(scrollToDetail){
    els.detail.scrollIntoView({behavior:'smooth',block:'start'});
  }
}

function updateApproved(){
  const approved=ISSUES.filter(i=>decisions.get(i.id)==='approved');
  const total=approved.reduce((s,i)=>s+i.price,0);
  els.approvedTotal.textContent=approved.length?`${money(total)} · ${approved.length} approved`:'£0 approved';
}

els.approve.addEventListener('click',()=>{
  const issue=issueById(selectedId);decisions.set(issue.id,'approved');renderDetail(issue);updateApproved();toast(`${issue.title} approved.`);
});
els.decline.addEventListener('click',()=>{
  const issue=issueById(selectedId);decisions.set(issue.id,'declined');renderDetail(issue);updateApproved();toast(`${issue.title} declined for now.`);
});
els.ask.addEventListener('click',()=>{
  const issue=issueById(selectedId);toast(`Demo: a question about ${issue.title.toLowerCase()} would be sent to the service adviser.`);
});
$('reviewApprovals').addEventListener('click',()=>{
  const approved=ISSUES.filter(i=>decisions.get(i.id)==='approved');
  if(!approved.length) return toast('No work has been approved yet.');
  const total=approved.reduce((s,i)=>s+i.price,0);
  toast(`${approved.length} item${approved.length===1?'':'s'} approved · ${money(total)} total.`);
});
document.querySelectorAll('.filter').forEach(btn=>btn.addEventListener('click',()=>{
  currentFilter=btn.dataset.filter;
  document.querySelectorAll('.filter').forEach(x=>x.classList.toggle('active',x===btn));
  renderFindings();
}));

// ---------- 3D viewer ----------
const viewer=$('viewer');
const loading=$('loading');
const viewerError=$('viewerError');
const scene=new THREE.Scene();
scene.background=new THREE.Color(0x0a111b);
scene.fog=new THREE.Fog(0x0a111b,9,20);

const camera=new THREE.PerspectiveCamera(32,1,.05,100);
camera.position.set(4.7,2.15,5.4);

const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));
renderer.shadowMap.enabled=true;
renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.04;
viewer.prepend(renderer.domElement);

const controls=new OrbitControls(camera,renderer.domElement);
controls.enableDamping=true;
controls.dampingFactor=.055;
controls.minDistance=2.9;
controls.maxDistance=8.2;
controls.maxPolarAngle=Math.PI/2.02;
controls.target.set(0,.72,0);
controls.autoRotate=true;
controls.autoRotateSpeed=.42;

let autoRotate=true;
$('toggleRotate').addEventListener('click',e=>{
  autoRotate=!autoRotate;controls.autoRotate=autoRotate;
  e.currentTarget.textContent=autoRotate?'Pause rotation':'Start rotation';
});
controls.addEventListener('start',()=>{
  if(autoRotate){
    autoRotate=false;controls.autoRotate=false;$('toggleRotate').textContent='Start rotation';
  }
});

scene.add(new THREE.HemisphereLight(0xe8eef8,0x0b1018,1.45));
const key=new THREE.DirectionalLight(0xfff8ee,2.7);key.position.set(4.8,6.2,5.2);key.castShadow=true;scene.add(key);
const fill=new THREE.DirectionalLight(0xb7ceff,1.0);fill.position.set(-4.5,2.8,-3.6);scene.add(fill);
const rim=new THREE.DirectionalLight(0xffffff,1.45);rim.position.set(-2.5,4.8,4.6);scene.add(rim);

const floor=new THREE.Mesh(
  new THREE.CircleGeometry(3.65,80),
  new THREE.MeshStandardMaterial({color:0x101923,roughness:.98,metalness:.01})
);
floor.rotation.x=-Math.PI/2;
floor.position.y=.012;
floor.receiveShadow=true;
scene.add(floor);

let car=null;
let carBounds=null;
let selectedMarker=null;
let currentTarget=new THREE.Vector3(0,.8,0);
let desiredTarget=currentTarget.clone();
let desiredCamera=camera.position.clone();
const markerByIssue=new Map();
const clickables=[];
const clickableIssue=new Map();
const originalMaterials=new Map();

function markerTexture(colourHex){
  const canvas=document.createElement('canvas');
  canvas.width=128;canvas.height=128;
  const ctx=canvas.getContext('2d');
  ctx.clearRect(0,0,128,128);
  ctx.beginPath();ctx.arc(64,64,40,0,Math.PI*2);
  ctx.fillStyle='#ffffff';ctx.fill();
  ctx.beginPath();ctx.arc(64,64,31,0,Math.PI*2);
  ctx.fillStyle=`#${colourHex.toString(16).padStart(6,'0')}`;ctx.fill();
  const texture=new THREE.CanvasTexture(canvas);
  texture.colorSpace=THREE.SRGBColorSpace;
  return texture;
}

function makeMarker(issue, position){
  const group=new THREE.Group();
  const colour=SEVERITY[issue.severity].colour;

  const sprite=new THREE.Sprite(
    new THREE.SpriteMaterial({
      map:markerTexture(colour),
      transparent:true,
      depthTest:false,
      depthWrite:false
    })
  );
  sprite.scale.set(.31,.31,.31);
  sprite.renderOrder=20;

  const stem=new THREE.Mesh(
    new THREE.CylinderGeometry(.018,.018,.18,10),
    new THREE.MeshStandardMaterial({
      color:colour,
      emissive:SEVERITY[issue.severity].glow,
      emissiveIntensity:.45,
      roughness:.5
    })
  );
  stem.position.y=-.105;

  group.add(stem,sprite);
  group.position.copy(position);
  group.name=`MARKER_${issue.id}`;
  group.userData.issueId=issue.id;
  car.add(group);
  markerByIssue.set(issue.id,group);
  clickables.push(sprite);
  clickableIssue.set(sprite.uuid,issue.id);
  return group;
}

function applyMeshHighlight(issue){
  if(!car)return;
  originalMaterials.forEach((materials,obj)=>{
    if(Array.isArray(materials)) obj.material=materials.map(m=>m.clone());
    else obj.material=materials.clone();
  });

  if(issue.component){
    const obj=car.getObjectByName(issue.component);
    if(obj){
      obj.traverse(child=>{
        if(!child.isMesh||!child.material)return;
        if(!originalMaterials.has(child)) originalMaterials.set(child,Array.isArray(child.material)?child.material.map(m=>m.clone()):child.material.clone());
        const mats=Array.isArray(child.material)?child.material:[child.material];
        mats.forEach(mat=>{
          if(mat.color) mat.color.lerp(new THREE.Color(SEVERITY[issue.severity].colour),.22);
          if('emissive' in mat){
            mat.emissive=new THREE.Color(SEVERITY[issue.severity].glow);
            mat.emissiveIntensity=.32;
          }
          mat.needsUpdate=true;
        });
      });
    }
  }
}

function objectWorldCenter(obj){
  const box=new THREE.Box3().setFromObject(obj);
  return box.getCenter(new THREE.Vector3());
}

function hotspotPosition(issue){
  if(!carBounds) return new THREE.Vector3();
  const size=carBounds.getSize(new THREE.Vector3());
  const center=carBounds.getCenter(new THREE.Vector3());

  if(issue.component){
    const obj=car.getObjectByName(issue.component);
    if(obj) return objectWorldCenter(obj).add(new THREE.Vector3(0,.25,0));
  }

  // Model convention after normalisation: +Z is front, +X is left.
  if(issue.hotspot==='lampFR') return new THREE.Vector3(center.x-size.x*.31, center.y+size.y*.18, center.z+size.z*.47);
  if(issue.hotspot==='battery') return new THREE.Vector3(center.x, center.y+size.y*.42, center.z+size.z*.25);
  return center.clone();
}

function focusIssue(issue){
  if(!car||!carBounds)return;
  applyMeshHighlight(issue);
  if(selectedMarker) selectedMarker.scale.setScalar(1);
  selectedMarker=markerByIssue.get(issue.id)||null;

  const target=hotspotPosition(issue);
  desiredTarget.copy(target);
  const size=carBounds.getSize(new THREE.Vector3());
  const offsetDir=new THREE.Vector3(1.45,.62,1.55).normalize();
  // Bias viewpoint to whichever side the target sits on.
  const side=Math.sign(target.x-carBounds.getCenter(new THREE.Vector3()).x)||1;
  offsetDir.x=Math.abs(offsetDir.x)*side;
  desiredCamera.copy(target).add(offsetDir.multiplyScalar(Math.max(size.length()*.48,2.55)));
  controls.autoRotate=false;
  autoRotate=false;
  $('toggleRotate').textContent='Start rotation';
}

$('resetView').addEventListener('click',()=>{
  if(!carBounds)return;
  const c=carBounds.getCenter(new THREE.Vector3());
  const size=carBounds.getSize(new THREE.Vector3());
  desiredTarget.set(c.x,c.y+size.y*.02,c.z);
  desiredCamera.set(c.x+size.x*.78,c.y+size.y*.46,c.z+size.z*1.02);
});

const loader=new GLTFLoader();
loader.load(
  './assets/lowpoly_generic_suv.glb',
  gltf=>{
    car=gltf.scene;
    scene.add(car);

    car.traverse(obj=>{
      if(obj.isMesh){
        obj.castShadow=true;
        obj.receiveShadow=true;

        const mats=Array.isArray(obj.material)?obj.material:[obj.material];
        mats.forEach(mat=>{
          if(!mat)return;
          const objName=(obj.name||'').toLowerCase();
          const matName=(mat.name||'').toLowerCase();

          if(matName==='body'){
            mat=mat.clone();
            if(mat.map) mat.map=null;
            mat.color.set(0xaeb6c1);
            mat.metalness=.48;
            mat.roughness=.3;
            if(Array.isArray(obj.material)){
              const idx=obj.material.indexOf(mats.find(x=>x===mat));
            } else {
              obj.material=mat;
            }
          }

          if(matName==='glass'){
            mat.color.set(0x14202d);
            mat.transparent=true;
            mat.opacity=.62;
            mat.roughness=.08;
            mat.metalness=.04;
          }

          if(objName.includes('wheel_') || obj.parent?.name?.toLowerCase().includes('wheel_')){
            if(mat.color) mat.color.multiplyScalar(.72);
            mat.metalness=Math.max(mat.metalness||0,.22);
            mat.roughness=Math.max(mat.roughness||0,.38);
          }
        });
      }
    });

    // Ensure the principal body material is neutral silver even when it uses a baked red texture.
    const bodyRoot=car.getObjectByName('Body');
    if(bodyRoot){
      bodyRoot.traverse(child=>{
        if(!child.isMesh||!child.material)return;
        const mats=Array.isArray(child.material)?child.material:[child.material];
        const styled=mats.map(mat=>{
          const clone=mat.clone();
          if((clone.name||'').toLowerCase()==='body'){
            clone.map=null;
            clone.color.set(0xaeb6c1);
            clone.metalness=.5;
            clone.roughness=.3;
          }
          return clone;
        });
        child.material=Array.isArray(child.material)?styled:styled[0];
      });
    }

    // Normalise imported model to a predictable web scale.
    let box=new THREE.Box3().setFromObject(car);
    const size=box.getSize(new THREE.Vector3());
    const maxDim=Math.max(size.x,size.y,size.z);
    const scale=4.3/maxDim;
    car.scale.setScalar(scale);
    box=new THREE.Box3().setFromObject(car);
    const center=box.getCenter(new THREE.Vector3());
    car.position.x-=center.x;
    car.position.z-=center.z;
    car.position.y-=box.min.y-.16;
    car.updateMatrixWorld(true);

    carBounds=new THREE.Box3().setFromObject(car);

    ISSUES.forEach(issue=>{
      const marker=makeMarker(issue,hotspotPosition(issue));
      marker.position.y+=.06;
    });

    // Make the actual wheel meshes clickable too.
    ['Wheel_FL','Wheel_FR','Wheel_RL','Wheel_RR'].forEach(name=>{
      const root=car.getObjectByName(name);
      if(!root)return;
      root.traverse(child=>{
        if(child.isMesh){
          clickables.push(child);
          if(name==='Wheel_FL') clickableIssue.set(child.uuid,'tyre-fl');
          if(name==='Wheel_RR') clickableIssue.set(child.uuid,'brake-rr');
        }
      });
    });

    $('resetView').click();
    renderDetail(ISSUES[0],{focus3d:false});
    loading.style.display='none';
  },
  undefined,
  err=>{
    console.error(err);
    loading.style.display='none';
    viewerError.style.display='flex';
  }
);

const raycaster=new THREE.Raycaster();
const pointer=new THREE.Vector2();
let pointerDown=null;
renderer.domElement.addEventListener('pointerdown',e=>{pointerDown={x:e.clientX,y:e.clientY};});
renderer.domElement.addEventListener('pointerup',e=>{
  if(pointerDown && Math.hypot(e.clientX-pointerDown.x,e.clientY-pointerDown.y)>8) return;
  const rect=renderer.domElement.getBoundingClientRect();
  pointer.x=((e.clientX-rect.left)/rect.width)*2-1;
  pointer.y=-((e.clientY-rect.top)/rect.height)*2+1;
  raycaster.setFromCamera(pointer,camera);
  const hits=raycaster.intersectObjects(clickables,true);
  if(!hits.length)return;
  let obj=hits[0].object;
  let id=clickableIssue.get(obj.uuid);
  while(!id && obj.parent){obj=obj.parent;id=obj.userData?.issueId||clickableIssue.get(obj.uuid);}
  if(id) selectIssue(id,{scrollToDetail:false,focus3d:true});
});

function resize(){
  const w=viewer.clientWidth,h=viewer.clientHeight;
  if(!w||!h)return;
  renderer.setSize(w,h,false);
  camera.aspect=w/h;
  camera.updateProjectionMatrix();
}
new ResizeObserver(resize).observe(viewer);
resize();

const clock=new THREE.Clock();
renderer.setAnimationLoop(()=>{
  const t=clock.getElapsedTime();
  camera.position.lerp(desiredCamera,.055);
  controls.target.lerp(desiredTarget,.075);
  if(selectedMarker){
    const pulse=1+Math.sin(t*4.2)*.08;
    selectedMarker.scale.setScalar(pulse);
  }
  markerByIssue.forEach(marker=>{
    if(marker!==selectedMarker) marker.scale.setScalar(1);
  });
  controls.update();
  renderer.render(scene,camera);
});

renderFindings();
renderDetail(ISSUES[0],{focus3d:false});
updateApproved();
