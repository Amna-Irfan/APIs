const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
    phone: {
        type: String,
        required: true
    },
    otp: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now,
        index: {expires: 300}
    }
    //after 5 minutes, it will be deleted automatically from the database
},{ timestamps: true});

module.exports = mongoose.model('OTP', otpSchema);