// routes/orderRoutes.js
const express = require('express');
const router = express.Router();
const OrderService = require('../services/OrderService');

router.get('/shop/:shopId', async (req, res) => {
  try {
    const { shopId, startDate, endDate } = req.params;
    const orders = await OrderService.listOrdersByShop(shopId, startDate, endDate);
    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

module.exports = router;