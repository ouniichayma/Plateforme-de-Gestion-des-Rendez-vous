const cron = require('node-cron');
const { sendEmail } = require('./emailService');

const Appointment= require('../models/appointmentModel');

// Exécuter toutes les heures
cron.schedule('0 * * * *', async () => {
    console.log("🔔 Vérification des rendez-vous pour les rappels...");

    const now = new Date();
    const nextHour = new Date(now.getTime() + (60 * 60 * 1000)); // +1 heure

    try {
        // Chercher les rendez-vous qui ont lieu dans l'heure qui suit
        const upcomingAppointments = await Appointment.find({ 
            date: { $gte: now, $lte: nextHour } 
        });

        // Envoyer un rappel pour chaque rendez-vous trouvé
        for (const appointment of upcomingAppointments) {
            await sendEmail(appointment.client.email, "Rappel de rendez-vous",
                `Bonjour, ceci est un rappel pour votre rendez-vous prévu à ${appointment.date}.`
            );
            console.log(`📧 Rappel envoyé à ${appointment.client.email}`);
        }
    } catch (error) {
        console.error("❌ Erreur envoi rappel:", error);
    }
});
