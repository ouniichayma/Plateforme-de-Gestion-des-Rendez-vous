const express = require("express");
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware d'authentification pour les vues protégées
const authMiddleware = async (req, res, next) => {
    const token = req.cookies.token;
    
    if (!token) {
        return res.redirect('/login');
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId);
        
        if (!user) {
            res.clearCookie('token');
            return res.redirect('/login');
        }

        req.user = {
            id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role
        };
        next();
    } catch (error) {
        console.error('Erreur d\'authentification:', error);
        res.clearCookie('token');
        res.redirect('/login');
    }
};

// Middleware de vérification des rôles
const checkRole = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).render('error', {
                title: 'Accès refusé',
                message: 'Vous n\'avez pas les permissions nécessaires pour accéder à cette page'
            });
        }
        next();
    };
};

// Page d'accueil
router.get("/", (req, res) => {
    const token = req.cookies.token;
    if (token) {
        try {
            jwt.verify(token, process.env.JWT_SECRET);
            return res.redirect('/dashboard');
        } catch (error) {
            res.clearCookie('token');
        }
    }
    res.render("index", { title: "Accueil" });
});

// Page de connexion
router.get("/login", (req, res) => {
    const token = req.cookies.token;
    if (token) {
        try {
            jwt.verify(token, process.env.JWT_SECRET);
            return res.redirect('/dashboard');
        } catch (error) {
            res.clearCookie('token');
        }
    }
    res.render("login", { title: "Connexion" });
});

// Page d'inscription
router.get("/register", (req, res) => {
    const token = req.cookies.token;
    if (token) {
        try {
            jwt.verify(token, process.env.JWT_SECRET);
            return res.redirect('/dashboard');
        } catch (error) {
            res.clearCookie('token');
        }
    }
    res.render("register", { title: "Inscription" });
});

// Dashboard (protégé)
router.get("/dashboard", authMiddleware, (req, res) => {
    res.render("dashboard", { 
        title: "Tableau de bord",
        user: req.user
    });
});

// Routes spécifiques aux rôles
router.get("/users", authMiddleware, checkRole('admin'), async (req, res) => {
    try {
        const users = await User.find().select('-password');
        res.render("users", {
            title: "Gestion des utilisateurs",
            user: req.user,
            users: users
        });
    } catch (error) {
        console.error('Erreur:', error);
        res.status(500).render('error', {
            title: 'Erreur',
            message: 'Une erreur est survenue'
        });
    }
});

// Page des rendez-vous (protégée avec vérification de rôle)
router.get("/appointments", authMiddleware, async (req, res) => {
    try {
        let professionals = [];
        let viewName = '';
        let appointments = [];

        switch (req.user.role) {
            case 'admin':
                professionals = await User.find({ role: 'professionnel' }).select('firstName lastName');
                viewName = 'appointments-admin';
                break;
            case 'professionnel':
                viewName = 'appointments-professional';
                break;
            case 'client':
                professionals = await User.find({ role: 'professionnel' }).select('firstName lastName');
                viewName = 'appointments-client';
                break;
            default:
                return res.status(403).render('error', {
                    title: 'Erreur',
                    message: 'Rôle non reconnu'
                });
        }

        res.render(viewName, {
            title: "Gestion des Rendez-vous",
            user: req.user,
            professionals: professionals,
            appointments: appointments
        });
    } catch (error) {
        console.error('Erreur lors du chargement des rendez-vous:', error);
        res.status(500).render('error', {
            title: 'Erreur',
            message: 'Une erreur est survenue lors du chargement de la page'
        });
    }
});

// Route de déconnexion
router.get("/logout", (req, res) => {
    res.clearCookie('token');
    res.redirect('/login');
});

module.exports = router;
