const express = require('express');
const router = express.Router();
const ProductService = require('../services/ProductService');
const authMiddleware = require('../middleware/auth');
const upload = require("../middleware/upload");

router.post('/', authMiddleware(['boutique']), upload.array("image"), async (req, res) => {
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

router.get('/:id', authMiddleware(), async (req, res) => {
  try {
    const produit = await ProductService.getById(req.params.id, req.user);
    res.json(produit);
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

router.get('/shop/:shopId', authMiddleware(["admin", "boutique"]), async (req, res) => {
  try {
    const products = await ProductService.getByShop(req.params.shopId);
    res.status(200).json(products);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;