
/* NorthWeb.co Demo — main.js */
'use strict';

// ── COOKIE CONSENT (DPDPA 2023) ──────────────────────────────
const CKEY = 'nx_cookie_consent_v1';
function initCookies() {
  const banner = document.getElementById('cookie-banner');
  if (!banner) return;
  try {
    if (!localStorage.getItem(CKEY)) banner.hidden = false;
  } catch(e) { banner.hidden = false; }
  document.getElementById('cookie-accept')?.addEventListener('click', () => {
    try { localStorage.setItem(CKEY, JSON.stringify({status:'accepted',ts:Date.now()})); } catch(e){}
    banner.hidden = true;
  });
  document.getElementById('cookie-decline')?.addEventListener('click', () => {
    try { localStorage.setItem(CKEY, JSON.stringify({status:'declined',ts:Date.now()})); } catch(e){}
    banner.hidden = true;
  });
}

// ── MOBILE NAV ───────────────────────────────────────────────
function initNav() {
  const toggle = document.querySelector('.nav-toggle');
  const menu   = document.querySelector('.nav-menu');
  if (!toggle || !menu) return;
  const open = () => {
    toggle.setAttribute('aria-expanded','true');
    menu.classList.add('open');
    document.body.style.overflow = 'hidden';
  };
  const close = () => {
    toggle.setAttribute('aria-expanded','false');
    menu.classList.remove('open');
    document.body.style.overflow = '';
  };
  toggle.addEventListener('click', () =>
    toggle.getAttribute('aria-expanded') === 'true' ? close() : open()
  );
  document.addEventListener('keydown', e => { if(e.key==='Escape') { close(); toggle.focus(); }});
  document.addEventListener('click', e => {
    if (menu.classList.contains('open') && !toggle.contains(e.target) && !menu.contains(e.target)) close();
  });
}

// ── SCROLL ANIMATIONS ────────────────────────────────────────
function initAnims() {
  if (!('IntersectionObserver' in window)) {
    document.querySelectorAll('.anim').forEach(el => el.classList.add('show'));
    return;
  }
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => { if(e.isIntersecting){ e.target.classList.add('show'); obs.unobserve(e.target); }});
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
  document.querySelectorAll('.anim').forEach(el => obs.observe(el));
}

// ── CONTACT FORM ─────────────────────────────────────────────
let lastSubmit = 0;
const RATE = 30000; // 30 seconds

function initForm() {
  const form = document.getElementById('contact-form');
  if (!form) return;

  // Clear invalid state on input
  form.addEventListener('input', e => {
    if (e.target.hasAttribute('aria-invalid')) e.target.removeAttribute('aria-invalid');
  });

  form.addEventListener('submit', async e => {
    e.preventDefault();

    // Honeypot
    const hp = form.querySelector('.hp input');
    if (hp?.value) return; // bot, silent drop

    // Rate limit
    if (Date.now() - lastSubmit < RATE) {
      showStatus(form, 'err', '⏳ Please wait 30 seconds before submitting again.');
      return;
    }

    // Validate required fields
    let ok = true;
    form.querySelectorAll('[required]').forEach(f => {
      if (!f.value.trim()) { f.setAttribute('aria-invalid','true'); ok = false; }
    });

    // Email format
    const em = form.querySelector('[type=email]');
    if (em?.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em.value)) {
      em.setAttribute('aria-invalid','true'); ok = false;
    }

    if (!ok) { showStatus(form, 'err', '⚠️ Please fill in all required fields correctly.'); return; }

    const btn = form.querySelector('[type=submit]');
    if (btn) { btn.disabled = true; btn.textContent = 'Sending…'; }

    try {
      const action = form.action;
      if (!action || action === window.location.href) {
        // Demo mode — no real endpoint
        await new Promise(r => setTimeout(r, 800));
        showStatus(form, 'ok', '✅ Demo mode: Message received! In production, connect your Formspree ID in the form action.');
        form.reset();
        lastSubmit = Date.now();
      } else {
        const res = await fetch(action, {
          method: 'POST', body: new FormData(form),
          headers: { Accept: 'application/json' }
        });
        if (res.ok) {
          showStatus(form, 'ok', "✅ Message sent! We'll get back to you within 24 hours.");
          form.reset(); lastSubmit = Date.now();
        } else {
          throw new Error('Server error');
        }
      }
    } catch {
      showStatus(form, 'err', '❌ Something went wrong. Please try calling or WhatsApp instead.');
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = btn.getAttribute('data-label') || 'Send Message'; }
    }
  });
}

function showStatus(form, type, msg) {
  let el = form.querySelector('.form-status');
  if (!el) { el = document.createElement('div'); el.className = 'form-status'; form.appendChild(el); }
  el.className = `form-status ${type}`;
  el.textContent = msg;
  el.scrollIntoView({ behavior:'smooth', block:'nearest' });
  el.setAttribute('role','alert');
}

// ── INIT ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initCookies();
  initNav();
  initAnims();
  initForm();
});
