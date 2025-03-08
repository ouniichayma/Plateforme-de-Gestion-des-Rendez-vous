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
  