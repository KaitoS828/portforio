import { initScene }    from './scene.js';
import { loadFace, animState } from './face.js';
import { createParticles } from './particles.js';

const canvas  = document.getElementById('canvas');
const loading = document.getElementById('loading');

// ===== Custom Cursor =====
const cursorEl = document.createElement('div');
cursorEl.className = 'cursor';
document.body.appendChild(cursorEl);

const trailEl = document.createElement('div');
trailEl.className = 'cursor-trail';
document.body.appendChild(trailEl);

let mx = 0, my = 0, tx = 0, ty = 0;

document.addEventListener('mousemove', (e) => {
  mx = e.clientX; my = e.clientY;
  cursorEl.style.left = mx + 'px';
  cursorEl.style.top  = my + 'px';
});

(function loopCursor() {
  tx += (mx - tx) * 0.12;
  ty += (my - ty) * 0.12;
  trailEl.style.left = tx + 'px';
  trailEl.style.top  = ty + 'px';
  requestAnimationFrame(loopCursor);
})();

document.querySelectorAll('a, button, .work-item, .contact-row').forEach((el) => {
  el.addEventListener('mouseenter', () => {
    cursorEl.style.transform  = 'translate(-50%,-50%) scale(1.6)';
    trailEl.style.transform   = 'translate(-50%,-50%) scale(1.4)';
  });
  el.addEventListener('mouseleave', () => {
    cursorEl.style.transform  = 'translate(-50%,-50%) scale(1)';
    trailEl.style.transform   = 'translate(-50%,-50%) scale(1)';
  });
});

// ===== Panel Navigation =====
const panels    = Array.from(document.querySelectorAll('.panel'));
const navBtns   = Array.from(document.querySelectorAll('.nav-btn'));
const jsBtns    = Array.from(document.querySelectorAll('.js-goto'));
const fill      = document.getElementById('progress-fill');
const divFill   = document.getElementById('divider-fill');
const dragHint  = document.getElementById('drag-hint');
const zoomHint  = document.getElementById('zoom-hint');
const zoomFill  = document.getElementById('zoom-fill');

let currentPanel    = 0;
let faceGroupRef    = null;
let setModelIndexRef = null; // loadFace後にセット

// Face X position per panel
const faceXByPanel    = [-1.1, -1.5, -0.8, -1.1];
let facePosXTarget    = faceXByPanel[0];

// モデルスケール per panel（Contact は小さめ）
const faceScaleByPanel = [1.0, 1.0, 0.9, 0.6];
let faceScaleTarget    = faceScaleByPanel[0];

function switchPanel(idx) {
  if (idx === currentPanel) return;

  // Outgoing
  const old = panels[currentPanel];
  old.classList.add('leaving');
  old.classList.remove('active');
  setTimeout(() => old.classList.remove('leaving'), 350);

  // Incoming (slight delay)
  setTimeout(() => panels[idx].classList.add('active'), 100);

  navBtns.forEach((b, i) => b.classList.toggle('active', i === idx));

  // Progress bar
  fill.style.transform  = `translateX(${idx * 100}%)`;
  divFill.style.top     = `${idx * 25}%`;

  // Face X / Scale offset
  facePosXTarget  = faceXByPanel[idx];
  faceScaleTarget = faceScaleByPanel[idx];

  // モデル切り替え（loadFace後に有効になる）
  setModelIndexRef?.(idx);

  currentPanel = idx;
}

navBtns.forEach((btn) => {
  btn.addEventListener('click', () => switchPanel(parseInt(btn.dataset.panel)));
});

jsBtns.forEach((btn) => {
  btn.addEventListener('click', () => switchPanel(parseInt(btn.dataset.panel)));
});

// Keyboard navigation (← →)
document.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowRight') switchPanel(Math.min(currentPanel + 1, 3));
  if (e.key === 'ArrowLeft')  switchPanel(Math.max(currentPanel - 1, 0));
});

// ===== Zoom UI helper (re-wired from face.js) =====
function updateZoomUI(zoomTarget, ZOOM_MIN, ZOOM_MAX) {
  const ratio = (zoomTarget - ZOOM_MIN) / (ZOOM_MAX - ZOOM_MIN);
  // horizontal bar in v2
  zoomFill.style.width = (ratio * 100) + '%';
  zoomFill.style.height = '100%';
}

// ===== Main init =====
async function init() {
  const { scene, camera, renderer, composer } = initScene(canvas);

  let faceTick, particlesTick;

  try {
    const { faceGroup, tick, setModelIndex } = await loadFace(scene, camera);
    faceGroupRef     = faceGroup;
    setModelIndexRef = setModelIndex; // switchPanel から参照できるようにセット

    // Shift face to left half initially
    faceGroup.position.x = facePosXTarget;

    faceTick = tick;

    const { tick: pTick } = createParticles(scene);
    particlesTick = pTick;

    // モデルホバー時にカーソル拡大
    canvas.addEventListener('modelenter', () => {
      cursorEl.style.transform = 'translate(-50%,-50%) scale(2)';
      trailEl.style.transform  = 'translate(-50%,-50%) scale(1.6)';
    });
    canvas.addEventListener('modelleave', () => {
      cursorEl.style.transform = 'translate(-50%,-50%) scale(1)';
      trailEl.style.transform  = 'translate(-50%,-50%) scale(1)';
    });

    // Show drag hint
    setTimeout(() => {
      dragHint.classList.add('visible');
      setTimeout(() => dragHint.classList.remove('visible'), 4000);
    }, 1400);

    loading.classList.add('hidden');

  } catch (err) {
    console.error('Load error:', err);
    loading.classList.add('hidden');
  }

  // ===== RAF Loop =====
  const t0 = performance.now();

  function animate() {
    requestAnimationFrame(animate);
    const elapsed = (performance.now() - t0) / 1000;

    // Lerp face X / scale toward panel target
    if (faceGroupRef) {
      faceGroupRef.position.x += (facePosXTarget - faceGroupRef.position.x) * 0.04;
    }
    animState.scrollScale += (faceScaleTarget - animState.scrollScale) * 0.05;

    if (faceTick)      faceTick(elapsed);
    if (particlesTick) particlesTick(elapsed);

    composer.render();
  }

  animate();
}

init();
