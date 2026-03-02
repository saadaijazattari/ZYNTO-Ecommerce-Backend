// controllers/productController.js - COMPLETE with all functions

const Product = require('../models/Product');
const User = require('../models/User');
const fs = require('fs');
const path = require('path');

// @desc    Create new product with image
// @route   POST /api/products
// @access  Private (Vendor/Admin)
exports.createProduct = async (req, res) => {
    try {
        const { name, description, price, stock, category } = req.body;

        if (!name || !description || !price || stock === undefined) {
            return res.status(400).json({
                success: false,
                message: 'Please provide all required fields'
            });
        }

        const user = await User.findById(req.userId);

        // 🔥 CLOUDINARY MAGIC - req.file.path me Cloudinary URL aayega
        let imagePath = 'https://via.placeholder.com/300x300?text=No+Image';
        
        if (req.file) {
            imagePath = req.file.path;  // Cloudinary ka URL!
        }

        const product = await Product.create({
            name,
            description,
            price: Number(price),
            stock: Number(stock),
            image: imagePath,
            category: category || 'General',
            addedBy: req.userId,
            addedByName: user.name
        });

        res.status(201).json({
            success: true,
            message: 'Product created successfully',
            product
        });

    } catch (error) {
        console.error('Create product error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Get all products
// @route   GET /api/products
// @access  Public
exports.getAllProducts = async (req, res) => {
    try {
        const products = await Product.find()
            .populate('addedBy', 'name email')
            .sort('-createdAt');

        res.json({
            success: true,
            count: products.length,
            products
        });

    } catch (error) {
        console.error('Get all products error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Get single product by ID
// @route   GET /api/products/:id
// @access  Public
exports.getProductById = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id)
            .populate('addedBy', 'name email');

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        res.json({
            success: true,
            product
        });

    } catch (error) {
        console.error('Get product by id error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Get products added by logged in vendor
// @route   GET /api/products/myproducts/all
// @access  Private (Vendor)
exports.getMyProducts = async (req, res) => {
    try {
        const products = await Product.find({ addedBy: req.userId })
            .sort('-createdAt');

        res.json({
            success: true,
            count: products.length,
            products
        });

    } catch (error) {
        console.error('Get my products error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Update product with image
// @route   PUT /api/products/:id
// @access  Private (Vendor who added it or Admin)
exports.updateProduct = async (req, res) => {
    try {
        let product = await Product.findById(req.params.id);

        if (!product) {
            // Delete uploaded file if product not found
            if (req.file) {
                fs.unlinkSync(req.file.path);
            }
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        // Check if user is authorized to update
        if (product.addedBy.toString() !== req.userId && !req.userIsAdmin) {
            // Delete uploaded file if not authorized
            if (req.file) {
                fs.unlinkSync(req.file.path);
            }
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update this product'
            });
        }

        // Prepare update data
        const updateData = { ...req.body };
        
        // Handle price and stock as numbers
        if (updateData.price) updateData.price = Number(updateData.price);
        if (updateData.stock) updateData.stock = Number(updateData.stock);

        // Handle image update
        if (req.file) {
            // Delete old image if it's not the default
            if (product.image && !product.image.includes('placeholder')) {
                const oldImagePath = path.join(__dirname, '..', 'uploads', path.basename(product.image));
                if (fs.existsSync(oldImagePath)) {
                    fs.unlinkSync(oldImagePath);
                }
            }
            
            // Set new image URL
            const baseUrl = `${req.protocol}://${req.get('host')}`;
            updateData.image = `${baseUrl}/uploads/${req.file.filename}`;
        }

        // Update product
        product = await Product.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        );

        res.json({
            success: true,
            message: 'Product updated successfully',
            product
        });

    } catch (error) {
        // Delete uploaded file if error occurs
        if (req.file) {
            fs.unlinkSync(req.file.path);
        }
        console.error('Update product error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private (Vendor who added it or Admin)
exports.deleteProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        // Check if user is authorized to delete
        if (product.addedBy.toString() !== req.userId && !req.userIsAdmin) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to delete this product'
            });
        }

        // Delete product image from server if it's not default
        if (product.image && !product.image.includes('placeholder')) {
            const imagePath = path.join(__dirname, '..', 'uploads', path.basename(product.image));
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
            }
        }

        await product.deleteOne();

        res.json({
            success: true,
            message: 'Product deleted successfully'
        });

    } catch (error) {
        console.error('Delete product error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};