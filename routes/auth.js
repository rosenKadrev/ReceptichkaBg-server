const express = require('express');
const rateLimit = require('express-rate-limit');
const { t } = require('../utils/translations-errors');
const authController = require('../controllers/auth');
const validate = require('../middleware/validation.middleware');
const loginSchema = require('../dto/login.dto');
const signupSchema = require('../dto/signup.dto');
const forgotPasswordSchema = require('../dto/forgot-password.dto');
const resetPasswordSchema = require('../dto/reset-password.dto');

const router = express.Router();

const loginLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 15 minutes
    max: 10,
    handler: (req, res) => res.status(429).json({ message: t('rateLimit.login'), data: null, success: false }),
    standardHeaders: true,
    legacyHeaders: false,
});

const passwordLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3,
    handler: (req, res) => res.status(429).json({ message: t('rateLimit.password'), data: null, success: false }),
    standardHeaders: true,
    legacyHeaders: false,
});

router.post('/register', validate(signupSchema), authController.postSignup);
router.post('/login', loginLimiter, validate(loginSchema), authController.postLogin);
router.post('/google', loginLimiter, authController.googleLogin);
router.post('/forgot-password', passwordLimiter, validate(forgotPasswordSchema), authController.forgotPassword);
router.post('/reset-password', passwordLimiter, validate(resetPasswordSchema), authController.resetPassword);

module.exports = router;