const Joi = require('joi');

const forgotPasswordSchema = Joi.object({
    email: Joi.string().email().required().messages({
        'string.email': 'Моля, въведете валиден имейл адрес.',
        'string.empty': 'Имейлът е задължителен.',
        'any.required': 'Имейлът е задължителен.'
    })
});

module.exports = forgotPasswordSchema;