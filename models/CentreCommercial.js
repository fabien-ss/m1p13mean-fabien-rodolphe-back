// models/CentreCommercial.js
const mongoose = require('mongoose');

const centreSchema = new mongoose.Schema({
    nom: { type: String, required: true },
    adresse: { type: String },
    description: { type: String },
    boutiques: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Boutique' }], // facultatif
    dateCreation: { type: Date, default: Date.now },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' } // admin ou gérant
});

module.exports = mongoose.model('CentreCommercial', centreSchema);