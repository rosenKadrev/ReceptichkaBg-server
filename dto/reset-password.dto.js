const Joi = require('joi');

const resetPasswordSchema = Joi.object({
    token: Joi.string().required().messages({
        'string.empty': 'Токенът е задължителен.',
        'any.required': 'Токенът е задължителен.'
    }),
    newPassword: Joi.string().min(6).max(20).required().messages({
        'string.min': 'Паролата трябва да бъде поне 6 символа.',
        'string.max': 'Паролата не може да бъде повече от 20 символа.',
        'string.empty': 'Новата парола е задължителна.',
        'any.required': 'Новата парола е задължителна.'
    })
});

module.exports = resetPasswordSchema;