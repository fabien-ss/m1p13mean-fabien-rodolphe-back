// scripts/seed.js
require("dotenv").config();
const mongoose = require("mongoose");

const Shop = require("../models/Shop");
const Product = require("../models/Product");

// ✅ Fixed IDs (so products can reliably reference shops)
const SHOP_IDS = {
  TECH_PRESTIGE: "69a498b66719393c9bf8a2a1",
  MAISON_MODE: "69a498b66719393c9bf8a2a2",
  MAISON_PARFUMEE: "69a498b66719393c9bf8a2a3",
  CORDONNIER_ROYAL: "69a498b66719393c9bf8a2a4",
  MAISON_INTERIEURE: "69a498b66719393c9bf8a2a5",
  OPTICA_PRIME: "69a498b66719393c9bf8a2a6",
};

// ✅ Shops (re-enabled) — IMPORTANT: set _id so they match SHOP_IDS
const SHOPS = [
  {
    _id: new mongoose.Types.ObjectId(SHOP_IDS.TECH_PRESTIGE),
    name: "Tech & Prestige",
    description:
      "L’excellence technologique au service de votre quotidien. Des pièces rares et un service après-vente sur mesure dans un cadre raffiné.",
    email: "contact@techprestige.mg",
    phone: "+261 34 00 000 01",
    manager: "69a497363c2ca3647feb71ab",
    creationDate: new Date("2023-01-15"),
    type: "Électronique de Luxe",
    location: "Box 1, RDC",
    images: [
      "https://images.unsplash.com/photo-1550009158-9ebf69173e03?q=80&w=2000",
      "https://placehold.co/400x400/0f172a/ffffff?text=TP",
    ],
    isActive: true,
  },
  {
    _id: new mongoose.Types.ObjectId(SHOP_IDS.MAISON_MODE),
    name: "Maison de la Mode",
    description:
      "Haute couture et prêt-à-porter de luxe. Découvrez des collections exclusives issues des plus grands créateurs internationaux.",
    email: "boutique@maisonmode.mg",
    phone: "+261 34 00 000 02",
    manager: "69a497363c2ca3647feb71ab",
    creationDate: new Date("2023-05-20"),
    type: "Mode & Accessoires",
    location: "Box 2, RDC",
    images: [
      "https://img.freepik.com/photos-gratuite/interieur-magasin-vetements-marchandises-elegantes-etageres-design-marque-mode-vetements-decontractes-dans-boutique-moderne-salle-exposition-mode-vide-dans-centre-commercial-marchandises-elegantes_482257-65537.jpg?semt=ais_hybrid&w=740&q=80",
      "https://placehold.co/400x400/1e293b/ffffff?text=MM",
    ],
    isActive: true,
  },
  {
    _id: new mongoose.Types.ObjectId(SHOP_IDS.MAISON_PARFUMEE),
    name: "Maison Parfumée",
    description:
      "Parfums rares, bougies couture et soins haut de gamme. Une signature olfactive pour chaque moment.",
    email: "bonjour@maisonparfumee.mg",
    phone: "+261 34 00 000 03",
    manager: "69a497363c2ca3647feb71ab",
    creationDate: new Date("2023-09-10"),
    type: "Beauté & Parfumerie",
    location: "Box 6, RDC",
    images: [
      "https://images.unsplash.com/photo-1541643600914-78b084683601?q=80&w=2000",
      "https://placehold.co/400x400/4f46e5/ffffff?text=MP",
    ],
    isActive: true,
  },
  {
    _id: new mongoose.Types.ObjectId(SHOP_IDS.CORDONNIER_ROYAL),
    name: "Cordonnier Royal",
    description:
      "Souliers cousus main, maroquinerie fine et accessoires de caractère. L’artisanat au sommet.",
    email: "contact@cordonnierroyal.mg",
    phone: "+261 34 00 000 04",
    manager: "69a497363c2ca3647feb71ab",
    creationDate: new Date("2022-11-04"),
    type: "Mode & Accessoires",
    location: "Box 12, 1er étage",
    images: [
      "https://images.unsplash.com/photo-1528701800489-20be3c8c1d39?q=80&w=2000",
      "https://placehold.co/400x400/0f172a/ffffff?text=CR",
    ],
    isActive: true,
  },
  {
    _id: new mongoose.Types.ObjectId(SHOP_IDS.MAISON_INTERIEURE),
    name: "Maison Intérieure",
    description:
      "Mobilier design, décoration premium et pièces artisanales pour un intérieur élégant.",
    email: "hello@maisoninterieure.mg",
    phone: "+261 34 00 000 05",
    manager: "69a497363c2ca3647feb71ab",
    creationDate: new Date("2024-02-18"),
    type: "Maison & Décoration",
    location: "Box 3, 1er étage",
    images: [
      "https://images.unsplash.com/photo-1505693314120-0d443867891c?q=80&w=2000",
      "https://placehold.co/400x400/1e293b/ffffff?text=MI",
    ],
    isActive: true,
  },
  {
    _id: new mongoose.Types.ObjectId(SHOP_IDS.OPTICA_PRIME),
    name: "Optica Prime",
    description:
      "Lunettes premium, verres polarisés et montures titane. Un style précis, une vision parfaite.",
    email: "service@opticaprime.mg",
    phone: "+261 34 00 000 06",
    manager: "69a497363c2ca3647feb71ab",
    creationDate: new Date("2024-06-01"),
    type: "Accessoires & Optique",
    location: "Box 9, RDC",
    images: [
      "https://images.unsplash.com/photo-1511499767150-a48a237f0083?q=80&w=2000",
      "https://placehold.co/400x400/4f46e5/ffffff?text=OP",
    ],
    isActive: true,
  },
];
const PRODUCTS = [
  {
    name: "Casque Studio Carbon",
    description:
      "Une acoustique parfaite enveloppée dans un cuir de veau véritable et une structure en carbone brossé.",
    price: 1250,
    devise: "MGA",
    stock: 5,
    brand: "Acoustics Luxe",
    barcode: "1234567890123",
    sku: "ACC-STO-001",
    model: "V2",
    available: true,
    images: [
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=800",
    ],
    tags: ["Premium", "Audio", "Studio"],
    shop: SHOP_IDS.TECH_PRESTIGE,
    creationDate: new Date(),
    modificationDate: new Date(),
  },
  {
    name: "Montre Horizon Gold",
    description:
      "Une pièce d’horlogerie rare avec mouvement automatique et finitions en or 18 carats.",
    price: 5800,
    devise: "MGA",
    stock: 2,
    brand: "Zenith",
    barcode: "9876543210987",
    sku: "WTC-HRZ-GOLD",
    model: "2024 Edition",
    available: true,
    images: [
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=800",
    ],
    tags: ["Luxe", "Watch", "Gold"],
    shop: SHOP_IDS.TECH_PRESTIGE,
    creationDate: new Date(),
    modificationDate: new Date(),
  },
  {
    name: "Parfum Élixir Nuit",
    description:
      "Notes ambrées et boisées, flacon sculpté, sillage intense pour soirées élégantes.",
    price: 420,
    devise: "MGA",
    stock: 9,
    brand: "Maison Parfumée",
    barcode: "7401234567890",
    sku: "PRF-ELX-003",
    model: "Intense",
    available: true,
    images: [
      "https://images.unsplash.com/photo-1541643600914-78b084683601?q=80&w=800",
    ],
    tags: ["Parfum", "Luxe", "Nuit"],
    shop: SHOP_IDS.MAISON_PARFUMEE,
    creationDate: new Date(),
    modificationDate: new Date(),
  },
  {
    name: "Sac Cuir Saffiano",
    description:
      "Cuir saffiano italien, finition impeccable, intérieur doublé soie, signature discrète.",
    price: 2100,
    devise: "MGA",
    stock: 3,
    brand: "Atelier Milano",
    barcode: "7401234567891",
    sku: "BAG-SAF-004",
    model: "Classic",
    available: true,
    images: [
      "https://images.unsplash.com/photo-1591561954557-26941169b49e?q=80&w=800",
    ],
    tags: ["Cuir", "Sac", "Premium"],
    shop: SHOP_IDS.MAISON_MODE,
    creationDate: new Date(),
    modificationDate: new Date(),
  },
  {
    name: "Veste Tailoring Silk",
    description:
      "Veste structurée en laine froide avec doublure soie, coupe moderne et épaule nette.",
    price: 1650,
    devise: "MGA",
    stock: 6,
    brand: "Maison de la Mode",
    barcode: "7401234567892",
    sku: "JKT-SLK-005",
    model: "SS25",
    available: true,
    images: [
      "https://images.unsplash.com/photo-1520975682031-a2b5f2a9b0d0?q=80&w=800",
    ],
    tags: ["Mode", "Veste", "Tailoring"],
    shop: SHOP_IDS.MAISON_MODE,
    creationDate: new Date(),
    modificationDate: new Date(),
  },
  {
    name: "Chaussures Derby Patine",
    description:
      "Derby cousu Goodyear, patine artisanale, semelle cuir, confort premium.",
    price: 980,
    devise: "MGA",
    stock: 10,
    brand: "Cordonnier Royal",
    barcode: "7401234567893",
    sku: "SHO-DRB-006",
    model: "Hand-Patina",
    available: true,
    images: [
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=800",
    ],
    tags: ["Chaussures", "Cuir", "Derby"],
    shop: SHOP_IDS.CORDONNIER_ROYAL,
    creationDate: new Date(),
    modificationDate: new Date(),
  },
  {
    name: "Smartphone Aurora Pro",
    description:
      "Écran AMOLED, finition titane, photo nocturne avancée, performances ultra fluides.",
    price: 5200,
    devise: "MGA",
    stock: 7,
    brand: "Aurora",
    barcode: "7401234567894",
    sku: "PHN-AUR-007",
    model: "Pro Max",
    available: true,
    images: [
      "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=800",
    ],
    tags: ["Smartphone", "Premium", "AMOLED"],
    shop: SHOP_IDS.TECH_PRESTIGE,
    creationDate: new Date(),
    modificationDate: new Date(),
  },
  {
    name: "Enceinte Marbre Signature",
    description:
      "Enceinte hi-fi design marbre, basses profondes, connectivité multiroom.",
    price: 3100,
    devise: "MGA",
    stock: 4,
    brand: "Acoustics Luxe",
    barcode: "7401234567895",
    sku: "SPK-MRB-008",
    model: "Signature",
    available: true,
    images: [
      "https://images.unsplash.com/photo-1545454675-3531b543be5d?q=80&w=800",
    ],
    tags: ["Audio", "Design", "HiFi"],
    shop: SHOP_IDS.TECH_PRESTIGE,
    creationDate: new Date(),
    modificationDate: new Date(),
  },
  {
    name: "Crème Régénérante 24K",
    description:
      "Texture velours, actifs hydratants, éclat immédiat, soin premium quotidien.",
    price: 650,
    devise: "MGA",
    stock: 12,
    brand: "Dermaluxe",
    barcode: "7401234567896",
    sku: "CRM-24K-009",
    model: "Gold Care",
    available: true,
    images: [
      "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?q=80&w=800",
    ],
    tags: ["Skincare", "Gold", "Luxury"],
    shop: SHOP_IDS.MAISON_PARFUMEE,
    creationDate: new Date(),
    modificationDate: new Date(),
  },
  {
    name: "Lunettes Aviator Titanium",
    description:
      "Monture titane ultra légère, verres polarisés, style intemporel haut de gamme.",
    price: 740,
    devise: "MGA",
    stock: 8,
    brand: "Optica Prime",
    barcode: "7401234567897",
    sku: "GLS-AVI-010",
    model: "Titan",
    available: true,
    images: [
      "https://images.unsplash.com/photo-1511499767150-a48a237f0083?q=80&w=800",
    ],
    tags: ["Sunglasses", "Titanium", "Aviator"],
    shop: SHOP_IDS.OPTICA_PRIME,
    creationDate: new Date(),
    modificationDate: new Date(),
  },
  {
    name: "Robe Soie Nuit Étoilée",
    description:
      "Soie naturelle, tombé fluide, détails couture, élégance pour événements.",
    price: 2400,
    devise: "MGA",
    stock: 2,
    brand: "Maison de la Mode",
    barcode: "7401234567898",
    sku: "DRS-SLK-011",
    model: "Couture",
    available: true,
    images: [
      "https://images.unsplash.com/photo-1520975958225-8d2b2f5b6d4c?q=80&w=800",
    ],
    tags: ["Robe", "Soie", "Couture"],
    shop: SHOP_IDS.MAISON_MODE,
    creationDate: new Date(),
    modificationDate: new Date(),
  },
  {
    name: "Bougie Ambre & Cèdre",
    description:
      "Cire végétale, notes ambrées, diffusion lente, ambiance chic à la maison.",
    price: 180,
    devise: "MGA",
    stock: 25,
    brand: "Maison Intérieure",
    barcode: "7401234567899",
    sku: "CND-AMC-012",
    model: "Classic",
    available: true,
    images: [
      "https://images.unsplash.com/photo-1519710164239-da123dc03ef4?q=80&w=800",
    ],
    tags: ["Home", "Bougie", "Ambre"],
    shop: SHOP_IDS.MAISON_INTERIEURE,
    creationDate: new Date(),
    modificationDate: new Date(),
  },
  {
    name: "Fauteuil Velours Riviera",
    description:
      "Velours premium, structure bois massif, confort profond, style lounge.",
    price: 3900,
    devise: "MGA",
    stock: 1,
    brand: "Maison Intérieure",
    barcode: "7401234567800",
    sku: "CHR-VLR-013",
    model: "Riviera",
    available: true,
    images: [
      "https://images.unsplash.com/photo-1549187774-b4e9b0445b41?q=80&w=800",
    ],
    tags: ["Mobilier", "Velours", "Design"],
    shop: SHOP_IDS.MAISON_INTERIEURE,
    creationDate: new Date(),
    modificationDate: new Date(),
  },
  {
    name: "Casque Gaming Phantom",
    description:
      "Spatial audio, micro studio, confort long usage, design minimal premium.",
    price: 980,
    devise: "MGA",
    stock: 14,
    brand: "Acoustics Luxe",
    barcode: "7401234567801",
    sku: "GAM-PHN-014",
    model: "2025",
    available: true,
    images: [
      "https://images.unsplash.com/photo-1580894908361-967195033215?q=80&w=800",
    ],
    tags: ["Gaming", "Audio", "Headset"],
    shop: SHOP_IDS.TECH_PRESTIGE,
    creationDate: new Date(),
    modificationDate: new Date(),
  },
  {
    name: "Bracelet Perles Noires",
    description:
      "Perles naturelles, fermoir acier poli, pièce raffinée pour un look signature.",
    price: 520,
    devise: "MGA",
    stock: 11,
    brand: "Zenith",
    barcode: "7401234567802",
    sku: "BRC-PRL-015",
    model: "Noir",
    available: true,
    images: [
      "https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?q=80&w=800",
    ],
    tags: ["Bijoux", "Perles", "Luxe"],
    shop: SHOP_IDS.CORDONNIER_ROYAL,
    creationDate: new Date(),
    modificationDate: new Date(),
  },
  {
    name: "Chemise Popeline Milano",
    description:
      "Popeline fine, col structuré, coupe nette, idéale pour looks business.",
    price: 640,
    devise: "MGA",
    stock: 16,
    brand: "Atelier Milano",
    barcode: "7401234567803",
    sku: "SHI-POP-016",
    model: "Milano",
    available: true,
    images: [
      "https://images.unsplash.com/photo-1520975661595-6453be3f7070?q=80&w=800",
    ],
    tags: ["Chemise", "Business", "Premium"],
    shop: SHOP_IDS.MAISON_MODE,
    creationDate: new Date(),
    modificationDate: new Date(),
  },
  {
    name: "Console NeoWave Limited",
    description:
      "Édition limitée, performances next-gen, design premium, manette exclusive.",
    price: 6800,
    devise: "MGA",
    stock: 4,
    brand: "NeoWave",
    barcode: "7401234567804",
    sku: "CNS-NWV-017",
    model: "Limited",
    available: true,
    images: [
      "https://images.unsplash.com/photo-1606813909355-c84b237d7a61?q=80&w=800",
    ],
    tags: ["Gaming", "Console", "Limited"],
    shop: SHOP_IDS.TECH_PRESTIGE,
    creationDate: new Date(),
    modificationDate: new Date(),
  },
  {
    name: "Tapis Laine Graphique",
    description:
      "Laine tissée, motifs modernes, finition premium, douceur remarquable.",
    price: 1200,
    devise: "MGA",
    stock: 7,
    brand: "Maison Intérieure",
    barcode: "7401234567805",
    sku: "RUG-GRP-018",
    model: "Graph",
    available: true,
    images: [
      "https://images.unsplash.com/photo-1615873968403-89e068629265?q=80&w=800",
    ],
    tags: ["Déco", "Laine", "Design"],
    shop: SHOP_IDS.MAISON_INTERIEURE,
    creationDate: new Date(),
    modificationDate: new Date(),
  },
  {
    name: "Sérum Lumière C+",
    description:
      "Vitamine C stabilisée, éclat instantané, texture légère, routine premium.",
    price: 390,
    devise: "MGA",
    stock: 18,
    brand: "Dermaluxe",
    barcode: "7401234567806",
    sku: "SER-LUM-019",
    model: "C+",
    available: true,
    images: [
      "https://images.unsplash.com/photo-1611930022073-b7a4ba5fcccd?q=80&w=800",
    ],
    tags: ["Skincare", "VitC", "Glow"],
    shop: SHOP_IDS.MAISON_PARFUMEE,
    creationDate: new Date(),
    modificationDate: new Date(),
  },
  {
    name: "Ceinture Cuir Double Tour",
    description:
      "Cuir pleine fleur, boucle acier brossé, finition artisanale.",
    price: 360,
    devise: "MGA",
    stock: 22,
    brand: "Cordonnier Royal",
    barcode: "7401234567807",
    sku: "BLT-DBL-020",
    model: "Double",
    available: true,
    images: [
      "https://images.unsplash.com/photo-1551028719-00167b16eac5?q=80&w=800",
    ],
    tags: ["Cuir", "Ceinture", "Classic"],
    shop: SHOP_IDS.CORDONNIER_ROYAL,
    creationDate: new Date(),
    modificationDate: new Date(),
  },
];

async function run() {
  const uri = process.env.MONGO_URI;
  if (!uri) throw new Error("MONGO_URI is missing in .env");

  await mongoose.connect(uri);
  console.log("✅ Mongo connected");

  // 🔁 Reset collections (uncomment if you want full reset)
  await Product.deleteMany({});
  await Shop.deleteMany({});

  // 1) Insert shops first
  // If you rerun often, insertMany can error on duplicate _id.
  // Using upsert avoids duplicate crashes.
  const shopOps = SHOPS.map((shop) => ({
    updateOne: {
      filter: { _id: shop._id },
      update: { $set: shop },
      upsert: true,
    },
  }));
  await Shop.bulkWrite(shopOps);
  console.log(`✅ Shops upserted: ${SHOPS.length}`);

  // 2) Insert products after (and ensure shop is ObjectId)
  const productsToInsert = PRODUCTS.map((p) => ({
    ...p,
    shop: new mongoose.Types.ObjectId(p.shop), // p.shop is a string id in SHOP_IDS
  }));

  await Product.insertMany(productsToInsert);
  console.log(`✅ Products inserted: ${PRODUCTS.length}`);

  await mongoose.disconnect();
  console.log("✅ Disconnected");
}

run().catch((e) => {
  console.error("❌ Seed error:", e);
  process.exit(1);
});