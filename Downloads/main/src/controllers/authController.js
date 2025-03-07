const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.register = async (req, res) => {
    try {
        const { firstName, lastName, email, password, role } = req.body;

        // Vérifier si l'utilisateur existe déjà
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'Cet email est déjà utilisé' });
        }

        // Hasher le mot de passe
        const hashedPassword = await bcrypt.hash(password, 10);

        // Créer un nouvel utilisateur
        const user = new User({
            firstName,
            lastName,
            email,
            password: hashedPassword,
            role: role || 'client' // Par défaut, le rôle est 'client'
        });

        await user.save();

        res.status(201).json({ message: 'Utilisateur créé avec succès' });
    } catch (error) {
        console.error('Erreur lors de l\'inscription:', error);
        res.status(500).json({ message: 'Erreur lors de l\'inscription' });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Vérifier si l'utilisateur existe
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
        }

        // Vérifier le mot de passe
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
        }

        // Supprimer l'ancien cookie s'il existe
        res.clearCookie('token');

        // Créer un nouveau token
        const token = jwt.sign(
            { 
                userId: user._id,
                role: user.role,
                firstName: user.firstName,
                lastName: user.lastName
            }, 
            process.env.JWT_SECRET,
            { expiresIn: "24h" }
        );

        // Définir le cookie avec le token
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 24 * 60 * 60 * 1000 // 24 heures
        });

        // Envoyer la réponse
        res.json({ 
            message: 'Connexion réussie',
            user: {
                id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Erreur lors de la connexion:', error);
        res.status(500).json({ message: 'Erreur lors de la connexion' });
    }
};

exports.logout = (req, res) => {
    res.clearCookie('token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000
    });
    res.json({ message: 'Déconnexion réussie' });
};
