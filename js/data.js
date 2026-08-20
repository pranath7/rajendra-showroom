// ============================================================
//  Rajendra Showroom – Curated Product Catalog
//  Includes Flagship Showroom Collections & Decor Cam Luxury Sets
// ============================================================

let CATEGORIES = [
  { id: "all",          label: "All Products" },
  { id: "Dinner Sets",  label: "Dinner Sets" },
  { id: "Bowls",        label: "Bowls" },
  { id: "Serving",      label: "Serving" },
  { id: "Tea Sets",     label: "Tea Sets" },
  { id: "Glassware",    label: "Glassware" },
  { id: "Cups & Mugs",  label: "Cups & Mugs" },
  { id: "Plates",       label: "Plates" },
  { id: "Cookware",     label: "Cookware" },
  { id: "Cutlery",      label: "Cutlery" },
  { id: "Gift Sets",    label: "Gift Sets" }
];

const DEFAULT_PRODUCTS = [
  {
    "id": 1,
    "name": "Royal 24K Gold Bone China Dinner Set (24 Pcs)",
    "category": "Dinner Sets",
    "price": 8999,
    "originalPrice": 11999,
    "description": "Elegant 24-piece fine bone china dinner set with hand-applied 24K gold rim finishing. Includes 6 dinner plates, 6 quarter plates, 6 soup bowls, 2 large serving bowls, and 1 oval rice platter.",
    "image": "images/cat_dinner.jpg",
    "inStock": true,
    "featured": true,
    "rating": 4.9,
    "reviews": 148,
    "badge": "Best Seller"
  },
  {
    "id": 2,
    "name": "Victorian Emerald & Gold Tea Set (15 Pcs)",
    "category": "Tea Sets",
    "price": 4899,
    "originalPrice": 6499,
    "description": "15-piece porcelain high-tea set featuring 1 teapot, 6 teacups, 6 saucers, 1 milk pot, and 1 sugar bowl. Traditional Victorian royal motifs with high-gloss glaze.",
    "image": "images/cat_tea.jpg",
    "inStock": true,
    "featured": true,
    "rating": 4.8,
    "reviews": 96,
    "badge": "Staff Pick"
  },
  {
    "id": 3,
    "name": "Imperial Handcrafted Stoneware Soup Bowls (Set of 6)",
    "category": "Bowls",
    "price": 1499,
    "originalPrice": 1999,
    "description": "Set of 6 premium speckled stoneware soup and pasta bowls. Microwave, oven, and dishwasher safe with lead-free vitrified protective glaze.",
    "image": "images/cat_dinner.jpg",
    "inStock": true,
    "featured": false,
    "rating": 4.7,
    "reviews": 74
  },
  {
    "id": 4,
    "name": "Imperial Cut Crystal Stemware Glasses (Set of 6)",
    "category": "Glassware",
    "price": 2999,
    "originalPrice": 3899,
    "description": "Set of 6 lead-free high-resonance crystal glasses. Laser-cut ultra-thin rim with high refractive clarity for entertaining and fine dining.",
    "image": "images/cat_glassware.jpg",
    "inStock": true,
    "featured": true,
    "rating": 4.9,
    "reviews": 218,
    "badge": "Luxury"
  },
  {
    "id": 5,
    "name": "Palace Gold Double-Walled Serveware Platter",
    "category": "Serving",
    "price": 2499,
    "originalPrice": 3199,
    "description": "Premium large oval marble-finish ceramic serving platter with gold accent handles. An architectural statement centerpiece for gourmet dining.",
    "image": "images/cat_serveware.jpg",
    "inStock": true,
    "featured": true,
    "rating": 4.8,
    "reviews": 58
  },
  {
    "id": 6,
    "name": "Artisan Matte Ceramic Coffee Mugs (Set of 4)",
    "category": "Cups & Mugs",
    "price": 1199,
    "originalPrice": 1599,
    "description": "Set of 4 handcrafted ceramic mugs in warm matte dual-tone glaze. Ergonomic wide handle with comfortable heat-retention walls.",
    "image": "images/cat_tea.jpg",
    "inStock": true,
    "featured": false,
    "rating": 4.7,
    "reviews": 182
  },
  {
    "id": 7,
    "name": "Gold Rim Vitrified Dinner Plates (Set of 6)",
    "category": "Plates",
    "price": 3299,
    "originalPrice": 4199,
    "description": "Set of 6 fine vitrified porcelain dinner plates with 24K gold detailing. Scratch-resistant, durable, and luxurious for daily elegance.",
    "image": "images/cat_dinner.jpg",
    "inStock": true,
    "featured": true,
    "rating": 4.8,
    "reviews": 112
  },
  {
    "id": 8,
    "name": "Artisanal Porcelain Luxury Gift Box",
    "category": "Gift Sets",
    "price": 3999,
    "originalPrice": 4999,
    "description": "Signature luxury gift set with ribbon box packaging, containing fine ceramic dessert plates, matching mugs, and golden spoons. Ideal for wedding and housewarming gifting.",
    "image": "images/cat_gifting.jpg",
    "inStock": true,
    "featured": true,
    "rating": 4.9,
    "reviews": 84,
    "badge": "Top Gift"
  },
  {
    "id": 9,
    "name": "Granite Non-Stick Ceramic Cookware Trio",
    "category": "Cookware",
    "price": 4999,
    "originalPrice": 6999,
    "description": "3-piece induction and gas compatible ceramic non-stick cookware set (Fry Pan, Kadai with Glass Lid, Saucepan). 100% PFOA and toxin free.",
    "image": "images/cat_cookware.jpg",
    "inStock": true,
    "featured": false,
    "rating": 4.6,
    "reviews": 89
  },
  {
    "id": 10,
    "name": "Royal Brushed Gold 24-Piece Cutlery Set",
    "category": "Cutlery",
    "price": 3499,
    "originalPrice": 4599,
    "description": "24-piece food-grade 18/10 stainless steel cutlery set with titanium brushed gold PVD coating in a satin gift display case. Complete dining service for 6.",
    "image": "images/cat_cookware.jpg",
    "inStock": true,
    "featured": true,
    "rating": 4.9,
    "reviews": 164,
    "badge": "Trending"
  },
  {
    "id": 101,
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
    "description": "A 27-piece dinner set in a champagne finish, featuring a textured radial pattern and fine gold-tone rim detailing. A statement tableware set for serving and entertaining.",
    "image": "images/decor_cam/DC216-champagne.png",
    "inStock": true,
    "featured": true,
    "rating": 4.8,
    "reviews": 45,
    "badge": "Royal Edition"
  },
  {
    "id": 102,
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
    "description": "A 27-piece clear dinner set with a textured radial pattern and delicate gold-tone rim detailing. Designed to bring a refined look to everyday dining and special occasions.",
    "image": "images/decor_cam/DC216-clear.png",
    "inStock": true,
    "featured": true,
    "rating": 4.9,
    "reviews": 53,
    "badge": "Royal Edition"
  },
  {
    "id": 103,
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
    "description": "A 27-piece pearl-white dinner set with a textured radial pattern and delicate gold-tone rim detailing. An elegant coordinated set for dining and entertaining.",
    "image": "images/decor_cam/DC216-pearl-white.png",
    "inStock": true,
    "featured": true,
    "rating": 5,
    "reviews": 61,
    "badge": "Royal Edition"
  },
  {
    "id": 104,
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
    "description": "A 27-piece turquoise dinner set with a textured radial pattern and fine gold-tone rim detailing. A distinctive coordinated set for serving and entertaining.",
    "image": "images/decor_cam/DC216-turquoise.png",
    "inStock": true,
    "featured": true,
    "rating": 4.8,
    "reviews": 69,
    "badge": "Royal Edition"
  },
  {
    "id": 105,
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
    "description": "Set of 6 pearl-white glass dessert bowls with matching spoons. Each bowl measures approximately 10.5 x 5 cm and features a textured finish with gold-tone detailing.",
    "image": "images/decor_cam/DC220-pearl-white.png",
    "inStock": true,
    "featured": true,
    "rating": 4.9,
    "reviews": 77,
    "badge": "Best Seller"
  },
  {
    "id": 106,
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
    "description": "Set of 6 turquoise glass dessert bowls with matching spoons. Each bowl measures approximately 10.5 x 5 cm and features a textured finish with gold-tone detailing.",
    "image": "images/decor_cam/DC220-turquoise.png",
    "inStock": true,
    "featured": true,
    "rating": 5,
    "reviews": 85,
    "badge": "Best Seller"
  },
  {
    "id": 107,
    "name": "Decor Cam DC221 6-Piece Dessert Bowl Set with Spoons & Metal Base - Amber Gold",
    "brand": "Decor Cam",
    "sku": "DC221-AMBER-GOLD",
    "category": "Bowls",
    "colour": "Amber Gold",
    "colors": [
      "Amber Gold"
    ],
    "price": 4250,
    "originalPrice": 5313,
    "description": "Set of 6 amber-gold glass dessert or ice-cream bowls with spoons and metal bases. Each bowl measures approximately 10.5 x 8 cm, combining a textured glass bowl with an elevated metal base.",
    "image": "images/decor_cam/DC221-amber-gold.png",
    "inStock": true,
    "featured": true,
    "rating": 4.8,
    "reviews": 93,
    "badge": "Best Seller"
  },
  {
    "id": 108,
    "name": "Decor Cam DC221 6-Piece Dessert Bowl Set with Spoons & Metal Base - Green",
    "brand": "Decor Cam",
    "sku": "DC221-GREEN",
    "category": "Bowls",
    "colour": "Green",
    "colors": [
      "Green"
    ],
    "price": 4250,
    "originalPrice": 5313,
    "description": "Set of 6 green glass dessert or ice-cream bowls with spoons and metal bases. Each bowl measures approximately 10.5 x 8 cm, combining a textured glass bowl with an elevated metal base.",
    "image": "images/decor_cam/DC221-green.png",
    "inStock": true,
    "featured": true,
    "rating": 4.9,
    "reviews": 101,
    "badge": "Best Seller"
  },
  {
    "id": 109,
    "name": "Decor Cam DC224 3-Tier Cake Stand - Champagne",
    "brand": "Decor Cam",
    "sku": "DC224-CHAMPAGNE",
    "category": "Serving",
    "colour": "Champagne",
    "colors": [
      "Champagne"
    ],
    "price": 2125,
    "originalPrice": 2656,
    "description": "A champagne-colour three-tier cake stand with three textured serving plates and a gold-tone centre pole. Approximate overall size: 27 x 21 x 16 cm.",
    "image": "images/decor_cam/DC224-champagne.png",
    "inStock": true,
    "featured": true,
    "rating": 5,
    "reviews": 109,
    "badge": "Trending"
  },
  {
    "id": 110,
    "name": "Decor Cam DC224 3-Tier Cake Stand - Clear",
    "brand": "Decor Cam",
    "sku": "DC224-CLEAR",
    "category": "Serving",
    "colour": "Clear",
    "colors": [
      "Clear"
    ],
    "price": 2125,
    "originalPrice": 2656,
    "description": "A clear three-tier cake stand with three textured serving plates and a gold-tone centre pole. Approximate overall size: 27 x 21 x 16 cm.",
    "image": "images/decor_cam/DC224-clear.png",
    "inStock": true,
    "featured": true,
    "rating": 4.8,
    "reviews": 117,
    "badge": "Trending"
  },
  {
    "id": 111,
    "name": "Decor Cam DC224 3-Tier Cake Stand - Pearl White",
    "brand": "Decor Cam",
    "sku": "DC224-PEARL-WHITE",
    "category": "Serving",
    "colour": "Pearl White",
    "colors": [
      "Pearl White"
    ],
    "price": 2125,
    "originalPrice": 2656,
    "description": "A pearl-white three-tier cake stand with three textured serving plates and a gold-tone centre pole. Approximate overall size: 27 x 21 x 16 cm.",
    "image": "images/decor_cam/DC224-pearl-white.png",
    "inStock": true,
    "featured": true,
    "rating": 4.9,
    "reviews": 125,
    "badge": "Trending"
  },
  {
    "id": 112,
    "name": "Decor Cam DC224 3-Tier Cake Stand - Turquoise",
    "brand": "Decor Cam",
    "sku": "DC224-TURQUOISE",
    "category": "Serving",
    "colour": "Turquoise",
    "colors": [
      "Turquoise"
    ],
    "price": 2125,
    "originalPrice": 2656,
    "description": "A turquoise three-tier cake stand with three textured serving plates and a gold-tone centre pole. Approximate overall size: 27 x 21 x 16 cm.",
    "image": "images/decor_cam/DC224-turquoise.png",
    "inStock": true,
    "featured": true,
    "rating": 5,
    "reviews": 133,
    "badge": "Trending"
  }
];
