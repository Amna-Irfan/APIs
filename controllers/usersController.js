const User = require('../models/User');
const OTP = require('../models/OTP');
const bcrypt = require('bcrypt');
const otpGenerator = require('otp-generator');
const { Vonage } = require('@vonage/server-sdk');

const signup = async (req, res) => {
    const { fullName, username, password, email, phone } = req.body;
    const REGEX_FULL_NAME = /^[a-zA-Z]+ [a-zA-Z]+$/;
    const REGEX_USER_NAME = /^[A-Za-z][A-Za-z0-9]+$/;
    const REGEX_PHONE = /^[+][9][2][3][0-9]{9}$/;
    // const REGEX_EMAIL = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/;

    // Confirm data
    if ( !fullName || !username || !password || !email || !phone) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    //validate data
    if(!REGEX_FULL_NAME.test(fullName)){
        return res.status(400).json({ message: 'Enter Valid Name' });
    }

    if(!REGEX_USER_NAME.test(username)){
        return res.status(400).json({ message: 'Enter Valid Username' });
    }

    if(password.includes(" ")){
        return res.status(400).json({ message: 'Enter Valid Password' });
    }

    if(!REGEX_PHONE.test(phone)){
        return res.status(400).json({ message: 'Enter Valid Phone Number' });
    }

    // if(!REGEX_EMAIL.test(email)){
    //     return res.status(400).json({ message: 'Enter Valid Email' });
    // }

    // Check for duplicate username
    const duplicateUsername = await User.findOne({ username }).lean().exec();

    if (duplicateUsername) {
        return res.status(409).json({ message: 'Duplicate Username' });
    }

    // Check for duplicate email
    const duplicateEmail = await User.findOne({ email }).lean().exec();

    if (duplicateEmail) {
        return res.status(409).json({ message: 'Duplicate Email' });
    }

    // Check for duplicate phone number
    const duplicatePhone = await User.findOne({ phone }).lean().exec();

    if (duplicatePhone) {
        return res.status(409).json({ message: 'Duplicate Phone Number' });
    }

    const Otp = otpGenerator.generate(6, {
        digits: true,
        lowerCaseAlphabets: false,
        upperCaseAlphabets: false,
        specialChars: false
    });

    console.log(Otp);

    const otp = new OTP({phone, otp: Otp});
    const salt = await bcrypt.genSalt(10);
    otp.otp = await bcrypt.hash(otp.otp, salt);
    const result = await otp.save();

    const vonage = new Vonage({
        apiKey: process.env.NEXMO_API_KEY,
        apiSecret: process.env.NEXMO_API_SECRET
    });

    const from = "Vonage APIs";
    // const to = +923213497381;
    const to = phone;
    const text = `Your OTP is ${Otp}`;

    async function sendSMS() {
        await vonage.sms.send({to, from, text})
            .then(()=>{
                return res.status(200).json({ message: 'OTP sent successfully' });
            })
            .catch(()=>{
                return res.status(400).json({ message: 'Error occured, OTP not sent' });
            });
    }

    sendSMS();
    
    // if(result){
    //     return res.status(200).json({ message: 'OTP sent successfully' });
    // } else {
    //     return res.status(400).json({ message: 'Error occured, OTP not sent' });
    // }
};

const verifyOtp = async (req, res) => {
    const { fullName, username, password, email, phone, otp } = req.body;
    const REGEX_FULL_NAME = /^[a-zA-Z]+ [a-zA-Z]+$/;
    const REGEX_USER_NAME = /^[A-Za-z][A-Za-z0-9]+$/;
    const REGEX_PHONE = /^[+][9][2][3][0-9]{9}$/;
    // const REGEX_EMAIL = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/;

    // Confirm data
    if ( !fullName || !username || !password || !email || !phone || !otp) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    //validate data
    if(!REGEX_FULL_NAME.test(fullName)){
        return res.status(400).json({ message: 'Enter Valid Name' });
    }

    if(!REGEX_USER_NAME.test(username)){
        return res.status(400).json({ message: 'Enter Valid Username' });
    }

    if(password.includes(" ")){
        return res.status(400).json({ message: 'Enter Valid Password' });
    }

    if(!REGEX_PHONE.test(phone)){
        return res.status(400).json({ message: 'Enter Valid Phone Number' });
    }

    // if(!REGEX_EMAIL.test(email)){
    //     return res.status(400).json({ message: 'Enter Valid Email' });
    // }

    // Check for duplicate username
    const duplicateUsername = await User.findOne({ username }).lean().exec();

    if (duplicateUsername) {
        return res.status(409).json({ message: 'Duplicate Username' });
    }

    // Check for duplicate email
    const duplicateEmail = await User.findOne({ email }).lean().exec();

    if (duplicateEmail) {
        return res.status(409).json({ message: 'Duplicate Email' });
    }

    // Check for duplicate phone number
    const duplicatePhone = await User.findOne({ phone }).lean().exec();

    if (duplicatePhone) {
        return res.status(409).json({ message: 'Duplicate Phone Number' });
    }

    const otpHolder = await OTP.find({ phone }).lean().exec();

    if(!otpHolder?.length) {
        return res.status(400).json({ message: 'No OTP fo this phone number' });
    }
    
    //last one
    const Otp = otpHolder[otpHolder.length - 1];

    const validUser = await bcrypt.compare(otp, Otp.otp);

    if(!validUser){
        return res.status(400).json({ message: 'Invalid OTP' });
    }

    // Hash password 
    const hashedPwd = await bcrypt.hash(password, 10); // salt rounds, cost factor, how much time is needed to calculate a single bcrypt hash

    const userObject = { fullName, username, "password": hashedPwd, email, phone};

    // Create and store new user 
    const user = await User.create(userObject);

    if (user) { //created 
        const OtpDelete = await OTP.deleteMany({phone});
        return res.status(201).json({ message: `New user ${username} created` });
    } else {
        return res.status(400).json({ message: 'Invalid user data received' });
    }
};

const getUser = async (req, res) => {
    const { id } = req.body;

    // Confirm data
    if ( !id ) {
        return res.status(400).json({ message: 'ID is required' });
    }

    // Does the user exist?
    const user = await User.findById(id).select('-password').exec();

    if (!user) {
        return res.status(400).json({ message: 'User not found' });
    } else {
        return res.status(200).json(user);
    }
};

const updateUserInfo = async (req, res) => {
    const { id, fullName, username, email, phone, active } = req.body;
    const REGEX_FULL_NAME = /^[a-zA-Z]+ [a-zA-Z]+$/;
    const REGEX_USER_NAME = /^[A-Za-z][A-Za-z0-9]+$/;
    const REGEX_PHONE = /^[0][3][0-9]{9}$/;
    // const REGEX_EMAIL = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/;

    // Confirm data
    if ( !id || !fullName || !username || !email || !phone || typeof active !== 'boolean' ) {
        return res.status(400).json({ message: 'All fields are required, except password' });
    }

    //validate data
    if(!REGEX_FULL_NAME.test(fullName)){
        return res.status(400).json({ message: 'Enter Valid Name' });
    }

    if(!REGEX_USER_NAME.test(username)){
        return res.status(400).json({ message: 'Enter Valid Username' });
    }

    if(!REGEX_PHONE.test(phone)){
        return res.status(400).json({ message: 'Enter Valid Phone Number' });
    }

    // if(!REGEX_EMAIL.test(email)){
    //     return res.status(400).json({ message: 'Enter Valid Email' });
    // }

    // Does the user exist to update?
    const user = await User.findById(id).exec();

    if (!user) {
        return res.status(400).json({ message: 'User not found' });
    }

    // Check for duplicate username
    const duplicateUsername = await User.findOne({ username }).lean().exec();

    // Allow updates to the original user 
    if (duplicateUsername && duplicateUsername?._id.toString() !== id) {
        return res.status(409).json({ message: 'Duplicate Username' });
    }

    // Check for duplicate email
    const duplicateEmail = await User.findOne({ email }).lean().exec();

    // Allow updates to the original user 
    if (duplicateEmail && duplicateEmail?._id.toString() !== id) {
        return res.status(409).json({ message: 'Duplicate Email' });
    }

    // Check for duplicate phone
    const duplicatePhone = await User.findOne({ phone }).lean().exec();

    // Allow updates to the original user 
    if (duplicatePhone && duplicatePhone?._id.toString() !== id) {
        return res.status(409).json({ message: 'Duplicate Phone Number' });
    }

    user.fullName = fullName;
    user.username = username;
    user.email = email;
    user.phone = phone;
    user.active = active;

    const updatedUser = await user.save();

    res.json({ message: `${updatedUser.username} updated` });
};

const resetPassword = async (req, res) => {
    const { id, old_password, new_password } = req.body;

    // Confirm data 
    if (!id || !old_password || !new_password) {
        return res.status(400).json({ message: 'ID and Old & New Passwords Required' });
    }

    //validate data
    if(old_password.includes(" ")){
        return res.status(400).json({ message: 'Enter Valid Old Password' });
    }

    if(new_password.includes(" ")){
        return res.status(400).json({ message: 'Enter Valid New Password' });
    }

    // Does the user exist to update?
    const user = await User.findById(id).exec();

    if (!user) {
        return res.status(400).json({ message: 'User not found' });
    }

    //compare passwords
    const match = await bcrypt.compare(old_password, user.password);

    if (!match){
        return res.status(400).json({ message: 'Enter correct Old Password' });
    }

    user.password = await bcrypt.hash(new_password, 10); // salt rounds 

    const updatedUser = await user.save();

    res.json({ message: `${updatedUser.username} has successfully reset the password` });
};

const deleteUser = async (req, res) => {
    const { id } = req.body;

    // Confirm data
    if (!id) {
        return res.status(400).json({ message: 'User ID Required' });
    }

    // Does the user store exist?
    // const store = await Store.findOne({ user: id }).lean().exec();
    // if (store) {
    //     return res.status(400).json({ message: 'User store exists, instead user can make himself inactive' });
    // }

    // Does the user exist to delete?
    const user = await User.findById(id).exec();

    if (!user) {
        return res.status(400).json({ message: 'User not found' });
    }

    const result = await user.deleteOne();

    const reply = `Username ${result.username} with ID ${result._id} deleted`;

    res.json(reply);
};

module.exports = {
    signup,
    verifyOtp,
    getUser,
    updateUserInfo,
    resetPassword,
    deleteUser
};