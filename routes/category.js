const express = require('express');
const router = express.Router();
const CategoryService = require('../services/CategoryService');
const authMiddleware = require('../middleware/auth');

router.get('/', authMiddleware(), async (req, res) => {
    try {
      const category = await CategoryService.getAll();
      res.json(category);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
});

// category by shop
router.get('/shop/:shopId', authMiddleware(), async (req, res) => {
    try {
      const category = await CategoryService.getAllByShop(req.params.shopId);
      res.json(category);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
});

router.post('/', authMiddleware(['admin', 'boutique']), async (req, res) => {
    try {
      console.log('Create category request body:', req.body);
      console.log('Authenticated user:', req.user);
      
      const category = await CategoryService.create(req.body, req.user);
      res.status(201).json(category);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
});
  
module.exports = router;