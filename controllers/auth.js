const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const crypto = require('crypto');
const { sendPasswordResetEmail } = require('../utils/email-helper');
const { t } = require('../utils/translations-errors');

exports.postLogin = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        const userResult = await db.getDb().query('SELECT * FROM users WHERE email = $1', [email]);

        if (userResult.rows.length === 0) {
            return res.status(401).json({
                message: t('auth.login.invalid'),
                data: null,
                success: false
            });
        }

        const user = userResult.rows[0];

        const doMatch = await bcrypt.compare(password, user.password);

        if (doMatch) {
            const updateResult = await db.getDb().query(
                `UPDATE users SET last_active = CURRENT_TIMESTAMP WHERE id = $1
                RETURNING
                    id,
                    name,
                    email,
                    gender,
                    username,
                    CASE WHEN role = 'super_admin' THEN 'superAdmin' ELSE role END AS "role",
                    avatar_url AS "avatarUrl",
                    date_created AS "dateCreated",
                    last_active AS "lastActive",
                    date_of_birth AS "dateOfBirth",
                    is_active AS "isActive"`,
                [user.id]
            );
            const updatedUser = updateResult.rows[0];

            const token = jwt.sign(
                { username: updatedUser.username, userId: updatedUser.id },
                process.env.JWT_SECRET,
                { expiresIn: '1h' }
            );
            const userResponse = { ...updatedUser };

            res.status(200).json({
                message: t('auth.login.success'),
                data: { token: token, user: userResponse },
                success: true
            });
        } else {
            res.status(401).json({
                message: t('auth.login.invalid'),
                data: null,
                success: false
            });
        }
    } catch (err) {
        console.log(err);
        res.status(500).json({
            message: t('auth.login.error'),
            data: null,
            success: false
        });
    }
};

exports.postSignup = async (req, res, next) => {
    try {
        const { email, password, username, name, gender, dateOfBirth, avatarUrl } = req.body;

        const userDoc = await db.getDb().query('SELECT * FROM users WHERE email = $1 OR username = $2', [email, username]);

        if (userDoc.rows.length > 0) {
            return res.status(409).json({
                message: t('auth.signup.email_exists'),
                data: null,
                success: false
            });
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        const query = {
            text: `INSERT INTO users(username, name, email, gender, date_of_birth, password, avatar_url) VALUES($1, $2, $3, $4, $5, $6, $7)
                RETURNING
                    id,
                    name,
                    email,
                    gender,
                    username,
                    CASE WHEN role = 'super_admin' THEN 'superAdmin' ELSE role END AS "role",
                    avatar_url AS "avatarUrl",
                    date_created AS "dateCreated",
                    last_active AS "lastActive",
                    date_of_birth AS "dateOfBirth",
                    is_active AS "isActive"`,
            values: [username, name, email, gender, dateOfBirth, hashedPassword, avatarUrl],
        };

        const result = await db.getDb().query(query);
        const user = result.rows[0];

        const token = jwt.sign(
            { username: user.username, userId: user.id },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        const userResponse = { ...user };

        res.status(201).json({
            message: t('auth.signup.success'),
            data: { token: token, user: userResponse },
            success: true
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({
            message: t('auth.signup.error'),
            data: null,
            success: false
        });
    }
};

exports.forgotPassword = async (req, res) => {
    const { email } = req.body;

    try {
        const userResult = await db.getDb().query('SELECT id, email FROM users WHERE email = $1', [email]);

        if (userResult.rows.length === 0) {
            return res.status(200).json({
                message: t('password.forgot.success'),
                data: null,
                success: true
            });
        }

        const user = userResult.rows[0];

        const resetToken = crypto.randomBytes(32).toString('hex');
        const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

        const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

        await db.getDb().query('DELETE FROM password_reset_tokens WHERE user_id = $1', [user.id]);

        await db.getDb().query(
            'INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
            [user.id, hashedToken, expiresAt]
        );

        await sendPasswordResetEmail(user.email, resetToken);

        res.status(200).json({
            message: t('password.forgot.success'),
            data: null,
            success: true
        });
    } catch (err) {
        console.error('Error in forgot password:', err);
        res.status(500).json({
            message: t('password.forgot.error'),
            data: null,
            success: false
        });
    }
};

exports.resetPassword = async (req, res) => {
    const { token, newPassword } = req.body;

    try {
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

        const tokenResult = await db.getDb().query(
            `SELECT user_id, expires_at FROM password_reset_tokens 
             WHERE token = $1 AND expires_at > NOW()`,
            [hashedToken]
        );

        if (tokenResult.rows.length === 0) {
            return res.status(400).json({
                message: t('password.reset.invalid_token'),
                data: null,
                success: false
            });
        }

        const userId = tokenResult.rows[0].user_id;

        const hashedPassword = await bcrypt.hash(newPassword, 12);

        await db.getDb().query(
            'UPDATE users SET password = $1 WHERE id = $2',
            [hashedPassword, userId]
        );

        await db.getDb().query(
            'DELETE FROM password_reset_tokens WHERE token = $1',
            [hashedToken]
        );

        res.status(200).json({
            message: t('password.reset.success'),
            data: null,
            success: true
        });
    } catch (err) {
        console.error('Error resetting password:', err);
        res.status(500).json({
            message: t('password.reset.error'),
            data: null,
            success: false
        });
    }
};