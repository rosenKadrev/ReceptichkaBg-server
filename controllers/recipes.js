const { getDb } = require('../db');
const { uploadImage, deleteImage } = require('../utils/file-helpers');
const fs = require('fs');
const path = require('path');
const { t } = require('../utils/translations-errors');

const loadSqlFile = (filePath) => {
  const fileBuffer = fs.readFileSync(filePath);
  return fileBuffer.toString();
};

exports.getRecipeLookups = async (req, res) => {
  const db = getDb();
  try {
    const categoriesPromise = db.query('SELECT id, name, sort_order AS "sortOrder" FROM categories ORDER BY sort_order');
    const processingTypesPromise = db.query('SELECT id, name, sort_order AS "sortOrder" FROM type_of_processing ORDER BY sort_order');
    const difficultiesPromise = db.query('SELECT id, name, sort_order AS "sortOrder" FROM degree_of_difficulty ORDER BY sort_order');

    const [categories, processingTypes, difficulties] = await Promise.all([
      categoriesPromise,
      processingTypesPromise,
      difficultiesPromise,
    ]);

    const lookups = {
      categories: categories.rows,
      processingTypes: processingTypes.rows,
      degreeOfDifficulty: difficulties.rows,
    };

    res.status(200).json({ message: t('recipe.lookups.fetch.success'), data: lookups, success: true });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: t('recipe.lookups.fetch.error'), data: null, success: false });
  }
};

exports.addRecipe = async (req, res) => {
  const db = getDb();
  try {
    const userId = req.userId;
    const {
      name,
      description,
      ingredients,
      instructions,
      category,
      typeOfProcessing,
      degreeOfDifficulty,
      prepTime,
      cookTime,
      servings
    } = req.body;

    const parsedIngredients = typeof ingredients === 'string' ? JSON.parse(ingredients) : ingredients;
    const parsedInstructions = typeof instructions === 'string' ? JSON.parse(instructions) : instructions;

    await db.query('BEGIN');

    const recipeInsertResult = await db.query(
      `INSERT INTO recipes (
        user_id, name, description, category_id, type_of_processing_id, 
        degree_of_difficulty_id, prep_time, cook_time, servings
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [
        userId,
        name,
        description,
        category,
        typeOfProcessing,
        degreeOfDifficulty,
        prepTime,
        cookTime,
        servings
      ]
    );

    const recipeId = recipeInsertResult.rows[0].id;

    if (req.file) {
      const imageUrl = await uploadImage(req.file, `recipe-${userId}`);

      await db.query(
        `INSERT INTO recipe_images (recipe_id, image_url, is_primary) 
         VALUES ($1, $2, $3)`,
        [recipeId, imageUrl, true]
      );
    }

    if (Array.isArray(parsedIngredients) && parsedIngredients.length > 0) {
      for (const ingredient of parsedIngredients) {
        await db.query(
          `INSERT INTO ingredients (recipe_id, name, quantity, unit)
          VALUES ($1, $2, $3, $4)`,
          [recipeId, ingredient.name, ingredient.quantity, ingredient.unit]
        );
      }
    }

    if (Array.isArray(parsedInstructions) && parsedInstructions.length > 0) {
      for (const instruction of parsedInstructions) {
        await db.query(
          `INSERT INTO instructions (
            recipe_id, description, sort_order
          ) VALUES ($1, $2, $3)`,
          [recipeId, instruction.instruction, instruction.ord]
        );
      }
    }

    const getRecipeByIdSql = loadSqlFile(path.join(__dirname, '../sql/recipes/getRecipeById.sql'));
    const completeRecipe = await db.query(getRecipeByIdSql, [recipeId, ['pending'], userId]);

    await db.query('COMMIT');

    res.status(201).json({
      message: t('recipe.create.success'),
      data: completeRecipe.rows[0],
      success: true
    });
  } catch (err) {
    if (db) {
      await db.query('ROLLBACK').catch(rollbackErr => {
        console.error(t('recipe.create.rollback_error'), rollbackErr.message);
      });
    }

    console.error(t('recipe.create.error'), err.message);
    res.status(500).json({
      message: t('recipe.create.error'),
      data: null,
      success: false
    });
  }
};

exports.getMyRecipes = async (req, res) => {
  const db = getDb();
  const userId = req.userId;

  try {
    const {
      page,
      pageSize,
      searchText,
      status,
      categoryId,
      typeOfProcessingId,
      degreeOfDifficultyId,
      sortBy,
      sortOrder
    } = req.query;

    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(pageSize) || 6;
    const offset = (pageNum - 1) * limitNum;

    const sortMappings = {
      createdAt: 'r.created_at',
      name: 'r.name',
      category: 'c.name',
      typeOfProcessing: 'tp.name',
      degreeOfDifficulty: 'dd.name',
      status: 'r.status'
    };
    let orderBy = 'r.created_at DESC';
    if (sortBy && sortMappings[sortBy]) {
      const direction = sortOrder === 'asc' ? 'ASC' : 'DESC';
      orderBy = `${sortMappings[sortBy]} ${direction}`;
    }

    const whereConditions = [];
    const params = [userId];

    if (searchText) {
      whereConditions.push(`r.name ILIKE $${params.length + 1}`);
      params.push(`%${searchText}%`);
    }

    if (status) {
      whereConditions.push(`r.status = $${params.length + 1}`);
      params.push(status);
    }

    if (categoryId) {
      whereConditions.push(`r.category_id = $${params.length + 1}`);
      params.push(categoryId);
    }

    if (typeOfProcessingId) {
      whereConditions.push(`r.type_of_processing_id = $${params.length + 1}`);
      params.push(typeOfProcessingId);
    }

    if (degreeOfDifficultyId) {
      whereConditions.push(`r.degree_of_difficulty_id = $${params.length + 1}`);
      params.push(degreeOfDifficultyId);
    }

    const whereClause = whereConditions.length > 0 ? ` AND ${whereConditions.join(' AND ')}` : '';

    const totalResult = await db.query(
      `SELECT COUNT(*) FROM recipes r WHERE r.user_id = $1 ${whereClause}`,
      params
    );
    const totalResults = parseInt(totalResult.rows[0].count);

    const getMyRecipesSql = loadSqlFile(path.join(__dirname, '../sql/recipes/getMyRecipes.sql'))
      .replace('{whereClause}', whereClause)
      .replace('{orderBy}', orderBy)
      .replace('{limitParam}', '$' + (params.length + 1))
      .replace('{offsetParam}', '$' + (params.length + 2));
    const result = await db.query(getMyRecipesSql, [...params, limitNum, offset]);

    res.status(200).json({
      message: t('recipe.my.fetch.success'),
      data: {
        recipes: result.rows,
        totalResults
      },
      success: true
    });
  } catch (err) {
    console.error(t('recipe.my.fetch.error'), err.message);
    res.status(500).json({
      message: t('recipe.my.fetch.error'),
      data: null,
      success: false
    });
  }
};

exports.getAllRecipes = async (req, res) => {
  const db = getDb();
  let userId;
  const jwt = require('jsonwebtoken');
  const authHeader = req.get('Authorization');
  if (authHeader) {
    const token = authHeader.split(' ')[1];
    try {
      const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
      if (decodedToken && decodedToken.userId) {
        userId = decodedToken.userId;
      }
      if (!decodedToken) {
        return res.status(401).json({ message: t('access.unauthorized') });
      }
    } catch (err) {
      userId = null;
    }
  }

  try {
    const {
      page,
      pageSize,
      searchText,
      searchByName,
      categoryId,
      typeOfProcessingId,
      degreeOfDifficultyId,
      sortBy,
      sortOrder
    } = req.query;

    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(pageSize) || 6;
    const offset = (pageNum - 1) * limitNum;

    const sortMappings = {
      createdAt: 'r.created_at',
      name: 'r.name',
      category: 'c.name',
      typeOfProcessing: 'tp.name',
      degreeOfDifficulty: 'dd.name',
      searchByName: 'u.name'
    };
    let orderBy = 'r.created_at DESC';
    if (sortBy && sortMappings[sortBy]) {
      const direction = sortOrder === 'asc' ? 'ASC' : 'DESC';
      orderBy = `${sortMappings[sortBy]} ${direction}`;
    }

    const whereConditions = [];
    const params = [];

    if (userId) {
      whereConditions.push(`r.user_id != $${params.length + 1}`);
      params.push(userId);
    }

    if (searchText) {
      whereConditions.push(`r.name ILIKE $${params.length + 1}`);
      params.push(`%${searchText}%`);
    }

    if (searchByName) {
      whereConditions.push(`u.name ILIKE $${params.length + 1}`);
      params.push(`%${searchByName}%`);
    }

    if (categoryId) {
      whereConditions.push(`r.category_id = $${params.length + 1}`);
      params.push(categoryId);
    }

    if (typeOfProcessingId) {
      whereConditions.push(`r.type_of_processing_id = $${params.length + 1}`);
      params.push(typeOfProcessingId);
    }

    if (degreeOfDifficultyId) {
      whereConditions.push(`r.degree_of_difficulty_id = $${params.length + 1}`);
      params.push(degreeOfDifficultyId);
    }

    const whereClause = whereConditions.length > 0 ? ` AND ${whereConditions.join(' AND ')}` : '';

    const totalResult = await db.query(
      `SELECT COUNT(*) FROM recipes r LEFT JOIN users u ON r.user_id = u.id WHERE 1=1${whereClause}`,
      params
    );

    const totalResults = parseInt(totalResult.rows[0].count);

    const getAllRecipesSql = loadSqlFile(path.join(__dirname, '../sql/recipes/getAllRecipes.sql'))
      .replace('{excludeCurrentUserClause}', userId ? ` AND r.user_id != $1` : '')
      .replace('{whereClause}', whereConditions.length > 0 ? whereClause : '')
      .replace('{orderBy}', orderBy)
      .replace('{limitParam}', `$${params.length + 1}`)
      .replace('{offsetParam}', `$${params.length + 2}`);

    const result = await db.query(getAllRecipesSql, [...params, limitNum, offset]);

    res.status(200).json({
      message: t('recipe.all.fetch.success'),
      data: {
        recipes: result.rows,
        totalResults
      },
      success: true
    });
  } catch (err) {
    console.error(t('recipe.all.fetch.error'), err.message);
    res.status(500).json({
      message: t('recipe.all.fetch.error'),
      data: null,
      success: false
    });
  }
};

exports.deleteRecipe = async (req, res) => {
  const db = getDb();
  const userId = req.userId;
  const recipeId = req.params.id;

  try {
    const getRecipeForDeleteSql = loadSqlFile(path.join(__dirname, '../sql/recipes/getRecipeForDelete.sql'));
    const recipeResult = await db.query(getRecipeForDeleteSql, [recipeId, userId]);

    if (recipeResult.rows.length === 0) {
      return res.status(404).json({
        message: t('recipe.delete.not_found'),
        data: null,
        success: false
      });
    }

    const recipe = recipeResult.rows[0];

    if (recipe.images && recipe.images.length > 0) {
      for (const img of recipe.images) {
        const imageUrl = img.imageUrl;
        deleteImage(imageUrl);
      }
    }

    await db.query('DELETE FROM ratings WHERE recipe_id = $1', [recipeId]);

    await db.query('DELETE FROM recipes WHERE id = $1', [recipeId]);

    res.status(200).json({
      message: t('recipe.delete.success'),
      data: { recipe },
      success: true
    });
  } catch (err) {
    console.error(t('recipe.delete.error'), err.message);
    res.status(500).json({
      message: t('recipe.delete.error'),
      data: null,
      success: false
    });
  }
};

exports.adminDeleteRecipe = async (req, res) => {
  const db = getDb();
  const userId = req.userId;
  const recipeId = req.params.id;

  try {
    const userResult = await db.query('SELECT role FROM users WHERE id = $1', [userId]);
    if (
      userResult.rows.length === 0 ||
      !['admin', 'super_admin'].includes(userResult.rows[0].role)
    ) {
      return res.status(403).json({
        message: t('recipe.admin.access_denied'),
        data: null,
        success: false,
      });
    }

    const getRecipeByIdSql = loadSqlFile(path.join(__dirname, '../sql/recipes/getRecipeById.sql'));
    const recipeResult = await db.query(getRecipeByIdSql, [recipeId, ['active', 'pending', 'rejected']]);
    if (recipeResult.rows.length === 0) {
      return res.status(404).json({
        message: t('recipe.admin.delete.not_found'),
        data: null,
        success: false,
      });
    }
    const recipe = recipeResult.rows[0];

    if (recipe.images && recipe.images.length > 0) {
      for (const img of recipe.images) {
        if (img.imageUrl) {
          deleteImage(img.imageUrl);
        }
      }
    }

    await db.query('DELETE FROM ratings WHERE recipe_id = $1', [recipeId]);

    await db.query('DELETE FROM recipes WHERE id = $1', [recipeId]);

    res.status(200).json({
      message: t('recipe.admin.delete.success'),
      data: { recipe },
      success: true,
    });
  } catch (err) {
    console.error(t('recipe.admin.delete.error'), err.message);
    res.status(500).json({
      message: t('recipe.admin.delete.error'),
      data: null,
      success: false,
    });
  }
};

exports.getMyRecipeById = async (req, res) => {
  const db = getDb();
  const userId = req.userId;
  const recipeId = req.params.id;

  try {
    const getRecipeByIdSql = loadSqlFile(path.join(__dirname, '../sql/recipes/getMyRecipeById.sql'));
    const recipeResult = await db.query(getRecipeByIdSql, [recipeId]);

    if (recipeResult.rows.length === 0) {
      return res.status(404).json({
        message: t('recipe.my.byId.not_found'),
        data: null,
        success: false
      });
    }

    const recipe = recipeResult.rows[0];

    if (recipe.userId !== userId) {
      return res.status(403).json({
        message: t('recipe.my.byId.access_denied'),
        data: null,
        success: false
      });
    }

    res.status(200).json({
      message: t('recipe.my.byId.success'),
      data: recipe,
      success: true
    });
  } catch (err) {
    console.error(t('recipe.my.byId.error'), err.message);
    res.status(500).json({
      message: t('recipe.my.byId.error'),
      data: null,
      success: false
    });
  }
};

exports.getRecipeById = async (req, res) => {
  const db = getDb();
  const recipeId = req.params.id;
  let userId;
  const jwt = require('jsonwebtoken');
  const authHeader = req.get('Authorization');

  if (authHeader) {
    const token = authHeader.split(' ')[1];
    try {
      const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
      if (decodedToken && decodedToken.userId) {
        userId = decodedToken.userId;
      }
    } catch (err) {
      userId = null;
    }
  }

  try {
    const getRecipeByIdSql = loadSqlFile(path.join(__dirname, '../sql/recipes/getRecipeById.sql'));
    const recipeResult = await db.query(getRecipeByIdSql, [recipeId, ['active'], userId]);
    if (recipeResult.rows.length === 0) {
      return res.status(404).json({
        message: t('recipe.byId.not_found'),
        data: null,
        success: false
      });
    }

    const recipe = recipeResult.rows[0];

    res.status(200).json({
      message: t('recipe.byId.success'),
      data: recipe,
      success: true
    });
  } catch (err) {
    console.error(t('recipe.byId.error'), err);
    res.status(500).json({
      message: t('recipe.byId.error'),
      data: null,
      success: false
    });
  }
};

exports.updateRecipe = async (req, res) => {
  const db = getDb();
  try {
    const userId = req.userId;
    const recipeId = req.params.id;
    const {
      name,
      description,
      ingredients,
      instructions,
      category,
      typeOfProcessing,
      degreeOfDifficulty,
      prepTime,
      cookTime,
      servings
    } = req.body;

    const parsedIngredients = typeof ingredients === 'string' ? JSON.parse(ingredients) : ingredients;
    const parsedInstructions = typeof instructions === 'string' ? JSON.parse(instructions) : instructions;

    await db.query('BEGIN');

    const existingRecipe = await db.query(
      'SELECT id FROM recipes WHERE id = $1 AND user_id = $2',
      [recipeId, userId]
    );

    if (existingRecipe.rows.length === 0) {
      await db.query('ROLLBACK');
      return res.status(404).json({
        message: t('recipe.update.not_found'),
        success: false
      });
    }

    const currentImage = await db.query(
      'SELECT image_url FROM recipe_images WHERE recipe_id = $1 AND is_primary = true',
      [recipeId]
    );
    const currentImageUrl = currentImage.rows[0]?.image_url;

    let imageUrl = currentImageUrl;
    if (req.file) {
      imageUrl = await uploadImage(req.file, `recipe-${userId}`);

      if (currentImageUrl) {
        await deleteImage(currentImageUrl);
      }
    }

    await db.query(
      `UPDATE recipes
       SET name = $1,
           description = $2,
           category_id = $3,
           type_of_processing_id = $4,
           degree_of_difficulty_id = $5,
           prep_time = $6,
           cook_time = $7,
           servings = $8,
           updated_at = NOW(),
           status = 'pending'
       WHERE id = $9 AND user_id = $10`,
      [
        name,
        description,
        category,
        typeOfProcessing,
        degreeOfDifficulty,
        prepTime,
        cookTime,
        servings,
        recipeId,
        userId
      ]
    );

    if (req.file || currentImageUrl) {
      if (currentImageUrl) {
        if (req.file) {
          await db.query(
            `UPDATE recipe_images 
             SET image_url = $1 
             WHERE recipe_id = $2`,
            [imageUrl, recipeId]
          );
        }
      } else if (req.file) {
        await db.query(
          `INSERT INTO recipe_images (recipe_id, image_url, is_primary) 
           VALUES ($1, $2, true)`,
          [recipeId, imageUrl]
        );
      }
    }

    await db.query('DELETE FROM ingredients WHERE recipe_id = $1', [recipeId]);
    await db.query('DELETE FROM instructions WHERE recipe_id = $1', [recipeId]);

    if (Array.isArray(parsedIngredients) && parsedIngredients.length > 0) {
      for (const ingredient of parsedIngredients) {
        await db.query(
          `INSERT INTO ingredients (recipe_id, name, quantity, unit)
           VALUES ($1, $2, $3, $4)`,
          [recipeId, ingredient.name, ingredient.quantity, ingredient.unit]
        );
      }
    }

    if (Array.isArray(parsedInstructions) && parsedInstructions.length > 0) {
      for (const instruction of parsedInstructions) {
        await db.query(
          `INSERT INTO instructions (recipe_id, description, sort_order)
           VALUES ($1, $2, $3)`,
          [recipeId, instruction.instruction, instruction.ord]
        );
      }
    }

    await db.query('COMMIT');

    const getRecipeByIdSql = loadSqlFile(path.join(__dirname, '../sql/recipes/getRecipeById.sql'));
    const updatedRecipe = await db.query(getRecipeByIdSql, [recipeId, ['pending']]);

    res.status(200).json({
      message: t('recipe.update.success'),
      data: updatedRecipe.rows[0],
      success: true
    });
  } catch (err) {
    if (db) {
      await db.query('ROLLBACK').catch(rollbackErr => {
        console.error(t('recipe.update.rollback_error'), rollbackErr.message);
      });
    }

    console.error(t('recipe.update.error'), err.message);
    res.status(500).json({
      message: t('recipe.update.error'),
      data: null,
      success: false
    });
  }
};

exports.getRandomRecipes = async (req, res) => {
  const db = getDb();
  let userId;
  const jwt = require('jsonwebtoken');
  const authHeader = req.get('Authorization');

  if (authHeader) {
    const token = authHeader.split(' ')[1];
    try {
      const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
      if (decodedToken && decodedToken.userId) {
        userId = decodedToken.userId;
      }
    } catch (err) {
      userId = null;
    }
  }

  try {
    const count = parseInt(req.query.count) || 3;
    const query = loadSqlFile(path.join(__dirname, '../sql/recipes/getRandomRecipes.sql'));

    const result = await db.query(query, [count, userId]);

    res.status(200).json({
      message: t('recipe.random.fetch.success'),
      data: result.rows,
      success: true
    });
  } catch (err) {
    console.error(t('recipe.random.fetch.error'), err.message);
    res.status(500).json({
      message: t('recipe.random.fetch.error'),
      data: null,
      success: false
    });
  }
};

exports.getAdminRecipes = async (req, res) => {
  const db = getDb();
  const userId = req.userId;

  try {
    const userResult = await db.query(
      'SELECT role FROM users WHERE id = $1',
      [userId]
    );
    if (
      userResult.rows.length === 0 ||
      !['admin', 'super_admin'].includes(
        userResult.rows[0].role
      )
    ) {
      return res.status(403).json({
        message: t('recipe.admin.access_denied'),
        data: null,
        success: false,
      });
    }

    const {
      page,
      pageSize,
      searchText,
      searchByName,
      status,
      categoryId,
      typeOfProcessingId,
      degreeOfDifficultyId,
      sortBy,
      sortOrder,
      createdAtFrom,
      createdAtTo
    } = req.query;

    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(pageSize) || 10;
    const offset = (pageNum - 1) * limitNum;

    const sortMappings = {
      createdAt: 'r.created_at',
      name: 'r.name',
      category: 'c.name',
      typeOfProcessing: 'tp.name',
      degreeOfDifficulty: 'dd.name',
      status: 'r.status',
      searchByName: 'u.name'
    };
    let orderBy = 'r.created_at DESC';
    if (sortBy && sortMappings[sortBy]) {
      const direction = sortOrder === 'asc' ? 'ASC' : 'DESC';
      orderBy = `${sortMappings[sortBy]} ${direction}`;
    }

    const whereConditions = [];
    const params = [];

    if (searchText) {
      whereConditions.push(`r.name ILIKE $${params.length + 1}`);
      params.push(`%${searchText}%`);
    }

    if (searchByName) {
      whereConditions.push(`u.name ILIKE $${params.length + 1}`);
      params.push(`%${searchByName}%`);
    }

    if (createdAtFrom) {
      whereConditions.push(`r.created_at >= $${params.length + 1}`);
      params.push(createdAtFrom);
    }
    if (createdAtTo) {
      whereConditions.push(`r.created_at <= $${params.length + 1}`);
      params.push(createdAtTo);
    }

    if (status) {
      whereConditions.push(`r.status = $${params.length + 1}`);
      params.push(status);
    }

    if (categoryId) {
      whereConditions.push(`r.category_id = $${params.length + 1}`);
      params.push(categoryId);
    }

    if (typeOfProcessingId) {
      whereConditions.push(`r.type_of_processing_id = $${params.length + 1}`);
      params.push(typeOfProcessingId);
    }

    if (degreeOfDifficultyId) {
      whereConditions.push(`r.degree_of_difficulty_id = $${params.length + 1}`);
      params.push(degreeOfDifficultyId);
    }

    const whereClause =
      whereConditions.length > 0
        ? `WHERE ${whereConditions.join(' AND ')}`
        : '';

    const totalResult = await db.query(
      `SELECT COUNT(*) FROM recipes r LEFT JOIN users u ON r.user_id = u.id ${whereClause}`,
      params
    );
    const totalResults = parseInt(totalResult.rows[0].count);

    const getAdminRecipesSql = loadSqlFile(
      path.join(__dirname, '../sql/recipes/getAdminRecipes.sql')
    )
      .replace('{whereClause}', whereClause)
      .replace('{orderBy}', orderBy)
      .replace('{limitParam}', `$${params.length + 1}`)
      .replace('{offsetParam}', `$${params.length + 2}`);

    const result = await db.query(getAdminRecipesSql, [
      ...params,
      limitNum,
      offset,
    ]);

    res.status(200).json({
      message: t('recipe.admin.fetch.success'),
      data: {
        recipes: result.rows,
        totalResults,
      },
      success: true,
    });
  } catch (err) {
    console.error(t('recipe.admin.fetch.error'), err.message);
    res.status(500).json({
      message: t('recipe.admin.fetch.error'),
      data: null,
      success: false,
    });
  }
};

exports.approveRecipe = async (req, res) => {
  const db = getDb();
  const userId = req.userId;
  const recipeId = req.params.id;

  try {
    const userResult = await db.query('SELECT role FROM users WHERE id = $1', [userId]);
    if (
      userResult.rows.length === 0 ||
      !['admin', 'super_admin'].includes(userResult.rows[0].role)
    ) {
      return res.status(403).json({
        message: t('recipe.admin.access_denied'),
        data: null,
        success: false,
      });
    }

    const updateResult = await db.query(
      `UPDATE recipes 
       SET status = 'active', date_approved = NOW(), approved_by = $1
       WHERE id = $2
       RETURNING *`,
      [userId, recipeId]
    );

    if (updateResult.rows.length === 0) {
      return res.status(404).json({
        message: t('recipe.approve.not_found'),
        data: null,
        success: false,
      });
    }

    res.status(200).json({
      message: t('recipe.approve.success'),
      data: updateResult.rows[0],
      success: true,
    });
  } catch (err) {
    console.error(t('recipe.approve.error'), err.message);
    res.status(500).json({
      message: t('recipe.approve.error'),
      data: null,
      success: false,
    });
  }
};

exports.rejectRecipe = async (req, res) => {
  const db = getDb();
  const userId = req.userId;
  const recipeId = req.params.id;

  try {
    const userResult = await db.query('SELECT role FROM users WHERE id = $1', [userId]);
    if (
      userResult.rows.length === 0 ||
      !['admin', 'super_admin'].includes(userResult.rows[0].role)
    ) {
      return res.status(403).json({
        message: t('recipe.admin.access_denied'),
        data: null,
        success: false,
      });
    }

    const updateResult = await db.query(
      `UPDATE recipes 
       SET status = 'rejected', date_approved = NOW(), approved_by = $1
       WHERE id = $2
       RETURNING *`,
      [userId, recipeId]
    );

    if (updateResult.rows.length === 0) {
      return res.status(404).json({
        message: t('recipe.reject.not_found'),
        data: null,
        success: false,
      });
    }

    res.status(200).json({
      message: t('recipe.reject.success'),
      data: updateResult.rows[0],
      success: true,
    });
  } catch (err) {
    console.error(t('recipe.reject.error'), err.message);
    res.status(500).json({
      message: t('recipe.reject.error'),
      data: null,
      success: false,
    });
  }
};

exports.rateRecipe = async (req, res) => {
  const db = getDb();
  const userId = req.userId;
  const recipeId = req.params.id;
  const { rating } = req.body;

  try {
    const ratingNum = parseInt(rating);

    await db.query('BEGIN');

    const recipeResult = await db.query(
      'SELECT id, user_id, status FROM recipes WHERE id = $1',
      [recipeId]
    );

    if (recipeResult.rows.length === 0) {
      await db.query('ROLLBACK');
      return res.status(404).json({
        message: t('rating.recipe_not_found'),
        data: null,
        success: false
      });
    }

    const recipe = recipeResult.rows[0];

    if (recipe.status !== 'active') {
      await db.query('ROLLBACK');
      return res.status(403).json({
        message: t('rating.recipe_not_approved'),
        data: null,
        success: false
      });
    }

    if (recipe.user_id === userId) {
      await db.query('ROLLBACK');
      return res.status(403).json({
        message: t('rating.own_recipe'),
        data: null,
        success: false
      });
    }

    const existingRating = await db.query(
      'SELECT id, rating FROM ratings WHERE recipe_id = $1 AND user_id = $2',
      [recipeId, userId]
    );

    let ratingData;
    let isUpdate = false;

    if (existingRating.rows.length > 0) {
      const updateResult = await db.query(
        `UPDATE ratings
         SET rating = $1, updated_at = CURRENT_TIMESTAMP
         WHERE recipe_id = $2 AND user_id = $3
         RETURNING *`,
        [ratingNum, recipeId, userId]
      );
      ratingData = updateResult.rows[0];
      isUpdate = true;
    } else {
      const insertResult = await db.query(
        `INSERT INTO ratings (recipe_id, user_id, rating)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [recipeId, userId, ratingNum]
      );
      ratingData = insertResult.rows[0];
    }

    const statsResult = await db.query(
      `SELECT
        COALESCE(ROUND(AVG(rating)::numeric, 1), 0) as average_rating,
        COUNT(*) as rating_count
       FROM ratings
       WHERE recipe_id = $1`,
      [recipeId]
    );

    const { average_rating, rating_count } = statsResult.rows[0];

    await db.query(
      `UPDATE recipes
       SET average_rating = $1, rating_count = $2
       WHERE id = $3`,
      [average_rating, rating_count, recipeId]
    );

    await db.query('COMMIT');

    res.status(200).json({
      message: isUpdate ? t('rating.update.success') : t('rating.add.success'),
      data: {
        userRating: ratingData.rating,
        averageRating: parseFloat(average_rating),
        ratingCount: parseInt(rating_count)
      },
      success: true
    });
  } catch (err) {
    if (db) {
      await db.query('ROLLBACK').catch(rollbackErr => {
        console.error('Rollback error:', rollbackErr.message);
      });
    }

    console.error(t('rating.add.error'), err.message);
    res.status(500).json({
      message: t('rating.add.error'),
      data: null,
      success: false
    });
  }
};