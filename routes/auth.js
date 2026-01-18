const express = require('express');
const authController = require('../controllers/auth');
const validate = require('../middleware/validation.middleware');
const loginSchema = require('../dto/login.dto');
const signupSchema = require('../dto/signup.dto');
const forgotPasswordSchema = require('../dto/forgot-password.dto');
const resetPasswordSchema = require('../dto/reset-password.dto');

const router = express.Router();

router.post('/register', validate(signupSchema), authController.postSignup);
router.post('/login', validate(loginSchema), authController.postLogin);
router.post('/forgot-password', validate(forgotPasswordSchema), authController.forgotPassword);
router.post('/reset-password', validate(resetPasswordSchema), authController.resetPassword);

module.exports = router;