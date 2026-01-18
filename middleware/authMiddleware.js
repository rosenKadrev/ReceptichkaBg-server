const jwt = require('jsonwebtoken');
const { t } = require('../utils/translations-errors');

module.exports = (req, res, next) => {
    const authHeader = req.get('Authorization');
    if (!authHeader) {
        return res.status(401).json({
            message: t('access.unauthorized'),
            data: null,
            success: false
        });
    }

    const token = authHeader.split(' ')[1];
    let decodedToken;
    try {
        decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({
                message: t('access.token_expired'),
                data: null,
                success: false
            });
        }
        return res.status(500).json({
            message: t('access.token_invalid'),
            data: null,
            success: false
        });
    }

    if (!decodedToken) {
        return res.status(401).json({
            message: t('access.unauthorized'),
            data: null,
            success: false
        });
    }

    req.userId = decodedToken.userId;

    next();
};
