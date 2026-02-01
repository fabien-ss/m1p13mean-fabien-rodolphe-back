// models/Commande.js
const mongoose = require('mongoose');

const commandeSchema = new mongoose.Schema({
  acheteur: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  produits: [
    {
      produit: { type: mongoose.Schema.Types.ObjectId, ref: 'Produit', required: true },
      quantite: { type: Number, default: 1 }
    }
  ],
  total: { type: Number, required: true },
  status: { type: String, enum: ['en cours', 'livrée', 'annulée'], default: 'en cours' },
  dateCreation: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Commande', commandeSchema);
