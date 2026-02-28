const express = require('express');
const router = express.Router();
const MovementService = require('../services/MovementService');
const authMiddleware = require('../middleware/auth');

router.get('/shop/:shopId', authMiddleware(), async (req, res) => {
  try {
    const { type } = req.query;
    const movements = await MovementService.getByShop(req.params.shopId, type);
    res.status(200).json(movements);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/product/:productId', authMiddleware(), async (req, res) => {
  try {
    const { type } = req.query;
    const movements = await MovementService.getByProduct(req.params.productId, type);
    res.status(200).json(movements);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', authMiddleware(['admin', 'boutique']), async (req, res) => {
  try {
    const movement = await MovementService.create(req.body, req.user);
    res.status(201).json(movement);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/:id', authMiddleware(['admin']), async (req, res) => {
  try {
    const movement = await MovementService.delete(req.params.id);
    res.status(200).json({ message: 'Movement deleted', movement });
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
});
router.post('/stock-entry', authMiddleware(['admin', 'boutique']), async (req, res) => {
  try {
    const movement = await MovementService.createStockEntry(req.body, req.user);
    res.status(201).json(movement);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;