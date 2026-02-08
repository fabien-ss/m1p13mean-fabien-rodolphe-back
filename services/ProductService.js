// services/product.service.js
const Product = require('../models/Product');
const ProductMovement = require('../models/ProductMovement');
const Pricing = require('../models/Pricing');
const mongoose = require('mongoose');

class ProductService {

  // Créer un produit
  static async create(data, user) {
    if (user.role !== 'admin' && user.role !== 'shop') {
      throw new Error('Non autorisé à créer un produit');
    }

    if (user.role === 'shop') {
      data.shop = user.shop;
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const { price, sellingPrice, stock, isActive, ...productData } = data;

      // 1. Créer le produit
      const produit = new Product({
        ...productData,
        stock: stock ?? 0,
        available: isActive ?? true,
        modifiedBy: user.id
      });
      await produit.save({ session });

      // 2. Mouvement de stock initial
      if (stock > 0) {
        const movement = new ProductMovement({
          product: produit._id,
          type: 'in',
          quantity: stock,
          reason: 'initial stock',
          createdBy: user.id
        });
        await movement.save({ session });
      }

      // 3. Pricing initial
      const pricing = new Pricing({
        product: produit._id,
        costPrice: price,
        sellingPrice,
        startDate: new Date(),
        endDate: null,
        createdBy: user.id
      });
      await pricing.save({ session });

      await session.commitTransaction();
      session.endSession();

      return produit;

    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      throw err;
    }
  }

  // Récupérer tous les produits
  static async getAll(user) {
    const filter = user.role === 'shop' ? { shop: user.shop } : {};

    return await Product.find(filter)
      .populate('shop', 'nom')
      .populate('modifiedBy', 'prenom nom');
  }

  // Récupérer un produit par ID
  static async getById(id, user) {
    const produit = await Product.findById(id)
      .populate('shop', 'nom')
      .populate('modifiedBy', 'prenom nom');

    if (!produit) throw new Error('Produit non trouvé');

    if (user.role === 'shop' && produit.shop._id.toString() !== user.shop.toString()) {
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
    return await Pricing.find({ product: id })
      .populate('createdBy', 'prenom nom')
      .sort({ startDate: -1 });
  }
}

module.exports = ProductService;