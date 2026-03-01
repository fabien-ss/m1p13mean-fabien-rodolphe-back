// services/product.service.js
const Product = require('../models/Product');
const ProductMovement = require('../models/ProductMovement');
const Pricing = require('../models/Pricing');
const mongoose = require('mongoose');
const Shop = require('../models/Shop');
const Order = require('../models/Order');
const PromotionService = require('./PromotionService');
class ProductService {

  // Créer un produit
  static async create(data, user, imageUrls) {
    if (user.role !== 'admin' && user.role !== 'boutique') {
      throw new Error('Non autorisé à créer un produit');
    }

    try {
      const { name, category, brand, sku, barcode, model, description, costPrice, sellingPrice, stock, expiryDate, isActive, shop } = data;

      console.log('Creating product with data:', data);

      const shopProduct = await Shop.findById(shop);

      const produit = new Product({
        name,
        category,
        brand,
        sku,
        barcode,
        model,
        description,
        stock: stock ?? 0,
        available: isActive ?? true,
        modifiedBy: user.id,
        shop: shopProduct,
        images: imageUrls,
        price: sellingPrice,
        costPrice: costPrice
      });
      await produit.save();

      if (stock > 0) {
        const movement = new ProductMovement({
          product: produit._id,
          type: 'in',
          quantity: stock,
          reason: 'initial stock',
          createdBy: user.id
        });
        await movement.save();
      }

      const pricing = new Pricing({
        product: produit._id,
        costPrice,
        sellingPrice,
        startDate: new Date(),
        endDate: expiryDate,
        createdBy: user.id
      });
      await pricing.save();

      return produit;

    } catch (err) {
      throw err;
    }
  }

  // Récupérer tous les produits
  static async getAll(user) {
    if (user) {
      const filter = user.role === 'shop' ? { shop: user.shop } : {};
      return await Product.find(filter)
        .populate('shop', 'nom')
        .populate('modifiedBy', 'prenom nom');
    } else {
      return await Product.find({ stock: { $gt: 0 }, available: true })
        .populate('shop', 'nom')
        .populate('modifiedBy', 'prenom nom');
    }
  }

  // Récupérer un produit par ID
  static async getById(id, user) {
    const produit = await Product.findById(id)
      .populate('shop', 'nom')
      .populate('modifiedBy', 'prenom nom');

    if (!produit) throw new Error('Produit non trouvé');

    if (user && user.role === 'shop' && produit.shop._id.toString() !== user.shop.toString()) {
      throw new Error('Non autorisé');
    }

    return produit;
  }

  // Mettre à jour un produit
  static async update(id, data, user) {
    const produit = await Product.findById(id);
    if (!produit) throw new Error('Produit non trouvé');

    if (user.role === 'shop' && produit.shop.toString() !== user.shop.toString()) {
      throw new Error('Non autorisé');
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const { price, sellingPrice, stock, isActive, ...productData } = data;

      // Mettre à jour le produit
      Object.assign(produit, {
        ...productData,
        available: isActive ?? produit.available,
        modifiedBy: user.id,
        modificationDate: new Date()
      });
      await produit.save({ session });

      // Nouveau pricing si les prix changent
      if (price !== undefined || sellingPrice !== undefined) {
        // Clôturer l'ancien pricing actif
        await Pricing.findOneAndUpdate(
          { product: id, endDate: null },
          { endDate: new Date() },
          { session }
        );

        // Créer le nouveau
        const newPricing = new Pricing({
          product: id,
          costPrice: price,
          sellingPrice,
          startDate: new Date(),
          endDate: null,
          createdBy: user.id
        });
        await newPricing.save({ session });
      }

      // Mouvement de stock si le stock change
      if (stock !== undefined && stock !== produit.stock) {
        const diff = stock - produit.stock;
        const movement = new ProductMovement({
          product: id,
          type: diff > 0 ? 'in' : 'out',
          quantity: Math.abs(diff),
          reason: 'adjustment',
          createdBy: user.id
        });
        await movement.save({ session });

        produit.stock = stock;
        await produit.save({ session });
      }

      await session.commitTransaction();
      session.endSession();

      return await Product.findById(id)
        .populate('shop', 'nom')
        .populate('modifiedBy', 'prenom nom');

    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      throw err;
    }
  }

  // Supprimer un produit
  static async delete(id, user) {
    const produit = await Product.findById(id);
    if (!produit) throw new Error('Produit non trouvé');

    if (user.role === 'shop' && produit.shop.toString() !== user.shop.toString()) {
      throw new Error('Non autorisé');
    }

    await produit.deleteOne();
    return produit;
  }

  // Récupérer les mouvements de stock d'un produit
  static async getMovements(id, user) {
    await ProductService.getById(id, user); // vérifie accès
    return await ProductMovement.find({ product: id })
      .populate('createdBy', 'prenom nom')
      .sort({ date: -1 });
  }

  // Récupérer l'historique des prix d'un produit
  static async getPricing(id, user) {
    await ProductService.getById(id, user); // vérifie accès
    // ajouter filtre date now entre date debut et end date, si aucun resultat ce sera end date null

    return await Pricing.find({
      product: id,
      startDate: { $lte: new Date() },
      $or: [
        { endDate: { $gte: new Date() } },
        { endDate: null }
      ]
    })
      .populate('createdBy', 'prenom nom')
      .sort({ startDate: -1 });
  }

  static async getByShop(shopId) {
    const products = await Product.find({ shop: shopId })
      .populate('modifiedBy', 'prenom nom')
      .populate('category', 'name')
      ;

    const productsWithDetails = await Promise.all(products.map(async (product) => {
      // Get current pricing
      const currentPricing = await Pricing.findOne({
        product: product._id,
        startDate: { $lte: new Date() },
        $or: [
          { endDate: { $gte: new Date() } },
          { endDate: null }
        ]
      }).sort({ createdAt: -1 });

      // Get pending orders for this product (locked stock)
      const pendingOrders = await Order.find({
        statut: 'in progress',
        'products.produit': product._id
      });

      // Sum up locked quantity across all pending orders
      const locked = pendingOrders.reduce((total, order) => {
        const item = order.products.find(p => p.produit.toString() === product._id.toString());
        return total + (item ? item.quantite : 0);
      }, 0);

      const minStock = product.stock - locked;

      return {
        ...product.toObject(),
        sellingPrice: currentPricing ? currentPricing.sellingPrice : product.sellingPrice,
        locked,
        minStock
      };
    }));

    return productsWithDetails;
  }

  // get the current price of each product in the shop by using pricing collection, last princing where current date is between startDate and endDate order by last created and if endDate is null then if there is no result where endDate is null is the current price
  static async getCurrentPricesByShop(shopId) {
    const products = await Product.find({ shop: shopId });
    const productIds = products.map(p => p._id);

    const pricings = await Pricing.find({
      product: { $in: productIds },
      startDate: { $lte: new Date() },
      $or: [
        { endDate: { $gte: new Date() } },
        { endDate: null }
      ]
    }).sort({ createdAt: -1 });
  }
  static async setActive(id, isActive, user) {
    const produit = await Product.findById(id);
    if (!produit) throw new Error('Produit non trouvé');

    if (user.role === 'shop' && produit.shop.toString() !== user.shop.toString()) {
      throw new Error('Non autorisé');
    }

    produit.available = isActive;
    produit.modifiedBy = user.id;
    produit.modificationDate = new Date();
    await produit.save();

    return produit;
  }


  /**
   * Recherche avancée de produits avec filtres, tri et pagination.
   * @param {ProductSearchParams} params
   */
  static async search(params = {}) {
    const {
      q,
      shop,
      category,
      brands = [],
      tags = [],
      available,
      inStock = true,
      onPromo = false,
      minPrice,
      maxPrice,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 20,
      withPromos = true,
    } = params;

    const filter = {};

    // Recherche full-text sur plusieurs champs via regex
    if (q?.trim()) {
      const regex = new RegExp(q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [
        { name: regex },
        { brand: regex },
        { description: regex },
        { tags: regex },
        { sku: regex },
        { model: regex },
      ];
    }

    if (shop) filter.shop = shop;
    if (category) filter.category = category;

    // Filtres multi-valeurs (OR dans le tableau)
    if (brands.length) filter.brand = { $in: brands };
    if (tags.length) filter.tags = { $in: tags };

    if (available !== undefined) filter.available = available;
    if (inStock === true) filter.stock = { $gt: 0 };
    if (inStock === false) filter.stock = 0;

    // Plage de prix sur le prix brut (avant promo)
    if (minPrice !== undefined || maxPrice !== undefined) {
      filter.price = {};
      if (minPrice !== undefined) filter.price.$gte = Number(minPrice);
      if (maxPrice !== undefined) filter.price.$lte = Number(maxPrice);
    }

    // Tri
    const direction = sortOrder === 'asc' ? 1 : -1;
    const mongoSort = sortBy === 'discountPercent'
      ? { price: direction }          // fallback, sera retried après enrichissement
      : { [sortBy]: direction };

    // Pagination
    const safePage = Math.max(1, parseInt(page));
    const safeLimit = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (safePage - 1) * safeLimit;

    let [products, total] = await Promise.all([
      Product.find(filter)
        .populate('category', 'name slug')
        .populate('shop', 'name logo location')
        .sort(mongoSort)
        .skip(skip)
        .limit(safeLimit)
        .lean(),
      Product.countDocuments(filter),
    ]);
    //promos
    if (withPromos && products.length) {
      products = await PromotionService.applyToProducts(products);
    }

    if (onPromo) { // check if promo is active
      products = products.filter(p => p.promo === true);
      total = products.length; // recalcul approximatif côté app
    }

    return {
      data: products,
      total,
      page: safePage,
      totalPages: Math.ceil(total / safeLimit),
      hasNext: safePage < Math.ceil(total / safeLimit),
      hasPrev: safePage > 1,
    };
  }


  /**
   * Retourne tous les filtres disponibles pour un scope donné.
   * Utilisé par le front pour construire la sidebar dynamiquement.
   *
   * @param {{ shop?: string, category?: string }} scope
   * @returns {{ brands, tags, priceRange, totalProducts }}
   */
  static async getFilterMetadata(scope = {}) {
    const match = { available: true };
    if (scope.shop) match.shop = scope.shop;
    if (scope.category) match.category = scope.category;

    const [brands, tags, priceRange, totalProducts] = await Promise.all([
      ProductService.listBrands(match),
      ProductService.listTags(match),
      ProductService.getPriceRange(match),
      Product.countDocuments(match),
    ]);

    return { brands, tags, priceRange, totalProducts };
  }

  /**
   * Liste toutes les marques disponibles avec leur nombre de produits.
   * @returns {{ brand: string, count: number }[]}
   *
   * Exemple: [{ brand: "Nike", count: 12 }, { brand: "Zara", count: 8 }]
   */
  static async listBrands(match = {}) {
    return Product.aggregate([
      { $match: { ...match, brand: { $ne: null, $exists: true, $ne: '' } } },
      { $group: { _id: '$brand', count: { $sum: 1 } } },
      { $project: { _id: 0, brand: '$_id', count: 1 } },
      { $sort: { count: -1 } },
    ]);
  }

  /**
   * Liste tous les tags disponibles avec leur fréquence.
   * @returns {{ tag: string, count: number }[]}
   *
   * Exemple: [{ tag: "sport", count: 24 }, { tag: "été", count: 18 }]
   */
  static async listTags(match = {}) {
    return Product.aggregate([
      { $match: { ...match, tags: { $exists: true, $not: { $size: 0 } } } },
      { $unwind: '$tags' },
      { $group: { _id: '$tags', count: { $sum: 1 } } },
      { $project: { _id: 0, tag: '$_id', count: 1 } },
      { $sort: { count: -1 } },
      { $limit: 50 }, // les 50 tags les plus populaires
    ]);
  }

  /**
   * Retourne le prix min et max du catalogue
   * @returns {{ min: number, max: number, avg: number }}
   */
  static async getPriceRange(match = {}) {
    const result = await Product.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          min: { $min: '$price' },
          max: { $max: '$price' },
          avg: { $avg: '$price' },
        }
      },
      { $project: { _id: 0, min: 1, max: 1, avg: { $round: ['$avg', 0] } } },
    ]);

    return result[0] ?? { min: 0, max: 0, avg: 0 };
  }

  /**
   * Suggestions d'autocomplétion pour la barre de recherche.
   * Retourne les noms + marques qui matchent le terme.
   *
   * @param {string} term
   * @param {number} limit
   * @returns {string[]} liste de suggestions uniques
   *
   * Exemple pour "ni": ["Nike Air Max", "Nike React", "Nike"]
   */
  static async autocomplete(term, limit = 8) {
    if (!term?.trim()) return [];
    const regex = new RegExp('^' + term.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');

    const [byName, byBrand] = await Promise.all([
      Product.find({ name: regex, available: true })
        .select('name')
        .limit(limit)
        .lean(),
      Product.distinct('brand', { brand: regex, available: true }),
    ]);

    const suggestions = [
      ...byBrand.filter(Boolean),
      ...byName.map(p => p.name),
    ];

    // Déduplique et limite
    return [...new Set(suggestions)].slice(0, limit);
  }


  // nouveaux produits
  static async getNewArrivals({ shop, limit = 8 } = {}) {
    const filter = { available: true };
    if (shop) filter.shop = shop;

    const products = await Product.find(filter)
      .populate('category', 'name')
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return PromotionService.applyToProducts(products);
  }
  
  static async getTopFiveBestSellingProducts(shopId) {
    const topProducts = await Order.aggregate([
      { $match: { shop: new mongoose.Types.ObjectId(shopId), statut: 'completed' } },
      { $unwind: '$products' },
      { $group: { _id: '$products.produit', totalSold: { $sum: '$products.quantite' } } },
      { $sort: { totalSold: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'productDetails'
        }
      },
      { $unwind: '$productDetails' },
      {
        $project: {
          _id: 0,
          productId: '$_id',
          name: '$productDetails.name',
          totalSold: 1
        }
      }
    ]);

    return topProducts;
  }
}

module.exports = ProductService;