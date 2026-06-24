const { getDb } = require('../db');
const { t } = require('../utils/translations-errors');

module.exports = (...roles) => async (req, res, next) => {
    try {
        const result = await getDb().query(
            'SELECT role FROM users WHERE id = $1',
            [req.userId]
        );

        if (result.rows.length === 0 || !roles.includes(result.rows[0].role)) {
            return res.status(403).json({
                message: t('access.denied'),
                data: null,
                success: false,
            });
        }

        req.userRole = result.rows[0].role;
        next();
    } catch (err) {
        console.error('Role check error:', err);
        return res.status(500).json({
            message: t('error.server'),
            data: null,
            success: false,
        });
    }
};
