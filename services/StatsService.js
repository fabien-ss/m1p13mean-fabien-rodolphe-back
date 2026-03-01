const mongoose = require('mongoose');
const Order = require('../models/Order');
const Shop = require('../models/Shop');
const Product = require('../models/Product');

const toObjectId = (id) => new mongoose.Types.ObjectId(id);

class StatsService {

  static calculateVariation(current, previous) {
    if (previous === 0) return current > 0 ? 100 : 0;
    return parseFloat((((current - previous) / previous) * 100).toFixed(2));
  }

  static getCurrentAndPreviousMonthRange() {
    const now = new Date();
    const currentStart  = new Date(now.getFullYear(), now.getMonth(), 1);
    const currentEnd    = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    const previousStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const previousEnd   = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
    return { currentStart, currentEnd, previousStart, previousEnd };
  }

  static getCurrentYearRange() {
    const now = new Date();
    return {
      yearStart: new Date(now.getFullYear(), 0, 1),
      yearEnd:   new Date(now.getFullYear(), 11, 31, 23, 59, 59),
    };
  }

  static getTodayRange() {
    const now = new Date();
    return {
      todayStart:     new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0),
      todayEnd:       new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59),
      yesterdayStart: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, 0, 0),
      yesterdayEnd:   new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59),
    };
  }

  /**
   * Récupère les _id des commandes dont au moins un produit appartient au shop.
   * Nécessaire car Order n'a pas de champ shop direct.
   */
  static async getOrderIdsByShop(shopId, dateStart = null, dateEnd = null) {
    const pipeline = [
      {
        $lookup: {
          from: 'products',
          localField: 'products.produit',
          foreignField: '_id',
          as: 'productDocs'
        }
      },
      {
        $match: {
          'productDocs.shop': toObjectId(shopId)
        }
      },
    ];

    if (dateStart || dateEnd) {
      const dateFilter = {};
      if (dateStart) dateFilter.$gte = dateStart;
      if (dateEnd)   dateFilter.$lte = dateEnd;
      // on insère le filtre de date avant le lookup pour limiter les docs
      pipeline.unshift({ $match: { creationDate: dateFilter } });
    }

    pipeline.push({ $project: { _id: 1 } });

    const results = await Order.aggregate(pipeline);
    return results.map(r => r._id);
  }

  /**
   * Construit le filtre $match avec les vrais champs du schéma.
   */
  static async buildMatch(shopId, dateStart = null, dateEnd = null) {
    const match = {};

    if (dateStart || dateEnd) {
      match.creationDate = {};
      if (dateStart) match.creationDate.$gte = dateStart;
      if (dateEnd)   match.creationDate.$lte = dateEnd;
    }

    const ids = await StatsService.getOrderIdsByShop(shopId, dateStart, dateEnd);
    match._id = { $in: ids };

    return match;
  }

  // ─────────────────────────────────────────────────────────────
  // Métriques clients + commandes du mois
  // ─────────────────────────────────────────────────────────────
  async getShopMetrics(shopId) {
    const { currentStart, currentEnd, previousStart, previousEnd } =
      StatsService.getCurrentAndPreviousMonthRange();

    const [matchCurrent, matchPrevious] = await Promise.all([
      StatsService.buildMatch(shopId, currentStart, currentEnd),
      StatsService.buildMatch(shopId, previousStart, previousEnd),
    ]);

    const [currentClients, previousClients, currentOrders, previousOrders] = await Promise.all([
      Order.distinct('client', matchCurrent),    // ← client
      Order.distinct('client', matchPrevious),
      Order.countDocuments(matchCurrent),
      Order.countDocuments(matchPrevious),
    ]);

    const totalClients     = currentClients.length;
    const totalClientsPrev = previousClients.length;

    return {
      customers: {
        total:     totalClients,
        variation: StatsService.calculateVariation(totalClients, totalClientsPrev),
        trend:     totalClients >= totalClientsPrev ? 'up' : 'down',
      },
      orders: {
        total:     currentOrders,
        variation: StatsService.calculateVariation(currentOrders, previousOrders),
        trend:     currentOrders >= previousOrders ? 'up' : 'down',
      },
    };
  }

  // ─────────────────────────────────────────────────────────────
  // Ventes mensuelles (nb commandes par mois)
  // ─────────────────────────────────────────────────────────────
  async getMonthlySales(shopId) {
    const { yearStart, yearEnd } = StatsService.getCurrentYearRange();
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

    const match = await StatsService.buildMatch(shopId, yearStart, yearEnd);

    const orders = await Order.aggregate([
      { $match: match },
      { $group: { _id: { $month: '$creationDate' }, count: { $sum: 1 } } },  // ← creationDate
    ]);

    const data = Array(12).fill(0);
    orders.forEach(({ _id, count }) => { data[_id - 1] = count; });

    return {
      categories: months,
      series: [{ name: 'Sales', data }],
    };
  }

  // ─────────────────────────────────────────────────────────────
  // Dashboard shop
  // ─────────────────────────────────────────────────────────────
  async getShopDashboardStats(shopId) {
    const [metrics, monthlySales] = await Promise.all([
      this.getShopMetrics(shopId),
      this.getMonthlySales(shopId),
    ]);
    return { metrics, monthlySales };
  }

  // ─────────────────────────────────────────────────────────────
  // Objectif mensuel + revenus aujourd'hui
  // ─────────────────────────────────────────────────────────────
  async getMonthlyTarget(shopId) {
    const { currentStart, currentEnd, previousStart, previousEnd } =
      StatsService.getCurrentAndPreviousMonthRange();
    const { todayStart, todayEnd, yesterdayStart, yesterdayEnd } =
      StatsService.getTodayRange();

    const [matchCurrent, matchPrevious, matchToday, matchYesterday, shop] = await Promise.all([
      StatsService.buildMatch(shopId, currentStart, currentEnd),
      StatsService.buildMatch(shopId, previousStart, previousEnd),
      StatsService.buildMatch(shopId, todayStart, todayEnd),
      StatsService.buildMatch(shopId, yesterdayStart, yesterdayEnd),
      Shop.findById(shopId).select('monthlyTarget'),
    ]);

    const [currentRevenue, previousRevenue, todayRevenue, yesterdayRevenue] = await Promise.all([
      Order.aggregate([{ $match: matchCurrent },   { $group: { _id: null, total: { $sum: '$total' } } }]),  // ← $total
      Order.aggregate([{ $match: matchPrevious },  { $group: { _id: null, total: { $sum: '$total' } } }]),
      Order.aggregate([{ $match: matchToday },     { $group: { _id: null, total: { $sum: '$total' } } }]),
      Order.aggregate([{ $match: matchYesterday }, { $group: { _id: null, total: { $sum: '$total' } } }]),
    ]);

    const target      = shop?.monthlyTarget ?? 0;
    const revenue     = currentRevenue[0]?.total ?? 0;
    const prevRevenue = previousRevenue[0]?.total ?? 0;
    const todayVal    = todayRevenue[0]?.total ?? 0;
    const yesterdayVal = yesterdayRevenue[0]?.total ?? 0;

    const progressPercent = target > 0
      ? parseFloat(((revenue / target) * 100).toFixed(2))
      : 0;

    return {
      progressPercent,
      target:  { value: target, trend: 'up' },
      revenue: { value: revenue,  trend: revenue  >= prevRevenue  ? 'up' : 'down' },
      today:   { value: todayVal, trend: todayVal >= yesterdayVal ? 'up' : 'down' },
    };
  }

  // ─────────────────────────────────────────────────────────────
  // Statistiques de ventes (nb commandes + revenus par mois)
  // ─────────────────────────────────────────────────────────────
  async getSalesStatistics(shopId) {
    const { yearStart, yearEnd } = StatsService.getCurrentYearRange();
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

    const match = await StatsService.buildMatch(shopId, yearStart, yearEnd);

    const orders = await Order.aggregate([
      { $match: match },
      {
        $group: {
          _id:        { $month: '$creationDate' },  // ← creationDate
          salesCount: { $sum: 1 },
          revenue:    { $sum: '$total' },            // ← $total
        },
      },
    ]);

    const salesData   = Array(12).fill(0);
    const revenueData = Array(12).fill(0);

    orders.forEach(({ _id, salesCount, revenue }) => {
      salesData[_id - 1]   = salesCount;
      revenueData[_id - 1] = revenue;
    });

    return {
      categories: months,
      series: [
        { name: 'Sales',   data: salesData   },
        { name: 'Revenue', data: revenueData },
      ],
    };
  }

  // ─────────────────────────────────────────────────────────────
  // Override manuel d'un mois (inchangé, logique métier)
  // ─────────────────────────────────────────────────────────────
  async updateSalesStatistics(shopId, monthIndex, salesValue, revenueValue) {
    await Shop.findByIdAndUpdate(shopId, {
      $set: {
        [`salesOverrides.${monthIndex}.sales`]:   salesValue,
        [`salesOverrides.${monthIndex}.revenue`]: revenueValue,
      },
    });
    return this.getSalesStatistics(shopId);
  }
}

module.exports = StatsService;