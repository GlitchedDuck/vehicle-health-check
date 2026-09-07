import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.179.1/build/three.module.js';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.179.1/examples/jsm/controls/OrbitControls.js';

const SEVERITY = {
  green: { colour: 0x43c483, label: 'Healthy', rank: 0 },
  amber: { colour: 0xf0b84f, label: 'Attention', rank: 1 },
  red: { colour: 0xef5d65, label: 'Urgent', rank: 2 }
};

const sampleVehicle = {
  registration: 'AB12 CDE',
  name: '2021 Example SUV',
  mileage: '41,280 mi',
  inspectionDate: '2 Sep 2026',
  issues: [
    {
      id: 'tyre-fl',
      componentKey: 'tyre.FL',
      meshName: 'TYRE_FL',
      title: 'Nearside front tyre',
      location: 'Front left wheel',
      severity: 'red',
      officialSeverity: 'Major',
      source: 'MOT',
      action: 'Replace before driving',
      description: 'Tyre tread depth is below the legal minimum. This component is shown in red because it needs urgent attention.'
    },
    {
      id: 'brake-rr',
      componentKey: 'brake.RR',
      meshName: 'BRAKE_RR',
      title: 'Offside rear brake pad',
      location: 'Rear right wheel',
      severity: 'amber',
      officialSeverity: 'Advisory',
      source: 'MOT',
      action: 'Plan replacement soon',
      description: 'Brake pad is wearing thin. It is not classed as an immediate failure in this sample, but should be monitored and replaced soon.'
    },
    {
      id: 'lamp-fr',
      componentKey: 'lamp.FR',
      meshName: 'LAMP_FR',
      title: 'Offside front lamp',
      location: 'Front right lamp',
      severity: 'amber',
      officialSeverity: 'Minor',
      source: 'MOT',
      action: 'Repair when convenient',
      description: 'Lamp output is reduced. The issue is highlighted amber to show attention is needed without overriding more serious faults.'
    },
    {
      id: 'battery',
      componentKey: 'battery.main',
      meshName: 'BATTERY',
      title: '12V battery health',
      location: 'Engine bay',
      severity: 'amber',
      officialSeverity: 'Service item',
      source: 'Service inspection',
      action: 'Retest at next service',
      description: 'Battery state of health is 71% in this mock service report. It remains usable but is beginning to deteriorate.'
    }
  ]
};

const viewer = document.getElementById('viewer');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0b1017);
scene.fog = new THREE.Fog(0x0b1017, 12, 25);

const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
camera.position.set(7.7, 4.5, 8.5);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
viewer.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.target.set(0, 0.9, 0);
controls.minDistance = 5.5;
controls.maxDistance = 15;
controls.maxPolarAngle = Math.PI / 2.03;

scene.add(new THREE.HemisphereLight(0xcfe0ff, 0x26303f, 2.2));
const keyLight = new THREE.DirectionalLight(0xffffff, 3.2);
keyLight.position.set(5, 9, 7);
keyLight.castShadow = true;
scene.add(keyLight);

const floor = new THREE.Mesh(
  new THREE.CircleGeometry(7.4, 80),
  new THREE.MeshStandardMaterial({ color: 0x111823, roughness: 0.85, metalness: 0.1 })
);
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
scene.add(floor);

const platform = new THREE.Mesh(
  new THREE.CylinderGeometry(4.7, 4.9, 0.26, 72),
  new THREE.MeshStandardMaterial({ color: 0x171e29, roughness: 0.65, metalness: 0.2 })
);
platform.position.y = 0.11;
platform.receiveShadow = true;
scene.add(platform);

const car = new THREE.Group();
car.position.y = 0.5;
scene.add(car);

const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x65748a, metalness: 0.55, roughness: 0.28 });
const glassMaterial = new THREE.MeshStandardMaterial({ color: 0x172333, metalness: 0.15, roughness: 0.18, transparent: true, opacity: 0.82 });
const darkMaterial = new THREE.MeshStandardMaterial({ color: 0x15191f, metalness: 0.35, roughness: 0.55 });
const healthyMaterial = new THREE.MeshStandardMaterial({ color: SEVERITY.green.colour, metalness: 0.25, roughness: 0.4 });

function box(name, size, pos, material, radius = 0) {
  const geo = new THREE.BoxGeometry(...size);
  const mesh = new THREE.Mesh(geo, material);
  mesh.name = name;
  mesh.position.set(...pos);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  car.add(mesh);
  return mesh;
}

box('BODY_MAIN', [4.8, 0.75, 2.2], [0, 1.05, 0], bodyMaterial);
box('BODY_NOSE', [1.55, 0.52, 2.0], [2.72, 1.02, 0], bodyMaterial);
box('CABIN', [2.75, 1.0, 1.95], [-0.25, 1.78, 0], glassMaterial);
box('ROOF', [2.3, 0.17, 1.82], [-0.35, 2.34, 0], bodyMaterial);
box('BATTERY', [0.72, 0.28, 0.48], [2.12, 1.47, -0.45], healthyMaterial.clone());

const wheelPositions = [
  ['FL', 1.75, -1.2], ['FR', 1.75, 1.2], ['RL', -1.75, -1.2], ['RR', -1.75, 1.2]
];

for (const [key, x, z] of wheelPositions) {
  const tyre = new THREE.Mesh(
    new THREE.CylinderGeometry(0.53, 0.53, 0.38, 36),
    darkMaterial.clone()
  );
  tyre.rotation.x = Math.PI / 2;
  tyre.position.set(x, 0.68, z);
  tyre.name = `TYRE_${key}`;
  tyre.castShadow = true;
  car.add(tyre);

  const brake = new THREE.Mesh(
    new THREE.CylinderGeometry(0.29, 0.29, 0.12, 32),
    healthyMaterial.clone()
  );
  brake.rotation.x = Math.PI / 2;
  brake.position.set(x, 0.68, z > 0 ? z - 0.21 : z + 0.21);
  brake.name = `BRAKE_${key}`;
  car.add(brake);
}

const lampGeo = new THREE.BoxGeometry(0.24, 0.28, 0.55);
for (const [name, z] of [['LAMP_FL', -0.72], ['LAMP_FR', 0.72]]) {
  const lamp = new THREE.Mesh(lampGeo, healthyMaterial.clone());
  lamp.position.set(3.47, 1.2, z);
  lamp.name = name;
  lamp.castShadow = true;
  car.add(lamp);
}

const issueByMesh = new Map();
const defaultColours = new Map();

function applyIssues(vehicle) {
  issueByMesh.clear();
  car.traverse(obj => {
    if (obj.isMesh && obj.material && obj.material.color) {
      if (!defaultColours.has(obj.name)) defaultColours.set(obj.name, obj.material.color.clone());
      const original = defaultColours.get(obj.name);
      if (original) obj.material.color.copy(original);
      if (obj.material.emissive) obj.material.emissive.setHex(0x000000);
    }
  });

  vehicle.issues.forEach(issue => {
    const mesh = car.getObjectByName(issue.meshName);
    if (!mesh || !mesh.material) return;
    mesh.material.color.setHex(SEVERITY[issue.severity].colour);
    if (mesh.material.emissive) {
      mesh.material.emissive.setHex(SEVERITY[issue.severity].colour);
      mesh.material.emissiveIntensity = 0.16;
    }
    issueByMesh.set(mesh.name, issue);
  });
}

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

renderer.domElement.addEventListener('pointerdown', event => {
  const rect = renderer.domElement.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  const hits = raycaster.intersectObjects(car.children, true);
  const hit = hits.find(h => issueByMesh.has(h.object.name));
  if (hit) selectIssue(issueByMesh.get(hit.object.name));
});

function renderIssueList(filter = 'all') {
  const list = document.getElementById('issueList');
  list.innerHTML = '';
  const wanted = sampleVehicle.issues.filter(issue => {
    if (filter === 'all') return true;
    if (filter === 'urgent') return issue.severity === 'red';
    if (filter === 'attention') return issue.severity === 'amber';
    return true;
  });

  for (const issue of wanted) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'issue';
    const pillClass = issue.severity === 'red' ? 'red-pill' : issue.severity === 'amber' ? 'amber-pill' : 'green-pill';
    btn.innerHTML = `
      <div class="issue-top">
        <div>
          <div class="issue-title">${issue.title}</div>
          <div class="issue-meta">${issue.location} · ${issue.source}</div>
        </div>
        <span class="severity-pill ${pillClass}">${issue.officialSeverity}</span>
      </div>`;
    btn.addEventListener('click', () => selectIssue(issue));
    list.appendChild(btn);
  }
}

function selectIssue(issue) {
  document.getElementById('detailTitle').textContent = issue.title;
  document.getElementById('detailLocation').textContent = issue.location;
  document.getElementById('detailSeverity').textContent = issue.officialSeverity;
  document.getElementById('detailSource').textContent = issue.source;
  document.getElementById('detailAction').textContent = issue.action;
  document.getElementById('detailDescription').textContent = issue.description;

  const severityEl = document.getElementById('detailSeverity');
  severityEl.className = 'severity-pill ' + (issue.severity === 'red' ? 'red-pill' : issue.severity === 'amber' ? 'amber-pill' : 'green-pill');

  const mesh = car.getObjectByName(issue.meshName);
  if (mesh) {
    const world = new THREE.Vector3();
    mesh.getWorldPosition(world);
    controls.target.lerp(world, 0.55);
  }
}

function updateSummary(registration) {
  document.getElementById('vehicleName').textContent = sampleVehicle.name;
  document.getElementById('mileage').textContent = sampleVehicle.mileage;
  document.getElementById('inspectionDate').textContent = `Latest inspection · ${sampleVehicle.inspectionDate}`;
  document.getElementById('findingCount').textContent = String(sampleVehicle.issues.length);
  const worst = Math.max(...sampleVehicle.issues.map(i => SEVERITY[i.severity].rank));
  const status = document.getElementById('overallStatus');
  if (worst >= 2) { status.textContent = 'Urgent attention'; status.className = 'status-red'; }
  else if (worst === 1) { status.textContent = 'Attention needed'; status.className = 'status-amber'; }
  else { status.textContent = 'Healthy'; status.className = 'status-green'; }
  document.title = `${registration} · Vehicle Health Visualiser`;
}

function resetCamera() {
  camera.position.set(7.7, 4.5, 8.5);
  controls.target.set(0, 0.9, 0);
  controls.update();
}

document.getElementById('resetView').addEventListener('click', resetCamera);
document.getElementById('loadVehicle').addEventListener('click', () => {
  const field = document.getElementById('registration');
  const cleaned = field.value.toUpperCase().replace(/[^A-Z0-9 ]/g, '').trim() || 'AB12 CDE';
  field.value = cleaned;
  updateSummary(cleaned);
  applyIssues(sampleVehicle);
  renderIssueList('all');
  document.querySelectorAll('.filter').forEach(b => b.classList.toggle('active', b.dataset.filter === 'all'));
  selectIssue(sampleVehicle.issues[0]);
});

document.querySelectorAll('.filter').forEach(button => {
  button.addEventListener('click', () => {
    document.querySelectorAll('.filter').forEach(b => b.classList.toggle('active', b === button));
    renderIssueList(button.dataset.filter);
  });
});

function resize() {
  const width = viewer.clientWidth;
  const height = viewer.clientHeight;
  renderer.setSize(width, height, false);
  camera.aspect = width / Math.max(height, 1);
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', resize);
resize();

applyIssues(sampleVehicle);
renderIssueList('all');
updateSummary(sampleVehicle.registration);
selectIssue(sampleVehicle.issues[0]);

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}
animate();
