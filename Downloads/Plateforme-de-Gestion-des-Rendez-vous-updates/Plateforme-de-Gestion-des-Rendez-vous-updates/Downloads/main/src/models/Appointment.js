const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
    client: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    professional: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    date: {
        type: String,
        required: true
    },
    time: {
        type: String,
        required: true
    },
    reason: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'rejected', 'cancelled'],
        default: 'pending'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Middleware to ensure date and time are properly formatted
appointmentSchema.pre('save', function(next) {
    // Validate date format (YYYY-MM-DD)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(this.date)) {
        next(new Error('Invalid date format. Use YYYY-MM-DD'));
    }
    
    // Validate time format (HH:mm)
    if (!/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(this.time)) {
        next(new Error('Invalid time format. Use HH:mm'));
    }
    
    next();
});

module.exports = mongoose.model('Appointment', appointmentSchema);
