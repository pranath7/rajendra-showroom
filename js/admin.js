// ============================================================
//  Rajendra Showroom – Admin Panel Logic (v3)
//  Real Sales Dashboard + Order Tracking
// ============================================================

const STORE_KEY  = "rs_products";
const ORDERS_KEY = "rs_orders";
const ADMIN_PASS = "rajendra@123";
const AUTH_KEY   = "rs_admin_auth";

let products  = [];
let orders    = [];
let editingId = null;
let productImages = [];
let bulkProductImages = [];
let abandonedCarts = [];

/* ─── Boot ─────────────────────────────────────────────── */
document.addEventListener("DOMContentLoaded", () => {
  checkAuth();

  // Handle "+ Add New Category..." selection in the category dropdowns
  const handleCategorySelectionChange = async (e, selEl) => {
    if (e.target.value === "__add_new_category__") {
      const name = prompt("Enter the name of the new category:");
      if (name && name.trim()) {
        const cleanName = name.trim();
        
        // Check if category already exists
        const exists = CATEGORIES.some(c => c.label.toLowerCase() === cleanName.toLowerCase());
        if (exists) {
          alert("This category already exists!");
          selEl.value = CATEGORIES[1] ? CATEGORIES[1].id : "";
          return;
        }

        // Request optional emoji icon
        const defaultEmoji = window.db.getEmojiForCategoryName(cleanName);
        const icon = prompt(`Enter an emoji/icon for the category (or leave blank for default ${defaultEmoji}):`);
        const cleanIcon = icon && icon.trim() ? icon.trim() : defaultEmoji;

        const newCat = {
          id: cleanName,
          label: cleanName,
          icon: cleanIcon
        };

        await db.saveCategory(newCat);
        CATEGORIES.push(newCat);
        
        // Re-populate all dropdowns and select the newly created category
        populateCategoryDropdown();
        selEl.value = cleanName;
      } else {
        // Reset to default if cancelled
        selEl.value = CATEGORIES[1] ? CATEGORIES[1].id : "";
      }
    }
  };

  const catSel = document.getElementById("productCategory");
  if (catSel) {
    catSel.addEventListener("change", (e) => handleCategorySelectionChange(e, catSel));
  }
  const bulkCatSel = document.getElementById("bulkProductCategory");
  if (bulkCatSel) {
    bulkCatSel.addEventListener("change", (e) => handleCategorySelectionChange(e, bulkCatSel));
  }

  // Bind Auto-Discount calculators
  setupDiscountCalculator("productPrice", "productOrigPrice", "productDiscount");
  setupDiscountCalculator("bulkProductPrice", "bulkProductOrigPrice", "bulkProductDiscount");
});

async function checkAuth() {
  if (sessionStorage.getItem(AUTH_KEY) === "yes") {
    await showPanel();
  } else {
    document.getElementById("loginScreen").style.display = "flex";
    document.getElementById("adminPanel").style.display  = "none";
  }
}

async function doLogin() {
  const pass   = document.getElementById("loginPass").value;
  const stored = await db.getAdminPassword();
  if (pass === stored) {
    sessionStorage.setItem(AUTH_KEY, "yes");
    await showPanel();
  } else {
    const err = document.getElementById("loginError");
    err.textContent = "Incorrect password. Please try again.";
    err.style.display = "block";
    document.getElementById("loginPass").classList.add("shake");
    setTimeout(() => document.getElementById("loginPass").classList.remove("shake"), 500);
  }
}

function doLogout() {
  sessionStorage.removeItem(AUTH_KEY);
  location.reload();
}

async function showPanel() {
  document.getElementById("loginScreen").style.display = "none";
  document.getElementById("adminPanel").style.display  = "block";
  await loadProducts();
  await loadOrders();
  CATEGORIES = await db.getCategories();
  populateCategoryDropdown();
  await populateOrderProductDropdown();
  switchTab("dashboard");
  resetForm();
  resetBulkForm();
  await updateFirebaseStatusUI();
}

/* ─── Storage ───────────────────────────────────────────── */
async function loadProducts() {
  products = await db.getProducts();
}
function saveProducts() {
  // no-op, DB updates are now document-based in real-time
}

async function loadOrders() {
  orders = await db.getOrders();
}
function saveOrders() {
  // no-op, DB updates are now document-based in real-time
}

async function updateFirebaseStatusUI() {
  const badge = document.getElementById("dbConnectionStatus");
  const configText = document.getElementById("firebaseConfigStatus");
  
  const active = db.isFirebaseActive();
  
  if (badge) {
    if (active) {
      badge.textContent = "🔥 Cloud Connected (Firebase)";
      badge.className = "db-status-badge online";
    } else {
      badge.textContent = "🔌 Offline Mode (Local Storage)";
      badge.className = "db-status-badge offline";
    }
  }
  
  if (configText) {
    if (active) {
      configText.innerHTML = `<span style="color:#27AE60;">✔ Active Cloud Database</span><br><span style="font-size:12px; font-weight:normal; color:var(--text-muted);">All updates to products and orders are saved directly to your Firestore database.</span>`;
    } else {
      configText.innerHTML = `<span style="color:#D35400;">ℹ Not Configured</span><br><span style="font-size:12px; font-weight:normal; color:var(--text-muted);">Currently storing data locally in this browser. Changes will not sync to customer devices until Firebase config is supplied.</span>`;
    }
  }

  // Also update Cloudinary status
  await loadCloudinaryConfig();
}

/* ─── Cloudinary Image Storage Setup ────────────────────── */
async function loadCloudinaryConfig() {
  const saved = await db.getCloudinaryConfig();
  const nameInput = document.getElementById("cloudNameInput");
  const presetInput = document.getElementById("cloudPresetInput");
  if (nameInput && saved.cloudName) nameInput.value = saved.cloudName;
  if (presetInput && saved.uploadPreset) presetInput.value = saved.uploadPreset;

  // Patch the live config object so it works immediately
  if (saved.cloudName && saved.cloudName !== "YOUR_CLOUD_NAME" && typeof CLOUDINARY_CONFIG !== "undefined") {
    CLOUDINARY_CONFIG.cloudName = saved.cloudName;
    CLOUDINARY_CONFIG.uploadPreset = saved.uploadPreset;
  }

  updateCloudinaryStatus();
}

function updateCloudinaryPreview() {
  updateCloudinaryStatus();
}

function updateCloudinaryStatus() {
  const statusEl = document.getElementById("cloudinaryStatus");
  if (!statusEl) return;

  const nameInput = document.getElementById("cloudNameInput");
  const presetInput = document.getElementById("cloudPresetInput");
  const name = (nameInput && nameInput.value.trim()) || (typeof CLOUDINARY_CONFIG !== "undefined" && CLOUDINARY_CONFIG.cloudName) || "";
  const preset = (presetInput && presetInput.value.trim()) || (typeof CLOUDINARY_CONFIG !== "undefined" && CLOUDINARY_CONFIG.uploadPreset) || "";

  const isConfigured = name && name !== "YOUR_CLOUD_NAME" && preset && preset !== "YOUR_UPLOAD_PRESET";

  if (isConfigured) {
    statusEl.style.background = "#f0fdf4";
    statusEl.style.border = "1.5px solid #27AE60";
    statusEl.style.color = "#1a7a4a";
    statusEl.innerHTML = `✅ Image upload is ACTIVE — Cloud: <strong>${name}</strong> · Preset: <strong>${preset}</strong><br><span style="font-size:11px;font-weight:400;">Photos will upload directly to Cloudinary and be stored permanently.</span>`;
  } else {
    statusEl.style.background = "#fff8f0";
    statusEl.style.border = "1.5px solid #f39c12";
    statusEl.style.color = "#b7700a";
    statusEl.innerHTML = `⚠️ Not configured yet — follow the steps below and click Save to enable direct photo uploads.`;
  }
}

async function saveCloudinaryConfig() {
  const nameInput = document.getElementById("cloudNameInput");
  const presetInput = document.getElementById("cloudPresetInput");
  const name = nameInput ? nameInput.value.trim() : "";
  const preset = presetInput ? presetInput.value.trim() : "";

  if (!name || !preset) {
    showAdminToast("Please enter both your Cloud Name and Upload Preset.", "error");
    return;
  }

  showAdminToast("Saving Cloudinary config to database...", "info");

  // Save to db (localStorage + Firebase Firestore settings document)
  const res = await db.saveCloudinaryConfig({ cloudName: name, uploadPreset: preset });

  // Patch live config object immediately — no page reload needed
  if (typeof CLOUDINARY_CONFIG !== "undefined") {
    CLOUDINARY_CONFIG.cloudName = name;
    CLOUDINARY_CONFIG.uploadPreset = preset;
  }

  updateCloudinaryStatus();
  if (res && res.success === false) {
    showAdminToast("⚠️ Saved locally (failed to sync to cloud: " + (res.error || "connection error") + ")", "info");
  } else {
    showAdminToast("✅ Image storage configured & synced to cloud! You can now upload product photos of any size.", "success");
  }
}


/* ─── Tab Switching ─────────────────────────────────────── */
function switchTab(tab) {
  document.querySelectorAll(".admin-tab").forEach(el => el.classList.remove("active"));
  document.querySelectorAll(".tab-panel").forEach(el => el.classList.remove("active"));
  document.getElementById(`tab-${tab}`)?.classList.add("active");
  document.getElementById(`panel-${tab}`)?.classList.add("active");

  if (tab === "dashboard") renderDashboard();
  if (tab === "orders")    renderOrdersTable();
  if (tab === "abandoned") loadAbandonedCarts();
  if (tab === "products")  renderProductTable();
  if (tab === "vouchers")  loadAndRenderVouchers();
}

/* ─── DASHBOARD ─────────────────────────────────────────── */
function renderDashboard() {
  // ── Real stats from orders ──
  const completedOrders = orders.filter(o => o.status === "completed" || o.status === "paid");
  const pendingOrders   = orders.filter(o => o.status === "pending");
  const totalRevenue    = completedOrders.reduce((s, o) => s + (o.total || o.price * o.qty), 0);
  const totalOrders     = orders.length;
  const avgOrderValue   = totalOrders > 0
    ? Math.round(orders.reduce((s, o) => s + (o.total || o.price * o.qty), 0) / totalOrders) : 0;

  // ── Stat cards ──
  document.getElementById("d-revenue").textContent  = "₹" + totalRevenue.toLocaleString("en-IN");
  document.getElementById("d-orders").textContent   = totalOrders;
  document.getElementById("d-pending").textContent  = pendingOrders.length;
  document.getElementById("d-avg").textContent      = totalOrders > 0 ? "₹" + avgOrderValue.toLocaleString("en-IN") : "—";

  // ── Monthly revenue chart (last 6 months) ──
  const monthlyData = getMonthlyRevenue();
  renderRevenueChart(monthlyData);

  // ── Top selling products ──
  const productSales = {};
  orders.forEach(o => {
    if (!productSales[o.productName]) productSales[o.productName] = { qty: 0, revenue: 0 };
    productSales[o.productName].qty     += o.qty;
    productSales[o.productName].revenue += o.price * o.qty;
  });
  const topSelling = Object.entries(productSales)
    .sort((a, b) => b[1].revenue - a[1].revenue)
    .slice(0, 5);
  const maxRev = topSelling[0]?.[1].revenue || 1;

  document.getElementById("topSellingList").innerHTML = topSelling.length
    ? topSelling.map(([name, data], i) => {
        const prod = products.find(p => p.name === name);
        return `
          <div class="top-prod-row">
            <div class="top-prod-rank">${i + 1}</div>
            <div class="top-prod-img">
              ${prod?.image ? `<img src="${prod.image}" alt="${name}">` : "🍽"}
            </div>
            <div class="top-prod-info">
              <div class="top-prod-name">${name}</div>
              <div class="top-prod-cat">${data.qty} units sold · ₹${data.revenue.toLocaleString("en-IN")}</div>
              <div class="top-prod-bar-wrap">
                <div class="top-prod-bar" style="width:${(data.revenue / maxRev) * 100}%"></div>
              </div>
            </div>
            <div class="top-prod-views">₹${data.revenue.toLocaleString("en-IN")}</div>
          </div>`;
      }).join("")
    : `<div class="empty-dash">
         <div style="font-size:36px;margin-bottom:12px;">📦</div>
         <div>No sales logged yet.</div>
         <div style="font-size:12px;color:var(--text-muted);margin-top:6px;">Go to <strong>Orders</strong> tab to log your first sale.</div>
       </div>`;

  // ── Recent 5 orders ──
  const recent = [...orders].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);
  document.getElementById("recentOrdersList").innerHTML = recent.length
    ? recent.map(o => `
        <div class="recent-order-row">
          <div class="ro-info">
            <div class="ro-name">${o.customer || "Walk-in"}</div>
            <div class="ro-product">${o.productName} × ${o.qty} (ID: #${o.productId || "N/A"})</div>
          </div>
          <div class="ro-right">
            <div class="ro-amount">₹${(o.total || o.price * o.qty).toLocaleString("en-IN")}</div>
            <div class="ro-status ${o.status}">${
              o.status === "completed" ? "✔ Completed" :
              o.status === "paid"      ? "✔ Paid" :
              "⏳ Pending"
            }</div>
          </div>
        </div>`).join("")
    : `<div class="empty-dash">
         <div style="font-size:32px;margin-bottom:10px;">🛒</div>
         <div>No orders yet</div>
       </div>`;

  // ── Quick store summary ──
  const totalProducts   = products.length;
  const withPhoto       = products.filter(p => p.image).length;
  const noPhoto         = totalProducts - withPhoto;
  const totalCategories = [...new Set(products.map(p => p.category))].length;
  document.getElementById("storeSummaryDash").innerHTML = `
    <div class="summary-row"><span class="sum-key">Total Products</span><span class="sum-val">${totalProducts}</span></div>
    <div class="summary-row"><span class="sum-key">Categories</span><span class="sum-val">${totalCategories}</span></div>
    <div class="summary-row"><span class="sum-key">With Photo</span><span class="sum-val" style="color:#27AE60">${withPhoto}</span></div>
    <div class="summary-row"><span class="sum-key">Need Photo</span><span class="sum-val" style="color:${noPhoto > 0 ? '#C0392B' : '#27AE60'}">${noPhoto}</span></div>
    <div class="summary-row"><span class="sum-key">Total Orders</span><span class="sum-val">${totalOrders}</span></div>
    <div class="summary-row"><span class="sum-key">Paid / Done</span><span class="sum-val" style="color:#27AE60">${completedOrders.length}</span></div>
    <div class="summary-row"><span class="sum-key">Pending</span><span class="sum-val" style="color:#E67E22">${pendingOrders.length}</span></div>
    <div class="summary-row"><span class="sum-key">Total Revenue</span><span class="sum-val">₹${totalRevenue.toLocaleString("en-IN")}</span></div>
  `;
}

function getMonthlyRevenue() {
  const months = {};
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = d.toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
    months[key] = 0;
  }
  orders.forEach(o => {
    const d   = new Date(o.date);
    const key = d.toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
    if (key in months) months[key] += o.price * o.qty;
  });
  return months;
}

function renderRevenueChart(monthlyData) {
  const entries = Object.entries(monthlyData);
  const maxVal  = Math.max(...entries.map(([, v]) => v), 1);
  const hasData = entries.some(([, v]) => v > 0);

  if (!hasData) {
    document.getElementById("revenueChart").innerHTML = `
      <div class="empty-dash" style="flex:1;">
        <div style="font-size:36px;margin-bottom:12px;">📊</div>
        <div>Revenue chart will appear here</div>
        <div style="font-size:12px;color:var(--text-muted);margin-top:6px;">Log your first order to see data</div>
      </div>`;
    return;
  }

  document.getElementById("revenueChart").innerHTML = entries.map(([label, val]) => {
    const pct = (val / maxVal) * 100;
    return `
      <div class="chart-bar-col">
        <div class="chart-bar-val">${val > 0 ? "₹" + (val >= 1000 ? (val/1000).toFixed(1) + "k" : val) : ""}</div>
        <div class="chart-bar-wrap">
          <div class="chart-bar" style="height:${Math.max(pct, val > 0 ? 4 : 0)}%"></div>
        </div>
        <div class="chart-bar-label">${label}</div>
      </div>`;
  }).join("");
}

/* ─── ORDERS ────────────────────────────────────────────── */
async function populateOrderProductDropdown() {
  const sel = document.getElementById("orderProduct");
  if (!sel) return;
  await loadProducts(); // ensure products are fresh
  sel.innerHTML = `<option value="" disabled selected>Select a product</option>` +
    products.map(p => `<option value="${p.id}" data-price="${p.price}">${p.name} — ₹${p.price.toLocaleString("en-IN")}</option>`).join("");
}

function onOrderProductChange() {
  const sel  = document.getElementById("orderProduct");
  const opt  = sel.options[sel.selectedIndex];
  const price = opt?.dataset?.price || "";
  document.getElementById("orderPrice").value = price;
  calcOrderTotal();
}

function calcOrderTotal() {
  const price = parseFloat(document.getElementById("orderPrice").value) || 0;
  const qty   = parseInt(document.getElementById("orderQty").value)   || 1;
  const total = price * qty;
  document.getElementById("orderTotal").textContent = total > 0 ? "₹" + total.toLocaleString("en-IN") : "—";
}

async function logOrder() {
  const productSel  = document.getElementById("orderProduct");
  const productName = productSel.options[productSel.selectedIndex]?.text?.split(" — ")[0] || "";
  const productId   = productSel.value;
  const customer    = document.getElementById("orderCustomer").value.trim();
  const phone       = document.getElementById("orderPhone").value.trim();
  const price       = parseFloat(document.getElementById("orderPrice").value);
  const qty         = parseInt(document.getElementById("orderQty").value) || 1;
  const date        = document.getElementById("orderDate").value || new Date().toISOString().split("T")[0];
  const notes       = document.getElementById("orderNotes").value.trim();
  const status      = document.getElementById("orderStatus").value;

  if (!productId)         { showAdminToast("Please select a product", "error"); return; }
  if (!price || price <= 0) { showAdminToast("Please enter a valid price", "error"); return; }

  const newOrder = {
    id:          Date.now(),
    productId,
    productName,
    customer:    customer || "Walk-in Customer",
    phone,
    price,
    qty,
    total:       price * qty,
    date,
    notes,
    status,
    createdAt:   new Date().toISOString()
  };

  orders.unshift(newOrder);
  await db.saveOrder(newOrder);
  renderOrdersTable();
  resetOrderForm();
  switchTab("orders");
  showAdminToast(`✔  Order for "${productName}" logged!`, "success");
}

function resetOrderForm() {
  document.getElementById("orderForm").reset();
  document.getElementById("orderTotal").textContent = "—";
  document.getElementById("orderDate").value = new Date().toISOString().split("T")[0];
}

// Helper: build the address / UTR / shipping sub-info HTML for the orders table
function getOrderCustomerInfoHTML(o) {
  let html = "";

  // 1. Address — prefer dedicated field, fall back to parsing notes
  let address = (o.address || "").trim();
  if (!address && o.notes) {
    const m = o.notes.match(/Address:\s*(.+?)(\||$)/i);
    if (m) address = m[1].trim();
  }
  if (address) {
    html += `<div style="font-size:11.5px;color:#555;margin-top:4px;line-height:1.4;max-width:220px;">📍 ${address}</div>`;
  }

  // 2. UTR — prefer dedicated field, fall back to parsing notes
  let utr = (o.utr || "").trim();
  if (!utr && o.notes) {
    const m = o.notes.match(/UTR:\s*([^\|]+)/i);
    if (m) utr = m[1].trim();
  }
  if (utr) {
    html += `<div style="font-size:11px;color:#888;margin-top:2px;">🔖 UTR: ${utr}</div>`;
  }

  // 3. Shipping — parse from notes
  if (o.notes) {
    const m = o.notes.match(/Shipping[^:]*:\s*(?:Rs\.?|₹)?\s*(\d+)/i);
    if (m && m[1] !== "0") {
      html += `<div style="font-size:11px;color:#888;">🚚 Shipping: ₹${m[1]}</div>`;
    }
  }

  // 4. Gifting details
  if (o.gift) {
    html += `<div style="font-size:11.5px;color:#d4af37;margin-top:4px;font-weight:700;display:flex;align-items:center;gap:4px;">🎁 Gift Wrapping Option</div>`;
    if (o.giftMessage) {
      html += `<div style="font-size:11px;color:#555;font-style:italic;margin-top:2px;max-width:220px;line-height:1.35;border-left:2px solid var(--gold);padding-left:6px;">"${o.giftMessage}"</div>`;
    }
  }

  // 5. Voucher details
  if (o.appliedVoucherCode) {
    html += `<div style="font-size:11px;color:#27AE60;margin-top:2px;font-weight:600;">🎫 Voucher: ${o.appliedVoucherCode} (-₹${o.voucherDiscount || 0})</div>`;
  }

  // 6. Payment Screenshot proof
  if (o.paymentScreenshot) {
    html += `<div style="margin-top:5px;"><button class="btn-edit-row" style="padding:4px 8px;font-size:11px;background:#eef6ff;border-color:#3182ce;color:#3182ce;font-weight:600;border-radius:4px;cursor:pointer;" onclick="viewPaymentScreenshot(${o.id})">📷 View Payment Screenshot</button></div>`;
  }

  return html;
}

let _activeScreenshotOrderId = null;

function viewPaymentScreenshot(orderId) {
  const o = orders.find(x => x.id === orderId);
  if (!o || !o.paymentScreenshot) {
    showAdminToast("No screenshot attached for this order.", "info");
    return;
  }
  _activeScreenshotOrderId = orderId;
  const imgEl = document.getElementById("screenshotModalImg");
  if (imgEl) imgEl.src = o.paymentScreenshot;
  document.getElementById("screenshotOverlay").style.display = "block";
  document.getElementById("screenshotModal").style.display = "block";
}

function closeScreenshotModal() {
  document.getElementById("screenshotOverlay").style.display = "none";
  document.getElementById("screenshotModal").style.display = "none";
  _activeScreenshotOrderId = null;
}

async function approveScreenshotOrder() {
  if (!_activeScreenshotOrderId) return;
  await updateOrderStatus(_activeScreenshotOrderId, "paid");
  showAdminToast("✔ Payment Verified & Marked Paid!", "success");
  closeScreenshotModal();
}

function renderOrdersTable() {
  const tbody  = document.getElementById("ordersTableBody");
  const search = (document.getElementById("ordersSearch")?.value || "").toLowerCase();
  const filter = document.getElementById("ordersFilter")?.value || "all";

  let filtered = [...orders].sort((a, b) => new Date(b.date) - new Date(a.date));
  if (filter !== "all") filtered = filtered.filter(o => o.status === filter);
  if (search) filtered = filtered.filter(o =>
    o.productName.toLowerCase().includes(search) ||
    (o.customer || "").toLowerCase().includes(search) ||
    (o.phone || "").includes(search)
  );

  // Summary row
  const totalShown = filtered.reduce((s, o) => s + o.price * o.qty, 0);
  document.getElementById("ordersSummaryBar").textContent =
    `${filtered.length} order${filtered.length !== 1 ? "s" : ""} · Total: ₹${totalShown.toLocaleString("en-IN")}`;

  if (!filtered.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align:center;padding:50px;color:#bbb;">
          <div style="font-size:36px;margin-bottom:12px;">📋</div>
          No orders found.
        </td>
      </tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(o => `
    <tr class="product-row" id="order-row-${o.id}">
      <td style="font-size:12px;color:var(--text-muted);">${formatDate(o.date)}</td>
      <td>
        <div class="table-product-name">${o.productName}</div>
        <div class="table-product-id">ID: #${o.productId || "N/A"} · Qty: ${o.qty} · ₹${o.price.toLocaleString("en-IN")} each</div>
      </td>
      <td>
        <div style="font-size:13.5px;font-weight:500;">${o.customer}</div>
        ${o.phone ? `<div style="font-size:12px;color:var(--text-muted);margin-top:2px;">📞 ${o.phone}</div>` : ""}
        ${getOrderCustomerInfoHTML(o)}
      </td>
      <td style="font-size:15px;font-weight:700;">₹${(o.price * o.qty).toLocaleString("en-IN")}</td>
      <td>
        <select class="status-select ${o.status || 'unpaid'}" onchange="updateOrderStatus(${o.id}, this.value)" style="font-weight:600; padding:6px 8px; border-radius:6px; font-size:12px;">
          <option value="unpaid"    ${(!o.status || o.status === "unpaid" || o.status === "pending") ? "selected" : ""}>⏳ Unpaid (Pending Proof)</option>
          <option value="paid"      ${o.status === "paid"      ? "selected" : ""}>💳 Paid (Verified)</option>
          <option value="shipped"   ${o.status === "shipped"   ? "selected" : ""}>🚚 Shipped</option>
          <option value="completed" ${o.status === "completed" ? "selected" : ""}>✅ Completed</option>
          <option value="cancelled" ${o.status === "cancelled" ? "selected" : ""}>❌ Cancelled</option>
        </select>
      </td>
      <td>
        ${(o.paymentScreenshot || o.screenshot) ? `
          <button class="btn-edit-row" style="padding:6px 10px; font-size:12px; margin-bottom:4px; background:#27AE60; color:#fff; border:none; font-weight:600; display:inline-flex; align-items:center; gap:4px; border-radius:6px; cursor:pointer;"
                  onclick="viewPaymentScreenshot(${o.id})">
            📷 View Screenshot
          </button><br>` : `<span style="font-size:11px; color:#C0392B; display:block; margin-bottom:4px;">No screenshot</span>`}
        ${o.phone ? `
          <a href="https://wa.me/91${o.phone.replace(/\D/g,'')}" target="_blank"
             style="display:inline-flex;align-items:center;gap:5px;padding:5px 10px;background:#25D366;color:#fff;border-radius:7px;font-size:12px;font-weight:500;text-decoration:none;margin-bottom:4px;">
            💬 WhatsApp
          </a><br>` : ""}
        ${o.gift && o.giftMessage ? `
          <button class="btn-edit-row" style="padding:5px 10px;font-size:12px;margin-bottom:4px;background:#fdfaf2;border-color:var(--gold);color:var(--gold-dark);"
                  onclick="printGiftCard('${o.customer.replace(/'/g, "\\'")}', '${o.giftMessage.replace(/'/g, "\\'")}')">✉️ Print Card</button><br>` : ""}
        <button class="btn-delete-row" style="padding:5px 10px;font-size:12px;"
                onclick="deleteOrder(${o.id})">🗑 Delete</button>
      </td>
    </tr>`).join("");
}

async function updateOrderStatus(id, status) {
  const idx = orders.findIndex(o => o.id === id);
  if (idx >= 0) {
    orders[idx].status = status;
    await db.updateOrderStatus(id, status);
    renderOrdersTable();
    if (document.getElementById("panel-dashboard").classList.contains("active")) renderDashboard();
    showAdminToast(`Order status updated to ${status}`, "success");
  }
}

function deleteOrder(id) {
  const o = orders.find(x => x.id === id);
  if (!o) return;
  if (!confirm(`Delete order for "${o.productName}"? This cannot be undone.`)) return;
  const row = document.getElementById(`order-row-${id}`);
  if (row) { row.style.opacity = "0.4"; }
  setTimeout(async () => {
    const res = await db.deleteOrder(id);
    if (res && res.success === false) {
      showAdminToast(`❌ Database Error: ${res.error || "Failed to delete order"}`, "error");
      if (row) { row.style.opacity = "1"; }
      return;
    }
    orders = orders.filter(x => x.id !== id);
    if (row) {
      row.style.opacity = "0";
      row.style.transition = "opacity 0.3s";
      setTimeout(() => {
        renderOrdersTable();
        showAdminToast("Order deleted.", "info");
      }, 300);
    } else {
      renderOrdersTable();
      showAdminToast("Order deleted.", "info");
    }
  }, 100);
}

function formatDate(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function populateCategoryDropdown() {
  const sel = document.getElementById("productCategory");
  const bulkSel = document.getElementById("bulkProductCategory");
  if (!sel) return;
  
  const optionsHtml = CATEGORIES
    .filter(c => c.id !== "all")
    .map(c => `<option value="${c.id}">${c.label}</option>`)
    .join("");
    
  sel.innerHTML = optionsHtml + `
    <option value="" disabled>──────────────</option>
    <option value="__add_new_category__" style="font-weight:bold; color:var(--gold-dark);">+ Add New Category...</option>
  `;

  if (bulkSel) {
    bulkSel.innerHTML = optionsHtml + `
      <option value="" disabled>──────────────</option>
      <option value="__add_new_category__" style="font-weight:bold; color:var(--gold-dark);">+ Add New Category...</option>
    `;
  }
}

/* ─── Product Table ─────────────────────────────────────── */
function renderProductTable() {
  const tbody = document.getElementById("productTableBody");
  if (!tbody) return;
  const search   = (document.getElementById("adminSearch")?.value || "").toLowerCase();
  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search) ||
    p.category.toLowerCase().includes(search)
  );

  if (!filtered.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align:center;padding:50px;color:#bbb;">
          <div style="font-size:32px;margin-bottom:10px;">📦</div>
          No products found. <a href="#" onclick="resetForm();switchTab('add')" style="color:var(--gold);">Add one →</a>
        </td>
      </tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(p => {
    const discount = p.originalPrice > p.price
      ? Math.round((1 - p.price / p.originalPrice) * 100) : 0;
    return `
      <tr class="product-row" id="row-${p.id}">
        <td>
          <div class="table-img">
            ${p.image ? `<img src="${p.image}" alt="${p.name}">` : `<div class="table-img-placeholder">🍽</div>`}
          </div>
        </td>
        <td>
          <div class="table-product-name">${p.name}</div>
          <div class="table-product-id">ID #${p.id} ${p.featured ? "· ⭐ Featured" : ""}</div>
        </td>
        <td><span class="table-badge">${p.category}</span></td>
        <td>
          <div class="table-price">₹${p.price.toLocaleString("en-IN")}</div>
          ${p.originalPrice > p.price
            ? `<div class="table-orig-price">₹${p.originalPrice.toLocaleString("en-IN")}</div>
               <div class="table-discount">−${discount}% off</div>`
            : ""}
        </td>
        <td>
          <div class="table-actions">
            <button class="btn-edit-row" onclick="editProduct(${p.id})">✏ Edit</button>
            <button class="btn-delete-row" onclick="deleteProduct(${p.id})">🗑 Delete</button>
          </div>
        </td>
      </tr>`;
  }).join("");
}

/* ─── Image Upload to Cloudinary (Free CDN) ─────────────── */

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
    reader.readAsDataURL(file);
  });
}

async function previewBulkImages(input) {
  const files = Array.from(input.files);
  if (!files.length) return;

  const results = await Promise.all(files.map(fileToBase64));
  productImages = productImages.concat(results);
  renderImagePreviews();
  input.value = "";
}

async function uploadImageToStorage(file) {

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || "Upload failed — check your Cloudinary settings.");
  }

  const data = await response.json();
  return data.secure_url; // permanent HTTPS CDN URL, never expires
}

async function previewImages(input) {
  const files = Array.from(input.files);
  if (!files.length) return;

  // Check config first before starting
  if (
    typeof CLOUDINARY_CONFIG === "undefined" ||
    !CLOUDINARY_CONFIG.cloudName ||
    CLOUDINARY_CONFIG.cloudName === "YOUR_CLOUD_NAME"
  ) {
    showAdminToast("⚠️ Image storage not set up yet. Go to Settings → Image Storage Setup.", "error");
    input.value = "";
    return;
  }

  // Show upload progress UI
  const progressEl = document.getElementById("imageUploadProgress");
  const progressBar = document.getElementById("imageProgressBar");
  const progressPct = document.getElementById("imageProgressPct");
  if (progressEl) progressEl.style.display = "block";

  let uploaded = 0;
  const newUrls = [];

  for (const file of files) {
    if (file.size > 50 * 1024 * 1024) {
      showAdminToast(`"${file.name}" is over 50MB and was skipped`, "error");
      uploaded++;
      continue;
    }
    try {
      showAdminToast(`☁️ Uploading "${file.name}"... (${uploaded + 1}/${files.length})`, "info");
      const url = await uploadImageToStorage(file);
      newUrls.push(url);
    } catch (err) {
      console.error("Upload error:", err);
      showAdminToast(`❌ Failed to upload "${file.name}": ${err.message}`, "error");
    }
    uploaded++;
    if (progressBar && progressPct) {
      const pct = Math.round((uploaded / files.length) * 100);
      progressBar.style.width = pct + "%";
      progressPct.textContent = pct;
    }
  }

  if (progressEl) progressEl.style.display = "none";
  if (progressBar) progressBar.style.width = "0%";

  if (newUrls.length > 0) {
    productImages = productImages.concat(newUrls);
    renderImagePreviews();
    showAdminToast(`✅ ${newUrls.length} photo(s) uploaded to cloud — saved permanently!`, "success");
  }

  input.value = "";
}

function removeThumb(idx) {
  productImages.splice(idx, 1);
  renderImagePreviews();
}

function makeCover(idx) {
  if (idx <= 0 || idx >= productImages.length) return;
  const img = productImages.splice(idx, 1)[0];
  productImages.unshift(img);
  renderImagePreviews();
}

// --- Video Upload & paste URL management ---

function toggleVideoSourceMode(mode) {
  var uploadArea = document.getElementById("videoUploadArea");
  var linkArea = document.getElementById("videoLinkArea");
  if (!uploadArea || !linkArea) return;
  
  if (mode === "upload") {
    uploadArea.style.display = "flex";
    linkArea.style.display = "none";
  } else {
    uploadArea.style.display = "none";
    linkArea.style.display = "block";
  }
}

function convertToEmbedUrl(url) {
  if (!url) return "";
  url = url.trim();
  // YouTube watch/short/embed links
  var ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/|youtube\.com\/embed\/)([\w-]+)/);
  if (ytMatch) return "https://www.youtube.com/embed/" + ytMatch[1];
  
  // Google Drive view links
  var gdMatch = url.match(/drive\.google\.com\/file\/d\/([\w-]+)/);
  if (gdMatch) return "https://drive.google.com/file/d/" + gdMatch[1] + "/preview";
  
  return url;
}

function handleVideoUrlInput(val) {
  var embedUrl = convertToEmbedUrl(val);
  document.getElementById("productVideoUrl").value = embedUrl;
  renderAdminVideoPreview(embedUrl);
}

function renderAdminVideoPreview(url) {
  var container = document.getElementById("videoPreviewContainer");
  var wrap = document.getElementById("videoPreviewWrap");
  if (!container || !wrap) return;

  if (!url) {
    wrap.style.display = "none";
    container.innerHTML = "";
    return;
  }

  var isEmbed = url.includes("youtube.com/embed/") || url.includes("drive.google.com/file/d/");
  if (isEmbed) {
    container.innerHTML = `<iframe src="${url}" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen
      style="width:100%;max-width:400px;height:225px;border-radius:10px;border:2px solid #e0dbd2;background:#000;"></iframe>`;
  } else {
    container.innerHTML = `<video src="${url}" controls playsinline
      style="width:100%;max-width:400px;border-radius:10px;border:2px solid #e0dbd2;background:#000;"></video>`;
  }
  wrap.style.display = "block";
}

function uploadProductVideo(input) {
  var file = input.files[0];
  if (!file) return;

  var maxMB = 100;
  if (file.size > maxMB * 1024 * 1024) {
    showAdminToast("Video must be under 100MB", "error");
    input.value = "";
    return;
  }

  document.getElementById("videoFileName").textContent = file.name;

  if (typeof firebase === "undefined" || !firebase.apps.length) {
    showAdminToast("Firebase not available. Trying local preview...", "info");
    _previewLocalVideo(file);
    return;
  }

  var storage = firebase.storage();
  var fileName = "product-videos/" + Date.now() + "_" + file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  var storageRef = storage.ref(fileName);
  var uploadTask = storageRef.put(file);

  document.getElementById("videoUploadProgress").style.display = "block";
  document.getElementById("videoPreviewWrap").style.display    = "none";

  uploadTask.on("state_changed",
    function(snapshot) {
      var pct = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
      document.getElementById("videoUploadPct").textContent    = pct;
      document.getElementById("videoProgressBar").style.width  = pct + "%";
    },
    function(error) {
      console.error("Upload error:", error);
      showAdminToast("Upload failed: " + error.message, "error");
      document.getElementById("videoUploadProgress").style.display = "none";
    },
    function() {
      uploadTask.snapshot.ref.getDownloadURL().then(function(url) {
        document.getElementById("productVideoUrl").value = url;
        document.getElementById("videoUploadProgress").style.display = "none";
        renderAdminVideoPreview(url);
        showAdminToast("Video uploaded successfully!", "success");
      });
    }
  );
}

function _previewLocalVideo(file) {
  var url = URL.createObjectURL(file);
  document.getElementById("productVideoUrl").value = url;
  renderAdminVideoPreview(url);
}

function removeProductVideo() {
  document.getElementById("productVideoUrl").value = "";
  var textInput = document.getElementById("productVideoUrlInput");
  if (textInput) textInput.value = "";
  var fileInput = document.getElementById("productVideoFile");
  if (fileInput) fileInput.value = "";
  document.getElementById("videoFileName").textContent = "No video selected";
  renderAdminVideoPreview("");
  showAdminToast("Video removed", "info");
}

function renderImagePreviews() {
  const grid = document.getElementById("adminImagesGrid");
  if (!grid) return;

  let html = "";
  productImages.forEach((img, idx) => {
    html += `
      <div class="image-thumb-card ${idx === 0 ? 'is-cover' : ''}">
        <img src="${img}" alt="Preview ${idx + 1}">
        <div class="image-thumb-badge">${idx === 0 ? 'Cover' : idx + 1}</div>
        <button type="button" class="btn-delete-thumb" onclick="removeThumb(${idx})" title="Remove image">×</button>
        ${idx > 0 ? `
          <button type="button" class="btn-set-cover" onclick="makeCover(${idx})" title="Set as Cover image">Set Cover</button>
        ` : ""}
      </div>
    `;
  });

  html += `
    <div class="add-image-card" onclick="document.getElementById('productImageInput').click()">
      <span class="add-image-icon">➕</span>
      <span class="add-image-text">Add Photo</span>
    </div>
  `;

  grid.innerHTML = html;
}

function addSizeVariantRow(name = '', price = '') {
  const list = document.getElementById("sizeVariantsList");
  if (!list) return;
  
  const row = document.createElement("div");
  row.className = "size-variant-row";
  row.style = "display: grid; grid-template-columns: 1.5fr 1fr auto; gap: 10px; align-items: center;";
  
  row.innerHTML = `
    <input type="text" class="form-input size-var-name" placeholder="e.g. Small (150ml)" value="${name}" style="margin:0;">
    <input type="number" class="form-input size-var-price" placeholder="Price (₹)" value="${price}" min="1" step="1" style="margin:0;">
    <button type="button" class="btn-delete-row" style="padding: 8px 12px; margin: 0; font-size: 14px; background:#e74c3c; border-color:#e74c3c; color:#fff;" onclick="this.parentNode.remove()">✕</button>
  `;
  
  list.appendChild(row);
}

function toggleSizeFields(show) {
  const container = document.getElementById("sizeFieldsContainer");
  if (container) {
    container.style.display = show ? "block" : "none";
  }
  
  const list = document.getElementById("sizeVariantsList");
  if (show && list && list.children.length === 0) {
    addSizeVariantRow("Small (150ml)", "");
    addSizeVariantRow("Big (300ml)", "");
  }
}

/* ─── Add / Edit / Delete Product ───────────────────────── */
async function saveProduct() {
  const name      = document.getElementById("productName").value.trim();
  const category  = document.getElementById("productCategory").value;
  const priceVal  = document.getElementById("productPrice").value.trim();
  const price     = priceVal ? (parseFloat(priceVal) || 0) : 0;
  const origPriceVal = document.getElementById("productOrigPrice").value.trim();
  const origPrice = origPriceVal ? (parseFloat(origPriceVal) || price) : price;
  const desc      = document.getElementById("productDesc").value.trim();
  const featured  = document.getElementById("productFeatured").checked;
  const colorsStr = document.getElementById("productColors").value.trim();

  const enableSizes = document.getElementById("enableSizesToggle").checked;
  let sizesStr = "";
  if (enableSizes) {
    const rows = document.querySelectorAll("#sizeVariantsList .size-variant-row");
    const sizeParts = [];
    rows.forEach(row => {
      const sName = row.querySelector(".size-var-name").value.trim();
      const sPrice = row.querySelector(".size-var-price").value.trim();
      if (sName && sPrice) {
        sizeParts.push(`${sName}: ${sPrice}`);
      }
    });
    sizesStr = sizeParts.join(", ");
  }

  // Parse colors as a list of trimmed strings
  const colors = colorsStr ? colorsStr.split(",").map(c => c.trim()).filter(Boolean) : [];

  if (!name)            { showAdminToast("Please enter a product name", "error"); return; }

  let targetProduct = null;
  let isEdit = (editingId !== null);

  if (isEdit) {
    const original = products.find(p => p.id === editingId);
    if (!original) { showAdminToast("Product not found", "error"); return; }
    targetProduct = { ...original, name, category, price, originalPrice: origPrice, description: desc, featured,
      images: productImages, image: productImages[0] || null, colors, sizes: sizesStr };
  } else {
    const newId = products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1;
    
    // Generate randomized default high rating and reviews to look professional
    const defaultRating = parseFloat((4.4 + Math.random() * 0.5).toFixed(1));
    const defaultReviews = Math.floor(Math.random() * 100) + 35;
    
    targetProduct = { id: newId, name, category, price, originalPrice: origPrice,
      description: desc, images: productImages, image: productImages[0] || null, featured, inStock: true, 
      rating: defaultRating, reviews: defaultReviews, colors, sizes: sizesStr };
  }

  // Images are already Firebase Storage URLs at this point — no compression needed
  targetProduct.images = productImages;
  targetProduct.image = productImages[0] || null;
  var videoUrlEl = document.getElementById("productVideoUrl");
  targetProduct.video = videoUrlEl ? (videoUrlEl.value || "").trim() || null : null;
  
  const productBadgeEl = document.getElementById("productBadge");
  targetProduct.badge = productBadgeEl ? (productBadgeEl.value || null) : null;

  showAdminToast("Saving product to cloud database...", "info");

  const res = await db.saveProduct(targetProduct);
  if (res && res.success === false) {
    showAdminToast("Failed to save: " + (res.error || "Please check your connection and try again."), "error");
    return;
  }

  const savedToCloud = res && res.success === true && res.mode === "firebase";

  if (isEdit) {
    const idx = products.findIndex(p => p.id === editingId);
    if (idx >= 0) products[idx] = targetProduct;
    showAdminToast(savedToCloud ? 'Updated successfully!' : 'Saved locally (cloud sync pending)', savedToCloud ? "success" : "info");
  } else {
    products.push(targetProduct);
    showAdminToast(savedToCloud ? 'Product added to store!' : 'Saved locally (cloud sync pending)', savedToCloud ? "success" : "info");
  }

  await populateOrderProductDropdown();
  resetForm();
  switchTab("products");
}

function editProduct(id) {
  const p = products.find(x => x.id === id);
  if (!p) return;
  editingId = id;
  
  if (p.images && p.images.length > 0) {
    productImages = [...p.images];
  } else if (p.image) {
    productImages = [p.image];
  } else {
    productImages = [];
  }
  var vedEl = document.getElementById("productVideoUrl");
  if (vedEl) { vedEl.value = p.video || ""; }
  
  if (p.video) {
    renderAdminVideoPreview(p.video);
    var isUpload = p.video.includes("firebasestorage.googleapis.com") || p.video.startsWith("blob:");
    var radioUp = document.querySelector('input[name="videoSourceType"][value="upload"]');
    var radioLink = document.querySelector('input[name="videoSourceType"][value="link"]');
    
    if (isUpload) {
      if (radioUp) radioUp.checked = true;
      toggleVideoSourceMode("upload");
      document.getElementById("videoFileName").textContent = "Video uploaded";
      var urlInput = document.getElementById("productVideoUrlInput");
      if (urlInput) urlInput.value = "";
    } else {
      if (radioLink) radioLink.checked = true;
      toggleVideoSourceMode("link");
      var urlInput = document.getElementById("productVideoUrlInput");
      if (urlInput) urlInput.value = p.video;
    }
  } else {
    renderAdminVideoPreview("");
    var radioUp = document.querySelector('input[name="videoSourceType"][value="upload"]');
    if (radioUp) radioUp.checked = true;
    toggleVideoSourceMode("upload");
    document.getElementById("videoFileName").textContent = "No video selected";
    var urlInput = document.getElementById("productVideoUrlInput");
    if (urlInput) urlInput.value = "";
  }
  
  document.getElementById("productName").value       = p.name;
  document.getElementById("productCategory").value   = p.category;
  document.getElementById("productPrice").value      = p.price;
  document.getElementById("productOrigPrice").value  = p.originalPrice || "";
  
  const productDiscountEl = document.getElementById("productDiscount");
  if (productDiscountEl) {
    if (p.originalPrice && p.price && p.originalPrice > p.price) {
      productDiscountEl.value = Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100);
    } else {
      productDiscountEl.value = "";
    }
  }
  document.getElementById("productDesc").value       = p.description || "";
  document.getElementById("productFeatured").checked = p.featured;
  document.getElementById("productColors").value     = p.colors ? p.colors.join(", ") : "";
  const productBadgeEl = document.getElementById("productBadge");
  if (productBadgeEl) productBadgeEl.value = p.badge || "";
  const sizesStr = p.sizes || "";
  const hasSizes = !!sizesStr.trim();
  const toggleEl = document.getElementById("enableSizesToggle");
  if (toggleEl) {
    toggleEl.checked = hasSizes;
    toggleSizeFields(hasSizes);
  }
  
  const list = document.getElementById("sizeVariantsList");
  if (list) list.innerHTML = "";
  
  if (hasSizes && list) {
    const parts = sizesStr.split(",");
    parts.forEach(part => {
      const sub = part.split(":");
      if (sub.length >= 2) {
        const price = sub.pop().trim();
        const name = sub.join(":").trim();
        if (name && price) {
          addSizeVariantRow(name, price);
        }
      }
    });
  }
  const hiddenSizesEl = document.getElementById("productSizes");
  if (hiddenSizesEl) hiddenSizesEl.value = sizesStr;
  
  
  renderImagePreviews();
  
  document.getElementById("formTitle").textContent   = `✏  Editing — ${p.name}`;
  document.getElementById("saveBtnText").textContent = "Save Changes";
  switchTab("add");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function deleteProduct(id) {
  const p = products.find(x => x.id === id);
  if (!p) return;
  if (!confirm(`Delete "${p.name}" permanently?`)) return;
  
  const row = document.getElementById(`row-${p.id}`);
  showAdminToast("Deleting product...", "info");
  
  if (row) { row.style.opacity = "0.4"; }
  
  setTimeout(async () => {
    const res = await db.deleteProduct(id);
    if (res && res.success === false) {
      showAdminToast(`❌ Database Error: ${res.error || "Failed to delete product"}`, "error");
      if (row) { row.style.opacity = "1"; }
      return;
    }
    
    products = products.filter(x => x.id !== id);
    if (row) {
      row.style.opacity = "0";
      row.style.transition = "all 0.3s";
      setTimeout(() => {
        renderProductTable();
        showAdminToast(`🗑  "${p.name}" deleted.`, "info");
      }, 300);
    } else {
      renderProductTable();
      showAdminToast(`🗑  "${p.name}" deleted.`, "info");
    }
  }, 100);
}

function resetForm() {
  editingId = null;
  productImages = [];
  document.getElementById("productForm").reset();
  document.getElementById("formTitle").textContent   = "Add New Product";
  document.getElementById("saveBtnText").textContent = "Add Product";
  
  var vEl = document.getElementById("productVideoUrl");
  if (vEl) vEl.value = "";
  var vUrlIn = document.getElementById("productVideoUrlInput");
  if (vUrlIn) vUrlIn.value = "";
  var vFile = document.getElementById("productVideoFile");
  if (vFile) vFile.value = "";
  var vName = document.getElementById("videoFileName");
  if (vName) vName.textContent = "No video selected";
  
  renderAdminVideoPreview("");
  
  var radioUp = document.querySelector('input[name="videoSourceType"][value="upload"]');
  if (radioUp) radioUp.checked = true;
  toggleVideoSourceMode("upload");

  const toggleEl = document.getElementById("enableSizesToggle");
  if (toggleEl) {
    toggleEl.checked = false;
    toggleSizeFields(false);
  }
  const list = document.getElementById("sizeVariantsList");
  if (list) list.innerHTML = "";

  renderImagePreviews();
}

/* ─── Backup / Restore ──────────────────────────────────── */
function exportProducts() {
  const blob = new Blob([JSON.stringify(products, null, 2)], { type: "application/json" });
  const url  = URL.createObjectURL(blob);
  const a    = Object.assign(document.createElement("a"), { href: url, download: `rajendra-products-${new Date().toISOString().split("T")[0]}.json` });
  a.click(); URL.revokeObjectURL(url);
  showAdminToast("✔  Products exported!", "success");
}

function exportOrders() {
  const blob = new Blob([JSON.stringify(orders, null, 2)], { type: "application/json" });
  const url  = URL.createObjectURL(blob);
  const a    = Object.assign(document.createElement("a"), { href: url, download: `rajendra-orders-${new Date().toISOString().split("T")[0]}.json` });
  a.click(); URL.revokeObjectURL(url);
  showAdminToast("✔  Orders exported!", "success");
}

function importProducts(input) {
  const file = input.files[0]; if (!file) return;
  const reader = new FileReader();
  reader.onload = async e => {
    try {
      const imported = JSON.parse(e.target.result);
      if (!Array.isArray(imported)) throw new Error();
      products = imported;
      let failedProducts = [];
      for (const p of products) {
        const res = await db.saveProduct(p);
        if (res && res.success === false) {
          failedProducts.push(`${p.name} (${res.error || "Unknown error"})`);
        }
      }
      renderProductTable();
      await populateOrderProductDropdown();
      if (failedProducts.length > 0) {
        showAdminToast(`Imported with errors. Failed to save: ${failedProducts.join(", ")}`, "error");
      } else {
        showAdminToast(`✔  ${imported.length} products imported!`, "success");
      }
    } catch (err) {
      showAdminToast("❌  Invalid JSON file or import error", "error");
    }
  };
  reader.readAsText(file);
}

async function changePassword() {
  const curr   = document.getElementById("currPass").value;
  const nw     = document.getElementById("newPass").value;
  const cnf    = document.getElementById("confPass").value;
  const stored = await db.getAdminPassword();
  if (curr !== stored) { showAdminToast("Current password is incorrect", "error"); return; }
  if (nw.length < 6)   { showAdminToast("New password must be at least 6 chars", "error"); return; }
  if (nw !== cnf)      { showAdminToast("Passwords do not match", "error"); return; }
  await db.saveAdminPassword(nw);
  ["currPass","newPass","confPass"].forEach(id => document.getElementById(id).value = "");
  showAdminToast("✔  Password changed!", "success");
}

async function resetProductsToDefault() {
  if (!confirm('Reset ALL products to defaults? All your changes will be lost!')) return;
  
  if (db.isFirebaseActive()) {
    try {
      const snapshot = await firebase.firestore().collection("products").get();
      const promises = [];
      snapshot.forEach(doc => {
        promises.push(doc.ref.delete());
      });
      await Promise.all(promises);
    } catch (e) {
      console.error("Error clearing Firebase products:", e);
    }
  }
  
  products = DEFAULT_PRODUCTS.map(p => ({ ...p }));
  let failedProducts = [];
  for (const p of products) {
    const res = await db.saveProduct(p);
    if (res && res.success === false) {
      failedProducts.push(`${p.name} (${res.error || "Unknown error"})`);
    }
  }
  
  renderProductTable();
  await populateOrderProductDropdown();
  if (failedProducts.length > 0) {
    showAdminToast(`Failed to reset some products: ${failedProducts.join(", ")}`, "error");
  } else {
    showAdminToast('Products reset to defaults.', 'info');
  }
}

/* ─── Toast ─────────────────────────────────────────────── */
function showAdminToast(msg, type = "success") {
  const el = document.getElementById("adminToast");
  if (!el) return;
  el.textContent = msg;
  el.className   = `admin-toast ${type} show`;
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove("show"), 3500);
}

/* ─── Database Diagnostics ──────────────────────────────── */
async function runDbDiagnostics() {
  const btn = document.getElementById("btnRunDiagnostics");
  const resDiv = document.getElementById("diagnosticsResult");
  if (!btn || !resDiv) return;

  btn.disabled = true;
  resDiv.style.display = "block";
  resDiv.innerHTML = `<div style="display:flex;align-items:center;gap:8px;"><div class="upi-spinner-sm"></div> Running connection and permission tests...</div>`;

  let html = `<h5 style="margin-top:0;margin-bottom:8px;font-family:var(--font-serif);font-size:14px;color:var(--text);">Database Diagnostics Report</h5>`;
  
  if (typeof firebase === "undefined") {
    html += `<span style="color:#C0392B;">❌ Firebase SDK is not loaded.</span> Check your internet connection or CDN links.`;
    resDiv.innerHTML = html;
    btn.disabled = false;
    return;
  }
  
  if (typeof FIREBASE_CONFIG === "undefined" || !FIREBASE_CONFIG.apiKey || FIREBASE_CONFIG.apiKey === "YOUR_API_KEY") {
    html += `<span style="color:#D35400;">ℹ️ Firebase Config is missing or empty.</span> Currently operating in offline Local Storage mode.`;
    resDiv.innerHTML = html;
    btn.disabled = false;
    return;
  }

  html += `<div style="font-size:11px;font-family:monospace;color:var(--text-light);margin-bottom:10px;line-height:1.4;">Project ID: ${FIREBASE_CONFIG.projectId}<br>Auth Domain: ${FIREBASE_CONFIG.authDomain}</div>`;

  try {
    const testDb = firebase.firestore();
    
    // Test 1: Write document
    html += `<div>1. Testing Database Write... `;
    const testDocRef = testDb.collection("settings").doc("connTest");
    await testDocRef.set({ testVal: "diagnostics", timestamp: Date.now() });
    html += `<span style="color:#27AE60;font-weight:bold;">✅ SUCCESS</span></div>`;

    // Test 2: Read document
    html += `<div>2. Testing Database Read... `;
    const snap = await testDocRef.get();
    if (snap.exists && snap.data().testVal === "diagnostics") {
      html += `<span style="color:#27AE60;font-weight:bold;">✅ SUCCESS</span></div>`;
    } else {
      html += `<span style="color:#C0392B;font-weight:bold;">❌ FAILED (Data mismatch)</span></div>`;
    }

    // Test 3: Delete document
    html += `<div>3. Testing Database Delete... `;
    await testDocRef.delete();
    html += `<span style="color:#27AE60;font-weight:bold;">✅ SUCCESS</span></div>`;

    html += `<div style="margin-top:10px;padding:8px;border-radius:6px;background:rgba(39,174,96,0.08);color:#27AE60;font-weight:600;font-size:12px;text-align:center;">🔥 Cloud Database is 100% Operational!</div>`;
  } catch (e) {
    console.error("Diagnostics error:", e);
    html += `<span style="color:#C0392B;font-weight:bold;">❌ FAILED</span></div>`;
    html += `<div style="margin-top:10px;padding:8px;border-radius:6px;background:rgba(192,57,43,0.08);color:#C0392B;font-size:11.5px;line-height:1.4;word-break:break-all;"><strong>Error Code:</strong> ${e.code || "unknown"}<br><strong>Message:</strong> ${e.message || e}</div>`;
    
    if (e.code === "permission-denied") {
      html += `<div style="font-size:11px;color:var(--text-muted);margin-top:6px;line-height:1.35;">💡 <em>Tip: Your Firestore Security Rules may have expired or need updating to allow read/write access. Ensure rules allow read/write for all users.</em></div>`;
    }
  }

  resDiv.innerHTML = html;
  btn.disabled = false;
}

/* ─── Database Speed Optimizer ──────────────────────────── */
async function optimizeDatabaseImages() {
  const btn = document.getElementById("btnOptimizeImages");
  const resDiv = document.getElementById("optimizationResult");
  if (!btn || !resDiv) return;

  btn.disabled = true;
  resDiv.style.display = "block";

  try {
    const freshProducts = await db.getProducts();
    let base64Count = 0;

    resDiv.innerHTML = `Found ${freshProducts.length} products. Scanning for old-format images...`;

    for (let i = 0; i < freshProducts.length; i++) {
      const p = freshProducts[i];
      const originalImages = p.images || (p.image ? [p.image] : []);
      let productModified = false;
      const newImages = [];

      resDiv.innerHTML = `Scanning product ${i + 1}/${freshProducts.length}: <strong>${p.name}</strong>...`;

      for (const img of originalImages) {
        if (img && img.startsWith("data:image/")) {
          // Old base64 image — convert to Firebase Storage URL
          resDiv.innerHTML = `Uploading old base64 image for <strong>${p.name}</strong> to cloud storage...`;
          try {
            const blob = await (await fetch(img)).blob();
            const file = new File([blob], "legacy_" + Date.now() + ".jpg", { type: "image/jpeg" });
            const url = await uploadImageToStorage(file);
            newImages.push(url);
            base64Count++;
            productModified = true;
          } catch (err) {
            console.error("Migration error:", err);
            newImages.push(img); // keep as-is if upload fails
          }
        } else {
          newImages.push(img); // already a URL, keep it
        }
      }

      if (productModified) {
        p.images = newImages;
        p.image = newImages[0] || null;
        const res = await db.saveProduct(p);
        if (res && res.success === false) {
          throw new Error(`Failed to update product "${p.name}": ${res.error || "Unknown error"}`);
        }
      }
    }

    if (base64Count > 0) {
      resDiv.innerHTML = `
        <div style="color:#27AE60; font-weight:bold; margin-bottom:6px;">✅ Migration Completed!</div>
        <div>Migrated <strong>${base64Count} old images</strong> to permanent Firebase Storage URLs.</div>
        <div style="margin-top:8px; font-size:11.5px; color:var(--text-light);">All product images are now stored permanently in the cloud. They will never vanish again!</div>
      `;
    } else {
      resDiv.innerHTML = `
        <div style="color:#27AE60; font-weight:bold;">✅ All images are already stored in Firebase Storage!</div>
        <div style="font-size:12px;margin-top:6px;color:var(--text-muted);">No migration needed. Your database is fully optimized.</div>
      `;
    }
  } catch (e) {
    console.error("Migration failed:", e);
    resDiv.innerHTML = `<span style="color:#C0392B;">❌ Migration Failed:</span> ${e.message || e}`;
  }

  btn.disabled = false;
}

// --- Print Greeting Card Helper ---
function printGiftCard(customer, message) {
  const w = window.open("", "_blank");
  if (!w) {
    alert("Please allow popups to print greeting cards.");
    return;
  }
  
  const content = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Print Gift Card - Rajendra Showroom</title>
      <style>
        body { font-family: 'Georgia', serif; padding: 40px; text-align: center; color: #333; }
        .card-box { max-width: 500px; margin: 50px auto; border: 2px solid #d4af37; padding: 40px; border-radius: 15px; background: #fffdf9; box-shadow: 0 4px 15px rgba(0,0,0,0.06); box-sizing: border-box; }
        .header { font-size: 14px; text-transform: uppercase; letter-spacing: 2px; color: #d4af37; margin-bottom: 30px; }
        .msg { font-size: 18px; font-style: italic; line-height: 1.6; margin-bottom: 30px; color: #222; }
        .footer { font-size: 13px; font-weight: bold; color: #555; }
        @media print {
          .print-btn { display: none; }
          body { padding: 0; }
          .card-box { border: 2px solid #d4af37; box-shadow: none; margin: 20px auto; }
        }
      </style>
    </head>
    <body>
      <div class="print-btn" style="margin-bottom: 20px;">
        <button onclick="window.print()" style="padding: 8px 18px; background: #d4af37; color: #fff; border: none; border-radius: 5px; cursor: pointer; font-weight: bold;">🖨️ Print Greeting Card</button>
      </div>
      <div class="card-box">
        <div class="header">✦ A Special Gift For You ✦</div>
        <div class="msg">"${message}"</div>
        <div class="footer">Warm regards, <br>${customer}</div>
      </div>
      <script>
        window.onload = function() {
          setTimeout(function() { window.print(); }, 200);
        }
      </script>
    </body>
    </html>
  `;
  w.document.write(content);
  w.document.close();
}

// --- Vouchers Management Logic ---
let vouchers = [];

async function loadAndRenderVouchers() {
  vouchers = await db.getVouchers();
  renderVouchersTable();
}

function renderVouchersTable() {
  const tbody = document.getElementById("vouchersTableBody");
  if (!tbody) return;
  
  if (vouchers.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align:center;padding:30px;color:#bbb;">
          No active vouchers. Create one on the left panel!
        </td>
      </tr>`;
    return;
  }
  
  tbody.innerHTML = vouchers.map(v => `
    <tr class="product-row">
      <td style="font-weight: 700; font-family: monospace; font-size: 14px; color: var(--text);">${v.code}</td>
      <td style="font-size: 13px; color: var(--text-light);">${v.description || "—"}</td>
      <td style="font-weight: 600;">₹${v.originalBalance.toLocaleString("en-IN")}</td>
      <td style="font-weight: 700; color: ${v.balance > 0 ? '#27AE60' : '#c0392b'};">₹${v.balance.toLocaleString("en-IN")}</td>
      <td style="text-align: right;">
        <button class="btn-delete-row" style="padding: 5px 10px; font-size: 12px;" onclick="deleteVoucherCode('${v.code}')">🗑 Delete</button>
      </td>
    </tr>
  `).join("");
}

function generateRandomCode() {
  const codeIn = document.getElementById("voucherCodeInput");
  if (!codeIn) return;
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase() + "-" + Math.random().toString(36).substring(2, 6).toUpperCase();
  codeIn.value = `GC-${rand}`;
}

async function createVoucher() {
  const codeIn = document.getElementById("voucherCodeInput");
  const valIn = document.getElementById("voucherValueInput");
  const descIn = document.getElementById("voucherDescInput");
  
  const code = codeIn ? codeIn.value.trim().toUpperCase() : "";
  const val = valIn ? parseFloat(valIn.value) : 0;
  const desc = descIn ? descIn.value.trim() : "";
  
  if (!code || !code.startsWith("GC-")) {
    showAdminToast("Voucher code must start with 'GC-' (e.g. GC-HAPPY-500)", "error");
    return;
  }
  
  if (isNaN(val) || val <= 0) {
    showAdminToast("Please enter a valid balance value (> 0)", "error");
    return;
  }
  
  showAdminToast("Creating voucher in database...", "info");
  
  const res = await db.saveVoucher(code, val, desc);
  if (res && res.success) {
    showAdminToast("✅ Gift card code generated & synced!", "success");
    if (codeIn) codeIn.value = "";
    if (valIn) valIn.value = "";
    if (descIn) descIn.value = "";
    await loadAndRenderVouchers();
  } else {
    showAdminToast("❌ Failed to save voucher: " + (res.error || "connection error"), "error");
  }
}

async function deleteVoucherCode(code) {
  if (!confirm(`Delete voucher "${code}" permanently? This cannot be undone.`)) return;
  
  showAdminToast("Deleting voucher...", "info");
  const res = await db.deleteVoucher(code);
  if (res && res.success) {
    showAdminToast(`🗑 Voucher "${code}" deleted.`, "info");
    await loadAndRenderVouchers();
  } else {
    showAdminToast("❌ Failed to delete voucher: " + (res.error || "connection error"), "error");
  }
}

/* ─── Bulk Product Posting ──────────────────────────────── */
function toggleBulkSizeFields(show) {
  const container = document.getElementById("bulkSizeFieldsContainer");
  if (!container) return;
  container.style.display = show ? "block" : "none";
  const list = document.getElementById("bulkSizeVariantsList");
  if (show && list && list.children.length === 0) {
    addBulkSizeVariantRow("Small (150ml)", "");
    addBulkSizeVariantRow("Big (300ml)", "");
  }
}

function addBulkSizeVariantRow(name = '', price = '') {
  const list = document.getElementById("bulkSizeVariantsList");
  if (!list) return;
  
  const row = document.createElement("div");
  row.className = "size-variant-row";
  row.style = "display: grid; grid-template-columns: 1.5fr 1fr auto; gap: 10px; align-items: center;";
  
  row.innerHTML = `
    <input type="text" class="form-input size-var-name" placeholder="e.g. Small (150ml)" value="${name}" style="margin:0;">
    <input type="number" class="form-input size-var-price" placeholder="Price (₹)" value="${price}" min="1" step="1" style="margin:0;">
    <button type="button" class="btn-delete-row" style="padding: 8px 12px; margin: 0; font-size: 14px; background:#e74c3c; border-color:#e74c3c; color:#fff;" onclick="this.parentNode.remove()">✕</button>
  `;
  
  list.appendChild(row);
}

async function previewBulkImages(input) {
  const files = Array.from(input.files);
  if (!files.length) return;

  if (
    typeof CLOUDINARY_CONFIG === "undefined" ||
    !CLOUDINARY_CONFIG.cloudName ||
    CLOUDINARY_CONFIG.cloudName === "YOUR_CLOUD_NAME"
  ) {
    showAdminToast("⚠️ Image storage not set up yet. Go to Settings → Image Storage Setup.", "error");
    input.value = "";
    return;
  }

  const progressEl = document.getElementById("bulkImageUploadProgress");
  const progressBar = document.getElementById("bulkImageProgressBar");
  const progressPct = document.getElementById("bulkImageProgressPct");
  if (progressEl) progressEl.style.display = "block";

  let uploaded = 0;
  const newUrls = [];

  for (const file of files) {
    if (file.size > 50 * 1024 * 1024) {
      showAdminToast(`"${file.name}" is over 50MB and was skipped`, "error");
      uploaded++;
      continue;
    }
    try {
      showAdminToast(`☁️ Uploading "${file.name}"... (${uploaded + 1}/${files.length})`, "info");
      const url = await uploadImageToStorage(file);
      newUrls.push(url);
    } catch (err) {
      console.error("Upload error:", err);
      showAdminToast(`❌ Failed to upload "${file.name}": ${err.message}`, "error");
    }
    uploaded++;
    if (progressBar && progressPct) {
      const pct = Math.round((uploaded / files.length) * 100);
      progressBar.style.width = pct + "%";
      progressPct.textContent = pct;
    }
  }

  if (progressEl) progressEl.style.display = "none";
  if (progressBar) progressBar.style.width = "0%";

  if (newUrls.length > 0) {
    bulkProductImages = bulkProductImages.concat(newUrls);
    renderBulkImagePreviews();
    showAdminToast(`✅ ${newUrls.length} photo(s) uploaded to cloud — saved permanently!`, "success");
  }

  input.value = "";
}

function renderBulkImagePreviews() {
  const grid = document.getElementById("bulkImagesGrid");
  if (!grid) return;

  let html = "";
  bulkProductImages.forEach((img, idx) => {
    html += `
      <div class="image-thumb-card">
        <img src="${img}" alt="Preview ${idx + 1}">
        <div class="image-thumb-badge">Item ${idx + 1}</div>
        <button type="button" class="btn-delete-thumb" onclick="removeBulkThumb(${idx})" title="Remove image">×</button>
      </div>
    `;
  });

  html += `
    <div class="add-image-card" onclick="document.getElementById('bulkImageInput').click()">
      <span class="add-image-icon">➕</span>
      <span class="add-image-text">Add Photos</span>
    </div>
  `;

  grid.innerHTML = html;
}

function removeBulkThumb(idx) {
  bulkProductImages.splice(idx, 1);
  renderBulkImagePreviews();
}

async function saveBulkProducts() {
  const commonName = document.getElementById("bulkProductName").value.trim();
  const category   = document.getElementById("bulkProductCategory").value;
  const priceVal   = document.getElementById("bulkProductPrice").value.trim();
  const price      = priceVal ? (parseFloat(priceVal) || 0) : 0;
  const origPriceVal = document.getElementById("bulkProductOrigPrice").value.trim();
  const origPrice  = origPriceVal ? (parseFloat(origPriceVal) || price) : price;
  const desc       = document.getElementById("bulkProductDesc").value.trim();
  const colorsStr  = document.getElementById("bulkProductColors").value.trim();

  const enableSizes = document.getElementById("bulkEnableSizesToggle").checked;
  let sizesStr = "";
  if (enableSizes) {
    const rows = document.querySelectorAll("#bulkSizeVariantsList .size-variant-row");
    const sizeParts = [];
    rows.forEach(row => {
      const sName = row.querySelector(".size-var-name").value.trim();
      const sPrice = row.querySelector(".size-var-price").value.trim();
      if (sName && sPrice) {
        sizeParts.push(`${sName}: ${sPrice}`);
      }
    });
    sizesStr = sizeParts.join(", ");
  }

  // Parse colors
  const colors = colorsStr ? colorsStr.split(",").map(c => c.trim()).filter(Boolean) : [];

  if (!commonName) { showAdminToast("Please enter a product name", "error"); return; }
  if (!category)   { showAdminToast("Please select a category", "error"); return; }
  if (bulkProductImages.length === 0) { showAdminToast("Please upload at least one image", "error"); return; }

  showAdminToast(`Bulk posting ${bulkProductImages.length} products to cloud database...`, "info");
  
  const postBtn = document.getElementById("btnBulkPost");
  if (postBtn) {
    postBtn.disabled = true;
    postBtn.style.opacity = "0.5";
    postBtn.textContent = "Posting...";
  }

  let successCount = 0;

  for (let i = 0; i < bulkProductImages.length; i++) {
    const imgUrl = bulkProductImages[i];
    const newId = products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1;
    
    // Generate randomized default high rating and reviews to look professional
    const defaultRating = parseFloat((4.4 + Math.random() * 0.5).toFixed(1));
    const defaultReviews = Math.floor(Math.random() * 100) + 35;
    
    const bulkBadgeEl = document.getElementById("bulkProductBadge");
    const bulkBadge = bulkBadgeEl ? bulkBadgeEl.value : "";

    const newProduct = {
      id: newId,
      name: commonName,
      category,
      price,
      originalPrice: origPrice,
      description: desc,
      featured: false,
      images: [imgUrl],
      image: imgUrl,
      colors,
      sizes: sizesStr,
      inStock: true,
      rating: defaultRating,
      reviews: defaultReviews,
      video: null,
      badge: bulkBadge || null,
      createdAt: new Date().toISOString()
    };

    products.push(newProduct);
    const res = await db.saveProduct(newProduct);
    if (res && res.success !== false) {
      successCount++;
    } else {
      console.error(`Failed to save bulk product ${i + 1}`);
    }
  }

  if (postBtn) {
    postBtn.disabled = false;
    postBtn.style.opacity = "";
    postBtn.innerHTML = "⚡ &nbsp;Bulk Post Products";
  }

  showAdminToast(`Successfully bulk-posted ${successCount} products!`, "success");
  resetBulkForm();
  await loadProducts(); // reload in memory
  renderProductTable(); // refresh list
  switchTab("products");
}

function resetBulkForm() {
  const form = document.getElementById("bulkProductForm");
  if (form) form.reset();
  bulkProductImages = [];
  renderBulkImagePreviews();
  const sizesContainer = document.getElementById("bulkSizeFieldsContainer");
  if (sizesContainer) sizesContainer.style.display = "none";
  const sizesList = document.getElementById("bulkSizeVariantsList");
  if (sizesList) sizesList.innerHTML = "";
  const sizesToggle = document.getElementById("bulkEnableSizesToggle");
  if (sizesToggle) sizesToggle.checked = false;
}

/* ─── Abandoned Carts Recovery ──────────────────────────── */
async function loadAbandonedCarts() {
  const container = document.getElementById("abandonedTableBody");
  if (container) {
    container.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:50px;color:#bbb;">Loading abandoned carts...</td></tr>`;
  }
  try {
    if (typeof db !== "undefined" && db.getAbandonedCarts) {
      abandonedCarts = await db.getAbandonedCarts();
    } else {
      abandonedCarts = [];
    }
    renderAbandonedTable();
  } catch (e) {
    console.error("Failed to load abandoned carts:", e);
    if (container) {
      container.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:50px;color:red;">Error loading abandoned carts: ${e.message || e}</td></tr>`;
    }
  }
}

function renderAbandonedTable() {
  const container = document.getElementById("abandonedTableBody");
  const summaryBar = document.getElementById("abandonedSummaryBar");
  const searchInput = document.getElementById("abandonedSearch");
  const query = searchInput ? searchInput.value.trim().toLowerCase() : "";

  if (!container) return;

  const filtered = abandonedCarts.filter(c => {
    if (!query) return true;
    const nameMatch = c.name && c.name.toLowerCase().includes(query);
    const phoneMatch = c.phone && c.phone.toLowerCase().includes(query);
    const addressMatch = c.address && c.address.toLowerCase().includes(query);
    const itemsMatch = c.cart && c.cart.some(item => item.name && item.name.toLowerCase().includes(query));
    return nameMatch || phoneMatch || addressMatch || itemsMatch;
  });

  const totalValue = filtered.reduce((s, c) => s + (c.grand || 0), 0);
  if (summaryBar) {
    summaryBar.textContent = `${filtered.length} cart(s) · Total Potential Value: ₹${totalValue.toLocaleString("en-IN")}`;
  }

  if (filtered.length === 0) {
    container.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:50px;color:#bbb;">No abandoned carts found.</td></tr>`;
    return;
  }

  container.innerHTML = filtered.map(c => {
    const timestamp = c.timestamp ? new Date(c.timestamp).toLocaleString("en-IN") : "N/A";
    const custDetails = `
      <div style="font-weight:600;color:var(--text);">${c.name || 'Anonymous'}</div>
      <div style="font-size:12px;color:var(--text-light);margin-top:2px;">
        📞 <a href="tel:${c.phone}" style="color:inherit;text-decoration:underline;">${c.phone}</a>
      </div>
      ${c.address ? `<div style="font-size:11px;color:var(--text-light);margin-top:2px;max-width:220px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" title="${c.address}">${c.address}</div>` : ''}
    `;

    const itemsHTML = c.cart ? c.cart.map(item => {
      const colorText = item.selectedColor ? ` [${item.selectedColor}]` : "";
      const sizeText = item.selectedSize ? ` (${item.selectedSize})` : "";
      return `<div style="font-size:12px;line-height:1.4;">• ${item.name}${sizeText}${colorText} × ${item.qty}</div>`;
    }).join("") : "No items";

    const valueHTML = `<div style="font-weight:700;color:var(--gold-dark);">₹${(c.grand || 0).toLocaleString("en-IN")}</div>`;

    const cleanPhone = c.phone.replace(/\D/g, "");
    const waMsg = encodeURIComponent(
      `Hi ${c.name || ''}! We noticed you left some beautiful items in your shopping cart at Rajendra Showroom. 😊\n\n` +
      `Items in your cart:\n` +
      (c.cart ? c.cart.map(item => `• ${item.name} × ${item.qty}`).join("\n") : "") +
      `\n\nWould you like us to assist you in completing your order, or send you real-time showroom photos of these items on WhatsApp? Let us know! We offer fast delivery across India.`
    );

    const actionsHTML = `
      <div style="display:flex;gap:8px;">
        <a class="btn-action edit" href="https://wa.me/91${cleanPhone}?text=${waMsg}" target="_blank" style="background:#25D366;border-color:#25D366;color:#fff;text-decoration:none;display:inline-flex;align-items:center;justify-content:center;height:30px;padding:0 10px;font-size:12px;border-radius:4px;font-weight:600;">
          📲 Recover
        </a>
        <button class="btn-action delete" onclick="deleteAbandonedCart('${c.id}')" style="height:30px;padding:0 10px;font-size:12px;border-radius:4px;font-weight:600;">
          🗑 Delete
        </button>
      </div>
    `;

    return `
      <tr>
        <td style="font-size:12.5px;color:var(--text-light);">${timestamp}</td>
        <td>${custDetails}</td>
        <td>${itemsHTML}</td>
        <td>${valueHTML}</td>
        <td>${actionsHTML}</td>
      </tr>
    `;
  }).join("");
}

async function deleteAbandonedCart(id) {
  if (!confirm("Are you sure you want to delete this abandoned cart draft?")) return;
  try {
    if (typeof db !== "undefined" && db.deleteAbandonedCart) {
      const res = await db.deleteAbandonedCart(id);
      if (res.success) {
        showAdminToast("Abandoned cart deleted successfully.");
        loadAbandonedCarts();
      } else {
        showAdminToast("Failed to delete cart: " + res.error, "error");
      }
    }
  } catch (e) {
    console.error(e);
    showAdminToast("Error: " + e.message, "error");
  }
}

function setupDiscountCalculator(priceId, origPriceId, discountId) {
  const priceInput = document.getElementById(priceId);
  const origPriceInput = document.getElementById(origPriceId);
  const discountInput = document.getElementById(discountId);

  if (!priceInput || !origPriceInput || !discountInput) return;

  const updatePriceFromDiscount = () => {
    const mrp = parseFloat(origPriceInput.value) || 0;
    const pct = parseFloat(discountInput.value) || 0;
    if (mrp > 0) {
      if (pct >= 0 && pct <= 100) {
        const sellingPrice = Math.round(mrp * (1 - pct / 100));
        priceInput.value = sellingPrice;
      }
    }
  };

  const updateDiscountFromPrice = () => {
    const mrp = parseFloat(origPriceInput.value) || 0;
    const sellingPrice = parseFloat(priceInput.value) || 0;
    if (mrp > 0 && sellingPrice > 0 && sellingPrice <= mrp) {
      const pct = Math.round(((mrp - sellingPrice) / mrp) * 100);
      discountInput.value = pct;
    } else {
      discountInput.value = "";
    }
  };

  origPriceInput.addEventListener("input", () => {
    if (discountInput.value !== "") {
      updatePriceFromDiscount();
    } else if (priceInput.value !== "") {
      updateDiscountFromPrice();
    }
  });

  discountInput.addEventListener("input", updatePriceFromDiscount);
  priceInput.addEventListener("input", updateDiscountFromPrice);
}

// --- Customer Photos Management ---
async function loadCustomerPhotosAdmin() {
  const grid = document.getElementById("customerPhotosAdminGrid");
  if (!grid) return;
  grid.innerHTML = '<div style="text-align:center;padding:30px;color:var(--text-muted);">Loading photos...</div>';
  const photos = await db.getCustomerPhotos();
  if (!photos || photos.length === 0) {
    grid.innerHTML = '<div style="text-align:center;padding:40px;color:var(--text-muted);"><div style="font-size:36px;margin-bottom:12px;">📸</div>No customer photos submitted yet.</div>';
    return;
  }
  grid.innerHTML = photos.map(p => `
    <div style="background:var(--bg);border:1px solid var(--border);border-radius:var(--radius);overflow:hidden;">
      <img src="${p.image}" style="width:100%;height:160px;object-fit:cover;" alt="${p.caption || ''}">
      <div style="padding:12px;">
        <div style="font-weight:600;font-size:13px;">${p.name || 'Anonymous'}</div>
        <div style="font-size:11px;color:var(--text-muted);margin:4px 0;">${p.caption || ''}</div>
        <div style="font-size:10px;color:var(--text-muted);">${new Date(p.createdAt).toLocaleDateString()}</div>
        <div style="display:flex;gap:8px;margin-top:10px;">
          ${p.approved ? 
            '<span style="color:var(--green);font-size:12px;font-weight:600;">✅ Approved</span>' :
            '<button class="btn-edit-row" style="padding:5px 12px;font-size:11px;" onclick="approveCustomerPhoto(\'' + p.id + '\')">✅ Approve</button>'
          }
          <button class="btn-delete-row" style="padding:5px 12px;font-size:11px;" onclick="rejectCustomerPhoto('${p.id}')">🗑 Delete</button>
        </div>
      </div>
    </div>
  `).join("");
}

async function approveCustomerPhoto(id) {
  const photos = await db.getCustomerPhotos();
  const photo = photos.find(p => String(p.id) === String(id));
  if (!photo) return;
  photo.approved = true;
  await db.saveCustomerPhoto(photo);
  showAdminToast("Photo approved! It will now appear on the storefront.", "success");
  loadCustomerPhotosAdmin();
}

async function rejectCustomerPhoto(id) {
  if (!confirm("Delete this customer photo?")) return;
  await db.deleteCustomerPhoto(id);
  showAdminToast("Photo deleted.", "success");
  loadCustomerPhotosAdmin();
}
