// services/UserService.js
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

class UserService {

  // Création d'un utilisateur
  static async register(data) {
    const { prenom, nom, email, password, role } = data;
    const existing = await User.findOne({ email });
    if (existing) throw new Error('Email déjà utilisé');

    const user = new User({ prenom, nom, email, password, role });
    await user.save();
    return { message: 'Utilisateur créé avec succès', user };
  }

  // Login
  static async login(email, password) {
    const user = await User.findOne({ email });
    if (!user) throw new Error('Utilisateur non trouvé');

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new Error('Mot de passe incorrect');

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET || 'SECRET_KEY',
      { expiresIn: '1d' }
    );

    return {
      token,
      user: { id: user._id, prenom: user.prenom, nom: user.nom, role: user.role }
    };
  }

  // Récupérer tous les utilisateurs (exemple pour admin)
  static async getAll() {
    return await User.find().select('-password'); // on cache les passwords
  }
}

module.exports = UserService;
