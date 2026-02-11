const Joi = require('joi');

const getFavoriteRecipesSchema = Joi.object({
    currentPage: Joi.number().integer().min(1).default(1).messages({
        'number.base': 'Страницата трябва да бъде число.',
        'number.integer': 'Страницата трябва да бъде цяло число.',
        'number.min': 'Страницата трябва да бъде по-голяма от 0.'
    }),
    pageSize: Joi.number().integer().min(1).max(100).messages({
        'number.base': 'Размерът на страницата трябва да бъде число.',
        'number.integer': 'Размерът на страницата трябва да бъде цяло число.',
        'number.min': 'Размерът на страницата трябва да бъде поне 1.',
        'number.max': 'Размерът на страницата не може да бъде повече от 100.'
    })
});

module.exports = getFavoriteRecipesSchema;