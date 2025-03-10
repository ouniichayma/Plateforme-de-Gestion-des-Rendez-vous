require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("./src/config/database");
const cookieParser = require('cookie-parser');
const expressLayouts = require("express-ejs-layouts");
const path = require("path");
const jwt = require('jsonwebtoken');
const User = require('./src/models/User');
const authMiddleware = require('./src/middleware/authMiddleware');

const app = express();

// Configuration CORS
app.use(cors({
    origin: 'http://localhost:5000',
    credentials: true
}));

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

// Configuration d'EJS
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "src", "views"));
app.set("layout extractScripts", true);
app.set("layout extractStyles", true);
app.set("layout", false);
app.use(expressLayouts);
app.use(express.static(path.join(__dirname, "src", "public")));

// Routes publiques
const { router: authRouter } = require("./src/routes/authRoutes");
const frontRoutes = require("./src/routes/frontroutes");

// Route racine
app.get('/', (req, res) => {
    res.render('login', { 
        title: 'Connexion',
        layout: false
    });
});

app.use("/api/auth", authRouter);
app.use("/", frontRoutes);

// Routes protégées
app.use("/api/appointments", authMiddleware, require("./src/routes/appointmentRoutes"));

// Route du dashboard
app.get('/dashboard', authMiddleware, async (req, res) => {
    try {
        res.render('dashboard', {
            title: 'Tableau de bord',
            user: req.user,
            layout: false
        });
    } catch (error) {
        console.error('Erreur dashboard:', error);
        res.clearCookie('token');
        res.redirect('/login');
    }
});

// Route nouveau rendez-vous
app.get('/appointments/new', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'client') {
            return res.redirect('/dashboard');
        }
        res.render('new-appointment', {
            title: 'Nouveau Rendez-vous',
            user: req.user,
            layout: false
        });
    } catch (error) {
        console.error('Erreur nouveau rendez-vous:', error);
        res.redirect('/dashboard');
    }
});

// Route de déconnexion
app.post('/logout', (req, res) => {
    res.clearCookie('token');
    res.json({ success: true });
});

// Middleware de gestion des erreurs
app.use((err, req, res, next) => {
    console.error('Erreur:', err);
    if (err.name === 'UnauthorizedError' || err.status === 401) {
        return res.status(401).json({ success: false, message: 'Non authentifié' });
    }
    if (err.status === 403) {
        return res.status(403).json({ success: false, message: 'Accès refusé' });
    }
    res.status(500).json({ success: false, message: 'Erreur serveur' });
});

// Démarrage du serveur
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Serveur démarré sur le port ${PORT}`);
});
