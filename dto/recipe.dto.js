const Joi = require('joi');

const ingredientSchema = Joi.object({
  name: Joi.string().required().messages({
    'string.empty': 'Името на съставката е задължително.',
    'any.required': 'Името на съставката е задължително.'
  }),
  quantity: Joi.number().required().messages({
    'number.base': 'Количеството трябва да бъде число.',
    'any.required': 'Количеството е задължително.'
  }),
  unit: Joi.string().required().messages({
    'string.empty': 'Мерната единица е задължителна.',
    'any.required': 'Мерната единица е задължителна.'
  })
});

const instructionSchema = Joi.object({
  instruction: Joi.string().required().messages({
    'string.empty': 'Текстът на инструкцията е задължителен.',
    'any.required': 'Текстът на инструкцията е задължителен.'
  }),
  ord: Joi.number().required().messages({
    'number.base': 'Редът трябва да бъде число.',
    'any.required': 'Редът е задължителен.'
  })
});

// Custom validator to handle strings that should be parsed as JSON arrays
const jsonArrayValidator = (baseSchema) => (value, helpers) => {
  // If it's already an array, validate directly
  if (Array.isArray(value)) {
    return baseSchema.validate(value).value;
  }

  // If it's a string, try to parse it
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return baseSchema.validate(parsed).value;
      }
      return helpers.error('string.jsonArray', { message: 'трябва да бъде валиден JSON масив' });
    } catch (e) {
      return helpers.error('string.jsonParse', { message: 'трябва да бъде валиден JSON' });
    }
  }

  return helpers.error('string.base', { message: 'трябва да бъде текст или масив' });
};

const createRecipeSchema = Joi.object({
  name: Joi.string().required().messages({
    'string.empty': 'Името на рецептата е задължително.',
    'any.required': 'Името на рецептата е задължително.'
  }),
  description: Joi.string().required().messages({
    'string.empty': 'Описанието е задължително.',
    'any.required': 'Описанието е задължително.'
  }),
  ingredients: Joi.custom(
    jsonArrayValidator(Joi.array().items(ingredientSchema)),
    'JSON array validator'
  ).required(),
  instructions: Joi.custom(
    jsonArrayValidator(Joi.array().items(instructionSchema)),
    'JSON array validator'
  ).required(),
  category: Joi.string().guid().required().messages({
    'string.guid': 'Категорията трябва да бъде валиден UUID.',
    'any.required': 'Категорията е задължителна.'
  }),
  typeOfProcessing: Joi.string().guid().required().messages({
    'string.guid': 'Типът обработка трябва да бъде валиден UUID.',
    'any.required': 'Типът обработка е задължителен.'
  }),
  degreeOfDifficulty: Joi.string().guid().required().messages({
    'string.guid': 'Степента на трудност трябва да бъде валиден UUID.',
    'any.required': 'Степента на трудност е задължителна.'
  }),
  prepTime: Joi.number().integer().min(1).required().messages({
    'number.base': 'Времето за подготовка трябва да бъде число.',
    'number.min': 'Времето за подготовка трябва да бъде поне 1 минута.',
    'any.required': 'Времето за подготовка е задължително.'
  }),
  cookTime: Joi.number().integer().min(1).required().messages({
    'number.base': 'Времето за готвене трябва да бъде число.',
    'number.min': 'Времето за готвене трябва да бъде поне 1 минута.',
    'any.required': 'Времето за готвене е задължително.'
  }),
  servings: Joi.number().integer().min(1).required().messages({
    'number.base': 'Порциите трябва да бъдат число.',
    'number.min': 'Порциите трябва да бъдат поне 1.',
    'any.required': 'Порциите са задължителни.'
  }),
});

module.exports = {
  createRecipeSchema
};