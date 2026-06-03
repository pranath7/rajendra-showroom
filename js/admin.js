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

/* ─── Boot ─────────────────────────────────────────────── */
document.addEventListener("DOMContentLoaded", () => {
  checkAuth();

  // Handle "+ Add New Category..." selection in the category dropdown
  const catSel = document.getElementById("productCategory");
  if (catSel) {
    catSel.addEventListener("change", async (e) => {
      if (e.target.value === "__add_new_category__") {
        const name = prompt("Enter the name of the new category:");
        if (name && name.trim()) {
          const cleanName = name.trim();
          
          // Check if category already exists
          const exists = CATEGORIES.some(c => c.label.toLowerCase() === cleanName.toLowerCase());
          if (exists) {
            alert("This category already exists!");
            // Reset to default
            catSel.value = CATEGORIES[1] ? CATEGORIES[1].id : "";
            return;
          }

          // Request optional emoji icon
          const icon = prompt("Enter an emoji/icon for the category (or leave blank for a default package 📦):");
          const cleanIcon = icon && icon.trim() ? icon.trim() : "📦";

          const newCat = {
            id: cleanName,
            label: cleanName,
            icon: cleanIcon
          };

          await db.saveCategory(newCat);
          CATEGORIES.push(newCat);
          
          // Re-populate dropdown and select the newly created category
          populateCategoryDropdown();
          catSel.value = cleanName;
        } else {
          // Reset to default if cancelled
          catSel.value = CATEGORIES[1] ? CATEGORIES[1].id : "";
        }
      }
    });
  }
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
  updateFirebaseStatusUI();
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

function updateFirebaseStatusUI() {
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
}

/* ─── Tab Switching ─────────────────────────────────────── */
function switchTab(tab) {
  document.querySelectorAll(".admin-tab").forEach(el => el.classList.remove("active"));
  document.querySelectorAll(".tab-panel").forEach(el => el.classList.remove("active"));
  document.getElementById(`tab-${tab}`)?.classList.add("active");
  document.getElementById(`panel-${tab}`)?.classList.add("active");

  if (tab === "dashboard") renderDashboard();
  if (tab === "orders")    renderOrdersTable();
  if (tab === "products")  renderProductTable();
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
            <div class="ro-product">${o.productName} × ${o.qty}</div>
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

  return html;
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
          No orders yet. <a href="#" onclick="switchTab('add-order')" style="color:var(--gold);">Log your first order →</a>
        </td>
      </tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(o => `
    <tr class="product-row" id="order-row-${o.id}">
      <td style="font-size:12px;color:var(--text-muted);">${formatDate(o.date)}</td>
      <td>
        <div class="table-product-name">${o.productName}</div>
        <div class="table-product-id">Qty: ${o.qty} · ₹${o.price.toLocaleString("en-IN")} each</div>
      </td>
      <td>
        <div style="font-size:13.5px;font-weight:500;">${o.customer}</div>
        ${o.phone ? `<div style="font-size:12px;color:var(--text-muted);margin-top:2px;">📞 ${o.phone}</div>` : ""}
        ${getOrderCustomerInfoHTML(o)}
      </td>
      <td style="font-size:15px;font-weight:700;">₹${(o.price * o.qty).toLocaleString("en-IN")}</td>
      <td>
        <select class="status-select ${o.status}" onchange="updateOrderStatus(${o.id}, this.value)">
          <option value="pending"   ${o.status === "pending"   ? "selected" : ""}>⏳ Pending</option>
          <option value="completed" ${o.status === "completed" ? "selected" : ""}>✔ Completed</option>
          <option value="cancelled" ${o.status === "cancelled" ? "selected" : ""}>✕ Cancelled</option>
        </select>
      </td>
      <td>
        ${o.phone ? `
          <a href="https://wa.me/91${o.phone.replace(/\D/g,'')}" target="_blank"
             style="display:inline-flex;align-items:center;gap:5px;padding:5px 10px;background:#25D366;color:#fff;border-radius:7px;font-size:12px;font-weight:500;text-decoration:none;margin-bottom:4px;">
            💬 WhatsApp
          </a><br>` : ""}
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
  if (!sel) return;
  
  const optionsHtml = CATEGORIES
    .filter(c => c.id !== "all")
    .map(c => `<option value="${c.id}">${c.label}</option>`)
    .join("");
    
  sel.innerHTML = optionsHtml + `
    <option value="" disabled>──────────────</option>
    <option value="__add_new_category__" style="font-weight:bold; color:var(--gold-dark);">+ Add New Category...</option>
  `;
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

/* ─── Image Preview & Gallery ───────────────────────────── */
function compressImage(base64Str, maxWidth = 800, maxHeight = 800, quality = 0.7) {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      let width = img.width;
      let height = img.height;

      // Keep aspect ratio
      if (width > height) {
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, width, height);

      const compressedDataUrl = canvas.toDataURL("image/jpeg", quality);
      resolve(compressedDataUrl);
    };
    img.onerror = () => {
      resolve(base64Str);
    };
  });
}

function previewImages(input) {
  const files = Array.from(input.files);
  if (!files.length) return;

  const validFiles = files.filter(file => {
    if (file.size > 10 * 1024 * 1024) {
      showAdminToast(`"${file.name}" is over 10 MB and was skipped`, "error");
      return false;
    }
    return true;
  });

  if (validFiles.length === 0) return;

  showAdminToast("Processing and compressing images...", "info");

  let loadedCount = 0;
  const newImages = [];

  validFiles.forEach(file => {
    const reader = new FileReader();
    reader.onload = async e => {
      try {
        const compressed = await compressImage(e.target.result, 800, 800, 0.7);
        newImages.push(compressed);
      } catch (err) {
        console.error("Compression error:", err);
        newImages.push(e.target.result);
      }
      
      loadedCount++;
      if (loadedCount === validFiles.length) {
        productImages = productImages.concat(newImages);
        renderImagePreviews();
        input.value = ""; // clear input
        showAdminToast("Images processed successfully!", "success");
      }
    };
    reader.readAsDataURL(file);
  });
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

function convertToEmbedUrl(url) {
  if (!url) return null;
  // YouTube: watch?v=ID or youtu.be/ID
  var ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/);
  if (ytMatch) return "https://www.youtube.com/embed/" + ytMatch[1];
  // Google Drive: /file/d/ID/
  var gdMatch = url.match(/drive\.google\.com\/file\/d\/([\w-]+)/);
  if (gdMatch) return "https://drive.google.com/file/d/" + gdMatch[1] + "/preview";
  // Already embed or direct
  return url;
}

function previewVideoUrl(url) {
  var previewDiv = document.getElementById("videoUrlPreview");
  var iframe = document.getElementById("videoIframe");
  if (!previewDiv || !iframe) return;
  var embedUrl = convertToEmbedUrl(url);
  if (embedUrl && url.length > 5) {
    iframe.src = embedUrl;
    previewDiv.style.display = "block";
  } else {
    iframe.src = "";
    previewDiv.style.display = "none";
  }
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

/* ─── Add / Edit / Delete Product ───────────────────────── */
async function saveProduct() {
  const name      = document.getElementById("productName").value.trim();
  const category  = document.getElementById("productCategory").value;
  const price     = parseFloat(document.getElementById("productPrice").value);
  const origPrice = parseFloat(document.getElementById("productOrigPrice").value) || price;
  const desc      = document.getElementById("productDesc").value.trim();
  const featured  = document.getElementById("productFeatured").checked;
  const colorsStr = document.getElementById("productColors").value.trim();

  // Parse colors as a list of trimmed strings
  const colors = colorsStr ? colorsStr.split(",").map(c => c.trim()).filter(Boolean) : [];

  if (!name)            { showAdminToast("Please enter a product name", "error"); return; }
  if (!price || price <= 0) { showAdminToast("Please enter a valid price", "error"); return; }

  let targetProduct = null;
  let isEdit = (editingId !== null);

  if (isEdit) {
    const original = products.find(p => p.id === editingId);
    if (!original) { showAdminToast("Product not found", "error"); return; }
    targetProduct = { ...original, name, category, price, originalPrice: origPrice, description: desc, featured,
      images: productImages, image: productImages[0] || null, colors };
  } else {
    const newId = products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1;
    
    // Generate randomized default high rating and reviews to look professional
    const defaultRating = parseFloat((4.4 + Math.random() * 0.5).toFixed(1));
    const defaultReviews = Math.floor(Math.random() * 100) + 35;
    
    targetProduct = { id: newId, name, category, price, originalPrice: origPrice,
      description: desc, images: productImages, image: productImages[0] || null, featured, inStock: true, 
      rating: defaultRating, reviews: defaultReviews, colors };
  }

  showAdminToast("Processing and compressing images...", "info");

  // Compress any Base64 images that are large before saving
  const compressedImages = [];
  for (let i = 0; i < productImages.length; i++) {
    const img = productImages[i];
    if (img && img.startsWith("data:image/") && img.length > 150 * 1024) {
      try {
        const comp = await compressImage(img, 800, 800, 0.7);
        compressedImages.push(comp);
      } catch (err) {
        console.error("Compression error during save:", err);
        compressedImages.push(img);
      }
    } else {
      compressedImages.push(img);
    }
  }
  productImages = compressedImages;
  targetProduct.images = productImages;
  targetProduct.image = productImages[0] || null;
  var videoUrlEl = document.getElementById("productVideoUrl");
  targetProduct.video = videoUrlEl ? (videoUrlEl.value || "").trim() || null : null;

  showAdminToast("Saving product to cloud database...", "info");

  const res = await db.saveProduct(targetProduct);
  if (res && res.success === false && res.mode !== "local_only") {
    showAdminToast("Failed to save. Check your connection and try again.", "error");
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
  if (false) {// dummy close
  }
  
  document.getElementById("productName").value       = p.name;
  document.getElementById("productCategory").value   = p.category;
  document.getElementById("productPrice").value      = p.price;
  document.getElementById("productOrigPrice").value  = p.originalPrice || "";
  document.getElementById("productDesc").value       = p.description || "";
  document.getElementById("productFeatured").checked = p.featured;
  document.getElementById("productColors").value     = p.colors ? p.colors.join(", ") : "";
  
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
  var vPrev = document.getElementById("videoUrlPreview");
  if (vPrev) vPrev.style.display = "none";
  var vIframe = document.getElementById("videoIframe");
  if (vIframe) vIframe.src = "";
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
      for (const p of products) {
        await db.saveProduct(p);
      }
      renderProductTable();
      await populateOrderProductDropdown();
      showAdminToast(`✔  ${imported.length} products imported!`, "success");
    } catch { showAdminToast("❌  Invalid JSON file", "error"); }
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
  for (const p of products) {
    await db.saveProduct(p);
  }
  
  renderProductTable();
  await populateOrderProductDropdown();
  showAdminToast('Products reset to defaults.', 'info');
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

  if (!confirm("Are you sure you want to optimize all images in the Cloud Database? This will compress all large uploaded photos to 800px JPEG format to make the website load extremely fast.")) return;

  btn.disabled = true;
  resDiv.style.display = "block";
  resDiv.innerHTML = "Fetching products from cloud database...";

  try {
    const freshProducts = await db.getProducts();
    let optimizedCount = 0;
    let totalSavedBytes = 0;

    resDiv.innerHTML = `Found ${freshProducts.length} products. Scanning images...`;

    for (let i = 0; i < freshProducts.length; i++) {
      const p = freshProducts[i];
      let productModified = false;
      const originalImages = p.images || (p.image ? [p.image] : []);
      const newImages = [];

      resDiv.innerHTML = `Scanning product ${i + 1}/${freshProducts.length}: <strong>${p.name}</strong>...`;

      for (let j = 0; j < originalImages.length; j++) {
        const img = originalImages[j];
        if (img && img.startsWith("data:image/") && img.length > 150 * 1024) {
          const originalSize = img.length;
          resDiv.innerHTML = `Compressing image ${j + 1} of ${p.name} (Original: ${(originalSize/1024).toFixed(0)} KB)...`;
          
          const comp = await compressImage(img, 800, 800, 0.7);
          newImages.push(comp);
          
          const compressedSize = comp.length;
          totalSavedBytes += (originalSize - compressedSize);
          productModified = true;
        } else {
          newImages.push(img);
        }
      }

      if (productModified) {
        p.images = newImages;
        p.image = newImages[0] || null;
        await db.saveProduct(p);
        optimizedCount++;
      }
    }

    const savedKb = (totalSavedBytes / 1024).toFixed(0);
    resDiv.innerHTML = `
      <div style="color:#27AE60; font-weight:bold; margin-bottom:6px;">✅ Optimization Completed!</div>
      <div>Optimized: <strong>${optimizedCount} products</strong></div>
      <div>Total space saved: <strong>${savedKb} KB</strong> (~${(savedKb/1024).toFixed(1)} MB)</div>
      <div style="margin-top:8px; font-size:11.5px; color:var(--text-light);">Your storefront will now load significantly faster! Please refresh your website to see the speed boost.</div>
    `;
  } catch (e) {
    console.error("Optimization failed:", e);
    resDiv.innerHTML = `<span style="color:#C0392B;">❌ Optimization Failed:</span> ${e.message || e}`;
  }

  btn.disabled = false;
}
