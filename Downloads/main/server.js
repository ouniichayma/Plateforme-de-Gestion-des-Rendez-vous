require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("./src/config/database");
const cookieParser = require('cookie-parser');
const expressLayouts = require("express-ejs-layouts");
const path = require("path");
const jwt = require('jsonwebtoken');
const User = require('./src/models/User');

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
app.set("layout", false); // Désactiver le layout par défaut
app.use(expressLayouts);
app.use(express.static(path.join(__dirname, "src", "public")));

// Routes publiques
const { router: authRouter } = require("./src/routes/authRoutes");
app.use("/api/auth", authRouter);

// Route racine - toujours afficher la page de connexion
app.get('/', (req, res) => {
    res.render('login', { 
        title: 'Connexion',
        layout: false
    });
});

// Route login
app.get('/login', (req, res) => {
    const token = req.cookies.token;
    if (token) {
        try {
            jwt.verify(token, process.env.JWT_SECRET);
            return res.redirect('/dashboard');
        } catch (error) {
            res.clearCookie('token');
        }
    }
    res.render('login', { 
        title: 'Connexion',
        layout: false
    });
});

// Route register
app.get('/register', (req, res) => {
    const token = req.cookies.token;
    if (token) {
        try {
            jwt.verify(token, process.env.JWT_SECRET);
            return res.redirect('/dashboard');
        } catch (error) {
            res.clearCookie('token');
        }
    }
    res.render('register', { 
        title: 'Inscription',
        layout: false
    });
});

// Route de déconnexion
app.get('/logout', (req, res) => {
    res.clearCookie('token');
    res.redirect('/login');
});

// Middleware d'authentification pour les routes protégées
const authMiddleware = async (req, res, next) => {
    try {
        const token = req.cookies.token;
        if (!token) {
            if (req.xhr || req.path.startsWith('/api/')) {
                return res.status(401).json({ message: 'Non authentifié' });
            }
            return res.redirect('/login');
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId);
        
        if (!user) {
            res.clearCookie('token');
            if (req.xhr || req.path.startsWith('/api/')) {
                return res.status(401).json({ message: 'Utilisateur non trouvé' });
            }
            return res.redirect('/login');
        }

        req.user = {
            _id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            role: user.role
        };
        next();
    } catch (error) {
        console.error('Erreur d\'authentification:', error);
        res.clearCookie('token');
        if (req.xhr || req.path.startsWith('/api/')) {
            return res.status(401).json({ message: 'Token invalide' });
        }
        return res.redirect('/login');
    }
};

// Routes protégées
app.use("/api/appointments", authMiddleware, require("./src/routes/appointmentRoutes"));

// Route du dashboard
app.get('/dashboard', authMiddleware, async (req, res) => {
    try {
        const viewName = req.user.role === 'professionnel' ? 'appointments-professional' : 'appointments-client';
        res.render(viewName, {
            title: `Tableau de bord ${req.user.role === 'professionnel' ? 'Professionnel' : 'Client'}`,
            user: req.user,
            layout: false
        });
    } catch (error) {
        console.error('Erreur dashboard:', error);
        res.clearCookie('token');
        res.redirect('/login');
    }
});

// Routes des rendez-vous
app.get('/appointments', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'client') {
            return res.redirect('/dashboard');
        }

        res.render('appointments-client', {
            title: 'Mes Rendez-vous',
            layout: './layouts/layout',
            user: {
                userId: req.user._id,
                firstName: req.user.firstName,
                lastName: req.user.lastName,
                email: req.user.email,
                role: req.user.role
            }
        });
    } catch (error) {
        console.error('Erreur rendez-vous:', error);
        res.clearCookie('token');
        return res.redirect('/login');
    }
});

app.get('/appointments-professional', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'professionnel') {
            return res.redirect('/dashboard');
        }

        res.render('appointments-professional', {
            title: 'Gestion des Rendez-vous',
            layout: './layouts/layout',
            user: {
                userId: req.user._id,
                firstName: req.user.firstName,
                lastName: req.user.lastName,
                email: req.user.email,
                role: req.user.role
            }
        });
    } catch (error) {
        console.error('Erreur rendez-vous professionnel:', error);
        res.clearCookie('token');
        return res.redirect('/login');
    }
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
    res.status(500).json({ 
        success: false,
        message: "Une erreur est survenue",
        error: process.env.NODE_ENV === 'development' ? err.message : {}
    });
});

// Middleware pour les routes non trouvées
app.use((req, res) => {
    if (req.xhr || req.headers.accept?.indexOf('json') > -1) {
        res.status(404).json({ success: false, message: 'Route non trouvée' });
    } else {
        res.status(404).render('error', { 
            title: 'Page non trouvée',
            message: 'La page que vous recherchez n\'existe pas',
            layout: false
        });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
});
