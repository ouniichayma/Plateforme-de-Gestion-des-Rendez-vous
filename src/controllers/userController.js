const mongoose = require("mongoose");

const User = require('../models/User');



// Lire un utilisateur par son ID
exports.getUserById = async (req, res) => {
    try {
      const user = await User.findById(req.params.id);
  
      if (!user) {
        return res.status(404).json({ message: "Utilisateur non trouvé." });
      }
  
      res.status(200).json(user);
    } catch (error) {
      res.status(500).json({ message: "Erreur serveur", error });
    }
  };
  
  // Mettre à jour un utilisateur
  exports.updateUser = async (req, res) => {
    try {
      const { firstName, lastName, email, password, role } = req.body;
      const updateData = { firstName, lastName, email, role };
  
      if (password) {
        updateData.password = await bcrypt.hash(password, 10);
      }
  
      // Vérification de l'image téléchargée
      if (req.file) {
        updateData.image = req.file.path;
      }
  
      const updatedUser = await User.findByIdAndUpdate(req.params.id, updateData, { new: true });
  
      if (!updatedUser) {
        return res.status(404).json({ message: "Utilisateur non trouvé." });
      }
  
      res.status(200).json({ message: "Utilisateur mis à jour avec succès !", user: updatedUser });
    } catch (error) {
      res.status(500).json({ message: "Erreur serveur", error });
    }
  };
  
  // Supprimer un utilisateur
  exports.deleteUser = async (req, res) => {
    try {
      const user = await User.findByIdAndDelete(req.params.id);
  
      if (!user) {
        return res.status(404).json({ message: "Utilisateur non trouvé." });
      }
  
      res.status(200).json({ message: "Utilisateur supprimé avec succès." });
    } catch (error) {
      res.status(500).json({ message: "Erreur serveur", error });
    }
  };
  
  // Lire tous les utilisateurs
  exports.getAllUsers = async (req, res) => {
    try {
      const users = await User.find();
      res.status(200).json(users);
    } catch (error) {
      res.status(500).json({ message: "Erreur serveur", error });
    }
  };









// Récupérer tous les utilisateurs de type "professionnel" 
exports.professionnel = async (req, res, next) => {
    try {
      console.log("Requête: ", { role: "professionnel" });
      const professionnels = await User.find({ role: "professionnel" }); // Utilisez find au lieu de findOne
      res.status(200).json(professionnels);
    } catch (error) {
      console.error("Erreur serveur", error);
      res.status(500).json({ message: "Erreur serveur", error });
    }
  };
  

  exports.getUserStats = async (req, res) => {
    try {
        console.log('Début de la récupération des statistiques');

        // Agrégation pour compter les utilisateurs par rôle
        const stats = await User.aggregate([
            {
                $group: {
                    _id: "$role", // Regrouper par le champ 'role'
                    count: { $sum: 1 } // Compter le nombre d'utilisateurs par rôle
                }
            }
        ]);

        console.log('Statistiques des utilisateurs:', stats);

        // Construire la réponse avec les résultats agrégés
        const statsResult = {
            adminCount: stats.find(stat => stat._id === 'admin')?.count || 0,
            professionalCount: stats.find(stat => stat._id === 'professionnel')?.count || 0,
            clientCount: stats.find(stat => stat._id === 'client')?.count || 0,
        };

        res.json(statsResult);
    } catch (error) {
        console.error('Erreur dans la récupération des statistiques:', error);
        res.status(500).json({
            message: 'Erreur serveur',
            errorDetails: error.message || error
        });
    }
};
