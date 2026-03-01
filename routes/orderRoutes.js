// routes/orderRoutes.js - Updated with all routes

const express = require('express');
const router = express.Router();
const {
    createOrder,
    getMyOrders,
    getAllOrders,
    updateOrderStatus,
    getSellerOrders,
    getSellerStats,
    markSellerNotificationsAsRead,
    markAllNotificationsAsRead
} = require('../controllers/orderController');
const authMiddleware = require('../middleware/auth');
const { isAdmin, isVendor } = require('../middleware/role');

// Protected routes (any authenticated user)
router.post('/', authMiddleware, createOrder);
router.get('/myorders', authMiddleware, getMyOrders);

// Seller routes (vendors and admins)
router.get('/seller/orders', authMiddleware, isVendor, getSellerOrders);
router.get('/seller/stats', authMiddleware, isVendor, getSellerStats);
router.put('/seller/notifications/read', authMiddleware, isVendor, markSellerNotificationsAsRead);
router.put('/seller/notifications/read-all', authMiddleware, isVendor, markAllNotificationsAsRead);

// Admin routes
router.get('/', authMiddleware, isAdmin, getAllOrders);
router.put('/:id/status', authMiddleware, isAdmin, updateOrderStatus);

module.exports = router;