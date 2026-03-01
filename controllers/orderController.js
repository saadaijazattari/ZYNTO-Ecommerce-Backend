// controllers/orderController.js - COMPLETELY FIXED

const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
exports.createOrder = async (req, res) => {
    try {
        const { items, totalAmount, paymentMethod, shippingAddress } = req.body;

        // Validate items
        if (!items || items.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No items in order'
            });
        }

        // Get user details for shipping
        const user = await User.findById(req.userId);
        
        // Prepare order items with seller info
        const orderItems = [];
        const sellerMap = new Map(); // To track unique sellers for notifications

        for (const item of items) {
            const product = await Product.findById(item.product);
            
            if (!product) {
                return res.status(404).json({
                    success: false,
                    message: `Product not found: ${item.product}`
                });
            }

            if (product.stock < item.quantity) {
                return res.status(400).json({
                    success: false,
                    message: `Insufficient stock for ${product.name}. Available: ${product.stock}`
                });
            }

            // Reduce stock
            product.stock -= item.quantity;
            await product.save();

            // Add to order items with seller info
            orderItems.push({
                product: product._id,
                productName: product.name,
                productImage: product.image,
                seller: product.addedBy,
                sellerName: product.addedByName,
                quantity: item.quantity,
                price: item.price
            });

            // Track unique sellers for notifications
            sellerMap.set(product.addedBy.toString(), {
                seller: product.addedBy,
                isRead: false
            });
        }

        // Create seller notifications array
        const sellerNotifications = Array.from(sellerMap.values());

        // Create order
        const order = await Order.create({
            user: req.userId,
            items: orderItems,
            totalAmount,
            paymentMethod: paymentMethod || 'COD',
            shippingAddress: shippingAddress || {
                fullName: user.name,
                email: user.email,
                phone: user.phone || 'Not provided'
            },
            orderStatus: 'Pending',
            paymentStatus: paymentMethod === 'COD' ? 'Pending' : 'Paid',
            sellerNotifications
        });

        // Populate order with details
        const populatedOrder = await Order.findById(order._id)
            .populate('user', 'name email phone')
            .populate('items.product', 'name image price');

        res.status(201).json({
            success: true,
            message: 'Order placed successfully',
            order: populatedOrder
        });

    } catch (error) {
        console.error('Create order error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Get orders for a specific seller
// @route   GET /api/orders/seller/orders
// @access  Private (Vendor/Admin)
exports.getSellerOrders = async (req, res) => {
    try {
        const sellerId = req.userId;

        // Find orders that contain items from this seller
        const orders = await Order.find({
            'items.seller': sellerId
        })
        .populate('user', 'name email phone')
        .populate('items.product', 'name image price')
        .sort('-createdAt');

        // Process orders to show only relevant items for this seller
        const processedOrders = orders.map(order => {
            const orderObj = order.toObject();
            
            // Filter items to show only this seller's products
            orderObj.items = orderObj.items.filter(item => 
                item.seller.toString() === sellerId.toString()
            );
            
            // Add customer info
            orderObj.customer = {
                id: order.user._id,
                name: order.user.name,
                email: order.user.email,
                phone: order.user.phone
            };

            return orderObj;
        });

        // Get unread count (without calling mark function)
        const unreadCount = await Order.countDocuments({
            'items.seller': sellerId,
            'sellerNotifications': {
                $elemMatch: {
                    seller: sellerId,
                    isRead: false
                }
            }
        });

        res.json({
            success: true,
            count: processedOrders.length,
            unreadCount,
            orders: processedOrders
        });

    } catch (error) {
        console.error('Get seller orders error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Mark seller notifications as read
// @route   PUT /api/orders/seller/notifications/read
// @access  Private (Vendor/Admin)
exports.markSellerNotificationsAsRead = async (req, res) => {
    try {
        const sellerId = req.userId;
        const { orderId } = req.body || {};  // ✅ Fixed: Handle undefined req.body

        if (!orderId) {
            return res.status(400).json({
                success: false,
                message: 'Order ID is required'
            });
        }

        // Mark specific order as read
        await Order.updateOne(
            { 
                _id: orderId,
                'sellerNotifications.seller': sellerId
            },
            {
                $set: {
                    'sellerNotifications.$[elem].isRead': true,
                    'sellerNotifications.$[elem].readAt': new Date()
                }
            },
            {
                arrayFilters: [{ 'elem.seller': sellerId }]
            }
        );

        res.json({
            success: true,
            message: 'Notification marked as read'
        });

    } catch (error) {
        console.error('Mark notifications error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Mark all notifications as read
// @route   PUT /api/orders/seller/notifications/read-all
// @access  Private (Vendor/Admin)
exports.markAllNotificationsAsRead = async (req, res) => {
    try {
        const sellerId = req.userId;

        // Mark all as read
        const orders = await Order.find({
            'items.seller': sellerId,
            'sellerNotifications': {
                $elemMatch: {
                    seller: sellerId,
                    isRead: false
                }
            }
        });

        for (const order of orders) {
            await Order.updateOne(
                { _id: order._id },
                {
                    $set: {
                        'sellerNotifications.$[elem].isRead': true,
                        'sellerNotifications.$[elem].readAt': new Date()
                    }
                },
                {
                    arrayFilters: [{ 'elem.seller': sellerId }]
                }
            );
        }

        res.json({
            success: true,
            message: 'All notifications marked as read'
        });

    } catch (error) {
        console.error('Mark all notifications error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Get seller dashboard stats
// @route   GET /api/orders/seller/stats
// @access  Private (Vendor/Admin)
exports.getSellerStats = async (req, res) => {
    try {
        const sellerId = req.userId;

        // Get all orders containing seller's products
        const orders = await Order.find({
            'items.seller': sellerId
        });

        // Calculate stats
        let totalRevenue = 0;
        let totalOrders = orders.length;
        let totalProductsSold = 0;
        let pendingOrders = 0;
        let deliveredOrders = 0;

        orders.forEach(order => {
            // Filter items for this seller
            const sellerItems = order.items.filter(item => 
                item.seller.toString() === sellerId.toString()
            );

            sellerItems.forEach(item => {
                totalRevenue += item.price * item.quantity;
                totalProductsSold += item.quantity;
            });

            // Count orders by status
            if (order.orderStatus === 'Pending') pendingOrders++;
            if (order.orderStatus === 'Delivered') deliveredOrders++;
        });

        // Get recent customers
        const recentCustomers = await Order.aggregate([
            { $match: { 'items.seller': sellerId } },
            { $sort: { createdAt: -1 } },
            { $group: {
                _id: '$user',
                lastOrderDate: { $first: '$createdAt' },
                totalSpent: { $sum: '$totalAmount' }
            }},
            { $lookup: {
                from: 'users',
                localField: '_id',
                foreignField: '_id',
                as: 'userDetails'
            }},
            { $unwind: '$userDetails' },
            { $limit: 5 }
        ]);

        res.json({
            success: true,
            stats: {
                totalRevenue,
                totalOrders,
                totalProductsSold,
                pendingOrders,
                deliveredOrders,
                averageOrderValue: totalOrders ? (totalRevenue / totalOrders).toFixed(2) : 0
            },
            recentCustomers: recentCustomers.map(c => ({
                id: c._id,
                name: c.userDetails.name,
                email: c.userDetails.email,
                lastOrderDate: c.lastOrderDate,
                totalSpent: c.totalSpent
            }))
        });

    } catch (error) {
        console.error('Get seller stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Get user orders
// @route   GET /api/orders/myorders
// @access  Private
exports.getMyOrders = async (req, res) => {
    try {
        const orders = await Order.find({ user: req.userId })
            .populate('items.product', 'name image price')
            .sort('-createdAt');

        res.json({
            success: true,
            count: orders.length,
            orders
        });

    } catch (error) {
        console.error('Get my orders error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Get all orders (Admin)
// @route   GET /api/orders
// @access  Private/Admin
exports.getAllOrders = async (req, res) => {
    try {
        const orders = await Order.find()
            .populate('user', 'name email')
            .populate('items.product', 'name image price')
            .sort('-createdAt');

        res.json({
            success: true,
            count: orders.length,
            orders
        });

    } catch (error) {
        console.error('Get all orders error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private/Admin
exports.updateOrderStatus = async (req, res) => {
    try {
        const { status } = req.body;

        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        order.orderStatus = status;
        await order.save();

        res.json({
            success: true,
            message: 'Order status updated',
            order
        });

    } catch (error) {
        console.error('Update order status error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};