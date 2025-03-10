const Appointment = require("../models/appointmentModel");







const User = require("../models/User"); // Assure-toi d'importer le modèle User
const { sendEmail } = require("../services/emailService"); // Assure-toi d'avoir un fichier pour envoyer les emails







// 📌 Créer un rendez-vous
exports.createAppointment = async (req, res) => {
  try {
    const { professional, date } = req.body;
    const clientId = req.user.id;

    // Récupérer l'email du client
    const client = await User.findById(clientId);
    if (!client) {
      return res.status(404).json({ message: "Client introuvable" });
    }

    const appointment = new Appointment({
      client: clientId,
      professional,
      date,
      status: "pending",
    });

    await appointment.save();

    // Récupérer les infos du professionnel
    const professionalUser = await User.findById(professional);
    const professionalName = professionalUser ? professionalUser.firstName + " " + professionalUser.lastName : "le professionnel";

    // Envoi d'un e-mail de confirmation au client
    await sendEmail(
      client.email,  // Récupère correctement l'email du client
      "Confirmation de rendez-vous",
      `Bonjour ${client.firstName},\n\nVotre rendez-vous avec ${professionalName} est creer pour le ${new Date(date).toLocaleString()}.\n\nMerci!`
    );

    res.status(201).json(appointment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// 📌 Récupérer les rendez-vous d'un utilisateur
exports.getAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find({ client: req.user.id }).populate("professional", "name email");
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 📌 Modifier un rendez-vous
exports.updateAppointment = async (req, res) => {
  try {
    const { status } = req.body;
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) return res.status(404).json({ message: "Rendez-vous introuvable" });

    // Seul le client ou le professionnel peut modifier
    if (appointment.client.toString() !== req.user.id && appointment.professional.toString() !== req.user.id) {
      return res.status(403).json({ message: "Accès refusé" });
    }

    appointment.status = status;
    await appointment.save();
    res.json(appointment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 📌 Supprimer un rendez-vous
exports.deleteAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) return res.status(404).json({ message: "Rendez-vous introuvable" });

    // Seul le client peut annuler son rendez-vous
    if (appointment.client.toString() !== req.user.id) {
      return res.status(403).json({ message: "Accès refusé" });
    }

    await appointment.deleteOne();
    res.json({ message: "Rendez-vous annulé" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};




















// 📌 Mettre à jour le statut d’un rendez-vous
exports.updateAppointmentStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const appointmentId = req.params.id;

    // Vérifier si le rendez-vous existe
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({ message: "Rendez-vous introuvable" });
    }

    // Mettre à jour le statut
    appointment.status = status;
    await appointment.save();

    // Récupérer les infos du client
    const client = await User.findById(appointment.client);
    if (!client) {
      return res.status(404).json({ message: "Client introuvable" });
    }

    // Construire le message de l'email
    let emailSubject = "Mise à jour de votre rendez-vous";
    let emailBody = `Bonjour ${client.firstName},\n\nVotre rendez-vous du ${new Date(
      appointment.date
    ).toLocaleString()} a été mis à jour avec le statut : **${status}**.\n\nMerci !`;


    await sendEmail(
      client.email,  // Récupère correctement l'email du client
      emailSubject,
      emailBody
    );


    console.log(`📩 E-mail de statut envoyé à ${client.email}`);

    res.status(200).json({ message: "Statut mis à jour et e-mail envoyé", appointment });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};