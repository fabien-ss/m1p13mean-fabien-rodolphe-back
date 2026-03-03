const express = require('express');
const router = express.Router();
const AdminStatsService = require('../services/AdminStatsService');

const adminStatsService = new AdminStatsService();

// Full dashboard in one call (optional ?shopId query param)
router.get('/dashboard', async (req, res) => {
  try {
    const shopId = req.query.shopId || null;
    const data = await adminStatsService.getDashboardData(shopId);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/overview', async (req, res) => {
  try {
    const data = await adminStatsService.getOverviewMetrics(req.query.shopId || null);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/revenue-per-shop', async (req, res) => {
  try {
    const data = await adminStatsService.getRevenuePerShop();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/orders-over-time', async (req, res) => {
  try {
    const data = await adminStatsService.getOrdersOverTime(req.query.shopId || null);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/top-shops', async (req, res) => {
  try {
    const data = await adminStatsService.getTopShops();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/monthly-comparison', async (req, res) => {
  try {
    const data = await adminStatsService.getMonthlySalesComparison(req.query.shopId || null);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/shops', async (req, res) => {
  try {
    const data = await adminStatsService.getAllShops();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;