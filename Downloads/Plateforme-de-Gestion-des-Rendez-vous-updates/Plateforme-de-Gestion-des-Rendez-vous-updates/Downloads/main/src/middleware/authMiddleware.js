const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authMiddleware = async (req, res, next) => {
    try {
        const token = req.cookies.token;
        if (!token) {
            if (req.xhr || req.path.startsWith('/api/')) {
                return res.status(401).json({ message: 'Non authentifié' });
            }
            return res.redirect('/login');
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId);
        
        if (!user) {
            res.clearCookie('token');
            if (req.xhr || req.path.startsWith('/api/')) {
                return res.status(401).json({ message: 'Utilisateur non trouvé' });
            }
            return res.redirect('/login');
        }

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
        if (req.xhr || req.path.startsWith('/api/')) {
            return res.status(401).json({ message: 'Token invalide' });
        }
        return res.redirect('/login');
    }
};

module.exports = authMiddleware;
