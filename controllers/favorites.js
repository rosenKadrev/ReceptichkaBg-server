const { log } = require('console');
const { getDb } = require('../db');
const { t } = require('../utils/translations-errors');
const fs = require('fs');
const path = require('path');

const loadSqlFile = (filePath) => {
    const fileBuffer = fs.readFileSync(filePath);
    return fileBuffer.toString();
};

exports.getUserFavorites = async (req, res) => {
    const db = getDb();
    const userId = req.userId;

    try {
        const favorites = await db.query(
            'SELECT recipe_id FROM favorites WHERE user_id = $1',
            [userId]
        );

        const recipeIds = favorites.rows.map(f => f.recipe_id);

        res.status(200).json({
            message: t('favorite.fetch.success'),
            data: recipeIds,
            success: true
        });
    } catch (err) {
        console.error(t('favorite.fetch.error'), err.message);
        res.status(500).json({
            message: t('favorite.fetch.error'),
            data: null,
            success: false
        });
    }
};

exports.addFavorite = async (req, res) => {
    const db = getDb();
    const userId = req.userId;
    const { recipeId } = req.params;

    try {
        const recipeExists = await db.query(
            'SELECT id, status FROM recipes WHERE id = $1',
            [recipeId]
        );

        if (recipeExists.rows.length === 0) {
            return res.status(404).json({
                message: t('favorite.recipe_not_found'),
                data: null,
                success: false
            });
        }

        if (recipeExists.rows[0].status !== 'active') {
            return res.status(403).json({
                message: t('favorite.recipe_not_active'),
                data: null,
                success: false
            });
        }

        const exists = await db.query(
            'SELECT id FROM favorites WHERE user_id = $1 AND recipe_id = $2',
            [userId, recipeId]
        );

        if (exists.rows.length > 0) {
            return res.status(400).json({
                message: t('favorite.already_exists'),
                data: null,
                success: false
            });
        }

        await db.query(
            'INSERT INTO favorites (user_id, recipe_id, created_at) VALUES ($1, $2, NOW())',
            [userId, recipeId]
        );

        res.status(201).json({
            message: t('favorite.add.success'),
            data: null,
            success: true
        });
    } catch (err) {
        console.error(t('favorite.add.error'), err.message);
        res.status(500).json({
            message: t('favorite.add.error'),
            data: null,
            success: false
        });
    }
};

exports.removeFavorite = async (req, res) => {
    const db = getDb();
    const userId = req.userId;
    const { recipeId } = req.params;

    try {
        const deleteResult = await db.query(
            'DELETE FROM favorites WHERE user_id = $1 AND recipe_id = $2 RETURNING *',
            [userId, recipeId]
        );

        if (deleteResult.rows.length === 0) {
            return res.status(404).json({
                message: t('favorite.not_found'),
                data: null,
                success: false
            });
        }

        res.status(200).json({
            message: t('favorite.remove.success'),
            data: null,
            success: true
        });
    } catch (err) {
        console.error(t('favorite.remove.error'), err.message);
        res.status(500).json({
            message: t('favorite.remove.error'),
            data: null,
            success: false
        });
    }
};

exports.getFavoriteRecipes = async (req, res) => {
    const db = getDb();
    const userId = req.userId;

    try {
        const {
            page,
            pageSize
        } = req.body;

        const pageNum = parseInt(page) || 1;
        const limitNum = parseInt(pageSize) || 10;
        const offset = (pageNum - 1) * limitNum;

        const totalResult = await db.query(
            `SELECT COUNT(*) FROM favorites f
            INNER JOIN recipes r ON f.recipe_id = r.id
            WHERE f.user_id = $1 AND r.status = 'active'`,
            [userId]
        );
        const totalResults = parseInt(totalResult.rows[0].count);

        const getFavoriteRecipesSql = loadSqlFile(path.join(__dirname, '../sql/favorites/getFavoriteRecipes.sql'));

        const result = await db.query(getFavoriteRecipesSql, [userId, limitNum, offset]);

        res.status(200).json({
            message: t('favorite.recipes.fetch.success'),
            data: {
                recipes: result.rows,
                totalResults
            },
            success: true
        });
    } catch (err) {
        console.error(t('favorite.recipes.fetch.error'), err.message);
        res.status(500).json({
            message: t('favorite.recipes.fetch.error'),
            data: null,
            success: false
        });
    }
};