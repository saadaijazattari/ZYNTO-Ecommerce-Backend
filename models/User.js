// models/User.js - COMPLETELY NEW FILE

const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: 6
    },
    role: {
        type: String,
        enum: ['user', 'admin', 'vendor'],
        default: 'user'
    },
    isAdmin: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// ❌ KOI MIDDLEWARE NAHI - Direct export
module.exports = mongoose.model('User', userSchema);



// 123456drvfer45t45 *gewurf435m%hwws;decp[fkewfj"""""""",als,axZ