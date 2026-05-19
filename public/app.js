/* =============================================
   NURAAN® Silver Jewellery — Main Application
   ============================================= */

const API_BASE = '';
const WHATSAPP_NUMBER = '923207906077';

// ============ STATE ============
const state = {
  config: null,
  products: [],
  cart: JSON.parse(localStorage.getItem('nuraan_cart') || '[]'),
  currentQuality: 'medium',
  currentRoute: '/',
  theme: localStorage.getItem('nuraan_theme') || 'dark',
};

// ============ HELPERS ============
function $(sel, ctx = document) { return ctx.querySelector(sel); }
function $$(sel, ctx = document) { return [...ctx.querySelectorAll(sel)]; }

function formatPrice(amount) {
  return 'Rs. ' + Number(amount).toLocaleString('en-PK');
}

function getProductPrice(product, quality = state.currentQuality) {
  if (product.prices) return product.prices[quality] || product.prices.medium;
  if (!state.config) return 0;
  const catCode = product.sku.split('-').slice(0, 2).join('-');
  const making = state.config.makingCharges[catCode] || 1000;
  const mult = state.config.qualityMultipliers[quality] || 1.25;
  return Math.round(state.config.silverRate * product.weight * mult + making);
}

function getProductImageSrc(product, idx = 0) {
  return '/assets/products/' + (product.images[idx] || 'placeholder.jpg');
}

function getHoverImageSrc(product) {
  const catCode = product.sku.split('-').slice(0, 2).join('-');
  const hoverMap = {
    'S-GR': '/assets/products/hover-mens-ring.jpg',
    'S-LR': '/assets/products/hover-womens-ring.jpg',
    'S-GC': '/assets/products/hover-mens-chain.jpg',
    'S-LC': '/assets/products/hover-womens-chain.jpg',
    'S-LS': '/assets/products/hover-locket-set.jpg',
    'S-MS': '/assets/products/hover-malla-set.jpg',
    'S-GS': '/assets/products/hover-gani-set.jpg',
    'S-GBR': '/assets/products/hover-mens-bracelet.jpg',
    'S-LBR': '/assets/products/hover-womens-bracelet.jpg',
    'S-ST': '/assets/products/hover-studs.jpg',
    'S-BT': '/assets/products/hover-buttons.jpg',
    'S-CL': '/assets/products/hover-cufflinks.jpg',
    'S-UT': '/assets/products/hover-utensils.jpg',
  };
  return hoverMap[catCode] || getProductImageSrc(product, 1);
}

function getCategorySlug(code) {
  const map = {
    'S-GR': 'gents-rings', 'S-LR': 'ladies-rings', 'S-GC': 'gents-chains',
    'S-LC': 'ladies-chains', 'S-LS': 'locket-sets', 'S-MS': 'malla-sets',
    'S-GS': 'gani-sets', 'S-GBR': 'gents-bracelet', 'S-LBR': 'ladies-bracelet',
    'S-ST': 'studs', 'S-BT': 'buttons', 'S-CL': 'cufflinks', 'S-UT': 'utensils'
  };
  return map[code] || code.toLowerCase();
}
function getCategoryCode(slug) {
  const map = {
    'gents-rings': 'S-GR', 'ladies-rings': 'S-LR', 'gents-chains': 'S-GC',
    'ladies-chains': 'S-LC', 'locket-sets': 'S-LS', 'malla-sets': 'S-MS',
    'gani-sets': 'S-GS', 'gents-bracelet': 'S-GBR', 'ladies-bracelet': 'S-LBR',
    'studs': 'S-ST', 'buttons': 'S-BT', 'cufflinks': 'S-CL', 'utensils': 'S-UT'
  };
  return map[slug] || slug;
}
function getCategoryName(code) {
  const map = {
    'S-GR': 'Gents Rings', 'S-LR': 'Ladies Rings', 'S-GC': 'Gents Chains',
    'S-LC': 'Ladies Chains', 'S-LS': 'Locket Sets', 'S-MS': 'Malla Sets',
    'S-GS': 'Gani Sets', 'S-GBR': 'Gents Bracelet', 'S-LBR': 'Ladies Bracelet',
    'S-ST': 'Studs', 'S-BT': 'Buttons', 'S-CL': 'Cufflinks', 'S-UT': 'Utensils'
  };
  return map[code] || code;
}

const CATEGORIES = [
  { code: 'S-GR', name: 'Gents Rings', subTypes: ['Turkish', 'Irani', 'Wedding Bands'] },
  { code: 'S-LR', name: 'Ladies Rings', subTypes: [] },
  { code: 'S-GC', name: 'Gents Chains', subTypes: [] },
  { code: 'S-LC', name: 'Ladies Chains', subTypes: [] },
  { code: 'S-LS', name: 'Locket Sets', subTypes: [] },
  { code: 'S-MS', name: 'Malla Sets', subTypes: [] },
  { code: 'S-GS', name: 'Gani Sets', subTypes: [] },
  { code: 'S-GBR', name: 'Gents Bracelet', subTypes: [] },
  { code: 'S-LBR', name: 'Ladies Bracelet', subTypes: [] },
  { code: 'S-ST', name: 'Studs', subTypes: [] },
  { code: 'S-BT', name: 'Buttons', subTypes: [] },
  { code: 'S-CL', name: 'Cufflinks', subTypes: [] },
  { code: 'S-UT', name: 'Utensils', subTypes: [] },
];

// ============ API ============
async function fetchConfig() {
  try {
    const res = await fetch(API_BASE + '/api/config');
    state.config = await res.json();
  } catch (e) { console.error('Failed to load config', e); }
}

async function fetchProducts() {
  try {
    const res = await fetch(API_BASE + '/api/products');
    state.products = await res.json();
  } catch (e) { console.error('Failed to load products', e); }
}

// ============ CART ============
function saveCart() {
  localStorage.setItem('nuraan_cart', JSON.stringify(state.cart));
  updateCartCount();
}

function addToCart(item) {
  state.cart.push(item);
  saveCart();
  openCartDrawer();
}

function removeFromCart(index) {
  state.cart.splice(index, 1);
  saveCart();
  renderCartItems();
}

function getCartTotal() {
  return state.cart.reduce((sum, item) => sum + (item.price || 0), 0);
}

function updateCartCount() {
  const el = $('#cart-count');
  if (state.cart.length > 0) {
    el.style.display = 'flex';
    el.textContent = state.cart.length;
  } else {
    el.style.display = 'none';
  }
}

function openCartDrawer() {
  $('#cart-drawer').classList.add('active');
  $('#cart-overlay').classList.add('active');
  document.body.style.overflow = 'hidden';
  renderCartItems();
}

function closeCartDrawer() {
  $('#cart-drawer').classList.remove('active');
  $('#cart-overlay').classList.remove('active');
  document.body.style.overflow = '';
}

function openFeatureSheet(key) {
  const featureData = {
    silver:      { title: '22 Carat Excellence',       body: 'Every NURAAN piece is crafted from premium 22 Carat gold-quality alloy with 925 Sterling Silver at its core — independently tested and hallmarked for authenticity. Our rigorous quality checks ensure each item meets the highest standards of purity and durability before it reaches you.' },
    handcrafted: { title: 'Handcrafted To Perfection',  body: 'Each NURAAN jewel is individually shaped, soldered, filed, and polished by hand by our master silversmiths in Lahore, Pakistan. No two pieces are exactly alike — the subtle variations are a testament to genuine human artistry rather than mass production. Your piece is made specifically for you.' },
    delivery:    { title: 'Free & Secure Delivery',     body: "We offer free, insured shipping across all of Pakistan. Every order is packed in our signature NURAAN gift box, fully sealed and tracked. You'll receive a WhatsApp notification with your tracking number as soon as your piece is dispatched — typically within 7–10 business days of handcrafting." },
    plating:     { title: 'Lifetime Plating Service',   body: "NURAAN stands behind every piece for life. Our complimentary lifetime rhodium plating service means you can visit our workshop at any time to have your jewellery re-plated to its original brilliance — completely free of charge. We believe true luxury doesn't have an expiry date." }
  };
  const data = featureData[key];
  if (!data) return;
  const title = document.getElementById('feature-sheet-title');
  const body  = document.getElementById('feature-sheet-body');
  const overlay = document.getElementById('feature-sheet-overlay');
  const sheet   = document.getElementById('feature-sheet');
  if (title)   title.textContent = data.title;
  if (body)    body.textContent  = data.body;
  if (overlay) overlay.classList.add('active');
  if (sheet)   sheet.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeFeatureSheet() {
  const overlay = document.getElementById('feature-sheet-overlay');
  const sheet   = document.getElementById('feature-sheet');
  if (overlay) overlay.classList.remove('active');
  if (sheet)   sheet.classList.remove('active');
  document.body.style.overflow = '';
}

// Expose to global scope so inline onclick="" in template strings can call them
window.closeFeatureSheet  = closeFeatureSheet;
window.openFeatureSheet   = openFeatureSheet;

function checkoutViaWhatsApp() {
  if (state.cart.length === 0) {
    alert('Your cart is empty. Please add items before ordering.');
    return;
  }
  let msg = `Hi NURAAN! I'd like to place an order:\n\n`;
  state.cart.forEach((item, idx) => {
    const opts = [
      item.size     ? `Size: ${item.size}` : '',
      item.quality  ? `Weight: ${item.quality.charAt(0).toUpperCase() + item.quality.slice(1)}` : '',
      item.stone    ? `Stone: ${item.stone}` : '',
      item.rhodium === 'yes' ? 'Rhodium Plating: Yes' : '',
      item.width    ? `Top Width: ${item.width}` : '',
      item.engraving ? `Engraving: "${item.engraving}"` : ''
    ].filter(Boolean).join('\n   • ');
    msg += `${idx + 1}. *${item.name}* (SKU: ${item.sku})\n   • ${opts}\n   Price: ${formatPrice(item.price)}\n\n`;
  });
  msg += `*Total: ${formatPrice(getCartTotal())}*\n\nPlease confirm availability and delivery details. Thank you!`;
  window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`, '_blank');
}

function renderCartItems() {
  const container = $('#cart-items');
  if (state.cart.length === 0) {
    container.innerHTML = `
      <div class="cart-empty">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
          <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>
        </svg>
        <p>Your cart is empty</p>
      </div>`;
    $('#cart-total-price').textContent = 'Rs. 0';
    return;
  }
  container.innerHTML = state.cart.map((item, i) => {
    const itemProduct = state.products.find(p => p.sku === item.sku);
    const imgSrc = itemProduct ? getProductImageSrc(itemProduct) : '';

    // Build a comprehensive, human-readable attributes list
    const attrs = [
      item.size     ? `Size ${item.size}` : '',
      item.stone    ? item.stone : '',
      item.quality  ? `${item.quality.charAt(0).toUpperCase() + item.quality.slice(1)} Weight` : '',
      item.rhodium === 'yes' ? 'Rhodium Plated' : '',
      item.width    ? `Top Width: ${item.width}` : '',
      item.engraving ? `Engraving: "${item.engraving}"` : ''
    ].filter(Boolean);

    const attrsHTML = attrs.length
      ? `<div class="cart-item-attrs">
           ${attrs.map(a => `<span class="cart-item-attr">• ${a}</span>`).join('')}
         </div>`
      : '';

    return `
    <div class="cart-item">
      <img src="${imgSrc}" alt="${item.name}" class="cart-item-img" onerror="this.style.background='#f0f0f0'">
      <div class="cart-item-info">
        <div class="cart-item-name">${item.name}</div>
        <div class="cart-item-sku">${item.sku}</div>
        ${attrsHTML}
        <div class="cart-item-price">${formatPrice(item.price)}</div>
        <div class="cart-item-remove" onclick="window.nuraan.removeFromCart(${i})">Remove</div>
      </div>
    </div>
  `}).join('');

  $('#cart-total-price').textContent = formatPrice(getCartTotal());

  // Generate dynamic WhatsApp payload for entire cart
  const waBtn = document.querySelector('#cart-footer .btn-whatsapp');
  if (waBtn) {
    let orderMsg = `Hi NURAAN! I'd like to order:\n\n`;
    state.cart.forEach((item, idx) => {
      const opts = [
        item.size ? `Size: ${item.size}` : '',
        item.quality ? `Weight: ${item.quality.charAt(0).toUpperCase() + item.quality.slice(1)}` : '',
        item.stone ? `Stone: ${item.stone}` : '',
        item.rhodium === 'yes' ? `Rhodium: Yes` : '',
        item.width ? `Width: ${item.width}` : '',
        item.engraving ? `Engraving: ${item.engraving}` : ''
      ].filter(Boolean).join('\n  - ');

      orderMsg += `${idx + 1}x *${item.name}* (SKU: ${item.sku})\n  - ${opts}\n  Price: ${formatPrice(item.price)}\n\n`;
    });
    orderMsg += `*Total: ${formatPrice(getCartTotal())}*\n\nPlease confirm availability.`;
    waBtn.href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(orderMsg)}`;
  }
}

// ============ NAVIGATION ============
function buildNav() {
  const navList    = $('#nav-list');
  const mobileList = $('#mobile-nav-list');

  // ---- Desktop nav (unchanged) ----
  navList.innerHTML = CATEGORIES.map(cat => {
    const hasDropdown = cat.subTypes.length > 0;
    const dropdownHTML = hasDropdown ? `
      <div class="nav-dropdown">
        <a href="#" data-nav-cat="${getCategorySlug(cat.code)}">View All</a>
        ${cat.subTypes.map(st => `<a href="#" data-nav-cat="${getCategorySlug(cat.code)}" data-subtype="${st}">${st}</a>`).join('')}
      </div>
    ` : '';
    return `<li><a href="#" data-nav-cat="${getCategorySlug(cat.code)}">${cat.name}</a>${dropdownHTML}</li>`;
  }).join('');

  // ---- Mobile nav — hierarchical accordion ----
  const mobileGroups = {
    Gents: [
      { code: 'S-GR',  name: 'Rings'     },
      { code: 'S-GC',  name: 'Chains'    },
      { code: 'S-GBR', name: 'Bracelets' },
    ],
    Ladies: [
      { code: 'S-LR',  name: 'Rings'      },
      { code: 'S-LC',  name: 'Chains'     },
      { code: 'S-LBR', name: 'Bracelets'  },
      { code: 'S-LS',  name: 'Locket Sets'},
      { code: 'S-MS',  name: 'Malla Sets' },
      { code: 'S-GS',  name: 'Gani Sets'  },
    ],
    Accessories: [
      { code: 'S-ST',  name: 'Studs'     },
      { code: 'S-BT',  name: 'Buttons'   },
      { code: 'S-CL',  name: 'Cufflinks' },
      { code: 'S-UT',  name: 'Utensils'  },
    ],
  };

  const chevronSVG = `<svg class="mob-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>`;

  const subGroupHTML = Object.entries(mobileGroups).map(([groupName, items]) => `
    <li class="mob-acc-item">
      <button class="mob-acc-trigger mob-acc-trigger--sub">
        <span>${groupName}</span>${chevronSVG}
      </button>
      <ul class="mob-acc-panel">
        ${items.map(it => `
          <li>
            <a href="#" class="mob-cat-link" data-slug="${getCategorySlug(it.code)}">${it.name}</a>
          </li>`).join('')}
      </ul>
    </li>`).join('');

  mobileList.innerHTML = `
    <li class="mob-top-link">
      <a href="#" class="mob-cat-link" data-slug="/">Home</a>
    </li>

    <li class="mob-acc-item">
      <button class="mob-acc-trigger">
        <span>Categories</span>${chevronSVG}
      </button>
      <ul class="mob-acc-panel">
        ${subGroupHTML}
      </ul>
    </li>

    <li class="mob-top-link mob-top-link--divider">
      <a href="#" id="mob-signin-link" class="mob-cat-link">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
        Sign In / Account
      </a>
    </li>

    <li class="mob-top-link">
      <a href="#" id="mob-about-link" class="mob-cat-link">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        About NURAAN
      </a>
    </li>
  `;

  // ---- Accordion toggle logic ----
  $$('.mob-acc-trigger', mobileList).forEach(btn => {
    btn.addEventListener('click', () => {
      const item  = btn.parentElement;
      const panel = item.querySelector('.mob-acc-panel');
      const isOpen = item.classList.contains('open');

      // Close siblings at same level
      const siblings = [...item.parentElement.querySelectorAll(':scope > .mob-acc-item')];
      siblings.forEach(sib => {
        sib.classList.remove('open');
        const p = sib.querySelector('.mob-acc-panel');
        if (p) p.style.maxHeight = '0';
      });

      if (!isOpen) {
        item.classList.add('open');
        panel.style.maxHeight = panel.scrollHeight + 'px';
        // Recalculate parent panels so they expand too
        let parent = item.parentElement.closest('.mob-acc-item');
        while (parent) {
          const pp = parent.querySelector(':scope > .mob-acc-panel');
          if (pp) pp.style.maxHeight = pp.scrollHeight + 'px';
          parent = parent.parentElement.closest('.mob-acc-item');
        }
      }
    });
  });

  // ---- Category link clicks ----
  $$('.mob-cat-link', mobileList).forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      const slug = link.dataset.slug;
      closeMobileMenu();
      if (slug === '/') navigate('/');
      else navigate('/category/' + slug);
    });
  });

  // ---- Sign in & About links ----
  const mobSignin = $('#mob-signin-link');
  if (mobSignin) mobSignin.addEventListener('click', e => { e.preventDefault(); closeMobileMenu(); openSignIn(); });
  const mobAbout = $('#mob-about-link');
  if (mobAbout) mobAbout.addEventListener('click', e => { e.preventDefault(); closeMobileMenu(); openAboutModal(); });

  // ---- Desktop click handlers ----
  $$('[data-nav-cat]').forEach(el => {
    el.addEventListener('click', e => {
      e.preventDefault();
      closeMobileMenu();
      navigate('/category/' + el.dataset.navCat);
    });
  });

  $$('[data-nav]').forEach(el => {
    el.addEventListener('click', e => {
      e.preventDefault();
      navigate('/category/' + getCategorySlug(el.dataset.nav));
    });
  });
}


// ============ MOBILE MENU ============
function openMobileMenu() {
  $('#mobile-menu').classList.add('active');
  $('#mobile-menu-overlay').classList.add('active');
  document.body.style.overflow = 'hidden';
}
function closeMobileMenu() {
  $('#mobile-menu').classList.remove('active');
  $('#mobile-menu-overlay').classList.remove('active');
  document.body.style.overflow = '';
}

// ============ SEARCH ============
function openSearch() {
  $('#search-overlay').classList.add('active');
  setTimeout(() => $('#search-input').focus(), 100);
}
function closeSearch() {
  $('#search-overlay').classList.remove('active');
  $('#search-input').value = '';
  $('#search-results').innerHTML = '';
}
function performSearch(query) {
  if (!query.trim()) { $('#search-results').innerHTML = ''; return; }
  const q = query.toLowerCase();
  const results = state.products.filter(p =>
    p.name.toLowerCase().includes(q) ||
    p.category.toLowerCase().includes(q) ||
    p.sku.toLowerCase().includes(q) ||
    (p.subType && p.subType.toLowerCase().includes(q))
  ).slice(0, 10);

  $('#search-results').innerHTML = results.length ? results.map(p => `
    <div class="search-result-item" onclick="window.nuraan.navigate('/product/${p.sku}');window.nuraan.closeSearch();">
      <img src="${getProductImageSrc(p)}" alt="${p.name}" class="search-result-img" onerror="this.style.background='#f0f0f0';this.alt='${p.name.charAt(0)}'">
      <div class="search-result-info">
        <h4>${p.name}</h4>
        <p>${p.category} • ${p.sku} • ${formatPrice(getProductPrice(p))}</p>
      </div>
    </div>
  `).join('') : '<p style="text-align:center;color:#999;padding:40px 0;letter-spacing:1px;">No products found</p>';
}

// ============ ROUTER ============
function navigate(path) {
  history.pushState(null, '', path);
  handleRoute();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function handleRoute() {
  const path = window.location.pathname;
  state.currentRoute = path;
  const app = $('#app');

  if (path === '/' || path === '') {
    renderHomePage(app);
  } else if (path.startsWith('/category/')) {
    const slug = path.split('/category/')[1];
    renderCategoryPage(app, slug);
  } else if (path.startsWith('/product/')) {
    const sku = path.split('/product/')[1];
    renderProductPage(app, sku);
  } else if (path === '/gents-collection') {
    renderGentsCollectionPage(app);
  } else if (path === '/admin') {
    renderAdminPage(app);
  } else {
    renderHomePage(app);
  }

  // Re-observe fade-ins
  setTimeout(observeFadeIns, 100);
}

// ============ HOME PAGE ============
function renderHomePage(container) {
  document.title = 'NURAAN® — Silver Jewellery | Handcrafted in Pakistan';

  const featuredProducts = state.products.filter(p => p.featured);
  const braceletCuffProducts = state.products.filter(p =>
    p.sku.startsWith('S-GBR') || p.sku.startsWith('S-LBR') || p.sku.startsWith('S-CL')
  ).slice(0, 8);
  const demandProducts = braceletCuffProducts.length >= 4
    ? braceletCuffProducts
    : state.products.filter(p => !p.featured).slice(0, 8);

  container.innerHTML = `
    <!-- Hero -->
    <section class="hero-section" id="hero">
      <div class="hero-slide active">
        <img src="/assets/hero-1.jpg" alt="NURAAN Silver Jewellery" class="hero-slide-bg" onerror="this.style.background='linear-gradient(135deg, #1a1a1a, #0d0d0d)';this.style.width='100%';this.style.height='100%'">
        <div class="hero-content">
          <h1>Crafted To Become<br>Part of Your Story</h1>
          <p>Premium 925 Silver Jewellery — Handcrafted in Pakistan</p>
          <button class="btn" onclick="window.nuraan.scrollToSection('category-section')"><span>Explore Categories</span></button>
        </div>
      </div>
      <div class="hero-slide">
        <img src="/assets/hero-2.jpg" alt="NURAAN Rings" class="hero-slide-bg" onerror="this.style.background='linear-gradient(135deg, #2a2a2a, #1a1a1a)';this.style.width='100%';this.style.height='100%'">
        <div class="hero-content">
          <h1>A Promise, A Memory,<br>A Story That Stays</h1>
          <p>Explore our signature silver collection</p>
          <button class="btn" onclick="window.nuraan.scrollToSection('best-sellers-section')"><span>Shop Now</span></button>
        </div>
      </div>
      <div class="hero-slide">
        <img src="/assets/hero-3.jpg" alt="NURAAN Bracelets" class="hero-slide-bg" onerror="this.style.background='linear-gradient(135deg, #0d0d0d, #2a2a2a)';this.style.width='100%';this.style.height='100%'">
        <div class="hero-content">
          <h1>The Mark of<br>True Craftsmanship</h1>
          <p>Made to order — because perfection can't be mass-produced</p>
          <button class="btn" onclick="window.nuraan.openAboutModal()"><span>Discover More</span></button>
        </div>
      </div>
      <div class="hero-dots">
        <button class="hero-dot active" data-slide="0"></button>
        <button class="hero-dot" data-slide="1"></button>
        <button class="hero-dot" data-slide="2"></button>
      </div>
    </section>

    <!-- Featured Collection -->
    <section class="section-block fade-in" id="featured-section">
      <div class="section-header">
        <h2 class="section-title">Featured Collection</h2>
        <p class="section-subtitle">Handpicked pieces for the discerning</p>
      </div>
      <div class="product-grid">
        ${featuredProducts.slice(0, 8).map(p => renderProductCard(p)).join('')}
      </div>
      <div style="text-align:center;margin-top:48px;">
        <button class="btn" onclick="window.nuraan.navigate('/category/gents-rings')"><span>View All</span></button>
      </div>
    </section>

    <!-- Custom Ring Banner -->
    <section class="lifestyle-banner fade-in custom-ring-banner">
      <img src="/assets/hero-2.jpg" alt="Custom Ring" class="lifestyle-banner-bg" onerror="this.style.background='linear-gradient(135deg, #1a1a1a, #2a2a2a)';this.style.width='100%';this.style.height='100%'">
      <div class="lifestyle-banner-content">
        <h2>Design Your Own Legacy</h2>
        <p style="text-transform:none;letter-spacing:1.5px;font-size:13px;max-width:560px;margin:0 auto 28px;">Crafted to match your personal story. We turn your imagination into hand-crafted 925 sterling silver reality.</p>
        <button class="btn" onclick="window.nuraan.openCustomRingModal()"><span>Order Custom Ring</span></button>
      </div>
    </section>

    <!-- Category Tiles -->
    <section class="section-block fade-in" id="category-section">
      <div class="section-header">
        <h2 class="section-title">Shop By Category</h2>
        <p class="section-subtitle">Find the perfect piece for every occasion</p>
      </div>
      <div class="category-grid">
        ${CATEGORIES.map(cat => {
          const catProducts = state.products.filter(p => p.sku.startsWith(cat.code));
          const catImg = catProducts.length > 0 ? getProductImageSrc(catProducts[0]) : '/assets/cat-rings.jpg';
          return `
          <div class="category-tile" onclick="window.nuraan.navigate('/category/${getCategorySlug(cat.code)}')">
            <img src="${catImg}" alt="${cat.name}" class="category-tile-img" onerror="this.parentElement.querySelector('.category-tile-overlay').style.background='linear-gradient(135deg, #333, #111)'">
            <div class="category-tile-overlay">
              <span class="category-tile-name">${cat.name}</span>
              <span class="category-tile-count">${state.products.filter(p => p.sku.startsWith(cat.code)).length} Products</span>
            </div>
          </div>
        `;}).join('')}
      </div>
    </section>

    <!-- Lifestyle Banner 2 -->
    <section class="lifestyle-banner fade-in">
      <img src="/assets/hero-3.jpg" alt="Men's Collection" class="lifestyle-banner-bg" onerror="this.style.background='linear-gradient(135deg, #0d0d0d, #1a1a1a)';this.style.width='100%';this.style.height='100%'">
      <div class="lifestyle-banner-content">
        <h2>The Mark of a Man</h2>
        <p>Bold silver pieces for the modern gentleman</p>
        <button class="btn" onclick="window.nuraan.navigate('/gents-collection')"><span>Explore Men's</span></button>
      </div>
    </section>

    <!-- Fine Bracelets & Cufflinks -->
    <section class="section-block fade-in" id="best-sellers-section">
      <div class="section-header">
        <h2 class="section-title">Fine Bracelets &amp; Cufflinks</h2>
        <p class="section-subtitle">Wearable artistry for the discerning</p>
      </div>
      <div class="product-grid">
        ${demandProducts.length > 0 ? demandProducts.map(p => renderProductCard(p)).join('') : '<p style="text-align:center;color:#999;padding:40px;letter-spacing:2px;">COMING SOON</p>'}
      </div>
    </section>

    <!-- Trust Badges -->
    <section class="trust-badges fade-in">
      <div class="trust-badge">
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
        <span class="trust-badge-title">22K Silver Excellence</span>
        <span class="trust-badge-text">Certified Premium Silver</span>
      </div>
      <div class="trust-badge">
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
        <span class="trust-badge-title">Handcrafted</span>
        <span class="trust-badge-text">To Perfection</span>
      </div>
      <div class="trust-badge">
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
        <span class="trust-badge-title">Free & Secure</span>
        <span class="trust-badge-text">Delivery Nationwide</span>
      </div>
      <div class="trust-badge">
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
        <span class="trust-badge-title">Lifetime Plating</span>
        <span class="trust-badge-text">Service Available</span>
      </div>
    </section>

    <!-- Brand Story -->
    <section class="brand-story fade-in">
      <h2>NURAAN: Not Just a Brand, But a Philosophy</h2>
      <p>A belief that every piece of jewelry should echo the deep, multifaceted, and often unseen dimensions of a person's essence. Jewelry isn't just about adornment; it's about telling stories, embodying strength, embracing vulnerability, and reflecting the legacy of its wearer. Each NURAAN piece is handcrafted in 925 sterling silver with the utmost attention to detail, ensuring that you receive nothing less than perfection.</p>
    </section>

  `;

  // Hero slider auto-advance
  initHeroSlider();
}


function initHeroSlider() {
  let currentSlide = 0;
  const slides = $$('.hero-slide');
  const dots = $$('.hero-dot');
  if (slides.length === 0) return;

  function goToSlide(n) {
    slides[currentSlide].classList.remove('active');
    dots[currentSlide].classList.remove('active');
    currentSlide = n % slides.length;
    slides[currentSlide].classList.add('active');
    dots[currentSlide].classList.add('active');
  }

  dots.forEach(dot => {
    dot.addEventListener('click', () => goToSlide(parseInt(dot.dataset.slide)));
  });

  setInterval(() => goToSlide(currentSlide + 1), 6000);
}

// ============ PRODUCT CARD ============
function renderProductCard(product) {
  const price = getProductPrice(product);
  return `
    <div class="product-card" onclick="window.nuraan.navigate('/product/${product.sku}')">
      <div class="product-card-img-wrap">
        <img src="${getProductImageSrc(product, 0)}" alt="${product.name}" class="product-card-img" onerror="this.style.background='#f0f0f0'">
        <img src="${getHoverImageSrc(product)}" alt="${product.name} on hand" class="product-card-img-hover" onerror="this.style.background='linear-gradient(135deg, #2a2a2a, #1a1a1a)'">
        ${product.featured ? '<div class="product-card-badge">Featured</div>' : ''}
        <div class="product-card-quick">Quick View</div>
      </div>
      <div class="product-card-info">
        <div class="product-card-name">${product.name}</div>
        <div class="product-card-sku">${product.sku}</div>
        <div class="product-card-price">${formatPrice(price)}</div>
      </div>
    </div>
  `;
}

// ============ CATEGORY PAGE ============
function renderCategoryPage(container, slug) {
  const code = getCategoryCode(slug);
  const name = getCategoryName(code);
  const products = state.products.filter(p => p.sku.startsWith(code));
  document.title = `${name} — NURAAN® Silver Jewellery`;

  container.innerHTML = `
    <div class="category-header">
      <h1>${name}</h1>
      <p>${products.length} Products</p>
    </div>
    <div class="category-filters">
      <span class="filter-count">${products.length} products</span>
      <div class="filter-sort">
        <label>Sort by:</label>
        <select id="sort-select">
          <option value="featured">Featured</option>
          <option value="price-low">Price: Low to High</option>
          <option value="price-high">Price: High to Low</option>
          <option value="name">Name: A-Z</option>
        </select>
      </div>
    </div>
    <section class="section-block">
      <div class="product-grid" id="category-products">
        ${products.map(p => renderProductCard(p)).join('')}
      </div>
    </section>
  `;

  // Sort handler
  const sortSelect = $('#sort-select');
  if (sortSelect) {
    sortSelect.addEventListener('change', () => {
      let sorted = [...products];
      switch (sortSelect.value) {
        case 'price-low': sorted.sort((a, b) => getProductPrice(a) - getProductPrice(b)); break;
        case 'price-high': sorted.sort((a, b) => getProductPrice(b) - getProductPrice(a)); break;
        case 'name': sorted.sort((a, b) => a.name.localeCompare(b.name)); break;
        default: sorted.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
      }
      $('#category-products').innerHTML = sorted.map(p => renderProductCard(p)).join('');
    });
  }
}

// ============ GENTS COLLECTION PAGE ============
function renderGentsCollectionPage(container) {
  document.title = 'Gents Collection — NURAAN® Silver Jewellery';
  const gentsCodes = ['S-GR', 'S-GC', 'S-GBR', 'S-CL'];
  const products = state.products.filter(p => gentsCodes.some(code => p.sku.startsWith(code)));

  container.innerHTML = `
    <div class="category-header">
      <h1>Gents Collection</h1>
      <p>${products.length} Products — Rings, Chains, Bracelets &amp; Cufflinks</p>
    </div>
    <div class="category-filters">
      <span class="filter-count">${products.length} products</span>
      <div class="filter-sort">
        <label>Sort by:</label>
        <select id="sort-select">
          <option value="featured">Featured</option>
          <option value="price-low">Price: Low to High</option>
          <option value="price-high">Price: High to Low</option>
          <option value="name">Name: A-Z</option>
        </select>
      </div>
    </div>
    <section class="section-block">
      <div class="product-grid" id="gents-products">
        ${products.map(p => renderProductCard(p)).join('')}
      </div>
    </section>
  `;

  const sortSelect = $('#sort-select');
  if (sortSelect) {
    sortSelect.addEventListener('change', () => {
      let sorted = [...products];
      switch (sortSelect.value) {
        case 'price-low': sorted.sort((a, b) => getProductPrice(a) - getProductPrice(b)); break;
        case 'price-high': sorted.sort((a, b) => getProductPrice(b) - getProductPrice(a)); break;
        case 'name': sorted.sort((a, b) => a.name.localeCompare(b.name)); break;
        default: sorted.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
      }
      $('#gents-products').innerHTML = sorted.map(p => renderProductCard(p)).join('');
    });
  }
}

// ============ PRODUCT DETAIL PAGE ============
function renderProductPage(container, sku) {
  const product = state.products.find(p => p.sku === sku);
  if (!product) {
    container.innerHTML = '<div style="text-align:center;padding:80px;"><h2>Product Not Found</h2></div>';
    return;
  }

  document.title = `${product.name} — NURAAN® Silver Jewellery`;

  const defaultQuality = 'medium';
  const price = getProductPrice(product, defaultQuality);
  const hasStones = product.stones && product.stones.length > 0;
  const hasTopWidths = product.topWidths && product.topWidths.length > 0;

  container.innerHTML = `
    <div class="product-detail">
      <!-- Gallery -->
      <div class="product-gallery">
        <div class="product-gallery-badge">
          <span>Made To Order</span>
          <small>Crafted Exclusively For You.</small>
        </div>
        <img id="pd-main-image" src="${getProductImageSrc(product, 0)}" alt="${product.name}" class="product-gallery-main" onerror="this.style.background='linear-gradient(135deg, #1a1a1a, #0d0d0d)'">
        <div class="product-thumbs">
          ${product.images.map((img, i) => `
            <img src="${getProductImageSrc(product, i)}" alt="${product.name} view ${i+1}" class="product-thumb ${i === 0 ? 'active' : ''}" data-idx="${i}" onerror="this.style.background='#333'">
          `).join('')}
        </div>
      </div>

      <!-- Info -->
      <div class="product-info">
        <h1 class="product-title">${product.name}</h1>
        <div class="product-price" id="pd-price">${formatPrice(price)}</div>

        <div class="product-customize-title">Customize Your ${product.category.includes('Ring') ? 'Ring' : 'Piece'}</div>
        <div class="product-customize-subtitle">Make it uniquely yours.</div>

        <!-- Size -->
        <div class="option-group">
          <div class="option-group-header">
            <span class="option-group-label">Size *</span>
            <a href="#" class="option-group-link">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
              Size Guide
            </a>
          </div>
          <div class="option-pills" id="pd-sizes">
            ${product.sizes.map((s, i) => `
              <button class="option-pill ${i === 2 ? 'active' : ''}" data-size="${s}">${s}</button>
            `).join('')}
          </div>
          <div class="custom-size-wrap">
            <input type="number" class="custom-size-input" id="pd-custom-size" placeholder="Custom">
            <span class="custom-size-label">Enter custom size (mm/inches)</span>
          </div>
        </div>

        ${hasStones ? `
        <!-- Stone -->
        <div class="option-group">
          <div class="option-group-header">
            <span class="option-group-label">Choose Stone *</span>
          </div>
          <div class="stone-options">
            ${product.stones.map((s, i) => `
              <div class="stone-card ${i === 0 ? 'active' : ''}" data-stone="${s}">
                <img src="/assets/stones/${s.toLowerCase()}.png" class="stone-img" alt="${s}">
                <div class="stone-info">
                  <div class="stone-name">${s}</div>
                  <div class="stone-desc">${s.toLowerCase() === 'moissanite' ? 'Exceptional Brilliance' : 'Classic Elegance'}</div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
        ` : ''}

        ${product.rhodiumOption ? `
        <!-- Rhodium Plating -->
        <div class="option-group">
          <div class="option-group-header">
            <span class="option-group-label">Rhodium Plating *</span>
            <span class="option-group-link" title="Adds a protective layer for extra shine">ⓘ</span>
          </div>
          <div class="option-pills" id="pd-rhodium">
            <button class="option-pill active" data-rhodium="yes">Yes, Add Rhodium</button>
            <button class="option-pill" data-rhodium="no">No, Thanks</button>
          </div>
        </div>
        ` : ''}

        ${hasTopWidths ? `
        <!-- Top Width -->
        <div class="option-group">
          <div class="option-group-header">
            <span class="option-group-label">Top Width *</span>
          </div>
          <div class="option-pills" id="pd-widths">
            ${product.topWidths.map((w, i) => `
              <button class="option-pill ${i === 1 ? 'active' : ''}" data-width="${w}">${w}</button>
            `).join('')}
          </div>
        </div>
        ` : ''}

        <!-- Weight/Feel (Quality) -->
        <div class="option-group">
          <div class="option-group-header">
            <span class="option-group-label">Weight / Feel *</span>
          </div>
          <div class="option-pills" id="pd-quality">
            <button class="option-pill" data-quality="low">Light</button>
            <button class="option-pill active" data-quality="medium">Medium</button>
            <button class="option-pill" data-quality="high">Heavy</button>
          </div>
          <p style="font-size:11px;color:#999;margin-top:8px;">Affects thickness and final feel of the piece.</p>
        </div>

        ${product.engravable ? `
        <!-- Engraving -->
        <div class="option-group">
          <div class="option-group-header">
            <span class="option-group-label">Engraving (Inside)</span>
            <span style="font-size:11px;color:#999;text-transform:uppercase;letter-spacing:1px;">Optional</span>
          </div>
          <div class="engrave-input-wrap">
            <input type="text" class="engrave-input" id="pd-engraving" maxlength="15" placeholder="Enter text (up to 15 characters)">
            <span class="engrave-counter" id="pd-engrave-count">0/15</span>
          </div>
        </div>
        ` : ''}

        <!-- Actions -->
        <div class="product-actions">
          <button class="btn btn-full" id="pd-add-cart" style="border-color:#000;"><span>Add To Cart</span></button>
          <button class="btn btn-primary btn-full" id="pd-buy-now"><span>Buy It Now</span></button>
        </div>

        <!-- Product Features Grid (2x2) -->
        <div class="pd-features-grid">
          <button class="pd-feature-card" data-feature="silver" aria-label="22 Carat Excellence">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            <span class="pd-feature-title">22 Carat<br>Excellence</span>
          </button>
          <button class="pd-feature-card" data-feature="handcrafted" aria-label="Handcrafted To Perfection">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
            <span class="pd-feature-title">Handcrafted<br>To Perfection</span>
          </button>
          <button class="pd-feature-card" data-feature="delivery" aria-label="Free Secure Delivery">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
            <span class="pd-feature-title">Free &amp; Secure<br>Delivery</span>
          </button>
          <button class="pd-feature-card" data-feature="plating" aria-label="Lifetime Plating Service">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
            <span class="pd-feature-title">Lifetime<br>Plating Service</span>
          </button>
        </div>

        <!-- Feature Bottom-Sheet Modal -->
        <div id="feature-sheet-overlay" class="feature-sheet-overlay" onclick="window.nuraan.closeFeatureSheet()"></div>
        <div id="feature-sheet" class="feature-sheet" role="dialog" aria-modal="true">
          <div class="feature-sheet-handle"></div>
          <button class="feature-sheet-close" onclick="window.nuraan.closeFeatureSheet()" aria-label="Close">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
          <div class="feature-sheet-icon" id="feature-sheet-icon"></div>
          <h3 class="feature-sheet-title" id="feature-sheet-title"></h3>
          <p class="feature-sheet-body" id="feature-sheet-body"></p>
        </div>

        <!-- Accordions -->
        <div class="accordion-list">
          <div class="accordion-item">
            <div class="accordion-header">
              <span>Product Details</span>
              <span class="accordion-icon">+</span>
            </div>
            <div class="accordion-body">
              <div class="accordion-body-inner">
                <p>${product.description}</p>
                <br>
                <p><strong>SKU:</strong> ${product.sku}</p>
                <p><strong>Category:</strong> ${product.category}</p>
                ${product.subType ? `<p><strong>Type:</strong> ${product.subType}</p>` : ''}
                <p><strong>Weight:</strong> ~${product.weight}g (varies by size)</p>
                <p><strong>Material:</strong> 925 Sterling Silver</p>
              </div>
            </div>
          </div>
          <div class="accordion-item">
            <div class="accordion-header">
              <span>Shipping Information</span>
              <span class="accordion-icon">+</span>
            </div>
            <div class="accordion-body">
              <div class="accordion-body-inner">
                <p>Free shipping across Pakistan. Orders are handcrafted and dispatched within 7-10 business days. Tracking information will be provided via WhatsApp.</p>
              </div>
            </div>
          </div>
          <div class="accordion-item">
            <div class="accordion-header">
              <span>Easy Return & Exchange</span>
              <span class="accordion-icon">+</span>
            </div>
            <div class="accordion-body">
              <div class="accordion-body-inner">
                <p>We offer a 30-day exchange policy. Items must be returned in original packaging and condition. Custom engraved items are non-returnable.</p>
              </div>
            </div>
          </div>
          <div class="accordion-item">
            <div class="accordion-header">
              <span>Personalize It, Make It Yours</span>
              <span class="accordion-icon">+</span>
            </div>
            <div class="accordion-body">
              <div class="accordion-body-inner">
                <p>Add a personal touch with custom engraving. Up to 15 characters can be engraved on the inside of rings and bracelets. Custom sizes are also available — just specify your exact measurements.</p>
              </div>
            </div>
          </div>
          <div class="accordion-item">
            <div class="accordion-header">
              <span>Lifetime Plating Services</span>
              <span class="accordion-icon">+</span>
            </div>
            <div class="accordion-body">
              <div class="accordion-body-inner">
                <p>All NURAAN silver pieces come with lifetime rhodium plating service. Visit our workshop anytime for a fresh re-plating to maintain the brilliance of your jewelry.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  // --- Product page interactions ---
  initProductDetailInteractions(product);
}

function initProductDetailInteractions(product) {
  // Option pills (size, width, quality, rhodium)
  $$('.option-pills').forEach(group => {
    const pills = $$('.option-pill', group);
    pills.forEach(pill => {
      pill.addEventListener('click', () => {
        pills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        // Update price if quality changed
        if (pill.dataset.quality) {
          const newPrice = getProductPrice(product, pill.dataset.quality);
          $('#pd-price').textContent = formatPrice(newPrice);
        }
      });
    });
  });

  // Stone cards
  $$('.stone-card').forEach(card => {
    card.addEventListener('click', () => {
      $$('.stone-card').forEach(c => c.classList.remove('active'));
      card.classList.add('active');
    });
  });

  // Engraving counter
  const engInput = $('#pd-engraving');
  const engCount = $('#pd-engrave-count');
  if (engInput && engCount) {
    engInput.addEventListener('input', () => {
      engCount.textContent = engInput.value.length + '/15';
    });
  }

  // Accordions
  $$('.accordion-header').forEach(header => {
    header.addEventListener('click', () => {
      const item = header.parentElement;
      const body = item.querySelector('.accordion-body');
      const isOpen = item.classList.contains('open');
      // Close all
      $$('.accordion-item').forEach(ai => {
        ai.classList.remove('open');
        ai.querySelector('.accordion-body').style.maxHeight = '0';
      });
      if (!isOpen) {
        item.classList.add('open');
        body.style.maxHeight = body.scrollHeight + 'px';
      }
    });
  });

  // Feature cards — bottom sheet modals
  const featureData = {
    silver: {
      icon: `<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--color-gold)" stroke-width="1.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
      title: '22 Carat Excellence',
      body: 'Every NURAAN piece is crafted from premium 22 Carat gold-quality alloy with 925 Sterling Silver at its core — independently tested and hallmarked for authenticity. Our rigorous quality checks ensure each item meets the highest standards of purity and durability before it reaches you.'
    },
    handcrafted: {
      icon: `<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--color-gold)" stroke-width="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>`,
      title: 'Handcrafted To Perfection',
      body: 'Each NURAAN jewel is individually shaped, soldered, filed, and polished by hand by our master silversmiths in Lahore, Pakistan. No two pieces are exactly alike — the subtle variations are a testament to genuine human artistry rather than mass production. Your piece is made specifically for you.'
    },
    delivery: {
      icon: `<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--color-gold)" stroke-width="1.5"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>`,
      title: 'Free & Secure Delivery',
      body: 'We offer free, insured shipping across all of Pakistan. Every order is packed in our signature NURAAN gift box, fully sealed and tracked. You\'ll receive a WhatsApp notification with your tracking number as soon as your piece is dispatched — typically within 7–10 business days of handcrafting.'
    },
    plating: {
      icon: `<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--color-gold)" stroke-width="1.5"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`,
      title: 'Lifetime Plating Service',
      body: 'NURAAN stands behind every piece for life. Our complimentary lifetime rhodium plating service means you can visit our workshop at any time to have your jewellery re-plated to its original brilliance — completely free of charge. We believe true luxury doesn\'t have an expiry date.'
    }
  };

  $$('.pd-feature-card').forEach(card => {
    card.addEventListener('click', () => openFeatureSheet(card.dataset.feature));
  });


  // Add to cart
  const addCartBtn = $('#pd-add-cart');
  if (addCartBtn) {
    addCartBtn.addEventListener('click', () => {
      const quality = $('.option-pill.active[data-quality]')?.dataset.quality || 'medium';
      const size = $('.option-pill.active[data-size]')?.dataset.size || $('#pd-custom-size')?.value || '';
      const engraving = $('#pd-engraving')?.value || '';
      const stone = $('.stone-card.active')?.dataset.stone || '';
      const rhodium = $('.option-pill.active[data-rhodium]')?.dataset.rhodium || '';
      const width = $('.option-pill.active[data-width]')?.dataset.width || '';

      addToCart({
        sku: product.sku,
        name: product.name,
        quality,
        size,
        engraving,
        stone,
        rhodium,
        width,
        price: getProductPrice(product, quality),
      });
    });
  }

  // Buy now — add to cart then open cart drawer
  const buyBtn = $('#pd-buy-now');
  if (buyBtn) {
    buyBtn.addEventListener('click', () => {
      const quality  = $('.option-pill.active[data-quality]')?.dataset.quality || 'medium';
      const size     = $('.option-pill.active[data-size]')?.dataset.size || $('#pd-custom-size')?.value || '';
      const engraving = $('#pd-engraving')?.value || '';
      const stone    = $('.stone-card.active')?.dataset.stone || '';
      const rhodium  = $('.option-pill.active[data-rhodium]')?.dataset.rhodium || '';
      const width    = $('.option-pill.active[data-width]')?.dataset.width || '';

      addToCart({
        sku: product.sku,
        name: product.name,
        quality,
        size,
        engraving,
        stone,
        rhodium,
        width,
        price: getProductPrice(product, quality),
      });

      // Open cart drawer immediately so user can review & checkout
      openCartDrawer();
    });
  }


  // Thumbnail click
  $$('.product-thumb').forEach(thumb => {
    thumb.addEventListener('click', () => {
      $$('.product-thumb').forEach(t => t.classList.remove('active'));
      thumb.classList.add('active');
      const idx = parseInt(thumb.dataset.idx);
      const mainImg = $('#pd-main-image');
      if (mainImg) mainImg.src = getProductImageSrc(product, idx);
    });
  });
}

// ============ ADMIN PAGE ============
function renderAdminPage(container) {
  document.title = 'Admin Panel — NURAAN®';

  container.innerHTML = `
    <div class="admin-page">
      <div class="admin-header">
        <h1>Admin Panel</h1>
        <p style="color:#999;margin-top:8px;font-size:13px;">Manage silver rates, quality multipliers, making charges, and products</p>
      </div>

      <div id="admin-login-section" class="admin-login">
        <h3 style="margin-bottom:20px;font-family:var(--font-heading);font-size:24px;letter-spacing:2px;">Enter Admin Password</h3>
        <input type="password" id="admin-password" placeholder="••••••••">
        <button class="btn btn-primary btn-full" id="admin-login-btn"><span>Login</span></button>
      </div>

      <div id="admin-content" style="display:none;">

        <!-- Admin Tab Navigation -->
        <div class="admin-tabs">
          <button class="admin-tab active" data-tab="config">Configuration</button>
          <button class="admin-tab" data-tab="products">Products</button>
          <button class="admin-tab" data-tab="add-product">+ Add Product</button>
        </div>

        <!-- ===== CONFIG TAB ===== -->
        <div class="admin-tab-content active" id="admin-tab-config">
          <!-- Silver Rate -->
          <div class="admin-section">
            <h3>Silver Rate Configuration</h3>
            <div class="admin-row">
              <label>Silver Rate (Rs/gram)</label>
              <input type="number" id="admin-silver-rate" value="${state.config?.silverRate || 280}">
            </div>
            <div class="admin-row">
              <label>High Quality Multiplier</label>
              <input type="number" step="0.01" id="admin-mult-high" value="${state.config?.qualityMultipliers?.high || 1.5}">
            </div>
            <div class="admin-row">
              <label>Medium Quality Multiplier</label>
              <input type="number" step="0.01" id="admin-mult-medium" value="${state.config?.qualityMultipliers?.medium || 1.25}">
            </div>
            <div class="admin-row">
              <label>Low Quality Multiplier</label>
              <input type="number" step="0.01" id="admin-mult-low" value="${state.config?.qualityMultipliers?.low || 1.0}">
            </div>
            <button class="btn btn-primary" id="admin-save-config"><span>Save Configuration</span></button>
            <div id="admin-config-status"></div>
          </div>

          <!-- Making Charges -->
          <div class="admin-section">
            <h3>Making Charges by Category</h3>
            <table class="admin-products-table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Code</th>
                  <th>Making Charge (Rs)</th>
                </tr>
              </thead>
              <tbody>
                ${CATEGORIES.map(cat => `
                  <tr>
                    <td>${cat.name}</td>
                    <td>${cat.code}</td>
                    <td><input type="number" class="admin-making-charge" data-code="${cat.code}" value="${state.config?.makingCharges?.[cat.code] || 1000}"></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            <div style="margin-top:16px;">
              <button class="btn btn-primary" id="admin-save-making"><span>Save Making Charges</span></button>
            </div>
            <div id="admin-making-status"></div>
          </div>
        </div>

        <!-- ===== PRODUCTS TAB ===== -->
        <div class="admin-tab-content" id="admin-tab-products">
          <div class="admin-section">
            <h3>All Products — Manage Inventory</h3>
            <p style="color:#999;font-size:12px;margin-bottom:20px;">Edit weights inline or delete products from your catalogue.</p>
            <div class="admin-table-wrap">
              <table class="admin-products-table">
                <thead>
                  <tr>
                    <th>SKU</th>
                    <th>Name</th>
                    <th>Category</th>
                    <th>Weight (g)</th>
                    <th>Low Price</th>
                    <th>Med Price</th>
                    <th>High Price</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  ${state.products.map(p => `
                    <tr id="product-row-${p.sku}">
                      <td><span class="admin-sku-badge">${p.sku}</span></td>
                      <td>${p.name}</td>
                      <td>${p.category}</td>
                      <td><input type="number" class="admin-product-weight" data-sku="${p.sku}" value="${p.weight}"></td>
                      <td>${formatPrice(getProductPrice(p, 'low'))}</td>
                      <td>${formatPrice(getProductPrice(p, 'medium'))}</td>
                      <td>${formatPrice(getProductPrice(p, 'high'))}</td>
                      <td>
                        <button class="admin-delete-btn" data-sku="${p.sku}" data-name="${p.name}" title="Delete ${p.name}">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                        </button>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
            <div style="margin-top:16px;">
              <button class="btn btn-primary" id="admin-save-products"><span>Save Product Weights</span></button>
            </div>
            <div id="admin-products-status"></div>
          </div>
        </div>

        <!-- ===== ADD PRODUCT TAB ===== -->
        <div class="admin-tab-content" id="admin-tab-add-product">
          <div class="admin-section">
            <h3>Add New Product</h3>
            <p style="color:#999;font-size:12px;margin-bottom:24px;">Fill in all product details below to add to the catalogue.</p>

            <div class="admin-form-grid">
              <!-- Row 1 -->
              <div class="admin-form-group">
                <label class="admin-form-label">SKU <span class="required">*</span></label>
                <input type="text" id="add-sku" class="admin-form-input" placeholder="e.g. S-GR-0006">
                <span class="admin-form-hint">Format: S-XX-0000 (must be unique)</span>
              </div>
              <div class="admin-form-group">
                <label class="admin-form-label">Product Name <span class="required">*</span></label>
                <input type="text" id="add-name" class="admin-form-input" placeholder="e.g. Royal Monarch">
              </div>

              <!-- Row 2 -->
              <div class="admin-form-group">
                <label class="admin-form-label">Category <span class="required">*</span></label>
                <select id="add-category" class="admin-form-input">
                  <option value="">— Select Category —</option>
                  ${CATEGORIES.map(cat => `<option value="${cat.name}" data-code="${cat.code}">${cat.name} (${cat.code})</option>`).join('')}
                </select>
              </div>
              <div class="admin-form-group">
                <label class="admin-form-label">Sub Type</label>
                <input type="text" id="add-subtype" class="admin-form-input" placeholder="e.g. Turkish, Irani (optional)">
              </div>

              <!-- Row 3 -->
              <div class="admin-form-group">
                <label class="admin-form-label">Weight (grams) <span class="required">*</span></label>
                <input type="number" id="add-weight" class="admin-form-input" placeholder="e.g. 15" min="1">
              </div>
              <div class="admin-form-group">
                <label class="admin-form-label">Featured Product</label>
                <select id="add-featured" class="admin-form-input">
                  <option value="false">No</option>
                  <option value="true">Yes — Show on homepage</option>
                </select>
              </div>

              <!-- Full Width Description -->
              <div class="admin-form-group full-width">
                <label class="admin-form-label">Description</label>
                <textarea id="add-description" class="admin-form-input admin-textarea" rows="3" placeholder="Describe the product..."></textarea>
              </div>

              <!-- Row 4 -->
              <div class="admin-form-group">
                <label class="admin-form-label">Stones</label>
                <div class="admin-checkbox-group">
                  <label class="admin-checkbox-label"><input type="checkbox" value="moissanite" class="add-stone-check"> Moissanite</label>
                  <label class="admin-checkbox-label"><input type="checkbox" value="zircon" class="add-stone-check"> Zircon</label>
                </div>
              </div>
              <div class="admin-form-group">
                <label class="admin-form-label">Options</label>
                <div class="admin-checkbox-group">
                  <label class="admin-checkbox-label"><input type="checkbox" id="add-rhodium" checked> Rhodium Plating</label>
                  <label class="admin-checkbox-label"><input type="checkbox" id="add-engravable" checked> Engravable</label>
                </div>
              </div>

              <!-- Row 5 -->
              <div class="admin-form-group">
                <label class="admin-form-label">Sizes</label>
                <input type="text" id="add-sizes" class="admin-form-input" placeholder="e.g. 18mm, 19mm, 20mm, 21mm">
                <span class="admin-form-hint">Comma-separated values</span>
              </div>
              <div class="admin-form-group">
                <label class="admin-form-label">Top Widths</label>
                <input type="text" id="add-topwidths" class="admin-form-input" placeholder="e.g. 5mm, 6mm, 8mm">
                <span class="admin-form-hint">Comma-separated (for rings)</span>
              </div>

              <!-- Row 6: Image Upload -->
              <div class="admin-form-group full-width">
                <label class="admin-form-label">Product Images</label>
                <div class="admin-upload-zone" id="upload-zone">
                  <input type="file" id="upload-input" multiple accept="image/jpeg,image/png,image/webp,image/gif" style="display:none;">
                  <div class="upload-zone-content" id="upload-zone-content">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                      <circle cx="8.5" cy="8.5" r="1.5"/>
                      <polyline points="21 15 16 10 5 21"/>
                    </svg>
                    <p class="upload-zone-title">Drag & drop images here</p>
                    <p class="upload-zone-subtitle">or click to browse • JPG, PNG, WebP • Max 10MB each</p>
                  </div>
                </div>
                <div class="upload-previews" id="upload-previews"></div>
                <div id="upload-status"></div>
              </div>
            </div>

            <!-- Preview of SKU auto-generated -->
            <div class="admin-add-preview" id="add-product-preview" style="display:none;">
              <h4>Product Preview</h4>
              <div id="add-preview-content"></div>
            </div>

            <div style="margin-top:24px;display:flex;gap:12px;">
              <button class="btn btn-primary" id="admin-add-product-btn"><span>Add Product</span></button>
              <button class="btn" id="admin-preview-product-btn" style="border-color:var(--accent);"><span>Preview</span></button>
            </div>
            <div id="admin-add-status"></div>
          </div>
        </div>

        <p style="text-align:center;color:#999;font-size:12px;margin-top:20px;">Last updated: ${state.config?.lastUpdated ? new Date(state.config.lastUpdated).toLocaleString() : 'N/A'}</p>
      </div>
    </div>
  `;

  // ---- Admin Tab Navigation ----
  $$('.admin-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      $$('.admin-tab').forEach(t => t.classList.remove('active'));
      $$('.admin-tab-content').forEach(tc => tc.classList.remove('active'));
      tab.classList.add('active');
      const target = document.getElementById('admin-tab-' + tab.dataset.tab);
      if (target) target.classList.add('active');
    });
  });

  // Admin login
  const loginBtn = $('#admin-login-btn');
  const pwInput = $('#admin-password');
  if (loginBtn) {
    loginBtn.addEventListener('click', () => {
      if (pwInput.value === 'nuraan2026') {
        $('#admin-login-section').style.display = 'none';
        $('#admin-content').style.display = 'block';
      } else {
        alert('Incorrect password');
      }
    });
    pwInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') loginBtn.click();
    });
  }

  // Save config
  const saveConfigBtn = $('#admin-save-config');
  if (saveConfigBtn) {
    saveConfigBtn.addEventListener('click', async () => {
      try {
        const res = await fetch(API_BASE + '/api/config', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            password: 'nuraan2026',
            silverRate: parseFloat($('#admin-silver-rate').value),
            qualityMultipliers: {
              high: parseFloat($('#admin-mult-high').value),
              medium: parseFloat($('#admin-mult-medium').value),
              low: parseFloat($('#admin-mult-low').value),
            }
          })
        });
        const data = await res.json();
        state.config = data;
        await fetchProducts();
        showStatus('admin-config-status', 'Configuration saved successfully!', 'success');
        setTimeout(() => renderAdminPage(container), 1000);
      } catch (e) {
        showStatus('admin-config-status', 'Failed to save: ' + e.message, 'error');
      }
    });
  }

  // Save making charges
  const saveMakingBtn = $('#admin-save-making');
  if (saveMakingBtn) {
    saveMakingBtn.addEventListener('click', async () => {
      const makingCharges = {};
      $$('.admin-making-charge').forEach(input => {
        makingCharges[input.dataset.code] = parseFloat(input.value);
      });
      try {
        const res = await fetch(API_BASE + '/api/config', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password: 'nuraan2026', makingCharges })
        });
        const data = await res.json();
        state.config = data;
        await fetchProducts();
        showStatus('admin-making-status', 'Making charges saved!', 'success');
        setTimeout(() => renderAdminPage(container), 1000);
      } catch (e) {
        showStatus('admin-making-status', 'Failed: ' + e.message, 'error');
      }
    });
  }

  // Save product weights
  const saveProductsBtn = $('#admin-save-products');
  if (saveProductsBtn) {
    saveProductsBtn.addEventListener('click', async () => {
      const updates = [];
      $$('.admin-product-weight').forEach(input => {
        updates.push(
          fetch(API_BASE + '/api/products/' + input.dataset.sku, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password: 'nuraan2026', weight: parseFloat(input.value) })
          })
        );
      });
      try {
        await Promise.all(updates);
        await fetchProducts();
        showStatus('admin-products-status', 'Product weights saved!', 'success');
        setTimeout(() => renderAdminPage(container), 1000);
      } catch (e) {
        showStatus('admin-products-status', 'Failed: ' + e.message, 'error');
      }
    });
  }

  // ---- Delete Product ----
  $$('.admin-delete-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const sku = btn.dataset.sku;
      const name = btn.dataset.name;
      const row = document.getElementById('product-row-' + sku);
      if (!row) return;

      // Check if confirmation already showing
      if (row.querySelector('.delete-confirm-bar')) return;

      // Create inline confirmation bar
      const confirmBar = document.createElement('tr');
      confirmBar.className = 'delete-confirm-bar';
      confirmBar.innerHTML = `
        <td colspan="8" style="background:rgba(239,83,80,0.08);padding:12px 16px;border-bottom:2px solid var(--color-error);">
          <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;">
            <span style="font-size:13px;color:var(--color-error);font-weight:600;letter-spacing:0.5px;">
              Delete "${name}" (${sku})? This cannot be undone.
            </span>
            <div style="display:flex;gap:8px;">
              <button class="delete-confirm-yes" style="padding:8px 20px;background:var(--color-error);color:#fff;border:none;font-size:11px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;cursor:pointer;font-family:var(--font-body);">YES, DELETE</button>
              <button class="delete-confirm-no" style="padding:8px 20px;background:transparent;color:var(--text-secondary);border:1px solid var(--border-color);font-size:11px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;cursor:pointer;font-family:var(--font-body);">CANCEL</button>
            </div>
          </div>
        </td>
      `;

      // Insert after the product row
      row.after(confirmBar);
      row.style.background = 'rgba(239,83,80,0.04)';

      // Cancel
      confirmBar.querySelector('.delete-confirm-no').addEventListener('click', () => {
        confirmBar.remove();
        row.style.background = '';
      });

      // Confirm delete
      confirmBar.querySelector('.delete-confirm-yes').addEventListener('click', async () => {
        try {
          confirmBar.querySelector('.delete-confirm-yes').textContent = 'DELETING...';
          const res = await fetch(API_BASE + '/api/products/' + sku, {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
              'x-admin-password': 'nuraan2026'
            }
          });
          if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || 'Delete failed');
          }
          await fetchProducts();
          showStatus('admin-products-status', `"${name}" (${sku}) deleted successfully!`, 'success');
          // Animate out
          confirmBar.remove();
          row.style.transition = 'opacity 0.4s, transform 0.4s';
          row.style.opacity = '0';
          row.style.transform = 'translateX(20px)';
          setTimeout(() => row.remove(), 400);
        } catch (e) {
          showStatus('admin-products-status', 'Delete failed: ' + e.message, 'error');
          confirmBar.remove();
          row.style.background = '';
        }
      });
    });
  });

  // ---- Auto-fill SKU when category is selected ----
  const catSelect = $('#add-category');
  if (catSelect) {
    catSelect.addEventListener('change', () => {
      const selected = catSelect.options[catSelect.selectedIndex];
      const code = selected?.dataset?.code;
      if (code) {
        // Find next available SKU number
        const existing = state.products.filter(p => p.sku.startsWith(code));
        const maxNum = existing.reduce((max, p) => {
          const num = parseInt(p.sku.split('-').pop());
          return num > max ? num : max;
        }, 0);
        const nextNum = String(maxNum + 1).padStart(4, '0');
        const skuInput = $('#add-sku');
        if (skuInput && !skuInput.value) {
          skuInput.value = `${code}-${nextNum}`;
        }
      }
    });
  }

  // ---- Preview Product ----
  const previewBtn = $('#admin-preview-product-btn');
  if (previewBtn) {
    previewBtn.addEventListener('click', () => {
      const productData = gatherAddProductData();
      const previewDiv = $('#add-product-preview');
      const previewContent = $('#add-preview-content');
      if (!productData.sku || !productData.name || !productData.category) {
        showStatus('admin-add-status', 'Please fill SKU, Name, and Category to preview.', 'error');
        return;
      }
      previewDiv.style.display = 'block';
      previewContent.innerHTML = `
        <div class="admin-preview-card">
          <div class="admin-preview-row"><strong>SKU:</strong> ${productData.sku}</div>
          <div class="admin-preview-row"><strong>Name:</strong> ${productData.name}</div>
          <div class="admin-preview-row"><strong>Category:</strong> ${productData.category}</div>
          ${productData.subType ? `<div class="admin-preview-row"><strong>Sub Type:</strong> ${productData.subType}</div>` : ''}
          <div class="admin-preview-row"><strong>Weight:</strong> ${productData.weight}g</div>
          <div class="admin-preview-row"><strong>Stones:</strong> ${productData.stones.length ? productData.stones.join(', ') : 'None'}</div>
          <div class="admin-preview-row"><strong>Rhodium:</strong> ${productData.rhodiumOption ? 'Yes' : 'No'}</div>
          <div class="admin-preview-row"><strong>Engravable:</strong> ${productData.engravable ? 'Yes' : 'No'}</div>
          <div class="admin-preview-row"><strong>Sizes:</strong> ${productData.sizes.length ? productData.sizes.join(', ') : 'None'}</div>
          ${productData.topWidths.length ? `<div class="admin-preview-row"><strong>Top Widths:</strong> ${productData.topWidths.join(', ')}</div>` : ''}
          <div class="admin-preview-row full-width"><strong>Images:</strong> ${productData.images.length ? productData.images.length + ' uploaded' : 'None'}</div>
          ${productData.images.length ? `<div class="admin-preview-row full-width"><div class="admin-preview-thumbs">${productData.images.map(img => `<img src="/assets/products/${img}" alt="" class="admin-preview-thumb">`).join('')}</div></div>` : ''}
          <div class="admin-preview-row"><strong>Featured:</strong> ${productData.featured ? 'Yes' : 'No'}</div>
          ${productData.description ? `<div class="admin-preview-row"><strong>Description:</strong> ${productData.description}</div>` : ''}
        </div>
      `;
    });
  }

  // ---- Image Upload ----
  initImageUpload();

  // ---- Add Product ----
  const addBtn = $('#admin-add-product-btn');
  if (addBtn) {
    addBtn.addEventListener('click', async () => {
      const productData = gatherAddProductData();

      // Validate required fields
      if (!productData.sku) { showStatus('admin-add-status', 'SKU is required.', 'error'); return; }
      if (!productData.name) { showStatus('admin-add-status', 'Product name is required.', 'error'); return; }
      if (!productData.category) { showStatus('admin-add-status', 'Category is required.', 'error'); return; }
      if (!productData.weight || productData.weight <= 0) { showStatus('admin-add-status', 'Weight must be greater than 0.', 'error'); return; }

      try {
        addBtn.querySelector('span').textContent = 'Adding...';
        addBtn.disabled = true;

        // Step 1: Upload pending images first
        if (pendingUploadFiles.length > 0) {
          showStatus('admin-add-status', 'Uploading images...', 'success');
          const formData = new FormData();
          formData.append('password', 'nuraan2026');
          pendingUploadFiles.forEach(f => formData.append('images', f));

          const uploadRes = await fetch(API_BASE + '/api/upload', {
            method: 'POST',
            body: formData
          });
          if (!uploadRes.ok) {
            const err = await uploadRes.json();
            throw new Error(err.error || 'Image upload failed');
          }
          const uploadData = await uploadRes.json();
          uploadedImageFilenames.push(...uploadData.filenames);
        }

        // Step 2: Create the product with the uploaded filenames
        productData.images = [...uploadedImageFilenames];

        const res = await fetch(API_BASE + '/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password: 'nuraan2026', ...productData })
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Failed to add product');
        }

        await fetchProducts();
        showStatus('admin-add-status', `"${productData.name}" (${productData.sku}) added successfully!`, 'success');

        // Clear form
        clearAddProductForm();

        // Refresh admin page after a short delay
        setTimeout(() => renderAdminPage(container), 1500);
      } catch (e) {
        showStatus('admin-add-status', e.message, 'error');
      } finally {
        addBtn.querySelector('span').textContent = 'Add Product';
        addBtn.disabled = false;
      }
    });
  }
}

// --- Image Upload State ---
let pendingUploadFiles = [];       // File objects waiting to be uploaded
let uploadedImageFilenames = [];   // Filenames already on server

function gatherAddProductData() {
  const stones = [];
  $$('.add-stone-check').forEach(cb => { if (cb.checked) stones.push(cb.value); });

  const sizesRaw = ($('#add-sizes')?.value || '').trim();
  const sizes = sizesRaw ? sizesRaw.split(',').map(s => s.trim()).filter(Boolean) : [];

  const topWidthsRaw = ($('#add-topwidths')?.value || '').trim();
  const topWidths = topWidthsRaw ? topWidthsRaw.split(',').map(s => s.trim()).filter(Boolean) : [];

  return {
    sku: ($('#add-sku')?.value || '').trim().toUpperCase(),
    name: ($('#add-name')?.value || '').trim(),
    category: ($('#add-category')?.value || ''),
    subType: ($('#add-subtype')?.value || '').trim(),
    weight: parseFloat($('#add-weight')?.value || 0),
    description: ($('#add-description')?.value || '').trim(),
    stones,
    rhodiumOption: $('#add-rhodium')?.checked ?? true,
    engravable: $('#add-engravable')?.checked ?? true,
    sizes,
    topWidths,
    images: [...uploadedImageFilenames],
    featured: $('#add-featured')?.value === 'true',
  };
}

function clearAddProductForm() {
  const fields = ['#add-sku', '#add-name', '#add-subtype', '#add-weight', '#add-description', '#add-sizes', '#add-topwidths'];
  fields.forEach(sel => { const el = $(sel); if (el) el.value = ''; });
  const catSel = $('#add-category');
  if (catSel) catSel.selectedIndex = 0;
  const featSel = $('#add-featured');
  if (featSel) featSel.selectedIndex = 0;
  $$('.add-stone-check').forEach(cb => cb.checked = false);
  const rhodium = $('#add-rhodium');
  if (rhodium) rhodium.checked = true;
  const engravable = $('#add-engravable');
  if (engravable) engravable.checked = true;
  const preview = $('#add-product-preview');
  if (preview) preview.style.display = 'none';
  // Reset image uploads
  pendingUploadFiles = [];
  uploadedImageFilenames = [];
  const uploadPreviews = $('#upload-previews');
  if (uploadPreviews) uploadPreviews.innerHTML = '';
  const uploadInput = $('#upload-input');
  if (uploadInput) uploadInput.value = '';
}

// --- Image Upload Logic ---
function initImageUpload() {
  const zone = $('#upload-zone');
  const input = $('#upload-input');
  const previewsContainer = $('#upload-previews');
  if (!zone || !input) return;

  // Click to browse
  zone.addEventListener('click', (e) => {
    if (e.target === input) return;
    input.click();
  });

  // File selected via browse
  input.addEventListener('change', () => {
    if (input.files.length > 0) {
      handleFiles([...input.files]);
    }
  });

  // Drag & drop
  zone.addEventListener('dragover', (e) => {
    e.preventDefault();
    zone.classList.add('drag-over');
  });
  zone.addEventListener('dragleave', (e) => {
    e.preventDefault();
    zone.classList.remove('drag-over');
  });
  zone.addEventListener('drop', (e) => {
    e.preventDefault();
    zone.classList.remove('drag-over');
    const files = [...e.dataTransfer.files].filter(f => f.type.startsWith('image/'));
    if (files.length > 0) handleFiles(files);
  });

  function handleFiles(files) {
    files.forEach(file => {
      // Check size
      if (file.size > 10 * 1024 * 1024) {
        showStatus('upload-status', `"${file.name}" exceeds 10MB limit.`, 'error');
        return;
      }
      // Prevent duplicates
      if (pendingUploadFiles.some(f => f.name === file.name && f.size === file.size)) return;

      pendingUploadFiles.push(file);
      addImagePreview(file, pendingUploadFiles.length - 1);
    });
    updateUploadZoneLabel();
  }

  function addImagePreview(file, idx) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const div = document.createElement('div');
      div.className = 'upload-preview-item';
      div.dataset.idx = idx;
      div.innerHTML = `
        <img src="${e.target.result}" alt="${file.name}" class="upload-preview-img">
        <div class="upload-preview-info">
          <span class="upload-preview-name">${file.name}</span>
          <span class="upload-preview-size">${(file.size / 1024).toFixed(0)} KB</span>
        </div>
        <button class="upload-preview-remove" data-idx="${idx}" title="Remove">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      `;
      div.querySelector('.upload-preview-remove').addEventListener('click', (ev) => {
        ev.stopPropagation();
        removeImage(idx);
      });
      previewsContainer.appendChild(div);
    };
    reader.readAsDataURL(file);
  }

  function removeImage(idx) {
    pendingUploadFiles[idx] = null; // Mark as removed
    const el = previewsContainer.querySelector(`[data-idx="${idx}"]`);
    if (el) {
      el.style.transition = 'opacity 0.3s, transform 0.3s';
      el.style.opacity = '0';
      el.style.transform = 'scale(0.8)';
      setTimeout(() => el.remove(), 300);
    }
    // Clean nulls
    pendingUploadFiles = pendingUploadFiles.filter(Boolean);
    // Re-index remaining previews
    setTimeout(() => {
      previewsContainer.querySelectorAll('.upload-preview-item').forEach((item, i) => {
        item.dataset.idx = i;
        item.querySelector('.upload-preview-remove').dataset.idx = i;
      });
    }, 350);
    updateUploadZoneLabel();
  }

  function updateUploadZoneLabel() {
    const content = $('#upload-zone-content');
    const count = pendingUploadFiles.filter(Boolean).length + uploadedImageFilenames.length;
    if (count > 0) {
      content.querySelector('.upload-zone-title').textContent = `${count} image${count > 1 ? 's' : ''} selected`;
      content.querySelector('.upload-zone-subtitle').textContent = 'Click or drag to add more';
    } else {
      content.querySelector('.upload-zone-title').textContent = 'Drag & drop images here';
      content.querySelector('.upload-zone-subtitle').textContent = 'or click to browse • JPG, PNG, WebP • Max 10MB each';
    }
  }
}

function showStatus(id, message, type) {
  const el = document.getElementById(id);
  if (el) {
    el.className = 'admin-status ' + type;
    el.textContent = message;
    setTimeout(() => { el.textContent = ''; el.className = ''; }, 3000);
  }
}

// ============ SCROLL ANIMATIONS ============
function observeFadeIns() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, { threshold: 0.1 });

  $$('.fade-in').forEach(el => observer.observe(el));
}

// ============ HEADER SCROLL ============
function initHeaderScroll() {
  const header  = $('#site-header');
  const backTop = document.getElementById('back-to-top');
  window.addEventListener('scroll', () => {
    const curr = window.scrollY;
    // Header glass effect
    if (curr > 50) header.classList.add('scrolled');
    else           header.classList.remove('scrolled');
    // Back-to-top visibility
    if (backTop) {
      if (curr > 350) backTop.classList.add('visible');
      else            backTop.classList.remove('visible');
    }
  }, { passive: true });
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ============ THEME TOGGLE ============
function initTheme() {
  document.documentElement.setAttribute('data-theme', state.theme);
}

function toggleTheme() {
  state.theme = state.theme === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', state.theme);
  localStorage.setItem('nuraan_theme', state.theme);
}

// ============ SIGN IN MODAL ============
let signinMode = 'signin'; // 'signin' | 'register'
let signinTab = 'email';   // 'email' | 'phone'

function openSignIn() {
  $('#signin-modal').classList.add('active');
  $('#signin-overlay').classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeSignIn() {
  $('#signin-modal').classList.remove('active');
  $('#signin-overlay').classList.remove('active');
  document.body.style.overflow = '';
}

function switchSigninTab(tab) {
  signinTab = tab;
  const emailWrap = $('#signin-email-wrap');
  const phoneWrap = $('#signin-phone-wrap');
  const tabEmail = $('#tab-email');
  const tabPhone = $('#tab-phone');
  if (tab === 'email') {
    emailWrap.style.display = 'flex';
    phoneWrap.style.display = 'none';
    tabEmail.classList.add('active');
    tabPhone.classList.remove('active');
  } else {
    emailWrap.style.display = 'none';
    phoneWrap.style.display = 'flex';
    tabPhone.classList.add('active');
    tabEmail.classList.remove('active');
  }
}

function switchSigninMode() {
  signinMode = signinMode === 'signin' ? 'register' : 'signin';
  const title = $('#signin-title');
  const subtitle = $('#signin-subtitle');
  const btnText = $('#signin-btn-text');
  const switchText = $('#signin-switch-text');
  const forgotWrap = $('#signin-forgot-wrap');
  if (signinMode === 'register') {
    title.textContent = 'Create Account';
    subtitle.textContent = 'Join the NURAAN family today';
    btnText.textContent = 'Create Account';
    forgotWrap.style.display = 'none';
    switchText.innerHTML = 'Already have an account? <a href="#" onclick="window.nuraan.switchSigninMode(); return false;">Sign In</a>';
  } else {
    title.textContent = 'Welcome Back';
    subtitle.textContent = 'Sign in to your NURAAN account';
    btnText.textContent = 'Sign In';
    forgotWrap.style.display = 'block';
    switchText.innerHTML = "Don't have an account? <a href=\"#\" onclick=\"window.nuraan.switchSigninMode(); return false;\">Create Account</a>";
  }
}

function togglePassword() {
  const input = $('#signin-password');
  input.type = input.type === 'password' ? 'text' : 'password';
}

function handleSignin() {
  const btn = $('#signin-submit-btn');
  btn.disabled = true;
  btn.querySelector('span').textContent = signinMode === 'signin' ? 'Signing In...' : 'Creating Account...';
  setTimeout(() => {
    btn.disabled = false;
    btn.querySelector('span').textContent = signinMode === 'signin' ? 'Sign In' : 'Create Account';
    // Show success toast
    const toast = document.createElement('div');
    toast.style.cssText = 'position:fixed;bottom:32px;left:50%;transform:translateX(-50%);background:var(--color-gold);color:#000;padding:14px 32px;font-size:13px;letter-spacing:2px;font-weight:600;z-index:9999;border-radius:2px;box-shadow:0 8px 30px rgba(0,0,0,0.4);';
    toast.textContent = signinMode === 'signin' ? 'SIGNED IN SUCCESSFULLY' : 'ACCOUNT CREATED!';
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
    closeSignIn();
  }, 1400);
}

// ============ SCROLL TO SECTION ============
function scrollToSection(id) {
  if (state.currentRoute !== '/' && state.currentRoute !== '') {
    navigate('/');
    setTimeout(() => {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 400);
  } else {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

// ============ ABOUT US MODAL ============
function initAboutModal() {
  const overlay = document.createElement('div');
  overlay.id = 'about-modal-overlay';
  overlay.className = 'about-modal-overlay';
  overlay.addEventListener('click', closeAboutModal);

  const modal = document.createElement('div');
  modal.id = 'about-modal';
  modal.className = 'about-modal';
  modal.innerHTML = `
    <div class="about-modal-glow"></div>
    <button class="about-modal-x" onclick="window.nuraan.closeAboutModal()" aria-label="Close">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
      </svg>
    </button>

    <div class="about-modal-header">
      <div class="about-modal-icon">
        <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          <polyline points="9 12 11 14 15 10" stroke-width="1.2"/>
        </svg>
      </div>
      <h2 class="about-modal-title">NURAAN<span>®</span></h2>
      <p class="about-modal-tagline">— A Philosophy, Not Just a Brand —</p>
    </div>

    <div class="about-modal-divider"></div>

    <div class="about-modal-badges">
      <div class="about-modal-badge">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
        <span class="about-badge-title">22K Silver</span>
        <span class="about-badge-sub">Excellence</span>
      </div>
      <div class="about-modal-badge">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
        <span class="about-badge-title">Made To Order</span>
        <span class="about-badge-sub">Crafted For You</span>
      </div>
      <div class="about-modal-badge">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
        <span class="about-badge-title">Free Delivery</span>
        <span class="about-badge-sub">Nationwide</span>
      </div>
      <div class="about-modal-badge">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
        <span class="about-badge-title">Lifetime Plating</span>
        <span class="about-badge-sub">Service Included</span>
      </div>
    </div>

    <div class="about-modal-divider"></div>

    <p class="about-modal-story">
      NURAAN was born from a belief that every piece of jewellery should echo the deep, multifaceted dimensions of its wearer. We don't mass-produce — every ring, chain, and bracelet is crafted to order, in 925 sterling silver, with meticulous attention to weight, finish, and feel. Because perfection can't be rushed.
    </p>

    <div class="about-modal-policy">
      <h3 class="about-policy-title">Our Precision Policy</h3>
      <ul>
        <li>Every piece is individually weighed and quality-checked before dispatch.</li>
        <li>Custom sizing and engraving available on all eligible pieces.</li>
        <li>30-day exchange guarantee — because your satisfaction is our legacy.</li>
      </ul>
    </div>

    <div class="about-modal-footer">
      <button class="btn about-modal-close-btn" onclick="window.nuraan.closeAboutModal()">
        <span>Close</span>
      </button>
    </div>
  `;

  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  // ESC key to close
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeAboutModal();
  });
}

function openAboutModal() {
  const overlay = $('#about-modal-overlay');
  if (!overlay) return;
  overlay.classList.add('active');
  $('#about-modal').classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeAboutModal() {
  const overlay = $('#about-modal-overlay');
  if (!overlay) return;
  overlay.classList.remove('active');
  $('#about-modal').classList.remove('active');
  document.body.style.overflow = '';
}

// ============ CUSTOM RING MODAL ============
function initCustomRingModal() {
  const overlay = document.createElement('div');
  overlay.id = 'custom-ring-overlay';
  overlay.className = 'about-modal-overlay';
  overlay.addEventListener('click', closeCustomRingModal);

  const modal = document.createElement('div');
  modal.id = 'custom-ring-modal';
  modal.className = 'about-modal custom-ring-modal';
  modal.innerHTML = `
    <div class="about-modal-glow"></div>
    <button class="about-modal-x" onclick="window.nuraan.closeCustomRingModal()" aria-label="Close">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
      </svg>
    </button>
    <div class="about-modal-header">
      <div class="about-modal-icon">
        <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
          <circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="3"/>
          <path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>
        </svg>
      </div>
      <h2 class="about-modal-title">Custom <span>Ring</span></h2>
      <p class="about-modal-tagline">\u2014 Order Your Own Legacy \u2014</p>
    </div>
    <div class="about-modal-divider"></div>
    <div class="cr-steps">
      <div class="cr-step">
        <div class="cr-step-num">01</div>
        <div class="cr-step-body">
          <h3 class="cr-step-title">Share Your Concept</h3>
          <p class="cr-step-desc">Upload your inspiration sketch, reference image, or simply describe your vision. Our team will review and understand your unique requirement.</p>
        </div>
      </div>
      <div class="cr-step">
        <div class="cr-step-num">02</div>
        <div class="cr-step-body">
          <h3 class="cr-step-title">Choose Your Details</h3>
          <p class="cr-step-desc">Select 925 sterling silver purity, gemstone options (Moissanite, Zircon, Natural Stones), engraving text, and surface finish preferences.</p>
        </div>
      </div>
      <div class="cr-step">
        <div class="cr-step-num">03</div>
        <div class="cr-step-body">
          <h3 class="cr-step-title">Expert Craftsmanship</h3>
          <p class="cr-step-desc">Our master artisans handcraft your vision with meticulous attention to weight, symmetry, and finish \u2014 piece by piece, never mass-produced.</p>
        </div>
      </div>
      <div class="cr-step">
        <div class="cr-step-num">04</div>
        <div class="cr-step-body">
          <h3 class="cr-step-title">Get a Quote</h3>
          <p class="cr-step-desc">Final pricing is based on silver weight, gemstone selection, and complexity. Receive a full breakdown before any commitment is required.</p>
        </div>
      </div>
    </div>
    <div class="about-modal-divider"></div>
    <div class="about-modal-footer" style="flex-direction:column;gap:12px;">
      <a href="https://wa.me/923001234567?text=Hi%20NURAAN!%20I%27d%20like%20to%20order%20a%20custom%20silver%20ring." target="_blank" class="btn btn-whatsapp" style="display:inline-flex;align-items:center;gap:10px;min-width:260px;justify-content:center;text-decoration:none;">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
        <span>Get Custom Quote on WhatsApp</span>
      </a>
      <button class="btn about-modal-close-btn" onclick="window.nuraan.closeCustomRingModal()"><span>Close</span></button>
    </div>
  `;

  overlay.appendChild(modal);
  document.body.appendChild(overlay);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeCustomRingModal(); });
}

function openCustomRingModal() {
  const overlay = $('#custom-ring-overlay');
  if (!overlay) return;
  overlay.classList.add('active');
  $('#custom-ring-modal').classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeCustomRingModal() {
  const overlay = $('#custom-ring-overlay');
  if (!overlay) return;
  overlay.classList.remove('active');
  $('#custom-ring-modal').classList.remove('active');
  document.body.style.overflow = '';
}

// ============ INIT ============


async function init() {
  // Apply saved theme immediately
  initTheme();

  // Load data
  await Promise.all([fetchConfig(), fetchProducts()]);

  // Build nav
  buildNav();

  // Cart
  updateCartCount();

  // Event listeners
  $('#mobile-menu-btn').addEventListener('click', openMobileMenu);
  $('#mobile-menu-close').addEventListener('click', closeMobileMenu);
  $('#mobile-menu-overlay').addEventListener('click', closeMobileMenu);
  $('#search-btn').addEventListener('click', openSearch);
  $('#search-close').addEventListener('click', closeSearch);
  $('#search-input').addEventListener('input', e => performSearch(e.target.value));
  $('#cart-btn').addEventListener('click', openCartDrawer);
  $('#cart-close').addEventListener('click', closeCartDrawer);
  $('#cart-overlay').addEventListener('click', closeCartDrawer);

  // Theme toggle
  $('#theme-toggle').addEventListener('click', toggleTheme);

  // Account -> Sign In Modal
  $('#account-btn').addEventListener('click', e => {
    e.preventDefault();
    openSignIn();
  });
  $('#signin-close').addEventListener('click', closeSignIn);
  $('#signin-overlay').addEventListener('click', closeSignIn);

  // Logo -> Home
  $('#header-logo').addEventListener('click', e => {
    e.preventDefault();
    navigate('/');
  });

  // Custom ring modal
  initCustomRingModal();

  // About modal
  initAboutModal();

  // Header scroll
  initHeaderScroll();

  // Handle initial route
  handleRoute();

  // Browser back/forward
  window.addEventListener('popstate', handleRoute);
}

// Expose globals for onclick handlers
window.nuraan = { navigate, removeFromCart, closeSearch, switchSigninTab, switchSigninMode, togglePassword, handleSignin, openAboutModal, closeAboutModal, scrollToSection, openCustomRingModal, closeCustomRingModal, checkoutViaWhatsApp, closeFeatureSheet, openFeatureSheet, scrollToTop };

// Start
init();
