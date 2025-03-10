const mongoose = require("mongoose");
require("dotenv").config();

mongoose
  .connect(process.env.MONGO_URI || 'mongodb://localhost:27017/appointment-system', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    autoIndex: true
  })
  .then(() => {
    console.log('✅ Connecté à MongoDB avec succès');
  })
  .catch((err) => {
    console.error('❌ Erreur de connexion à MongoDB:', err);
    process.exit(1);
  });

// Gestion des événements de connexion
mongoose.connection.on('connected', () => {
  console.log('🔄 Mongoose connecté à MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ Erreur de connexion Mongoose:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('🔌 Mongoose déconnecté de MongoDB');
});

// Gestion propre de la fermeture
process.on('SIGINT', async () => {
  try {
    await mongoose.connection.close();
    console.log('🛑 Connexion MongoDB fermée suite à l\'arrêt de l\'application');
    process.exit(0);
  } catch (err) {
    console.error('❌ Erreur lors de la fermeture de la connexion:', err);
    process.exit(1);
  }
});

module.exports = mongoose;
