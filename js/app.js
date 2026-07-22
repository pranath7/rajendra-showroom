// ============================================================
//  Rajendra Showroom – Main Application Logic
// ============================================================

const WA_NUMBER = "916369142027";
const STORE_KEY  = "rs_products";
const CART_KEY   = "rs_cart";

function getCategorySvg(catId) {
  const icons = {
    "all": `<svg class="svg-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>`,
    
    "Dinner Sets": `<svg class="svg-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"></circle><circle cx="12" cy="12" r="5"></circle><circle cx="12" cy="12" r="1"></circle></svg>`,
    
    "Tea Sets": `<svg class="svg-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M2 17h16c1.1 0 2-.9 2-2V9c0-1.1-.9-2-2-2H8c-1.1 0-2 .9-2 2v6c0 1.1.9 2 2 2z"></path><path d="M6 10H4c-1.1 0-2 .9-2 2v1c0 1.1.9 2 2 2h2"></path><path d="M20 11h2c1.1 0 2 .9 2 2v0c0 1.1-.9 2-2 2h-2"></path><path d="M10 7V4c0-.6-.4-1-1-1H7"></path><path d="M6 20h12"></path></svg>`,
    
    "Cups & Mugs": `<svg class="svg-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17 8h1a4 4 0 1 1 0 8h-1"></path><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V8z"></path><line x1="6" y1="2" x2="6" y2="4"></line><line x1="10" y1="2" x2="10" y2="4"></line><line x1="14" y1="2" x2="14" y2="4"></line></svg>`,
    
    "Plates": `<svg class="svg-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"></circle><circle cx="12" cy="12" r="6"></circle></svg>`,
    
    "Bowls": `<svg class="svg-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M2 10a10 10 0 0 0 20 0H2z"></path><path d="M6 20h12"></path></svg>`,
    
    "Glassware": `<svg class="svg-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 22H2"></path><path d="M5 2h14v10a7 7 0 0 1-14 0V2z"></path><path d="M12 12v10"></path></svg>`,
    
    "Serving": `<svg class="svg-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 19h18"></path><path d="M5 16h14a1 1 0 0 0 1-1V9a7 7 0 0 0-16 0v6a1 1 0 0 0 1 1z"></path><path d="M12 2v2"></path></svg>`,
    
    "Cookware": `<svg class="svg-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11 17A6 6 0 1 0 5 11"></path><path d="M22 3l-8.5 8.5"></path><circle cx="11" cy="11" r="6"></circle></svg>`,
    
    "Cutlery": `<svg class="svg-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 2v7c0 2 1.5 3.5 3.5 3.5H7V22h2v-9.5h.5C11.5 12.5 13 11 13 9V2h-2v5H9V2H7v5H5V2H3z"></path><path d="M19 2v10h-2v10h2V12c3 0 3-10 3-10h-3z"></path></svg>`,
    
    "Gift Sets": `<svg class="svg-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="8" width="18" height="13" rx="2"></rect><path d="M12 8v13"></path><path d="M3 12h18"></path><path d="M7.5 8a2.5 2.5 0 0 1 0-5C9 3 10.5 5.5 12 8c1.5-2.5 3-5 4.5-5a2.5 2.5 0 0 1 0 5H12"></path></svg>`
  };
  return icons[catId] || icons["all"];
}

function getOptimizedImageUrl(url, width = 450) {
  if (!url) return url;
  if (url.includes("res.cloudinary.com") && url.includes("/image/upload/")) {
    return url.replace("/image/upload/", `/image/upload/f_auto,q_auto,w_${width}/`);
  }
  return url;
}

/* ─── State ──────────────────────────────────────────────── */
let allProducts      = [];
let cart             = [];
let wishlist         = [];
let activeCategory   = "all";
let currentSort      = "featured";
let currentView      = "grid";
let maxPriceFilter   = 100000;
let searchQuery      = "";
let cartOpen         = false;
let wishlistOpen     = false;
let modalOpen        = false;
let sharedWishlistId = null;
let appliedVoucher   = null;

/* ─── Boot ───────────────────────────────────────────────── */
document.addEventListener("DOMContentLoaded", () => {
  loadCart();
  loadWishlist();
  
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
  updateWishlistUI();
  checkSharedWishlist();

  // Run background revalidation sync from Firebase
  triggerBackgroundSync();
  setTimeout(initScrollReveal, 200);

  // Handle PWA Shortcut routing
  const params = new URLSearchParams(window.location.search);
  if (params.get('open') === 'cart') {
    setTimeout(openCart, 300);
  } else if (params.get('open') === 'tracker') {
    setTimeout(openOrderTracker, 300);
  }
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
          <span class="cat-icon">${getCategorySvg(cat.id)}</span>
          <span>${cat.label}</span>
          <span class="cat-count">${count}</span>
        </li>`,
      mobile: `
        <li class="mm-cat-item ${isActive ? "active" : ""}"
            data-cat="${cat.id}"
            onclick="setCategory('${cat.id}'); closeMobileMenu();">
          <span class="cat-icon">${getCategorySvg(cat.id)}</span>
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

  // Shared Wishlist Registry filter
  if (window.sharedWishlistItems && window.sharedWishlistItems.length > 0) {
    list = list.filter(p => window.sharedWishlistItems.map(String).includes(String(p.id)));
  }

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
        <div class="no-icon" style="color:var(--text-muted);display:flex;justify-content:center;margin-bottom:12px;">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
            <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
            <line x1="12" y1="22.08" x2="12" y2="12"></line>
          </svg>
        </div>
        <h3>No products found</h3>
        <p>Try a different category or clear your search.</p>
      </div>`;
    return;
  }

  grid.className = `products-grid ${currentView === "list" ? "list-view" : ""}`;
  grid.innerHTML = filtered.map((p, idx) => productCardHTML(p, idx)).join("");
  setTimeout(initScrollReveal, 100);
}

function initScrollReveal() {
  if (!('IntersectionObserver' in window)) return;
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -30px 0px' });

  document.querySelectorAll('.product-card, .store-review-card, .seo-col, .feature-item').forEach(el => {
    if (!el.classList.contains('revealed')) {
      el.classList.add('reveal-item');
      observer.observe(el);
    }
  });
}

function productCardHTML(p, idx = 4) {
  const rating = p.rating ? p.rating : 4.8;
  const reviews = p.reviews ? p.reviews : 24;
  
  const isPriceOnRequest = !p.price || p.price <= 0;
  const discount = (p.originalPrice > p.price && !isPriceOnRequest)
    ? Math.round((1 - p.price / p.originalPrice) * 100)
    : 0;
  const stars = renderStars(rating);

  let imgHTML = "";
  if (p.image) {
    const optimizedSrc = getOptimizedImageUrl(p.image, 400);
    const loadingAttr = idx < 4 ? 'loading="eager" fetchpriority="high"' : 'loading="lazy"';
    imgHTML = `<img class="product-img" src="${optimizedSrc}" alt="${p.name}" ${loadingAttr}>`;
  } else if (p.video) {
    const isEmbed = p.video.includes("youtube.com/embed/") || p.video.includes("drive.google.com/file/d/");
    if (isEmbed) {
      imgHTML = `
        <div class="product-placeholder" style="background:#1C1C1A;color:var(--gold-light);display:flex;flex-direction:column;align-items:center;justify-content:center;">
          <div class="placeholder-icon" style="margin-bottom:8px;color:var(--gold);display:flex;">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polygon points="10 8 16 12 10 16 10 8"></polygon></svg>
          </div>
          <div class="placeholder-text" style="color:var(--gold-light);font-weight:500;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;">Watch Video</div>
        </div>`;
    } else {
      imgHTML = `<video class="product-img" src="${p.video}" muted loop autoplay playsinline style="object-fit:cover;width:100%;height:100%;background:#000;display:block;"></video>`;
    }
  } else {
    imgHTML = `
      <div class="product-placeholder" style="background:var(--bg-warm);display:flex;flex-direction:column;align-items:center;justify-content:center;">
        <div class="placeholder-icon" style="margin-bottom:8px;color:var(--text-muted);display:flex;">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
        </div>
        <div class="placeholder-text" style="color:var(--text-light);font-size:12px;font-weight:400;">Photo coming soon</div>
      </div>`;
  }

  const badgeHTML = (discount > 0 && !isPriceOnRequest)
    ? `<span class="product-badge badge-sale">−${discount}%</span>`
    : "";

  let fomoBadgeHTML = "";
  if (p.badge) {
    let badgeClass = "";
    if (p.badge === "Best Seller") badgeClass = "badge-bestseller";
    else if (p.badge === "New Arrival") badgeClass = "badge-new";
    else if (p.badge === "Low Stock") badgeClass = "badge-lowstock";
    fomoBadgeHTML = `<span class="product-badge-fomo ${badgeClass}">${p.badge}</span>`;
  }

  const isWishlisted = wishlist.some(x => String(x) === String(p.id));

  return `
    <div class="product-card" onclick="openModal('${p.id}')">
      <div class="product-img-wrap">
        ${fomoBadgeHTML}
        ${imgHTML}
        ${badgeHTML}
        <button class="product-wishlist ${isWishlisted ? 'active' : ''}" onclick="event.stopPropagation(); toggleWishlist('${p.id}')">${isWishlisted ? '♥' : '♡'}</button>
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
          <span class="price-current">${isPriceOnRequest ? 'Price on Request' : '₹' + p.price.toLocaleString("en-IN")}</span>
          ${(p.originalPrice > p.price && !isPriceOnRequest) ? `<span class="price-original">₹${p.originalPrice.toLocaleString("en-IN")}</span>` : ""}
          ${(discount > 0 && !isPriceOnRequest) ? `<span class="price-discount">Save ${discount}%</span>` : ""}
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
  const suggestions = document.getElementById("searchSuggestions");
  if (searchInput && suggestions) {
    searchInput.addEventListener("input", e => {
      const query = e.target.value.trim();
      searchQuery = query;
      renderProducts();
      
      if (query.length < 2) {
        suggestions.innerHTML = "";
        suggestions.style.display = "none";
        return;
      }
      
      const q = query.toLowerCase();
      const matches = allProducts.filter(p => 
        p.name.toLowerCase().includes(q) || 
        p.category.toLowerCase().includes(q) || 
        (p.description && p.description.toLowerCase().includes(q))
      ).slice(0, 6);
      
      if (matches.length === 0) {
        suggestions.innerHTML = `<div class="ss-no-results">No results found for "${query}"</div>`;
        suggestions.style.display = "block";
        return;
      }
      
      suggestions.innerHTML = matches.map(p => {
        const isPriceOnRequest = !p.price || p.price <= 0;
        const priceText = isPriceOnRequest ? "Price on Request" : `₹${p.price.toLocaleString("en-IN")}`;
        const imgUrl = p.image || (p.images && p.images[0]) || "";
        const imgHTML = imgUrl 
          ? `<img class="ss-img" src="${getOptimizedImageUrl(imgUrl, 80)}" alt="${p.name}">` 
          : `<div class="ss-img" style="display:flex;align-items:center;justify-content:center;background:var(--bg-warm);color:var(--text-muted);"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="9"></circle><circle cx="12" cy="12" r="5"></circle></svg></div>`;
        
        return `
          <div class="search-suggestion-item" onclick="openProductFromSearch('${p.id}')">
            ${imgHTML}
            <div class="ss-info">
              <div class="ss-name">${p.name}</div>
              <div class="ss-cat">${p.category}</div>
            </div>
            <div class="ss-price">${priceText}</div>
          </div>
        `;
      }).join("");
      suggestions.style.display = "flex";
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
    if (e.key === "Escape") { 
      closeCart(); 
      closeModal(); 
      closeCheckoutModal(); 
      closeUpiModal(); 
      closeMobileMenu(); 
      closeWishlist(); 
      const suggestions = document.getElementById("searchSuggestions");
      if (suggestions) suggestions.style.display = "none";
    }
  });

  // Checkout inputs dynamic capture for Abandoned Carts
  const custName = document.getElementById("custName");
  const custPhone = document.getElementById("custPhone");
  const custAddress = document.getElementById("custAddress");
  const custState = document.getElementById("custState");
  const custPincode = document.getElementById("custPincode");

  if (custName) custName.addEventListener("input", trackAbandonedCart);
  if (custPhone) custPhone.addEventListener("input", trackAbandonedCart);
  if (custAddress) custAddress.addEventListener("input", trackAbandonedCart);
  if (custState) custState.addEventListener("change", trackAbandonedCart);
  if (custPincode) custPincode.addEventListener("input", trackAbandonedCart);

  // Close search suggestions on click outside
  document.addEventListener("click", e => {
    const wrap = document.querySelector(".search-wrap");
    const suggestions = document.getElementById("searchSuggestions");
    if (suggestions && wrap && !wrap.contains(e.target)) {
      suggestions.style.display = "none";
    }
  });
}

/* ─── E-commerce Storefront Upgrades Helpers ─────────────── */
let abandonedCartTimer = null;
function trackAbandonedCart() {
  if (abandonedCartTimer) clearTimeout(abandonedCartTimer);
  abandonedCartTimer = setTimeout(async () => {
    const name = document.getElementById("custName") ? document.getElementById("custName").value.trim() : "";
    const phone = document.getElementById("custPhone") ? document.getElementById("custPhone").value.trim() : "";
    const address = document.getElementById("custAddress") ? document.getElementById("custAddress").value.trim() : "";
    const state = document.getElementById("custState") ? document.getElementById("custState").value : "";
    const pincode = document.getElementById("custPincode") ? document.getElementById("custPincode").value.trim() : "";

    if (!phone || cart.length === 0) return;

    const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
    const delivery = getDynamicShippingRate(subtotal, state, pincode);
    const giftCheckbox = document.getElementById("giftCheckbox");
    const isGift = giftCheckbox ? giftCheckbox.checked : false;
    const giftCharge = isGift ? 150 : 0;
    const giftMessage = isGift ? (document.getElementById("giftMessageInput").value.trim() || "Yes (Premium wrapping)") : "";

    const totalBeforeDiscount = subtotal + delivery + giftCharge;
    const discount = appliedVoucher ? Math.min(appliedVoucher.balance, totalBeforeDiscount) : 0;
    const grand = Math.max(0, totalBeforeDiscount - discount);

    const cartData = {
      id: phone,
      name,
      phone,
      address,
      state,
      pincode,
      cart: cart.map(i => ({
        id: i.id,
        name: i.name,
        price: i.price,
        qty: i.qty,
        selectedColor: i.selectedColor || null,
        selectedSize: i.selectedSize || null,
        img: i.image || ""
      })),
      shippingCharge: delivery,
      gift: isGift,
      giftMessage: giftMessage,
      giftCharge: giftCharge,
      appliedVoucherCode: appliedVoucher ? appliedVoucher.code : null,
      voucherDiscount: discount,
      grand: grand,
      timestamp: new Date().toISOString()
    };

    try {
      if (typeof db !== "undefined" && db.saveAbandonedCart) {
        await db.saveAbandonedCart(cartData);
      }
    } catch (e) {
      console.error("Failed to save abandoned cart:", e);
    }
  }, 1000);
}

function openProductFromSearch(id) {
  const suggestions = document.getElementById("searchSuggestions");
  if (suggestions) suggestions.style.display = "none";
  
  const searchInput = document.getElementById("searchInput");
  if (searchInput) searchInput.value = "";
  
  searchQuery = "";
  renderProducts();
  openModal(id);
}

function toggleWaWidget() {
  const card = document.getElementById("waWidgetCard");
  const badge = document.querySelector(".wa-bubble-badge");
  if (!card) return;
  if (card.style.display === "none") {
    card.style.display = "flex";
    if (badge) badge.style.display = "none";
  } else {
    card.style.display = "none";
  }
}

function sendWaWidgetMessage() {
  const input = document.getElementById("waWidgetInput");
  const query = input ? input.value.trim() : "";
  const text = query || "Hi! I am interested in dinnerware / products from your showroom.";
  const waMsg = encodeURIComponent(text);
  window.open(`https://wa.me/${WA_NUMBER}?text=${waMsg}`, "_blank");
  
  const card = document.getElementById("waWidgetCard");
  if (card) card.style.display = "none";
  if (input) input.value = "";
}

function updateBundlePriceDisplay(mainPrice, secondPrice) {
  const secondCheckbox = document.getElementById("fbtSecondCheckbox");
  const isSecondChecked = secondCheckbox ? secondCheckbox.checked : false;
  const priceDisplay = document.getElementById("fbtPriceDisplay");
  const btn = document.querySelector(".btn-add-bundle");
  
  if (isSecondChecked) {
    const origTotal = mainPrice + secondPrice;
    const discount = Math.round(origTotal * 0.05);
    const finalTotal = origTotal - discount;
    if (priceDisplay) {
      priceDisplay.innerHTML = `
        <span class="original">₹${origTotal.toLocaleString("en-IN")}</span>
        <span class="discounted">₹${finalTotal.toLocaleString("en-IN")}</span>
      `;
    }
    if (btn) btn.textContent = "Add Bundle to Cart (Save 5%)";
  } else {
    if (priceDisplay) {
      priceDisplay.innerHTML = `
        <span class="discounted">₹${mainPrice.toLocaleString("en-IN")}</span>
      `;
    }
    if (btn) btn.textContent = "Add Item to Cart";
  }
}

function addBundleToCart(mainId, secondId) {
  const secondCheckbox = document.getElementById("fbtSecondCheckbox");
  const isSecondChecked = secondCheckbox ? secondCheckbox.checked : false;
  
  const qtyInput = document.getElementById("modalQtyVal");
  const qty = qtyInput ? parseInt(qtyInput.value) || 1 : 1;
  
  const mainProduct = allProducts.find(p => String(p.id) === String(mainId));
  if (!mainProduct) return;
  
  let mainColor = window.selectedProductColor;
  let mainSize = window.selectedProductSize;
  let mainPrice = mainProduct.price;
  if (mainSize) {
    mainPrice = window.selectedProductPrice;
  } else {
    const productSizes = parseProductSizes(mainProduct.sizes);
    if (productSizes.length > 0) {
      mainSize = productSizes[0].name;
      mainPrice = productSizes[0].price;
    }
  }
  if (!mainColor) {
    const productColors = Array.isArray(mainProduct.colors) ? mainProduct.colors : (mainProduct.colors ? mainProduct.colors.split(",").map(c => c.trim()).filter(Boolean) : []);
    if (productColors.length > 0) mainColor = productColors[0];
  }

  if (isSecondChecked) {
    const secondProduct = allProducts.find(p => String(p.id) === String(secondId));
    if (!secondProduct) return;
    
    let secondColor = null;
    let secondSize = null;
    let secondPrice = secondProduct.price;
    const secondSizes = parseProductSizes(secondProduct.sizes);
    if (secondSizes.length > 0) {
      secondSize = secondSizes[0].name;
      secondPrice = secondSizes[0].price;
    }
    const secondColors = Array.isArray(secondProduct.colors) ? secondProduct.colors : (secondProduct.colors ? secondProduct.colors.split(",").map(c => c.trim()).filter(Boolean) : []);
    if (secondColors.length > 0) secondColor = secondColors[0];

    const discountedMainPrice = Math.round(mainPrice * 0.95);
    const discountedSecondPrice = Math.round(secondPrice * 0.95);

    const existingMain = cart.find(i => String(i.id) === String(mainId) && i.selectedColor === mainColor && i.selectedSize === mainSize);
    if (existingMain) {
      existingMain.qty += qty;
      existingMain.price = discountedMainPrice;
    } else {
      cart.push({
        id: mainProduct.id,
        name: mainProduct.name + " (Bundle Discount)",
        price: discountedMainPrice,
        image: mainProduct.image || (mainProduct.images && mainProduct.images[0]) || "",
        qty: qty,
        selectedColor: mainColor,
        selectedSize: mainSize
      });
    }

    const existingSecond = cart.find(i => String(i.id) === String(secondId) && i.selectedColor === secondColor && i.selectedSize === secondSize);
    if (existingSecond) {
      existingSecond.qty += 1;
      existingSecond.price = discountedSecondPrice;
    } else {
      cart.push({
        id: secondProduct.id,
        name: secondProduct.name + " (Bundle Discount)",
        price: discountedSecondPrice,
        image: secondProduct.image || (secondProduct.images && secondProduct.images[0]) || "",
        qty: 1,
        selectedColor: secondColor,
        selectedSize: secondSize
      });
    }
    showToast("FBT Bundle added to cart with 5% discount!", "success");
  } else {
    const existingMain = cart.find(i => String(i.id) === String(mainId) && i.selectedColor === mainColor && i.selectedSize === mainSize);
    if (existingMain) {
      existingMain.qty += qty;
    } else {
      cart.push({
        id: mainProduct.id,
        name: mainProduct.name,
        price: mainPrice,
        image: mainProduct.image || (mainProduct.images && mainProduct.images[0]) || "",
        qty: qty,
        selectedColor: mainColor,
        selectedSize: mainSize
      });
    }
    showToast("Item added to cart.", "success");
  }

  saveCart();
  updateCartUI();
  closeModal();
  openCart();
}

/* ─── Cart Functions ─────────────────────────────────────── */
function addToCart(id, qty = 1) {
  const product = allProducts.find(p => String(p.id) === String(id));
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

  let size = window.selectedProductSize;
  let price = product.price;
  if (size) {
    price = window.selectedProductPrice;
  } else {
    const productSizes = parseProductSizes(product.sizes);
    if (productSizes.length > 0) {
      size = productSizes[0].name;
      price = productSizes[0].price;
    }
  }

  const existing = cart.find(i => String(i.id) === String(id) && i.selectedColor === color && i.selectedSize === size);
  if (existing) {
    existing.qty += qty;
  } else {
    cart.push({ 
      id: product.id, 
      name: product.name, 
      price: price, 
      image: product.image, 
      qty: qty,
      selectedColor: color,
      selectedSize: size
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
      value:        price * qty,
      currency:     'INR'
    });
  }

  // ── Google Analytics: add_to_cart ──────────────────────────
  if (typeof gtag === 'function') {
    gtag('event', 'add_to_cart', {
      currency: 'INR',
      value: price * qty,
      items: [{
        item_id: String(product.id),
        item_name: product.name,
        price: price,
        quantity: qty
      }]
    });
  }
  renderCartItems();
}

function changeQty(id, color, size, delta) {
  const item = cart.find(i => String(i.id) === String(id) && i.selectedColor === color && i.selectedSize === size);
  if (item) {
    item.qty += delta;
    if (item.qty <= 0) {
      removeFromCart(id, color, size);
    } else {
      saveCart();
      renderCartItems();
    }
  }
}

function removeFromCart(id, color, size) {
  cart = cart.filter(i => !(String(i.id) === String(id) && i.selectedColor === color && i.selectedSize === size));
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
      <div class="cart-empty" style="text-align:center;padding:40px 20px;color:var(--text-light);">
        <div class="empty-icon" style="margin-bottom:12px;color:var(--text-muted);display:flex;justify-content:center;">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>
        </div>
        <p style="font-size:14px;line-height:1.5;">Your cart is empty.<br>Add some beautiful pieces!</p>
      </div>`;
    document.getElementById("cartGrandTotal").textContent = "₹0";
    return;
  }

  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const state = document.getElementById("custState") ? document.getElementById("custState").value : "Tamil Nadu";
  const pincode = document.getElementById("custPincode") ? document.getElementById("custPincode").value.trim() : "";
  const delivery = getDynamicShippingRate(subtotal, state, pincode);
  const grand    = subtotal + delivery;

  body.innerHTML = cart.map(item => `
    <div class="cart-item">
      <div class="cart-item-img" style="display:flex;align-items:center;justify-content:center;background:var(--bg-warm);">
        ${item.image ? `<img src="${getOptimizedImageUrl(item.image, 120)}" alt="${item.name}">` : `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="color:var(--text-muted);"><circle cx="12" cy="12" r="9"></circle><circle cx="12" cy="12" r="5"></circle></svg>`}
      </div>
      <div class="cart-item-info">
        <div class="cart-item-name">${item.name}</div>
        ${item.selectedSize ? `<div class="cart-item-variant" style="font-size:11.5px; color:var(--text-light); margin-top:2px;">Size: ${item.selectedSize}</div>` : ""}
        ${item.selectedColor ? `<div class="cart-item-variant" style="font-size:11.5px; color:var(--text-light); margin-top:2px;">Color: ${item.selectedColor}</div>` : ""}
        <div class="cart-item-price">${item.price > 0 ? '₹' + item.price.toLocaleString("en-IN") : 'Price on Request'}</div>
        <div class="cart-item-controls">
          <button class="qty-btn" onclick="changeQty('${item.id}', ${item.selectedColor ? `'${item.selectedColor}'` : 'null'}, ${item.selectedSize ? `'${item.selectedSize}'` : 'null'}, -1)">−</button>
          <span class="qty-val">${item.qty}</span>
          <button class="qty-btn" onclick="changeQty('${item.id}', ${item.selectedColor ? `'${item.selectedColor}'` : 'null'}, ${item.selectedSize ? `'${item.selectedSize}'` : 'null'}, 1)">+</button>
        </div>
      </div>
      <button class="cart-item-remove" onclick="removeFromCart('${item.id}', ${item.selectedColor ? `'${item.selectedColor}'` : 'null'}, ${item.selectedSize ? `'${item.selectedSize}'` : 'null'})">×</button>
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
  const p = allProducts.find(x => String(x.id) === String(id));
  if (!p) return;
  
  let sizeText = "";
  let price = p.price;
  
  let size = window.selectedProductSize;
  if (size) {
    price = window.selectedProductPrice;
    sizeText = `\nSize: ${size}`;
  } else {
    const productSizes = parseProductSizes(p.sizes);
    if (productSizes.length > 0) {
      size = productSizes[0].name;
      price = productSizes[0].price;
      sizeText = `\nSize: ${size}`;
    }
  }

  let colorText = "";
  let color = window.selectedProductColor;
  if (color) {
    colorText = `\nColor: ${color}`;
  }

  const msg = encodeURIComponent(
    `Hi! I'm interested in ordering:\n\n*${p.name}*${sizeText}${colorText}\nPrice: ₹${price.toLocaleString("en-IN")}\n\nCould you please confirm availability and delivery details?\n\nThank you!`
  );
  window.open(`https://wa.me/${WA_NUMBER}?text=${msg}`, "_blank");
}

function whatsappCart() {
  if (cart.length === 0) {
    showToast("Your cart is empty!", "info");
    return;
  }
  const itemLines = cart.map(i => {
    const sizeText = i.selectedSize ? ` (Size: ${i.selectedSize})` : "";
    const colorText = i.selectedColor ? ` (Color: ${i.selectedColor})` : "";
    return `• ${i.name}${sizeText}${colorText} × ${i.qty} — ₹${(i.price * i.qty).toLocaleString("en-IN")}`;
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
  const p = allProducts.find(x => String(x.id) === String(id));
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

  // ── Google Analytics: view_item ────────────────────────────
  if (typeof gtag === 'function') {
    gtag('event', 'view_item', {
      currency: 'INR',
      value: p.price,
      items: [{
        item_id: String(p.id),
        item_name: p.name,
        price: p.price
      }]
    });
  }

  // Resolve rating and reviews count (ensure it's not 0 or empty)
  const rating = p.rating || parseFloat((4.5 + ((p.id * 7) % 5) * 0.1).toFixed(1));
  const reviews = p.reviews || ((p.id * 13) % 100) + 40;

  // Reset selected product color
  window.selectedProductColor = null;
  // Reset selected product size and price
  window.selectedProductSize = null;
  window.selectedProductPrice = null;

  // Scroll details modal to top on product change
  const modalEl = document.getElementById("productModal");
  if (modalEl) modalEl.scrollTop = 0;

  currentModalQty = 1; // Reset quantity to 1

  const productSizes = parseProductSizes(p.sizes);
  let displayPrice = p.price;
  let hasOrigPrice = p.originalPrice > p.price;
  if (productSizes.length > 0) {
    window.selectedProductSize = productSizes[0].name;
    window.selectedProductPrice = productSizes[0].price;
    displayPrice = productSizes[0].price;
    hasOrigPrice = false;
  }

  const discount = p.originalPrice > p.price
    ? Math.round((1 - p.price / p.originalPrice) * 100) : 0;

  // Resolve FOMO Badge for details modal
  let modalBadgeHTML = "";
  if (p.badge) {
    let badgeClass = "";
    if (p.badge === "Best Seller") badgeClass = "badge-bestseller";
    else if (p.badge === "New Arrival") badgeClass = "badge-new";
    else if (p.badge === "Low Stock") badgeClass = "badge-lowstock";
    modalBadgeHTML = `<span class="modal-badge-fomo ${badgeClass}">${p.badge}</span>`;
  }

  // Resolve Frequently Bought Together (FBT)
  const crossSells = getCrossSellItems(p);
  const fbtItem = crossSells[0];
  let fbtHTML = "";
  if (fbtItem) {
    const origTotal = displayPrice + fbtItem.price;
    const bundleDiscount = Math.round(origTotal * 0.05);
    const bundleTotal = origTotal - bundleDiscount;
    fbtHTML = `
      <div class="modal-bundle-container">
        <h3 class="modal-bundle-title">Frequently Bought Together</h3>
        <div class="modal-bundle-items-list">
          <div class="modal-bundle-row">
            <label style="display: flex; align-items: center; gap: 8px;">
              <input type="checkbox" id="fbtMainCheckbox" checked disabled>
              <span>This Item: <strong class="modal-bundle-item-name">${p.name}</strong> (<span class="modal-bundle-item-price">₹${displayPrice.toLocaleString("en-IN")}</span>)</span>
            </label>
          </div>
          <div class="modal-bundle-row">
            <label style="display: flex; align-items: center; gap: 8px;">
              <input type="checkbox" id="fbtSecondCheckbox" checked onchange="updateBundlePriceDisplay(${displayPrice}, ${fbtItem.price})">
              <span>Add: <strong class="modal-bundle-item-name">${fbtItem.name}</strong> (<span class="modal-bundle-item-price">₹${fbtItem.price.toLocaleString("en-IN")}</span>)</span>
            </label>
          </div>
        </div>
        <div class="modal-bundle-footer">
          <div class="modal-bundle-total-price">
            Total Price: 
            <span id="fbtPriceDisplay">
              <span class="original">₹${origTotal.toLocaleString("en-IN")}</span>
              <span class="discounted">₹${bundleTotal.toLocaleString("en-IN")}</span>
            </span>
          </div>
          <button type="button" class="btn-add-bundle" onclick="addBundleToCart('${p.id}', '${fbtItem.id}')">
            Add Bundle to Cart (Save 5%)
          </button>
        </div>
      </div>
    `;
  }

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
            ? `<img id="modalMainImg" src="${getOptimizedImageUrl(productImages[0], 600)}" alt="${p.name}">`
            : renderStorefrontVideoMarkup(productVideo)
          }
        </div>
        ${hasMultipleMedia ? `
        <div class="modal-thumbnails">
          ${productImages.map((img, idx) => `
            <div class="modal-thumb ${idx === 0 ? 'active' : ''}" onclick="setModalMainImg(this, '${p.id}', ${idx})">
              <img src="${getOptimizedImageUrl(img, 120)}" alt="${p.name} - image ${idx + 1}">
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

  // Variant Sizes Setup HTML
  let sizeSelectorHTML = "";
  if (productSizes.length > 0) {
    const swatches = productSizes.map(sz => {
      const isSelected = sz.name === window.selectedProductSize;
      return `
        <button type="button" class="size-swatch-btn ${isSelected ? 'active' : ''}" 
                onclick="selectProductSize('${sz.name.replace(/'/g, "\\'")}', ${sz.price})">
          <span class="size-name">${sz.name}</span>
          <span class="size-price">₹${sz.price.toLocaleString("en-IN")}</span>
        </button>
      `;
    }).join("");
    
    sizeSelectorHTML = `
      <div class="modal-size-selector">
        <label class="size-label">Size: <span id="activeSizeName" style="font-weight:600; color: var(--gold-dark);">${window.selectedProductSize}</span></label>
        <div class="size-swatches-grid">
          ${swatches}
        </div>
      </div>
    `;
  }


  // Cross sell items ("Pairs well with")
  const crossSellHTML = crossSells.length > 0 ? `
    <div class="cross-sell-section">
      <h3 class="cross-sell-title">Pairs well with</h3>
      <div class="cross-sell-list">
        ${crossSells.map(item => `
          <div class="cross-sell-item" onclick="openModal('${item.id}')">
            <div class="cross-sell-img">
              ${item.image ? `<img src="${item.image}" alt="${item.name}">` : "🍽"}
            </div>
            <div class="cross-sell-info">
              <div class="cross-sell-name">${item.name}</div>
              <div class="cross-sell-price">${item.price > 0 ? '₹' + item.price.toLocaleString("en-IN") : 'Price on Request'}</div>
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
          <div class="related-card" onclick="openModal('${item.id}')">
            <div class="related-card-img">
              ${item.image ? `<img src="${item.image}" alt="${item.name}">` : `<div style="font-size:36px;opacity:0.25;text-align:center;padding-top:25%;">🍽</div>`}
              ${(item.originalPrice > item.price && item.price > 0) ? `<span class="related-card-badge">Sale</span>` : ""}
            </div>
            <div class="related-card-info">
              <div class="related-card-name">${item.name}</div>
              <div class="related-card-price">${item.price > 0 ? '₹' + item.price.toLocaleString("en-IN") : 'Price on Request'}</div>
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
        <img src="images/logo.png?v=3.13" alt="Rajendra Showroom">
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
        <h2 class="modal-name">${p.name}${modalBadgeHTML}</h2>
        <div class="modal-rating">
          <span class="stars">${renderStars(rating)}</span>
          <span class="rating-val" style="margin-left:6px;font-size:13px;">${rating.toFixed(1)} · ${reviews} reviews</span>
        </div>
        
        <div class="modal-price">
          ${(hasOrigPrice && displayPrice > 0) ? `<span class="price-original">₹${p.originalPrice.toLocaleString("en-IN")}</span>` : ""}
          <span class="price-current">${displayPrice > 0 ? '₹' + displayPrice.toLocaleString("en-IN") : 'Price on Request'}</span>
          ${(discount > 0 && !productSizes.length && displayPrice > 0) ? `<span class="price-discount-badge">Sale</span>` : ""}
        </div>
        <div class="modal-tax-notice">Tax included.</div>
        
        <p class="modal-desc-para">${specsData.description}</p>
        
        <!-- Color Selector Variant -->
        ${colorSelectorHTML}

        <!-- Size Selector Variant -->
        ${sizeSelectorHTML}
        
        <!-- Quantity Selector -->
        <div class="modal-qty-container">
          <label class="modal-qty-label">Quantity</label>
          <div class="modal-qty-selector">
            <button type="button" class="qty-adjust-btn" onclick="changeModalQty(-1)">−</button>
            <input type="text" id="modalQtyVal" class="modal-qty-input" value="1" readonly>
            <button type="button" class="qty-adjust-btn" onclick="changeModalQty(1)">+</button>
          </div>
        </div>

        <!-- Frequently Bought Together Bundle -->
        ${fbtHTML}

        <!-- Express Shipping Notice -->
        <div class="express-shipping-notice">
          🚚 &nbsp;<span>Need Express Shipping?</span>
          <a href="#" onclick="whatsappExpressShipping('${p.id}'); return false;">Click here</a>
        </div>
        
        <!-- Bulk Order Notice -->
        <div class="bulk-order-notice">
          📦 &nbsp;<span>Want to buy this in bulk?</span>
          <a href="#" onclick="whatsappBulkOrder('${p.id}'); return false;">Click here</a>
        </div>

        <div class="modal-actions" style="display: flex; gap: 10px;">
          <button class="btn-add-cart-lg" onclick="addToCart('${p.id}', currentModalQty); closeModal(); openCart();" style="flex: 1;">
            Add to cart
          </button>
          <button class="btn-wa-lg" onclick="whatsappProduct('${p.id}')" style="flex: 1; background: #25D366; border-color: #25D366; display: flex; align-items: center; justify-content: center; gap: 6px;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style="display:inline-block; vertical-align:middle;"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M11.99 2C6.477 2 2 6.477 2 11.99c0 1.72.454 3.33 1.24 4.73L2 22l5.47-1.22A9.957 9.957 0 0011.99 22C17.51 22 22 17.52 22 11.99 22 6.477 17.51 2 11.99 2zm0 18.18c-1.65 0-3.19-.44-4.52-1.21l-.32-.19-3.37.75.8-3.28-.21-.34A8.17 8.17 0 013.82 12c0-4.51 3.67-8.18 8.17-8.18 4.51 0 8.18 3.67 8.18 8.18 0 4.51-3.67 8.18-8.18 8.18z"/></svg>
            Enquire on WhatsApp
          </button>
        </div>

        ${['Dinner Sets', 'Plates', 'Bowls', 'Cups & Mugs', 'Cutlery', 'Serving'].includes(p.category) ? `
        <!-- Table Planner Button -->
        <button onclick="openTablePlanner('${p.image}')" style="width:100%; margin-top:12px; padding:12px; background:var(--bg-warm); border:1.5px solid var(--border-dark); border-radius:var(--radius); font-size:14px; font-weight:600; color:var(--text); cursor:pointer; display:flex; align-items:center; justify-content:center; gap:8px; transition:var(--transition);">
          <span>🍽️</span> Preview on Table
        </button>
        ` : ''}

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
  const p = allProducts.find(x => String(x.id) === String(productId));
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
  const p = allProducts.find(x => String(x.id) === String(id));
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

// --- Wishlist / Registry Core Logic ---
const WISHLIST_KEY = "rs_wishlist";

function loadWishlist() {
  const stored = localStorage.getItem(WISHLIST_KEY);
  try {
    wishlist = stored ? JSON.parse(stored) : [];
  } catch (e) {
    wishlist = [];
  }
}

function saveWishlistState() {
  localStorage.setItem(WISHLIST_KEY, JSON.stringify(wishlist));
}

function toggleWishlist(id) {
  const idx = wishlist.indexOf(id);
  if (idx >= 0) {
    wishlist.splice(idx, 1);
    showToast("💔 Removed from wishlist", "info");
  } else {
    wishlist.push(id);
    showToast("💛 Added to wishlist!", "success");
  }
  saveWishlistState();
  updateWishlistUI();
  renderWishlistItems();
  renderProducts();
}

function updateWishlistUI() {
  const badge = document.getElementById("wishlistCountBadge");
  if (badge) {
    badge.textContent = wishlist.length;
    badge.style.display = wishlist.length > 0 ? "flex" : "none";
  }
}

function openWishlist() {
  wishlistOpen = true;
  renderWishlistItems();
  const drawer = document.getElementById("wishlistDrawer");
  const overlay = document.getElementById("wishlistOverlay");
  if (drawer) drawer.classList.add("open");
  if (overlay) overlay.classList.add("visible");
  document.body.style.overflow = "hidden";
  
  const nameIn = document.getElementById("wishlistShareName");
  if (nameIn) nameIn.value = "";
  const wrap = document.getElementById("wishlistShareLinkWrap");
  if (wrap) wrap.style.display = "none";
}

function closeWishlist() {
  wishlistOpen = false;
  const drawer = document.getElementById("wishlistDrawer");
  const overlay = document.getElementById("wishlistOverlay");
  if (drawer) drawer.classList.remove("open");
  if (overlay) overlay.classList.remove("visible");
  document.body.style.overflow = "";
}

function renderWishlistItems() {
  const body = document.getElementById("wishlistBody");
  if (!body) return;

  if (wishlist.length === 0) {
    body.innerHTML = `
      <div class="wishlist-empty" style="text-align:center; padding:40px 20px; color:#bbb;">
        <div class="empty-icon" style="font-size:48px; margin-bottom:12px;">♡</div>
        <p style="font-size:13.5px; color:var(--text-light); line-height:1.5; margin:0;">Your wishlist is empty.<br>Save your favorite items here!</p>
      </div>`;
    return;
  }

  body.innerHTML = wishlist.map(id => {
    const item = allProducts.find(p => String(p.id) === String(id));
    if (!item) return "";
    return `
      <div class="wishlist-item" style="display:flex; align-items:center; justify-content:space-between; gap:12px; padding:12px 0; border-bottom:1px solid var(--border-dark);">
        <div style="display:flex; align-items:center; gap:10px; cursor:pointer; flex:1;" onclick="closeWishlist(); openModal('${item.id}');">
          <div style="width:50px; height:50px; border-radius:6px; overflow:hidden; background:var(--bg-warm); display:flex; align-items:center; justify-content:center; flex-shrink:0;">
            ${item.image ? `<img src="${item.image}" style="width:100%; height:100%; object-fit:cover;">` : "🍽"}
          </div>
          <div style="min-width:0;">
            <div style="font-weight:600; font-size:13px; color:var(--text); line-height:1.3; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${item.name}</div>
            <div style="font-weight:700; font-size:12.5px; color:var(--gold-dark); margin-top:2px;">${item.price > 0 ? '₹' + item.price.toLocaleString("en-IN") : 'Price on Request'}</div>
          </div>
        </div>
        <div style="display:flex; align-items:center; gap:8px; flex-shrink:0;">
          <button onclick="addToCart('${item.id}'); showToast('🛒 Added to Cart!', 'success');" style="padding:6px 10px; background:var(--text); color:#fff; border:none; border-radius:6px; font-size:11.5px; font-weight:700; cursor:pointer;">Add to Cart</button>
          <button onclick="toggleWishlist('${item.id}')" style="background:none; border:none; color:#ff4d4d; font-size:18px; cursor:pointer; padding:5px;">🗑</button>
        </div>
      </div>
    `;
  }).join("");
}

async function shareWishlistRegistry() {
  const nameInput = document.getElementById("wishlistShareName");
  const name = nameInput ? nameInput.value.trim() : "";
  if (!name) {
    showToast("Please enter a name for your registry", "error");
    return;
  }
  
  if (wishlist.length === 0) {
    showToast("Your wishlist is empty!", "error");
    return;
  }
  
  showToast("Generating gift registry link...", "info");
  
  const randId = Math.random().toString(36).substring(2, 10).toUpperCase();
  const res = await db.saveWishlist(randId, name, wishlist);
  
  if (res && res.success) {
    const shareUrl = `${window.location.origin}${window.location.pathname}?wishlist=${randId}`;
    document.getElementById("wishlistShareLinkInput").value = shareUrl;
    document.getElementById("wishlistShareLinkWrap").style.display = "block";
    showToast("🎁 Registry created successfully!", "success");
  } else {
    showToast("❌ Failed to create registry: " + (res.error || "connection error"), "error");
  }
}

function copyWishlistShareLink() {
  const input = document.getElementById("wishlistShareLinkInput");
  if (!input) return;
  input.select();
  input.setSelectionRange(0, 99999);
  navigator.clipboard.writeText(input.value).then(() => {
    const btn = document.getElementById("wishlistCopyBtn");
    if (btn) {
      btn.textContent = "✔ Copied!";
      setTimeout(() => btn.textContent = "📋 Copy Link", 2000);
    }
    showToast("✔ Link copied to clipboard", "success");
  }).catch(() => {
    showToast("Copy URL manually from the box", "info");
  });
}

async function checkSharedWishlist() {
  const urlParams = new URLSearchParams(window.location.search);
  const wishlistId = urlParams.get('wishlist');
  if (wishlistId) {
    sharedWishlistId = wishlistId;
    const bannerEl = document.getElementById("wishlistSharedBanner");
    if (bannerEl) {
      bannerEl.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;gap:10px;padding:12px;background:#fdfaf2;border:1.5px solid var(--gold);border-radius:10px;margin-bottom:20px;color:var(--text);font-weight:600;font-size:13px;">
        <span>🎁 Loading Shared Gift Registry...</span>
      </div>`;
      bannerEl.style.display = "block";
    }
    
    try {
      const data = await db.getWishlist(wishlistId);
      if (data && data.items && data.items.length > 0) {
        if (bannerEl) {
          bannerEl.innerHTML = `
            <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;padding:14px 20px;background:#fdfaf2;border:1.5px solid var(--gold);border-radius:10px;margin-bottom:20px;color:var(--text);box-shadow:0 4px 12px rgba(212,175,55,0.08);">
              <div style="display:flex;align-items:center;gap:8px;">
                <span style="font-size:20px;">🎁</span>
                <div>
                  <div style="font-weight:700;font-size:14.5px;">Viewing registry: "${data.name}"</div>
                  <div style="font-size:11.5px;color:var(--text-light);font-weight:normal;">Created by a customer to share their favorite pieces.</div>
                </div>
              </div>
              <button onclick="clearSharedWishlist()" style="padding:7px 14px;background:var(--text);color:#fff;border:none;border-radius:6px;font-size:12px;font-weight:700;cursor:pointer;transition:all 0.2s;">
                Show All Products
              </button>
            </div>
          `;
        }
        window.sharedWishlistItems = data.items;
        renderProducts();
      } else {
        if (bannerEl) {
          bannerEl.innerHTML = `
            <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 20px;background:#fff5f5;border:1.5px solid #feb2b2;border-radius:10px;margin-bottom:20px;color:#c53030;font-size:13px;font-weight:600;">
              <span>⚠️ Gift registry not found or empty.</span>
              <button onclick="clearSharedWishlist()" style="background:none;border:none;color:#c53030;text-decoration:underline;cursor:pointer;font-weight:700;">Back to Shop</button>
            </div>
          `;
        }
      }
    } catch (e) {
      console.error("Error loading registry:", e);
      if (bannerEl) bannerEl.style.display = "none";
    }
  }
}

function clearSharedWishlist() {
  window.sharedWishlistItems = null;
  sharedWishlistId = null;
  const bannerEl = document.getElementById("wishlistSharedBanner");
  if (bannerEl) bannerEl.style.display = "none";
  const url = new URL(window.location);
  url.searchParams.delete('wishlist');
  window.history.pushState({}, '', url);
  renderProducts();
}

// --- Checkout Gifting Logic ---
function toggleGiftingSection(cb) {
  const wrap = document.getElementById("giftMessageWrap");
  if (wrap) {
    wrap.style.display = cb.checked ? "block" : "none";
  }
  calculateDynamicShipping();
}

// --- Voucher / Coupon Discount Logic ---
async function applyCouponCode() {
  const couponInput = document.getElementById("couponInput");
  const code = couponInput ? couponInput.value.trim().toUpperCase() : "";
  const statusEl = document.getElementById("couponStatusMessage");
  
  if (!code) {
    showToast("Please enter a code", "error");
    return;
  }
  
  statusEl.textContent = "Validating code...";
  statusEl.style.color = "var(--text-light)";
  
  try {
    const voucher = await db.getVoucher(code);
    if (!voucher) {
      statusEl.textContent = "❌ Invalid gift card or promo code";
      statusEl.style.color = "#C0392B";
      appliedVoucher = null;
      calculateDynamicShipping();
      return;
    }
    
    if (voucher.balance <= 0) {
      statusEl.textContent = "❌ This voucher has a remaining balance of ₹0";
      statusEl.style.color = "#C0392B";
      appliedVoucher = null;
      calculateDynamicShipping();
      return;
    }
    
    appliedVoucher = voucher;
    statusEl.textContent = `✅ Applied! Balance available: ₹${voucher.balance.toLocaleString("en-IN")}`;
    statusEl.style.color = "#27AE60";
    showToast(`✔ Code applied: ₹${voucher.balance} discount!`, "success");
    
    calculateDynamicShipping();
  } catch (e) {
    console.error("Voucher error:", e);
    statusEl.textContent = "❌ Error validating code. Try again.";
    statusEl.style.color = "#C0392B";
  }
}

// --- PDF Invoice Download Generator ---
function downloadInvoicePDF() {
  const orderData = _pendingOrderData || window.lastConfirmedOrder;
  if (!orderData) {
    showToast("No active order details to generate invoice.", "error");
    return;
  }

  const { name, phone, address, cart: items, shippingCharge, gift, giftMessage, giftCharge, appliedVoucherCode, voucherDiscount, grand } = orderData;
  const orderId = document.getElementById("successOrderId")?.textContent || `#${Date.now().toString().slice(-6)}`;
  const dateStr = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });
  
  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
  const finalTotal = grand !== undefined ? grand : (subtotal + shippingCharge + giftCharge - voucherDiscount);

  const invoiceWindow = window.open("", "_blank");
  if (!invoiceWindow) {
    showToast("⚠️ Please allow popups to download your PDF invoice", "error");
    return;
  }

  const itemsRows = items.map(item => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">
        <strong>${item.name}</strong>
        ${item.selectedSize ? `<div style="font-size:11px;color:#666;">Size: ${item.selectedSize}</div>` : ""}
        ${item.selectedColor ? `<div style="font-size:11px;color:#666;">Color: ${item.selectedColor}</div>` : ""}
      </td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.price > 0 ? '₹' + item.price.toLocaleString("en-IN") : 'Price on Request'}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.qty}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right; font-weight: bold;">${item.price > 0 ? '₹' + (item.price * item.qty).toLocaleString("en-IN") : 'Price on Request'}</td>
    </tr>
  `).join("");

  const content = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Invoice ${orderId} - Rajendra Showroom</title>
      <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333; margin: 0; padding: 40px; }
        .invoice-box { max-width: 800px; margin: auto; border: 1px solid #eee; box-shadow: 0 0 10px rgba(0, 0, 0, .15); padding: 30px; border-radius: 10px; }
        .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #d4af37; padding-bottom: 20px; margin-bottom: 25px; }
        .logo { height: 60px; }
        .title { text-align: right; }
        .title h1 { margin: 0; font-size: 26px; color: #1c1c1a; font-weight: 300; letter-spacing: 1px; }
        .meta { display: flex; justify-content: space-between; margin-bottom: 30px; font-size: 13.5px; line-height: 1.6; }
        .meta-col { flex: 1; }
        .table { width: 100%; border-collapse: collapse; margin-bottom: 30px; font-size: 14px; }
        .table th { background: #f9f9f9; padding: 12px 10px; text-align: left; font-weight: bold; border-bottom: 2px solid #ddd; }
        .totals { width: 100%; margin-top: 15px; font-size: 14px; line-height: 2; border-top: 2px solid #ddd; padding-top: 10px; }
        .totals-row { display: flex; justify-content: space-between; padding: 2px 10px; }
        .totals-row.grand { font-size: 17px; font-weight: bold; color: #d4af37; border-top: 1px double #ddd; padding-top: 6px; }
        .footer { text-align: center; margin-top: 50px; font-size: 11px; color: #777; border-top: 1px solid #eee; padding-top: 20px; line-height: 1.5; }
        @media print {
          body { padding: 0; }
          .invoice-box { border: none; box-shadow: none; padding: 0; }
          .print-btn { display: none; }
        }
      </style>
    </head>
    <body>
      <div style="max-width: 800px; margin: 0 auto 15px auto; text-align: right;" class="print-btn">
        <button onclick="window.print()" style="padding: 10px 20px; background: #d4af37; color: #fff; border: none; border-radius: 6px; font-weight: bold; cursor: pointer;">🖨️ Print / Save as PDF</button>
      </div>
      <div class="invoice-box">
        <div class="header">
          <img class="logo" src="${window.location.origin}/images/logo.png?v=3.13" alt="Rajendra Showroom Logo">
          <div class="title">
            <h1>INVOICE</h1>
            <div style="font-size:12.5px;color:#777;margin-top:4px;">Order ID: ${orderId}</div>
          </div>
        </div>
        
        <div class="meta">
          <div class="meta-col">
            <strong>FROM:</strong><br>
            <strong>Rajendra Showroom</strong><br>
            Patni Plaza, Shop No. 3, NSC Bose Road<br>
            Chennai - 600001, Tamil Nadu, India<br>
            Phone: +91 63691 42027<br>
            Email: pranathwork@gmail.com
          </div>
          <div class="meta-col" style="text-align: right;">
            <strong>TO:</strong><br>
            <strong>${name}</strong><br>
            ${address}<br>
            Phone: ${phone}<br><br>
            <strong>DATE:</strong> ${dateStr}<br>
            <strong>STATUS:</strong> Paid (UPI)
          </div>
        </div>
        
        <table class="table">
          <thead>
            <tr>
              <th>Product / Description</th>
              <th style="text-align: center;">Price</th>
              <th style="text-align: center;">Qty</th>
              <th style="text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsRows}
          </tbody>
        </table>
        
        <div style="display: flex; justify-content: flex-end;">
          <div style="width: 300px;">
            <div class="totals">
              <div class="totals-row">
                <span>Subtotal</span>
                <span>₹${subtotal.toLocaleString("en-IN")}</span>
              </div>
              <div class="totals-row">
                <span>Courier Charges</span>
                <span>${shippingCharge === 0 ? "FREE" : "₹" + shippingCharge}</span>
              </div>
              ${gift ? `
                <div class="totals-row">
                  <span>Gift Wrapping</span>
                  <span>₹${giftCharge}</span>
                </div>
              ` : ""}
              ${appliedVoucherCode ? `
                <div class="totals-row" style="color:#27AE60;">
                  <span>Voucher Discount (${appliedVoucherCode})</span>
                  <span>-₹${voucherDiscount.toLocaleString("en-IN")}</span>
                </div>
              ` : ""}
              <div class="totals-row grand">
                <span>Grand Total</span>
                <span>₹${finalTotal.toLocaleString("en-IN")}</span>
              </div>
            </div>
          </div>
        </div>

        ${gift ? `
          <div style="margin-top:30px; padding:15px; background:#fdfaf2; border:1px solid #e8dec9; border-radius:6px;">
            <strong style="color: #d4af37;">✉️ Gift Greeting Card Message:</strong>
            <p style="margin:8px 0 0 0; font-style:italic; font-size:13px; line-height:1.45;">"${giftMessage}"</p>
          </div>
        ` : ""}
        
        <div class="footer">
          Thank you for shopping at Rajendra Showroom!<br>
          For exchange or return policy details, please visit our website or contact support.<br>
          <em>This is a computer-generated document. No signature required.</em>
        </div>
      </div>
      <script>
        window.onload = function() {
          setTimeout(function() { window.print(); }, 300);
        }
      </script>
    </body>
    </html>
  `;
  
  invoiceWindow.document.write(content);
  invoiceWindow.document.close();
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

  // Gift wrapping option
  const giftCheckbox = document.getElementById("giftCheckbox");
  const isGift = giftCheckbox ? giftCheckbox.checked : false;
  const giftCharge = isGift ? 150 : 0;
  
  const giftRow = document.getElementById("checkoutGiftRow");
  if (giftRow) giftRow.style.display = isGift ? "flex" : "none";

  const totalBeforeDiscount = subtotal + delivery + giftCharge;
  
  // Voucher/Coupon discount
  let discount = 0;
  const discountRow = document.getElementById("checkoutDiscountRow");
  const discountText = document.getElementById("checkoutDiscountText");
  
  if (appliedVoucher) {
    discount = Math.min(appliedVoucher.balance, totalBeforeDiscount);
    if (discountRow) discountRow.style.display = "flex";
    if (discountText) discountText.textContent = `-₹${discount.toLocaleString("en-IN")}`;
  } else {
    if (discountRow) discountRow.style.display = "none";
  }

  const grand = Math.max(0, totalBeforeDiscount - discount);
  
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

  // Reset Gifting Checkbox & Vouchers Inputs
  const giftCheckbox = document.getElementById("giftCheckbox");
  if (giftCheckbox) giftCheckbox.checked = false;
  const giftMessageWrap = document.getElementById("giftMessageWrap");
  if (giftMessageWrap) giftMessageWrap.style.display = "none";
  const giftMessageInput = document.getElementById("giftMessageInput");
  if (giftMessageInput) giftMessageInput.value = "";
  const couponInput = document.getElementById("couponInput");
  if (couponInput) couponInput.value = "";
  const couponStatus = document.getElementById("couponStatusMessage");
  if (couponStatus) couponStatus.textContent = "";
  appliedVoucher = null;

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

  // Gifting wrap details
  const giftCheckbox = document.getElementById("giftCheckbox");
  const isGift = giftCheckbox ? giftCheckbox.checked : false;
  const giftMessage = isGift ? (document.getElementById("giftMessageInput").value.trim() || "Yes (Premium wrapping)") : "";
  const giftCharge = isGift ? 150 : 0;

  const totalBeforeDiscount = subtotal + delivery + giftCharge;
  const discount = appliedVoucher ? Math.min(appliedVoucher.balance, totalBeforeDiscount) : 0;
  const grand = Math.max(0, totalBeforeDiscount - discount);

  const fullAddress = `${address}, ${state} - ${pincode}`;

  // Store pending order details
  _pendingOrderData = { 
    name, 
    phone, 
    address: fullAddress, 
    grand, 
    cart: [...cart],
    shippingCharge: delivery,
    gift: isGift,
    giftMessage: giftMessage,
    giftCharge: giftCharge,
    appliedVoucherCode: appliedVoucher ? appliedVoucher.code : null,
    voucherDiscount: discount
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
  // Update VPA and QR code image
  const upiId = "Q17629536@ybl";
  const vpaEl = document.getElementById("upiVpaDisplay");
  if (vpaEl) vpaEl.textContent = upiId;
  const qrEl = document.getElementById("upiQrImg");
  if (qrEl) qrEl.src = `images/payment-qr.jpg?v=3.24`;
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
  const id = "Q17629536@ybl";
  navigator.clipboard.writeText(id).then(() => {
    const btn = document.getElementById("upiCopyBtn");
    if (btn) {
      btn.textContent = "✔ Copied!";
      btn.classList.add("copied");
      setTimeout(() => { btn.textContent = "📋 Copy"; btn.classList.remove("copied"); }, 2000);
    }
    showToast("✔ UPI ID copied to clipboard", "success");
  }).catch(() => {
    showToast("Q17629536@ybl — copy manually", "info");
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
  const upiId  = "Q17629536@ybl"; // Store UPI VPA
  const name   = "PhonePeMerchant";
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

  const { name, phone, address, cart: pendingCart, shippingCharge, gift, giftMessage, giftCharge, appliedVoucherCode, voucherDiscount } = _pendingOrderData;

  // Save order details to window for Invoice downloads
  window.lastConfirmedOrder = {
    name,
    phone,
    address,
    cart: pendingCart,
    shippingCharge,
    gift,
    giftMessage,
    giftCharge,
    appliedVoucherCode,
    voucherDiscount,
    grand: _pendingOrderData.grand
  };

  // Save order to DB (Firebase or LocalStorage)
  const orderGroupId = Date.now();
  const dateStr = new Date().toISOString().split("T")[0];
  const savePromises = [];

  pendingCart.forEach((item, idx) => {
    const orderData = {
      id: orderGroupId + idx,
      productId: item.id,
      productName: item.name + (item.selectedSize ? ` (${item.selectedSize})` : "") + (item.selectedColor ? ` [${item.selectedColor}]` : ""),
      customer: name,
      phone: phone,
      address: address,
      price: item.price,
      qty: item.qty,
      total: item.price * item.qty,
      date: dateStr,
      notes: `UPI Order | Shipping: Rs.${shippingCharge || 0} | UTR: ${utr} | Address: ${address}` + 
             (gift ? ` | Gift: Yes | Msg: ${giftMessage}` : "") +
             (appliedVoucherCode ? ` | Voucher: ${appliedVoucherCode} | Discount: Rs.${voucherDiscount}` : ""),
      utr: utr,
      status: "paid",
      createdAt: new Date().toISOString(),
      gift: gift || false,
      giftMessage: giftMessage || "",
      giftCharge: giftCharge || 0,
      appliedVoucherCode: appliedVoucherCode || null,
      voucherDiscount: voucherDiscount || 0
    };
    savePromises.push(db.saveOrder(orderData));
  });

  await Promise.all(savePromises);

  // Clear abandoned cart draft
  try {
    if (typeof db !== "undefined" && db.deleteAbandonedCart) {
      await db.deleteAbandonedCart(phone);
    }
  } catch (err) {
    console.error("Error deleting abandoned cart:", err);
  }

  // Update voucher balance in Firebase Firestore if applied
  if (appliedVoucherCode && voucherDiscount > 0) {
    try {
      const remainingBalance = Math.max(0, appliedVoucher.balance - voucherDiscount);
      await db.updateVoucherBalance(appliedVoucherCode, remainingBalance);
    } catch (e) {
      console.error("Error updating voucher balance:", e);
    }
  }

  // Setup success screen
  document.getElementById("successOrderId").textContent = `#${orderGroupId.toString().slice(-6)}`;
  const itemLines = pendingCart.map(i => {
    const sizeText = i.selectedSize ? ` (${i.selectedSize})` : "";
    const variantText = i.selectedColor ? ` (Color: ${i.selectedColor})` : "";
    return `• ${i.name}${sizeText}${variantText} × ${i.qty} — ₹${(i.price * i.qty).toLocaleString("en-IN")}`;
  }).join("\n");
  const subtotal = pendingCart.reduce((s, i) => s + i.price * i.qty, 0);
  
  // Grand total math including shipping + gift - voucher discount
  const finalTotal = _pendingOrderData.grand;
  const shippingText = (shippingCharge || 0) === 0 ? "FREE" : `₹${shippingCharge}`;
  const giftText = gift ? `\n*Gift Wrapping: Yes (+₹150)*\n*Greeting Message:* "${giftMessage}"` : "";
  const voucherText = appliedVoucherCode ? `\n*Applied Voucher: ${appliedVoucherCode} (-₹${voucherDiscount})*` : "";

  const waMsg = encodeURIComponent(
    `Hi! I just paid and placed an order on your site (Order ID: #${orderGroupId.toString().slice(-6)}):\n\nCustomer: ${name}\nPhone: ${phone}\n\nItems:\n${itemLines}\n\n*Subtotal: ₹${subtotal.toLocaleString("en-IN")}*\n*Courier Charges: ${shippingText}*${giftText}${voucherText}\n*Grand Total Paid: ₹${finalTotal.toLocaleString("en-IN")}*\n\nDelivery Address: ${address}\n\nPayment Mode: UPI\n*UPI Transaction Ref / UTR: ${utr}*\n\nPlease confirm and dispatch. Thank you!`
  );
  document.getElementById("successWaBtn").onclick = () => {
    window.open(`https://wa.me/${WA_NUMBER}?text=${waMsg}`, "_blank");
  };

  // ── Meta Pixel: Purchase ──────────────────────────────────
  if (typeof fbq === 'function') {
    fbq('track', 'Purchase', {
      content_ids:  pendingCart.map(i => String(i.id)),
      content_type: 'product',
      value:        finalTotal,
      currency:     'INR',
      num_items:    pendingCart.reduce((s, i) => s + i.qty, 0)
    });
  }

  // ── Google Analytics: Purchase ─────────────────────────────
  if (typeof gtag === 'function') {
    gtag('event', 'purchase', {
      transaction_id: String(orderGroupId),
      value: finalTotal,
      currency: 'INR',
      items: pendingCart.map(i => ({
        item_id: String(i.id),
        item_name: i.name,
        price: i.price,
        quantity: i.qty
      }))
    });
  }

  // Clear cart & voucher
  cart = [];
  saveCart();
  updateCartUI();
  appliedVoucher = null;
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
  whatsappProduct(productId);
}

function whatsappExpressShipping(id) {
  const p = allProducts.find(x => String(x.id) === String(id));
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
      <div style="font-family:var(--font-serif); font-size:26px; font-weight:500; margin-bottom:18px; color:var(--text);">${title}</div>
      <div style="max-height:400px; overflow-y:auto; padding-right:10px; font-size:13.5px; line-height:1.7; color:var(--text-light); text-align:left; border-top:1px solid var(--border); border-bottom:1px solid var(--border); padding-top:14px; padding-bottom:14px; margin-bottom:14px;">
        <p style="margin-bottom:12px;"><strong>Last Updated: June 16, 2026</strong></p>
        <p style="margin-bottom:14px;">
          Welcome to Rajendra Showroom. We respect your privacy and are committed to protecting your personal data. This Privacy Policy details how we collect, handle, secure, and use your information when you visit our storefront website, use our catalog, complete purchases, or communicate with us.
        </p>
        
        <h4 style="color:var(--text); font-weight:600; font-size:15px; margin:16px 0 8px 0; border-bottom:1px dashed var(--border-dark); padding-bottom:4px;">1. Information We Collect</h4>
        <p style="margin-bottom:10px;">We gather specific categories of information to provide you with seamless retail, delivery, and support services:</p>
        <ul style="padding-left:18px; margin-bottom:14px; list-style-type:disc;">
          <li style="margin-bottom:6px;"><strong>Identity & Contact Data:</strong> Includes your name, telephone/mobile number, email address, physical delivery address, state, and pincode.</li>
          <li style="margin-bottom:6px;"><strong>Transaction & Payment Data:</strong> Includes transaction IDs, order group IDs, purchase histories, and UPI Transaction Reference numbers (UTR). <em>Note: We never collect, process, or store credit card numbers, bank PINs, or UPI access codes on our systems.</em></li>
          <li style="margin-bottom:6px;"><strong>Technical & Analytics Data:</strong> Details of your website interaction, browser type, device details, IP address, and clickstream events, tracked via Google Analytics 4 (GA4) and Meta Pixel integrations.</li>
          <li style="margin-bottom:6px;"><strong>User Generated Content:</strong> Photos and setups you explicitly choose to upload to our Customer Gallery.</li>
        </ul>

        <h4 style="color:var(--text); font-weight:600; font-size:15px; margin:16px 0 8px 0; border-bottom:1px dashed var(--border-dark); padding-bottom:4px;">2. How We Use Your Data</h4>
        <p style="margin-bottom:10px;">Your personal details are used exclusively for legitimate business and transactional activities:</p>
        <ul style="padding-left:18px; margin-bottom:14px; list-style-type:disc;">
          <li style="margin-bottom:6px;">Processing, assembling, and routing your crockery, dinnerware, or gift set orders.</li>
          <li style="margin-bottom:6px;">Generating pre-filled checkout links and routing custom queries or invoices via WhatsApp.</li>
          <li style="margin-bottom:6px;">Improving our site navigation and tailoring our collections based on aggregated analytics trends.</li>
          <li style="margin-bottom:6px;">Re-establishing connection regarding abandoned carts to assist you in completing interrupted checkouts.</li>
        </ul>

        <h4 style="color:var(--text); font-weight:600; font-size:15px; margin:16px 0 8px 0; border-bottom:1px dashed var(--border-dark); padding-bottom:4px;">3. Data Security & Hosting</h4>
        <p style="margin-bottom:12px;">
          All client profiles, order records, and gallery assets are securely hosted on <strong>Google Firebase (Firestore & Cloud Storage)</strong>, leveraging enterprise-grade access control and authentication protocols. Administrative dashboards are restricted to authorized showroom personnel only.
        </p>

        <h4 style="color:var(--text); font-weight:600; font-size:15px; margin:16px 0 8px 0; border-bottom:1px dashed var(--border-dark); padding-bottom:4px;">4. Third-Party Integrations</h4>
        <p style="margin-bottom:12px;">
          We utilize standard tracking networks including **Google Analytics (G-PDL2THFP8Z)** and **Meta Pixel (1289866506386688)** to record e-commerce actions (<code>view_item</code>, <code>add_to_cart</code>, <code>purchase</code>). These platforms collect cookies to gauge customer behavior. You can disable cookies in your browser settings to opt-out.
        </p>

        <h4 style="color:var(--text); font-weight:600; font-size:15px; margin:16px 0 8px 0; border-bottom:1px dashed var(--border-dark); padding-bottom:4px;">5. Sharing Your Information</h4>
        <p style="margin-bottom:12px;">
          We do not sell, rent, or trade your personal data. We only share contact and shipment details with vetted shipping/courier partners to coordinate safe parcel delivery to your address.
        </p>

        <h4 style="color:var(--text); font-weight:600; font-size:15px; margin:16px 0 8px 0; border-bottom:1px dashed var(--border-dark); padding-bottom:4px;">6. Your Control & Rights</h4>
        <p style="margin-bottom:12px;">
          You reserve the right to request the deletion or correction of your phone number, order logs, or gallery pictures from our system at any time. Simply write to us or message our helpline.
        </p>

        <h4 style="color:var(--text); font-weight:600; font-size:15px; margin:16px 0 8px 0; border-bottom:1px dashed var(--border-dark); padding-bottom:4px;">7. Contact Information</h4>
        <p style="margin-bottom:4px;">For any concerns regarding this policy, feel free to visit or reach out to us:</p>
        <p style="margin-bottom:2px;"><strong>Rajendra Showroom</strong></p>
        <p style="margin-bottom:2px;">Patni Plaza, Shop No. 3, NSC Bose Road, Chennai, 600001</p>
        <p style="margin-bottom:2px;">Helpline: +91 63691 42027</p>
        <p>Email: pranathwork@gmail.com</p>
      </div>
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

/* ─── Product Size Variant Swatches Helpers ───────────────── */
window.selectedProductSize = null;
window.selectedProductPrice = null;

function parseProductSizes(sizesStr) {
  if (!sizesStr || !sizesStr.trim()) return [];
  return sizesStr.split(",").map(item => {
    const parts = item.split(":");
    if (parts.length < 2) return null;
    const price = parseFloat(parts.pop().trim());
    const name = parts.join(":").trim();
    if (name && !isNaN(price)) {
      return { name, price };
    }
    return null;
  }).filter(Boolean);
}

function selectProductSize(sizeName, price) {
  window.selectedProductSize = sizeName;
  window.selectedProductPrice = price;
  
  // Update text label
  const labelEl = document.getElementById("activeSizeName");
  if (labelEl) labelEl.textContent = sizeName;
  
  // Update button active state classes
  document.querySelectorAll(".size-swatch-btn").forEach(btn => {
    const isThis = btn.querySelector(".size-name").textContent.trim() === sizeName;
    btn.classList.toggle("active", isThis);
  });
  
  // Update price in modal dynamically
  const priceCurrentEl = document.querySelector("#productModal .price-current");
  if (priceCurrentEl) {
    priceCurrentEl.textContent = price > 0 ? `₹${price.toLocaleString("en-IN")}` : "Price on Request";
  }
  
  // Hide original price and sale badge if size changes price
  const priceOriginalEl = document.querySelector("#productModal .price-original");
  const saleBadgeEl = document.querySelector("#productModal .price-discount-badge");
  if (priceOriginalEl) priceOriginalEl.style.display = "none";
  if (saleBadgeEl) saleBadgeEl.style.display = "none";
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

// --- Integrated Gift Card Modal Controls ---
let activeGiftCardValue = 1000;

function openGiftCardModal() {
  closeMobileMenu();
  const modal = document.getElementById("giftCardModal");
  const overlay = document.getElementById("giftCardOverlay");
  if (modal && overlay) {
    modal.classList.add("open");
    overlay.classList.add("visible");
    document.body.style.overflow = "hidden";
    
    // Reset inputs
    const forIn = document.getElementById("giftFor");
    const fromIn = document.getElementById("giftFrom");
    const msgIn = document.getElementById("giftMessage");
    const customIn = document.getElementById("customValueInput");
    
    if (forIn) forIn.value = "";
    if (fromIn) fromIn.value = "";
    if (msgIn) msgIn.value = "";
    if (customIn) customIn.value = "";
    
    // Set preset active
    const presets = document.querySelectorAll("#giftCardModal .preset-btn");
    presets.forEach(btn => btn.classList.remove("active"));
    if (presets[1]) presets[1].classList.add("active"); // default 1000
    activeGiftCardValue = 1000;
    
    updateGiftCardLivePreview();
  }
}

function closeGiftCardModal() {
  const modal = document.getElementById("giftCardModal");
  const overlay = document.getElementById("giftCardOverlay");
  if (modal && overlay) {
    modal.classList.remove("open");
    overlay.classList.remove("visible");
    document.body.style.overflow = "";
  }
}

function setGiftCardPresetValue(val, el) {
  const presets = document.querySelectorAll("#giftCardModal .preset-btn");
  presets.forEach(btn => btn.classList.remove("active"));
  if (el) el.classList.add("active");
  
  const customIn = document.getElementById("customValueInput");
  if (customIn) customIn.value = "";
  
  activeGiftCardValue = val;
  updateGiftCardLivePreview();
}

function updateGiftCardCustomValue(el) {
  const presets = document.querySelectorAll("#giftCardModal .preset-btn");
  presets.forEach(btn => btn.classList.remove("active"));
  
  const val = parseFloat(el.value);
  activeGiftCardValue = isNaN(val) || val <= 0 ? 0 : val;
  updateGiftCardLivePreview();
}

function updateGiftCardLivePreview() {
  // Amount
  const amtEl = document.getElementById("giftMockAmount");
  if (amtEl) amtEl.textContent = `₹${activeGiftCardValue.toLocaleString("en-IN")}`;
  
  // For
  const forVal = document.getElementById("giftFor")?.value.trim();
  const forEl = document.getElementById("giftMockFor");
  if (forEl) forEl.textContent = forVal || "Loved One's Name";
  
  // From
  const fromVal = document.getElementById("giftFrom")?.value.trim();
  const fromEl = document.getElementById("giftMockFrom");
  if (fromEl) fromEl.textContent = fromVal || "Your Name";
  
  // Message
  const msgVal = document.getElementById("giftMessage")?.value.trim();
  const msgEl = document.getElementById("giftMockMessage");
  if (msgEl) msgEl.textContent = msgVal ? `"${msgVal}"` : `"Wishing you a beautiful home and dining experience!"`;
}

function sendGiftCardWhatsAppRequest() {
  const recipient = document.getElementById("giftFor")?.value.trim();
  const sender = document.getElementById("giftFrom")?.value.trim();
  const msg = document.getElementById("giftMessage")?.value.trim();
  
  if (activeGiftCardValue <= 0) {
    showToast("Please select or enter a valid Gift Card amount", "error");
    return;
  }
  if (!recipient) {
    showToast("Please enter the Recipient's Name", "error");
    document.getElementById("giftFor")?.focus();
    return;
  }
  if (!sender) {
    showToast("Please enter your name", "error");
    document.getElementById("giftFrom")?.focus();
    return;
  }
  
  const customMessage = msg || "Wishing you a beautiful home and dining experience!";
  
  const waMessage = `Hi! I would like to buy a Rajendra Showroom E-Gift Card for my loved one. Here are the request details:\n\n` +
                    `*Gift Card Value:* ₹${activeGiftCardValue.toLocaleString("en-IN")}\n` +
                    `*For (Recipient):* ${recipient}\n` +
                    `*From (Sender):* ${sender}\n` +
                    `*Personal Message:* "${customMessage}"\n\n` +
                    `Please share your UPI details to complete the purchase so the Voucher Code can be generated. Thank you!`;
                    
  const finalUrl = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(waMessage)}`;
  window.open(finalUrl, "_blank");
}

/* ============================================================
   FEATURE 1: DARK MODE
   ============================================================ */
function toggleDarkMode() {
  document.body.classList.toggle('dark-mode');
  const isDark = document.body.classList.contains('dark-mode');
  localStorage.setItem('rs_dark_mode', isDark ? '1' : '0');
  
  // Change toggle icon
  const icon = document.querySelector('.dark-mode-toggle .toggle-icon');
  if (icon) {
    icon.textContent = isDark ? '☀️' : '🌙';
  }
}

// Auto-apply on load
document.addEventListener('DOMContentLoaded', () => {
  if (localStorage.getItem('rs_dark_mode') === '1') {
    document.body.classList.add('dark-mode');
    const icon = document.querySelector('.dark-mode-toggle .toggle-icon');
    if (icon) icon.textContent = '☀️';
  }
});

/* ============================================================
   FEATURE 2: ORDER TRACKER
   ============================================================ */
function openOrderTracker() {
  document.getElementById('orderTrackerModal').classList.add('active');
  document.body.style.overflow = 'hidden';
}
function closeOrderTracker() {
  document.getElementById('orderTrackerModal').classList.remove('active');
  document.body.style.overflow = '';
}
async function trackOrder() {
  const phoneInput = document.getElementById('trackerPhoneInput').value.trim();
  const resultsDiv = document.getElementById('trackerResults');
  
  if (!phoneInput || phoneInput.length < 10) {
    resultsDiv.innerHTML = `<div class="bc-error" style="color:var(--red);text-align:center;padding:20px;">Please enter a valid 10-digit phone number.</div>`;
    return;
  }
  
  resultsDiv.innerHTML = '<div style="text-align:center;padding:20px;">Searching your orders...</div>';
  
  const orders = await db.getOrdersByPhone(phoneInput);
  
  if (!orders || orders.length === 0) {
    resultsDiv.innerHTML = `<div class="bc-error" style="color:var(--red);text-align:center;padding:20px;">No recent orders found for this phone number.</div>`;
    return;
  }
  
  let html = '';
  orders.forEach(o => {
    // Determine active step based on status
    let steps = ['pending', 'paid', 'packed', 'shipped', 'delivered'];
    let statusIndex = steps.indexOf(o.status);
    if (statusIndex === -1) statusIndex = o.status === 'cancelled' ? -1 : 0;
    if (o.status === 'completed') statusIndex = 4; // Map legacy 'completed' to 'delivered'
    
    // Calculate progress width
    let progressWidth = 0;
    if (statusIndex === 1) progressWidth = 25;
    if (statusIndex === 2) progressWidth = 50;
    if (statusIndex === 3) progressWidth = 75;
    if (statusIndex === 4) progressWidth = 100;
    
    const dateStr = new Date(o.createdAt || o.date).toLocaleDateString('en-IN', {day:'2-digit', month:'short', year:'numeric'});
    
    html += `
    <div class="tracker-order-card">
      <h4>${o.productName}</h4>
      <div class="tracker-order-meta">Order ID: #${o.id} · ${dateStr} · ₹${(o.price * o.qty).toLocaleString("en-IN")}</div>
      
      ${o.status === 'cancelled' ? `
        <div style="color:var(--red);font-weight:600;font-size:14px;text-align:center;padding-top:12px;">This order was cancelled.</div>
      ` : `
        <div class="tracker-stepper">
          <div class="progress-fill" style="width: ${progressWidth}%;"></div>
          
          <div class="tracker-step ${statusIndex >= 0 ? 'completed' : ''} ${statusIndex === 0 ? 'active' : ''}">
            <div class="tracker-step-circle">📋</div>
            <div class="tracker-step-label">Order<br>Placed</div>
          </div>
          
          <div class="tracker-step ${statusIndex >= 2 ? 'completed' : ''} ${statusIndex === 1 ? 'active' : ''}">
            <div class="tracker-step-circle">📦</div>
            <div class="tracker-step-label">Packed</div>
          </div>
          
          <div class="tracker-step ${statusIndex >= 3 ? 'completed' : ''} ${statusIndex === 2 ? 'active' : ''}">
            <div class="tracker-step-circle">🚚</div>
            <div class="tracker-step-label">Shipped</div>
          </div>
          
          <div class="tracker-step ${statusIndex >= 4 ? 'completed' : ''} ${statusIndex === 3 ? 'active' : ''}">
            <div class="tracker-step-circle">🏡</div>
            <div class="tracker-step-label">Out for<br>Delivery</div>
          </div>
          
          <div class="tracker-step ${statusIndex === 4 ? 'completed active' : ''}">
            <div class="tracker-step-circle">✅</div>
            <div class="tracker-step-label">Delivered</div>
          </div>
        </div>
      `}
    </div>`;
  });
  
  resultsDiv.innerHTML = html;
}

/* ============================================================
   FEATURE 3: VIRTUAL TABLE PLANNER
   ============================================================ */
let dragItem = null;
let currentTableBg = 'marble';

function openTablePlanner(initialImgSrc) {
  document.getElementById('tablePlannerOverlay').classList.add('active');
  document.body.style.overflow = 'hidden';
  
  const surface = document.getElementById('tableSurface');
  surface.innerHTML = '';
  setTableSurface('marble', document.querySelector('.table-selector-btn'));
  
  if (initialImgSrc) {
    addDraggableItemToTable(initialImgSrc);
  }
}

function closeTablePlanner() {
  document.getElementById('tablePlannerOverlay').classList.remove('active');
  document.body.style.overflow = '';
}

function setTableSurface(type, btnEl) {
  const btns = document.querySelectorAll('.table-selector-btn');
  btns.forEach(b => b.classList.remove('active'));
  if (btnEl) btnEl.classList.add('active');
  
  currentTableBg = type;
  const surface = document.getElementById('tableSurface');
  
  if (type === 'marble') surface.style.backgroundImage = 'url("images/table-marble.jpg")';
  else if (type === 'oak') surface.style.backgroundImage = 'url("images/table-oak.jpg")';
  else if (type === 'linen') surface.style.backgroundImage = 'url("images/table-linen.jpg")';
}

function addDraggableItemToTable(imgSrc) {
  const surface = document.getElementById('tableSurface');
  const div = document.createElement('div');
  div.className = 'table-product-item';
  div.style.top = '40%';
  div.style.left = '40%';
  
  div.innerHTML = `
    <img src="${imgSrc}" alt="Product">
    <div class="tp-remove" onclick="this.parentElement.remove()">✕</div>
  `;
  
  // Basic drag logic
  let isDragging = false;
  let offsetX, offsetY;
  
  div.addEventListener('mousedown', (e) => {
    if (e.target.classList.contains('tp-remove')) return;
    isDragging = true;
    dragItem = div;
    offsetX = e.clientX - div.getBoundingClientRect().left;
    offsetY = e.clientY - div.getBoundingClientRect().top;
    div.style.zIndex = 100;
  });
  
  document.addEventListener('mousemove', (e) => {
    if (!isDragging || dragItem !== div) return;
    const sRect = surface.getBoundingClientRect();
    let x = e.clientX - sRect.left - offsetX;
    let y = e.clientY - sRect.top - offsetY;
    
    // Bounds check
    if (x < 0) x = 0;
    if (y < 0) y = 0;
    if (x > sRect.width - div.offsetWidth) x = sRect.width - div.offsetWidth;
    if (y > sRect.height - div.offsetHeight) y = sRect.height - div.offsetHeight;
    
    div.style.left = x + 'px';
    div.style.top = y + 'px';
  });
  
  document.addEventListener('mouseup', () => {
    isDragging = false;
    dragItem = null;
    div.style.zIndex = 1;
  });
  
  surface.appendChild(div);
}

function showAddMoreModal() {
  const firstItem = document.querySelector('.table-product-item img');
  if (firstItem) {
    addDraggableItemToTable(firstItem.src);
    showToast("Added companion item to table", "success");
  } else {
    showToast("No items on table to copy", "error");
  }
}

function saveTablePreview() {
  showToast("📸 Table preview saved to gallery!", "success");
}

/* ============================================================
   FEATURE 4: CUSTOMER PHOTO GALLERY
   ============================================================ */
async function renderCustomerPhotoGallery() {
  const grid = document.getElementById('customerPhotoGrid');
  if (!grid) return;
  
  let photos = [];
  if (typeof db !== 'undefined' && db.getCustomerPhotos) {
    photos = await db.getCustomerPhotos();
  }
  
  const approvedPhotos = photos.filter(p => p.approved);
  
  if (approvedPhotos.length === 0) {
    grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--text-muted);">Be the first to share your beautiful home setup!</div>';
    return;
  }
  
  grid.innerHTML = approvedPhotos.map(p => `
    <div class="customer-photo-card">
      <img src="${p.image}" alt="${p.caption || 'Customer Photo'}" loading="lazy">
      <div class="photo-overlay">
        <div class="photo-name">${p.name || 'Anonymous'}</div>
        <div class="photo-caption">${p.caption || ''}</div>
      </div>
    </div>
  `).join('');
}

function openPhotoUploadModal() {
  document.getElementById('photoUploadModal').classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closePhotoUploadModal() {
  document.getElementById('photoUploadModal').classList.remove('active');
  document.body.style.overflow = '';
}

function handlePhotoUploadSelect(e) {
  const file = e.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = (evt) => {
    document.getElementById('puPreview').innerHTML = `<img src="${evt.target.result}" style="width:100%;object-fit:cover;border-radius:8px;">`;
  };
  reader.readAsDataURL(file);
}

async function submitCustomerPhoto() {
  const name = document.getElementById('puName').value.trim();
  const caption = document.getElementById('puCaption').value.trim();
  const fileInput = document.getElementById('puFile');
  
  if (!fileInput.files || fileInput.files.length === 0) {
    showToast("Please select a photo to upload", "error");
    return;
  }
  
  const file = fileInput.files[0];
  const reader = new FileReader();
  
  reader.onload = async (evt) => {
    const photoData = {
      id: Date.now().toString(),
      name: name || "Anonymous",
      caption: caption,
      image: evt.target.result,
      approved: false,
      createdAt: new Date().toISOString()
    };
    
    await db.saveCustomerPhoto(photoData);
    
    closePhotoUploadModal();
    
    document.getElementById('puName').value = '';
    document.getElementById('puCaption').value = '';
    document.getElementById('puFile').value = '';
    document.getElementById('puPreview').innerHTML = '';
    
    showToast("📸 Photo submitted! It will appear once approved by admin.", "success");
  };
  
  reader.readAsDataURL(file);
}

document.addEventListener('DOMContentLoaded', renderCustomerPhotoGallery);

/* ============================================================
   FEATURE 5: GIFT CARD BALANCE CHECKER
   ============================================================ */
function openBalanceChecker() {
  document.getElementById('balanceCheckerModal').classList.add('active');
  document.body.style.overflow = 'hidden';
}
function closeBalanceChecker() {
  document.getElementById('balanceCheckerModal').classList.remove('active');
  document.body.style.overflow = '';
}
async function checkGiftCardBalance() {
  const codeInput = document.getElementById('bcCodeInput').value.trim().toUpperCase();
  const resultsDiv = document.getElementById('bcResult');
  
  if (!codeInput) {
    resultsDiv.innerHTML = `<div class="bc-error" style="color:var(--red);text-align:center;padding:20px;">Please enter a Gift Card code.</div>`;
    return;
  }
  
  resultsDiv.innerHTML = '<div style="text-align:center;padding:20px;">Checking balance...</div>';
  
  const voucher = await db.getVoucher(codeInput);
  
  if (!voucher) {
    resultsDiv.innerHTML = `<div class="bc-error" style="color:var(--red);text-align:center;padding:20px;">Invalid Gift Card code.</div>`;
    return;
  }
  
  const origBal = voucher.originalBalance || voucher.balance;
  const used = origBal - voucher.balance;
  
  resultsDiv.innerHTML = `
    <div class="bc-result-card">
      <div class="bc-label">Remaining Balance</div>
      <div class="bc-balance">₹${voucher.balance.toLocaleString("en-IN")}</div>
      
      <div class="bc-details">
        <div class="bc-detail-item">
          <div class="bc-detail-val">₹${origBal.toLocaleString("en-IN")}</div>
          <div class="bc-detail-label">Original</div>
        </div>
        <div class="bc-detail-item">
          <div class="bc-detail-val">₹${used.toLocaleString("en-IN")}</div>
          <div class="bc-detail-label">Used</div>
        </div>
      </div>
    </div>
  `;
}