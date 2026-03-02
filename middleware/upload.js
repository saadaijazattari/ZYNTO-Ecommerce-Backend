const multer = require('multer');
const { storage } = require('../config/cloudinary');

// File filter - sirf images
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Only image files are allowed!'), false);
    }
};

// Multer upload with Cloudinary storage
const upload = multer({
    storage: storage,           // Cloudinary storage use karo!
    limits: {
        fileSize: 5 * 1024 * 1024  // 5MB limit
    },
    fileFilter: fileFilter
});

module.exports = upload;