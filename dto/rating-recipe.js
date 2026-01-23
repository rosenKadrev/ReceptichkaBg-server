const Joi = require('joi');

const ratingSchema = Joi.object({
    rating: Joi.number().integer().min(1).max(5).required().messages({
        'number.base': 'Оценката трябва да бъде число.',
        'number.integer': 'Оценката трябва да бъде цяло число.',
        'number.min': 'Оценката трябва да бъде между 1 и 5.',
        'number.max': 'Оценката трябва да бъде между 1 и 5.',
        'any.required': 'Оценката е задължителна.'
    })
});

module.exports = { ratingSchema };