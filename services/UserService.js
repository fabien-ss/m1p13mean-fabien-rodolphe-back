// services/UserService.js
// models
const User = require('../models/User');
const Role = require('../models/Role'); // nouveau modèle Role
const Order = require('../models/Order');
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
      roleDoc = await Role.findOne({ name: 'client' });
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
    return { message: 'Utilisateur créé avec succès', user: userPopulated };
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

    if(!user.isActive) throw new Error("Votre utilisateur a été désactivé");

    const token = jwt.sign(
      { id: user._id, role: user.role.name },
      process.env.JWT_SECRET || 'SECRET_KEY',
      { expiresIn: '1d' }
    );

    return {
      token,
      user: { 
        id: user._id, 
        firstName: user.firstName, 
        name: user.name, 
        role: user.role.name,
        email: user.email
      }
    };
  }

  // Récupérer tous les utilisateurs (exemple pour admin)
  static async getAll() {
    return await User.find().select('-password'); // on cache les passwords
  }

  static async countClients() {
    const clientRole = await Role.findOne({ name: 'client' });
    if (!clientRole) return 0;
    return await User.countDocuments({ role: clientRole._id });
  }

  static async countOrders(){
    const orders = await Order.countDocuments();
    return orders;
  }
  static async getById(id) {
  const user = await User.findById(id)
    .select('-password')
    .populate('role', 'name');
  if (!user) throw new Error('Utilisateur non trouvé');
  return user;
}

static async getAll() {
  return await User.find()
    .select('-password')
    .populate('role', 'name');
}

static async update(id, data) {
  // On ne permet pas de changer le password via update
  delete data.password;

  // Si role est un nom (string), on résout l'ObjectId
  if (data.role && typeof data.role === 'string' && !data.role.match(/^[0-9a-fA-F]{24}$/)) {
    const roleDoc = await Role.findOne({ name: data.role });
    if (!roleDoc) throw new Error(`Rôle '${data.role}' introuvable`);
    data.role = roleDoc._id;
  }

  const user = await User.findByIdAndUpdate(id, data, { new: true })
    .select('-password')
    .populate('role', 'name');
  if (!user) throw new Error('Utilisateur non trouvé');
  return user;
}

static async deactivate(id) {
  const user = await User.findByIdAndUpdate(id, { isActive: false }, { new: true })
    .select('-password')
    .populate('role', 'name');
  if (!user) throw new Error('Utilisateur non trouvé');
  return user;
}

static async activate(id) {
  const user = await User.findByIdAndUpdate(id, { isActive: true }, { new: true })
    .select('-password')
    .populate('role', 'name');
  if (!user) throw new Error('Utilisateur non trouvé');
  return user;
}

static async resetPassword(id, newPassword) {
  if (!newPassword || newPassword.length < 6)
    throw new Error('Le mot de passe doit contenir au moins 6 caractères');

  const salt = await bcrypt.genSalt(10);
  const hashed = await bcrypt.hash(newPassword, salt);

  const user = await User.findByIdAndUpdate(id, { password: hashed }, { new: true })
    .select('-password')
    .populate('role', 'name');
  if (!user) throw new Error('Utilisateur non trouvé');
  return { message: 'Mot de passe réinitialisé avec succès', user };
}
}

module.exports = UserService;
