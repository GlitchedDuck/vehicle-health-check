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
  const material = new THREE.MeshPhysicalMaterial({
    color: 0xd9efff,
    transparent: true,
    opacity: .24,
    roughness: .04,
    metalness: 0,
    transmission: .18,
    clearcoat: .95,
    clearcoatRoughness: .04,
    side: THREE.DoubleSide
  });
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

function headlampProfileGeometry(depth=.46, scale=1){
  const shape = new THREE.Shape();
  shape.moveTo(-1.48 * scale, -.32 * scale);
  shape.bezierCurveTo(-1.30 * scale, .10 * scale, -1.08 * scale, .42 * scale, -.68 * scale, .48 * scale);
  shape.bezierCurveTo(-.12 * scale, .56 * scale, .62 * scale, .45 * scale, 1.28 * scale, .17 * scale);
  shape.lineTo(1.42 * scale, -.03 * scale);
  shape.bezierCurveTo(1.08 * scale, -.22 * scale, .62 * scale, -.38 * scale, .04 * scale, -.43 * scale);
  shape.bezierCurveTo(-.50 * scale, -.48 * scale, -1.05 * scale, -.44 * scale, -1.48 * scale, -.32 * scale);
  shape.closePath();

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelSegments: 4,
    bevelSize: .055 * scale,
    bevelThickness: .045 * scale,
    steps: 1,
    curveSegments: 18
  });
  geometry.center();
  return geometry;
}

function makeProjectorModule(radius=.38, depth=.42){
  const g = new THREE.Group();
  g.name = 'DriveWell headlamp projector module';

  const carrier = cylinder(radius * 1.16, radius * 1.05, depth, darkMaterial('projector housing plastic'), 'projector housing', 44);
  carrier.rotation.x = Math.PI / 2;
  g.add(carrier);

  const reflector = cylinder(radius, radius * .76, depth * .68, metalMaterial('projector reflector metal'), 'projector reflector', 44);
  reflector.rotation.x = Math.PI / 2;
  reflector.position.z = .11;
  g.add(reflector);

  const lensMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xeaf7ff,
    transparent: true,
    opacity: .55,
    roughness: .02,
    metalness: 0,
    transmission: .32,
    clearcoat: 1
  });
  lensMaterial.name = 'projector lens glass';
  const lens = mesh(new THREE.SphereGeometry(radius * .73, 36, 20), lensMaterial, 'projector lens');
  lens.scale.z = .28;
  lens.position.z = depth * .55;
  g.add(lens);

  return g;
}

function makeHeadlampFocusPiece(){
  const g = makeProjectorModule(.38, .44);
  g.name = 'DriveWell failed projector module';
  g.scale.setScalar(.96);
  return g;
}

function makeHeadlampFull(){
  const g = new THREE.Group();
  g.name = 'DriveWell headlamp assembly';

  const housing = mesh(headlampProfileGeometry(.56, 1.02), darkMaterial('headlamp housing plastic'), 'headlamp housing');
  housing.position.z = -.12;
  g.add(housing);

  const inner = mesh(headlampProfileGeometry(.34, .91), metalMaterial('headlamp reflector carrier'), 'headlamp reflector carrier');
  inner.position.z = .10;
  inner.scale.set(.98, .90, 1);
  g.add(inner);

  const mainProjector = makeProjectorModule(.36, .42);
  mainProjector.position.set(-.42, .01, .34);
  g.add(mainProjector);

  const secondary = makeProjectorModule(.25, .34);
  secondary.position.set(.48, -.04, .34);
  secondary.scale.setScalar(.88);
  g.add(secondary);

  const drlMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xf5fbff,
    emissive: 0xc8e7ff,
    emissiveIntensity: .7,
    roughness: .18,
    metalness: .02
  });
  drlMaterial.name = 'headlamp drl light';
  const drl = tube([[-1.10,.25,.39],[-.66,.39,.44],[-.04,.41,.44],[.54,.31,.42],[1.03,.12,.39]], .045, drlMaterial, 'headlamp DRL strip');
  g.add(drl);

  const indicatorMaterial = new THREE.MeshStandardMaterial({
    color: 0xffa12b,
    emissive: 0x6f3000,
    emissiveIntensity: .35,
    roughness: .34,
    metalness: .02
  });
  indicatorMaterial.name = 'headlamp indicator';
  const indicator = box([.34, .10, .08], indicatorMaterial, 'headlamp indicator');
  indicator.position.set(.95, -.13, .42);
  indicator.rotation.z = -.12;
  g.add(indicator);

  const lens = mesh(headlampProfileGeometry(.07, 1.01), glassMaterial(), 'headlamp clear lens');
  lens.position.z = .48;
  g.add(lens);

  // The legacy viewer clones the loaded headlamp to create the exploded issue
  // element. Return only the projector module so the issue highlight is a
  // believable failed light unit rather than a giant recoloured lens.
  g.clone = () => makeHeadlampFocusPiece();
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
