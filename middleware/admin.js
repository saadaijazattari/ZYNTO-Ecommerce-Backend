// middleware/admin.js - Admin check karne ke liye

module.exports = (req, res, next) => {
    // Agar user admin nahi hai to error do
    if (!req.userIsAdmin) {
        return res.status(403).json({ 
            success: false, 
            message: 'Access denied. Admin only.' 
        });
    }
    
    next(); // Admin hai to aage jao
};