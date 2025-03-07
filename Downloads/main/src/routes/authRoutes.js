const express = require("express");
const authController = require("../controllers/authController");

const router = express.Router();

// Route d'inscription
router.post("/register", authController.register);

// Route de connexion
router.post("/login", authController.login);

// Route de déconnexion
router.post("/logout", authController.logout);

module.exports = router;
