const express = require("express");
const { createAppointment, getAppointments, updateAppointment, deleteAppointment, updateAppointmentStatus } = require("../controllers/appointmentController");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

const router = express.Router();

router.post("/", authMiddleware, roleMiddleware(["client"]), createAppointment);
router.get("/", authMiddleware, getAppointments);
router.put("/:id", authMiddleware, updateAppointment);
router.delete("/:id", authMiddleware, deleteAppointment);
// Route pour mettre à jour le statut d’un rendez-vous
router.put("/:id/status",updateAppointmentStatus);

module.exports = router;
