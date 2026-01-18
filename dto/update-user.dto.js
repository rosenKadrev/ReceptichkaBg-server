const Joi = require('joi');

const updateUserSchema = Joi.object({
    name: Joi.string().required().messages({
        'string.empty': 'Името е задължително.',
        'any.required': 'Името е задължително.'
    }),
    gender: Joi.string().valid('male', 'female').required().messages({
        'any.only': 'Полът трябва да бъде "мъж" или "жена".',
        'any.required': 'Полът е задължителен.'
    }),
    dateOfBirth: Joi.date().required().messages({
        'date.base': 'Датата на раждане трябва да бъде валидна.',
        'any.required': 'Датата на раждане е задължителна.'
    }),
    email: Joi.string().email().required().messages({
        'string.email': 'Моля, въведете валиден имейл адрес.',
        'any.required': 'Имейлът е задължителен.'
    }),
});

module.exports = updateUserSchema;