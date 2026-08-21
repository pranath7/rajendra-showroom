// ============================================================
//  Rajendra Showroom – Exclusive Decor Cam Luxury Collection
// ============================================================

let CATEGORIES = [
  {
    "id": "all",
    "label": "All Products"
  },
  {
    "id": "Dinner Sets",
    "label": "Dinner Sets"
  },
  {
    "id": "Bowls",
    "label": "Bowls & Desserts"
  },
  {
    "id": "Serving",
    "label": "Serving & Stands"
  }
];

const DEFAULT_PRODUCTS = [
  {
    "id": "DC216-CHAMPAGNE",
    "name": "Decor Cam DC216 27-Piece Dinner Set - Champagne",
    "brand": "Decor Cam",
    "sku": "DC216-CHAMPAGNE",
    "category": "Dinner Sets",
    "colour": "Champagne",
    "colors": [
      "Champagne"
    ],
    "price": 13499,
    "originalPrice": 16874,
    "description": "A 27-piece luxury tableware dinner set in an opulent champagne finish, featuring a textured radial pattern and fine gold-tone rim detailing. Includes dinner plates, side plates, curry/dessert bowls, and serving bowls for fine dining.",
    "image": "images/decor_cam/DC216-champagne.png",
    "images": [
      "images/decor_cam/DC216-champagne.png"
    ],
    "inStock": true,
    "featured": true,
    "rating": 4.9,
    "reviews": 45,
    "badge": "Royal Edition"
  },
  {
    "id": "DC216-CLEAR",
    "name": "Decor Cam DC216 27-Piece Dinner Set - Clear",
    "brand": "Decor Cam",
    "sku": "DC216-CLEAR",
    "category": "Dinner Sets",
    "colour": "Clear",
    "colors": [
      "Clear"
    ],
    "price": 13499,
    "originalPrice": 16874,
    "description": "A 27-piece clear crystal-grade dinner set with a textured radial pattern and delicate gold-tone rim detailing. Designed to bring a refined luxury look to special occasions.",
    "image": "images/decor_cam/DC216-clear.png",
    "images": [
      "images/decor_cam/DC216-clear.png"
    ],
    "inStock": true,
    "featured": true,
    "rating": 4.9,
    "reviews": 53,
    "badge": "Royal Edition"
  },
  {
    "id": "DC216-PEARL-WHITE",
    "name": "Decor Cam DC216 27-Piece Dinner Set - Pearl White",
    "brand": "Decor Cam",
    "sku": "DC216-PEARL-WHITE",
    "category": "Dinner Sets",
    "colour": "Pearl White",
    "colors": [
      "Pearl White"
    ],
    "price": 13499,
    "originalPrice": 16874,
    "description": "A 27-piece pearl-white luxury dinner set with a textured radial pattern and delicate gold-tone rim detailing. An elegant coordinated set for premium dining and entertaining.",
    "image": "images/decor_cam/DC216-pearl-white.png",
    "images": [
      "images/decor_cam/DC216-pearl-white.png"
    ],
    "inStock": true,
    "featured": true,
    "rating": 5,
    "reviews": 61,
    "badge": "Best Seller"
  },
  {
    "id": "DC216-TURQUOISE",
    "name": "Decor Cam DC216 27-Piece Dinner Set - Turquoise",
    "brand": "Decor Cam",
    "sku": "DC216-TURQUOISE",
    "category": "Dinner Sets",
    "colour": "Turquoise",
    "colors": [
      "Turquoise"
    ],
    "price": 13499,
    "originalPrice": 16874,
    "description": "A 27-piece turquoise dinner set with a textured radial pattern and delicate gold-tone rim detailing. Brings a vibrant, upscale aesthetic to dinner parties.",
    "image": "images/decor_cam/DC216-turquoise.png",
    "images": [
      "images/decor_cam/DC216-turquoise.png"
    ],
    "inStock": true,
    "featured": true,
    "rating": 4.8,
    "reviews": 38,
    "badge": "Trending"
  },
  {
    "id": "DC220-PEARL-WHITE",
    "name": "Decor Cam DC220 6-Piece Dessert Bowl Set with Spoons - Pearl White",
    "brand": "Decor Cam",
    "sku": "DC220-PEARL-WHITE",
    "category": "Bowls",
    "colour": "Pearl White",
    "colors": [
      "Pearl White"
    ],
    "price": 2750,
    "originalPrice": 3438,
    "description": "A 6-piece dessert bowl set in pearl white, accompanied by matching gold-finished spoons. Ideal for serving desserts, sweets, puddings, and ice creams with sophistication.",
    "image": "images/decor_cam/DC220-pearl-white.png",
    "images": [
      "images/decor_cam/DC220-pearl-white.png"
    ],
    "inStock": true,
    "featured": true,
    "rating": 4.8,
    "reviews": 29,
    "badge": "Gift Favorite"
  },
  {
    "id": "DC220-TURQUOISE",
    "name": "Decor Cam DC220 6-Piece Dessert Bowl Set with Spoons - Turquoise",
    "brand": "Decor Cam",
    "sku": "DC220-TURQUOISE",
    "category": "Bowls",
    "colour": "Turquoise",
    "colors": [
      "Turquoise"
    ],
    "price": 2750,
    "originalPrice": 3438,
    "description": "A 6-piece dessert bowl set in vibrant turquoise, paired with matching spoons. Designed to elevate festive dessert courses and after-dinner sweets.",
    "image": "images/decor_cam/DC220-turquoise.png",
    "images": [
      "images/decor_cam/DC220-turquoise.png"
    ],
    "inStock": true,
    "featured": true,
    "rating": 4.9,
    "reviews": 34,
    "badge": "Gift Favorite"
  },
  {
    "id": "DC221-AMBER-GOLD",
    "name": "Decor Cam DC221 6-Piece Dessert & Ice Cream Bowl Set with Metal Base - Amber Gold",
    "brand": "Decor Cam",
    "sku": "DC221-AMBER-GOLD",
    "category": "Bowls",
    "colour": "Amber Gold",
    "colors": [
      "Amber Gold"
    ],
    "price": 4250,
    "originalPrice": 5313,
    "description": "A set of 6 dessert and ice cream bowls featuring an amber gold finish with a textured surface, supported by an ornate gold-tone metal pedestal base. Perfect for royal hospitality.",
    "image": "images/decor_cam/DC221-amber-gold.png",
    "images": [
      "images/decor_cam/DC221-amber-gold.png"
    ],
    "inStock": true,
    "featured": true,
    "rating": 4.9,
    "reviews": 42,
    "badge": "Luxury"
  },
  {
    "id": "DC221-GREEN",
    "name": "Decor Cam DC221 6-Piece Dessert & Ice Cream Bowl Set with Metal Base - Green",
    "brand": "Decor Cam",
    "sku": "DC221-GREEN",
    "category": "Bowls",
    "colour": "Green",
    "colors": [
      "Green"
    ],
    "price": 4250,
    "originalPrice": 5313,
    "description": "A set of 6 emerald green dessert bowls with textured glass finishing, resting on decorative gold-toned pedestal bases. A timeless royal dessert service centerpiece.",
    "image": "images/decor_cam/DC221-green.png",
    "images": [
      "images/decor_cam/DC221-green.png"
    ],
    "inStock": true,
    "featured": true,
    "rating": 4.8,
    "reviews": 31,
    "badge": "Luxury"
  },
  {
    "id": "DC224-CHAMPAGNE",
    "name": "Decor Cam DC224 3-Tier Luxury Cake Stand - Champagne",
    "brand": "Decor Cam",
    "sku": "DC224-CHAMPAGNE",
    "category": "Serving",
    "colour": "Champagne",
    "colors": [
      "Champagne"
    ],
    "price": 2125,
    "originalPrice": 2656,
    "description": "A 3-tier luxury cake and pastry stand in champagne with textured glass platters and a polished gold-tone central spindle with loop handle. Ideal for high tea, cakes, and appetizers.",
    "image": "images/decor_cam/DC224-champagne.png",
    "images": [
      "images/decor_cam/DC224-champagne.png"
    ],
    "inStock": true,
    "featured": true,
    "rating": 4.9,
    "reviews": 57,
    "badge": "Party Essential"
  },
  {
    "id": "DC224-CLEAR",
    "name": "Decor Cam DC224 3-Tier Luxury Cake Stand - Clear",
    "brand": "Decor Cam",
    "sku": "DC224-CLEAR",
    "category": "Serving",
    "colour": "Clear",
    "colors": [
      "Clear"
    ],
    "price": 2125,
    "originalPrice": 2656,
    "description": "A 3-tier clear glass cake stand with patterned plates and gold-tone central rod. Classic display centerpiece for pastries, cupcakes, and desserts.",
    "image": "images/decor_cam/DC224-clear.png",
    "images": [
      "images/decor_cam/DC224-clear.png"
    ],
    "inStock": true,
    "featured": true,
    "rating": 4.8,
    "reviews": 49,
    "badge": "Party Essential"
  },
  {
    "id": "DC224-PEARL-WHITE",
    "name": "Decor Cam DC224 3-Tier Luxury Cake Stand - Pearl White",
    "brand": "Decor Cam",
    "sku": "DC224-PEARL-WHITE",
    "category": "Serving",
    "colour": "Pearl White",
    "colors": [
      "Pearl White"
    ],
    "price": 2125,
    "originalPrice": 2656,
    "description": "A 3-tier pearl white cake stand with textured radial tiers and gold-tone fittings. A graceful tiered centerpiece for weddings, banquets, and buffet tables.",
    "image": "images/decor_cam/DC224-pearl-white.png",
    "images": [
      "images/decor_cam/DC224-pearl-white.png"
    ],
    "inStock": true,
    "featured": true,
    "rating": 5,
    "reviews": 64,
    "badge": "Top Rated"
  },
  {
    "id": "DC224-TURQUOISE",
    "name": "Decor Cam DC224 3-Tier Luxury Cake Stand - Turquoise",
    "brand": "Decor Cam",
    "sku": "DC224-TURQUOISE",
    "category": "Serving",
    "colour": "Turquoise",
    "colors": [
      "Turquoise"
    ],
    "price": 2125,
    "originalPrice": 2656,
    "description": "A 3-tier turquoise cake stand featuring decorative patterned plates and a central gold-tone rod. An eye-catching centerpiece for celebrations.",
    "image": "images/decor_cam/DC224-turquoise.png",
    "images": [
      "images/decor_cam/DC224-turquoise.png"
    ],
    "inStock": true,
    "featured": true,
    "rating": 4.8,
    "reviews": 36,
    "badge": "Trending"
  }
];
