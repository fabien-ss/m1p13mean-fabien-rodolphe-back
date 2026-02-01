require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const Role = require('./models/Role');
const User = require('./models/User');
const CentreCommercial = require('./models/CentreCommercial');
const Boutique = require('./models/Boutique');
const Produit = require('./models/Produit');

const mongoURI = process.env.MONGO_URI || 'mongodb://admin:pass12345@localhost:27017/akoor';

mongoose.connect(mongoURI)
  .then(() => console.log('MongoDB connecté'))
  .catch(err => console.error('Erreur de connexion MongoDB', err));

async function init() {
  try {
    // --------------------
    // 1️⃣ Roles
    // --------------------
    const rolesData = [
      { name: 'admin', description: 'Administrateur du centre commercial' },
      { name: 'boutique', description: 'Gérant de boutique' },
      { name: 'acheteur', description: 'Client final' }
    ];

    for (const role of rolesData) {
      const existing = await Role.findOne({ name: role.name });
      if (!existing) {
        await Role.create(role);
        console.log(`Role créé: ${role.name}`);
      }
    }

    const roleAdmin = await Role.findOne({ name: 'admin' });
    const roleBoutique = await Role.findOne({ name: 'boutique' });
    const roleAcheteur = await Role.findOne({ name: 'acheteur' });

    // --------------------
    // 2️⃣ Centre commercial
    // --------------------
    const ccName = 'Akoor';
    let centre = await CentreCommercial.findOne({ nom: ccName });
    if (!centre) {
      centre = await CentreCommercial.create({ nom: ccName, adresse: 'Ivato, Antananarivo' });
      console.log(`Centre commercial créé: ${ccName}`);
    }

    // --------------------
    // 3️⃣ Admin
    // --------------------
    const adminEmail = 'admin@akoor.com';
    let admin = await User.findOne({ email: adminEmail });
    if (!admin) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      admin = await User.create({
        prenom: 'Admin',
        nom: 'Akoor',
        email: adminEmail,
        password: hashedPassword,
        role: roleAdmin._id
      });
      console.log('Admin créé: admin@akoor.com / mot de passe: admin123');
    }

    // --------------------
    // 4️⃣ Boutiques et gérants
    // --------------------
    const boutiquesData = [
      {
        nom: 'Mode Plus',
        description: 'Vêtements et accessoires tendance',
        adresse: 'Etage 1, Bloc A',
        email: 'modeplus@akoor.com',
        telephone: '0341234567'
      },
      {
        nom: 'TechWorld',
        description: 'Électronique et gadgets',
        adresse: 'Etage 2, Bloc B',
        email: 'techworld@akoor.com',
        telephone: '0347654321'
      },
      {
        nom: 'Beauté & Co',
        description: 'Cosmétiques et parfums',
        adresse: 'Etage 1, Bloc C',
        email: 'beaute@akoor.com',
        telephone: '0349876543'
      }
    ];

    const boutiques = [];

    for (const bData of boutiquesData) {
      // Créer le gérant
      const gerantEmail = `gerant_${bData.nom.replace(/\s/g,'').toLowerCase()}@akoor.com`;
      let gerant = await User.findOne({ email: gerantEmail });
      if (!gerant) {
        const hashedPassword = await bcrypt.hash('gerant123', 10);
        gerant = await User.create({
          prenom: 'Gérant',
          nom: bData.nom,
          email: gerantEmail,
          password: hashedPassword,
          role: roleBoutique._id
        });
      }

      let boutique = await Boutique.findOne({ nom: bData.nom });
      if (!boutique) {
        boutique = await Boutique.create({
          ...bData,
          centreCommercial: centre._id,
          gerant: gerant._id
        });
      }

      boutiques.push(boutique);
    }

    console.log('Boutiques créées avec gérants');

    // --------------------
    // 5️⃣ Produits
    // --------------------
    const productsData = [
      { nom: 'T-Shirt Homme', description: 'T-shirt coton', prix: 20000, stock: 50, categorie: 'Vêtements', tags: ['homme','tshirt'] },
      { nom: 'Jeans Femme', description: 'Jeans bleu slim', prix: 50000, stock: 30, categorie: 'Vêtements', tags: ['femme','jeans'] },
      { nom: 'Smartphone X', description: 'Dernier modèle', prix: 1200000, stock: 10, categorie: 'Électronique', tags: ['smartphone','android'] },
      { nom: 'Casque Audio', description: 'Bluetooth, noise-cancelling', prix: 150000, stock: 20, categorie: 'Électronique', tags: ['audio','casque'] },
      { nom: 'Parfum Floral', description: 'Parfum pour femme', prix: 70000, stock: 25, categorie: 'Cosmétiques', tags: ['parfum','femme'] },
      { nom: 'Rouge à Lèvres', description: 'Couleur rouge intense', prix: 30000, stock: 40, categorie: 'Cosmétiques', tags: ['maquillage','lèvres'] }
    ];

    for (let i = 0; i < boutiques.length; i++) {
      const boutique = boutiques[i];
      // Chaque boutique reçoit deux produits différents
      const boutiqueProducts = productsData.slice(i*2, i*2 + 2);
      for (const p of boutiqueProducts) {
        const exists = await Produit.findOne({ nom: p.nom, boutique: boutique._id });
        if (!exists) {
          await Produit.create({
            ...p,
            boutique: boutique._id,
            modifiedBy: admin._id
          });
        }
      }
    }

    console.log('Produits créés pour chaque boutique');

    console.log('✅ Initialisation complète de la base terminée !');
    process.exit(0);

  } catch (err) {
    console.error('Erreur init DB:', err);
    process.exit(1);
  }
}

init();
