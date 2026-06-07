const state = {
  reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
};

function selectAll(selector, scope = document) {
  return Array.from(scope.querySelectorAll(selector));
}

function select(selector, scope = document) {
  return scope.querySelector(selector);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function initTheme() {
  const themeButton = select('[data-theme-toggle]');
  const storedTheme = window.localStorage.getItem('portfolio-theme');
  const activeTheme = storedTheme || 'dark';
  document.documentElement.dataset.theme = activeTheme;

  themeButton?.addEventListener('click', () => {
    const nextTheme = document.documentElement.dataset.theme === 'dark' ? 'aurora' : 'dark';
    document.documentElement.dataset.theme = nextTheme;
    window.localStorage.setItem('portfolio-theme', nextTheme);
  });
}

function initMobileNav() {
  const toggle = select('[data-nav-toggle]');
  const nav = select('[data-nav-menu]');
  if (!toggle || !nav) return;

  toggle.addEventListener('click', () => {
    const expanded = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!expanded));
    nav.classList.toggle('is-open');
  });

  selectAll('[data-transition]').forEach((link) => {
    link.addEventListener('click', (event) => {
      const href = link.getAttribute('href');
      if (!href || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('http')) return;
      const samePageAnchor = href.startsWith('#') || href.includes('#');
      if (samePageAnchor) return;

      event.preventDefault();
      document.body.classList.add('is-navigating');
      window.setTimeout(() => {
        window.location.href = href;
      }, 360);
    });
  });

  selectAll('[data-page-link]').forEach((link) => {
    link.addEventListener('click', () => {
      nav.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
    });
  });
}

function initPreloader() {
  const preloader = select('.preloader');
  if (!preloader) return;

  const hide = () => {
    preloader.classList.add('is-hidden');
    window.setTimeout(() => preloader.remove(), 700);
  };

  if (document.readyState === 'complete') {
    window.setTimeout(hide, 220);
  } else {
    window.addEventListener('load', hide, { once: true });
  }
}

function initScrollProgress() {
  const progress = select('.scroll-progress__bar');
  if (!progress) return;

  const update = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const ratio = max > 0 ? window.scrollY / max : 0;
    progress.style.transform = `scaleX(${clamp(ratio, 0, 1)})`;
  };

  update();
  window.addEventListener('scroll', update, { passive: true });
}

function initHeroScrollFx() {
  const hero = select('.hero');
  if (!hero || state.reducedMotion) return;

  const onMove = (event) => {
    const rect = hero.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    const y = ((event.clientY - rect.top) / rect.height) * 2 - 1;
    document.documentElement.style.setProperty('--pointer-x', x.toFixed(3));
    document.documentElement.style.setProperty('--pointer-y', y.toFixed(3));
  };

  hero.addEventListener('pointermove', onMove);
}

function initCursor() {
  if (state.reducedMotion || !window.matchMedia('(pointer:fine)').matches) return;

  const cursor = select('.cursor');
  const follower = select('.cursor-follower');
  if (!cursor || !follower) return;

  window.addEventListener('pointermove', (event) => {
    const x = event.clientX;
    const y = event.clientY;
    cursor.style.transform = `translate3d(${x - 8}px, ${y - 8}px, 0)`;
    follower.style.transform = `translate3d(${x - 20}px, ${y - 20}px, 0)`;
  });

  selectAll('a, button, input, textarea, [role="button"]').forEach((element) => {
    element.addEventListener('pointerenter', () => document.body.classList.add('cursor-active'));
    element.addEventListener('pointerleave', () => document.body.classList.remove('cursor-active'));
  });
}

function initTyping() {
  const target = select('[data-typing]');
  if (!target) return;

  const words = JSON.parse(target.getAttribute('data-typing'));
  let wordIndex = 0;
  let charIndex = 0;
  let deleting = false;

  const tick = () => {
    const word = words[wordIndex % words.length];
    const duration = deleting ? 34 : 58;
    target.textContent = word.slice(0, charIndex);

    if (!deleting && charIndex === word.length) {
      deleting = true;
      return window.setTimeout(tick, 950);
    }

    if (deleting && charIndex === 0) {
      deleting = false;
      wordIndex += 1;
      return window.setTimeout(tick, 240);
    }

    charIndex += deleting ? -1 : 1;
    window.setTimeout(tick, duration);
  };

  tick();
}

function initCounters() {
  const counters = selectAll('[data-counter]');
  if (!counters.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const element = entry.target;
      const endValue = Number(element.getAttribute('data-counter'));
      const suffix = element.getAttribute('data-suffix') || '';
      const start = performance.now();
      const duration = 1400;

      const animate = (now) => {
        const progress = clamp((now - start) / duration, 0, 1);
        const value = Math.round(endValue * (0.25 + progress * 0.75));
        element.textContent = `${value}${suffix}`;
        if (progress < 1) {
          window.requestAnimationFrame(animate);
        }
      };

      window.requestAnimationFrame(animate);
      observer.unobserve(element);
    });
  }, { threshold: 0.35 });

  counters.forEach((counter) => observer.observe(counter));
}

function initReveal() {
  const elements = selectAll('.reveal');
  if (!elements.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
      }
    });
  }, { threshold: 0.18 });

  elements.forEach((element) => observer.observe(element));
}

function initTiltCards() {
  if (state.reducedMotion) return;

  selectAll('[data-tilt]').forEach((card) => {
    let frame = 0;
    card.addEventListener('pointermove', (event) => {
      const rect = card.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const y = ((event.clientY - rect.top) / rect.height) * 2 - 1;
      const rotateX = clamp(y * -10, -12, 12);
      const rotateY = clamp(x * 12, -12, 12);
      const shadowX = clamp(x * 18, -18, 18);
      const shadowY = clamp(y * 18, -18, 18);
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        card.style.transform = `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-6px)`;
        card.style.boxShadow = `${-shadowX}px ${shadowY}px 30px rgba(0, 0, 0, 0.3)`;
      });
    });
    card.addEventListener('pointerleave', () => {
      card.style.transform = '';
      card.style.boxShadow = '';
    });
  });
}

function openModal(modal, title, body, meta = '') {
  if (!modal) return;
  select('[data-modal-title]', modal).textContent = title;
  select('[data-modal-body]', modal).innerHTML = body;
  const metaNode = select('[data-modal-meta]', modal);
  if (metaNode) metaNode.textContent = meta;
  modal.classList.add('is-open');
  modal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('modal-open');
}

function closeModal(modal) {
  if (!modal) return;
  modal.classList.remove('is-open');
  modal.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('modal-open');
}

function initProjectFiltering() {
  const filterButtons = selectAll('[data-filter]');
  const projectCards = selectAll('[data-project-card]');
  if (!filterButtons.length || !projectCards.length) return;

  filterButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const filter = button.getAttribute('data-filter');
      filterButtons.forEach((item) => item.classList.toggle('is-active', item === button));
      projectCards.forEach((card) => {
        const isVisible = filter === 'all' || card.getAttribute('data-category') === filter;
        card.classList.toggle('is-hidden', !isVisible);
      });
    });
  });

  const modal = select('[data-project-modal]');
  selectAll('[data-open-project]').forEach((button) => {
    button.addEventListener('click', () => {
      openModal(
        modal,
        button.getAttribute('data-title') || 'Project',
        button.getAttribute('data-description') || '',
        button.getAttribute('data-tech') || ''
      );
    });
  });

  modal?.addEventListener('click', (event) => {
    if (event.target.matches('[data-close-modal], .modal__backdrop')) {
      closeModal(modal);
    }
  });
}

function initCertificatePreview() {
  const modal = select('[data-certificate-modal]');
  if (!modal) return;

  selectAll('[data-open-certificate]').forEach((button) => {
    button.addEventListener('click', async () => {
      const title = button.getAttribute('data-title') || 'Certificate';
      const file = button.getAttribute('data-file') || 'assets/frontend-certificate-infosys.pdf';
      const meta = button.getAttribute('data-meta') || '';

      const response = await fetch(file, { method: 'HEAD' });
      const contentLength = Number(response.headers.get('content-length') || 0);
      const contentType = (response.headers.get('content-type') || '').toLowerCase();
      const body = buildCertificateBody(file, response.ok, contentLength, contentType);
      const statusMeta = response.ok && contentLength > 0 ? meta : '';
      openModal(modal, title, body, statusMeta);
    });
  });

  modal.addEventListener('click', (event) => {
    if (event.target.matches('[data-close-modal], .modal__backdrop')) {
      closeModal(modal);
    }
  });
}

function buildCertificateBody(file, exists, contentLength = 0, contentType = '') {
  if (!exists) {
    return `
      <div class="certificate-preview">
        <p class="certificate-preview__label">Certificate Preview</p>
        <p class="certificate-preview__title">File not found</p>
        <p class="certificate-preview__text">Certificate file not found at <strong>${file}</strong>. Please upload the certificate to the assets folder.</p>
      </div>
    `;
  }

  if (contentLength === 0) {
    return `
      <div class="certificate-preview">
        <p class="certificate-preview__label">Certificate Preview</p>
        <p class="certificate-preview__title">Certificate not ready yet</p>
        <p class="certificate-preview__text">The file <strong>${file}</strong> exists, but it has no saved content yet. Re-save or export the certificate, then click View Certificate again.</p>
      </div>
    `;
  }

  // Show certificate info with download button
  const fileName = file.split('/').pop();
  const fileSizeKB = Math.round(contentLength / 1024);
  return `
    <div class="certificate-preview certificate-preview--file">
      <div class="certificate-preview__info">
        <p class="certificate-preview__label">Certificate Ready</p>
        <p class="certificate-preview__title">${fileName}</p>
        <p class="certificate-preview__text">File size: <strong>${fileSizeKB} KB</strong></p>
        <a href="${file}" download="${fileName}" class="text-link" style="display: inline-block; margin-top: 1rem;">
          📥 Download Certificate
        </a>
      </div>
    </div>
  `;
}

function initArticles() {
  const modal = select('[data-article-modal]');
  if (!modal) return;

  selectAll('[data-open-article]').forEach((button) => {
    button.addEventListener('click', () => {
      openModal(
        modal,
        button.getAttribute('data-title') || 'Article',
        button.getAttribute('data-preview') || '',
        button.getAttribute('data-meta') || ''
      );
    });
  });

  modal.addEventListener('click', (event) => {
    if (event.target.matches('[data-close-modal], .modal__backdrop')) {
      closeModal(modal);
    }
  });
}

function initResumePreview() {
  const modal = select('[data-resume-modal]');
  if (!modal) return;

  selectAll('[data-open-resume]').forEach((button) => {
    button.addEventListener('click', () => {
      openModal(modal, 'Resume Preview', select('[data-resume-preview]')?.innerHTML || '', 'ATS-friendly one-page version');
    });
  });

  modal.addEventListener('click', (event) => {
    if (event.target.matches('[data-close-modal], .modal__backdrop')) {
      closeModal(modal);
    }
  });
}

function initContactForm() {
  const form = select('[data-contact-form]');
  if (!form) return;
  const status = select('[data-form-status]', form);
  const submitButton = select('button[type="submit"]', form);

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());
    const errors = [];

    if (!payload.name?.trim()) errors.push('Please enter your name.');
    if (!payload.email?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) errors.push('Enter a valid email address.');
    if (!payload.message?.trim() || String(payload.message).trim().length < 20) errors.push('Your message should be at least 20 characters.');

    if (errors.length) {
      status.textContent = errors[0];
      status.className = 'form-status form-status--error';
      return;
    }

    submitButton.disabled = true;
    status.textContent = 'Sending your message...';
    status.className = 'form-status form-status--pending';

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (!response.ok || !result.ok) {
        throw new Error(result.message || 'Unable to send message.');
      }

      form.reset();
      status.textContent = 'Message sent. I will get back to you soon.';
      status.className = 'form-status form-status--success';
    } catch (error) {
      status.textContent = error.message || 'Unable to send message.';
      status.className = 'form-status form-status--error';
    } finally {
      submitButton.disabled = false;
    }
  });
}

function initScrollSpy() {
  const links = selectAll('[data-spy-link]');
  const sections = selectAll('[data-spy-section]');
  if (!links.length || !sections.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const id = entry.target.getAttribute('id');
      links.forEach((link) => link.classList.toggle('is-active', link.getAttribute('href') === `#${id}`));
    });
  }, { threshold: 0.45 });

  sections.forEach((section) => observer.observe(section));
}

function initEasterEgg() {
  let taps = 0;
  const target = select('[data-logo-mark]');
  if (!target) return;

  target.addEventListener('click', () => {
    taps += 1;
    document.body.classList.toggle('show-grid', taps % 2 === 1);
  });
}

function initActiveNav() {
  const current = window.location.pathname.split('/').pop() || 'index.html';
  selectAll('[data-page-link]').forEach((link) => {
    const href = link.getAttribute('href') || '';
    link.classList.toggle('is-current', href === current || (current === '' && href === 'index.html'));
  });
}

initTheme();
initMobileNav();
initPreloader();
initScrollProgress();
initHeroScrollFx();
initCursor();
initTyping();
initCounters();
initReveal();
initTiltCards();
initProjectFiltering();
initCertificatePreview();
initArticles();
initResumePreview();
initContactForm();
initScrollSpy();
initEasterEgg();
initActiveNav();

window.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    selectAll('[data-modal].is-open').forEach((modal) => closeModal(modal));
  }
});

