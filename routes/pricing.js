const express = require('express');
const router = express.Router();
const PricingService = require('../services/PricingService');
const authMiddleware = require('../middleware/auth');

router.get('/product/:productId', authMiddleware(), async (req, res) => {
  try {
    const pricings = await PricingService.getByProduct(req.params.productId);
    res.status(200).json(pricings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', authMiddleware(['admin', 'boutique']), async (req, res) => {
  try {
    const pricing = await PricingService.create(req.body, req.user);
    res.status(201).json(pricing);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;