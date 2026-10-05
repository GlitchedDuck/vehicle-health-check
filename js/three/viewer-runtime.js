import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import './model-overrides.js';
import './brake-model-overrides.js';
import './hotspot-anchor-fix.js';

const $=id=>document.getElementById(id);
const severityFor=f=>{
  if(f.direction==='lowBad'){
    if(f.value<=f.red)return 'red';
    if(f.value<=f.amber)return 'amber';
    return 'green';
  }
  if(f.value>=f.red)return 'red';
  if(f.value>=f.amber)return 'amber';
  return 'green';
};
const severityLabel=s=>s==='red'?'Urgent':s==='amber'?'Attention':'Healthy';

let viewerBridge={
  getFindings:()=>[],
  onSelectFinding:()=>{}
};

// ---------- PREMIUM 3D V9: DEDICATED COMPONENT ASSETS ----------
const viewer=$('viewer'),hotspotLayer=$('hotspotLayer'),scene=new THREE.Scene();
scene.background=new THREE.Color(0x08111b);
scene.fog=new THREE.Fog(0x08111b,12,34);

const camera=new THREE.PerspectiveCamera(31,1,.05,100);
camera.position.set(5.7,2.9,5.9);

const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio,1.25));
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.06;
renderer.shadowMap.enabled=false;
viewer.appendChild(renderer.domElement);

const controls=new OrbitControls(camera,renderer.domElement);
controls.enableDamping=true;
controls.dampingFactor=.075;
controls.minDistance=2.3;
controls.maxDistance=11;
controls.maxPolarAngle=Math.PI/1.95;
controls.target.set(0,1.0,0);

scene.add(new THREE.HemisphereLight(0xeaf2ff,0x09101a,1.55));
const key=new THREE.DirectionalLight(0xfffbf3,3.05);key.position.set(4.8,7,5.4);key.castShadow=false;scene.add(key);
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
let assetCache=new Map();

const WHITE_BODY=0xf4f6f8, ISSUE_RED=0xd34e5a, ISSUE_AMBER=0xd89725;

// Deterministic CC0 service component assets.
// These are individual files from the Survivor Vehicle Maintenance pack.
// No token matching and no generic fallback reuse.
const SERVICE_ASSETS={
  wheel:'https://cdn.3dassets.dev/assets/26654/v1/model.glb',
  brakeDisc:'https://cdn.3dassets.dev/assets/26632/v1/model.glb',
  brakeCaliper:'https://cdn.3dassets.dev/assets/26633/v1/model.glb',
  airFilter:'https://cdn.3dassets.dev/assets/26642/v1/model.glb',
  exhaust:'https://cdn.3dassets.dev/assets/26643/v1/model.glb',
  battery:'https://cdn.3dassets.dev/assets/26646/v1/model.glb',
  batteryTray:'https://cdn.3dassets.dev/assets/26647/v1/model.glb',
  batteryClamp:'https://cdn.3dassets.dev/assets/26648/v1/model.glb',
  headlamp:'https://cdn.3dassets.dev/assets/26651/v1/model.glb'
};

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
function scaleToMax(root,target){
  root.updateMatrixWorld(true);
  const b=boundsOf(root),s=b.getSize(new THREE.Vector3()),m=Math.max(s.x,s.y,s.z);
  if(m>0)root.scale.multiplyScalar(target/m);
  root.updateMatrixWorld(true);
}
function fitCameraToObject(root,padding=1.30,angle=.78){
  root.updateMatrixWorld(true);
  const box=boundsOf(root),size=box.getSize(new THREE.Vector3()),centre=box.getCenter(new THREE.Vector3());
  const maxDim=Math.max(size.x,size.y,size.z);
  const fov=THREE.MathUtils.degToRad(camera.fov);
  const distance=(maxDim*.5/Math.tan(fov*.5))*padding;
  const dir=new THREE.Vector3(Math.sin(angle),.34,Math.cos(angle)).normalize();
  camera.position.copy(centre).add(dir.multiplyScalar(distance));
  controls.target.copy(centre);
  controls.update();
}
function findNodeLike(root,...names){
  let found=null,terms=names.map(n=>n.toLowerCase().replace(/[_-]+/g,' '));
  root?.traverse(o=>{if(found)return;const n=(o.name||'').toLowerCase().replace(/[_-]+/g,' ');if(terms.some(t=>n===t||n.includes(t)))found=o});
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
  viewerBridge.getFindings().filter(f=>VISIBLE_IDS.has(f.id)).forEach(f=>{
    const b=document.createElement('button');b.className='vehicle-hotspot';b.type='button';b.dataset.id=f.id;
    b.style.setProperty('--hotspot-colour',hotspotColour(f));
    b.innerHTML=`<span class="hotspot-label"><span>${severityLabel(severityFor(f)).toUpperCase()}</span><strong>${f.title}</strong><small>${f.value} ${f.unit} · select to explore</small></span>`;
    b.addEventListener('click',e=>{e.stopPropagation();viewerBridge.onSelectFinding(f.id)});
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
  focusGlow=new THREE.Mesh(new THREE.SphereGeometry(.18,28,20),new THREE.MeshBasicMaterial({color:colour,transparent:true,opacity:.14,depthWrite:false,blending:THREE.AdditiveBlending}));
  focusGlow.position.copy(vehicleRoot.worldToLocal(world.clone()));focusRoot.add(focusGlow);
}
function startCameraTween(endPos,endTarget,duration=680,onDone){cameraTween={start:performance.now(),duration,startPos:camera.position.clone(),startTarget:controls.target.clone(),endPos:endPos.clone(),endTarget:endTarget.clone(),onDone}}

function loadAsset(key){
  if(assetCache.has(key))return Promise.resolve(assetCache.get(key).clone(true));
  const url=SERVICE_ASSETS[key];
  return new Promise((resolve,reject)=>{
    new GLTFLoader().load(url,gltf=>{
      const original=gltf.scene;
      original.traverse(o=>{if(o.isMesh){o.material=cloneMaterialDeep(o.material);o.castShadow=true;o.receiveShadow=true}});
      assetCache.set(key,original);
      resolve(original.clone(true));
    },undefined,reject);
  });
}
function recolourAsset(root,mode='neutral'){
  root.traverse(o=>{
    if(!o.isMesh)return;
    const src=Array.isArray(o.material)?o.material[0]:o.material;
    const n=((o.name||'')+' '+(src?.name||'')).toLowerCase();
    let colour=0x8f9aa8,metal=.52,rough=.32;
    if(n.includes('tyre')||n.includes('rubber')){colour=0x11161c;metal=.01;rough=.86}
    if(n.includes('plastic')||n.includes('housing')||n.includes('battery')){colour=0x283542;metal=.08;rough=.48}
    if(mode==='issue')colour=0xcd4551;
    o.material=new THREE.MeshPhysicalMaterial({color:colour,metalness:metal,roughness:rough,clearcoat:mode==='issue'?.25:.08,clearcoatRoughness:.2});
  });
}

function roundedShape(w,h,r){
  const s=new THREE.Shape(),x=-w/2,y=-h/2;
  s.moveTo(x+r,y);s.lineTo(x+w-r,y);s.quadraticCurveTo(x+w,y,x+w,y+r);
  s.lineTo(x+w,y+h-r);s.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
  s.lineTo(x+r,y+h);s.quadraticCurveTo(x,y+h,x,y+h-r);
  s.lineTo(x,y+r);s.quadraticCurveTo(x,y,x+r,y);return s;
}
function roundedMesh(w,h,d,r,material){
  const g=new THREE.ExtrudeGeometry(roundedShape(w,h,r),{depth:d,bevelEnabled:true,bevelSegments:3,steps:1,bevelSize:Math.min(r*.45,.025),bevelThickness:Math.min(d*.18,.02)});
  g.center();const m=new THREE.Mesh(g,material);m.castShadow=true;m.receiveShadow=true;return m;
}

function buildWiperAssembly(){
  const g=new THREE.Group();
  const dark=new THREE.MeshPhysicalMaterial({color:0x111820,metalness:.5,roughness:.28,clearcoat:.45,clearcoatRoughness:.18});
  const rubber=new THREE.MeshStandardMaterial({color:0x05070a,metalness:.01,roughness:.96});
  const metal=new THREE.MeshStandardMaterial({color:0xa3adb9,metalness:.9,roughness:.2});
  const glass=roundedMesh(4.0,2.05,.05,.14,new THREE.MeshPhysicalMaterial({color:0x234464,transparent:true,opacity:.16,roughness:.04,metalness:.01,clearcoat:.95}));
  glass.rotation.x=-.34;glass.position.set(0,1.55,-.55);g.add(glass);

  function blade(y,z,s=1){
    const bg=new THREE.Group();
    const curve=new THREE.CatmullRomCurve3([new THREE.Vector3(-1.55,0,0),new THREE.Vector3(-1.05,.16,.02),new THREE.Vector3(-.35,.12,.02),new THREE.Vector3(.3,.02,0)]);
    const arm=new THREE.Mesh(new THREE.TubeGeometry(curve,56,.048,12,false),dark);arm.castShadow=true;bg.add(arm);
    const pivot=new THREE.Mesh(new THREE.CylinderGeometry(.14,.14,.17,32),metal);pivot.rotation.x=Math.PI/2;pivot.position.set(-1.55,0,0);bg.add(pivot);
    const spine=roundedMesh(2.55,.10,.10,.04,dark);spine.position.set(1.52,0,0);bg.add(spine);
    const insert=roundedMesh(2.70,.038,.045,.014,rubber);insert.position.set(1.56,-.085,.03);bg.add(insert);
    for(const x of [.55,1.1,1.72,2.35]){const clip=new THREE.Mesh(new THREE.TorusGeometry(.085,.021,10,28,Math.PI),metal);clip.rotation.z=Math.PI/2;clip.position.set(x,.02,.01);bg.add(clip)}
    bg.position.set(0,y,z);bg.scale.setScalar(s);return bg;
  }

  const a=blade(1.1,.12,1),b=blade(.62,.42,.84);
  a.userData.from=a.position.clone();a.userData.to=a.position.clone().add(new THREE.Vector3(-.25,.70,.55));
  b.userData.from=b.position.clone();b.userData.to=b.position.clone().add(new THREE.Vector3(.25,.30,1.0));
  g.add(a,b);explodedItems.push(a,b);

  const worn=roundedMesh(1.15,.05,.055,.015,new THREE.MeshStandardMaterial({color:0xcd4551,roughness:.58}));
  worn.position.set(1.35,2.05,.72);worn.userData.pulse=true;g.add(worn);
  return g;
}
function buildCabinFilterAssembly(){
  const g=new THREE.Group();
  const housingMat=new THREE.MeshPhysicalMaterial({color:0x25323f,metalness:.06,roughness:.46,clearcoat:.22});
  const paperA=new THREE.MeshStandardMaterial({color:0xdacdab,roughness:.82});
  const paperB=new THREE.MeshStandardMaterial({color:0x9b7952,roughness:.9});
  const housing=roundedMesh(3.2,1.75,.62,.14,housingMat);housing.position.set(-.7,1.2,0);housing.userData.from=housing.position.clone();housing.userData.to=housing.position.clone().add(new THREE.Vector3(-1.05,0,0));g.add(housing);explodedItems.push(housing);
  const filter=new THREE.Group();filter.position.set(.6,1.2,.05);
  const frame=roundedMesh(2.55,1.25,.26,.08,housingMat);filter.add(frame);
  for(let i=0;i<24;i++){const x=-1.05+i*(2.1/23);const p=new THREE.Mesh(new THREE.BoxGeometry(.038,1.02,.30),i>17?paperB:paperA);p.position.set(x,0,0);p.rotation.z=(i%2?.07:-.07);filter.add(p)}
  filter.userData.from=filter.position.clone();filter.userData.to=filter.position.clone().add(new THREE.Vector3(1.35,.12,.30));g.add(filter);explodedItems.push(filter);
  return g;
}

function clearComponentScene(){
  if(!componentScene)return;
  componentRoot.remove(componentScene);
  componentScene.traverse(o=>{if(o.material)(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>m.dispose?.())});
  componentScene=null;explodedItems=[];
}
function addExploded(obj,from,to){
  obj.position.copy(from);obj.userData.from=from.clone();obj.userData.to=to.clone();explodedItems.push(obj);
}
function contextCar(group){
  const clone=vehicleModel.clone(true);
  clone.traverse(o=>{if(!o.isMesh)return;o.material=cloneMaterialDeep(o.material);const mats=Array.isArray(o.material)?o.material:[o.material];mats.forEach(m=>{if(m.color)m.color.setHex(0x75869a);m.transparent=true;m.opacity=.045;m.depthWrite=false})});
  clone.scale.setScalar(.26);clone.rotation.y=.68;clone.position.set(-2.8,.13,-1.1);group.add(clone);
}


function cloneNodeWithWorldTransform(source){
  source.updateWorldMatrix(true,false);
  const clone=source.clone(true);
  clone.traverse(o=>{
    if(o.isMesh){
      o.material=cloneMaterialDeep(o.material);
      o.castShadow=true;
      o.receiveShadow=true;
    }
  });
  const pos=new THREE.Vector3(),quat=new THREE.Quaternion(),scale=new THREE.Vector3();
  source.matrixWorld.decompose(pos,quat,scale);
  clone.position.copy(pos);
  clone.quaternion.copy(quat);
  clone.scale.copy(scale);
  return clone;
}

function materialLooksLikeRubber(material,name=''){
  const n=((material?.name||'')+' '+name).toLowerCase();
  return n.includes('tyre')||n.includes('tire')||n.includes('rubber');
}

function polishRealWheel(root){
  root.traverse(o=>{
    if(!o.isMesh)return;
    const original=Array.isArray(o.material)?o.material[0]:o.material;
    const name=(o.name||'').toLowerCase();
    if(materialLooksLikeRubber(original,name)){
      o.material=new THREE.MeshPhysicalMaterial({
        color:0x101317,
        roughness:.78,
        metalness:.02,
        clearcoat:.08,
        clearcoatRoughness:.65
      });
    }else{
      o.material=new THREE.MeshPhysicalMaterial({
        color:0x8794a3,
        roughness:.22,
        metalness:.82,
        clearcoat:.52,
        clearcoatRoughness:.12
      });
    }
  });
}

function makeTyreWearBand(wheelBox){
  const size=wheelBox.getSize(new THREE.Vector3());
  const radius=Math.max(size.y,size.z)*.505;
  const tube=Math.max(.025,radius*.022);
  const band=new THREE.Mesh(
    new THREE.TorusGeometry(radius,tube,16,96),
    new THREE.MeshStandardMaterial({
      color:0xe04b59,
      emissive:0x7a121d,
      emissiveIntensity:.55,
      roughness:.40,
      metalness:.04
    })
  );
  band.rotation.y=Math.PI/2;
  band.userData.pulse=true;
  return band;
}

function makeTyreDatumRing(radius){
  const ring=new THREE.Mesh(
    new THREE.TorusGeometry(radius,.015,10,96),
    new THREE.MeshBasicMaterial({
      color:0x6aa7ff,
      transparent:true,
      opacity:.38
    })
  );
  ring.rotation.x=Math.PI/2;
  return ring;
}

function makeTyreWearArc(radius){
  const arc=new THREE.Mesh(
    new THREE.TorusGeometry(radius,.025,12,54,Math.PI*.42),
    new THREE.MeshStandardMaterial({
      color:0xe04b59,
      emissive:0x6f111a,
      emissiveIntensity:.42,
      roughness:.42,
      metalness:.02
    })
  );
  // Wheel axle runs along X, so the tread circle sits in the Y/Z plane.
  arc.rotation.y=Math.PI/2;
  arc.rotation.x=Math.PI*.68;
  arc.userData.pulse=true;
  return arc;
}

function buildFrontLeftTyreAssembly(){
  explodedItems=[];
  const group=new THREE.Group();

  const source=findNodeLike(vehicleModel,'Wheel_FL');
  if(!source)throw new Error('Wheel_FL was not found in the vehicle GLB.');

  // Clone the REAL wheel exactly as authored, including its original UV texture/material.
  const wheel=source.clone(true);
  wheel.traverse(o=>{
    if(!o.isMesh)return;
    o.material=cloneMaterialDeep(o.material);
    o.castShadow=true;
    o.receiveShadow=true;
  });

  // Isolate in local space. The wheel asset is a single combined tyre/rim mesh,
  // so we do not pretend the tyre and rim are separate parts.
  const box0=boundsOf(wheel);
  const c0=box0.getCenter(new THREE.Vector3());
  wheel.position.sub(c0);
  wheel.updateMatrixWorld(true);
  scaleToMax(wheel,3.35);
  centreAndGround(wheel,.22);
  group.add(wheel);

  const box=boundsOf(wheel);
  const c=box.getCenter(new THREE.Vector3());
  const size=box.getSize(new THREE.Vector3());
  const radius=Math.max(size.y,size.z)*.505;

  // Small tread-warning arc only; no giant ring and no fake component geometry.
  const wear=makeTyreWearArc(radius);
  wear.position.copy(c);
  wear.position.x=box.min.x-.035;
  group.add(wear);

  // Very subtle floor datum, kept well below the tyre.
  const datum=new THREE.Mesh(
    new THREE.RingGeometry(radius*.78,radius*.79,96),
    new THREE.MeshBasicMaterial({color:0x5d84b7,transparent:true,opacity:.22,side:THREE.DoubleSide})
  );
  datum.rotation.x=-Math.PI/2;
  datum.position.set(c.x,.018,c.z);
  group.add(datum);

  wheel.userData.from=wheel.position.clone();
  wheel.userData.to=wheel.position.clone().add(new THREE.Vector3(0,.06,0));
  explodedItems.push(wheel);

  wear.userData.from=wear.position.clone();
  wear.userData.to=wear.position.clone().add(new THREE.Vector3(-.03,.06,0));
  explodedItems.push(wear);

  return group;
}

async function buildAssembly(f){
  clearComponentScene();
  const g=new THREE.Group();
  contextCar(g);

  if(f.id==='tyre-fl'){
    const tyreAssembly=buildFrontLeftTyreAssembly();
    while(tyreAssembly.children.length)g.add(tyreAssembly.children[0]);
  }else if(f.id==='brake-rr'){
    const disc=await loadAsset('brakeDisc');recolourAsset(disc,'neutral');scaleToMax(disc,2.25);g.add(disc);addExploded(disc,new THREE.Vector3(-.25,1.35,0),new THREE.Vector3(-.55,1.35,0));
    const cal=await loadAsset('brakeCaliper');recolourAsset(cal,'issue');scaleToMax(cal,1.75);g.add(cal);addExploded(cal,new THREE.Vector3(.55,1.4,.05),new THREE.Vector3(1.15,1.55,.35));
    const wheel=await loadAsset('wheel');recolourAsset(wheel,'neutral');scaleToMax(wheel,2.6);g.add(wheel);addExploded(wheel,new THREE.Vector3(-.95,1.35,0),new THREE.Vector3(-1.75,1.38,.05));
  }else if(f.id==='battery'){
    const tray=await loadAsset('batteryTray');recolourAsset(tray,'neutral');scaleToMax(tray,2.7);g.add(tray);addExploded(tray,new THREE.Vector3(0,.62,0),new THREE.Vector3(0,.42,0));
    const bat=await loadAsset('battery');recolourAsset(bat,'neutral');scaleToMax(bat,2.55);g.add(bat);addExploded(bat,new THREE.Vector3(0,1.25,0),new THREE.Vector3(0,1.38,.08));
    const clamp=await loadAsset('batteryClamp');recolourAsset(clamp,'issue');scaleToMax(clamp,1.0);g.add(clamp);addExploded(clamp,new THREE.Vector3(.65,1.55,.15),new THREE.Vector3(1.35,1.95,.45));
  }else if(f.id==='lamp-fr'){
    const lamp=await loadAsset('headlamp');recolourAsset(lamp,'neutral');scaleToMax(lamp,3.1);g.add(lamp);addExploded(lamp,new THREE.Vector3(-.25,1.35,0),new THREE.Vector3(-.55,1.42,.05));
    const lens=lamp.clone(true);recolourAsset(lens,'issue');lens.scale.multiplyScalar(.92);g.add(lens);addExploded(lens,new THREE.Vector3(.05,1.35,.05),new THREE.Vector3(1.05,1.52,.65));
  }else if(f.id==='air-filter'){
    const af=await loadAsset('airFilter');recolourAsset(af,'neutral');scaleToMax(af,3.0);g.add(af);addExploded(af,new THREE.Vector3(-.25,1.28,0),new THREE.Vector3(-.75,1.3,0));
    const insert=af.clone(true);recolourAsset(insert,'issue');insert.scale.multiplyScalar(.72);g.add(insert);addExploded(insert,new THREE.Vector3(.15,1.28,.05),new THREE.Vector3(1.15,1.45,.35));
  }else if(f.id==='exhaust'){
    const ex=await loadAsset('exhaust');recolourAsset(ex,'neutral');scaleToMax(ex,3.4);g.add(ex);addExploded(ex,new THREE.Vector3(-.15,1.25,0),new THREE.Vector3(-.65,1.3,0));
    const issue=ex.clone(true);recolourAsset(issue,'issue');issue.scale.multiplyScalar(.72);g.add(issue);addExploded(issue,new THREE.Vector3(.25,1.25,.05),new THREE.Vector3(1.05,1.45,.4));
  }else if(f.id==='wiper-front'){
    g.add(buildWiperAssembly());
  }else if(f.id==='cabin-filter'){
    g.add(buildCabinFilterAssembly());
  }

  componentRoot.add(g);componentScene=g;
  centreAndGround(g,.16);
  componentAnimStart=performance.now();componentAnimating=true;
  return g;
}

function focusFinding(f){
  if(!vehicleLoadComplete){
    pendingFocusFinding=f;
    ensureVehicleLoaded();
    return;
  }
  if(!VISIBLE_IDS.has(f.id)||!hotspotAnchors.has(f.id)){showComponentScene(f);return}
  const anchor=hotspotAnchors.get(f.id),world=new THREE.Vector3();anchor.getWorldPosition(world);
  setHotspotSelection(f.id);createFocusGlow(world,severityFor(f)==='red'?ISSUE_RED:ISSUE_AMBER);
  $('focusBannerTitle').textContent=f.title;$('focusBannerValue').textContent=`${f.value} ${f.unit} · ${severityLabel(severityFor(f))}`;
  $('focusBanner').classList.remove('hidden');$('viewerModeLabel').textContent='COMPONENT FOCUS';$('viewerTitle').textContent=f.title;$('backToVehicle').classList.remove('hidden');
  controls.enabled=false;
  const carCentre=new THREE.Vector3(0,1,0),outward=world.clone().sub(carCentre).normalize(),side=new THREE.Vector3(outward.z,0,-outward.x).normalize().multiplyScalar(1.55);
  const camPos=world.clone().add(side).add(new THREE.Vector3(0,1.0,0)).add(outward.multiplyScalar(2.35));
  startCameraTween(camPos,world.clone().add(new THREE.Vector3(0,.12,0)),680,()=>{setVehicleFade(.42);pendingComponent={f,at:performance.now()+220}});
}

async function showComponentScene(f){
  pendingComponent=null;cameraTween=null;
  $('viewerLoading').classList.remove('hidden');
  const t=$('viewerLoading').querySelector('strong');if(t)t.textContent=`Loading ${f.title.toLowerCase()} assembly…`;
  try{
    await buildAssembly(f);
  }catch(err){
    console.error('DriveWell component asset load failed',f.id,err);
    $('viewerLoading').classList.add('hidden');
    $('viewerError').classList.remove('hidden');
    $('viewerError').querySelector('strong').textContent='Component model unavailable';
    return;
  }
  $('viewerLoading').classList.add('hidden');$('viewerError').classList.add('hidden');

  vehicleRoot.visible=false;componentRoot.visible=true;hotspotLayer.style.display='none';
  $('focusBanner').classList.add('hidden');$('explodedCaption').classList.remove('hidden');$('explodedCaptionTitle').textContent=f.title;
  $('explodedCaptionSub').textContent=f.id==='tyre-fl'
    ?'Actual Wheel_FL model and original texture · worn tread highlighted'
    :'Dedicated service assembly · rotate to explore';
  $('tyreAssemblyPanel').classList.toggle('hidden',f.id!=='tyre-fl');
  $('backToVehicle').classList.remove('hidden');$('viewerModeLabel').textContent='SERVICE ASSEMBLY';$('viewerTitle').textContent=f.title;
  controls.enabled=true;if(f.id==='tyre-fl'){const b=boundsOf(componentScene),c=b.getCenter(new THREE.Vector3()),s=b.getSize(new THREE.Vector3()),d=Math.max(s.y,s.z)*1.75;camera.position.set(c.x+d,c.y+s.y*.10,c.z+s.z*.08);controls.target.copy(c);controls.update()}else{fitCameraToObject(componentScene,1.22,.82);}
}

function resetVehicleView(){
  pendingComponent=null;cameraTween=null;componentRoot.visible=false;vehicleRoot.visible=true;setVehicleFade(1);setHotspotSelection();
  $('viewerError').classList.add('hidden');$('focusBanner').classList.add('hidden');$('explodedCaption').classList.add('hidden');$('backToVehicle').classList.add('hidden');
  $('viewerModeLabel').textContent='VEHICLE OVERVIEW';$('viewerTitle').textContent='Choose a highlighted area';$('tyreAssemblyPanel').classList.add('hidden');
  controls.enabled=true;camera.position.set(5.7,2.9,5.9);controls.target.set(0,1.05,0);controls.update();
  if(focusGlow){focusRoot.remove(focusGlow);focusGlow=null}
}
$('backToVehicle').addEventListener('click',resetVehicleView);
$('resetView').addEventListener('click',()=>{if(componentRoot.visible&&componentScene)fitCameraToObject(componentScene,1.22,.82);else resetVehicleView()});

const loader=new GLTFLoader();
let vehicleLoadStarted=false;
let vehicleLoadComplete=false;
let pendingFocusFinding=null;

function ensureVehicleLoaded(){
  if(vehicleLoadStarted)return;
  vehicleLoadStarted=true;
  $('viewerLoading').classList.remove('hidden');

  loader.load('./assets/lowpoly_generic_suv.glb',gltf=>{
    vehicleModel=gltf.scene;
    vehicleModel.traverse(o=>{
      if(!o.isMesh)return;o.castShadow=false;o.receiveShadow=false;
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
    deriveAnchors();buildHotspotButtons();resetVehicleView();
    vehicleLoadComplete=true;
    $('viewerLoading').classList.add('hidden');
    if(pendingFocusFinding){
      const queued=pendingFocusFinding;
      pendingFocusFinding=null;
      focusFinding(queued);
    }
  },undefined,()=>{
    $('viewerLoading').classList.add('hidden');
    $('viewerError').classList.remove('hidden');
  });
}

function resizeViewer(){
  if(!viewerActive)return;
  const r=viewer.getBoundingClientRect();if(!r.width||!r.height)return;
  renderer.setSize(r.width,r.height,false);camera.aspect=r.width/r.height;camera.updateProjectionMatrix();updateHotspots();
}
window.addEventListener('resize',resizeViewer);

let viewerActive=false;
let animationFrameId=0;
let lastRenderAt=0;

function startViewerLoop(){
  if(animationFrameId||!viewerActive||document.hidden)return;
  animationFrameId=requestAnimationFrame(animate);
}

function stopViewerLoop(){
  if(animationFrameId)cancelAnimationFrame(animationFrameId);
  animationFrameId=0;
}

function setViewerActive(active){
  viewerActive=!!active;
  if(viewerActive){
    ensureVehicleLoaded();
    requestAnimationFrame(()=>{
      resizeViewer();
      startViewerLoop();
    });
  }else{
    stopViewerLoop();
  }
}

document.addEventListener('visibilitychange',()=>{
  if(document.hidden)stopViewerLoop();
  else if(viewerActive)startViewerLoop();
});

function animate(now){
  animationFrameId=0;
  if(!viewerActive||document.hidden)return;
  animationFrameId=requestAnimationFrame(animate);

  // Cap the expensive WebGL work at ~30fps. The UI itself remains full speed.
  if(now-lastRenderAt<33)return;
  lastRenderAt=now;

  if(cameraTween){
    const p=Math.min(1,(now-cameraTween.start)/cameraTween.duration),e=1-Math.pow(1-p,3);
    camera.position.lerpVectors(cameraTween.startPos,cameraTween.endPos,e);controls.target.lerpVectors(cameraTween.startTarget,cameraTween.endTarget,e);
    if(p>=1){const done=cameraTween.onDone;cameraTween=null;done?.()}
  }
  if(pendingComponent&&now>=pendingComponent.at){const f=pendingComponent.f;pendingComponent=null;showComponentScene(f)}
  if(componentRoot.visible&&componentAnimating&&componentScene){
    const p=Math.min(1,(now-componentAnimStart)/850),e=1-Math.pow(1-p,3);
    explodedItems.forEach(o=>{if(o.userData.from&&o.userData.to)o.position.lerpVectors(o.userData.from,o.userData.to,e)});
    if(p>=1)componentAnimating=false;
  }
  componentScene?.traverse(o=>{if(o.userData.pulse){const s=1+Math.sin(now*.005)*.045;o.scale.setScalar(s)}});
  if(focusGlow){const s=1+Math.sin(now*.005)*.07;focusGlow.scale.setScalar(s);focusGlow.material.opacity=.12+.035*Math.sin(now*.004)}
  controls.update();updateHotspots();renderer.render(scene,camera);
}


export function configureViewer(options={}){
  viewerBridge={
    getFindings:typeof options.getFindings==='function'?options.getFindings:viewerBridge.getFindings,
    onSelectFinding:typeof options.onSelectFinding==='function'?options.onSelectFinding:viewerBridge.onSelectFinding
  };
  setViewerActive(true);
}

export { focusFinding, resizeViewer, setViewerActive };
