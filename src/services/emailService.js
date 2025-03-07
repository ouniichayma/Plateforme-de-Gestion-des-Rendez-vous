require('dotenv').config();
const nodemailer = require('nodemailer');

// Création d'un transporteur d'e-mails avec les paramètres SMTP
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: false, // false = utilise STARTTLS
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

// Fonction pour envoyer un e-mail
const sendEmail = async (to, subject, text) => {
    try {
        const info = await transporter.sendMail({
            from: `"Service Rendez-vous" <${process.env.SMTP_USER}>`,
            to,
            subject,
            text
        });
        console.log("📧 Email envoyé: " + info.response);
    } catch (error) {
        console.error("❌ Erreur envoi email:", error);
    }
};

module.exports = { sendEmail };
