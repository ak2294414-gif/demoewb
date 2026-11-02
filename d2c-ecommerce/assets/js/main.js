/* NorthWeb.co — D2C Demo Store main.js
   DEMO ONLY — no real payments, no real data collected
   Security: CSP headers in _headers, rate limiting, honeypot, sanitization */
'use strict';

// ── COOKIE CONSENT (DPDPA 2023) ──────────────────────────────
const CKEY = 'nx_cookie_v2';
function initCookies() {
  const banner = document.getElementById('cookie-banner');
  if (!banner) return;
  try { if (!localStorage.getItem(CKEY)) banner.hidden = false; }
  catch(e) { banner.hidden = false; }
  document.getElementById('cookie-accept')?.addEventListener('click', () => {
    try { localStorage.setItem(CKEY, JSON.stringify({s:'accepted',t:Date.now()})); } catch(e){}
    banner.hidden = true;
  });
  document.getElementById('cookie-decline')?.addEventListener('click', () => {
    try { localStorage.setItem(CKEY, JSON.stringify({s:'declined',t:Date.now()})); } catch(e){}
    banner.hidden = true;
  });
}

// ── MOBILE NAV ───────────────────────────────────────────────
function initNav() {
  const toggle = document.querySelector('.nav-toggle');
  const menu   = document.querySelector('.nav-menu');
  if (!toggle || !menu) return;
  const open = () => { toggle.setAttribute('aria-expanded','true'); menu.classList.add('open'); document.body.style.overflow='hidden'; };
  const close = () => { toggle.setAttribute('aria-expanded','false'); menu.classList.remove('open'); document.body.style.overflow=''; };
  toggle.addEventListener('click', () => toggle.getAttribute('aria-expanded')==='true' ? close() : open());
  document.addEventListener('keydown', e => { if(e.key==='Escape') { close(); toggle.focus(); }});
  document.addEventListener('click', e => { if(menu.classList.contains('open') && !toggle.contains(e.target) && !menu.contains(e.target)) close(); });
}

// ── CART STATE ───────────────────────────────────────────────
let cart = [];
const CART_KEY = 'nx_cart_v1';
function loadCart() {
  try { cart = JSON.parse(localStorage.getItem(CART_KEY)) || []; } catch(e) { cart = []; }
}
function saveCart() {
  try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch(e) {}
}
function cartTotal() {
  return cart.reduce((s,i) => s + i.qty * i.price, 0);
}
function cartCount() {
  return cart.reduce((s,i) => s + i.qty, 0);
}
function updateCartBadge() {
  document.querySelectorAll('.cart-count').forEach(el => {
    const c = cartCount();
    el.textContent = c;
    el.hidden = c === 0;
  });
}

function addToCart(product) {
  const existing = cart.find(i => i.id === product.id && i.size === product.size);
  if (existing) { existing.qty++; }
  else { cart.push({...product, qty: 1}); }
  saveCart();
  updateCartBadge();
  renderCartDrawer();
  showToast(`${product.name} added to cart`, 'gold');
}

function removeFromCart(id, size) {
  cart = cart.filter(i => !(i.id === id && i.size === size));
  saveCart();
  updateCartBadge();
  renderCartDrawer();
}

function changeQty(id, size, delta) {
  const item = cart.find(i => i.id === id && i.size === size);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) removeFromCart(id, size);
  else { saveCart(); updateCartBadge(); renderCartDrawer(); }
}

function renderCartDrawer() {
  const body = document.getElementById('cart-body');
  const footer = document.getElementById('cart-footer');
  if (!body) return;
  if (cart.length === 0) {
    body.innerHTML = `<div class="cart-empty"><span class="cart-empty-icon">🛍️</span><p style="font-size:.9375rem;font-weight:600;margin-bottom:.5rem">Your bag is empty</p><p style="font-size:.875rem;color:var(--muted)">Add something beautiful to get started.</p><a href="tshirts.html" class="btn btn-outline btn-sm" style="margin-top:1.25rem">Browse Collections</a></div>`;
    if (footer) footer.hidden = true;
    return;
  }
  if (footer) footer.hidden = false;
  body.innerHTML = cart.map(item => `
    <div class="cart-item">
      <img src="${sanitizeStr(item.img)}" alt="${sanitizeStr(item.name)}" class="cart-item-img" loading="lazy">
      <div class="cart-item-info">
        <div class="cart-item-name">${sanitizeStr(item.name)}</div>
        <div class="cart-item-meta">${sanitizeStr(item.size)} · ${sanitizeStr(item.color)}</div>
        <div class="cart-item-price">${sanitizeStr(item.priceStr)}</div>
        <div class="cart-item-qty">
          <button class="qty-btn" aria-label="Decrease" onclick="changeQty('${sanitizeStr(item.id)}','${sanitizeStr(item.size)}',-1)">−</button>
          <span class="qty-val">${item.qty}</span>
          <button class="qty-btn" aria-label="Increase" onclick="changeQty('${sanitizeStr(item.id)}','${sanitizeStr(item.size)}',1)">+</button>
        </div>
        <button class="cart-remove" onclick="removeFromCart('${sanitizeStr(item.id)}','${sanitizeStr(item.size)}')">Remove</button>
      </div>
    </div>`).join('');
  const subtotalEl = document.getElementById('cart-subtotal');
  if (subtotalEl) subtotalEl.textContent = '₹' + cartTotal().toLocaleString('en-IN');
}

function sanitizeStr(s) {
  return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

// ── CART DRAWER ───────────────────────────────────────────────
function initCartDrawer() {
  const drawer  = document.getElementById('cart-drawer');
  const overlay = document.getElementById('cart-overlay');
  const openBtns = document.querySelectorAll('.open-cart');
  const closeBtn = document.getElementById('cart-close');
  if (!drawer) return;

  const open  = () => { drawer.classList.add('open'); overlay?.classList.add('open'); document.body.style.overflow='hidden'; drawer.querySelector('.cart-close')?.focus(); };
  const close = () => { drawer.classList.remove('open'); overlay?.classList.remove('open'); document.body.style.overflow=''; };

  openBtns.forEach(b => b.addEventListener('click', () => { renderCartDrawer(); open(); }));
  closeBtn?.addEventListener('click', close);
  overlay?.addEventListener('click', close);
  document.addEventListener('keydown', e => { if(e.key==='Escape' && drawer.classList.contains('open')) { close(); }});
}

// ── DEMO MODAL ───────────────────────────────────────────────
function initDemoModal() {
  const overlay = document.getElementById('demo-overlay');
  if (!overlay) return;
  document.querySelectorAll('.trigger-demo').forEach(btn => {
    btn.addEventListener('click', e => { e.preventDefault(); overlay.classList.add('show'); });
  });
  document.getElementById('close-demo')?.addEventListener('click', () => overlay.classList.remove('show'));
  overlay.addEventListener('click', e => { if(e.target===overlay) overlay.classList.remove('show'); });
}

// ── SIZE SELECTOR ─────────────────────────────────────────────
function initSizeSelector() {
  document.querySelectorAll('.size-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      btn.closest('.size-options')?.querySelectorAll('.size-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });
}

// ── ADD TO CART BTN ───────────────────────────────────────────
function initAddToCart() {
  document.querySelectorAll('.btn-cart').forEach(btn => {
    btn.addEventListener('click', e => {
      const card = btn.closest('[data-product]');
      if (!card) { openDemoModal(); return; }
      try {
        const p = JSON.parse(card.getAttribute('data-product'));
        const sizeBtn = card.querySelector('.size-btn.active') || card.querySelector('.size-btn');
        const size = sizeBtn ? sizeBtn.textContent.trim() : 'M';
        addToCart({...p, size});
        openCartDrawer();
      } catch(err) { openDemoModal(); }
    });
  });
}

function openDemoModal() {
  document.getElementById('demo-overlay')?.classList.add('show');
}
function openCartDrawer() {
  const drawer = document.getElementById('cart-drawer');
  const overlay = document.getElementById('cart-overlay');
  if (drawer) { drawer.classList.add('open'); overlay?.classList.add('open'); document.body.style.overflow='hidden'; }
}

// ── WISHLIST ─────────────────────────────────────────────────
function initWishlist() {
  const WK = 'nx_wish_v1';
  let wish = [];
  try { wish = JSON.parse(localStorage.getItem(WK)) || []; } catch(e) {}
  document.querySelectorAll('.card-wish').forEach(btn => {
    const id = btn.getAttribute('data-id');
    if (wish.includes(id)) btn.classList.add('active');
    btn.addEventListener('click', () => {
      if (wish.includes(id)) { wish = wish.filter(i=>i!==id); btn.classList.remove('active'); showToast('Removed from wishlist'); }
      else { wish.push(id); btn.classList.add('active'); showToast('Added to wishlist ♡'); }
      try { localStorage.setItem(WK, JSON.stringify(wish)); } catch(e) {}
    });
  });
}

// ── PRODUCT GALLERY (PDP) ─────────────────────────────────────
function initGallery() {
  const mainImg = document.getElementById('pdp-main-img');
  if (!mainImg) return;
  document.querySelectorAll('.pdp-thumb').forEach(thumb => {
    thumb.addEventListener('click', () => {
      document.querySelectorAll('.pdp-thumb').forEach(t=>t.classList.remove('active'));
      thumb.classList.add('active');
      mainImg.src = thumb.src;
      mainImg.alt = thumb.alt;
    });
  });
}

// ── FILTER CHIPS ─────────────────────────────────────────────
function initFilters() {
  document.querySelectorAll('.filter-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const group = chip.getAttribute('data-group');
      document.querySelectorAll(`.filter-chip[data-group="${group}"]`).forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      // In demo mode, just show a toast
      const filter = chip.textContent.trim();
      if (filter !== 'All') showToast(`Filtered: ${filter}`);
    });
  });
}

// ── PROMO CODE ────────────────────────────────────────────────
function initPromo() {
  document.getElementById('apply-promo')?.addEventListener('click', () => {
    const input = document.getElementById('promo-input');
    if (!input) return;
    const code = input.value.trim().toUpperCase();
    if (code === 'DEMO10') {
      showToast('Promo DEMO10 applied — 10% off! (Demo only)', 'gold');
    } else if (code) {
      showToast('Invalid promo code. Try DEMO10');
    }
  });
}

// ── CHECKOUT FORM ─────────────────────────────────────────────
let lastSubmit = 0;
const RATE = 30000;
function initCheckout() {
  const form = document.getElementById('checkout-form');
  if (!form) return;
  form.addEventListener('input', e => { if(e.target.hasAttribute('aria-invalid')) e.target.removeAttribute('aria-invalid'); });
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const hp = form.querySelector('.hp input');
    if (hp?.value) return;
    if (Date.now() - lastSubmit < RATE) { showFormStatus(form,'err','⏳ Please wait before trying again.'); return; }
    let ok = true;
    form.querySelectorAll('[required]').forEach(f => { if(!f.value.trim()) { f.setAttribute('aria-invalid','true'); ok=false; }});
    const em = form.querySelector('[type=email]');
    if (em?.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em.value)) { em.setAttribute('aria-invalid','true'); ok=false; }
    if (!ok) { showFormStatus(form,'err','⚠️ Please fill in all required fields correctly.'); return; }
    const btn = form.querySelector('[type=submit]');
    if (btn) { btn.disabled=true; btn.textContent='Processing…'; }
    await new Promise(r=>setTimeout(r,1200));
    showFormStatus(form,'ok','✅ Demo mode: Order placed! (No real payment processed — this is a demo website)');
    form.reset();
    cart = []; saveCart(); updateCartBadge(); renderCartDrawer();
    lastSubmit = Date.now();
    if (btn) { btn.disabled=false; btn.textContent='Place Order'; }
  });
}

function showFormStatus(form, type, msg) {
  let el = form.querySelector('.form-status');
  if (!el) { el = document.createElement('div'); el.className='form-status'; form.appendChild(el); }
  el.className = `form-status ${type}`;
  el.textContent = msg;
  el.setAttribute('role','alert');
  el.scrollIntoView({behavior:'smooth',block:'nearest'});
}

// ── TOAST ─────────────────────────────────────────────────────
function showToast(msg, type = '') {
  let container = document.querySelector('.toast-container');
  if (!container) { container=document.createElement('div'); container.className='toast-container'; container.setAttribute('aria-live','polite'); document.body.appendChild(container); }
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.textContent = msg;
  container.appendChild(t);
  requestAnimationFrame(() => { requestAnimationFrame(() => { t.classList.add('show'); }); });
  setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 300); }, 2800);
}

// ── SCROLL ANIMATIONS ─────────────────────────────────────────
function initAnims() {
  if (!('IntersectionObserver' in window)) { document.querySelectorAll('.anim').forEach(el=>el.classList.add('show')); return; }
  const obs = new IntersectionObserver(entries => { entries.forEach(e => { if(e.isIntersecting){ e.target.classList.add('show'); obs.unobserve(e.target); }}); }, {threshold:0.08, rootMargin:'0px 0px -30px 0px'});
  document.querySelectorAll('.anim').forEach(el=>obs.observe(el));
}

// ── INIT ──────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  loadCart();
  updateCartBadge();
  initCookies();
  initNav();
  initCartDrawer();
  initDemoModal();
  initSizeSelector();
  initAddToCart();
  initWishlist();
  initGallery();
  initFilters();
  initPromo();
  initCheckout();
  initAnims();
});
