// models/Boutique.js
const mongoose = require('mongoose');

const boutiqueSchema = new mongoose.Schema({
  nom: { type: String, required: true },
  description: { type: String },
  adresse: { type: String }, // optionnel si déjà dans le centre
  email: { type: String },
  telephone: { type: String },
  centreCommercial: { type: mongoose.Schema.Types.ObjectId, ref: 'CentreCommercial', required: true },
  gerant: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // profil boutique
  produits: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Produit' }], // facultatif
  dateCreation: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Boutique', boutiqueSchema);
