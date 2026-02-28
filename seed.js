const mongoose = require('mongoose');

const User = require('./models/User');
const Role = require('./models/Role');
const Shop = require('./models/Boutique');
const Category = require('./models/Category'); // adapte le chemin si besoin
const Product = require('./models/product');
const ProductMovement = require('./models/productMovement');
const Order = require('./models/Commande');

async function seed() {
    
    // mongodb://admin:pass12345@localhost:27018
    
    await mongoose.connect('mongodb://admin:pass12345@localhost:27018/test-ecommerce');


  console.log("Cleaning database...");
  await Promise.all([
    User.deleteMany({}),
    Role.deleteMany({}),
    Shop.deleteMany({}),
    Category.deleteMany({}),
    Product.deleteMany({}),
    ProductMovement.deleteMany({}),
    Order.deleteMany({})
  ]);

  // ----------------------
  // ROLES
  // ----------------------
  const adminRole = await Role.create({
    name: "admin",
    description: "Super administrateur"
  });

  const boutiqueRole = await Role.create({
    name: "boutique",
    description: "Gestionnaire de boutique"
  });

  const clientRole = await Role.create({
    name: "client",
    description: "Client standard"
  });

  // ----------------------
  // USERS
  // ----------------------
  const adminUser = await User.create({
    email: "admin@test.com",
    firstName: "Super",
    name: "Admin",
    password: "admin123",
    role: adminRole._id
  });

  const boutiqueUser = await User.create({
    email: "shop@test.com",
    firstName: "John",
    name: "Manager",
    password: "shop123",
    role: boutiqueRole._id
  });

  const clientUser = await User.create({
    email: "client@test.com",
    firstName: "Jane",
    name: "Client",
    password: "client123",
    role: clientRole._id
  });

  // ----------------------
  // SHOP
  // ----------------------
  const shop = await Shop.create({
    name: "Tech Store",
    description: "Boutique spécialisée en produits tech",
    email: "contact@techstore.com",
    phone: "0340000000",
    manager: boutiqueUser._id,
    type: "electronics",
    images: [
      "/uploads/shop1.jpg",
      "/uploads/shop2.jpg"
    ],
    isActive: true
  });

  // ----------------------
  // CATEGORIES
  // ----------------------
  const electronicsCategory = await Category.create({
    name: "Electronics",
    description: "Produits électroniques",
    createdBy: adminUser._id
  });

  const smartphoneCategory = await Category.create({
    name: "Smartphones",
    description: "Téléphones intelligents",
    parent: electronicsCategory._id,
    createdBy: adminUser._id
  });

  // ----------------------
  // PRODUCTS
  // ----------------------
  const product1 = await Product.create({
    name: "iPhone 14",
    description: "Apple smartphone dernière génération",
    devise: "MGA",
    stock: 50,
    brand: "Apple",
    barcode: "1234567890123",
    sku: "IPHONE14-001",
    model: "A2890",
    images: [
      "/uploads/iphone1.jpg",
      "/uploads/iphone2.jpg"
    ],
    category: smartphoneCategory._id,
    tags: ["smartphone", "apple", "ios"],
    shop: shop._id,
    modifiedBy: boutiqueUser._id
  });

  const product2 = await Product.create({
    name: "Samsung Galaxy S23",
    description: "Smartphone Android haut de gamme",
    devise: "MGA",
    stock: 30,
    brand: "Samsung",
    barcode: "9876543210987",
    sku: "S23-001",
    model: "SM-S911B",
    images: [
      "/uploads/s23-1.jpg",
      "/uploads/s23-2.jpg"
    ],
    category: smartphoneCategory._id,
    tags: ["smartphone", "android", "samsung"],
    shop: shop._id,
    modifiedBy: boutiqueUser._id
  });

  const product3 = await Product.create({
    name: "Casque Bluetooth",
    description: "Casque sans fil avec réduction de bruit",
    devise: "MGA",
    stock: 100,
    brand: "Sony",
    barcode: "1112223334445",
    sku: "SONY-H1000",
    model: "WH-1000XM5",
    images: [
      "/uploads/casque1.jpg"
    ],
    category: electronicsCategory._id,
    tags: ["audio", "bluetooth"],
    shop: shop._id,
    modifiedBy: boutiqueUser._id
  });

  // ----------------------
  // PRODUCT MOVEMENTS
  // ----------------------
  await ProductMovement.create({
    product: product1._id,
    type: "in",
    quantity: 50,
    reason: "initial stock",
    createdBy: boutiqueUser._id
  });

  await ProductMovement.create({
    product: product2._id,
    type: "in",
    quantity: 30,
    reason: "initial stock",
    createdBy: boutiqueUser._id
  });

  await ProductMovement.create({
    product: product3._id,
    type: "in",
    quantity: 100,
    reason: "initial stock",
    createdBy: boutiqueUser._id
  });

  await ProductMovement.create({
    product: product1._id,
    type: "out",
    quantity: 2,
    reason: "sale",
    createdBy: boutiqueUser._id
  });

  // ----------------------
  // ORDER
  // ----------------------
  await Order.create({
    client: clientUser._id,
    products: [
      {
        produit: product1._id,
        quantite: 2
      },
      {
        produit: product3._id,
        quantite: 1
      }
    ],
    total: 3500000,
    statut: "in progress"
  });

  console.log("Seeding finished.");
  process.exit();
}

seed();