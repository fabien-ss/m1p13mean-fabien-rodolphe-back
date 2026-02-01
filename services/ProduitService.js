const Produit = require('../models/Produit');

class ProduitService {

  // Créer un produit
  static async create(data, user) {
    // Si le user est gérant, il ne peut créer que pour sa propre boutique
    if (user.role !== 'admin' && user.role !== 'boutique') {
      throw new Error('Non autorisé à créer un produit');
    }

    if (user.role === 'boutique') {
      data.boutique = user.boutique; // assume user.boutique stocke ObjectId
    }

    const produit = new Produit({
      ...data,
      modifiedBy: user.id
    });

    await produit.save();
    return produit;
  }

  // Récupérer tous les produits
  static async getAll(user) {
    // Si gérant, ne renvoyer que ses produits
    if (user.role === 'boutique') {
      return await Produit.find({ boutique: user.boutique })
        .populate('boutique', 'nom')
        .populate('modifiedBy', 'prenom nom');
    }

    // Admin et acheteur voient tout
    return await Produit.find()
      .populate('boutique', 'nom')
      .populate('modifiedBy', 'prenom nom');
  }

  // Récupérer un produit par ID
  static async getById(id, user) {
    const produit = await Produit.findById(id)
      .populate('boutique', 'nom')
      .populate('modifiedBy', 'prenom nom');

    if (!produit) throw new Error('Produit non trouvé');

    // Vérification droits boutique
    if (user.role === 'boutique' && produit.boutique._id.toString() !== user.boutique.toString()) {
      throw new Error('Non autorisé');
    }

    return produit;
  }

  // Mettre à jour un produit
  static async update(id, data, user) {
    const produit = await Produit.findById(id);
    if (!produit) throw new Error('Produit non trouvé');

    // Vérification droits
    if (user.role === 'boutique' && produit.boutique.toString() !== user.boutique.toString()) {
      throw new Error('Non autorisé');
    }

    Object.assign(produit, data);
    produit.modifiedBy = user.id;
    produit.dateModification = new Date();
    await produit.save();

    return await Produit.findById(id)
      .populate('boutique', 'nom')
      .populate('modifiedBy', 'prenom nom');
  }

  // Supprimer un produit
  static async delete(id, user) {
    const produit = await Produit.findById(id);
    if (!produit) throw new Error('Produit non trouvé');

    if (user.role === 'boutique' && produit.boutique.toString() !== user.boutique.toString()) {
      throw new Error('Non autorisé');
    }

    await produit.remove();
    return produit;
  }
}

module.exports = ProduitService;
