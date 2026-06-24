const express = require('express');
const recipesController = require('../controllers/recipes');
const authMiddleware = require('../middleware/authMiddleware');
const requireRole = require('../middleware/requireRole');
const fileUpload = require('../middleware/file-upload');
const validate = require('../middleware/validation.middleware');
const { createRecipeSchema } = require('../dto/recipe.dto');
const { ratingSchema } = require('../dto/rating-recipe');

const router = express.Router();

router.get('/lookups', recipesController.getRecipeLookups);
router.get('/random-recipes', recipesController.getRandomRecipes);
router.get('/all', recipesController.getAllRecipes);
router.get('/all/:id', recipesController.getRecipeById);

//Routes below in this file are protected
router.use(authMiddleware);
router.get('/my', recipesController.getMyRecipes);
router.get('/admin', requireRole('admin', 'super_admin'), recipesController.getAdminRecipes);
router.get('/my/:id', recipesController.getMyRecipeById);
router.post('/add', fileUpload.single('image'), validate(createRecipeSchema), recipesController.addRecipe);
router.post('/:id', fileUpload.single('image'), validate(createRecipeSchema), recipesController.updateRecipe);
router.delete('/:id', recipesController.deleteRecipe);
router.delete('/:id/admin-delete', requireRole('admin', 'super_admin'), recipesController.adminDeleteRecipe);
router.post('/:id/approve', requireRole('admin', 'super_admin'), recipesController.approveRecipe);
router.post('/:id/reject', requireRole('admin', 'super_admin'), recipesController.rejectRecipe);
router.post('/:id/rate', validate(ratingSchema), recipesController.rateRecipe);

module.exports = router;