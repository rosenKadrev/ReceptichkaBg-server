const Joi = require('joi');

const loginSchema = Joi.object({
    email: Joi.string().email().required().messages({
        'string.email': 'Невалиден имейл или парола.',
        'string.empty': 'Имейлът е задължителен.',
        'any.required': 'Имейлът е задължителен.'
    }),
    password: Joi.string().min(6).max(20).required().messages({
        'string.min': 'Паролата трябва да бъде поне 6 символа.',
        'string.max': 'Паролата не може да бъде повече от 20 символа.',
        'string.empty': 'Паролата е задължителна.',
        'any.required': 'Паролата е задължителна.'
    })
});

module.exports = loginSchema;