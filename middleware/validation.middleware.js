const validate = (schema) => (req, res, next) => {
    const { error } = schema.validate(req.body);

    if (error) {
        // Extract the error message from Joi's detailed error object
        const errorMessage = error.details.map(detail => detail.message).join(', ');
        return res.status(400).json({ 
            message: `${errorMessage}`,
            data: null,
            success: false
        });
    }

    return next();
};

module.exports = validate;
