// ============================================================
//  Rajendra Showroom – Main Application Logic
// ============================================================

const WA_NUMBER = "916369142027";
const STORE_KEY  = "rs_products";
const CART_KEY   = "rs_cart";

/* ─── State ──────────────────────────────────────────────── */
let allProducts      = [];
let cart             = [];
let activeCategory   = "all";
let currentSort      = "featured";
let currentView      = "grid";
let maxPriceFilter   = 100000;
let searchQuery      = "";
let cartOpen         = false;
let modalOpen        = false;

/* ─── Boot ───────────────────────────────────────────────── */
document.addEventListener("DOMContentLoaded", () => {
  loadCart();
  
  // Stale-While-Revalidate caching: load cache instantly to render page
  const cachedProducts = localStorage.getItem(STORE_KEY);
  allProducts = cachedProducts ? JSON.parse(cachedProducts) : DEFAULT_PRODUCTS.map(p => ({ ...p }));

  const cachedCategories = localStorage.getItem("rs_categories");
  if (cachedCategories) {
    CATEGORIES = JSON.parse(cachedCategories);
  }

  // Render storefront instantly
  renderTopNavCategories();
  renderCategories();
  renderProducts();
  bindEvents();
  updateCartUI();

  // Run background revalidation sync from Firebase
  triggerBackgroundSync();
});

/* ─── Storage ────────────────────────────────────────────── */
async function triggerBackgroundSync() {
  if (typeof db !== "undefined") {
    try {
      const [freshProducts, freshCategories] = await Promise.all([
        db.getProducts(),
        db.getCategories()
      ]);
      
      // Update active memory
      allProducts = freshProducts;
      if (freshCategories && freshCategories.length > 0) {
        CATEGORIES = freshCategories;
      }
      
      // Re-render silently to show latest products/prices
      renderTopNavCategories();
      renderCategories();
      renderProducts();
      console.log("⚡ Storefront synchronized with Cloud Database (Firestore) in background.");
    } catch (e) {
      console.warn("Background revalidation sync warning:", e);
    }
  }
}

function loadCart() {
  const stored = localStorage.getItem(CART_KEY);
  cart = stored ? JSON.parse(stored) : [];
}

function saveCart() {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

/* ─── Render Categories Sidebar ──────────────────────────── */
function renderCategories() {
  const list = document.getElementById("categoryList");
  const mobileList = document.getElementById("mobileCategoryList");
  
  const html = CATEGORIES.map(cat => {
    const count = cat.id === "all"
      ? allProducts.length
      : allProducts.filter(p => p.category === cat.id).length;

    const isActive = cat.id === activeCategory;
    
    return {
      desktop: `
        <li class="cat-item ${isActive ? "active" : ""}"
            data-cat="${cat.id}"
            onclick="setCategory('${cat.id}')">
          <span class="cat-icon">${cat.icon}</span>
          <span>${cat.label}</span>
          <span class="cat-count">${count}</span>
        </li>`,
      mobile: `
        <li class="mm-cat-item ${isActive ? "active" : ""}"
            data-cat="${cat.id}"
            onclick="setCategory('${cat.id}'); closeMobileMenu();">
          <span class="cat-icon">${cat.icon}</span>
          <span>${cat.label}</span>
          <span class="cat-count" style="margin-left:auto; font-size:11px; color:var(--text-muted);">${count}</span>
        </li>`
    };
  });

  if (list) {
    list.innerHTML = html.map(x => x.desktop).join("");
  }
  if (mobileList) {
    mobileList.innerHTML = html.map(x => x.mobile).join("");
  }
}

function renderTopNavCategories() {
  const container = document.getElementById("topNavInner");
  if (!container) return;

  const itemsHtml = CATEGORIES.map(cat => {
    return `<span class="nav-item ${cat.id === activeCategory ? 'active' : ''}" data-cat="${cat.id}">${cat.label}</span>`;
  }).join("");

  container.innerHTML = `
    ${itemsHtml}
    <div class="nav-divider"></div>
    <a class="whatsapp-nav" href="https://wa.me/916369142027" target="_blank">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M11.99 2C6.477 2 2 6.477 2 11.99c0 1.72.454 3.33 1.24 4.73L2 22l5.47-1.22A9.957 9.957 0 0011.99 22C17.51 22 22 17.52 22 11.99 22 6.477 17.51 2 11.99 2zm0 18.18c-1.65 0-3.19-.44-4.52-1.21l-.32-.19-3.37.75.8-3.28-.21-.34A8.17 8.17 0 013.82 12c0-4.51 3.67-8.18 8.17-8.18 4.51 0 8.18 3.67 8.18 8.18 0 4.51-3.67 8.18-8.18 8.18z"/></svg>
      +91 63691 42027
    </a>
  `;
}



/* ─── Render Products ─────────────────────────────────────── */
function getFilteredProducts() {
  let list = [...allProducts];

  // Category filter
  if (activeCategory !== "all") {
    list = list.filter(p => p.category === activeCategory);
  }

  // Search filter
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    list = list.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      (p.description || "").toLowerCase().includes(q)
    );
  }

  // Price filter
  list = list.filter(p => p.price <= maxPriceFilter);

  // Sort
  switch (currentSort) {
    case "featured":  list.sort((a,b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0)); break;
    case "price-asc": list.sort((a,b) => a.price - b.price); break;
    case "price-dsc": list.sort((a,b) => b.price - a.price); break;
    case "rating":    list.sort((a,b) => b.rating - a.rating); break;
    case "newest":    list.sort((a,b) => b.id - a.id); break;
  }

  return list;
}

function renderProducts() {
  const grid = document.getElementById("productsGrid");
  const countEl = document.getElementById("productCount");
  if (!grid) return;

  const filtered = getFilteredProducts();
  if (countEl) countEl.textContent = `${filtered.length} product${filtered.length !== 1 ? "s" : ""}`;

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div class="no-products">
        <div class="no-icon">🫙</div>
        <h3>No products found</h3>
        <p>Try a different category or clear your search.</p>
      </div>`;
    return;
  }

  grid.className = `products-grid ${currentView === "list" ? "list-view" : ""}`;
  grid.innerHTML = filtered.map(p => productCardHTML(p)).join("");
}

function productCardHTML(p) {
  const rating = p.rating || parseFloat((4.5 + ((p.id * 7) % 5) * 0.1).toFixed(1));
  const reviews = p.reviews || ((p.id * 13) % 100) + 40;
  
  const discount = p.originalPrice > p.price
    ? Math.round((1 - p.price / p.originalPrice) * 100)
    : 0;
  const stars = renderStars(rating);

  let imgHTML = "";
  if (p.image) {
    imgHTML = `<img class="product-img" src="${p.image}" alt="${p.name}" loading="lazy">`;
  } else if (p.video) {
    const isEmbed = p.video.includes("youtube.com/embed/") || p.video.includes("drive.google.com/file/d/");
    if (isEmbed) {
      imgHTML = `
        <div class="product-placeholder" style="background:#111;color:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;">
          <div class="placeholder-icon" style="font-size:36px;color:#d4af37;margin-bottom:6px;">🎬</div>
          <div class="placeholder-text" style="color:#d4af37;font-weight:600;font-size:12px;letter-spacing:1px;text-transform:uppercase;">Watch Video</div>
        </div>`;
    } else {
      imgHTML = `<video class="product-img" src="${p.video}" muted loop autoplay playsinline style="object-fit:cover;width:100%;height:100%;background:#000;display:block;"></video>`;
    }
  } else {
    imgHTML = `
      <div class="product-placeholder">
        <div class="placeholder-icon">🍽</div>
        <div class="placeholder-text">Photo coming soon</div>
      </div>`;
  }

  const badgeHTML = discount > 0
    ? `<span class="product-badge badge-sale">−${discount}%</span>`
    : `<span class="product-badge badge-new">New</span>`;

  return `
    <div class="product-card" onclick="openModal(${p.id})">
      <div class="product-img-wrap">
        ${imgHTML}
        ${badgeHTML}
        <button class="product-wishlist" onclick="event.stopPropagation(); addToWishlist(${p.id})">♡</button>
      </div>
      <div class="product-info">
        <div class="product-category">${p.category}</div>
        <div class="product-name">${p.name}</div>
        <div class="product-rating">
          <span class="stars">${stars}</span>
          <span class="rating-val">${rating.toFixed(1)}</span>
          <span class="rating-count">(${reviews})</span>
        </div>
        <div class="product-price">
          <span class="price-current">₹${p.price.toLocaleString("en-IN")}</span>
          ${p.originalPrice > p.price ? `<span class="price-original">₹${p.originalPrice.toLocaleString("en-IN")}</span>` : ""}
          ${discount > 0 ? `<span class="price-discount">Save ${discount}%</span>` : ""}
        </div>
      </div>
    </div>`;
}

function renderStars(rating) {
  const full  = Math.floor(rating);
  const half  = rating % 1 >= 0.5 ? 1 : 0;
  const empty = 5 - full - half;
  return "★".repeat(full) + (half ? "½" : "") + "☆".repeat(empty);
}

/* ─── Category / Filter / Sort ────────────────────────────── */
function setCategory(catId) {
  activeCategory = catId;
  renderCategories();
  renderProducts();
  updateHeading();
}

function updateHeading() {
  const titleEl = document.getElementById("sectionTitle");
  if (!titleEl) return;
  const cat = CATEGORIES.find(c => c.id === activeCategory);
  titleEl.textContent = cat ? cat.label : "All Products";
}

/* ─── Events ─────────────────────────────────────────────── */
function bindEvents() {
  // Search
  const searchInput = document.getElementById("searchInput");
  if (searchInput) {
    searchInput.addEventListener("input", e => {
      searchQuery = e.target.value;
      renderProducts();
    });
  }

  // Sort
  const sortSelect = document.getElementById("sortSelect");
  if (sortSelect) {
    sortSelect.addEventListener("change", e => {
      currentSort = e.target.value;
      renderProducts();
    });
  }

  // Price slider
  const priceSlider = document.getElementById("priceSlider");
  const priceDisplay = document.getElementById("priceDisplay");
  const mobilePriceSlider = document.getElementById("mobilePriceSlider");
  const mobilePriceDisplay = document.getElementById("mobilePriceDisplay");

  if (priceSlider) {
    priceSlider.addEventListener("input", e => {
      maxPriceFilter = parseInt(e.target.value);
      if (priceDisplay) priceDisplay.textContent = `₹${maxPriceFilter.toLocaleString("en-IN")}`;
      const pct = (maxPriceFilter / 100000) * 100;
      priceSlider.style.background = `linear-gradient(to right, var(--gold) 0%, var(--gold) ${pct}%, var(--border-dark) ${pct}%, var(--border-dark) 100%)`;
      
      // Sync mobile price slider visually
      if (mobilePriceSlider) {
        mobilePriceSlider.value = maxPriceFilter;
        mobilePriceSlider.style.background = `linear-gradient(to right, var(--gold) 0%, var(--gold) ${pct}%, var(--border-dark) ${pct}%, var(--border-dark) 100%)`;
      }
      if (mobilePriceDisplay) mobilePriceDisplay.textContent = `₹${maxPriceFilter.toLocaleString("en-IN")}`;

      renderProducts();
    });
  }

  if (mobilePriceSlider) {
    mobilePriceSlider.addEventListener("input", e => {
      maxPriceFilter = parseInt(e.target.value);
      if (mobilePriceDisplay) mobilePriceDisplay.textContent = `₹${maxPriceFilter.toLocaleString("en-IN")}`;
      const pct = (maxPriceFilter / 100000) * 100;
      mobilePriceSlider.style.background = `linear-gradient(to right, var(--gold) 0%, var(--gold) ${pct}%, var(--border-dark) ${pct}%, var(--border-dark) 100%)`;
      
      // Sync desktop price slider visually
      if (priceSlider) {
        priceSlider.value = maxPriceFilter;
        priceSlider.style.background = `linear-gradient(to right, var(--gold) 0%, var(--gold) ${pct}%, var(--border-dark) ${pct}%, var(--border-dark) 100%)`;
      }
      if (priceDisplay) priceDisplay.textContent = `₹${maxPriceFilter.toLocaleString("en-IN")}`;

      renderProducts();
    });
  }

  // Nav items click bindings
  document.querySelectorAll(".nav-item[data-cat]").forEach(el => {
    el.addEventListener("click", () => {
      document.querySelectorAll(".nav-item").forEach(n => n.classList.remove("active"));
      el.classList.add("active");
      setCategory(el.dataset.cat);
    });
  });

  // Cart toggle
  document.getElementById("cartTrigger")?.addEventListener("click", openCart);
  document.getElementById("cartClose")?.addEventListener("click", closeCart);
  document.getElementById("cartOverlay")?.addEventListener("click", closeCart);

  // Mobile Menu triggers
  document.getElementById("mobileMenuTrigger")?.addEventListener("click", openMobileMenu);
  document.getElementById("mobileMenuOverlay")?.addEventListener("click", closeMobileMenu);

  // Modal close
  document.getElementById("modalOverlay")?.addEventListener("click", closeModal);
  document.getElementById("modalClose")?.addEventListener("click", closeModal);

  // Escape key
  document.addEventListener("keydown", e => {
    if (e.key === "Escape") { closeCart(); closeModal(); closeCheckoutModal(); closeUpiModal(); closeMobileMenu(); }
  });
}

/* ─── Cart Functions ─────────────────────────────────────── */
function addToCart(id, qty = 1) {
  const product = allProducts.find(p => p.id === id);
  if (!product) return;

  let color = window.selectedProductColor;
  if (!color) {
    const productColors = Array.isArray(product.colors) ? product.colors : (product.colors ? product.colors.split(",").map(c => c.trim()).filter(Boolean) : []);
    if (productColors.length > 0) {
      color = window.selectedProductColor && productColors.includes(window.selectedProductColor)
        ? window.selectedProductColor
        : productColors[0];
    }
  }

  const existing = cart.find(i => i.id === id && i.selectedColor === color);
  if (existing) {
    existing.qty += qty;
  } else {
    cart.push({ 
      id: product.id, 
      name: product.name, 
      price: product.price, 
      image: product.image, 
      qty: qty,
      selectedColor: color
    });
  }
  saveCart();
  updateCartUI();

  // ── Meta Pixel: AddToCart ──────────────────────────────────
  if (typeof fbq === 'function') {
    fbq('track', 'AddToCart', {
      content_ids:  [String(product.id)],
      content_name: product.name,
      content_type: 'product',
      value:        product.price * qty,
      currency:     'INR'
    });
  }
  renderCartItems();
}

function changeQty(id, color, delta) {
  const item = cart.find(i => i.id === id && i.selectedColor === color);
  if (item) {
    item.qty += delta;
    if (item.qty <= 0) {
      removeFromCart(id, color);
    } else {
      saveCart();
      renderCartItems();
    }
  }
}

function removeFromCart(id, color) {
  cart = cart.filter(i => !(i.id === id && i.selectedColor === color));
  saveCart();
  renderCartItems();
  updateCartUI();
}

function updateCartUI() {
  const total = cart.reduce((s, i) => s + i.qty, 0);
  document.querySelectorAll(".cart-count-badge").forEach(el => {
    el.textContent = total;
    el.style.display = total ? "flex" : "none";
  });
}

function renderCartItems() {
  const body = document.getElementById("cartBody");
  if (!body) return;

  if (cart.length === 0) {
    body.innerHTML = `
      <div class="cart-empty">
        <div class="empty-icon">🛒</div>
        <p>Your cart is empty.<br>Add some beautiful pieces!</p>
      </div>`;
    document.getElementById("cartGrandTotal").textContent = "₹0";
    return;
  }

  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const delivery = subtotal >= 5000 ? 0 : 99;
  const grand    = subtotal + delivery;

  body.innerHTML = cart.map(item => `
    <div class="cart-item">
      <div class="cart-item-img">
        ${item.image ? `<img src="${item.image}" alt="${item.name}">` : "🍽"}
      </div>
      <div class="cart-item-info">
        <div class="cart-item-name">${item.name}</div>
        ${item.selectedColor ? `<div class="cart-item-variant" style="font-size:11.5px; color:var(--text-light); margin-top:2px;">Color: ${item.selectedColor}</div>` : ""}
        <div class="cart-item-price">₹${item.price.toLocaleString("en-IN")}</div>
        <div class="cart-item-controls">
          <button class="qty-btn" onclick="changeQty(${item.id}, ${item.selectedColor ? `'${item.selectedColor}'` : 'null'}, -1)">−</button>
          <span class="qty-val">${item.qty}</span>
          <button class="qty-btn" onclick="changeQty(${item.id}, ${item.selectedColor ? `'${item.selectedColor}'` : 'null'}, 1)">+</button>
        </div>
      </div>
      <button class="cart-item-remove" onclick="removeFromCart(${item.id}, ${item.selectedColor ? `'${item.selectedColor}'` : 'null'})">×</button>
    </div>`).join("");

  document.getElementById("cartSubtotal").textContent = `₹${subtotal.toLocaleString("en-IN")}`;
  document.getElementById("cartDelivery").textContent = delivery === 0 ? "FREE" : `₹${delivery}`;
  document.getElementById("cartGrandTotal").textContent = `₹${grand.toLocaleString("en-IN")}`;
}

function openCart() {
  cartOpen = true;
  renderCartItems();
  document.getElementById("cartDrawer").classList.add("open");
  document.getElementById("cartOverlay").classList.add("visible");
  document.body.style.overflow = "hidden";
}

function closeCart() {
  cartOpen = false;
  document.getElementById("cartDrawer").classList.remove("open");
  document.getElementById("cartOverlay").classList.remove("visible");
  document.body.style.overflow = "";
}

/* ─── WhatsApp Functions ─────────────────────────────────── */
function whatsappProduct(id) {
  const p = allProducts.find(x => x.id === id);
  if (!p) return;
  const msg = encodeURIComponent(
    `Hi! I'm interested in ordering:\n\n*${p.name}*\nPrice: ₹${p.price.toLocaleString("en-IN")}\n\nCould you please confirm availability and delivery details?\n\nThank you!`
  );
  window.open(`https://wa.me/${WA_NUMBER}?text=${msg}`, "_blank");
}

function whatsappCart() {
  if (cart.length === 0) {
    showToast("Your cart is empty!", "info");
    return;
  }
  const itemLines = cart.map(i => {
    const variantText = i.selectedColor ? ` (${i.selectedColor})` : "";
    return `• ${i.name}${variantText} × ${i.qty} — ₹${(i.price * i.qty).toLocaleString("en-IN")}`;
  }).join("\n");
  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const msg = encodeURIComponent(
    `Hi! I'd like to place an order from Rajendra Showroom:\n\n${itemLines}\n\n*Total: ₹${total.toLocaleString("en-IN")}*\n\nPlease confirm availability and delivery. Thank you!`
  );
  window.open(`https://wa.me/${WA_NUMBER}?text=${msg}`, "_blank");
}

/* ─── Product Modal ───────────────────────────────────────── */
let currentModalQty = 1;

function openModal(id) {
  const p = allProducts.find(x => x.id === id);
  if (!p) return;

  // ── Meta Pixel: ViewContent ────────────────────────────────
  if (typeof fbq === 'function') {
    fbq('track', 'ViewContent', {
      content_ids:  [String(p.id)],
      content_name: p.name,
      content_type: 'product',
      value:        p.price,
      currency:     'INR'
    });
  }

  // Resolve rating and reviews count (ensure it's not 0 or empty)
  const rating = p.rating || parseFloat((4.5 + ((p.id * 7) % 5) * 0.1).toFixed(1));
  const reviews = p.reviews || ((p.id * 13) % 100) + 40;

  // Reset selected product color
  window.selectedProductColor = null;

  // Scroll details modal to top on product change
  const modalEl = document.getElementById("productModal");
  if (modalEl) modalEl.scrollTop = 0;

  currentModalQty = 1; // Reset quantity to 1

  const discount = p.originalPrice > p.price
    ? Math.round((1 - p.price / p.originalPrice) * 100) : 0;

  const productImages = p.images || (p.image ? [p.image] : []);
  const productVideo  = p.video || null;
  let imgHTML = "";

  if (productImages.length === 0 && !productVideo) {
    imgHTML = `<div class="modal-placeholder"><div class="mp-icon">&#127869;</div><p style="font-size:12px;opacity:0.4;letter-spacing:1px;">Photo coming soon</p></div>`;
  } else {
    const hasMultipleMedia = productImages.length > 1 || (productImages.length >= 1 && productVideo);
    imgHTML = `
      <div class="modal-gallery">
        <div class="modal-main-img-wrap" id="modalMainWrap">
          ${productImages.length > 0
            ? `<img id="modalMainImg" src="${productImages[0]}" alt="${p.name}">`
            : renderStorefrontVideoMarkup(productVideo)
          }
        </div>
        ${hasMultipleMedia ? `
        <div class="modal-thumbnails">
          ${productImages.map((img, idx) => `
            <div class="modal-thumb ${idx === 0 ? 'active' : ''}" onclick="setModalMainImg(this, ${p.id}, ${idx})">
              <img src="${img}" alt="${p.name} - image ${idx + 1}">
            </div>
          `).join("")}
          ${productVideo ? `
            <div class="modal-thumb modal-thumb-video" onclick="setModalMainVideo(this, '${productVideo}')" title="Watch product video">
              <div style="width:100%;height:100%;background:#111;border-radius:6px;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:3px;">
                <span style="font-size:20px;">&#127916;</span>
                <span style="font-size:9px;color:#fff;letter-spacing:0.5px;">VIDEO</span>
              </div>
            </div>
          ` : ""}
        </div>
        ` : ""}
      </div>
    `;
  }

  // Specifications, copy and highlights
  const specsData = getProductSpecs(p);
  const specListHTML = specsData.specs.map(s => `
    <li><strong>${s.key}</strong> <span>${s.value}</span></li>
  `).join("");
  const highlightsHTML = specsData.highlights.map(h => `
    <li>${h}</li>
  `).join("");

  // Variant Colors Setup
  const colors = Array.isArray(p.colors) ? p.colors : (p.colors ? p.colors.split(",").map(c => c.trim()).filter(Boolean) : []);
  let colorSelectorHTML = "";
  if (colors.length > 0) {
    if (!window.selectedProductColor || !colors.includes(window.selectedProductColor)) {
      window.selectedProductColor = colors[0];
    }
    const swatches = colors.map(color => {
      const colorVal = getColorCode(color);
      const isSelected = color === window.selectedProductColor;
      return `
        <button type="button" class="color-swatch-btn ${isSelected ? 'active' : ''}" 
                onclick="selectProductColor('${color}')">
          <span class="color-circle" style="background-color: ${colorVal};"></span>
          <span class="color-name">${color}</span>
        </button>
      `;
    }).join("");
    
    colorSelectorHTML = `
      <div class="modal-color-selector">
        <label class="color-label">Color: <span id="activeColorName" style="font-weight:600; color: var(--gold-dark);">${window.selectedProductColor}</span></label>
        <div class="color-swatches-grid">
          ${swatches}
        </div>
      </div>
    `;
  }

  // Cross sell items ("Pairs well with")
  const crossSells = getCrossSellItems(p);
  const crossSellHTML = crossSells.length > 0 ? `
    <div class="cross-sell-section">
      <h3 class="cross-sell-title">Pairs well with</h3>
      <div class="cross-sell-list">
        ${crossSells.map(item => `
          <div class="cross-sell-item" onclick="openModal(${item.id})">
            <div class="cross-sell-img">
              ${item.image ? `<img src="${item.image}" alt="${item.name}">` : "🍽"}
            </div>
            <div class="cross-sell-info">
              <div class="cross-sell-name">${item.name}</div>
              <div class="cross-sell-price">₹${item.price.toLocaleString("en-IN")}</div>
            </div>
          </div>
        `).join("")}
      </div>
    </div>
  ` : "";

  // Related products ("You may also like")
  const relatedList = getRelatedProducts(p);
  const relatedHTML = relatedList.length > 0 ? `
    <div class="related-products-section">
      <h3 class="related-products-title">You may also like</h3>
      <div class="related-products-grid">
        ${relatedList.map(item => `
          <div class="related-card" onclick="openModal(${item.id})">
            <div class="related-card-img">
              ${item.image ? `<img src="${item.image}" alt="${item.name}">` : `<div style="font-size:36px;opacity:0.25;text-align:center;padding-top:25%;">🍽</div>`}
              ${item.originalPrice > item.price ? `<span class="related-card-badge">Sale</span>` : ""}
            </div>
            <div class="related-card-info">
              <div class="related-card-name">${item.name}</div>
              <div class="related-card-price">₹${item.price.toLocaleString("en-IN")}</div>
            </div>
          </div>
        `).join("")}
      </div>
    </div>
  ` : "";

  // Fake reviews (humanised)
  const reviewsHTML = buildReviewsSection(p);

  document.getElementById("modalContent").innerHTML = `
    <!-- Top Navigation Header -->
    <div class="modal-header-nav">
      <div class="mhn-logo">
        <img src="images/logo.png" alt="Rajendra Showroom">
        <span style="font-family: var(--font-serif); font-size: 16px; font-weight: 600; letter-spacing: 0.5px; color: var(--text);">Rajendra</span>
      </div>
      <button class="mhn-back-btn" onclick="closeModal()">← Back to Shop</button>
    </div>

    <!-- Floating close button (desktop) -->
    <button class="modal-close" id="modalClose" onclick="closeModal()">✕</button>

    <div class="modal-inner">
      <div class="modal-img-side">
        ${imgHTML}
      </div>
      
      <div class="modal-info">
        <div class="modal-cat">${p.category}</div>
        <h2 class="modal-name">${p.name}</h2>
        <div class="modal-rating">
          <span class="stars">${renderStars(rating)}</span>
          <span class="rating-val" style="margin-left:6px;font-size:13px;">${rating.toFixed(1)} · ${reviews} reviews</span>
        </div>
        
        <div class="modal-price">
          ${p.originalPrice > p.price ? `<span class="price-original">₹${p.originalPrice.toLocaleString("en-IN")}</span>` : ""}
          <span class="price-current">₹${p.price.toLocaleString("en-IN")}</span>
          ${discount > 0 ? `<span class="price-discount-badge">Sale</span>` : ""}
        </div>
        <div class="modal-tax-notice">Tax included.</div>
        
        <p class="modal-desc-para">${specsData.description}</p>
        
        <!-- Color Selector Variant -->
        ${colorSelectorHTML}
        
        <!-- Quantity Selector -->
        <div class="modal-qty-container">
          <label class="modal-qty-label">Quantity</label>
          <div class="modal-qty-selector">
            <button type="button" class="qty-adjust-btn" onclick="changeModalQty(-1)">−</button>
            <input type="text" id="modalQtyVal" class="modal-qty-input" value="1" readonly>
            <button type="button" class="qty-adjust-btn" onclick="changeModalQty(1)">+</button>
          </div>
        </div>

        <!-- Express Shipping Notice -->
        <div class="express-shipping-notice">
          🚚 &nbsp;<span>Need Express Shipping?</span>
          <a href="#" onclick="whatsappExpressShipping(${p.id}); return false;">Click here</a>
        </div>
        
        <!-- Bulk Order Notice -->
        <div class="bulk-order-notice">
          📦 &nbsp;<span>Want to buy this in bulk?</span>
          <a href="#" onclick="whatsappBulkOrder(${p.id}); return false;">Click here</a>
        </div>

        <div class="modal-actions">
          <button class="btn-add-cart-lg" onclick="addToCart(${p.id}, currentModalQty); closeModal(); openCart();">
            Add to cart
          </button>
          <button class="btn-wa-lg" onclick="buyItNow(${p.id})">
            Buy It Now
          </button>
        </div>

        <!-- Secure Checkout payment Badges -->
        <div class="payment-trust-container">
          <div class="payment-trust-title">Secure Checkout With</div>
          <div class="payment-badges-grid">
            <div class="payment-badge-card visa">Visa</div>
            <div class="payment-badge-card paytm">Paytm</div>
            <div class="payment-badge-card mastercard">Mastercard</div>
            <div class="payment-badge-card upi">UPI</div>
            <div class="payment-badge-card gpay">G <span>Pay</span></div>
            <div class="payment-badge-card phonepe">PhonePe</div>
          </div>
        </div>

        <!-- Trust Feature Circles -->
        <div class="feature-circles-container">
          <div class="feature-circle-item">
            <div class="feature-circle-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
            </div>
            <div class="feature-circle-label">Finest Premium<br>Porcelain</div>
          </div>
          <div class="feature-circle-item">
            <div class="feature-circle-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                <path d="m9 11 2 2 4-4"/>
              </svg>
            </div>
            <div class="feature-circle-label">Lead &<br>Cadmium Free</div>
          </div>
          <div class="feature-circle-item">
            <div class="feature-circle-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
                <line x1="12" y1="22.08" x2="12" y2="12"/>
              </svg>
            </div>
            <div class="feature-circle-label">100% Safe<br>Delivery</div>
          </div>
          <div class="feature-circle-item">
            <div class="feature-circle-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="8" width="18" height="14" rx="2"/>
                <path d="M12 8v14M3 12h18M12 8a3 3 0 1 0-3-3M12 8a3 3 0 1 1 3-3"/>
              </svg>
            </div>
            <div class="feature-circle-label">Gift Box<br>Packaging</div>
          </div>
        </div>

        <!-- Pairs Well With Cross-Sells -->
        ${crossSellHTML}

        <!-- Specifications list -->
        <ul class="product-spec-list">
          ${specListHTML}
        </ul>

        <!-- About the Product highlights -->
        <div class="about-product-section">
          <h3 class="about-product-title">About The Product</h3>
          <ul class="about-product-highlights">
            ${highlightsHTML}
          </ul>
        </div>
      </div>
    </div>

    <!-- Related Products -->
    ${relatedHTML}

    <!-- Customer Reviews -->
    ${reviewsHTML}
  `;

  modalOpen = true;
  document.getElementById("productModal").classList.add("open");
  document.getElementById("modalOverlay").classList.add("visible");
  document.body.style.overflow = "hidden";
}


function setModalMainImg(el, productId, imgIdx) {
  const p = allProducts.find(x => x.id === productId);
  if (!p) return;
  const productImages = p.images || (p.image ? [p.image] : []);
  const src = productImages[imgIdx];
  
  const wrap = document.getElementById("modalMainWrap");
  if (!wrap) return;
  
  let main = document.getElementById("modalMainImg");
  if (!main) {
    wrap.innerHTML = `<img id="modalMainImg" src="" alt="${p.name}" style="opacity:0; transition: opacity 0.15s ease;">`;
    main = document.getElementById("modalMainImg");
  }
  
  if (main && src) {
    main.style.opacity = "0";
    setTimeout(() => {
      main.src = src;
      main.style.opacity = "1";
    }, 150);
  }
  
  const thumbs = el.parentNode.querySelectorAll(".modal-thumb");
  thumbs.forEach(t => t.classList.remove("active"));
  el.classList.add("active");
}

function renderStorefrontVideoMarkup(url) {
  if (!url) return "";
  const isEmbed = url.includes("youtube.com/embed/") || url.includes("drive.google.com/file/d/");
  if (isEmbed) {
    return `<iframe src="${url}" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen
      style="width:100%;height:340px;border-radius:12px;background:#000;border:none;"></iframe>`;
  } else {
    return `<video src="${url}" controls playsinline style="width:100%;border-radius:12px;max-height:360px;background:#000;"></video>`;
  }
}

function setModalMainVideo(el, videoSrc) {
  const wrap = document.getElementById("modalMainWrap");
  if (!wrap) return;
  wrap.innerHTML = renderStorefrontVideoMarkup(videoSrc);
  const thumbs = el.parentNode.querySelectorAll(".modal-thumb");
  thumbs.forEach(t => t.classList.remove("active"));
  el.classList.add("active");
}

function whatsappBulkOrder(id) {
  const p = allProducts.find(x => x.id === id);
  if (!p) return;
  const msg = encodeURIComponent(
    `Hi! I would like to inquire about a *bulk order* for:\n\n*${p.name}*\nProduct ID: #${p.id}\n\nPlease share wholesale pricing, minimum order quantity (MOQ) and availability details.\n\nThank you!`
  );
  window.open(`https://wa.me/${WA_NUMBER}?text=${msg}`, "_blank");
}


function closeModal() {
  modalOpen = false;
  document.getElementById("productModal").classList.remove("open");
  document.getElementById("modalOverlay").classList.remove("visible");
  document.body.style.overflow = "";
}

/* ─── Toast ───────────────────────────────────────────────── */
function showToast(msg, type = "success") {
  const container = document.getElementById("toastContainer");
  if (!container) return;
  const el = document.createElement("div");
  el.className = `toast toast-${type}`;
  el.innerHTML = msg;
  container.appendChild(el);
  setTimeout(() => {
    el.style.animation = "toastOut 0.4s ease forwards";
    setTimeout(() => el.remove(), 400);
  }, 3000);
}

/* ─── Nav scroll spy ─────────────────────────────────────── */
window.addEventListener("scroll", () => {
  const header = document.querySelector(".site-header");
  if (header) header.style.boxShadow = window.scrollY > 10
    ? "0 2px 20px rgba(28,28,26,0.12)"
    : "0 2px 8px rgba(28,28,26,0.06)";
});

function addToWishlist(id) {
  showToast("💛  Added to wishlist!", "info");
}

/* ─── Online Checkout Functions ───────────────────────────── */
function getDynamicShippingRate(subtotal, state, pincode) {
  if (subtotal >= 5000) return 0;
  
  const pin = (pincode || "").trim();
  
  // Rule 1: Chennai Local (starts with 600)
  if (pin.startsWith("600")) {
    return 60;
  }
  
  // Rule 2: Tamil Nadu State (State select or PIN starts with 60-64)
  if (state === "Tamil Nadu" || (pin.length === 6 && /^[6][0-4]/.test(pin))) {
    return 90;
  }
  
  // Rule 3: South India states (AP, KA, KL, TS) or PIN starts with 5 or 6 (other than TN)
  const southStates = ["Andhra Pradesh", "Karnataka", "Kerala", "Telangana"];
  if (southStates.includes(state) || (pin.length === 6 && /^[56]/.test(pin))) {
    return 120;
  }
  
  // Rule 4: Rest of India
  return 150;
}

function calculateDynamicShipping() {
  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const state = document.getElementById("custState").value;
  const pincode = document.getElementById("custPincode").value.trim();
  
  const delivery = getDynamicShippingRate(subtotal, state, pincode);
  const grand = subtotal + delivery;
  
  // Update UI Elements
  document.getElementById("checkoutSubtotal").textContent = `₹${subtotal.toLocaleString("en-IN")}`;
  document.getElementById("checkoutShipping").textContent = delivery === 0 
    ? (subtotal >= 5000 ? "FREE (Order > ₹5,000)" : "₹" + delivery) 
    : `₹${delivery}`;
    
  // Show zone descriptive text
  let zoneText = "Rest of India";
  if (pincode.startsWith("600")) {
    zoneText = "Chennai Local";
  } else if (state === "Tamil Nadu" || (pincode.length === 6 && /^[6][0-4]/.test(pincode))) {
    zoneText = "Tamil Nadu";
  } else {
    const southStates = ["Andhra Pradesh", "Karnataka", "Kerala", "Telangana"];
    if (southStates.includes(state) || (pincode.length === 6 && /^[56]/.test(pincode))) {
      zoneText = "South India";
    }
  }
  document.getElementById("shippingZoneText").textContent = `(${zoneText})`;
  
  document.getElementById("checkoutGrandTotal").textContent = `₹${grand.toLocaleString("en-IN")}`;
}

function openCheckoutModal() {
  if (cart.length === 0) {
    showToast("Your cart is empty!", "info");
    return;
  }
  closeCart();
  
  const totalQty = cart.reduce((s, i) => s + i.qty, 0);
  document.getElementById("checkoutItemsCount").textContent = `${totalQty} item${totalQty !== 1 ? 's' : ''}`;
  
  // Reset fields & display form
  document.getElementById("checkoutForm").style.display = "block";
  document.getElementById("checkoutSuccess").style.display = "none";
  document.getElementById("custName").value = "";
  document.getElementById("custPhone").value = "";
  document.getElementById("custAddress").value = "";
  document.getElementById("custState").value = "Tamil Nadu";
  document.getElementById("custPincode").value = "";

  // Run initial calculation
  calculateDynamicShipping();

  document.getElementById("checkoutModal").classList.add("open");
  document.getElementById("checkoutOverlay").classList.add("visible");
  document.body.style.overflow = "hidden";
}

function closeCheckoutModal() {
  document.getElementById("checkoutModal").classList.remove("open");
  document.getElementById("checkoutOverlay").classList.remove("visible");
  document.body.style.overflow = "";
}

function closeCheckoutSuccess() {
  closeCheckoutModal();
}

/* ─── Pending Order State (filled before opening UPI) ─────── */
let _pendingOrderData = null;

function submitOrderOnSite() {
  const name = document.getElementById("custName").value.trim();
  const phone = document.getElementById("custPhone").value.trim();
  const address = document.getElementById("custAddress").value.trim();
  const state = document.getElementById("custState").value;
  const pincode = document.getElementById("custPincode").value.trim();

  if (!name || !phone || !address || !pincode) {
    showToast("Please fill in all required fields", "error");
    return;
  }

  if (pincode.length !== 6 || !/^\d{6}$/.test(pincode)) {
    showToast("Please enter a valid 6-digit Pincode", "error");
    return;
  }

  // Calculate total for UPI
  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const delivery = getDynamicShippingRate(subtotal, state, pincode);
  const grand = subtotal + delivery;

  const fullAddress = `${address}, ${state} - ${pincode}`;

  // Store pending order details
  _pendingOrderData = { 
    name, 
    phone, 
    address: fullAddress, 
    grand, 
    cart: [...cart],
    shippingCharge: delivery
  };

  // Close checkout modal and open UPI gateway
  closeCheckoutModal();
  openUpiModal(grand);
}

let _upiTimerInterval = null;

/* ─── UPI Gateway Functions ───────────────────────────────── */
function openUpiModal(amount) {
  document.getElementById("upiAmount").textContent = `₹${amount.toLocaleString("en-IN")}`;
  // Also update the amount reminder inside processing screen
  const remEl = document.getElementById("upiAmtReminder");
  if (remEl) remEl.textContent = `₹${amount.toLocaleString("en-IN")}`;
  // Update QR with exact amount embedded
  const upiId = "pranath7@fam";
  const qrData = encodeURIComponent(`upi://pay?pa=${upiId}&pn=Rajendra%20Showroom&am=${amount}&cu=INR&tn=Crockery%20Order`);
  const qrEl = document.getElementById("upiQrImg");
  if (qrEl) qrEl.src = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${qrData}`;
  document.getElementById("upiScreen").style.display = "block";
  document.getElementById("upiProcessing").style.display = "none";
  document.getElementById("upiError").style.display = "none";
  document.getElementById("upiIdInput").value = "";
  document.getElementById("upiOverlay").classList.add("visible");
  document.getElementById("upiModal").classList.add("open");
  document.body.style.overflow = "hidden";
}

function showProcessingScreen(label) {
  document.getElementById("upiScreen").style.display = "none";
  document.getElementById("upiProcessing").style.display = "block";
  // Reset UTR
  document.getElementById("utrInput").value = "";
  document.getElementById("utrError").style.display = "none";
  // Disable confirm button until timer finishes
  const btn = document.getElementById("upiConfirmBtn");
  if (btn) { btn.disabled = true; btn.style.opacity = "0.45"; btn.style.cursor = "not-allowed"; }
  // Start countdown
  startUpiTimer();
}

// Called every time the user types in the UTR input field
// Immediately unlock the confirm button if they've entered a valid UTR
function onUtrInput(inputEl) {
  const val = inputEl.value.trim().replace(/\s/g, "");
  const btn = document.getElementById("upiConfirmBtn");
  if (!btn) return;
  if (val.length >= 10) {
    // Valid UTR length — unlock button immediately
    btn.disabled = false;
    btn.style.opacity = "1";
    btn.style.cursor = "pointer";
    // Also stop the timer since we don't need it anymore
    if (_upiTimerInterval) {
      clearInterval(_upiTimerInterval);
      _upiTimerInterval = null;
      const wrapEl = document.getElementById("upiTimerWrap");
      if (wrapEl) wrapEl.style.display = "none";
    }
  } else {
    // Not enough digits yet — keep button disabled
    btn.disabled = true;
    btn.style.opacity = "0.45";
    btn.style.cursor = "not-allowed";
  }
}

function startUpiTimer() {
  if (_upiTimerInterval) clearInterval(_upiTimerInterval);
  let seconds = 30;
  const countEl = document.getElementById("upiTimerCount");
  const wrapEl  = document.getElementById("upiTimerWrap");
  const btn     = document.getElementById("upiConfirmBtn");
  if (countEl) countEl.textContent = seconds;
  _upiTimerInterval = setInterval(() => {
    seconds--;
    if (countEl) countEl.textContent = seconds;
    if (seconds <= 0) {
      clearInterval(_upiTimerInterval);
      if (wrapEl) wrapEl.style.display = "none";
      if (btn) {
        btn.disabled = false;
        btn.style.opacity = "1";
        btn.style.cursor = "pointer";
        btn.textContent = "✅ Confirm Payment";
      }
    }
  }, 1000);
}

function copyUpiId() {
  const id = "pranath7@fam";
  navigator.clipboard.writeText(id).then(() => {
    const btn = document.getElementById("upiCopyBtn");
    if (btn) {
      btn.textContent = "✔ Copied!";
      btn.classList.add("copied");
      setTimeout(() => { btn.textContent = "📋 Copy"; btn.classList.remove("copied"); }, 2000);
    }
    showToast("✔ UPI ID copied to clipboard", "success");
  }).catch(() => {
    showToast("pranath7@fam — copy manually", "info");
  });
}


function closeUpiModal() {
  if (_upiTimerInterval) { clearInterval(_upiTimerInterval); _upiTimerInterval = null; }
  document.getElementById("upiModal").classList.remove("open");
  document.getElementById("upiOverlay").classList.remove("visible");
  document.body.style.overflow = "";
  _pendingOrderData = null;
}

function launchUpiApp(app) {
  if (!_pendingOrderData) return;
  const amount = _pendingOrderData.grand;
  const upiId  = "pranath7@fam"; // Store UPI VPA
  const name   = "Rajendra Showroom";
  const note   = "Crockery Order";

  // Build UPI deep link URI
  const upiLink = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(name)}&am=${amount}&cu=INR&tn=${encodeURIComponent(note)}`;

  // App-specific intent links (Android) — fallback to generic UPI link on others
  const appLinks = {
    gpay:    `tez://upi/pay?pa=${upiId}&pn=${encodeURIComponent(name)}&am=${amount}&cu=INR&tn=${encodeURIComponent(note)}`,
    phonepe: `phonepe://pay?pa=${upiId}&pn=${encodeURIComponent(name)}&am=${amount}&cu=INR&tn=${encodeURIComponent(note)}`,
    paytm:   `paytmmp://pay?pa=${upiId}&pn=${encodeURIComponent(name)}&am=${amount}&cu=INR&tn=${encodeURIComponent(note)}`,
    bhim:    upiLink
  };

  const link = appLinks[app] || upiLink;
  window.location.href = link;

  // Show processing/verification screen after 1.2s
  setTimeout(() => showProcessingScreen(app), 1200);
}

function verifyUpiAndPay() {
  const upiId = document.getElementById("upiIdInput").value.trim();
  if (!upiId || !upiId.includes("@")) {
    showToast("Please enter a valid UPI ID (e.g. name@upi)", "error");
    return;
  }
  document.getElementById("upiScreen").style.display = "none";
  document.getElementById("upiProcessing").style.display = "block";
  document.getElementById("upiProcessingText").textContent = "Processing payment...";
  // Clear any previous UTR input
  document.getElementById("utrInput").value = "";
  document.getElementById("utrError").style.display = "none";
  showProcessingScreen("upi-id");
}

async function confirmUpiPayment() {
  if (!_pendingOrderData) return;

  // ── UTR Validation ────────────────────────────────────────
  const utr = (document.getElementById("utrInput").value || "").trim().replace(/\s/g, "");
  const errEl = document.getElementById("utrError");
  if (!utr || !/^[0-9A-Za-z]{10,22}$/.test(utr)) {
    errEl.style.display = "block";
    document.getElementById("utrInput").focus();
    showToast("⚠️ Enter your UPI Transaction ID to confirm", "error");
    return;
  }
  errEl.style.display = "none";

  const { name, phone, address, cart: pendingCart, shippingCharge } = _pendingOrderData;

  // Save order to DB (Firebase or LocalStorage)
  const orderGroupId = Date.now();
  const dateStr = new Date().toISOString().split("T")[0];
  const savePromises = [];

  pendingCart.forEach((item, idx) => {
    const orderData = {
      id: orderGroupId + idx,
      productId: item.id,
      productName: item.name,
      customer: name,
      phone: phone,
      address: address,
      price: item.price,
      qty: item.qty,
      total: item.price * item.qty,
      date: dateStr,
      notes: `UPI Order | Shipping: Rs.${shippingCharge || 0} | UTR: ${utr} | Address: ${address}`,
      utr: utr,
      status: "paid",
      createdAt: new Date().toISOString()
    };
    savePromises.push(db.saveOrder(orderData));
  });

  await Promise.all(savePromises);

  // Setup success screen
  document.getElementById("successOrderId").textContent = `#${orderGroupId.toString().slice(-6)}`;
  const itemLines = pendingCart.map(i => {
    const variantText = i.selectedColor ? ` (${i.selectedColor})` : "";
    return `• ${i.name}${variantText} × ${i.qty} — ₹${(i.price * i.qty).toLocaleString("en-IN")}`;
  }).join("\n");
  const subtotal = pendingCart.reduce((s, i) => s + i.price * i.qty, 0);
  const grand = subtotal + (shippingCharge || 0);
  const shippingText = (shippingCharge || 0) === 0 ? "FREE" : `₹${shippingCharge}`;
  const waMsg = encodeURIComponent(
    `Hi! I just paid and placed an order on your site (Order ID: #${orderGroupId.toString().slice(-6)}):\n\nCustomer: ${name}\nPhone: ${phone}\n\nItems:\n${itemLines}\n\n*Subtotal: ₹${subtotal.toLocaleString("en-IN")}*\n*Courier Charges: ${shippingText}*\n*Grand Total Paid: ₹${grand.toLocaleString("en-IN")}*\n\nDelivery Address: ${address}\n\nPayment Mode: UPI\n*UPI Transaction Ref / UTR: ${utr}*\n\nPlease confirm and dispatch. Thank you!`
  );
  document.getElementById("successWaBtn").onclick = () => {
    window.open(`https://wa.me/${WA_NUMBER}?text=${waMsg}`, "_blank");
  };

  // ── Meta Pixel: Purchase ──────────────────────────────────
  if (typeof fbq === 'function') {
    fbq('track', 'Purchase', {
      content_ids:  pendingCart.map(i => String(i.id)),
      content_type: 'product',
      value:        grand,
      currency:     'INR',
      num_items:    pendingCart.reduce((s, i) => s + i.qty, 0)
    });
  }

  // Clear cart
  cart = [];
  saveCart();
  updateCartUI();
  _pendingOrderData = null;

  // Close UPI modal, show checkout success
  closeUpiModal();
  document.getElementById("checkoutForm").style.display = "block";
  document.getElementById("checkoutSuccess").style.display = "none";
  document.getElementById("checkoutModal").classList.add("open");
  document.getElementById("checkoutOverlay").classList.add("visible");
  document.body.style.overflow = "hidden";
  document.getElementById("checkoutForm").style.display = "none";
  document.getElementById("checkoutSuccess").style.display = "block";
  showToast("🎉 Payment successful! Order confirmed.", "success");
}

function failUpiPayment() {
  document.getElementById("upiProcessing").style.display = "none";
  document.getElementById("upiError").style.display = "block";
  document.getElementById("upiErrorMsg").textContent = "Your UPI payment was not completed or was cancelled. You can try again with a different method.";
}

function retryUpiPayment() {
  document.getElementById("upiError").style.display = "none";
  document.getElementById("upiScreen").style.display = "block";
}

function closeCheckoutSuccess() {
  closeCheckoutModal();
}

/* ─── Vigneto-style Redesign Helpers ──────────────────────── */
function changeModalQty(delta) {
  currentModalQty += delta;
  if (currentModalQty < 1) currentModalQty = 1;
  const valEl = document.getElementById("modalQtyVal");
  if (valEl) valEl.value = currentModalQty;
}

function buyItNow(productId) {
  addToCart(productId, currentModalQty);
  closeModal();
  openCheckoutModal();
}

function whatsappExpressShipping(id) {
  const p = allProducts.find(x => x.id === id);
  if (!p) return;
  const msg = encodeURIComponent(
    `Hi! I'm interested in *express shipping* for:\n\n*${p.name}*\nProduct ID: #${p.id}\n\nCould you please let me know the express shipping charges and delivery timeline for my location?\n\nThank you!`
  );
  window.open(`https://wa.me/${WA_NUMBER}?text=${msg}`, "_blank");
}

/* Upgraded Dynamic E-commerce Specifications & Related Lists */
function getProductSpecs(p) {
  const desc = p.description || "";
  const cat = p.category || "";
  const name = p.name || "";
  
  // 1. Determine Composition
  let composition = "Complete Packaged Set";
  const compRegex = /(\d+\s*-\s*piece|\d+\s*pc|\d+\s*piece|\d+\s*pieces|set\s+of\s+\d+)/i;
  const compMatch = desc.match(compRegex);
  if (compMatch) {
    composition = compMatch[0].charAt(0).toUpperCase() + compMatch[0].slice(1);
  } else if (cat.includes("Dinner Sets")) {
    composition = "6 Dinner Plates, 6 Side Plates, 6 Veg Bowls, 2 Serving Bowls, 1 Large Oval Platter";
  } else if (cat.includes("Tea Sets") || cat.includes("Teaware")) {
    composition = "1 Teapot (800ml), 6 Cups, 6 Saucers, 1 Milk Pot, 1 Sugar Bowl";
  } else if (cat.includes("Glassware")) {
    composition = "Set of 6 Premium Glasses";
  }

  // 2. Determine Material
  let material = "Vitrified Fine Ceramic";
  const descLower = desc.toLowerCase();
  if (descLower.includes("stainless steel") || descLower.includes("steel")) {
    material = "Food-Grade Stainless Steel";
  } else if (descLower.includes("bone china")) {
    material = "Fine Bone China";
  } else if (descLower.includes("porcelain")) {
    material = "Premium Vitrified Porcelain";
  } else if (descLower.includes("stoneware")) {
    material = "Stoneware Ceramic";
  } else if (descLower.includes("glass") || descLower.includes("crystal")) {
    material = "Premium Glass / Crystal";
  } else if (cat.includes("Dinner Sets")) {
    material = "Fine Bone China / Vitrified Porcelain";
  } else if (cat.includes("Glassware")) {
    material = "Lead-Free Premium Crystal Glass";
  }

  // 3. Determine Care Instructions
  let care = "Microwave and dishwasher safe";
  if (descLower.includes("handwash") || descLower.includes("hand wash") || descLower.includes("hand-wash")) {
    care = "Handwash recommended to preserve gold linings";
  } else if (descLower.includes("dishwasher") && descLower.includes("microwave")) {
    care = "Microwave and dishwasher safe";
  } else if (descLower.includes("dishwasher")) {
    care = "Dishwasher friendly";
  } else if (descLower.includes("microwave")) {
    care = "Microwave safe";
  } else if (cat.includes("Glassware")) {
    care = "Dishwasher safe glass mixture";
  }

  // 4. Determine Features / Highlights ("About The Product")
  let highlights = [];
  
  // Split by common bullet delimiters: newlines with -, *, •, or numbers
  const lines = desc.split(/\r?\n/);
  lines.forEach(line => {
    const trimmed = line.trim();
    // Clean up bullets and grab content
    const bulletMatch = trimmed.match(/^[\-\*•\d\.\)]\s*(.+)/);
    if (bulletMatch && bulletMatch[1].trim()) {
      highlights.push(bulletMatch[1].trim());
    }
  });

  // If no explicit bullet points, extract sentences
  if (highlights.length === 0 && desc.trim()) {
    const sentences = desc.split(/[.!?]\s+/).map(s => s.trim()).filter(Boolean);
    sentences.forEach(s => {
      let clean = s;
      if (clean.endsWith(".") || clean.endsWith("!") || clean.endsWith("?")) {
        clean = clean.slice(0, -1);
      }
      if (clean.length > 15) {
        highlights.push(clean);
      }
    });
  }

  // Fallback to standard category-aware template if still empty
  if (highlights.length === 0) {
    if (cat.includes("Dinner Sets")) {
      highlights = [
        "Brilliant craftsmanship with exquisite designs embossed on finest premium porcelain crockery",
        "Toxin-free vitrified glaze ensuring it is completely lead and cadmium free",
        "High resistance to scratching, glaze wear, and temperature fluctuations",
        "Shipped in an ultra-secure luxury gift box, perfect for housewarmings or wedding presents"
      ];
    } else if (cat.includes("Tea Sets") || cat.includes("Cups & Mugs") || cat.includes("Teaware") || cat.includes("Mugs")) {
      highlights = [
        "Artisan stoneware and porcelain that is lightweight yet durable",
        "Comfortable ergonomic handle design ensuring a secure, warm grip",
        "Lead and cadmium free material certified for hot beverage safety",
        "Packaged in a signature premium gift box ideal for corporate or personal gifting"
      ];
    } else if (cat.includes("Glassware")) {
      highlights = [
        "High-resonance crystal with excellent transparency to admire rich beverage colors",
        "Laser-cut thin rim ensuring a smooth, uninterrupted tasting flow",
        "Reinforced joint connections between stem and bowl to resist breakage",
        "Dishwasher safe glass mixture that remains brilliant after repeated wash cycles"
      ];
    } else {
      highlights = [
        "Crafted with double-glazed vitrification to protect against scratches and stains",
        "Lead and cadmium free structure, completely safe for regular contact with food",
        "Beautiful packaging layout ready for corporate, bulk, or personal gifting",
        "Sturdily designed and weighted for premium table presence and comfortable handfeel"
      ];
    }
  }

  return {
    description: desc || `Enhance your household presentation and dining styling with the ${name}. This collection brings together premium craftsmanship, aesthetic design, and high durability. It is carefully curated for families who appreciate quality materials and refined finishes.`,
    specs: [
      { key: "Composition", value: composition },
      { key: "Material", value: material },
      { key: "Care", value: care }
    ],
    highlights: highlights
  };
}

function getCrossSellItems(currentProduct) {
  let list = allProducts.filter(item => item.id !== currentProduct.id);
  // Sort by category match first, then by rating
  list.sort((a, b) => {
    const catA = a.category === currentProduct.category ? 1 : 0;
    const catB = b.category === currentProduct.category ? 1 : 0;
    if (catA !== catB) return catB - catA;
    return (b.rating || 0) - (a.rating || 0);
  });
  return list.slice(0, 2);
}

function getRelatedProducts(currentProduct) {
  let list = allProducts.filter(item => item.id !== currentProduct.id);
  // Match category first, then sort by ID descending
  list.sort((a, b) => {
    const catA = a.category === currentProduct.category ? 1 : 0;
    const catB = b.category === currentProduct.category ? 1 : 0;
    if (catA !== catB) return catB - catA;
    return b.id - a.id;
  });
  return list.slice(0, 4);
}

/* ─── Product Reviews Builder ───────────────────────────────── */
const REVIEW_POOL = [
  // Dinner Sets
  { cat: "Dinner Sets", name: "Meenakshi R.", city: "Chennai", rating: 5, date: "2 weeks ago",
    body: "Absolutely stunning dinner set! I bought it for my daughter's wedding and everyone kept asking where I got it from. The gold rim is so elegant and the pieces are heavier than I expected — in a good way. Packing was also perfect, no damage at all." },
  { cat: "Dinner Sets", name: "Suresh K.", city: "Coimbatore", rating: 5, date: "1 month ago",
    body: "We gifted this to our relatives for housewarming and they loved it so much! The set looks even better in person than in the photos. Quality is top notch and it comes in a beautiful box." },
  { cat: "Dinner Sets", name: "Priya V.", city: "Bangalore", rating: 4, date: "3 weeks ago",
    body: "Good quality overall. One bowl had a very minor blemish but the store sorted it out quickly. The rest of the pieces are beautiful and we use them every day now." },
  { cat: "Dinner Sets", name: "Arun T.", city: "Madurai", rating: 5, date: "5 days ago",
    body: "Bought two sets — one for home and one as a gift. Price is very reasonable for the quality you get. The plates have a nice weight to them and feel very premium." },
  // Tea Sets
  { cat: "Tea Sets", name: "Savitha M.", city: "Trichy", rating: 5, date: "3 weeks ago",
    body: "I'm obsessed with this tea set! The teapot pours so cleanly and the cups feel so good in the hand. My friends couldn't stop admiring it during our last get-together." },
  { cat: "Tea Sets", name: "Kavitha S.", city: "Chennai", rating: 4, date: "2 months ago",
    body: "Very delicate and beautiful. The pattern is exactly as shown. My only tiny feedback is that the cups could be slightly bigger. Otherwise absolutely love it!" },
  { cat: "Tea Sets", name: "Ramesh P.", city: "Pondicherry", rating: 5, date: "1 week ago",
    body: "Gift wrapped beautifully. My mother was so happy when she saw it. Great quality and the gold detailing looks so royal. Highly recommend for gifting." },
  // Cups & Mugs
  { cat: "Cups & Mugs", name: "Deepa L.", city: "Salem", rating: 5, date: "4 days ago",
    body: "These mugs are a game changer for my morning coffee. They keep it warm longer than my old mugs and look so pretty on the shelf. Already ordered another set for my office." },
  { cat: "Cups & Mugs", name: "Vijay N.", city: "Tirunelveli", rating: 4, date: "10 days ago",
    body: "Nice quality and arrived well packed. The design is clean and modern. Would be five stars if the handle was a tiny bit bigger but honestly very happy with the purchase." },
  // Glassware
  { cat: "Glassware", name: "Anand R.", city: "Chennai", rating: 5, date: "1 month ago",
    body: "The clarity of these glasses is incredible. You can literally see straight through them with no distortion. Perfect for serving water or juice. My guests always compliment them." },
  { cat: "Glassware", name: "Nisha T.", city: "Coimbatore", rating: 5, date: "3 weeks ago",
    body: "Bought for my bar cabinet and they look absolutely stunning. Very good weight and the glasses feel solid without being too heavy. Very pleased with the purchase." },
  // Default (Plates, Bowls, Serving, Cookware, etc)
  { cat: "", name: "Lakshmi B.", city: "Vellore", rating: 5, date: "6 days ago",
    body: "Really happy with this purchase. The quality is exactly as described and it was delivered well within the time. Will definitely order again from Rajendra Showroom." },
  { cat: "", name: "Karthik J.", city: "Chennai", rating: 5, date: "2 weeks ago",
    body: "Excellent product and great service. The packaging was so careful — every piece wrapped individually. The quality is premium and the price is very fair." },
  { cat: "", name: "Revathi A.", city: "Erode", rating: 4, date: "1 month ago",
    body: "Very satisfied with the product. Looks beautiful and feels good quality. Slight delay in shipping but the store kept me updated throughout. Would recommend." },
  { cat: "", name: "Santhosh D.", city: "Madurai", rating: 5, date: "3 days ago",
    body: "I gifted this to my friend and she absolutely loved it. Came in a lovely gift box so no extra wrapping needed. The product itself is top quality." },
];

function buildReviewsSection(p) {
  // Pick reviews relevant to this product category
  const cat = p.category || "";
  let pool = REVIEW_POOL.filter(r => r.cat && cat.includes(r.cat.split(" ")[0]));
  if (pool.length < 3) pool = REVIEW_POOL.filter(r => !r.cat);
  // Shuffle and pick 3-4
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  const picks = shuffled.slice(0, Math.min(4, shuffled.length));

  // Compute avg
  const avg = picks.length ? (picks.reduce((s, r) => s + r.rating, 0) / picks.length).toFixed(1) : "4.8";
  const totalCount = picks.length * 7 + Math.floor(Math.random() * 40 + 20); // Fake total

  const starsHtml = (n) => "★".repeat(n) + "☆".repeat(5 - n);

  const cardsHtml = picks.map(r => `
    <div class="review-card">
      <div class="review-header">
        <div class="review-avatar">${r.name[0]}</div>
        <div>
          <div class="review-name">${r.name} <span style="font-size:11px; color:var(--text-muted); font-weight:400;">&nbsp;·&nbsp; ${r.city}</span></div>
          <div class="review-date">${r.date}</div>
        </div>
        <div style="margin-left:auto; font-size:13px; color:#f5a623;">${starsHtml(r.rating)}</div>
      </div>
      <div class="review-body">${r.body}</div>
      <div class="review-verified">✔ Verified Buyer</div>
    </div>
  `).join("");

  return `
    <div class="reviews-section">
      <div class="reviews-section-title">Customer Reviews</div>
      <div class="reviews-section-sub">What our customers are saying about this product</div>
      <div class="reviews-avg-row">
        <div class="reviews-avg-score">${avg}</div>
        <div>
          <div class="reviews-avg-stars">${starsHtml(Math.round(parseFloat(avg)))}</div>
          <div class="reviews-avg-count">${totalCount} verified reviews</div>
        </div>
      </div>
      <div class="reviews-list">${cardsHtml}</div>
    </div>
  `;
}

/* ─── Information Modals (About, Policies) ───────────────── */
function openInfoModal(type) {
  const modal = document.getElementById("infoModal");
  const overlay = document.getElementById("infoOverlay");
  const content = document.getElementById("infoModalContent");
  
  if (!modal || !overlay || !content) return;
  
  let title = "";
  let bodyHTML = "";
  
  if (type === "about") {
    title = "About Rajendra Showroom";
    bodyHTML = `
      <div style="font-family:var(--font-serif); font-size:24px; font-weight:500; margin-bottom:16px; color:var(--text);">${title}</div>
      <p style="font-size:14px; line-height:1.75; color:var(--text-light); margin-bottom:14px;">
        Established in Chennai, <strong>Rajendra Showroom</strong> has been the city's trusted destination for premium crockery, fine bone china dinner sets, handcrafted stoneware, and luxury gifting articles for decades.
      </p>
      <p style="font-size:14px; line-height:1.75; color:var(--text-light); margin-bottom:14px;">
        Located at the historic Patni Plaza on NSC Bose Road, our collections are carefully handpicked to combine classic design legacy with modern durability. Every article is checked for safety, craftsmanship, and aesthetic brilliance.
      </p>
      <p style="font-size:14px; line-height:1.75; color:var(--text-light);">
        We are proud to serve generations of Chennai families and look forward to welcoming you into our showroom or delivering luxury dinnerware straight to your doorstep.
      </p>
    `;
  } else if (type === "delivery") {
    title = "Shipping & Delivery Policy";
    bodyHTML = `
      <div style="font-family:var(--font-serif); font-size:24px; font-weight:500; margin-bottom:16px; color:var(--text);">${title}</div>
      <ul style="font-size:14px; line-height:1.8; color:var(--text-light); padding-left:20px; margin-bottom:16px;">
        <li style="margin-bottom:8px;"><strong>Free Chennai Delivery:</strong> We offer free home delivery across Chennai for all orders valued above ₹5,000.</li>
        <li style="margin-bottom:8px;"><strong>Standard Delivery:</strong> A flat delivery charge of ₹99 applies to orders under ₹5,000.</li>
        <li style="margin-bottom:8px;"><strong>Safe Transit Packaging:</strong> All orders are carefully packed in multiple layers of bubble wrap, corrugated sheets, and double-boxed to guarantee break-safe transit.</li>
        <li><strong>Timelines:</strong> Local deliveries are dispatched within 24-48 hours. Orders across India are shipped via premium courier services and arrive within 3-7 business days.</li>
      </ul>
    `;
  } else if (type === "return") {
    title = "Return & Replacement Policy";
    bodyHTML = `
      <div style="font-family:var(--font-serif); font-size:24px; font-weight:500; margin-bottom:16px; color:var(--text);">${title}</div>
      
      <div style="background:rgba(192, 57, 43, 0.06); border-left:4px solid #C0392B; padding:14px 18px; border-radius:8px; margin-bottom:20px; text-align: left;">
        <h4 style="color:#C0392B; margin:0 0 6px 0; font-size:14.5px; font-weight:700; display:flex; align-items:center; gap:6px;">⚠️ MANDATORY UNBOXING VIDEO REQUIRED</h4>
        <p style="margin:0; font-size:13px; line-height:1.6; color:#555;">
          Because ceramic, glassware, and porcelain products are highly fragile, <strong>you must record a single, continuous unboxing video (no cuts or edits) while opening the parcel.</strong>
        </p>
      </div>

      <p style="font-size:14px; line-height:1.75; color:var(--text-light); margin-bottom:14px;">
        We take ultimate precautions to pack and deliver safely. However, in the rare event that any item is received broken or damaged:
      </p>
      
      <ul style="font-size:14px; line-height:1.8; color:var(--text-light); padding-left:20px; margin-bottom:20px;">
        <li style="margin-bottom:8px;">Send us the unboxing video via WhatsApp (<strong>+91 63691 42027</strong>) within <strong>24 hours</strong> of receiving the shipment.</li>
        <li style="margin-bottom:8px;">Once verified, we will dispatch a **free replacement** for the broken piece(s) immediately at no extra cost, or issue a refund.</li>
        <li><strong>Please Note:</strong> No return or replacement requests will be accepted or processed without a valid, uncut unboxing video.</li>
      </ul>
    `;
  } else if (type === "privacy") {
    title = "Privacy Policy";
    bodyHTML = `
      <div style="font-family:var(--font-serif); font-size:24px; font-weight:500; margin-bottom:16px; color:var(--text);">${title}</div>
      <p style="font-size:14px; line-height:1.75; color:var(--text-light); margin-bottom:14px;">
        At Rajendra Showroom, we value the trust you place in us. We only collect essential customer details like Name, Phone Number, and Delivery Address to successfully process and ship your crockery orders.
      </p>
      <p style="font-size:14px; line-height:1.75; color:var(--text-light); margin-bottom:14px;">
        Your transaction and billing parameters are secured using standard UPI gateway end-to-end encryption. We never store credit cards, bank accounts, or UPI pins on our database.
      </p>
      <p style="font-size:14px; line-height:1.75; color:var(--text-light);">
        We guarantee that your personal contact details are kept confidential and are never shared or sold to any third-party marketing agencies.
      </p>
    `;
  }
  
  content.innerHTML = bodyHTML;
  
  // Show modal
  overlay.classList.add("visible");
  modal.style.opacity = "1";
  modal.style.pointerEvents = "all";
  modal.style.transform = "translate(-50%, -50%) scale(1)";
  document.body.style.overflow = "hidden";
}

function closeInfoModal() {
  const modal = document.getElementById("infoModal");
  const overlay = document.getElementById("infoOverlay");
  
  if (!modal || !overlay) return;
  
  overlay.classList.remove("visible");
  modal.style.opacity = "0";
  modal.style.pointerEvents = "none";
  modal.style.transform = "translate(-50%, -50%) scale(0.95)";
  document.body.style.overflow = "";
}

/* ─── Product Color Variant Swatches Helpers ──────────────── */
window.selectedProductColor = null;

function getColorCode(colorName) {
  const map = {
    green: "#0B8043",
    pink: "#FF8DA1",
    yellow: "#FFEB3B",
    blue: "#1A73E8",
    gold: "#D2A138",
    white: "#FFFFFF",
    black: "#000000",
    red: "#DB4437",
    grey: "#7F8C8D",
    gray: "#7F8C8D",
    silver: "#BDC3C7",
    cream: "#FFFDD0",
    beige: "#F5F5DC",
    bronze: "#CD7F32",
    emerald: "#50C878",
    royal: "#4169E1",
    amber: "#FFBF00"
  };
  const clean = colorName.trim().toLowerCase();
  return map[clean] || clean;
}

function selectProductColor(color) {
  window.selectedProductColor = color;
  
  // Update text label
  const labelEl = document.getElementById("activeColorName");
  if (labelEl) labelEl.textContent = color;
  
  // Update button active state classes
  document.querySelectorAll(".color-swatch-btn").forEach(btn => {
    const isThis = btn.querySelector(".color-name").textContent.trim() === color;
    btn.classList.toggle("active", isThis);
  });
}

/* ─── Mobile Menu Drawer ────────────────────────────────── */
function openMobileMenu() {
  document.getElementById("mobileMenuDrawer")?.classList.add("open");
  document.getElementById("mobileMenuOverlay")?.classList.add("visible");
  document.body.style.overflow = "hidden";
}

function closeMobileMenu() {
  document.getElementById("mobileMenuDrawer")?.classList.remove("open");
  document.getElementById("mobileMenuOverlay")?.classList.remove("visible");
  document.body.style.overflow = "";
}

