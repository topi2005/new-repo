
// === BASIC SCENE SETUP ===
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(8, 6, 12);
camera.lookAt(0, -2, -10);

const renderer = new THREE.WebGLRenderer({ antialias: false }); // disable antialias for perf
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap; // cheaper shadows
document.body.appendChild(renderer.domElement);

const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.target.set(0, -2, -10);
controls.update();

// === LIGHTS ===
scene.add(new THREE.AmbientLight(0x663333, 0.6)); // warm ambient light

const redLight = new THREE.PointLight(0xff2222, 2, 80);
redLight.position.set(0, 6, -10);
redLight.castShadow = true;
scene.add(redLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 0.25);
dirLight.position.set(10, 20, 10);
dirLight.castShadow = false; // disable shadows for perf
scene.add(dirLight);

// === FLOOR & CEILING ===
const floorMat = new THREE.MeshStandardMaterial({ color: 0x220000 });
const floor = new THREE.Mesh(new THREE.PlaneGeometry(60, 120), floorMat);
floor.rotation.x = -Math.PI / 2;
floor.position.y = -3;
floor.receiveShadow = true;
scene.add(floor);

const ceiling = new THREE.Mesh(
  new THREE.PlaneGeometry(60, 100),
  new THREE.MeshBasicMaterial({ color: 0x111111 }) // no lighting, cheaper
);
ceiling.rotation.x = Math.PI / 2;
ceiling.position.set(0, 14, -10);
scene.add(ceiling);

// === WALLS (NO displacement, cheaper) ===
const texLoader = new THREE.TextureLoader();
const wallTex = texLoader.load('models/textures/dungeon-stone1-albedo2.png');
wallTex.wrapS = wallTex.wrapT = THREE.RepeatWrapping;
wallTex.repeat.set(4, 2);

const wallMaterial = new THREE.MeshStandardMaterial({
  map: wallTex,
  normalMap: texLoader.load('models/textures/dungeon-stone1-normal.png'),
  roughness: 1
});

const wallW = 60, wallH = 20, wallD = 100;

function makeWall(w, h, mat) {
  return new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
}

const backWall = makeWall(wallW, wallH, wallMaterial);
backWall.position.set(0, 4, -wallD/2);
scene.add(backWall);

const frontWall = makeWall(wallW, wallH, wallMaterial);
frontWall.position.set(0, 4, wallD/2 - 10);
frontWall.rotation.y = Math.PI;
scene.add(frontWall);

const leftWall = makeWall(wallD, wallH, wallMaterial);
leftWall.position.set(-wallW/2, 4, 0);
leftWall.rotation.y = Math.PI/2;
scene.add(leftWall);

const rightWall = makeWall(wallD, wallH, wallMaterial);
rightWall.position.set(wallW/2, 4, 0);
rightWall.rotation.y = -Math.PI/2;
scene.add(rightWall);

// === PENTAGRAM & CIRCLE ===
const pentagonRadius = 4;
const pentagonPoints = [];
for (let i = 0; i < 5; i++) {
  const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
  pentagonPoints.push(new THREE.Vector3(
    Math.cos(angle) * pentagonRadius,
    -2.99,
    Math.sin(angle) * pentagonRadius - 10
  ));
}

const pentagramGeo = new THREE.BufferGeometry();
const starIndices = [0,2,4,1,3,0];
const starVerts = [];
starIndices.forEach(i => starVerts.push(pentagonPoints[i].x, pentagonPoints[i].y, pentagonPoints[i].z));
pentagramGeo.setAttribute("position", new THREE.Float32BufferAttribute(starVerts, 3));
scene.add(new THREE.Line(pentagramGeo, new THREE.LineBasicMaterial({ color: 0xff0000 })));

const circle = new THREE.Mesh(
  new THREE.RingGeometry(pentagonRadius*0.95, pentagonRadius*1.05, 32), // half segments
  new THREE.MeshBasicMaterial({ color: 0xff0000, side: THREE.DoubleSide })
);
circle.rotation.x = -Math.PI/2;
circle.position.set(0, -2.99, -10);
scene.add(circle);

// === SIMPLE CANDLE EFFECT (emissive materials, 1 shared light) ===
const candleMat = new THREE.MeshStandardMaterial({ color: 0xffffaa, emissive: 0xffaa33, emissiveIntensity: 0.6 });
pentagonPoints.forEach(point => {
  const candle = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.5, 8), candleMat);
  candle.position.set(point.x, point.y + 0.25, point.z);
  scene.add(candle);
});

// one shared flicker light instead of dozens
const candleLight = new THREE.PointLight(0xffaa33, 1.2, 20);
candleLight.position.set(0, -2, -10);
scene.add(candleLight);

// === GLTF MODELS (LOW-IMPACT) ===
const loader = new THREE.GLTFLoader();
let doorMesh = null;

loader.load("models/scene.gltf", gltf => {
  const throne = gltf.scene;
  throne.position.set(0, -0.5, -40);
  throne.scale.set(3.5,3.5,3.5);
  throne.traverse(n => { if (n.isMesh) n.castShadow = true; });
  scene.add(throne);
});

loader.load("models/door.gltf", gltf => {
  doorMesh = gltf.scene;
  doorMesh.position.set(0, -3, 40);
  doorMesh.scale.set(4,4,4);
  scene.add(doorMesh);
});

// === ANIMATION LOOP ===
let lastTime = performance.now();
function animate() {
requestAnimationFrame(animate);
const t = performance.now() * 0.001;

// flicker main red + candle
redLight.intensity = 2 + Math.sin(t*3) * 0.5;
candleLight.intensity = 1 + Math.sin(t7) * 0.3;

// door open animation
if (doorOpeningProgress > 0 && doorMesh) {
// animate rotation/slide for dramatic open
doorOpeningProgress = Math.min(1, doorOpeningProgress + 0.02);
doorMesh.rotation.y = doorOpeningProgress * Math.PI * 0.6; // swing open
doorMesh.position.x = Math.sin(doorOpeningProgress * Math.PI * 0.6) * 6;
}

// portal pull (if active)
if (portalActive) {
const target = new THREE.Vector3(0, -1.5, -10); // center of pentagram
camera.position.lerp(target, 0.02);
controls.update();
portalScale = Math.min(2.5, portalScale + 0.02);
if (portalMesh) {
portalMesh.scale.setScalar(portalScale);
portalMesh.material.opacity = Math.min(1, portalMesh.material.opacity + 0.02);
}
// darken ambient and ramp red light
scene.background.lerp(new THREE.Color(0x220000), 0.01);
redLight.intensity = Math.min(12, redLight.intensity + 0.2);
}

// demon subtle idle (if present)
if (demonMesh && !demonLunging) {
demonMesh.rotation.y += 0.01;
}

renderer.render(scene, camera);
}
animate();

///// === GAME / RIDDLE / ATTACK LOGIC === /////
let askedRiddle1 = false;
let riddle1Solved = false;
let attacksRemaining = 0;
let demonMesh = null;
let demonOriginalPos = null;
let demonLunging = false;
let doorOpeningProgress = 0;
let portalActive = false;
let portalMesh = null;
let portalScale = 0;

///// Helper utilities /////
function wait(ms) { return new Promise(res => setTimeout(res, ms)); }

function clamp(v,min,max){ return Math.max(min,Math.min(max,v)); }

function distanceToThrone() {
if (!throneMesh) return Infinity;
return camera.position.distanceTo(throneMesh.position);
}

// create modal (non-blocking)
function createRiddleModal(question, onSubmit) {
// avoid multiple
if (document.getElementById('riddleModal')) return;
const modal = document.createElement('div');
modal.id = 'riddleModal';
Object.assign(modal.style, {
position: 'fixed', left: '50%', top: '50%', transform: 'translate(-50%, -50%)',
background: '#121212', color: '#ffd', padding: '18px', borderRadius: '8px',
minWidth: '320px', maxWidth: '640px', fontFamily: 'Arial, Helvetica, sans-serif',
zIndex: 9999, boxShadow: '0 8px 30px rgba(0,0,0,0.7)'
});
const q = document.createElement('p');
q.id = 'riddleText';
q.style.margin = '0 0 10px';
q.style.fontSize = '18px';
q.textContent = question;
const input = document.createElement('input');
input.id = 'riddleInput';
Object.assign(input.style, { width: '100%', padding: '8px', borderRadius: '6px', border: 'none', outline: 'none', marginBottom: '10px' });
const btn = document.createElement('button');
btn.textContent = 'Submit';
Object.assign(btn.style, { padding: '8px 12px', borderRadius: '6px', border: 'none', cursor: 'pointer', background: '#ff4444', color: '#fff' });
btn.onclick = () => {
const val = input.value || '';
onSubmit(val.trim());
modal.remove();
};
modal.appendChild(q);
modal.appendChild(input);
modal.appendChild(btn);
document.body.appendChild(modal);
input.focus();
input.addEventListener('keydown', (e) => { if (e.key === 'Enter') btn.click(); });
}

// create a full-screen blood canvas overlay (draw splatter)
function drawBloodSplashOnce() {
var canvas = document.getElementById('bloodCanvas');
if (!canvas) {
canvas = document.createElement('canvas');
canvas.id = 'bloodCanvas';
Object.assign(canvas.style, {
position: 'fixed', left: '0', top: '0', width: '100%', height: '100%', pointerEvents: 'none', zIndex: 9998,
transition: 'opacity 500ms ease-out',
opacity: '0'
});
document.body.appendChild(canvas);
function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
resize();
window.addEventListener('resize', resize);
}
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth; canvas.height = window.innerHeight;
// clear
ctx.clearRect(0,0,canvas.width,canvas.height);
// draw multiple blotches concentrated towards center-left (as if camera-facing)
const centerX = canvas.width * 0.5 + (Math.random() - 0.5) * canvas.width * 0.08;
const centerY = canvas.height * 0.45 + (Math.random() - 0.5) * canvas.height * 0.08;

for (let i=0;i<12;i++){
const radius = 30 + Math.random() * 180;
const x = centerX + (Math.random()-0.5) * radius*1.5;
const y = centerY + (Math.random()-0.5)*radius*0.9;
const g = ctx.createRadialGradient(x,y, radius*0.05, x,y, radius);
g.addColorStop(0, `rgba(255,20,20,${0.8 - Math.random()*0.3})`);
g.addColorStop(0.6, `rgba(120,10,10,${0.35 - Math.random()*0.15})`);
g.addColorStop(1, 'rgba(80,0,0,0)');
ctx.beginPath();
ctx.fillStyle = g;
ctx.arc(x, y, radius, 0, Math.PI*2);
ctx.fill();
}
// small high-frequency splatters
for (let i=0;i<80;i++){
ctx.beginPath();
ctx.fillStyle = `rgba(180,10,10,${0.35 + Math.random()*0.4})`;
const rx = centerX + (Math.random()-0.5)*canvas.width*0.6;
const ry = centerY + (Math.random()-0.5)*canvas.height*0.6;
const r = 1 + Math.random()*8;
ctx.arc(rx, ry, r, 0, Math.PI2);
ctx.fill();
}

// fade in then out
canvas.style.opacity = '1';
setTimeout(()=> canvas.style.opacity = '0', 350);
}

function cameraShake(duration = 350, magnitude = 0.25) {
const start = performance.now();
const originalPos = camera.position.clone();
demonLunging = true;
return new Promise(res => {
function step() {
const now = performance.now();
const elapsed = now - start;
const fraction = clamp(elapsed / duration, 0, 1);
const damper = 1 - fraction;
camera.position.x = originalPos.x + (Math.random()*2-1) * magnitude * damper;
camera.position.y = originalPos.y + (Math.random()*2-1) * magnitude * damper * 0.6;
camera.position.z = originalPos.z + (Math.random()*2-1) * magnitude * damper * 0.6;
controls.update();
if (fraction < 1) requestAnimationFrame(step);
else {
camera.position.copy(originalPos);
controls.update();
demonLunging = false;
res();
}
}
step();
});
}

// lunge routine (demon moves towards camera, splash, retreat)
async function lungeAtCamera(demon, options = {}) {
if (!demon) return;
const lungeTime = options.lungeTime || 240;
const retreatTime = options.retreatTime || 240;
const startPos = demon.position.clone();
// target near the camera, but at ground Y
const camTarget = new THREE.Vector3(camera.position.x, startPos.y, camera.position.z);
const midPos = camTarget.clone().add(new THREE.Vector3(0,0.0,0)).lerp(startPos, 0.3); // stop short

// move forward (lerp)
const t0 = performance.now();
await new Promise(res => {
function forward() {
const elapsed = performance.now() - t0;
const frac = clamp(elapsed / lungeTime, 0, 1);
demon.position.lerpVectors(startPos, midPos, frac);
if (frac < 1) requestAnimationFrame(forward);
else res();
}
forward();
});

// impact: splash + shake
drawBloodSplashOnce();
await cameraShake(360, 0.6);

// retreat
const t1 = performance.now();
await new Promise(res => {
function back() {
const elapsed = performance.now() - t1;
const frac = clamp(elapsed / retreatTime, 0, 1);
demon.position.lerpVectors(midPos, startPos, frac);
if (frac < 1) requestAnimationFrame(back);
else res();
}
back();
});
demon.position.copy(startPos);
}

// start the 5-attack flow
async function startAttackSequence() {
if (attacksRemaining > 0) return; // already in sequence
attacksRemaining = 5;
// spawn a simple "demon statue" at a random pentagon point (or reuse a statue if desired)
const idx = Math.floor(Math.random()*pentagonPoints.length);
const p = pentagonPoints[idx];
demonMesh = new THREE.Mesh(
new THREE.BoxGeometry(0.8, 2.2, 0.8),
new THREE.MeshStandardMaterial({ color: 0x330000, emissive: 0x220000, roughness: 0.8 })
);
demonMesh.position.set(p.x, p.y + 1.1, p.z);
demonMesh.castShadow = true;
scene.add(demonMesh);
demonOriginalPos = demonMesh.position.clone();

// small pre-awaken animation
const wakeStart = performance.now();
const wakeDur = 400;
await new Promise(res => {
function wake() {
const elapsed = performance.now() - wakeStart;
const frac = clamp(elapsed / wakeDur, 0, 1);
demonMesh.scale.setScalar(0.8 + frac * 0.4);
demonMesh.rotation.y += 0.06 * frac;
if (frac < 1) requestAnimationFrame(wake);
else res();
}
wake();
});

// five lunges
while (attacksRemaining > 0) {
await lungeAtCamera(demonMesh);
attacksRemaining--;
await wait(280); // small gap
}

// remove statue after attacks
if (demonMesh) { scene.remove(demonMesh); demonMesh = null; }

// after 5 attacks: show second riddle
await wait(450);
askSecondRiddle();
}

// open door animation
function openDoor() {
if (!doorMesh) { doorOpenRequested = true; return; }
doorOpenRequested = false;
doorOpeningProgress = 0.01; // will ramp up in animate()
// small audio cue or overlay could be added
}

// portal to hell
function triggerPortalToHell() {
if (portalActive) return;
portalActive = true;
// make pentagram glow brighter
circle.material.opacity = 1;
// create a portal mesh (ring with additive look)
const portalGeo = new THREE.RingGeometry(1.2, pentagonRadius*1.2, 64);
const portalMat = new THREE.MeshBasicMaterial({ color: 0x440000, side: THREE.DoubleSide, transparent: true, opacity: 0 });
portalMesh = new THREE.Mesh(portalGeo, portalMat);
portalMesh.rotation.x = -Math.PI/2;
portalMesh.position.set(0, -2.98, -10.01);
scene.add(portalMesh);
portalScale = 0.01;
portalMesh.scale.setScalar(portalScale);

// after some seconds, full pull and blackout
setTimeout(async () => {
// wait while portal pulls camera until camera is close to center
await wait(3000);
// final blackout overlay
const blk = document.createElement('div');
Object.assign(blk.style, {
position: 'fixed', left: 0, top: 0, width: '100%', height: '100%', background: '#000', opacity: 0, transition: 'opacity 1200ms',
zIndex: 10000, pointerEvents: 'none'
});
document.body.appendChild(blk);
blk.style.opacity = '1';
// final "taken" message
const msg = document.createElement('div');
msg.textContent = 'You have been dragged into the abyss...';
Object.assign(msg.style, {
position: 'fixed', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', color:'#ff6464',
fontFamily: 'Arial, Helvetica, sans-serif', fontSize: '22px', zIndex: 10001
});
document.body.appendChild(msg);
await wait(1800);
// optionally reload or go to "game over"
// location.reload(); // uncomment if you want to restart
}, 4500);
}

///// === RIDDLES & Triggers === ///
function askFirstRiddle() {
if (askedRiddle1) return;
askedRiddle1 = true;
createRiddleModal(
"Riddle: I speak without a mouth and hear without ears. I have nobody, but I come alive with wind. What am I?",
(answer) => {
const a = (answer || '').toLowerCase().trim();
if (a === 'echo' || a === 'an echo') {
riddle1Solved = true;
openDoor();
// success flash
const s = document.createElement('div');
s.textContent = 'Correct — the door opens.';
Object.assign(s.style, { position:'fixed', left:'50%', top:'10%', transform:'translateX(-50%)', color:'#aaffaa', zIndex:10001, padding:'8px 12px', background:'#002200', borderRadius:'6px' });
document.body.appendChild(s);
setTimeout(()=>s.remove(), 2200);
} else {
// wrong -> awaken demon & attack 5 times then repeat with a different riddle
startAttackSequence();
}
}
);
}

function askSecondRiddle() {
// similar modal; only show once per failure
if (document.getElementById('riddleModal')) return;
createRiddleModal(
"Riddle 2: The more you take, the more you leave behind. What am I?",
(answer) => {
const a = (answer || '').toLowerCase().trim();
if (a === 'footsteps' || a === 'a footprint' || a === 'footstep') {
openDoor();
const s = document.createElement('div');
s.textContent = 'Correct — the door opens.';
Object.assign(s.style, { position:'fixed', left:'50%', top:'10%', transform:'translateX(-50%)', color:'#aaffaa', zIndex:10001, padding:'8px 12px', background:'#002200', borderRadius:'6px' });
document.body.appendChild(s);
setTimeout(()=>s.remove(), 2000);
} else {
// second failure -> pentagram glow + portal to hell
triggerPortalToHell();
}
}
);
}

///// === Proximity check to throne (poll in rAF via a short interval) === ///
setInterval(() => {
if (!askedRiddle1 && throneMesh) {
// if player near the throne, ask riddle 1
const d = distanceToThrone();
if (d < 6) {
askFirstRiddle();
}
}
}, 600);

///// === small safety handlers === ///
window.addEventListener('keydown', (e) => {
// quick dev keys: O = open door (for testing), P = spawn attack (for testing)
if (e.key === 'O' || e.key === 'o') { openDoor(); }
if (e.key === 'P' || e.key === 'p') { startAttackSequence(); }
});

///// === Optional: cleanup on unload to avoid leftover DOM clutter === ///
window.addEventListener('beforeunload', () => {
const m = document.getElementById('riddleModal');
if (m) m.remove();
const c = document.getElementById('bloodCanvas');
if (c) c.remove();
});