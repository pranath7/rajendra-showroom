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

        // Merge locally-stored videos back (videos are too large for Firestore)
        const videoStore = JSON.parse(localStorage.getItem("rs_product_videos") || "{}");
        sorted.forEach(p => { if (videoStore[p.id]) p.video = videoStore[p.id]; });
        
        // Cache to LocalStorage to keep in sync
        localStorage.setItem("rs_products", JSON.stringify(sorted));
        return sorted;
      } catch (e) {
        console.error("Error fetching products from Firebase, falling back to local storage:", e);
        // Do not disable Firebase for the whole session just for one slow query, but you can flag it
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
    // Merge videos
    const videoStore = JSON.parse(localStorage.getItem("rs_product_videos") || "{}");
    fallbackList.forEach(p => { if (videoStore[p.id]) p.video = videoStore[p.id]; });
    return fallbackList;
  },

  async saveProduct(p) {
    // ── Separate video from the product doc (videos are too large for Firestore 1MB limit)
    const videoData = p.video || null;
    const productWithoutVideo = { ...p };
    delete productWithoutVideo.video;

    // Save video separately in localStorage keyed by product ID
    const videoStore = JSON.parse(localStorage.getItem("rs_product_videos") || "{}");
    if (videoData) {
      videoStore[p.id] = videoData;
    } else {
      delete videoStore[p.id]; // remove if video was deleted
    }
    localStorage.setItem("rs_product_videos", JSON.stringify(videoStore));

    let firebaseError = null;
    if (useFirebase && isFirebaseResponsive) {
      try {
        // Save product WITHOUT video to Firestore
        await withTimeout(firestoreDb.collection("products").doc(String(p.id)).set(productWithoutVideo), 6000);
      } catch (e) {
        console.error("Error saving product to Firebase:", e);
        firebaseError = e.message || e;
      }
    }
    
    // Always update LocalStorage products list (without video embedded, video is in rs_product_videos)
    const stored = localStorage.getItem("rs_products");
    let list = stored ? JSON.parse(stored) : DEFAULT_PRODUCTS.map(x => ({ ...x }));
    const idx = list.findIndex(x => x.id === p.id);
    // Store without video in the list (video lives in rs_product_videos)
    if (idx >= 0) {
      list[idx] = productWithoutVideo;
    } else {
      list.push(productWithoutVideo);
    }
    localStorage.setItem("rs_products", JSON.stringify(list));
    
    if (firebaseError) {
      return { success: false, error: firebaseError, mode: "local_only" };
    }
    return { success: true, mode: useFirebase ? "firebase" : "local" };
  },

  async deleteProduct(id) {
    let firebaseError = null;
    if (useFirebase && isFirebaseResponsive) {
      try {
        await withTimeout(firestoreDb.collection("products").doc(String(id)).delete(), 4000);
      } catch (e) {
        console.error("Error deleting product from Firebase:", e);
        firebaseError = e.message || e;
      }
    }
    
    // Always update LocalStorage as well!
    const stored = localStorage.getItem("rs_products");
    if (stored) {
      let list = JSON.parse(stored);
      list = list.filter(x => x.id !== id);
      localStorage.setItem("rs_products", JSON.stringify(list));
    }
    
    if (firebaseError) {
      return { success: false, error: firebaseError, mode: "local_only" };
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
          list.push(doc.data());
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
      return JSON.parse(stored);
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
  }
};
