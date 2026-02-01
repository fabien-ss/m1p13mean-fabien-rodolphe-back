const Boutique = require('../models/Boutique');

class BoutiqueService {

  // Créer une boutique
  static async create(data) {
    const { nom, description, adresse, email, telephone, centreCommercial, gerant } = data;

    // Vérifier si une boutique du même nom existe dans ce centre
    const existing = await Boutique.findOne({ nom, centreCommercial });
    if (existing) throw new Error(`La boutique '${nom}' existe déjà dans ce centre commercial`);

    const boutique = new Boutique({
      nom,
      description,
      adresse,
      email,
      telephone,
      centreCommercial,
      gerant
    });

    await boutique.save();
    return boutique;
  }

  // Récupérer toutes les boutiques
  static async getAll() {
    return await Boutique.find()
      .populate('centreCommercial', 'nom adresse')
      .populate('gerant', 'prenom nom email');
  }

  // Récupérer une boutique par ID
  static async getById(id) {
    const boutique = await Boutique.findById(id)
      .populate('centreCommercial', 'nom adresse')
      .populate('gerant', 'prenom nom email')
      .populate('produits'); // si tu veux les produits
    if (!boutique) throw new Error('Boutique non trouvée');
    return boutique;
  }

  // Mettre à jour une boutique
  static async update(id, data) {
    const boutique = await Boutique.findByIdAndUpdate(id, data, { new: true })
      .populate('centreCommercial', 'nom adresse')
      .populate('gerant', 'prenom nom email');
    if (!boutique) throw new Error('Boutique non trouvée');
    return boutique;
  }

  // Supprimer une boutique
  static async delete(id) {
    const boutique = await Boutique.findByIdAndDelete(id);
    if (!boutique) throw new Error('Boutique non trouvée');
    return boutique;
  }
}

module.exports = BoutiqueService;
