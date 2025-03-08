const express = require('express');
const multer = require('multer');
const { getAllUsers,  getUserById, updateUser, deleteUser,professionnel} = require('../controllers/userController');
const upload = multer({ dest: 'uploads/' }); // Configuration de Multer pour gérer l'upload d'image

const router = express.Router();



// Route pour obtenir tous les utilisateurs
router.get('/', getAllUsers);



router.get('/professionnel', professionnel);

// Route pour obtenir un utilisateur par ID
router.get('/:id', getUserById);

// Route pour mettre à jour un utilisateur
router.put('/:id', upload.single('image'), updateUser);

// Route pour supprimer un utilisateur
router.delete('/:id', deleteUser);




module.exports = router;
