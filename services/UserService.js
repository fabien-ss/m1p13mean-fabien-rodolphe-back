// services/UserService.js
// models
const User = require('../models/User');
const Role = require('../models/Role'); // nouveau modèle Role

// lib
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

class UserService {

  // Création d'un utilisateur
  static async register(data) {
    const { firstName, name, email, password, role } = data;

    console.log(data)

    // Vérifie si l'email existe déjà
    const existing = await User.findOne({ email });
    if (existing) throw new Error('Email déjà utilisé');

    // Cherche le rôle dans la collection Role
    let allRole = await Role.find();
    console.log(`All roles in DB: ${allRole.map(r => r.name).join(', ')}`);
    let roleDoc = await Role.findOne({ name: role });
    console.log(roleDoc)
    if (!roleDoc) {
      // Si le rôle n'existe pas, on peut soit créer un rôle par défaut
      roleDoc = await Role.findOne({ name: 'acheteur' });
    }

    // Crée l'utilisateur avec role._id
    const user = new User({
      firstName: firstName,
      name: name,
      email: email,
      password: password,
      role: roleDoc._id
    });

    await user.save();

    // Populate pour renvoyer le rôle avec le user
    const userPopulated = await User.findById(user._id).populate('role', 'name');
    const userResponse = {
      id: userPopulated._id,
      prenom: userPopulated.firstName,
      name: userPopulated.name,
      email: userPopulated.email,
      role: userPopulated.role.name
    }
    return { message: 'Utilisateur créé avec succès', user: userResponse };
  }

  // Login
  // Login (inchangé)
  static async login(_email, _password) {
    const email = _email.trim();
    const password = _password.trim();
    const user = await User.findOne({ email }).populate('role', 'name');
    if (!user) throw new Error('Utilisateur non trouvé');

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new Error('Mot de passe incorrect');

    const token = jwt.sign(
      { id: user._id, role: user.role.name },
      process.env.JWT_SECRET || 'SECRET_KEY',
      { expiresIn: '1d' }
    );

    return {
      token,
      user: { id: user._id, firstName: user.firstName, name: user.name, role: user.role.name }
    };
  }

  // Récupérer tous les utilisateurs (exemple pour admin)
  static async getAll() {
    return await User.find().select('-password'); // on cache les passwords
  }
}

module.exports = UserService;
