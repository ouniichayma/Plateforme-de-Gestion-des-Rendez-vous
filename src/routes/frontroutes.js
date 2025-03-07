
const express = require("express");
const router = express.Router();

// Page d'accueil
router.get("/", (req, res) => {
  res.render("index", { title: "Accueil" });
});

// Page de connexion
router.get("/login", (req, res) => {
  res.render("login", { title: "Connexion" });
});

// Page d'inscription
router.get("/register", (req, res) => {
  res.render("register", { title: "Inscription" });
});

module.exports = router;
