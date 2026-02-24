// services/product.service.js
const Product = require('../models/Product');
const ProductMovement = require('../models/ProductMovement');
const Pricing = require('../models/Pricing');
const mongoose = require('mongoose');
const Shop = require('../models/Shop');
const Order = require('../models/Order');

class ProductService {

  // Créer un produit
  static async create(data, user, imageUrls) {
    if (user.role !== 'admin' && user.role !== 'boutique') {
      throw new Error('Non autorisé à créer un produit');
    }

    try {
      const { name, category, brand, sku, barcode, model, description, costPrice, sellingPrice, stock, expiryDate, isActive, shop } = data;
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
        images: imageUrls
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
    }else{
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
        sellingPrice: currentPricing ? currentPricing.sellingPrice : null,
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
}

module.exports = ProductService;