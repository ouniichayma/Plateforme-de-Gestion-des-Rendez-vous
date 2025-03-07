module.exports = (allowedRoles) => {
    return (req, res, next) => {
      // Vérifier si l'utilisateur est authentifié
      if (!req.user || !req.user.role) {
        return res.status(403).json({ message: "Accès refusé." });
      }
  
      // Vérifier si son rôle est autorisé
      if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({ message: "Accès interdit : rôle insuffisant." });
      }
  
      next(); // Continuer si le rôle est valide
    };
  };
  