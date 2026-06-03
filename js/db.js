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
  isFirebaseActive() {
    return useFirebase && isFirebaseResponsive;
  },

  // --- Products ---
  async getProducts() {
    if (useFirebase && isFirebaseResponsive) {
      try {
        const snapshot = await withTimeout(firestoreDb.collection("products").get(), 3000);
        if (snapshot.empty) {
          // Initialize empty Firestore with default products in parallel
          console.log("Initializing database with default products...");
          const writePromises = DEFAULT_PRODUCTS.map(p => 
            firestoreDb.collection("products").doc(String(p.id)).set(p)
          );
          await withTimeout(Promise.all(writePromises), 4000);
          return DEFAULT_PRODUCTS.map(p => ({ ...p }));
        }
        const list = [];
        snapshot.forEach(doc => {
          list.push(doc.data());
        });
        // Sort products by ID to keep order consistent
        return list.sort((a, b) => a.id - b.id);
      } catch (e) {
        console.error("Error fetching products from Firebase, falling back to local storage:", e);
        isFirebaseResponsive = false; // Disable Firebase for current session to prevent further hangs
      }
    }

    // LocalStorage Fallback
    const stored = localStorage.getItem("rs_products");
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed.length > 0 ? parsed : DEFAULT_PRODUCTS.map(p => ({ ...p }));
    }
    const defaults = DEFAULT_PRODUCTS.map(p => ({ ...p }));
    localStorage.setItem("rs_products", JSON.stringify(defaults));
    return defaults;
  },

  async saveProduct(p) {
    if (useFirebase && isFirebaseResponsive) {
      try {
        await withTimeout(firestoreDb.collection("products").doc(String(p.id)).set(p), 3000);
        return true;
      } catch (e) {
        console.error("Error saving product to Firebase:", e);
        isFirebaseResponsive = false;
      }
    }
    // LocalStorage Fallback
    const stored = localStorage.getItem("rs_products");
    let list = stored ? JSON.parse(stored) : DEFAULT_PRODUCTS.map(x => ({ ...x }));
    const idx = list.findIndex(x => x.id === p.id);
    if (idx >= 0) {
      list[idx] = p;
    } else {
      list.push(p);
    }
    localStorage.setItem("rs_products", JSON.stringify(list));
    return true;
  },

  async deleteProduct(id) {
    if (useFirebase && isFirebaseResponsive) {
      try {
        await withTimeout(firestoreDb.collection("products").doc(String(id)).delete(), 3000);
        return true;
      } catch (e) {
        console.error("Error deleting product from Firebase:", e);
        isFirebaseResponsive = false;
      }
    }
    // LocalStorage Fallback
    const stored = localStorage.getItem("rs_products");
    if (stored) {
      let list = JSON.parse(stored);
      list = list.filter(x => x.id !== id);
      localStorage.setItem("rs_products", JSON.stringify(list));
    }
    return true;
  },

  // --- Orders ---
  async getOrders() {
    if (useFirebase && isFirebaseResponsive) {
      try {
        const snapshot = await withTimeout(firestoreDb.collection("orders").get(), 3000);
        const list = [];
        snapshot.forEach(doc => {
          list.push(doc.data());
        });
        return list.sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date));
      } catch (e) {
        console.error("Error fetching orders from Firebase, falling back to local storage:", e);
        isFirebaseResponsive = false;
      }
    }
    // LocalStorage Fallback
    return JSON.parse(localStorage.getItem("rs_orders") || "[]");
  },

  async saveOrder(o) {
    if (useFirebase && isFirebaseResponsive) {
      try {
        await withTimeout(firestoreDb.collection("orders").doc(String(o.id)).set(o), 3000);
        return true;
      } catch (e) {
        console.error("Error saving order to Firebase:", e);
        isFirebaseResponsive = false;
      }
    }
    // LocalStorage Fallback
    const existing = JSON.parse(localStorage.getItem("rs_orders") || "[]");
    existing.unshift(o);
    localStorage.setItem("rs_orders", JSON.stringify(existing));
    return true;
  },

  async updateOrderStatus(id, status) {
    if (useFirebase && isFirebaseResponsive) {
      try {
        await withTimeout(firestoreDb.collection("orders").doc(String(id)).update({ status }), 3000);
        return true;
      } catch (e) {
        console.error("Error updating order status in Firebase:", e);
        isFirebaseResponsive = false;
      }
    }
    // LocalStorage Fallback
    const existing = JSON.parse(localStorage.getItem("rs_orders") || "[]");
    const idx = existing.findIndex(o => o.id === id);
    if (idx >= 0) {
      existing[idx].status = status;
      localStorage.setItem("rs_orders", JSON.stringify(existing));
    }
    return true;
  },

  async deleteOrder(id) {
    if (useFirebase && isFirebaseResponsive) {
      try {
        await withTimeout(firestoreDb.collection("orders").doc(String(id)).delete(), 3000);
        return true;
      } catch (e) {
        console.error("Error deleting order from Firebase:", e);
        isFirebaseResponsive = false;
      }
    }
    // LocalStorage Fallback
    let existing = JSON.parse(localStorage.getItem("rs_orders") || "[]");
    existing = existing.filter(o => o.id !== id);
    localStorage.setItem("rs_orders", JSON.stringify(existing));
    return true;
  },

  // --- Admin Password ---
  async getAdminPassword() {
    if (useFirebase && isFirebaseResponsive) {
      try {
        const doc = await withTimeout(firestoreDb.collection("settings").doc("admin").get(), 3000);
        if (doc.exists) {
          return doc.data().password || "rajendra@123";
        } else {
          // Initialize default password in settings collection
          await withTimeout(firestoreDb.collection("settings").doc("admin").set({ password: "rajendra@123" }), 1500);
          return "rajendra@123";
        }
      } catch (e) {
        console.error("Error fetching password from Firebase:", e);
        isFirebaseResponsive = false;
      }
    }
    return localStorage.getItem("rs_admin_pass") || "rajendra@123";
  },

  async saveAdminPassword(password) {
    if (useFirebase && isFirebaseResponsive) {
      try {
        await withTimeout(firestoreDb.collection("settings").doc("admin").set({ password }), 3000);
        return true;
      } catch (e) {
        console.error("Error saving password to Firebase:", e);
        isFirebaseResponsive = false;
      }
    }
    localStorage.setItem("rs_admin_pass", password);
    return true;
  },

  // --- Categories ---
  async getCategories() {
    if (useFirebase && isFirebaseResponsive) {
      try {
        const snapshot = await withTimeout(firestoreDb.collection("categories").get(), 3000);
        if (snapshot.empty) {
          // Initialize empty Firestore with default categories in parallel
          console.log("Initializing database with default categories...");
          const writePromises = CATEGORIES.map(c => 
            firestoreDb.collection("categories").doc(c.id).set(c)
          );
          await withTimeout(Promise.all(writePromises), 4000);
          return CATEGORIES.map(c => ({ ...c }));
        }
        const list = [];
        snapshot.forEach(doc => {
          list.push(doc.data());
        });
        // Preserve default sorting based on the order of items in CATEGORIES
        const defaultOrder = CATEGORIES.map(c => c.id);
        return list.sort((a, b) => {
          let idxA = defaultOrder.indexOf(a.id);
          let idxB = defaultOrder.indexOf(b.id);
          if (idxA === -1) idxA = 999;
          if (idxB === -1) idxB = 999;
          return idxA - idxB;
        });
      } catch (e) {
        console.error("Error fetching categories from Firebase, falling back to local storage:", e);
        isFirebaseResponsive = false;
      }
    }

    // LocalStorage Fallback
    const stored = localStorage.getItem("rs_categories");
    if (stored) {
      return JSON.parse(stored);
    }
    localStorage.setItem("rs_categories", JSON.stringify(CATEGORIES));
    return CATEGORIES.map(c => ({ ...c }));
  },

  async saveCategory(c) {
    if (useFirebase && isFirebaseResponsive) {
      try {
        await withTimeout(firestoreDb.collection("categories").doc(c.id).set(c), 3000);
        return true;
      } catch (e) {
        console.error("Error saving category to Firebase:", e);
        isFirebaseResponsive = false;
      }
    }

    // LocalStorage
    const stored = localStorage.getItem("rs_categories");
    let list = stored ? JSON.parse(stored) : [...CATEGORIES];
    if (!list.some(x => x.id === c.id)) {
      list.push(c);
      localStorage.setItem("rs_categories", JSON.stringify(list));
    }
    return true;
  }
};
