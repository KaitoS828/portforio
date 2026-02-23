import { initScene } from './scene.js';
import { loadFace, animState } from './face.js';
import { createParticles } from './particles.js';
import { initAnimations } from './animations.js';

const canvas  = document.getElementById('canvas');
const loading = document.getElementById('loading');

// ===== Custom Cursor =====
const cursorEl    = document.createElement('div');
cursorEl.className = 'cursor';
document.body.appendChild(cursorEl);

const cursorTrail    = document.createElement('div');
cursorTrail.className = 'cursor-trail';
document.body.appendChild(cursorTrail);

let mouseX = 0, mouseY = 0;
let trailX = 0, trailY = 0;

document.addEventListener('mousemove', (e) => {
  mouseX = e.clientX;
  mouseY = e.clientY;
  cursorEl.style.left = mouseX + 'px';
  cursorEl.style.top  = mouseY + 'px';
});

function animateCursor() {
  trailX += (mouseX - trailX) * 0.12;
  trailY += (mouseY - trailY) * 0.12;
  cursorTrail.style.left = trailX + 'px';
  cursorTrail.style.top  = trailY + 'px';
  requestAnimationFrame(animateCursor);
}
animateCursor();

// Cursor scale on interactive elements
function bindCursorHover(selector) {
  document.querySelectorAll(selector).forEach((el) => {
    el.addEventListener('mouseenter', () => {
      cursorEl.style.transform  = 'translate(-50%, -50%) scale(1.8)';
      cursorEl.style.background = 'var(--magenta)';
      cursorTrail.style.transform = 'translate(-50%, -50%) scale(1.5)';
    });
    el.addEventListener('mouseleave', () => {
      cursorEl.style.transform  = 'translate(-50%, -50%) scale(1)';
      cursorEl.style.background = 'var(--cyan)';
      cursorTrail.style.transform = 'translate(-50%, -50%) scale(1)';
    });
  });
}
bindCursorHover('a, button, .work-card');

// ===== Main init =====
async function init() {
  const { scene, camera, renderer, composer } = initScene(canvas);

  let faceTick, animTick, particlesTick;

  try {
    const { faceGroup, tick, setModelIndex } = await loadFace(scene, camera);
    faceTick = tick;

    // Particles
    const { tick: pTick } = createParticles(scene);
    particlesTick = pTick;

    // Scroll animations — share scrollScale back to face.js via animState
    const { tick: aTick, state } = initAnimations(faceGroup, setModelIndex);
    animTick = aTick;

    // Keep animState in face.js in sync with scroll state
    Object.defineProperty(animState, 'scrollScale', {
      get: () => state.scrollScale,
      configurable: true,
    });

    // 3Dモデルホバー時にカスタムカーソルをシアンに拡大
    canvas.addEventListener('modelenter', () => {
      cursorEl.style.transform  = 'translate(-50%, -50%) scale(2)';
      cursorEl.style.background = 'var(--cyan)';
      cursorTrail.style.transform = 'translate(-50%, -50%) scale(1.6)';
    });
    canvas.addEventListener('modelleave', () => {
      cursorEl.style.transform  = 'translate(-50%, -50%) scale(1)';
      cursorEl.style.background = 'var(--cyan)';
      cursorTrail.style.transform = 'translate(-50%, -50%) scale(1)';
    });

    loading.classList.add('hidden');

  } catch (err) {
    console.error('Model load error:', err);
    loading.classList.add('hidden');
  }

  // ===== RAF Loop =====
  const startTime = performance.now();

  function animate() {
    requestAnimationFrame(animate);
    const elapsed = (performance.now() - startTime) / 1000;

    if (faceTick)      faceTick(elapsed);
    if (particlesTick) particlesTick(elapsed);
    if (animTick)      animTick();

    composer.render();
  }

  animate();
}

init();

// ===== Smooth nav scroll =====
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener('click', (e) => {
    const target = document.querySelector(anchor.getAttribute('href'));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth' });
    }
  });
});
