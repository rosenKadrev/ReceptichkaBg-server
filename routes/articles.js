const express = require('express');
const articlesController = require('../controllers/articles');
const fileUpload = require('../middleware/file-upload');
const authMiddleware = require('../middleware/authMiddleware');
const requireRole = require('../middleware/requireRole');

const router = express.Router();

router.get('/article-categories', articlesController.getArticleCategories);
router.get('/article-categories/:categoryId', articlesController.getArticlesByCategory);
router.get('/:articleId', articlesController.getArticleDetails);

//Routes below in this file are protected
router.post(
    '/add-article',
    authMiddleware,
    requireRole('admin', 'super_admin'),
    fileUpload.fields([
        { name: 'image', maxCount: 1 },
        { name: 'paragraphImages', maxCount: 20 }
    ]),
    articlesController.addArticle
);
router.post('/:id',
    authMiddleware,
    requireRole('admin', 'super_admin'),
    fileUpload.fields([
        { name: 'image', maxCount: 1 },
        { name: 'paragraphImages', maxCount: 20 }
    ]),
    articlesController.updateArticle);
router.delete('/delete-article/:articleId', authMiddleware, requireRole('admin', 'super_admin'), articlesController.deleteArticle);

module.exports = router;