const express = require('express');
const router = express.Router();
const BoutiqueService = require('../services/BoutiqueService');
const authMiddleware = require('../middlewares/auth');

// Créer une boutique (admin ou gérant)
router.post('/', authMiddleware(['admin', 'boutique']), async (req, res) => {
  try {
    const boutique = await BoutiqueService.create(req.body);
    res.status(201).json(boutique);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Lister toutes les boutiques
router.get('/', authMiddleware(), async (req, res) => {
  try {
    const boutiques = await BoutiqueService.getAll();
    res.json(boutiques);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Récupérer une boutique
router.get('/:id', authMiddleware(), async (req, res) => {
  try {
    const boutique = await BoutiqueService.getById(req.params.id);
    res.json(boutique);
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
});

// Mettre à jour une boutique
router.put('/:id', authMiddleware(['admin', 'boutique']), async (req, res) => {
  try {
    const boutique = await BoutiqueService.update(req.params.id, req.body);
    res.json(boutique);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Supprimer une boutique
router.delete('/:id', authMiddleware(['admin']), async (req, res) => {
  try {
    const boutique = await BoutiqueService.delete(req.params.id);
    res.json({ message: 'Boutique supprimée', boutique });
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
});

module.exports = router;
