require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("./src/config/database");
const authRoutes = require("./src/routes/authRoutes");
const appointmentRoutes = require("./src/routes/appointmentRoutes");
const userRoutes = require("./src/routes/userRoutes");

require('./src/services/reminderService');
const ejsLayouts = require("express-ejs-layouts"); 

const path = require("path");




const cookieParser = require("cookie-parser");



const app = express();




app.use(cookieParser()); // Ajout du middleware pour lire les cookies


// Utilisation d'express-ejs-layouts pour gérer les layouts
app.use(ejsLayouts);

// Configuration d'EJS
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "src", "views"));
app.set("layout", "layouts/layout");
app.use(express.static(path.join(__dirname, "src", "public")));

// Déclarer frontRoutes avant son utilisation
const frontRoutes = require("./src/routes/frontroutes");

//stocker les img







// Servir les fichiers statiques depuis le dossier "uploads"
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));





app.use(cors());
app.use(express.json());

// Routes

app.use("/", frontRoutes);


app.use("/api/auth", authRoutes);

app.use("/api/appointments", appointmentRoutes);

// Utilisation des routes d'utilisateurs
app.use('/api/users', userRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
});



