const Role = require('../models/Role');

class RoleService {
  // Créer un rôle
  static async createRole(data) {
    const { name, description } = data;

    // Vérifie si le rôle existe déjà
    const exists = await Role.findOne({ name });
    if (exists) {
      throw new Error(`Rôle '${name}' existe déjà`);
    }

    const role = new Role({ name, description });
    await role.save();
    return role;
  }

  // Retourne tous les rôles
  static async getAllRoles() {
    return await Role.find();
  }

  // Récupérer un rôle par son nom
  static async getRoleByName(name) {
    return await Role.findOne({ name });
  }
}

module.exports = RoleService;
