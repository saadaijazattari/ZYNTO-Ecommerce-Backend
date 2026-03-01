// middleware/role.js - Role-based authorization

// Check if user is admin
exports.isAdmin = (req, res, next) => {
    if (req.userRole !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Admin only.'
        });
    }
    next();
};

// Check if user is vendor
exports.isVendor = (req, res, next) => {
    if (req.userRole !== 'vendor' && req.userRole !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Vendor or Admin only.'
        });
    }
    next();
};

// Check if user is admin or vendor
exports.isAdminOrVendor = (req, res, next) => {
    if (req.userRole !== 'admin' && req.userRole !== 'vendor') {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Admin or Vendor only.'
        });
    }
    next();
};

// Check specific role
exports.hasRole = (roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.userRole)) {
            return res.status(403).json({
                success: false,
                message: `Access denied. Required roles: ${roles.join(', ')}`
            });
        }
        next();
    };
};