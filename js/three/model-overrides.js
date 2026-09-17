import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// DriveWell v11b replaces the weakest generic service GLBs with deterministic
// component assemblies. The legacy viewer can keep using its existing loader,
// camera and exploded-view orchestration while these URLs resolve to better
// shaped service models.

const URLS = {
  airFilter: 'https://cdn.3dassets.dev/assets/26642/v1/model.glb',
  exhaust: 'https://cdn.3dassets.dev/assets/26643/v1/model.glb',
  battery: 'https://cdn.3dassets.dev/assets/26646/v1/model.glb',
  batteryTray: 'https://cdn.3dassets.dev/assets/26647/v1/model.glb',
  batteryClamp: 'https://cdn.3dassets.dev/assets/26648/v1/model.glb',
  headlamp: 'https://cdn.3dassets.dev/assets/26651/v1/model.glb'
};

const darkMaterial = (name='plastic') => {
  const material = new THREE.MeshStandardMaterial({ color: 0x27323d, roughness: .46, metalness: .08 });
  material.name = name;
  return material;
};

const metalMaterial = (name='metal') => {
  const material = new THREE.MeshStandardMaterial({ color: 0xa5afb8, roughness: .25, metalness: .82 });
  material.name = name;
  return material;
};

const glassMaterial = () => {
  const material = new THREE.MeshPhysicalMaterial({ color: 0xc9e4ff, transparent: true, opacity: .3, roughness: .05, metalness: 0, clearcoat: .9 });
  material.name = 'lens glass';
  return material;
};

function mesh(geometry, material, name){
  const object = new THREE.Mesh(geometry, material);
  object.name = name;
  object.castShadow = true;
  object.receiveShadow = true;
  return object;
}

function box(size, material, name){
  return mesh(new THREE.BoxGeometry(size[0], size[1], size[2], 2, 2, 2), material, name);
}

function cylinder(radiusTop, radiusBottom, height, material, name, radialSegments=40){
  return mesh(new THREE.CylinderGeometry(radiusTop, radiusBottom, height, radialSegments), material, name);
}

function tube(points, radius, material, name){
  const curve = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p)));
  return mesh(new THREE.TubeGeometry(curve, 72, radius, 18, false), material, name);
}

function makeBattery(){
  const g = new THREE.Group();
  g.name = 'DriveWell 12V battery';

  const caseBody = box([2.7, 1.55, 1.55], darkMaterial('battery plastic'), 'battery case');
  caseBody.position.y = .8;
  g.add(caseBody);

  const lid = box([2.76, .18, 1.61], darkMaterial('battery housing'), 'battery top cover');
  lid.position.y = 1.64;
  g.add(lid);

  const terminalMaterial = metalMaterial('terminal metal');
  for(const x of [-.86, .86]){
    const post = cylinder(.14, .16, .28, terminalMaterial, 'battery terminal');
    post.position.set(x, 1.88, -.38);
    g.add(post);
  }

  const label = box([1.45, .018, .72], darkMaterial('battery label'), 'battery status label');
  label.position.set(0, 1.79, .15);
  label.rotation.x = -Math.PI / 2;
  g.add(label);

  return g;
}

function makeBatteryTray(){
  const g = new THREE.Group();
  g.name = 'DriveWell battery tray';
  const material = darkMaterial('plastic tray housing');
  const base = box([3.05, .18, 1.85], material, 'battery tray base');
  base.position.y = .12;
  g.add(base);
  for(const x of [-1.42, 1.42]){
    const rail = box([.14, .38, 1.85], material, 'battery tray rail');
    rail.position.set(x, .28, 0);
    g.add(rail);
  }
  return g;
}

function makeBatteryClamp(){
  const g = new THREE.Group();
  g.name = 'DriveWell battery hold down';
  const material = metalMaterial('battery clamp metal');
  const bar = box([2.35, .16, .18], material, 'battery clamp');
  bar.position.y = .08;
  g.add(bar);
  for(const x of [-1.02, 1.02]){
    const bolt = cylinder(.07, .07, .72, material, 'battery clamp bolt', 24);
    bolt.position.set(x, -.28, 0);
    g.add(bolt);
  }
  return g;
}

function makeHeadlampLens(){
  const g = new THREE.Group();
  g.name = 'DriveWell headlamp lens';
  const lens = mesh(new THREE.SphereGeometry(1.05, 42, 24, 0, Math.PI * .95, .3, Math.PI * .48), glassMaterial(), 'headlamp lens');
  lens.scale.set(1.7, .72, .55);
  lens.rotation.set(.05, -.14, -.08);
  g.add(lens);
  return g;
}

function makeHeadlampFull(){
  const g = new THREE.Group();
  g.name = 'DriveWell headlamp assembly';

  const housing = mesh(new THREE.SphereGeometry(1.15, 42, 26), darkMaterial('headlamp housing plastic'), 'headlamp housing');
  housing.scale.set(1.75, .78, .62);
  housing.rotation.z = -.08;
  g.add(housing);

  const projectorMaterial = metalMaterial('projector metal');
  const projector = cylinder(.43, .5, .48, projectorMaterial, 'headlamp projector');
  projector.rotation.x = Math.PI / 2;
  projector.position.set(-.34, .03, .38);
  g.add(projector);

  const secondary = cylinder(.28, .34, .4, projectorMaterial, 'headlamp secondary projector');
  secondary.rotation.x = Math.PI / 2;
  secondary.position.set(.62, -.02, .35);
  g.add(secondary);

  const drlMaterial = metalMaterial('headlamp drl carrier');
  const drl = tube([[-1.2,.34,.46],[-.48,.56,.51],[.42,.48,.49],[1.18,.18,.43]], .055, drlMaterial, 'headlamp DRL strip');
  g.add(drl);

  const lens = makeHeadlampLens();
  lens.children.forEach(child => g.add(child));

  // The legacy viewer clones the loaded headlamp to create the exploded issue
  // element. Return only the lens for that second clone instead of duplicating
  // the complete lamp assembly.
  g.clone = () => makeHeadlampLens();
  return g;
}

function makeHeadlampOriginal(){
  const original = makeHeadlampFull();
  original.clone = () => makeHeadlampFull();
  return original;
}

function makeAirFilterInsert(){
  const g = new THREE.Group();
  g.name = 'DriveWell engine air filter element';
  const frameMaterial = darkMaterial('filter plastic frame');
  const mediaMaterial = darkMaterial('filter media');

  const frame = box([2.55, .2, 1.65], frameMaterial, 'air filter frame');
  g.add(frame);
  for(let i=0;i<22;i++){
    const x = -1.08 + i * (2.16 / 21);
    const pleat = box([.045, .32, 1.4], mediaMaterial, 'air filter pleat');
    pleat.position.set(x, .03, 0);
    pleat.rotation.z = i % 2 ? .07 : -.07;
    g.add(pleat);
  }
  return g;
}

function makeAirFilterFull(){
  const g = new THREE.Group();
  g.name = 'DriveWell engine airbox';
  const housingMaterial = darkMaterial('airbox housing plastic');

  const lower = box([3.05, .58, 2.12], housingMaterial, 'airbox lower housing');
  lower.position.y = .3;
  g.add(lower);

  const insert = makeAirFilterInsert();
  insert.position.y = .68;
  g.add(insert);

  const lid = box([3.1, .2, 2.16], housingMaterial, 'airbox lid');
  lid.position.y = .98;
  g.add(lid);

  const outlet = cylinder(.34, .34, 1.0, housingMaterial, 'airbox outlet', 32);
  outlet.rotation.z = Math.PI / 2;
  outlet.position.set(1.75, .6, 0);
  g.add(outlet);

  g.clone = () => makeAirFilterInsert();
  return g;
}

function makeAirFilterOriginal(){
  const original = makeAirFilterFull();
  original.clone = () => makeAirFilterFull();
  return original;
}

function makeCorrodedExhaustJoint(){
  const g = new THREE.Group();
  g.name = 'DriveWell exhaust corrosion focus';
  const material = metalMaterial('exhaust joint metal');
  const sleeve = cylinder(.34, .34, .62, material, 'corroded exhaust joint');
  sleeve.rotation.z = Math.PI / 2;
  g.add(sleeve);
  const clamp = mesh(new THREE.TorusGeometry(.36, .045, 12, 36), material, 'exhaust clamp');
  clamp.rotation.y = Math.PI / 2;
  g.add(clamp);
  return g;
}

function makeExhaustFull(){
  const g = new THREE.Group();
  g.name = 'DriveWell rear exhaust assembly';
  const material = metalMaterial('exhaust system metal');

  const frontPipe = tube([[-2.3,.9,0],[-1.55,.9,.05],[-1.0,.72,.15],[-.55,.62,.12]], .13, material, 'exhaust inlet pipe');
  g.add(frontPipe);

  const resonator = cylinder(.42, .42, 1.4, material, 'exhaust resonator');
  resonator.rotation.z = Math.PI / 2;
  resonator.position.set(.08, .62, .12);
  g.add(resonator);

  const rearPipe = tube([[.78,.62,.12],[1.28,.62,.12],[1.64,.82,.04],[2.0,.82,0]], .13, material, 'exhaust rear pipe');
  g.add(rearPipe);

  const silencer = cylinder(.62, .62, 1.45, material, 'rear silencer');
  silencer.rotation.z = Math.PI / 2;
  silencer.scale.z = .72;
  silencer.position.set(2.45, .82, 0);
  g.add(silencer);

  const tail = tube([[3.16,.82,0],[3.55,.82,0],[3.78,.88,.02]], .145, material, 'tail pipe');
  g.add(tail);

  const joint = makeCorrodedExhaustJoint();
  joint.position.set(-.62, .62, .12);
  g.add(joint);

  g.clone = () => makeCorrodedExhaustJoint();
  return g;
}

function makeExhaustOriginal(){
  const original = makeExhaustFull();
  original.clone = () => makeExhaustFull();
  return original;
}

const factories = new Map([
  [URLS.battery, makeBattery],
  [URLS.batteryTray, makeBatteryTray],
  [URLS.batteryClamp, makeBatteryClamp],
  [URLS.headlamp, makeHeadlampOriginal],
  [URLS.airFilter, makeAirFilterOriginal],
  [URLS.exhaust, makeExhaustOriginal]
]);

const originalLoad = GLTFLoader.prototype.load;

if(!GLTFLoader.prototype.__drivewellModelOverrides){
  GLTFLoader.prototype.__drivewellModelOverrides = true;
  GLTFLoader.prototype.load = function(url, onLoad, onProgress, onError){
    const factory = factories.get(url);
    if(!factory) return originalLoad.call(this, url, onLoad, onProgress, onError);

    queueMicrotask(() => {
      try{
        onLoad?.({
          scene: factory(),
          scenes: [],
          animations: [],
          cameras: [],
          asset: { generator: 'DriveWell v11b service model override' }
        });
      }catch(error){
        onError?.(error);
      }
    });

    return this;
  };
}
