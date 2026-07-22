// ============================================================
//  Rajendra Showroom – Database Adapter (Firebase / LocalStorage)
// ============================================================

let firebaseApp = null;
let firestoreDb = null;
let useFirebase = false;
let isFirebaseResponsive = true;

// Initialize Firebase if configured and loaded
if (typeof firebase !== "undefined" && typeof FIREBASE_CONFIG !== "undefined") {
  const isConfigured = FIREBASE_CONFIG.apiKey && FIREBASE_CONFIG.apiKey !== "YOUR_API_KEY";
  if (isConfigured) {
    try {
      firebaseApp = firebase.initializeApp(FIREBASE_CONFIG);
      firestoreDb = firebase.firestore();
      useFirebase = true;
      console.log("🔥 Firebase initialized successfully! Connected to Firestore.");
    } catch (e) {
      console.error("❌ Failed to initialize Firebase:", e);
    }
  } else {
    console.log("ℹ️ Firebase is not configured. Using local storage mode.");
  }
} else {
  console.log("ℹ️ Firebase SDK not loaded or config missing. Using local storage mode.");
}

// Timeout helper for Promises
function withTimeout(promise, ms = 3000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error("Firebase request timed out after " + ms + "ms"));
    }, ms);
    promise.then(
      res => {
        clearTimeout(timer);
        resolve(res);
      },
      err => {
        clearTimeout(timer);
        reject(err);
      }
    );
  });
}

// Global DB adapter
window.db = {
  getEmojiForCategoryName(name) {
    const cleanName = (name || "").trim().toLowerCase();
    if (cleanName.includes("dry fruit")) return "🥜";
    if (cleanName.includes("flask") || cleanName.includes("thermos")) return "🏺";
    if (cleanName.includes("glass bottle")) return "🍾";
    if (cleanName.includes("lunch box") || cleanName.includes("lunchbox")) return "🍱";
    if (cleanName.includes("plater set") || cleanName.includes("platter")) return "🍽️";
    if (cleanName.includes("snack")) return "🥨";
    if (cleanName.includes("stanley")) return "🥤";
    if (cleanName.includes("tawa")) return "🍳";
    if (cleanName.includes("vase")) return "🏺";
    if (cleanName.includes("water bottle") || cleanName.includes("bottle")) return "🥤";
    if (cleanName.includes("plates")) return "🍽️";
    if (cleanName.includes("serving")) return "🍲";
    if (cleanName.includes("cookware")) return "🍳";
    return "📦";
  },

  isFirebaseActive() {
    return useFirebase && isFirebaseResponsive;
  },

  setFirebaseResponsive(status) {
    isFirebaseResponsive = status;
  },

  // --- Products ---
  async getProducts() {
    if (useFirebase && isFirebaseResponsive) {
      try {
        const snapshot = await withTimeout(firestoreDb.collection("products").get(), 4000);
        
        // Check if database initialization metadata is present
        const isInitDoc = await firestoreDb.collection("settings").doc("initialized").get().then(d => d.exists).catch(() => false);

        if (snapshot.empty && !isInitDoc) {
          // Initialize empty Firestore with default products in parallel
          console.log("Initializing database with default products...");
          const writePromises = DEFAULT_PRODUCTS.map(p => 
            firestoreDb.collection("products").doc(String(p.id)).set(p)
          );
          writePromises.push(firestoreDb.collection("settings").doc("initialized").set({ initialized: true }));
          writePromises.push(firestoreDb.collection("settings").doc("admin").set({ password: "rajendra@123" }));
          
          await withTimeout(Promise.all(writePromises), 5000);
          
          // Cache to LocalStorage
          const defaults = DEFAULT_PRODUCTS.map(p => ({ ...p }));
          localStorage.setItem("rs_products", JSON.stringify(defaults));
          return defaults;
        }
        
        const list = [];
        snapshot.forEach(doc => {
          list.push(doc.data());
        });
        
        // Sort products by ID to keep order consistent
        const sorted = list.sort((a, b) => a.id - b.id);
        
        // Cache to LocalStorage to keep in sync (fast load on next visit)
        localStorage.setItem("rs_products", JSON.stringify(sorted));
        return sorted;
      } catch (e) {
        console.error("Error fetching products from Firebase, falling back to local storage:", e);
      }
    }

    // LocalStorage Fallback
    const stored = localStorage.getItem("rs_products");
    let fallbackList;
    if (stored) {
      const parsed = JSON.parse(stored);
      fallbackList = parsed.length > 0 ? parsed : DEFAULT_PRODUCTS.map(p => ({ ...p }));
    } else {
      fallbackList = DEFAULT_PRODUCTS.map(p => ({ ...p }));
      localStorage.setItem("rs_products", JSON.stringify(fallbackList));
    }
    return fallbackList;
  },

  async saveProduct(p) {
    // ── Safety: filter out any accidental base64 images (only Firebase Storage URLs should be stored)
    const cleanImages = (p.images || []).filter(img => img && !img.startsWith("data:image/"));
    const cleanImage = (p.image && !p.image.startsWith("data:image/")) ? p.image : (cleanImages[0] || null);
    
    // Build clean product doc — images are Firebase Storage URLs (tiny strings, no size limit issues)
    const productDoc = { ...p, images: cleanImages, image: cleanImage };

    if (useFirebase && isFirebaseResponsive) {
      try {
        // Save full product (with video URL) to Firestore — all values are small strings/numbers now
        await withTimeout(firestoreDb.collection("products").doc(String(p.id)).set(productDoc), 8000);
      } catch (e) {
        console.error("Error saving product to Firebase:", e);
        return { success: false, error: e.message || e };
      }
    }
    
    // Always update LocalStorage as a fast-load cache
    const stored = localStorage.getItem("rs_products");
    let list = stored ? JSON.parse(stored) : DEFAULT_PRODUCTS.map(x => ({ ...x }));
    const idx = list.findIndex(x => x.id === p.id);
    if (idx >= 0) {
      list[idx] = productDoc;
    } else {
      list.push(productDoc);
    }
    localStorage.setItem("rs_products", JSON.stringify(list));
    
    return { success: true, mode: useFirebase ? "firebase" : "local" };
  },

  async deleteProduct(id) {
    if (useFirebase && isFirebaseResponsive) {
      try {
        await withTimeout(firestoreDb.collection("products").doc(String(id)).delete(), 4000);
      } catch (e) {
        console.error("Error deleting product from Firebase:", e);
        return { success: false, error: e.message || e };
      }
    }
    
    // Always update LocalStorage as well!
    const stored = localStorage.getItem("rs_products");
    if (stored) {
      let list = JSON.parse(stored);
      list = list.filter(x => x.id !== id);
      localStorage.setItem("rs_products", JSON.stringify(list));
    }
    
    return { success: true, mode: useFirebase ? "firebase" : "local" };
  },

  // --- Orders ---
  async getOrders() {
    if (useFirebase && isFirebaseResponsive) {
      try {
        const snapshot = await withTimeout(firestoreDb.collection("orders").get(), 4000);
        const list = [];
        snapshot.forEach(doc => {
          list.push(doc.data());
        });
        const sortedOrders = list.sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date));
        
        // Cache to LocalStorage to keep in sync
        localStorage.setItem("rs_orders", JSON.stringify(sortedOrders));
        return sortedOrders;
      } catch (e) {
        console.error("Error fetching orders from Firebase, falling back to local storage:", e);
      }
    }
    // LocalStorage Fallback
    return JSON.parse(localStorage.getItem("rs_orders") || "[]");
  },

  async saveOrder(o) {
    let firebaseError = null;
    if (useFirebase && isFirebaseResponsive) {
      try {
        await withTimeout(firestoreDb.collection("orders").doc(String(o.id)).set(o), 4000);
      } catch (e) {
        console.error("Error saving order to Firebase:", e);
        firebaseError = e.message || e;
      }
    }
    
    // Always update LocalStorage as well!
    const existing = JSON.parse(localStorage.getItem("rs_orders") || "[]");
    const idx = existing.findIndex(x => x.id === o.id);
    if (idx >= 0) {
      existing[idx] = o;
    } else {
      existing.unshift(o);
    }
    localStorage.setItem("rs_orders", JSON.stringify(existing));
    
    if (firebaseError) {
      return { success: false, error: firebaseError, mode: "local_only" };
    }
    return { success: true, mode: useFirebase ? "firebase" : "local" };
  },

  async updateOrderStatus(id, status) {
    let firebaseError = null;
    if (useFirebase && isFirebaseResponsive) {
      try {
        await withTimeout(firestoreDb.collection("orders").doc(String(id)).update({ status }), 4000);
      } catch (e) {
        console.error("Error updating order status in Firebase:", e);
        firebaseError = e.message || e;
      }
    }
    
    // Always update LocalStorage as well!
    const existing = JSON.parse(localStorage.getItem("rs_orders") || "[]");
    const idx = existing.findIndex(o => o.id === id);
    if (idx >= 0) {
      existing[idx].status = status;
      localStorage.setItem("rs_orders", JSON.stringify(existing));
    }
    
    if (firebaseError) {
      return { success: false, error: firebaseError, mode: "local_only" };
    }
    return { success: true, mode: useFirebase ? "firebase" : "local" };
  },

  async deleteOrder(id) {
    let firebaseError = null;
    if (useFirebase && isFirebaseResponsive) {
      try {
        await withTimeout(firestoreDb.collection("orders").doc(String(id)).delete(), 4000);
      } catch (e) {
        console.error("Error deleting order from Firebase:", e);
        firebaseError = e.message || e;
      }
    }
    
    // Always update LocalStorage as well!
    let existing = JSON.parse(localStorage.getItem("rs_orders") || "[]");
    existing = existing.filter(o => o.id !== id);
    localStorage.setItem("rs_orders", JSON.stringify(existing));
    
    if (firebaseError) {
      return { success: false, error: firebaseError, mode: "local_only" };
    }
    return { success: true, mode: useFirebase ? "firebase" : "local" };
  },

  // --- Admin Password ---
  async getAdminPassword() {
    if (useFirebase && isFirebaseResponsive) {
      try {
        const doc = await withTimeout(firestoreDb.collection("settings").doc("admin").get(), 4000);
        if (doc.exists) {
          const pass = doc.data().password || "rajendra@123";
          localStorage.setItem("rs_admin_pass", pass);
          return pass;
        } else {
          // Initialize default password in settings collection
          await withTimeout(firestoreDb.collection("settings").doc("admin").set({ password: "rajendra@123" }), 2000);
          localStorage.setItem("rs_admin_pass", "rajendra@123");
          return "rajendra@123";
        }
      } catch (e) {
        console.error("Error fetching password from Firebase:", e);
      }
    }
    return localStorage.getItem("rs_admin_pass") || "rajendra@123";
  },

  async saveAdminPassword(password) {
    let firebaseError = null;
    if (useFirebase && isFirebaseResponsive) {
      try {
        await withTimeout(firestoreDb.collection("settings").doc("admin").set({ password }), 4000);
      } catch (e) {
        console.error("Error saving password to Firebase:", e);
        firebaseError = e.message || e;
      }
    }
    
    localStorage.setItem("rs_admin_pass", password);
    
    if (firebaseError) {
      return { success: false, error: firebaseError, mode: "local_only" };
    }
    return { success: true, mode: useFirebase ? "firebase" : "local" };
  },

  // --- Cloudinary ---
  async getCloudinaryConfig() {
    if (useFirebase && isFirebaseResponsive) {
      try {
        const doc = await withTimeout(firestoreDb.collection("settings").doc("cloudinary").get(), 4000);
        if (doc.exists) {
          const config = doc.data();
          localStorage.setItem("rs_cloudinary_config", JSON.stringify(config));
          return config;
        }
      } catch (e) {
        console.error("Error fetching Cloudinary config from Firebase:", e);
      }
    }
    try {
      return JSON.parse(localStorage.getItem("rs_cloudinary_config") || "{}");
    } catch (e) {
      return {};
    }
  },

  async saveCloudinaryConfig(config) {
    let firebaseError = null;
    if (useFirebase && isFirebaseResponsive) {
      try {
        await withTimeout(firestoreDb.collection("settings").doc("cloudinary").set(config), 4000);
      } catch (e) {
        console.error("Error saving Cloudinary config to Firebase:", e);
        firebaseError = e.message || e;
      }
    }
    localStorage.setItem("rs_cloudinary_config", JSON.stringify(config));
    if (firebaseError) {
      return { success: false, error: firebaseError, mode: "local_only" };
    }
    return { success: true, mode: useFirebase ? "firebase" : "local" };
  },

  // --- Categories ---
  async getCategories() {
    if (useFirebase && isFirebaseResponsive) {
      try {
        const snapshot = await withTimeout(firestoreDb.collection("categories").get(), 4000);
        
        const isInitDoc = await firestoreDb.collection("settings").doc("initialized").get().then(d => d.exists).catch(() => false);

        if (snapshot.empty && !isInitDoc) {
          // Initialize empty Firestore with default categories in parallel
          console.log("Initializing database with default categories...");
          const writePromises = CATEGORIES.map(c => 
            firestoreDb.collection("categories").doc(c.id).set(c)
          );
          writePromises.push(firestoreDb.collection("settings").doc("initialized").set({ initialized: true }));
          
          await withTimeout(Promise.all(writePromises), 4000);
          
          // Cache to LocalStorage
          localStorage.setItem("rs_categories", JSON.stringify(CATEGORIES));
          return CATEGORIES.map(c => ({ ...c }));
        }
        
        const list = [];
        snapshot.forEach(doc => {
          let data = doc.data();
          let needsUpdate = false;
          if (data.id === "Plates" && data.icon === "🫙") {
            data.icon = "🍽️";
            needsUpdate = true;
          }
          if (data.id === "Serving" && data.icon === "🫕") {
            data.icon = "🍲";
            needsUpdate = true;
          }
          if (data.id === "Cookware" && data.icon === "🍲") {
            data.icon = "🍳";
            needsUpdate = true;
          }

          // Custom user-defined category emojis automatically resolved by name
          if (data.icon === "📦" || !data.icon) {
            const mappedEmoji = window.db.getEmojiForCategoryName(data.id);
            if (mappedEmoji !== "📦") {
              data.icon = mappedEmoji;
              needsUpdate = true;
            }
          }
          
          if (needsUpdate) {
            firestoreDb.collection("categories").doc(data.id).set(data).catch(console.error);
          }
          list.push(data);
        });
        
        // Preserve default sorting based on the order of items in CATEGORIES
        const defaultOrder = CATEGORIES.map(c => c.id);
        const sortedCategories = list.sort((a, b) => {
          let idxA = defaultOrder.indexOf(a.id);
          let idxB = defaultOrder.indexOf(b.id);
          if (idxA === -1) idxA = 999;
          if (idxB === -1) idxB = 999;
          return idxA - idxB;
        });
        
        // Cache to LocalStorage to keep in sync
        localStorage.setItem("rs_categories", JSON.stringify(sortedCategories));
        return sortedCategories;
      } catch (e) {
        console.error("Error fetching categories from Firebase, falling back to local storage:", e);
      }
    }

    // LocalStorage Fallback
    const stored = localStorage.getItem("rs_categories");
    if (stored) {
      let list = JSON.parse(stored);
      let upgraded = false;
      list.forEach(c => {
        if (c.id === "Plates" && c.icon === "🫙") { c.icon = "🍽️"; upgraded = true; }
        if (c.id === "Serving" && c.icon === "🫕") { c.icon = "🍲"; upgraded = true; }
        if (c.id === "Cookware" && c.icon === "🍲") { c.icon = "🍳"; upgraded = true; }

        // Custom user-defined category emojis automatically resolved by name
        if (c.icon === "📦" || !c.icon) {
          const mappedEmoji = window.db.getEmojiForCategoryName(c.id);
          if (mappedEmoji !== "📦") {
            c.icon = mappedEmoji;
            upgraded = true;
          }
        }
      });
      if (upgraded) {
        localStorage.setItem("rs_categories", JSON.stringify(list));
      }
      return list;
    }
    localStorage.setItem("rs_categories", JSON.stringify(CATEGORIES));
    return CATEGORIES.map(c => ({ ...c }));
  },

  async saveCategory(c) {
    let firebaseError = null;
    if (useFirebase && isFirebaseResponsive) {
      try {
        await withTimeout(firestoreDb.collection("categories").doc(c.id).set(c), 4000);
      } catch (e) {
        console.error("Error saving category to Firebase:", e);
        firebaseError = e.message || e;
      }
    }

    // Always update LocalStorage as well!
    const stored = localStorage.getItem("rs_categories");
    let list = stored ? JSON.parse(stored) : [...CATEGORIES];
    if (!list.some(x => x.id === c.id)) {
      list.push(c);
      localStorage.setItem("rs_categories", JSON.stringify(list));
    }
    
    if (firebaseError) {
      return { success: false, error: firebaseError, mode: "local_only" };
    }
    return { success: true, mode: useFirebase ? "firebase" : "local" };
  },

  // --- Wishlists / Gift Registries ---
  async saveWishlist(id, name, items) {
    const docData = {
      id,
      name,
      items,
      createdAt: new Date().toISOString()
    };
    if (useFirebase && isFirebaseResponsive) {
      try {
        await withTimeout(firestoreDb.collection("wishlists").doc(id).set(docData), 4000);
      } catch (e) {
        console.error("Error saving wishlist to Firebase:", e);
        return { success: false, error: e.message || e };
      }
    }
    localStorage.setItem(`rs_shared_wishlist_${id}`, JSON.stringify(docData));
    return { success: true, mode: useFirebase ? "firebase" : "local" };
  },

  async getWishlist(id) {
    if (useFirebase && isFirebaseResponsive) {
      try {
        const doc = await withTimeout(firestoreDb.collection("wishlists").doc(id).get(), 4000);
        if (doc.exists) {
          return doc.data();
        }
      } catch (e) {
        console.error("Error fetching wishlist from Firebase:", e);
      }
    }
    const cached = localStorage.getItem(`rs_shared_wishlist_${id}`);
    return cached ? JSON.parse(cached) : null;
  },

  // --- E-Gift Vouchers & Promo Codes ---
  async getVouchers() {
    if (useFirebase && isFirebaseResponsive) {
      try {
        const snapshot = await withTimeout(firestoreDb.collection("vouchers").get(), 4000);
        const list = [];
        snapshot.forEach(doc => {
          list.push(doc.data());
        });
        localStorage.setItem("rs_vouchers", JSON.stringify(list));
        return list;
      } catch (e) {
        console.error("Error fetching vouchers from Firebase:", e);
      }
    }
    return JSON.parse(localStorage.getItem("rs_vouchers") || "[]");
  },

  async getVoucher(code) {
    const cleanCode = (code || "").trim().toUpperCase();
    if (useFirebase && isFirebaseResponsive) {
      try {
        const doc = await withTimeout(firestoreDb.collection("vouchers").doc(cleanCode).get(), 4000);
        if (doc.exists) {
          return doc.data();
        }
        return null;
      } catch (e) {
        console.error("Error fetching voucher from Firebase:", e);
      }
    }
    const local = JSON.parse(localStorage.getItem("rs_vouchers") || "[]");
    return local.find(v => v.code === cleanCode) || null;
  },

  async saveVoucher(code, balance, description = "") {
    const cleanCode = (code || "").trim().toUpperCase();
    const docData = {
      code: cleanCode,
      originalBalance: balance,
      balance: balance,
      description: description,
      createdAt: new Date().toISOString()
    };
    let firebaseError = null;
    if (useFirebase && isFirebaseResponsive) {
      try {
        await withTimeout(firestoreDb.collection("vouchers").doc(cleanCode).set(docData), 4000);
      } catch (e) {
        console.error("Error saving voucher to Firebase:", e);
        firebaseError = e.message || e;
      }
    }
    const local = JSON.parse(localStorage.getItem("rs_vouchers") || "[]");
    const idx = local.findIndex(v => v.code === cleanCode);
    if (idx >= 0) {
      local[idx] = docData;
    } else {
      local.push(docData);
    }
    localStorage.setItem("rs_vouchers", JSON.stringify(local));

    if (firebaseError) {
      return { success: false, error: firebaseError, mode: "local_only" };
    }
    return { success: true, mode: useFirebase ? "firebase" : "local" };
  },

  async deleteVoucher(code) {
    const cleanCode = (code || "").trim().toUpperCase();
    let firebaseError = null;
    if (useFirebase && isFirebaseResponsive) {
      try {
        await withTimeout(firestoreDb.collection("vouchers").doc(cleanCode).delete(), 4000);
      } catch (e) {
        console.error("Error deleting voucher from Firebase:", e);
        firebaseError = e.message || e;
      }
    }
    let local = JSON.parse(localStorage.getItem("rs_vouchers") || "[]");
    local = local.filter(v => v.code !== cleanCode);
    localStorage.setItem("rs_vouchers", JSON.stringify(local));

    if (firebaseError) {
      return { success: false, error: firebaseError, mode: "local_only" };
    }
    return { success: true, mode: useFirebase ? "firebase" : "local" };
  },

  async updateVoucherBalance(code, newBalance) {
    const cleanCode = (code || "").trim().toUpperCase();
    let firebaseError = null;
    if (useFirebase && isFirebaseResponsive) {
      try {
        await withTimeout(firestoreDb.collection("vouchers").doc(cleanCode).update({ balance: newBalance }), 4000);
      } catch (e) {
        console.error("Error updating voucher balance in Firebase:", e);
        firebaseError = e.message || e;
      }
    }
    const local = JSON.parse(localStorage.getItem("rs_vouchers") || "[]");
    const idx = local.findIndex(v => v.code === cleanCode);
    if (idx >= 0) {
      local[idx].balance = newBalance;
      localStorage.setItem("rs_vouchers", JSON.stringify(local));
    }
    if (firebaseError) {
      return { success: false, error: firebaseError, mode: "local_only" };
    }
    return { success: true, mode: useFirebase ? "firebase" : "local" };
  },

  // --- Abandoned Carts ---
  async getAbandonedCarts() {
    if (useFirebase && isFirebaseResponsive) {
      try {
        const snapshot = await withTimeout(firestoreDb.collection("abandoned_carts").get(), 4000);
        const list = [];
        snapshot.forEach(doc => {
          list.push(doc.data());
        });
        const sorted = list.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        localStorage.setItem("rs_abandoned_carts", JSON.stringify(sorted));
        return sorted;
      } catch (e) {
        console.error("Error fetching abandoned carts from Firebase, falling back to local storage:", e);
      }
    }
    return JSON.parse(localStorage.getItem("rs_abandoned_carts") || "[]");
  },

  async saveAbandonedCart(c) {
    let firebaseError = null;
    if (useFirebase && isFirebaseResponsive) {
      try {
        await withTimeout(firestoreDb.collection("abandoned_carts").doc(String(c.id)).set(c), 4000);
      } catch (e) {
        console.error("Error saving abandoned cart to Firebase:", e);
        firebaseError = e.message || e;
      }
    }
    const local = JSON.parse(localStorage.getItem("rs_abandoned_carts") || "[]");
    const idx = local.findIndex(x => x.id === c.id);
    if (idx >= 0) {
      local[idx] = c;
    } else {
      local.unshift(c);
    }
    localStorage.setItem("rs_abandoned_carts", JSON.stringify(local));

    if (firebaseError) {
      return { success: false, error: firebaseError, mode: "local_only" };
    }
    return { success: true, mode: useFirebase ? "firebase" : "local" };
  },

  async deleteAbandonedCart(id) {
    let firebaseError = null;
    if (useFirebase && isFirebaseResponsive) {
      try {
        await withTimeout(firestoreDb.collection("abandoned_carts").doc(String(id)).delete(), 4000);
      } catch (e) {
        console.error("Error deleting abandoned cart from Firebase:", e);
        firebaseError = e.message || e;
      }
    }
    let local = JSON.parse(localStorage.getItem("rs_abandoned_carts") || "[]");
    local = local.filter(x => x.id !== id);
    localStorage.setItem("rs_abandoned_carts", JSON.stringify(local));

    if (firebaseError) {
      return { success: false, error: firebaseError, mode: "local_only" };
    }
  },

  async getOrdersByPhone(phone) {
    const cleanPhone = (phone || "").replace(/\D/g, "").slice(-10);
    if (!cleanPhone) return [];
    if (useFirebase && isFirebaseResponsive) {
      try {
        const snapshot = await withTimeout(firestoreDb.collection("orders").get(), 4000);
        const list = [];
        snapshot.forEach(doc => {
          const data = doc.data();
          const orderPhone = (data.phone || "").replace(/\D/g, "").slice(-10);
          if (orderPhone === cleanPhone) list.push(data);
        });
        return list.sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date));
      } catch (e) {
        console.error("Error fetching orders by phone:", e);
      }
    }
    const local = JSON.parse(localStorage.getItem("rs_orders") || "[]");
    return local.filter(o => {
      const orderPhone = (o.phone || "").replace(/\D/g, "").slice(-10);
      return orderPhone === cleanPhone;
    }).sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date));
  },

  async getCustomerPhotos() {
    if (useFirebase && isFirebaseResponsive) {
      try {
        const snapshot = await withTimeout(firestoreDb.collection("customer_photos").get(), 4000);
        const list = [];
        snapshot.forEach(doc => list.push(doc.data()));
        const sorted = list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        localStorage.setItem("rs_customer_photos", JSON.stringify(sorted));
        return sorted;
      } catch (e) {
        console.error("Error fetching customer photos:", e);
      }
    }
    return JSON.parse(localStorage.getItem("rs_customer_photos") || "[]");
  },

  async saveCustomerPhoto(photo) {
    let firebaseError = null;
    if (useFirebase && isFirebaseResponsive) {
      try {
        await withTimeout(firestoreDb.collection("customer_photos").doc(String(photo.id)).set(photo), 4000);
      } catch (e) {
        console.error("Error saving customer photo:", e);
        firebaseError = e.message || e;
      }
    }
    const local = JSON.parse(localStorage.getItem("rs_customer_photos") || "[]");
    const idx = local.findIndex(x => x.id === photo.id);
    if (idx >= 0) { local[idx] = photo; } else { local.unshift(photo); }
    localStorage.setItem("rs_customer_photos", JSON.stringify(local));
    if (firebaseError) return { success: false, error: firebaseError };
    return { success: true, mode: useFirebase ? "firebase" : "local" };
  },

  async deleteCustomerPhoto(id) {
    let firebaseError = null;
    if (useFirebase && isFirebaseResponsive) {
      try {
        await withTimeout(firestoreDb.collection("customer_photos").doc(String(id)).delete(), 4000);
      } catch (e) {
        console.error("Error deleting customer photo:", e);
        firebaseError = e.message || e;
      }
    }
    let local = JSON.parse(localStorage.getItem("rs_customer_photos") || "[]");
    local = local.filter(x => x.id !== id);
    localStorage.setItem("rs_customer_photos", JSON.stringify(local));
    if (firebaseError) return { success: false, error: firebaseError };
    return { success: true, mode: useFirebase ? "firebase" : "local" };
  },

  // --- Automated QR Payment Detection (No Payment Gateway) ---
  async getUpiConfig() {
    if (useFirebase && isFirebaseResponsive) {
      try {
        const doc = await withTimeout(firestoreDb.collection("settings").doc("upi").get(), 4000);
        if (doc.exists) {
          const data = doc.data();
          localStorage.setItem("rs_upi_config", JSON.stringify(data));
          return data;
        }
      } catch (e) {
        console.error("Error fetching UPI config:", e);
      }
    }
    const cached = localStorage.getItem("rs_upi_config");
    return cached ? JSON.parse(cached) : { upiId: "pranath7@fam", businessName: "Rajendra Showroom" };
  },

  async saveUpiConfig(config) {
    if (useFirebase && isFirebaseResponsive) {
      try {
        await withTimeout(firestoreDb.collection("settings").doc("upi").set(config), 4000);
      } catch (e) {
        console.error("Error saving UPI config:", e);
      }
    }
    localStorage.setItem("rs_upi_config", JSON.stringify(config));
    return { success: true };
  },

  async createPendingPayment(p) {
    const docData = {
      orderRef: String(p.orderRef),
      amount: Number(p.amount),
      customer: p.customer || "",
      phone: p.phone || "",
      status: "pending",
      createdAt: new Date().toISOString(),
      utr: null
    };
    if (useFirebase && isFirebaseResponsive) {
      try {
        await withTimeout(firestoreDb.collection("pending_payments").doc(String(p.orderRef)).set(docData), 4000);
      } catch (e) {
        console.error("Error creating pending payment in Firebase:", e);
      }
    }
    const local = JSON.parse(localStorage.getItem("rs_pending_payments") || "{}");
    local[p.orderRef] = docData;
    localStorage.setItem("rs_pending_payments", JSON.stringify(local));
    return { success: true };
  },

  async markPaymentSuccess(orderRef, utr = "", amount = 0) {
    const cleanRef = String(orderRef).trim();
    const updateData = {
      status: "PAID",
      utr: utr || ("AUTO" + Date.now().toString().slice(-8)),
      verifiedAt: new Date().toISOString()
    };
    if (amount) updateData.amount = Number(amount);

    if (useFirebase && isFirebaseResponsive) {
      try {
        await withTimeout(firestoreDb.collection("pending_payments").doc(cleanRef).set(updateData, { merge: true }), 4000);
      } catch (e) {
        console.error("Error marking payment success in Firebase:", e);
      }
    }
    const local = JSON.parse(localStorage.getItem("rs_pending_payments") || "{}");
    if (local[cleanRef]) {
      local[cleanRef] = { ...local[cleanRef], ...updateData };
    } else {
      local[cleanRef] = { orderRef: cleanRef, ...updateData };
    }
    localStorage.setItem("rs_pending_payments", JSON.stringify(local));

    window.dispatchEvent(new CustomEvent("rs_payment_verified", { detail: { orderRef: cleanRef, utr: updateData.utr } }));
    return { success: true };
  },

  listenToPaymentStatus(orderRef, callback) {
    const cleanRef = String(orderRef).trim();
    let unsubFirestore = null;

    if (useFirebase && isFirebaseResponsive && firestoreDb) {
      try {
        unsubFirestore = firestoreDb.collection("pending_payments").doc(cleanRef)
          .onSnapshot(doc => {
            if (doc.exists) {
              const data = doc.data();
              if (data && data.status === "PAID") {
                callback(data);
              }
            }
          }, err => console.error("Error listening to pending payment:", err));
      } catch (e) {
        console.error("Firestore snapshot setup error:", e);
      }
    }

    // Local polling fallback (runs every 1.5s as backup)
    const localInterval = setInterval(() => {
      const local = JSON.parse(localStorage.getItem("rs_pending_payments") || "{}");
      if (local[cleanRef] && local[cleanRef].status === "PAID") {
        callback(local[cleanRef]);
      }
    }, 1500);

    // Event listener for tab sync
    const eventHandler = (evt) => {
      if (evt.detail && String(evt.detail.orderRef) === cleanRef) {
        callback({ status: "PAID", utr: evt.detail.utr });
      }
    };
    window.addEventListener("rs_payment_verified", eventHandler);

    return () => {
      if (unsubFirestore) unsubFirestore();
      clearInterval(localInterval);
      window.removeEventListener("rs_payment_verified", eventHandler);
    };
  }
};

