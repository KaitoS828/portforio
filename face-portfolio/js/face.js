import * as THREE from 'https://esm.sh/three@0.170.0';
import { GLTFLoader }  from 'https://esm.sh/three@0.170.0/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'https://esm.sh/three@0.170.0/examples/jsm/loaders/DRACOLoader.js';

// ---- zoom config ----
const ZOOM_MIN   = 0.5;
const ZOOM_MAX   = 2.5;
const ZOOM_DEF   = 1.0;
const ZOOM_SPEED = 0.001;

// Scroll scale multiplier set by animations.js; defaults to 1
export const animState = { scrollScale: 1 };

// ---- モデル一覧（セクション順） ----
// 0: Hero, 1: About, 2: Works, 3: Contact
const MODEL_PATHS = [
  './assets/model-draco.glb',          // 0: Hero    — Standard Walk
  './assets/house-dancing-draco.glb',  // 1: About   — House Dancing
  './assets/typing-draco.glb',         // 2: Works   — Typing
  './assets/running-jump-draco.glb',   // 3: Contact — Running Jump
];

export async function loadFace(scene, camera) {
  const canvas   = document.getElementById('canvas');
  const dragHint = document.getElementById('drag-hint');
  const zoomHint = document.getElementById('zoom-hint');
  const zoomFill = document.getElementById('zoom-fill');

  const clock = new THREE.Clock();

  // ---- Groups ----
  const faceGroup = new THREE.Group();
  const rotGroup  = new THREE.Group();
  faceGroup.add(rotGroup);
  scene.add(faceGroup);

  // ---- DRACOLoader セットアップ ----
  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath('https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/libs/draco/');

  const loader = new GLTFLoader();
  loader.setDRACOLoader(dracoLoader);

  // ---- 全モデルを並列ロード ----
  const gltfResults = await Promise.all(MODEL_PATHS.map(p => loader.loadAsync(p)));

  const modelData = gltfResults.map((gltf, i) => {
    const model = gltf.scene;

    // Auto-center & scale
    const box    = new THREE.Box3().setFromObject(model);
    const center = box.getCenter(new THREE.Vector3());
    const size   = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const s      = 2.5 / maxDim;
    model.scale.setScalar(s);
    model.position.sub(center.multiplyScalar(s));
    model.position.y -= 1.2;

    // Mesh収集 & マテリアル複製（emissive用）
    const meshes = [];
    model.traverse((child) => {
      if (child.isMesh) {
        child.castShadow    = true;
        child.receiveShadow = true;
        if (child.material) {
          child.material = child.material.clone();
          child.material.emissive = child.material.emissive
            ? child.material.emissive.clone()
            : new THREE.Color(0x000000);
          child.material.emissiveIntensity = 1;
        }
        meshes.push(child);
      }
    });

    // Animation Mixer
    let mixer = null;
    if (gltf.animations?.length > 0) {
      mixer = new THREE.AnimationMixer(model);
      gltf.animations.forEach((clip) => mixer.clipAction(clip).play());
      console.log(`Model[${i}] animations: ${gltf.animations.length} clip(s)`);
    }

    // 各モデルを独立したGroupに入れてrotGroupへ
    const group = new THREE.Group();
    group.add(model);
    group.visible = (i === 0); // 最初はHeroモデルのみ表示
    rotGroup.add(group);

    return { meshes, mixer, group };
  });

  // ---- アクティブモデル管理 ----
  let activeIdx         = 0;
  let activeMeshes      = modelData[0].meshes;
  let transitionTimer   = 1.0; // 1 = 完了, 0→1 でスケールイン

  function setModelIndex(idx) {
    if (idx === activeIdx || idx >= modelData.length) return;
    modelData[activeIdx].group.visible = false;
    activeIdx    = idx;
    activeMeshes = modelData[idx].meshes;
    modelData[idx].group.visible = true;
    transitionTimer = 0; // スケールイン開始
    // emissiveリセット
    emissiveCurrent = 0;
    emissiveTarget  = isHovered ? 0.4 : 0;
  }

  // ---- Lighting ----
  scene.add(new THREE.AmbientLight(0xffffff, 0.15));

  const keyLight = new THREE.DirectionalLight(0xffffff, 2.8);
  keyLight.position.set(1.5, 3, 5);
  scene.add(keyLight);

  const rimL = new THREE.PointLight(0xffffff, 4, 12);
  rimL.position.set(-4, 1, -2);
  scene.add(rimL);

  const rimR = new THREE.PointLight(0xffffff, 2.5, 12);
  rimR.position.set(4, 0, -2);
  scene.add(rimR);

  const fillLight = new THREE.PointLight(0xffffff, 1.0, 10);
  fillLight.position.set(0, -3, 3);
  scene.add(fillLight);

  const light1 = rimL, light2 = rimR, light3 = fillLight;

  // ---- Interaction State ----
  let mouseFollow = { x: 0, y: 0 };
  let zoomTarget  = ZOOM_DEF;
  let zoomCurrent = ZOOM_DEF;
  let hintTimer   = null;

  // ---- Raycasting & Hover / Click ----
  const raycaster = new THREE.Raycaster();
  const pointer   = new THREE.Vector2();

  let isHovered       = false;
  let emissiveCurrent = 0;
  let emissiveTarget  = 0;
  let pulseT          = 0;
  let pulseMult       = 1.0;

  function hitTest(clientX, clientY) {
    if (!camera) return false;
    pointer.x =  (clientX / window.innerWidth)  * 2 - 1;
    pointer.y = -(clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    return raycaster.intersectObjects(activeMeshes, false).length > 0;
  }

  function setHover(val) {
    if (val === isHovered) return;
    isHovered      = val;
    emissiveTarget = val ? 0.4 : 0;
    canvas.style.cursor = val ? 'pointer' : '';
    canvas.dispatchEvent(new CustomEvent(val ? 'modelenter' : 'modelleave'));
  }

  function triggerPulse() {
    pulseT = 1.0;
  }

  // Hint
  setTimeout(() => {
    dragHint.classList.add('visible');
    hintTimer = setTimeout(() => dragHint.classList.add('hidden'), 4000);
  }, 1200);

  // ---- Mouse-follow (idle) ----
  window.addEventListener('mousemove', (e) => {
    mouseFollow.x = (e.clientX / window.innerWidth  - 0.5) * Math.PI * 0.25;
    mouseFollow.y = (e.clientY / window.innerHeight - 0.5) * Math.PI * 0.15;
  });

  // ---- Hover detection ----
  canvas.addEventListener('mousemove', (e) => setHover(hitTest(e.clientX, e.clientY)));

  // ---- Click detection ----
  let clickDownPos = { x: 0, y: 0 };
  canvas.addEventListener('mousedown', (e) => { clickDownPos = { x: e.clientX, y: e.clientY }; });
  canvas.addEventListener('mouseup',   (e) => {
    const d = Math.hypot(e.clientX - clickDownPos.x, e.clientY - clickDownPos.y);
    if (d < 6 && isHovered) triggerPulse();
  });

  // ---- Touch tap ----
  let tapStart = { x: 0, y: 0 };
  canvas.addEventListener('touchstart', (e) => {
    if (e.touches.length === 1) tapStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }, { passive: true });
  canvas.addEventListener('touchend', (e) => {
    if (e.changedTouches.length === 1) {
      const t = e.changedTouches[0];
      if (Math.hypot(t.clientX - tapStart.x, t.clientY - tapStart.y) < 10 &&
          hitTest(t.clientX, t.clientY)) triggerPulse();
    }
  }, { passive: true });

  // ---- Wheel zoom ----
  function onWheel(e) {
    e.preventDefault();
    zoomTarget = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, zoomTarget - e.deltaY * ZOOM_SPEED * 0.8));
    updateZoomUI();
    zoomHint.classList.add('visible');
    clearTimeout(zoomHint._timer);
    zoomHint._timer = setTimeout(() => zoomHint.classList.remove('visible'), 1500);
  }

  function updateZoomUI() {
    const ratio = (zoomTarget - ZOOM_MIN) / (ZOOM_MAX - ZOOM_MIN);
    zoomFill.style.height = (ratio * 100) + '%';
  }
  updateZoomUI();

  canvas.addEventListener('wheel', onWheel, { passive: false });

  // ---- Tick ----
  function tick(elapsed) {
    const delta = clock.getDelta();

    // アクティブモデルのmixerのみ更新
    const active = modelData[activeIdx];
    if (active.mixer) active.mixer.update(delta);

    // モデル切り替えスケールイン
    if (transitionTimer < 1) {
      transitionTimer = Math.min(1, transitionTimer + 0.06);
      const ease = 1 - Math.pow(1 - transitionTimer, 3); // ease-out cubic
      active.group.scale.setScalar(ease);
    }

    // マウス追従のみ（ドラッグ回転なし）
    rotGroup.rotation.y += (mouseFollow.x - rotGroup.rotation.y) * 0.06;
    rotGroup.rotation.x += (mouseFollow.y - rotGroup.rotation.x) * 0.06;

    // Emissive glow
    emissiveCurrent += (emissiveTarget - emissiveCurrent) * 0.08;
    activeMeshes.forEach((m) => {
      if (m.material?.emissive) {
        m.material.emissive.setRGB(0, emissiveCurrent * 0.96, emissiveCurrent);
      }
    });

    // Pulse
    if (pulseT > 0) {
      pulseT    = Math.max(0, pulseT - 0.045);
      pulseMult = 1 + Math.sin(pulseT * Math.PI) * 0.13;
    } else {
      pulseMult = 1.0;
    }

    // Zoom + scale
    zoomCurrent += (zoomTarget - zoomCurrent) * 0.08;
    faceGroup.scale.setScalar(zoomCurrent * animState.scrollScale * pulseMult);

    // Idle float
    faceGroup.position.y += (Math.sin(elapsed * 0.5) * 0.05 - faceGroup.position.y) * 0.05;

    // Light orbit
    light1.position.x = Math.sin(elapsed * 0.18) * 4.5;
    light1.position.z = Math.cos(elapsed * 0.18) * 2;
    light2.position.x = Math.sin(elapsed * 0.13 + Math.PI) * 4;
    light2.position.y = Math.cos(elapsed * 0.22) * 1.5;
    light3.position.y = Math.sin(elapsed * 0.10) * 1.5 - 2;
  }

  return { faceGroup, tick, setModelIndex };
}
