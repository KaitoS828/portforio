// ===== Custom Cursor =====
const cursorEl = document.querySelector('.cursor');
const trailEl  = document.querySelector('.cursor-trail');

let mx = 0, my = 0, tx = 0, ty = 0;

document.addEventListener('mousemove', (e) => {
  mx = e.clientX; my = e.clientY;
  cursorEl.style.left = mx + 'px';
  cursorEl.style.top  = my + 'px';
});

(function loop() {
  tx += (mx - tx) * 0.12;
  ty += (my - ty) * 0.12;
  trailEl.style.left = tx + 'px';
  trailEl.style.top  = ty + 'px';
  requestAnimationFrame(loop);
})();

document.querySelectorAll('a, button, .tech-tag').forEach((el) => {
  el.addEventListener('mouseenter', () => {
    cursorEl.style.transform = 'translate(-50%,-50%) scale(1.8)';
  });
  el.addEventListener('mouseleave', () => {
    cursorEl.style.transform = 'translate(-50%,-50%) scale(1)';
  });
});

// ===== Scroll fade-in =====
const fadeObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      fadeObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll('.fade-in').forEach((el) => fadeObserver.observe(el));

// ===== Load & inject data from data.json =====
const workId = document.body.dataset.workId;
if (workId) {
  fetch('/works/data.json')
    .then(r => r.json())
    .then(data => {
      const w = data[workId];
      if (!w) return;
      injectWork(w);
    })
    .catch(() => { /* サーバーなし: 静的HTMLをそのまま表示 */ });
}

function injectWork(w) {
  // Title
  document.title = `${w.title} — Kanbe Kaito`;

  // Hero
  set('.js-tag',   w.tag);
  setHtml('.js-title', w.title.replace(/\n/g, '<br>'));
  set('.js-role',  w.role);
  set('.js-year',  w.year);
  set('.js-type',  w.type);

  // Mock
  set('.js-mock-url', w.mockUrl);
  const mockContent = document.querySelector('.js-mock-label');
  if (mockContent) {
    if (w.mockImage) {
      mockContent.innerHTML = `<img src="${w.mockImage}" alt="${w.title} screenshot">`;
    } else {
      mockContent.textContent = w.mockLabel;
    }
  }

  // Overview
  setHtml('.js-overview-heading', w.overviewHeading.replace(/\n/g, '<br>'));
  set('.js-overview-body', w.overviewBody);

  // Feature columns
  set('.js-left-label',  w.leftLabel);
  set('.js-right-label', w.rightLabel);
  setList('.js-left-items',  w.leftItems);
  setList('.js-right-items', w.rightItems);

  // Tech stack
  const techEl = document.querySelector('.js-tech-list');
  if (techEl) {
    techEl.innerHTML = w.techStack
      .map(t => `<span class="tech-tag">${t}</span>`)
      .join('');
  }

  // CTA
  setHtml('.js-cta-heading', w.ctaHeading.replace(/\n/g, '<br>'));
  setAttr('.js-cta-live',   'href', w.liveUrl);
  setAttr('.js-cta-github', 'href', w.githubUrl);

  // Nav footer
  const prevEl = document.querySelector('.js-nav-prev');
  const nextEl = document.querySelector('.js-nav-next');
  if (prevEl) {
    if (w.prev) {
      prevEl.href = `${w.prev}.html`;
      prevEl.querySelector('.js-prev-label').textContent = `Prev: ${w.prevLabel}`;
      prevEl.style.visibility = 'visible';
    } else {
      prevEl.style.visibility = 'hidden';
    }
  }
  if (nextEl) {
    if (w.next) {
      nextEl.href = `${w.next}.html`;
      nextEl.querySelector('.js-next-label').textContent = `Next: ${w.nextLabel}`;
      nextEl.style.visibility = 'visible';
    } else {
      nextEl.style.visibility = 'hidden';
    }
  }
}

function set(selector, text) {
  const el = document.querySelector(selector);
  if (el) el.textContent = text;
}
function setHtml(selector, html) {
  const el = document.querySelector(selector);
  if (el) el.innerHTML = html;
}
function setAttr(selector, attr, val) {
  const el = document.querySelector(selector);
  if (el) el.setAttribute(attr, val);
}
function setList(selector, items) {
  const el = document.querySelector(selector);
  if (!el) return;
  el.innerHTML = (items || []).map(item => `
    <li><span class="feat-dash">—</span>${item}</li>
  `).join('');
}
