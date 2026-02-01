// models/Boutique.js
const mongoose = require('mongoose');

const boutiqueSchema = new mongoose.Schema({
  nom: { type: String, required: true },
  description: { type: String },
  adresse: { type: String },
  email: { type: String },
  telephone: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // admin ou gérant
  dateCreation: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Boutique', boutiqueSchema);
