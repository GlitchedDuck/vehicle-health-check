import * as THREE from 'three';

export const WHITE_BODY = 0xf4f6f8;
export const ISSUE_RED = 0xd34e5a;
export const ISSUE_AMBER = 0xd89725;

export const SERVICE_ASSETS = {
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

export function cloneMaterialDeep(material){
  if(!material)return material;
  if(Array.isArray(material))return material.map(m=>m.clone());
  return material.clone();
}

export function whitePaint(){
  return new THREE.MeshPhysicalMaterial({color:WHITE_BODY,metalness:.30,roughness:.24,clearcoat:.85,clearcoatRoughness:.09});
}

export function glassMaterial(){
  return new THREE.MeshPhysicalMaterial({color:0x172638,transparent:true,opacity:.62,roughness:.05,metalness:.02,clearcoat:.85,clearcoatRoughness:.07});
}

export function boundsOf(root){
  root.updateMatrixWorld(true);
  return new THREE.Box3().setFromObject(root);
}

export function centreAndGround(root,clearance=.14){
  root.updateMatrixWorld(true);
  let box=boundsOf(root);
  const centre=box.getCenter(new THREE.Vector3());
  root.position.x-=centre.x;
  root.position.z-=centre.z;
  root.updateMatrixWorld(true);
  box=boundsOf(root);
  root.position.y+=(-box.min.y)+clearance;
  root.updateMatrixWorld(true);
}

export function scaleToMax(root,target){
  root.updateMatrixWorld(true);
  const b=boundsOf(root),s=b.getSize(new THREE.Vector3()),m=Math.max(s.x,s.y,s.z);
  if(m>0)root.scale.multiplyScalar(target/m);
  root.updateMatrixWorld(true);
}

export function findNodeLike(root,...names){
  let found=null;
  const terms=names.map(n=>n.toLowerCase().replace(/[_-]+/g,' '));
  root?.traverse(o=>{
    if(found)return;
    const n=(o.name||'').toLowerCase().replace(/[_-]+/g,' ');
    if(terms.some(t=>n===t||n.includes(t)))found=o;
  });
  return found;
}

export function nodeWorldCentre(node){
  return new THREE.Box3().setFromObject(node).getCenter(new THREE.Vector3());
}

export function roundedShape(w,h,r){
  const s=new THREE.Shape(),x=-w/2,y=-h/2;
  s.moveTo(x+r,y);s.lineTo(x+w-r,y);s.quadraticCurveTo(x+w,y,x+w,y+r);
  s.lineTo(x+w,y+h-r);s.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
  s.lineTo(x+r,y+h);s.quadraticCurveTo(x,y+h,x,y+h-r);
  s.lineTo(x,y+r);s.quadraticCurveTo(x,y,x+r,y);return s;
}

export function roundedMesh(w,h,d,r,material){
  const g=new THREE.ExtrudeGeometry(roundedShape(w,h,r),{depth:d,bevelEnabled:true,bevelSegments:3,steps:1,bevelSize:Math.min(r*.45,.025),bevelThickness:Math.min(d*.18,.02)});
  g.center();
  const m=new THREE.Mesh(g,material);
  m.castShadow=true;
  m.receiveShadow=true;
  return m;
}
