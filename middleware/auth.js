// middleware/auth.js - Updated with role

const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    // Token header se lelo
    const token = req.header('x-auth-token');
    
    // Agar token nahi hai to error do
    if (!token) {
        return res.status(401).json({ 
            success: false, 
            message: 'No token, authorization denied' 
        });
    }
    
    try {
        // Token verify karo
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // User info request mein add karo
        req.userId = decoded.userId;
        req.userIsAdmin = decoded.isAdmin;
        req.userRole = decoded.role;  // role bhi add karo
        
        next();
    } catch (error) {
        res.status(401).json({ 
            success: false, 
            message: 'Token is not valid' 
        });
    }
};