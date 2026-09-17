import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// DriveWell v11d brake-service geometry.
// The original maintenance-pack wheel reads like a toothed off-road gear in the
// exploded view. Replace only the three brake-view assets with clean automotive
// geometry while preserving the existing viewer animation and camera code.

const URLS = {
  wheel: 'https://cdn.3dassets.dev/assets/26654/v1/model.glb',
  brakeDisc: 'https://cdn.3dassets.dev/assets/26632/v1/model.glb',
  brakeCaliper: 'https://cdn.3dassets.dev/assets/26633/v1/model.glb'
};

function material(name, colour, metalness=.2, roughness=.4){
  const m = new THREE.MeshPhysicalMaterial({
    color: colour,
    metalness,
    roughness,
    clearcoat: .16,
    clearcoatRoughness: .2
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
  g.name = 'DriveWell road wheel';

  // Smooth road tyre rather than the blocky maintenance-pack tread.
  const tyre = mesh(
    new THREE.TorusGeometry(1.02, .27, 28, 96),
    material('tyre rubber', 0x11161c, .02, .86),
    'road tyre rubber'
  );
  g.add(tyre);

  const rimMat = material('alloy wheel metal', 0x9aa6b3, .82, .22);
  const rim = mesh(new THREE.TorusGeometry(.68, .11, 18, 72), rimMat, 'alloy rim');
  g.add(rim);

  const hub = mesh(new THREE.CylinderGeometry(.20, .20, .18, 40), rimMat, 'wheel hub');
  hub.rotation.x = Math.PI / 2;
  g.add(hub);

  // Five split spokes give the service view an ordinary road-wheel silhouette.
  for(let i=0;i<5;i++){
    const angle = i * Math.PI * 2 / 5;
    for(const split of [-.075,.075]){
      const spoke = mesh(new THREE.BoxGeometry(.10, .54, .075), rimMat, 'alloy spoke');
      spoke.position.set(Math.sin(angle + split) * .40, Math.cos(angle + split) * .40, 0);
      spoke.rotation.z = -angle - split;
      g.add(spoke);
    }
  }

  const centre = mesh(new THREE.CylinderGeometry(.10, .10, .205, 32), rimMat, 'wheel centre cap');
  centre.rotation.x = Math.PI / 2;
  g.add(centre);

  return g;
}

function makeBrakeDisc(){
  const g = new THREE.Group();
  g.name = 'DriveWell vented brake disc';

  const rotorMat = material('brake rotor metal', 0xaeb6bf, .88, .28);
  const hatMat = material('brake hub metal', 0x7f8995, .78, .32);

  // Main rotor and centre hat, both on the Z axle to face the camera naturally.
  const rotor = mesh(new THREE.CylinderGeometry(1.0, 1.0, .16, 72), rotorMat, 'brake disc rotor');
  rotor.rotation.x = Math.PI / 2;
  g.add(rotor);

  const hat = mesh(new THREE.CylinderGeometry(.45, .45, .24, 56), hatMat, 'brake disc hat');
  hat.rotation.x = Math.PI / 2;
  g.add(hat);

  const bore = mesh(new THREE.CylinderGeometry(.13, .13, .27, 36), material('hub bore',0x222933,.1,.58), 'hub bore');
  bore.rotation.x = Math.PI / 2;
  g.add(bore);

  // Five wheel-bolt bosses and restrained vent slots.
  for(let i=0;i<5;i++){
    const a=i*Math.PI*2/5;
    const boss=mesh(new THREE.CylinderGeometry(.055,.055,.27,24),hatMat,'wheel bolt boss');
    boss.rotation.x=Math.PI/2;
    boss.position.set(Math.sin(a)*.29,Math.cos(a)*.29,0);
    g.add(boss);
  }

  for(let i=0;i<18;i++){
    const a=i*Math.PI*2/18;
    const slot=mesh(new THREE.BoxGeometry(.055,.28,.19),material('disc vent metal',0x6f7883,.72,.36),'vent slot');
    slot.position.set(Math.sin(a)*.73,Math.cos(a)*.73,0);
    slot.rotation.z=-a;
    g.add(slot);
  }

  return g;
}

function roundedBoxGeometry(w,h,d,r=.12){
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
  const geo=new THREE.ExtrudeGeometry(shape,{depth:d,bevelEnabled:true,bevelSegments:3,bevelSize:.035,bevelThickness:.025,steps:1});
  geo.center();
  return geo;
}

function makeBrakeCaliper(){
  const g = new THREE.Group();
  g.name = 'DriveWell rear brake caliper and pads';

  const caliperMat = material('brake caliper metal', 0xc94b57, .46, .3);
  const padMat = material('brake pad friction', 0x353c45, .08, .72);
  const backingMat = material('brake pad backing metal', 0x78828e, .66, .34);

  // Two curved-looking caliper halves around the rotor edge.
  const outer = mesh(roundedBoxGeometry(.78,1.12,.38,.17), caliperMat, 'brake caliper outer body');
  outer.position.set(.22,0,.20);
  g.add(outer);

  const bridge = mesh(roundedBoxGeometry(.62,.34,.62,.12), caliperMat, 'brake caliper bridge');
  bridge.position.set(-.17,.36,0);
  bridge.rotation.z=.08;
  g.add(bridge);

  const piston = mesh(new THREE.CylinderGeometry(.25,.25,.18,40), caliperMat, 'brake caliper piston housing');
  piston.rotation.x=Math.PI/2;
  piston.position.set(.06,-.12,-.28);
  g.add(piston);

  // Show the two pads separately so the customer can understand what is worn.
  for(const z of [-.34,.34]){
    const backing=mesh(roundedBoxGeometry(.48,.86,.08,.08),backingMat,'brake pad backing plate');
    backing.position.set(-.38,-.02,z);
    g.add(backing);

    const pad=mesh(roundedBoxGeometry(.42,.74,.075,.07),padMat,'brake pad friction material');
    pad.position.set(-.39,-.02,z + Math.sign(z)*.075);
    g.add(pad);
  }

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
        onLoad?.({scene,scenes:[scene],animations:[],cameras:[],asset:{generator:'DriveWell v11d brake model override'}});
      }catch(error){
        onError?.(error);
      }
    });
    return this;
  };
}
