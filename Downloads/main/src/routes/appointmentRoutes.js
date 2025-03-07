const express = require("express");
const router = express.Router();
const jwt = require('jsonwebtoken');
const Appointment = require('../models/Appointment');
const User = require('../models/User');

// Middleware d'authentification
const authMiddleware = async (req, res, next) => {
    const token = req.cookies.token;
    if (!token) {
        return res.status(401).json({ message: 'Non authentifié' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Token invalide' });
    }
};

// Routes pour les rendez-vous
router.post('/', authMiddleware, async (req, res) => {
    try {
        // Vérifier si l'utilisateur est un client
        if (req.user.role !== 'client') {
            return res.status(403).json({ message: 'Seuls les clients peuvent prendre des rendez-vous' });
        }

        const { professionalId, date, time, reason } = req.body;

        // Vérifier si le professionnel existe
        const professional = await User.findById(professionalId);
        if (!professional || professional.role !== 'professionnel') {
            return res.status(400).json({ message: 'Professionnel non trouvé' });
        }

        // Créer le rendez-vous
        const appointment = new Appointment({
            client: req.user.userId,
            professional: professionalId,
            date: new Date(date),
            time,
            reason,
            status: 'pending'
        });

        await appointment.save();
        res.status(201).json({ message: 'Rendez-vous créé avec succès' });
    } catch (error) {
        console.error('Erreur lors de la création du rendez-vous:', error);
        res.status(500).json({ message: 'Erreur lors de la création du rendez-vous' });
    }
});

// Route pour obtenir les rendez-vous d'un utilisateur
router.get('/my-appointments', authMiddleware, async (req, res) => {
    try {
        let appointments;
        const query = req.user.role === 'client' 
            ? { client: req.user.userId }
            : { professional: req.user.userId };

        appointments = await Appointment.find(query)
            .populate('client', 'firstName lastName')
            .populate('professional', 'firstName lastName')
            .sort({ date: 1, time: 1 });

        res.json(appointments);
    } catch (error) {
        console.error('Erreur lors de la récupération des rendez-vous:', error);
        res.status(500).json({ message: 'Erreur lors de la récupération des rendez-vous' });
    }
});

// Route pour les professionnels - gérer les disponibilités
router.post('/availability', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'professionnel') {
            return res.status(403).json({ message: 'Accès non autorisé' });
        }

        // TODO: Implémenter la gestion des disponibilités avec un nouveau modèle Availability
        res.status(201).json({ message: 'Disponibilités mises à jour avec succès' });
    } catch (error) {
        console.error('Erreur lors de la mise à jour des disponibilités:', error);
        res.status(500).json({ message: 'Erreur lors de la mise à jour des disponibilités' });
    }
});

// Route pour les professionnels - voir leurs rendez-vous
router.get('/professional-appointments', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'professionnel') {
            return res.status(403).json({ message: 'Accès non autorisé' });
        }

        const appointments = await Appointment.find({ professional: req.user.userId })
            .populate('client', 'firstName lastName')
            .sort({ date: 1, time: 1 });

        res.json(appointments);
    } catch (error) {
        console.error('Erreur:', error);
        res.status(500).json({ message: 'Erreur lors de la récupération des rendez-vous' });
    }
});

// Route pour l'admin - voir tous les rendez-vous
router.get('/all', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Accès non autorisé' });
        }

        const appointments = await Appointment.find()
            .populate('client', 'firstName lastName')
            .populate('professional', 'firstName lastName')
            .sort({ date: 1, time: 1 });

        res.json(appointments);
    } catch (error) {
        console.error('Erreur:', error);
        res.status(500).json({ message: 'Erreur lors de la récupération des rendez-vous' });
    }
});

// Route pour annuler un rendez-vous
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const appointment = await Appointment.findById(req.params.id);
        if (!appointment) {
            return res.status(404).json({ message: 'Rendez-vous non trouvé' });
        }

        // Vérifier que l'utilisateur a le droit d'annuler ce rendez-vous
        if (req.user.role === 'client' && appointment.client.toString() !== req.user.userId) {
            return res.status(403).json({ message: 'Vous n\'avez pas le droit d\'annuler ce rendez-vous' });
        }

        if (req.user.role === 'professionnel' && appointment.professional.toString() !== req.user.userId) {
            return res.status(403).json({ message: 'Vous n\'avez pas le droit d\'annuler ce rendez-vous' });
        }

        appointment.status = 'cancelled';
        await appointment.save();

        res.json({ message: 'Rendez-vous annulé avec succès' });
    } catch (error) {
        console.error('Erreur:', error);
        res.status(500).json({ message: 'Erreur lors de l\'annulation du rendez-vous' });
    }
});

// Route pour accepter/refuser un rendez-vous (pour les professionnels)
router.put('/:id/:action', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'professionnel') {
            return res.status(403).json({ message: 'Accès non autorisé' });
        }

        const { action } = req.params;
        if (!['accept', 'reject'].includes(action)) {
            return res.status(400).json({ message: 'Action non valide' });
        }

        const appointment = await Appointment.findById(req.params.id);
        if (!appointment) {
            return res.status(404).json({ message: 'Rendez-vous non trouvé' });
        }

        if (appointment.professional.toString() !== req.user.userId) {
            return res.status(403).json({ message: 'Vous n\'avez pas le droit de modifier ce rendez-vous' });
        }

        appointment.status = action === 'accept' ? 'accepted' : 'rejected';
        await appointment.save();

        res.json({ message: `Rendez-vous ${action === 'accept' ? 'accepté' : 'refusé'} avec succès` });
    } catch (error) {
        console.error('Erreur:', error);
        res.status(500).json({ message: 'Erreur lors du traitement de la demande' });
    }
});

module.exports = router;
