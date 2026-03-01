// routes/stats.routes.js
const express = require('express');
const router = express.Router();
const StatsService = require('../services/StatsService');

const statsService = new StatsService();

router.get('/shop-dashboard/:shopId', async (req, res) => {
  try {
    const data = await statsService.getShopDashboardStats(req.params.shopId);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/shop-metrics/:shopId', async (req, res) => {
  try {
    const data = await statsService.getShopMetrics(req.params.shopId);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/monthly-sales/:shopId', async (req, res) => {
  try {
    const data = await statsService.getMonthlySales(req.params.shopId);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/monthly-target/:shopId', async (req, res) => {
  try {
    const data = await statsService.getMonthlyTarget(req.params.shopId);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/sales-statistics/:shopId', async (req, res) => {
  try {
    const data = await statsService.getSalesStatistics(req.params.shopId);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/sales-statistics/:shopId', async (req, res) => {
  try {
    const { monthIndex, salesValue, revenueValue } = req.body;
    const data = await statsService.updateMonthlyObjective(req.params.shopId, monthIndex, revenueValue);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;