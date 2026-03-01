const mongoose = require('mongoose');
const Order = require('../models/Order');
const User = require('../models/User');
const Shop = require('../models/Shop');

const toObjectId = (id) => new mongoose.Types.ObjectId(id);

class AdminStatsService {

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

  /**
   * Retourne les _id des commandes dont au moins un produit appartient au shop.
   * Utilisé comme filtre de base pour toutes les stats filtrées par shop.
   */
  static async getOrderIdsByShop(shopId) {
    const results = await Order.aggregate([
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
      { $project: { _id: 1 } }
    ]);
    return results.map(r => r._id);
  }

  /**
   * Construit le filtre $match selon qu'on filtre par shop ou non,
   * avec un filtre de date sur creationDate (le vrai champ du schéma).
   */
  static async buildMatchFilter(shopId, dateStart, dateEnd) {
    const match = {};

    if (dateStart || dateEnd) {
      match.creationDate = {};
      if (dateStart) match.creationDate.$gte = dateStart;
      if (dateEnd)   match.creationDate.$lte = dateEnd;
    }

    if (shopId) {
      const orderIds = await AdminStatsService.getOrderIdsByShop(shopId);
      match._id = { $in: orderIds };
    }

    return match;
  }

  // ─────────────────────────────────────────────────────────────
  // KPI principaux
  // ─────────────────────────────────────────────────────────────
  async getOverviewMetrics(shopId = null) {
    const { currentStart, currentEnd, previousStart, previousEnd } =
      AdminStatsService.getCurrentAndPreviousMonthRange();

    const [matchCurrent, matchPrevious] = await Promise.all([
      AdminStatsService.buildMatchFilter(shopId, currentStart, currentEnd),
      AdminStatsService.buildMatchFilter(shopId, previousStart, previousEnd),
    ]);

    const [
      revenueCurrent,
      revenuePrevious,
      ordersCurrent,
      ordersPrevious,
      clientsCurrent,
      clientsPrevious,
      totalActiveShops,
    ] = await Promise.all([
      Order.aggregate([
        { $match: matchCurrent },
        { $group: { _id: null, total: { $sum: '$total' } } }   // ← $total
      ]),
      Order.aggregate([
        { $match: matchPrevious },
        { $group: { _id: null, total: { $sum: '$total' } } }
      ]),
      Order.countDocuments(matchCurrent),
      Order.countDocuments(matchPrevious),
      Order.distinct('client', matchCurrent),   // ← $client
      Order.distinct('client', matchPrevious),
      Shop.countDocuments({ isActive: true }),
    ]);

    const revenue     = revenueCurrent[0]?.total ?? 0;
    const prevRevenue = revenuePrevious[0]?.total ?? 0;
    const customers     = clientsCurrent.length;
    const prevCustomers = clientsPrevious.length;

    return {
      revenue: {
        total:     revenue,
        variation: AdminStatsService.calculateVariation(revenue, prevRevenue),
        trend:     revenue >= prevRevenue ? 'up' : 'down',
      },
      orders: {
        total:     ordersCurrent,
        variation: AdminStatsService.calculateVariation(ordersCurrent, ordersPrevious),
        trend:     ordersCurrent >= ordersPrevious ? 'up' : 'down',
      },
      customers: {
        total:     customers,
        variation: AdminStatsService.calculateVariation(customers, prevCustomers),
        trend:     customers >= prevCustomers ? 'up' : 'down',
      },
      activeShops: {
        total:     totalActiveShops,
        trend:     'up',
        variation: 0,
      },
    };
  }

  // ─────────────────────────────────────────────────────────────
  // Revenus par boutique (bar chart)
  // ─────────────────────────────────────────────────────────────
  async getRevenuePerShop() {
    const { currentStart, currentEnd } = AdminStatsService.getCurrentAndPreviousMonthRange();

    // On passe par les produits pour remonter au shop
    const results = await Order.aggregate([
      { $match: { creationDate: { $gte: currentStart, $lte: currentEnd } } },
      { $unwind: '$products' },
      {
        $lookup: {
          from: 'products',
          localField: 'products.produit',
          foreignField: '_id',
          as: 'productDoc'
        }
      },
      { $unwind: '$productDoc' },
      {
        $group: {
          _id: '$productDoc.shop',
          revenue: { $sum: '$total' },   // total de la commande entière — voir note ci-dessous
          orders:  { $addToSet: '$_id' }
        }
      },
      { $sort: { revenue: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'shops',
          localField: '_id',
          foreignField: '_id',
          as: 'shopInfo'
        }
      },
      { $unwind: { path: '$shopInfo', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          shopName: { $ifNull: ['$shopInfo.name', 'Unknown'] },
          revenue:  1,
          orders:   { $size: '$orders' }
        }
      }
    ]);

    return {
      categories: results.map(r => r.shopName),
      series: [{ name: 'Revenue', data: results.map(r => r.revenue) }],
    };
  }

  // ─────────────────────────────────────────────────────────────
  // Commandes dans le temps (ligne mensuelle)
  // ─────────────────────────────────────────────────────────────
  async getOrdersOverTime(shopId = null) {
    const { yearStart, yearEnd } = AdminStatsService.getCurrentYearRange();
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

    const match = await AdminStatsService.buildMatchFilter(shopId, yearStart, yearEnd);

    const results = await Order.aggregate([
      { $match: match },
      {
        $group: {
          _id:     { $month: '$creationDate' },   // ← creationDate
          count:   { $sum: 1 },
          revenue: { $sum: '$total' }              // ← total
        }
      },
      { $sort: { _id: 1 } },
    ]);

    const ordersData  = Array(12).fill(0);
    const revenueData = Array(12).fill(0);
    results.forEach(({ _id, count, revenue }) => {
      ordersData[_id - 1]  = count;
      revenueData[_id - 1] = revenue;
    });

    return {
      categories: months,
      series: [
        { name: 'Orders',  data: ordersData  },
        { name: 'Revenue', data: revenueData },
      ],
    };
  }

  // ─────────────────────────────────────────────────────────────
  // Top boutiques
  // ─────────────────────────────────────────────────────────────
  async getTopShops() {
    const { yearStart, yearEnd } = AdminStatsService.getCurrentYearRange();

    const results = await Order.aggregate([
      { $match: { creationDate: { $gte: yearStart, $lte: yearEnd } } },
      { $unwind: '$products' },
      {
        $lookup: {
          from: 'products',
          localField: 'products.produit',
          foreignField: '_id',
          as: 'productDoc'
        }
      },
      { $unwind: '$productDoc' },
      {
        $group: {
          _id:       '$productDoc.shop',
          revenue:   { $sum: '$total' },
          orders:    { $addToSet: '$_id' },
          customers: { $addToSet: '$client' }   // ← client
        }
      },
      { $sort: { revenue: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'shops',
          localField: '_id',
          foreignField: '_id',
          as: 'shopInfo'
        }
      },
      { $unwind: { path: '$shopInfo', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          name:      { $ifNull: ['$shopInfo.name', 'Unknown'] },
          revenue:   1,
          orders:    { $size: '$orders' },
          customers: { $size: '$customers' }
        }
      }
    ]);

    return results;
  }

  // ─────────────────────────────────────────────────────────────
  // Comparaison annuelle
  // ─────────────────────────────────────────────────────────────
  async getMonthlySalesComparison(shopId = null) {
    const now = new Date();
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

    const [matchCurrent, matchPrevious] = await Promise.all([
      AdminStatsService.buildMatchFilter(
        shopId,
        new Date(now.getFullYear(), 0, 1),
        new Date(now.getFullYear(), 11, 31, 23, 59, 59)
      ),
      AdminStatsService.buildMatchFilter(
        shopId,
        new Date(now.getFullYear() - 1, 0, 1),
        new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59)
      ),
    ]);

    const [currentYear, previousYear] = await Promise.all([
      Order.aggregate([
        { $match: matchCurrent },
        { $group: { _id: { $month: '$creationDate' }, revenue: { $sum: '$total' } } }
      ]),
      Order.aggregate([
        { $match: matchPrevious },
        { $group: { _id: { $month: '$creationDate' }, revenue: { $sum: '$total' } } }
      ]),
    ]);

    const currentData  = Array(12).fill(0);
    const previousData = Array(12).fill(0);
    currentYear.forEach(({ _id, revenue })  => { currentData[_id - 1]  = revenue; });
    previousYear.forEach(({ _id, revenue }) => { previousData[_id - 1] = revenue; });

    return {
      categories: months,
      series: [
        { name: `${now.getFullYear()}`,     data: currentData  },
        { name: `${now.getFullYear() - 1}`, data: previousData },
      ],
    };
  }

  // ─────────────────────────────────────────────────────────────
  // Liste des shops
  // ─────────────────────────────────────────────────────────────
  async getAllShops() {
    return Shop.find({}, '_id name isActive').sort({ name: 1 });
  }

  // ─────────────────────────────────────────────────────────────
  // Dashboard complet
  // ─────────────────────────────────────────────────────────────
  async getDashboardData(shopId = null) {
    const [overview, revenuePerShop, ordersOverTime, topShops, monthlySalesComparison, allShops] =
      await Promise.all([
        this.getOverviewMetrics(shopId),
        this.getRevenuePerShop(),
        this.getOrdersOverTime(shopId),
        this.getTopShops(),
        this.getMonthlySalesComparison(shopId),
        this.getAllShops(),
      ]);

    return { overview, revenuePerShop, ordersOverTime, topShops, monthlySalesComparison, allShops };
  }
}

module.exports = AdminStatsService;