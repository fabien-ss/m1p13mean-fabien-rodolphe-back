// models/Commande.js
const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true },
  products: [
    {
      produit: { type: mongoose.Schema.Types.ObjectId, ref: 'product', required: true },
      quantite: { type: Number, default: 1 }
    }
  ],
  total: { type: Number, required: true },
  statut: { type: String, enum: ['in progress', 'delivered', 'cancelled'], default: 'in progress' },
  creationDate: { type: Date, default: Date.now }
});

module.exports = mongoose.model('order', orderSchema);
