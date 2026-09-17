import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// DriveWell v11e brake-service geometry.
// These models compensate for the legacy viewer's fixed scale targets so the
// exploded service scene keeps believable automotive proportions.

const URLS = {
  wheel: 'https://cdn.3dassets.dev/assets/26654/v1/model.glb',
  brakeDisc: 'https://cdn.3dassets.dev/assets/26632/v1/model.glb',
  brakeCaliper: 'https://cdn.3dassets.dev/assets/26633/v1/model.glb'
};

function material(name, colour, metalness=.2, roughness=.4, extra={}){
  const m = new THREE.MeshPhysicalMaterial({
    color: colour,
    metalness,
    roughness,
    clearcoat: .16,
    clearcoatRoughness: .2,
    ...extra
  });
  m.name = name;
  return m;
}

function mesh(geometry, mat, name){
  const object = new THREE.Mesh(geometry, mat);
  object.name = name;
  object.castShadow = true;
  object.receiveShadow = true;
  return object;
}

function makeWheel(){
  const g = new THREE.Group();
  g.name = 'DriveWell rear road wheel';

  const tyre = mesh(
    new THREE.TorusGeometry(1.0, .235, 28, 104),
    material('tyre rubber', 0x101419, .02, .88),
    'road tyre rubber'
  );
  g.add(tyre);

  const rimMat = material('alloy wheel metal', 0x9ca8b4, .80, .24);
  const rim = mesh(new THREE.TorusGeometry(.67, .085, 18, 80), rimMat, 'alloy rim');
  g.add(rim);

  const hub = mesh(new THREE.CylinderGeometry(.18, .18, .15, 40), rimMat, 'wheel hub');
  hub.rotation.x = Math.PI / 2;
  g.add(hub);

  for(let i=0;i<5;i++){
    const angle = i * Math.PI * 2 / 5;
    for(const split of [-.055,.055]){
      const spoke = mesh(new THREE.BoxGeometry(.075, .50, .052), rimMat, 'alloy spoke');
      spoke.position.set(Math.sin(angle + split) * .39, Math.cos(angle + split) * .39, 0);
      spoke.rotation.z = -angle - split;
      g.add(spoke);
    }
  }

  const centre = mesh(new THREE.CylinderGeometry(.085, .085, .17, 32), rimMat, 'wheel centre cap');
  centre.rotation.x = Math.PI / 2;
  g.add(centre);

  return g;
}

function makeBrakeDisc(){
  const g = new THREE.Group();
  g.name = 'DriveWell vented rear brake disc';

  const rotorMat = material('brake rotor metal', 0xb5bdc6, .88, .26);
  const rotorEdgeMat = material('brake rotor edge metal', 0x727c87, .82, .34);
  const hatMat = material('brake hub metal', 0x7e8995, .76, .32);

  const rotor = mesh(new THREE.CylinderGeometry(1.0, 1.0, .105, 96), rotorMat, 'brake disc rotor');
  rotor.rotation.x = Math.PI / 2;
  g.add(rotor);

  const rearRotor = mesh(new THREE.CylinderGeometry(.995, .995, .055, 96), rotorEdgeMat, 'rear brake disc plate');
  rearRotor.rotation.x = Math.PI / 2;
  rearRotor.position.z = -.115;
  g.add(rearRotor);

  const hat = mesh(new THREE.CylinderGeometry(.405, .405, .18, 64), hatMat, 'brake disc hat');
  hat.rotation.x = Math.PI / 2;
  hat.position.z = .015;
  g.add(hat);

  const bore = mesh(new THREE.CylinderGeometry(.12, .12, .205, 36), material('hub bore',0x222933,.1,.58), 'hub bore');
  bore.rotation.x = Math.PI / 2;
  bore.position.z = .02;
  g.add(bore);

  for(let i=0;i<5;i++){
    const a=i*Math.PI*2/5;
    const boss=mesh(new THREE.CylinderGeometry(.047,.047,.21,24),hatMat,'wheel bolt boss');
    boss.rotation.x=Math.PI/2;
    boss.position.set(Math.sin(a)*.275,Math.cos(a)*.275,.02);
    g.add(boss);
  }

  // Vent channels are deliberately subtle so the rotor reads as a real disc,
  // not a cog or turbine.
  for(let i=0;i<24;i++){
    const a=i*Math.PI*2/24;
    const vent=mesh(new THREE.BoxGeometry(.025,.16,.12),rotorEdgeMat,'disc vent channel');
    vent.position.set(Math.sin(a)*.72,Math.cos(a)*.72,-.03);
    vent.rotation.z=-a;
    g.add(vent);
  }

  return g;
}

function roundedBoxGeometry(w,h,d,r=.08){
  const shape=new THREE.Shape();
  const x=-w/2,y=-h/2;
  shape.moveTo(x+r,y);
  shape.lineTo(x+w-r,y);
  shape.quadraticCurveTo(x+w,y,x+w,y+r);
  shape.lineTo(x+w,y+h-r);
  shape.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
  shape.lineTo(x+r,y+h);
  shape.quadraticCurveTo(x,y+h,x,y+h-r);
  shape.lineTo(x,y+r);
  shape.quadraticCurveTo(x,y,x+r,y);
  const geo=new THREE.ExtrudeGeometry(shape,{depth:d,bevelEnabled:true,bevelSegments:3,bevelSize:.022,bevelThickness:.018,steps:1});
  geo.center();
  return geo;
}

function makeBrakeCaliper(){
  const g = new THREE.Group();
  g.name = 'DriveWell compact rear brake caliper and pads';

  const caliperMat = material('brake caliper metal', 0xb8424e, .45, .31);
  const padMat = material('brake pad friction', 0x30363e, .06, .80);
  const backingMat = material('brake pad backing metal', 0x7b8793, .62, .38);

  // Compact floating rear caliper proportions. The legacy viewer subsequently
  // scales this group to a fixed target, so the hidden scale reference below
  // deliberately keeps the rendered hardware around half the old apparent size.
  const body = mesh(roundedBoxGeometry(.48,.72,.26,.11), caliperMat, 'rear brake caliper body');
  body.position.set(.12,.02,.10);
  g.add(body);

  const bridge = mesh(roundedBoxGeometry(.42,.20,.38,.07), caliperMat, 'rear brake caliper bridge');
  bridge.position.set(-.15,.23,-.01);
  bridge.rotation.z=.05;
  g.add(bridge);

  const piston = mesh(new THREE.CylinderGeometry(.16,.16,.13,36), caliperMat, 'rear caliper piston housing');
  piston.rotation.x=Math.PI/2;
  piston.position.set(.02,-.10,-.18);
  g.add(piston);

  // Thin pad plates close to the disc. They remain distinct in silhouette even
  // though the legacy issue highlighter recolours the whole caliper asset.
  for(const z of [-.205,.205]){
    const backing=mesh(roundedBoxGeometry(.31,.54,.038,.055),backingMat,'brake pad backing plate');
    backing.position.set(-.27,-.01,z);
    g.add(backing);

    const pad=mesh(roundedBoxGeometry(.275,.47,.030,.05),padMat,'brake pad friction material');
    pad.position.set(-.275,-.01,z + Math.sign(z)*.034);
    g.add(pad);
  }

  // This fully transparent reference participates in Box3 scaling but not the
  // rendered image. It counteracts scaleToMax(caliper, 1.75) in the legacy app,
  // preventing the caliper and pads from becoming huge red blocks.
  const scaleReference = mesh(
    new THREE.BoxGeometry(1.62,.02,.02),
    material('scale reference',0x000000,0,1,{transparent:true,opacity:0,depthWrite:false,colorWrite:false}),
    'caliper scale reference'
  );
  scaleReference.castShadow=false;
  scaleReference.receiveShadow=false;
  g.add(scaleReference);

  return g;
}

const factories = new Map([
  [URLS.wheel, makeWheel],
  [URLS.brakeDisc, makeBrakeDisc],
  [URLS.brakeCaliper, makeBrakeCaliper]
]);

const previousLoad = GLTFLoader.prototype.load;

if(!GLTFLoader.prototype.__drivewellBrakeOverrides){
  GLTFLoader.prototype.__drivewellBrakeOverrides = true;
  GLTFLoader.prototype.load = function(url,onLoad,onProgress,onError){
    const factory=factories.get(url);
    if(!factory) return previousLoad.call(this,url,onLoad,onProgress,onError);

    queueMicrotask(()=>{
      try{
        const scene=factory();
        onLoad?.({scene,scenes:[scene],animations:[],cameras:[],asset:{generator:'DriveWell v11e brake model override'}});
      }catch(error){
        onError?.(error);
      }
    });
    return this;
  };
}
