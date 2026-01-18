const Joi = require('joi');

const signupSchema = Joi.object({
    email: Joi.string().email().required().messages({
        'string.email': 'Моля, въведете валиден имейл адрес.',
        'any.required': 'Имейлът е задължителен.'
    }),
    password: Joi.string().min(6).max(20).required().messages({
        'string.min': 'Паролата трябва да бъде поне 6 символа.',
        'string.max': 'Паролата не може да бъде повече от 20 символа.',
        'any.required': 'Паролата е задължителна.'
    }),
    confirmPassword: Joi.string().min(6).max(20).required().messages({
        'string.min': 'Потвърждението на паролата трябва да бъде поне 6 символа.',
        'string.max': 'Потвърждението на паролата не може да бъде повече от 20 символа.',
        'any.required': 'Потвърждението на паролата е задължително.'
    }),
    username: Joi.string().pattern(/^[a-zA-Z]*$/).required().messages({
        'string.pattern.base': 'Потребителското име може да съдържа само букви.',
        'any.required': 'Потребителското име е задължително.'
    }),
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
    avatarUrl: Joi.string().uri().allow(null, '')
});

module.exports = signupSchema;