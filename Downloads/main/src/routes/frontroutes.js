const express = require("express");
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Page de connexion
router.get('/login', (req, res) => {
    const token = req.cookies.token;
    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            return res.redirect('/dashboard');
        } catch (error) {
            res.clearCookie('token');
        }
    }
    res.render('login', { title: 'Connexion' });
});

// Page d'inscription
router.get('/register', (req, res) => {
    const token = req.cookies.token;
    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            return res.redirect('/dashboard');
        } catch (error) {
            res.clearCookie('token');
        }
    }
    res.render('register', { title: 'Inscription' });
});

// Dashboard (protégé)
router.get('/dashboard', async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        
        if (!user) {
            res.clearCookie('token');
            return res.redirect('/login');
        }

        // Rediriger vers le bon tableau de bord selon le rôle
        if (user.role === 'professionnel') {
            return res.render('appointments-professional', {
                title: 'Tableau de bord Professionnel',
                user: {
                    userId: user._id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email,
                    role: user.role
                }
            });
        }

        res.render('appointments-client', { 
            title: 'Tableau de bord',
            user: {
                userId: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Erreur dashboard:', error);
        res.clearCookie('token');
        return res.redirect('/login');
    }
});

// Page des rendez-vous client (protégée)
router.get('/appointments', async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        
        if (!user) {
            res.clearCookie('token');
            return res.redirect('/login');
        }

        if (user.role !== 'client') {
            return res.redirect('/dashboard');
        }

        res.render('appointments-client', {
            title: 'Mes Rendez-vous',
            user: {
                userId: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Erreur rendez-vous:', error);
        res.clearCookie('token');
        return res.redirect('/login');
    }
});

// Page des rendez-vous professionnel (protégée)
router.get('/appointments-professional', async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        
        if (!user) {
            res.clearCookie('token');
            return res.redirect('/login');
        }

        if (user.role !== 'professionnel') {
            return res.redirect('/dashboard');
        }

        res.render('appointments-professional', {
            title: 'Gestion des Rendez-vous',
            user: {
                userId: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Erreur rendez-vous professionnel:', error);
        res.clearCookie('token');
        return res.redirect('/login');
    }
});

// Déconnexion
router.get('/logout', (req, res) => {
    res.clearCookie('token');
    res.redirect('/login');
});

module.exports = router;
