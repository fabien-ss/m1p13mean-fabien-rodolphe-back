const Shop = require('../models/Shop');
const User = require('../models/User');
const Order = require('../models/Order'); // manquait !

class ShopService {

  // Créer une shop
  static async create(data, imageUrls = []) {
    const { name, description, email, phone, manager, type, isActive } = data;

    const existing = await Shop.findOne({ name, email });
    if (existing) throw new Error(`La shop '${name}' existe déjà`);

    const shopManager = await User.findOne({ email: manager });
    if (!shopManager) throw new Error(`Aucun utilisateur associé à '${manager}'`);

    const shop = new Shop({
      name,
      description,
      email,
      phone,
      type,
      isActive: isActive === 'true' || isActive === true,  // FormData envoie des strings
      images: imageUrls,
      manager: shopManager._id
    });

    await shop.save();
    return shop.populate('manager', 'firstName name email role');
  }

  // Récupérer toutes les boutiques
  static async getAll(user) {
    const { id, role } = user;

    const query = role === 'admin' ? {} : { manager: id };

    return await Shop.find(query)
      .populate('manager', 'firstName name email role');
  }

  // Récupérer une shop par ID
  static async getById(id) {
    const shop = await Shop.findById(id)
      .populate('manager', 'firstName name email role');
    if (!shop) throw new Error('Shop non trouvée');
    return shop;
  }

  // Mettre à jour une shop
  static async update(id, data) {
    if (data.manager && data.manager.includes('@')) {
      const shopManager = await User.findOne({ email: data.manager });
      if (!shopManager) throw new Error(`Aucun utilisateur associé à '${data.manager}'`);
      data.manager = shopManager._id;
    }

    const shop = await Shop.findByIdAndUpdate(id, data, { new: true })
      .populate('manager', 'firstName name email role');
    if (!shop) throw new Error('Shop non trouvée');
    return shop;
  }

  // Désactiver une shop (soft delete) — remplace delete()
  static async deactivate(id) {
    const shop = await Shop.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );
    if (!shop) throw new Error('Shop non trouvée');
    return shop;
  }

  // Supprimer définitivement (hard delete) — à utiliser avec précaution
  static async delete(id) {
    const shop = await Shop.findByIdAndDelete(id);
    if (!shop) throw new Error('Shop non trouvée');
    return shop;
  }

  // Ventes mensuelles
  static async monthlySales(shopId, month, year) {
    const shop = await Shop.findById(shopId);
    if (!shop) throw new Error('Shop non trouvée');

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const arrayOfMonths = [
      "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
      "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
    ];

    const numberOfSalesByMonth = await Order.aggregate([
      {
        $match: {
          shop: shop._id,
          createdAt: { $gte: startDate, $lte: endDate },
          status: { $ne: "pending" }
        }
      },
      {
        $group: {
          _id: { month: { $month: "$createdAt" }, year: { $year: "$createdAt" } },
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          // arrayOfMonths["$_id.month" - 1] ne fonctionne pas en aggregation → $arrayElemAt
          monthYear: {
            $concat: [
              { $arrayElemAt: [arrayOfMonths, { $subtract: ["$_id.month", 1] }] },
              " ",
              { $toString: "$_id.year" }
            ]
          },
          count: 1,
          _id: 0
        }
      }
    ]);

    return numberOfSalesByMonth;
  }

  // Pourcentage d'atteinte de l'objectif mensuel
  static async monthlyPercentTarget(shopId, month, year, target) {
    const shop = await Shop.findById(shopId);
    if (!shop) throw new Error('Shop non trouvée');

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const totalSales = await Order.aggregate([
      {
        $match: {
          shop: shop._id,
          createdAt: { $gte: startDate, $lte: endDate },
          status: { $ne: "pending" }
        }
      },
      {
        $group: { _id: null, total: { $sum: "$total" } }
      }
    ]);

    const percent = totalSales[0] ? (totalSales[0].total / target * 100).toFixed(2) : 0;
    return Number(percent);
  }
}

module.exports = ShopService;