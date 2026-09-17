import * as THREE from 'three';

// v11c hotspot correction.
// The legacy runtime creates four anonymous vehicle hotspot anchors after the
// SUV GLB loads. We keep the existing viewer untouched, but snap those anchors
// to stable component-relative points derived from the GLB's wheel pivots.

const originalAdd = THREE.Object3D.prototype.add;
let vehicleRoot = null;
let carGroup = null;
let vehicleModel = null;
let hotspotAnchors = [];

function normaliseName(value=''){
  return value.toLowerCase().replace(/[_-]+/g,' ').replace(/\s+/g,' ').trim();
}

function findNamed(root, ...names){
  const wanted = names.map(normaliseName);
  let found = null;
  root?.traverse(object => {
    if(found) return;
    const name = normaliseName(object.name || '');
    if(wanted.includes(name)) found = object;
  });
  return found;
}

function worldPosition(object){
  const point = new THREE.Vector3();
  object.updateWorldMatrix(true, false);
  object.getWorldPosition(point);
  return point;
}

function average(a,b){
  return a.clone().add(b).multiplyScalar(.5);
}

function xzDistance(a,b){
  const dx=a.x-b.x,dz=a.z-b.z;
  return Math.hypot(dx,dz);
}

function clamp(value,min,max){
  return Math.max(min,Math.min(max,value));
}

function setAnchorWorld(anchor, point){
  vehicleRoot.updateWorldMatrix(true,false);
  anchor.position.copy(vehicleRoot.worldToLocal(point.clone()));
  anchor.updateMatrixWorld(true);
}

function alignHotspots(){
  if(!vehicleRoot || !vehicleModel || hotspotAnchors.length < 4) return;

  vehicleRoot.updateMatrixWorld(true);
  vehicleModel.updateMatrixWorld(true);

  const fl = findNamed(vehicleModel,'Wheel_FL','Wheel FL');
  const fr = findNamed(vehicleModel,'Wheel_FR','Wheel FR');
  const rl = findNamed(vehicleModel,'Wheel_RL','Wheel RL');
  const rr = findNamed(vehicleModel,'Wheel_RR','Wheel RR');

  // If this particular GLB ever changes its wheel naming, leave the legacy
  // positions alone rather than guessing and moving markers into empty space.
  if(!fl || !fr || !rl || !rr) return;

  const pFL=worldPosition(fl),pFR=worldPosition(fr),pRL=worldPosition(rl),pRR=worldPosition(rr);
  const frontAxle=average(pFL,pFR),rearAxle=average(pRL,pRR);
  const forward=frontAxle.clone().sub(rearAxle);forward.y=0;
  const wheelbase=Math.max(.01,forward.length());forward.normalize();
  const up=new THREE.Vector3(0,1,0);

  // 1. Front-left tyre: use the authored wheel pivot, not the bounding-box
  // centre of the full wheel subtree.
  setAnchorWorld(hotspotAnchors[0],pFL);

  // 2. Rear-right brake: centre of the authored RR wheel/brake location.
  setAnchorWorld(hotspotAnchors[1],pRR);

  // 3. Front-right headlamp: start from the FR wheel corner, then move a
  // proportion of wheelbase forward and upward to the lamp cluster.
  const lamp=pFR.clone()
    .add(forward.clone().multiplyScalar(clamp(wheelbase*.19,.48,.82)))
    .add(up.clone().multiplyScalar(clamp(wheelbase*.15,.42,.62)));
  setAnchorWorld(hotspotAnchors[2],lamp);

  // 4. Front wipers: use the front-axle centre, move rearward toward the
  // scuttle/windscreen and lift to the base of the glass.
  const wiper=frontAxle.clone()
    .add(forward.clone().multiplyScalar(-clamp(wheelbase*.22,.54,.82)))
    .add(up.clone().multiplyScalar(clamp(wheelbase*.34,.90,1.22)));
  setAnchorWorld(hotspotAnchors[3],wiper);
}

THREE.Object3D.prototype.add = function(...objects){
  const result = originalAdd.apply(this,objects);

  // The legacy runtime creates vehicleRoot and immediately adds carGroup and
  // focusRoot to it. This is the first non-Scene group receiving two groups.
  if(!vehicleRoot && this.isGroup && !this.isScene && objects.length===2 && objects.every(o=>o?.isGroup)){
    vehicleRoot=this;
    carGroup=objects[0];
    return result;
  }

  // GLTF scene added to carGroup after loading.
  if(vehicleRoot && this===carGroup && !vehicleModel && objects.length===1 && objects[0]?.isObject3D){
    vehicleModel=objects[0];
    return result;
  }

  // deriveAnchors() creates four plain Object3D children on vehicleRoot in the
  // order tyre, brake, headlamp, wiper. Capture them once and realign all four
  // after the final anchor exists.
  if(vehicleRoot && vehicleModel && this===vehicleRoot && hotspotAnchors.length<4){
    objects.forEach(object=>{
      if(hotspotAnchors.length<4 && object?.type==='Object3D' && !object.isGroup && !object.isMesh){
        hotspotAnchors.push(object);
      }
    });
    if(hotspotAnchors.length===4) queueMicrotask(alignHotspots);
  }

  return result;
};
