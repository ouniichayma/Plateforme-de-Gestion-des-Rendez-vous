require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("./src/config/database");
const authRoutes = require("./src/routes/authRoutes");
const appointmentRoutes = require("./src/routes/appointmentRoutes");
const cookieParser = require('cookie-parser');
const ejsLayouts = require("express-ejs-layouts"); 
const path = require("path");

const app = express();

// Configuration CORS
app.use(cors({
  origin: 'http://localhost:5000',
  credentials: true
}));

// Middleware
app.use(express.json());
app.use(cookieParser());

// Utilisation d'express-ejs-layouts pour gérer les layouts
app.use(ejsLayouts);

// Configuration d'EJS
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "src", "views"));
app.set("layout", "layouts/layout");
app.use(express.static(path.join(__dirname, "src", "public")));

// Déclarer frontRoutes avant son utilisation
const frontRoutes = require("./src/routes/frontroutes");

// Routes API
app.use("/api/auth", authRoutes);
app.use("/api/appointments", appointmentRoutes);

// Routes Frontend (doivent être après les routes API)
app.use("/", frontRoutes);

// Middleware de gestion des erreurs
app.use((err, req, res, next) => {
  console.error(err.stack);
  if (err.name === 'UnauthorizedError' || err.status === 401) {
    return res.status(401).json({ message: 'Non authentifié' });
  }
  if (err.status === 403) {
    return res.status(403).json({ message: 'Accès refusé' });
  }
  res.status(500).json({ 
    message: "Une erreur est survenue",
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

// Middleware pour gérer les routes non trouvées
app.use((req, res) => {
  if (req.xhr || req.headers.accept.indexOf('json') > -1) {
    res.status(404).json({ message: 'Route non trouvée' });
  } else {
    res.status(404).render('error', { 
      title: 'Page non trouvée',
      message: 'La page que vous recherchez n\'existe pas'
    });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
});
