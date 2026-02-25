// routes/promotion.js
const express = require('express');
const router  = express.Router();
const Promotion       = require('../models/Promotion');
const PromotionService = require('../services/PromotionService');
const Product = require('../models/Product');


router.get('/', async (req, res) => {
  try {
    const now    = new Date();
    const filter = {};

    if (req.query.productId) filter.product = req.query.productId;

    if (req.query.status === 'active') {
      filter.startDate = { $lte: now };
      filter.$or = [{ endDate: null }, { endDate: { $gte: now } }];
    } else if (req.query.status === 'upcoming') {
      filter.startDate = { $gt: now };
    } else if (req.query.status === 'expired') {
      filter.endDate = { $lt: now };
    }

    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 20);

    const [data, total] = await Promise.all([
      Promotion.find(filter)
        .populate('product',   'name price devise images')
        .populate('createdBy', 'name email')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Promotion.countDocuments(filter),
    ]);

    res.json({
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1,
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const promo = await Promotion.findById(req.params.id)
      .populate('product',   'name price devise images brand')
      .populate('createdBy', 'name email');

    if (!promo) return res.status(404).json({ message: 'Promotion introuvable' });

    // Calculer le prix en live pour l'affichage
    const pricing = PromotionService.calcFinalPrice(promo.product?.price ?? 0, promo);

    res.json({ ...promo.toObject(), pricing });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


router.post('/', async (req, res) => {
  try {
    const productExists = await Product.exists({ _id: req.body.product });
    if (!productExists) return res.status(404).json({ message: 'Produit introuvable' });

    const promo = await PromotionService.create(req.body, req.user ?? { id: req.body.createdBy });
    await promo.populate('product', 'name price devise');

    res.status(201).json(promo);

  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ message: 'Promotion déjà existante pour ce produit sur cette période' });
    res.status(400).json({ message: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const promo = await Promotion.findById(req.params.id);
    if (!promo) return res.status(404).json({ message: 'Promotion introuvable' });

    if (promo.endDate && promo.endDate < new Date()) {
      return res.status(400).json({ message: 'Impossible de modifier une promotion expirée' });
    }

    // cohérence des dates si elles sont fournies dans la requête
    const startDate = req.body.startDate ? new Date(req.body.startDate) : promo.startDate;
    const endDate   = req.body.endDate   ? new Date(req.body.endDate)   : promo.endDate;
    if (endDate && endDate <= startDate) {
      return res.status(400).json({ message: 'endDate doit être après startDate' });
    }

    // Champs modifiables
    const allowed = ['title', 'description', 'discountType', 'value', 'startDate', 'endDate'];
    allowed.forEach(field => {
      if (req.body[field] !== undefined) promo[field] = req.body[field];
    });

    await promo.save();
    await promo.populate('product', 'name price devise');

    res.json(promo);

  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});


router.delete('/:id', async (req, res) => {
  try {
    const promo = await Promotion.findByIdAndDelete(req.params.id);
    if (!promo) return res.status(404).json({ message: 'Promotion introuvable' });

    res.json({ message: 'Promotion supprimée avec succès', id: promo._id });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/product/:productId', async (req, res) => {
  try {
    const promos = await PromotionService.getByProduct(req.params.productId);
    res.json(promos);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;