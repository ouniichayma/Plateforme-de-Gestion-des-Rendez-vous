require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("./src/config/database");
const authRoutes = require("./src/routes/authRoutes");
const appointmentRoutes = require("./src/routes/appointmentRoutes");


require('./src/services/reminderService');
const ejsLayouts = require("express-ejs-layouts"); 

const path = require("path");








const app = express();



// Utilisation d'express-ejs-layouts pour gérer les layouts
app.use(ejsLayouts);

// Configuration d'EJS
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "src", "views"));
app.set("layout", "layouts/layout");
app.use(express.static(path.join(__dirname, "src", "public")));

// Déclarer frontRoutes avant son utilisation
const frontRoutes = require("./src/routes/frontroutes");













app.use(cors());
app.use(express.json());

// Routes

app.use("/", frontRoutes);


app.use("/api/auth", authRoutes);

app.use("/api/appointments", appointmentRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
});



