const Shop = require('../models/Shop');
const User = require('../models/User');

class ShopService {

  // Créer une shop
  static async create(data) {
    const { name, description, email, phone, manager, images, type } = data;

    // Vérifier si une shop du même nom existe dans ce centre
    const existing = await Shop.findOne({ name, email });

    if (existing) throw new Error(`La shop '${nom}' existe déjà dans ce centre commercial`);

    console.log(manager)
    const ShopManager = await User.findOne({
      email: manager
    })

    console.log(ShopManager)

    if (!ShopManager) throw new Error(`Aucune adresse associée '${manager}'`);

    const shop = new Shop({
      name: name,
      description: description,
      email: email,
      phone: phone,
      images: images,
      type: type,
      manager: ShopManager
    });

    await shop.save();
    return shop;
  }

  // Récupérer toutes les boutiques
  static async getAll(user) {
    if (user) {
      const { id } = user;
      return await Shop.find({
        manager: id
      })
        .populate('manager', 'firstName name email role')
    }else{
      return await Shop.find()
        .populate('manager', 'firstName name email')
    }
  }

  static async getFeaturedShops(limit = 6) {

    return await Shop.find({ isActive: true })
      .select('name location images')
      .limit(limit)
      .lean();
  }

  // Récupérer une shop par ID
  static async getById(id) {
    const shop = await Shop.findById(id)
      .populate('manager', 'prenom nom email')
    if (!shop) throw new Error('Shop non trouvée');
    return shop;
  }

  // Mettre à jour une shop
  static async update(id, data) {
    const shop = await Shop.findByIdAndUpdate(id, data, { new: true })
      .populate('mall', 'nom adresse')
      .populate('manager', 'prenom nom email');
    if (!shop) throw new Error('Shop non trouvée');
    return shop;
  }

  // Supprimer une shop
  static async delete(id) {
    const shop = await Shop.findByIdAndDelete(id);
    if (!shop) throw new Error('Shop non trouvée');
    return shop;
  }
}

module.exports = ShopService;
