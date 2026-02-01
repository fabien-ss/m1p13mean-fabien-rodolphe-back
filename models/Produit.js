// models/Produit.js
const mongoose = require('mongoose');

const produitSchema = new mongoose.Schema({
  nom: { type: String, required: true },
  description: { type: String },
  prix: { type: Number, required: true },
  prixPromo: { type: Number },
  devise: { type: String, default: 'MGA' },
  stock: { type: Number, default: 0 },
  disponible: { type: Boolean, default: true },
  images: [{ type: String }],
  categorie: { type: String },
  tags: [{ type: String }],
  boutique: { type: mongoose.Schema.Types.ObjectId, ref: 'Boutique', required: true },
  dateCreation: { type: Date, default: Date.now },
  dateModification: { type: Date, default: Date.now },
  modifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

module.exports = mongoose.model('Produit', produitSchema);
