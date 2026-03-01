// routes/productRoutes.js - Fixed Version

const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const {
    createProduct,
    getAllProducts,
    getProductById,
    updateProduct,
    deleteProduct,
    getMyProducts
} = require('../controllers/productController');
const authMiddleware = require('../middleware/auth');
const { isVendor, isAdmin } = require('../middleware/role');

// Public routes
router.get('/', getAllProducts);  // ✅ Function check: getAllProducts defined hai?
router.get('/:id', getProductById);  // ✅ Function check: getProductById defined hai?

// Protected routes
router.post(
    '/', 
    authMiddleware, 
    isVendor, 
    upload.single('image'),
    createProduct  // ✅ Function check: createProduct defined hai?
);

router.get(
    '/myproducts/all', 
    authMiddleware, 
    isVendor, 
    getMyProducts  // ✅ Function check: getMyProducts defined hai?
);

router.put(
    '/:id', 
    authMiddleware, 
    isVendor, 
    upload.single('image'),
    updateProduct  // ✅ Function check: updateProduct defined hai?
);

router.delete(
    '/:id', 
    authMiddleware, 
    isVendor, 
    deleteProduct  // ✅ Function check: deleteProduct defined hai?
);

module.exports = router;