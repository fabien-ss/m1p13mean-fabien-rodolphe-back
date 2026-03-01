const Order = require('../models/Order');
const User = require('../models/User');
const Shop = require('../models/Shop');
const Product = require('../models/Product');

class StatsService {

  // Données mock statiques (à remplacer par des vraies requêtes DB plus tard)
  static mockData = {
    totalCustomers: 3782,
    totalCustomersPreviousPeriod: 3404, // pour calculer +11.01%

    totalOrders: 5359,
    totalOrdersPreviousPeriod: 5895, // pour calculer -9.05%

    monthlySales: [
      { month: 'Jan', value: 168 },
      { month: 'Feb', value: 385 },
      { month: 'Mar', value: 201 },
      { month: 'Apr', value: 298 },
      { month: 'May', value: 187 },
      { month: 'Jun', value: 195 },
      { month: 'Jul', value: 291 },
      { month: 'Aug', value: 110 },
      { month: 'Sep', value: 215 },
      { month: 'Oct', value: 390 },
      { month: 'Nov', value: 280 },
      { month: 'Dec', value: 112 },
    ], salesStatistics: {
      sales: [180, 190, 170, 160, 175, 165, 170, 205, 230, 210, 240, 235],
      revenue: [40, 30, 50, 40, 55, 40, 70, 100, 110, 120, 150, 140],
      categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    },
     monthlyTarget: {
      target: 20000,
      targetPreviousPeriod: 18000,
      revenue: 15110,
      revenuePreviousPeriod: 13200,
      today: 3287,
      todayPreviousPeriod: 2100,
    },
  };

  /**
   * Calcule la variation en % entre deux périodes
   */
  static calculateVariation(current, previous) {
    if (previous === 0) return 0;
    return parseFloat((((current - previous) / previous) * 100).toFixed(2));
  }

  /**
   * Retourne les métriques globales du shop (customers + orders)
   */
  async getShopMetrics() {
    const { totalCustomers, totalCustomersPreviousPeriod, totalOrders, totalOrdersPreviousPeriod } =
      StatsService.mockData;

    return {
      customers: {
        total: totalCustomers,
        variation: StatsService.calculateVariation(totalCustomers, totalCustomersPreviousPeriod),
        trend: totalCustomers >= totalCustomersPreviousPeriod ? 'up' : 'down',
      },
      orders: {
        total: totalOrders,
        variation: Math.abs(
          StatsService.calculateVariation(totalOrders, totalOrdersPreviousPeriod)
        ),
        trend: totalOrders >= totalOrdersPreviousPeriod ? 'up' : 'down',
      },
    };
  }

  /**
   * Retourne les ventes mensuelles pour le graphique bar chart
   */
  async getMonthlySales() {
    const { monthlySales } = StatsService.mockData;

    return {
      categories: monthlySales.map((item) => item.month),
      series: [
        {
          name: 'Sales',
          data: monthlySales.map((item) => item.value),
        },
      ],
    };
  }

  /**
   * Retourne toutes les données nécessaires au composant ShopMetrics
   */
  async getShopDashboardStats() {
    const [metrics, monthlySales] = await Promise.all([
      this.getShopMetrics(),
      this.getMonthlySales(),
    ]);

    return {
      metrics,
      monthlySales,
    };
  }

  async getMonthlyTarget() {
    const { target, targetPreviousPeriod, revenue, revenuePreviousPeriod, today, todayPreviousPeriod } =
      StatsService.mockData.monthlyTarget;

    const progressPercent = parseFloat(((revenue / target) * 100).toFixed(2));

    return {
      progressPercent,
      target: {
        value: target,
        trend: target >= targetPreviousPeriod ? 'up' : 'down',
      },
      revenue: {
        value: revenue,
        trend: revenue >= revenuePreviousPeriod ? 'up' : 'down',
      },
      today: {
        value: today,
        trend: today >= todayPreviousPeriod ? 'up' : 'down',
      },
    };
  }
  async getSalesStatistics() {
    const { salesStatistics } = StatsService.mockData;
    return {
      categories: salesStatistics.categories,
      series: [
        { name: 'Sales', data: salesStatistics.sales },
        { name: 'Revenue', data: salesStatistics.revenue },
      ],
    };
  }
}

module.exports = StatsService;