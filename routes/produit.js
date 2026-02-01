const express = require('express');
const router = express.Router();
const ProduitService = require('../services/ProduitService');
const authMiddleware = require('../middlewares/auth');

// Créer un produit
router.post('/', authMiddleware(['admin', 'boutique']), async (req, res) => {
  try {
    const produit = await ProduitService.create(req.body, req.user);
    res.status(201).json(produit);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Lister tous les produits
router.get('/', authMiddleware(), async (req, res) => {
  try {
    const produits = await ProduitService.getAll(req.user);
    res.json(produits);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Récupérer un produit par ID
router.get('/:id', authMiddleware(), async (req, res) => {
  try {
    const produit = await ProduitService.getById(req.params.id, req.user);
    res.json(produit);
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
});

// Mettre à jour un produit
router.put('/:id', authMiddleware(['admin', 'boutique']), async (req, res) => {
  try {
    const produit = await ProduitService.update(req.params.id, req.body, req.user);
    res.json(produit);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Supprimer un produit
router.delete('/:id', authMiddleware(['admin', 'boutique']), async (req, res) => {
  try {
    const produit = await ProduitService.delete(req.params.id, req.user);
    res.json({ message: 'Produit supprimé', produit });
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
});

module.exports = router;
