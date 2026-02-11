const express = require('express');
const favoritesController = require('../controllers/favorites');
const authMiddleware = require('../middleware/authMiddleware');
const validate = require('../middleware/validation.middleware');
const getFavoriteRecipesSchema = require('../dto/favorites.dto');

const router = express.Router();

//Routes below in this file are protected
router.use(authMiddleware);
router.get('/', favoritesController.getUserFavorites);
router.post('/recipes', validate(getFavoriteRecipesSchema), favoritesController.getFavoriteRecipes);
router.post('/:recipeId', favoritesController.addFavorite);
router.delete('/:recipeId', favoritesController.removeFavorite);

module.exports = router;