/**
 * Scroll-driven animations — IntersectionObserver + positional lerp.
 * Scale is intentionally NOT managed here; face.js owns zoom/scale.
 */

export function initAnimations(faceGroup, setModelIndex) {
  // ===== Work cards ====
  const cards = document.querySelectorAll('.work-card');
  const cardObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const card  = entry.target;
        const delay = parseInt(card.dataset.index || 0) * 120;
        setTimeout(() => {
          card.classList.add('visible');
          card.style.transition = 'opacity 0.7s ease, transform 0.7s ease';
        }, delay);
        cardObserver.unobserve(card);
      }
    });
  }, { threshold: 0.15 });
  cards.forEach((c) => cardObserver.observe(c));

  // ===== Section text fade-in =====
  const fadeEls = document.querySelectorAll(
    '.about-text, .contact-inner, .works-inner h2, .works-inner .section-label'
  );
  const fadeObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.style.opacity   = '1';
        entry.target.style.transform = 'translateY(0)';
        fadeObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.2 });

  fadeEls.forEach((el) => {
    el.style.opacity    = '0';
    el.style.transform  = 'translateY(40px)';
    el.style.transition = 'opacity 0.9s ease, transform 0.9s ease';
    fadeObserver.observe(el);
  });

  // ===== Scroll state for face POSITION only =====
  const sections = {
    about:   document.getElementById('about'),
    works:   document.getElementById('works'),
    contact: document.getElementById('contact'),
  };

  // Export scrollScale so face.js can multiply with zoomCurrent
  const state = { scrollScale: 1 };

  const posTarget = { x: 0, z: 0 };

  function updateTargets() {
    const scrollY    = window.scrollY;
    const wh         = window.innerHeight;
    const aboutTop   = sections.about.offsetTop;
    const worksTop   = sections.works.offsetTop;
    const contactTop = sections.contact.offsetTop;

    if (scrollY < aboutTop - wh * 0.5) {
      // Hero — Standard Walk
      setModelIndex?.(0);
      posTarget.x      = 0;
      posTarget.z      = 0;
      state.scrollScale = 1.0;
    } else if (scrollY < worksTop - wh * 0.5) {
      // About — House Dancing
      setModelIndex?.(1);
      const t = Math.min((scrollY - (aboutTop - wh * 0.5)) / wh, 1);
      const isMobile = window.innerWidth <= 768;
      posTarget.x      = isMobile ? 0.5 : -1.5 * t;
      posTarget.z      = 0;
      state.scrollScale = 1.0 - 0.1 * t;
    } else if (scrollY < contactTop - wh * 0.5) {
      // Works — Typing
      setModelIndex?.(2);
      const t = Math.min((scrollY - (worksTop - wh * 0.5)) / wh, 1);
      posTarget.x      = 0;
      posTarget.z      = 0;
      state.scrollScale = 0.9 - 0.3 * t;
    } else {
      // Contact — Running Jump
      setModelIndex?.(3);
      posTarget.x      = 0;
      posTarget.z      = 0;
      state.scrollScale = 0.6;
    }
  }

  window.addEventListener('scroll', updateTargets, { passive: true });
  updateTargets();

  function tick() {
    const L = 0.05;
    faceGroup.position.x += (posTarget.x - faceGroup.position.x) * L;
    faceGroup.position.z += (posTarget.z - faceGroup.position.z) * L;
  }

  return { tick, state };
}
