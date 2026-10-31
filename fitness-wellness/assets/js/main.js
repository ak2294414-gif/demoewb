'use strict';
// ── Navigation toggle ──────────────────────────────────────────
const toggle = document.querySelector('.nav-toggle');
const nav    = document.getElementById('primary-nav');
if (toggle && nav) {
  toggle.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    toggle.setAttribute('aria-expanded', open);
  });
  document.addEventListener('click', e => {
    if (!nav.contains(e.target) && !toggle.contains(e.target)) {
      nav.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    }
  });
}

// ── Cookie consent ─────────────────────────────────────────────
const banner = document.getElementById('cookie-banner');
if (banner && !localStorage.getItem('cookie_consent')) {
  banner.classList.add('show');
}
document.getElementById('btn-accept')?.addEventListener('click', () => {
  localStorage.setItem('cookie_consent', 'accepted');
  banner.classList.remove('show');
});
document.getElementById('btn-decline')?.addEventListener('click', () => {
  localStorage.setItem('cookie_consent', 'declined');
  banner.classList.remove('show');
});

// ── Contact form ───────────────────────────────────────────────
const form = document.getElementById('contact-form');
if (form) {
  form.addEventListener('submit', async e => {
    e.preventDefault();
    if (form.querySelector('.honey')?.value) return; // honeypot

    const required = form.querySelectorAll('[required]');
    let valid = true;
    required.forEach(el => {
      if (!el.value.trim()) { el.classList.add('input-err'); valid = false; }
      else el.classList.remove('input-err');
    });
    const consent = form.querySelector('#consent');
    if (consent && !consent.checked) {
      consent.parentElement.classList.add('consent-err');
      valid = false;
    }
    if (!valid) return;

    const btn = form.querySelector('[type=submit]');
    const status = document.getElementById('form-status');
    const orig = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Sending…';

    // Replace action with your Formspree endpoint
    try {
      const res = await fetch(form.action || '#', {
        method: 'POST',
        body: new FormData(form),
        headers: { 'Accept': 'application/json' }
      });
      if (res.ok) {
        status.textContent = '✅ Message sent! We will get back to you within 24 hours.';
        status.className = 'form-status success';
        status.style.display = 'block';
        form.reset();
      } else {
        throw new Error('Server error');
      }
    } catch {
      status.textContent = '❌ Something went wrong. Please email us directly.';
      status.className = 'form-status error';
      status.style.display = 'block';
    }
    btn.disabled = false;
    btn.textContent = orig;
    status.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });
}
