const jwt = require('jsonwebtoken');

function authMiddleware(requiredRoles = []) {
  return (req, res, next) => {
    try {
      const token = req.headers.authorization?.split(' ')[1]; // Bearer <token>
      if (!token) return res.status(401).json({ error: 'Token manquant' });

      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'SECRET_KEY');
      req.user = decoded; // id et role du token

      // Vérification des rôles autorisés
      if (requiredRoles.length && !requiredRoles.includes(req.user.role)) {
        return res.status(403).json({ error: 'Accès refusé' });
      }

      next();
    } catch (err) {
      return res.status(401).json({ error: 'Token invalide' });
    }
  };
}

module.exports = authMiddleware;
