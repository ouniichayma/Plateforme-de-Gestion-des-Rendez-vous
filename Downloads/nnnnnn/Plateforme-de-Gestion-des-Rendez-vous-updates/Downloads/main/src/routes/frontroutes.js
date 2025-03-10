const express = require("express");
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware d'authentification
const authMiddleware = async (req, res, next) => {
    try {
        const token = req.cookies.token;
        if (!token) {
            return res.redirect('/login');
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        const user = await User.findById(decoded.userId);
        if (!user) {
            res.clearCookie('token');
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
        res.redirect('/login');
    }
};

// Page de connexion
router.get('/login', (req, res) => {
    res.render('login', { 
        title: 'Connexion',
        layout: false 
    });
});

// Page d'inscription
router.get('/register', (req, res) => {
    res.render('register', { 
        title: 'Inscription',
        layout: false 
    });
});

// Dashboard (protégé)
router.get('/dashboard', authMiddleware, async (req, res) => {
    try {
        if (req.user.role === 'professionnel') {
            return res.render('dashboard-professional', {
                title: 'Espace Professionnel',
                user: req.user,
                layout: false
            });
        } else if (req.user.role === 'client') {
            return res.render('dashboard', {
                title: 'Espace Client',
                user: req.user,
                layout: false
            });
        } else {
            res.clearCookie('token');
            return res.redirect('/login');
        }
    } catch (error) {
        console.error('Erreur dashboard:', error);
        res.clearCookie('token');
        res.redirect('/login');
    }
});

// Liste des rendez-vous (protégée, professionnels uniquement)
router.get('/appointments/list', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'professionnel') {
            return res.redirect('/dashboard');
        }
        res.render('appointments-list', {
            title: 'Liste des Rendez-vous',
            user: req.user,
            layout: false
        });
    } catch (error) {
        console.error('Erreur liste des rendez-vous:', error);
        res.redirect('/dashboard');
    }
});

// Page nouveau rendez-vous (protégée)
router.get('/appointments/new', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'client') {
            return res.redirect('/dashboard');
        }

        // Récupérer la liste des professionnels
        const professionals = await User.find({ role: 'professionnel' })
            .select('firstName lastName email _id')
            .sort('firstName lastName');

        res.render('new-appointment', { 
            title: 'Nouveau Rendez-vous',
            user: req.user,
            professionals: professionals,
            layout: false
        });
    } catch (error) {
        console.error('Erreur nouveau rendez-vous:', error);
        res.redirect('/dashboard');
    }
});

// Déconnexion
router.get('/logout', (req, res) => {
    res.clearCookie('token');
    res.redirect('/login');
});

router.post('/logout', (req, res) => {
    res.clearCookie('token');
    res.json({ success: true });
});

module.exports = router;
