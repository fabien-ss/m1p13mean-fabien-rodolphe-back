// models/CentreCommercial.js
const mongoose = require('mongoose');

const MallSchema = new mongoose.Schema({
    name: { type: String, required: true },
    address: { type: String },
    description: { type: String },
    shops: [{ type: mongoose.Schema.Types.ObjectId, ref: 'shop' }], // facultatif
    creationDate: { type: Date, default: Date.now },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'user' } // admin ou gérant
});

module.exports = mongoose.model('mall', centreSchema);