const express = require('express');
const router = express.Router();
const Appointment = require('../models/Appointment');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Middleware d'authentification
const authMiddleware = async (req, res, next) => {
    try {
        const token = req.cookies.token;
        if (!token) {
            return res.status(401).json({ success: false, message: 'Non authentifié' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Vérifier que l'utilisateur existe toujours dans la base de données
        const user = await User.findById(decoded.userId);
        if (!user) {
            res.clearCookie('token');
            return res.status(401).json({ success: false, message: 'Utilisateur non trouvé' });
        }

        // Vérifier que le rôle de l'utilisateur n'a pas changé
        if (user.role !== decoded.role) {
            res.clearCookie('token');
            return res.status(401).json({ success: false, message: 'Session invalide' });
        }

        // Stocker les informations de l'utilisateur dans req.user
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
        res.status(401).json({ success: false, message: 'Token invalide' });
    }
};

// Obtenir la liste des professionnels
router.get('/professionals', authMiddleware, async (req, res) => {
    try {
        const professionals = await User.find({ role: 'professionnel' })
            .select('firstName lastName email _id');
        res.json(professionals);
    } catch (error) {
        console.error('Erreur:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Erreur lors de la récupération des professionnels' 
        });
    }
});

// Créer un rendez-vous
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { professionalId, date, time, reason } = req.body;
        
        // Vérifier que tous les champs requis sont présents
        if (!professionalId || !date || !time || !reason) {
            return res.status(400).json({ 
                success: false, 
                message: 'Tous les champs sont requis' 
            });
        }

        // Vérifier que le professionnel existe
        const professional = await User.findById(professionalId);
        if (!professional || professional.role !== 'professionnel') {
            return res.status(404).json({
                success: false,
                message: 'Professionnel non trouvé'
            });
        }

        // Vérifier que la date est dans le futur
        const appointmentDate = new Date(date + 'T' + time);
        if (appointmentDate < new Date()) {
            return res.status(400).json({
                success: false,
                message: 'La date du rendez-vous doit être dans le futur'
            });
        }

        // Vérifier si le créneau est disponible
        const existingAppointment = await Appointment.findOne({
            professional: professionalId,
            date: date,
            time: time,
            status: { $in: ['pending', 'accepted'] }
        });

        if (existingAppointment) {
            return res.status(400).json({
                success: false,
                message: 'Ce créneau n\'est pas disponible'
            });
        }

        const appointment = new Appointment({
            client: req.user._id,
            professional: professionalId,
            date,
            time,
            reason,
            status: 'pending'
        });

        await appointment.save();

        // Récupérer le rendez-vous avec les informations du professionnel
        const populatedAppointment = await Appointment.findById(appointment._id)
            .populate('professional', 'firstName lastName email')
            .populate('client', 'firstName lastName email');

        res.status(201).json({ 
            success: true, 
            message: 'Rendez-vous créé avec succès',
            appointment: populatedAppointment
        });
    } catch (error) {
        console.error('Erreur:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Erreur lors de la création du rendez-vous',
            error: error.message
        });
    }
});

// Obtenir mes rendez-vous
router.get('/my-appointments', authMiddleware, async (req, res) => {
    try {
        let appointments;
        
        if (req.user.role === 'client') {
            appointments = await Appointment.find({ client: req.user._id })
                .populate('professional', 'firstName lastName email')
                .sort({ date: 1, time: 1 });
        } else if (req.user.role === 'professionnel') {
            appointments = await Appointment.find({ professional: req.user._id })
                .populate('client', 'firstName lastName email')
                .sort({ date: 1, time: 1 });
        }

        res.json(appointments);
    } catch (error) {
        console.error('Erreur:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Erreur lors de la récupération des rendez-vous' 
        });
    }
});

// Mettre à jour le statut d'un rendez-vous
router.put('/:id/status', authMiddleware, async (req, res) => {
    try {
        const { status } = req.body;
        
        if (!['accepted', 'rejected'].includes(status)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Statut invalide' 
            });
        }

        const appointment = await Appointment.findById(req.params.id);
        
        if (!appointment) {
            return res.status(404).json({ 
                success: false, 
                message: 'Rendez-vous non trouvé' 
            });
        }

        if (req.user.role !== 'professionnel' || 
            appointment.professional.toString() !== req.user._id.toString()) {
            return res.status(403).json({ 
                success: false, 
                message: 'Non autorisé' 
            });
        }

        appointment.status = status;
        await appointment.save();

        const updatedAppointment = await Appointment.findById(appointment._id)
            .populate('professional', 'firstName lastName email')
            .populate('client', 'firstName lastName email');

        res.json({ 
            success: true, 
            message: `Rendez-vous ${status === 'accepted' ? 'accepté' : 'refusé'} avec succès`,
            appointment: updatedAppointment
        });
    } catch (error) {
        console.error('Erreur:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Erreur lors de la mise à jour du rendez-vous' 
        });
    }
});

// Accepter un rendez-vous
router.put('/:id/accepted', authMiddleware, async (req, res) => {
    try {
        const appointment = await Appointment.findById(req.params.id);
        
        if (!appointment) {
            return res.status(404).json({ 
                success: false, 
                message: 'Rendez-vous non trouvé' 
            });
        }

        if (req.user.role !== 'professionnel' || 
            appointment.professional.toString() !== req.user._id.toString()) {
            return res.status(403).json({ 
                success: false, 
                message: 'Non autorisé' 
            });
        }

        appointment.status = 'accepted';
        await appointment.save();

        const updatedAppointment = await Appointment.findById(appointment._id)
            .populate('professional', 'firstName lastName email')
            .populate('client', 'firstName lastName email');

        res.json({ 
            success: true, 
            message: 'Rendez-vous accepté',
            appointment: updatedAppointment
        });
    } catch (error) {
        console.error('Erreur:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Erreur lors de la mise à jour du rendez-vous' 
        });
    }
});

// Refuser un rendez-vous
router.put('/:id/rejected', authMiddleware, async (req, res) => {
    try {
        const appointment = await Appointment.findById(req.params.id);
        
        if (!appointment) {
            return res.status(404).json({ 
                success: false, 
                message: 'Rendez-vous non trouvé' 
            });
        }

        if (req.user.role !== 'professionnel' || 
            appointment.professional.toString() !== req.user._id.toString()) {
            return res.status(403).json({ 
                success: false, 
                message: 'Non autorisé' 
            });
        }

        appointment.status = 'rejected';
        await appointment.save();

        const updatedAppointment = await Appointment.findById(appointment._id)
            .populate('professional', 'firstName lastName email')
            .populate('client', 'firstName lastName email');

        res.json({ 
            success: true, 
            message: 'Rendez-vous refusé',
            appointment: updatedAppointment
        });
    } catch (error) {
        console.error('Erreur:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Erreur lors de la mise à jour du rendez-vous' 
        });
    }
});

// Annuler un rendez-vous
router.put('/:id/cancel', authMiddleware, async (req, res) => {
    try {
        const appointment = await Appointment.findById(req.params.id);
        
        if (!appointment) {
            return res.status(404).json({ 
                success: false, 
                message: 'Rendez-vous non trouvé' 
            });
        }

        // Vérifier que c'est bien le client qui annule son propre rendez-vous
        if (appointment.client.toString() !== req.user._id.toString()) {
            return res.status(403).json({ 
                success: false, 
                message: 'Non autorisé' 
            });
        }

        // Vérifier que le rendez-vous peut être annulé
        if (!['pending', 'accepted'].includes(appointment.status)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Ce rendez-vous ne peut pas être annulé' 
            });
        }

        appointment.status = 'cancelled';
        await appointment.save();

        const updatedAppointment = await Appointment.findById(appointment._id)
            .populate('professional', 'firstName lastName email')
            .populate('client', 'firstName lastName email');

        res.json({ 
            success: true, 
            message: 'Rendez-vous annulé avec succès',
            appointment: updatedAppointment
        });
    } catch (error) {
        console.error('Erreur:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Erreur lors de l\'annulation du rendez-vous' 
        });
    }
});

module.exports = router;
