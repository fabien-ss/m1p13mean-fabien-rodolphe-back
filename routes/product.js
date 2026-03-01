const express = require('express');
const router = express.Router();
const ProductService = require('../services/ProductService');
const PromotionService = require('../services/PromotionService');
const authMiddleware = require('../middleware/auth');
const upload = require("../middleware/upload");

router.get('/search', async (req, res) => {
  const result = await ProductService.search({
    ...req.query,
    brands: [].concat(req.query.brands ?? []),
    tags:   [].concat(req.query.tags   ?? []),
  });
  res.json(result);
});

// GET /api/products/filters?shop=xxx  → alimente la sidebar Angular
router.get('/filters', async (req, res) => {
  const meta = await ProductService.getFilterMetadata({ shop: req.query.shop });
  res.json(meta);
});

// GET /api/products/autocomplete?q=ni
router.get('/autocomplete', async (req, res) => {
  const suggestions = await ProductService.autocomplete(req.query.q);
  res.json(suggestions);
});

router.post('/', authMiddleware(['admin', 'boutique']), upload.array("image"), async (req, res) => {
  try {
    const imageUrls = req.files?.map(file => `/uploads/${file.filename}`) ?? [];
    const produit = await ProductService.create(req.body, req.user, imageUrls);
    res.status(201).json(produit);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/', authMiddleware(['boutique', 'admin']), async (req, res) => {
  try {
   
    const produits = await ProductService.getAll(req.user);
    res.json(produits);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/list', async (req, res) => {
  try {
    const produits = await ProductService.getAll();
    const productsWithPromos = await PromotionService.applyToProducts(produits);
    res.json(productsWithPromos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/hot-deals', async (req, res) => {
  const limit = Number(req.query.limit) || 4;
  const minDiscountPercent = Number(req.query.minDiscountPercent) || 10;

  const deals = await PromotionService.getHotDeals({ limit, minDiscountPercent });
  res.json(deals);
});

router.get('/:id', authMiddleware(), async (req, res) => {
  try {
    const produit = await ProductService.getById(req.params.id, req.user);
    res.json(produit);
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
});

router.get('/client/:id', async (req, res) => {
  try {
    const produit = await ProductService.getById(req.params.id);
    const produitWithPromo = await PromotionService.applyToProduct(produit);
    res.json(produitWithPromo);
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
});

router.get('/:id/pricing', authMiddleware(), async (req, res) => {
  try {
    const pricing = await ProductService.getPricing(req.params.id, req.user);
    res.json(pricing);
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
});

router.put('/:id', authMiddleware(['admin', 'boutique']), async (req, res) => {
  try {
    const produit = await ProductService.update(req.params.id, req.body, req.user);
    res.json(produit);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/:id', authMiddleware(['admin', 'shop']), async (req, res) => {
  try {
    const produit = await ProductService.delete(req.params.id, req.user);
    res.json({ message: 'Produit supprimé', produit });
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
});

router.put('/:id/active', authMiddleware(['admin', 'boutique']), async (req, res) => {
  try {
    const { isActive } = req.body;
    if (isActive === undefined) throw new Error('isActive is required');

    const produit = await ProductService.setActive(req.params.id, isActive, req.user);
    res.status(200).json(produit);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/:id/image', authMiddleware(['admin', 'boutique']), upload.array("image"), async (req, res) => {
  try {
    const imageUrls = req.files?.map(file => `/uploads/${file.filename}`) ?? [];
    const produit = await ProductService.updateImage(req.params.id, imageUrls);
    res.status(200).json(produit);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});


router.get('/shop/:shopId', async (req, res) => {
  try {
    const products = await ProductService.getByShop(req.params.shopId);
    res.status(200).json(products);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;