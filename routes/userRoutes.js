const express = require('express');
const router = express.Router();
const usersController = require('../controllers/usersController');
const verifyJWT = require('../middleware/verifyJWT');

router.route('/signup').post(usersController.signup);
router.route('/signup/verifyOtp').post(usersController.verifyOtp);

router.use(verifyJWT);

router.route('/getUser').get(usersController.getUser);
router.route('/updateInfo').patch(usersController.updateUserInfo);
router.route('/resetPassword').patch(usersController.resetPassword);
router.route('/deleteAccount').delete(usersController.deleteUser);

module.exports = router;