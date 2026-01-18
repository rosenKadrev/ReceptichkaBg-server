const { getDb } = require('../db');
const path = require('path');
const fs = require('fs');
const { t } = require('../utils/translations-errors');
const { uploadImage, deleteImage } = require('../utils/file-helpers');

const loadSqlFile = (filePath) => {
  const fileBuffer = fs.readFileSync(filePath);
  return fileBuffer.toString();
};

exports.getArticleCategories = async (req, res) => {
  const db = getDb();

  try {
    const query = loadSqlFile(path.join(__dirname, '../sql/articles/getArticleCategories.sql'));
    const result = await db.query(query);

    res.status(200).json({
      message: t('article.categories.fetch.success'),
      data: result.rows,
      success: true
    });
  } catch (error) {
    console.error('Error getting article categories:', error);
    res.status(500).json({
      message: t('article.categories.fetch.error'),
      error: error.message,
      success: false
    });
  }
};

exports.getArticlesByCategory = async (req, res) => {
  const db = getDb();

  const { page, pageSize, categoryId } = req.params;

  const pageNum = parseInt(page) || 1;
  const limitNum = parseInt(pageSize) || 10;
  const offset = (pageNum - 1) * limitNum;

  try {
    const categoryQuery = loadSqlFile(path.join(__dirname, '../sql/articles/getArticleCategoryById.sql'));
    const categoryResult = await db.query(categoryQuery, [categoryId]);

    if (categoryResult.rows.length === 0) {
      return res.status(404).json({
        message: t('article.category.not_found'),
        data: null,
        success: false
      });
    }

    const articlesQuery = loadSqlFile(path.join(__dirname, '../sql/articles/getArticlesByCategory.sql'));
    const countQuery = loadSqlFile(path.join(__dirname, '../sql/articles/getArticlesCountByCategory.sql'));

    const [articlesResult, countResult] = await Promise.all([
      db.query(articlesQuery, [categoryId, limitNum, offset]),
      db.query(countQuery, [categoryId])
    ]);

    res.json({
      message: t('article.articles.fetch.success'),
      data: {
        articles: articlesResult.rows,
        totalResults: parseInt(countResult.rows[0].count)
      },
      success: true
    });
  } catch (error) {
    console.error('Error getting articles by category:', error);
    res.status(500).json({
      message: t('article.articles.fetch.error'),
      data: null,
      success: false
    });
  }
};

exports.getArticleDetails = async (req, res) => {
  const db = getDb();
  const articleId = req.params.articleId;
  try {
    const articleQuery = loadSqlFile(path.join(__dirname, '../sql/articles/getArticleDetails.sql'));
    const result = await db.query(articleQuery, [articleId]);
    if (result.rows.length === 0) {
      return res.status(404).json({
        message: t('article.not_found'),
        data: null,
        success: false
      });
    }
    res.status(200).json({
      message: t('article.details.fetch.success'),
      data: result.rows[0],
      success: true
    });
  } catch (error) {
    console.error('Error getting article details:', error);
    res.status(500).json({
      message: t('article.details.fetch.error'),
      data: null,
      success: false
    });
  }
};

exports.addArticle = async (req, res) => {
  const db = getDb();
  const userId = req.userId;

  try {
    const userResult = await db.query('SELECT role FROM users WHERE id = $1', [userId]);
    if (
      userResult.rows.length === 0 ||
      !['admin', 'super_admin'].includes(userResult.rows[0].role)
    ) {
      return res.status(403).json({
        message: t('article.admin.access_denied'),
        data: null,
        success: false,
      });
    }

    const { name, description, category, paragraphs } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        message: t('article.validation.name_required'),
        data: null,
        success: false,
      });
    }

    if (!description || !description.trim()) {
      return res.status(400).json({
        message: t('article.validation.description_required'),
        data: null,
        success: false,
      });
    }

    if (!category) {
      return res.status(400).json({
        message: t('article.validation.category_required'),
        data: null,
        success: false,
      });
    }

    if (!paragraphs) {
      return res.status(400).json({
        message: t('article.validation.paragraphs_required'),
        data: null,
        success: false,
      });
    }

    const parsedParagraphs = typeof paragraphs === 'string' ? JSON.parse(paragraphs) : paragraphs;
    if (!Array.isArray(parsedParagraphs) || parsedParagraphs.length === 0) {
      return res.status(400).json({
        message: t('article.validation.paragraphs_empty'),
        data: null,
        success: false,
      });
    }

    await db.query('BEGIN');

    let mainImageUrl = null;

    if (req.files && req.files['image'] && req.files['image'][0]) {
      mainImageUrl = await uploadImage(req.files['image'][0], `article-main-${userId}`);
    }

    const articleResult = await db.query(
      `INSERT INTO articles (name, description, article_category_id, main_image_url)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [name, description, category, mainImageUrl]
    );

    const articleId = articleResult.rows[0].id;

    const paragraphImageIndexes = req.body.paragraphImageIndexes
      ? (Array.isArray(req.body.paragraphImageIndexes)
        ? req.body.paragraphImageIndexes
        : [req.body.paragraphImageIndexes])
      : [];

    const paragraphImages = req.files && req.files['paragraphImages']
      ? req.files['paragraphImages']
      : [];

    if (Array.isArray(parsedParagraphs) && parsedParagraphs.length > 0) {
      for (let i = 0; i < parsedParagraphs.length; i++) {
        const paragraph = parsedParagraphs[i];
        let imageUrl = null;

        const imageIndex = paragraphImageIndexes.indexOf(i.toString());
        if (imageIndex !== -1 && paragraphImages[imageIndex]) {
          imageUrl = await uploadImage(paragraphImages[imageIndex], `article-${userId}`);
        }

        await db.query(
          `INSERT INTO article_paragraphs (article_id, sort_order, title, description, image_url)
           VALUES ($1, $2, $3, $4, $5)`,
          [articleId, i + 1, paragraph.title || '', paragraph.text, imageUrl]
        );
      }
    }

    await db.query('COMMIT');

    const getArticleByIdSql = loadSqlFile(path.join(__dirname, '../sql/articles/getArticleById.sql'));
    const completeArticle = await db.query(getArticleByIdSql, [articleId]);

    res.status(201).json({
      message: t('article.create.success'),
      data: completeArticle.rows[0],
      success: true,
    });
  } catch (err) {
    if (db) {
      await db.query('ROLLBACK').catch(rollbackErr => {
        console.error(t('article.create.rollback_error'), rollbackErr.message);
      });
    }

    console.error(t('article.create.error'), err.message);
    res.status(500).json({
      message: t('article.create.error'),
      data: null,
      success: false,
    });
  }
};

exports.deleteArticle = async (req, res) => {
  const db = getDb();
  const userId = req.userId;
  const articleId = req.params.articleId;

  try {
    const userResult = await db.query('SELECT role FROM users WHERE id = $1', [userId]);
    if (
      userResult.rows.length === 0 ||
      !['admin', 'super_admin'].includes(userResult.rows[0].role)
    ) {
      return res.status(403).json({
        message: t('article.admin.access_denied'),
        data: null,
        success: false,
      });
    }

    const getArticleByIdSql = loadSqlFile(path.join(__dirname, '../sql/articles/getArticleById.sql'));
    const articleResult = await db.query(getArticleByIdSql, [articleId]);

    if (articleResult.rows.length === 0) {
      return res.status(404).json({
        message: t('article.delete.not_found'),
        data: null,
        success: false,
      });
    }

    const article = articleResult.rows[0];

    await db.query('BEGIN');

    await db.query('DELETE FROM articles WHERE id = $1', [articleId]);

    await db.query('COMMIT');

    if (article.mainImageUrl) {
      await deleteImage(article.mainImageUrl);
    }

    if (article.paragraphs && Array.isArray(article.paragraphs)) {
      for (const paragraph of article.paragraphs) {
        if (paragraph.imageUrl) {
          await deleteImage(paragraph.imageUrl);
        }
      }
    }

    res.status(200).json({
      message: t('article.delete.success'),
      data: article,
      success: true,
    });
  } catch (err) {
    if (db) {
      await db.query('ROLLBACK').catch(rollbackErr => {
        console.error(t('article.delete.rollback_error'), rollbackErr.message);
      });
    }

    console.error(t('article.delete.error'), err.message);
    res.status(500).json({
      message: t('article.delete.error'),
      data: null,
      success: false,
    });
  }
};

exports.updateArticle = async (req, res) => {
  const db = getDb();
  const userId = req.userId;
  const articleId = req.params.id;

  try {
    const userResult = await db.query('SELECT role FROM users WHERE id = $1', [userId]);
    if (
      userResult.rows.length === 0 ||
      !['admin', 'super_admin'].includes(userResult.rows[0].role)
    ) {
      return res.status(403).json({
        message: t('article.admin.access_denied'),
        data: null,
        success: false,
      });
    }

    const { name, description, category, paragraphs } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        message: t('article.validation.name_required'),
        data: null,
        success: false,
      });
    }

    if (!description || !description.trim()) {
      return res.status(400).json({
        message: t('article.validation.description_required'),
        data: null,
        success: false,
      });
    }

    if (!category) {
      return res.status(400).json({
        message: t('article.validation.category_required'),
        data: null,
        success: false,
      });
    }

    if (!paragraphs) {
      return res.status(400).json({
        message: t('article.validation.paragraphs_required'),
        data: null,
        success: false,
      });
    }

    const parsedParagraphs = typeof paragraphs === 'string' ? JSON.parse(paragraphs) : paragraphs;
    if (!Array.isArray(parsedParagraphs) || parsedParagraphs.length === 0) {
      return res.status(400).json({
        message: t('article.validation.paragraphs_empty'),
        data: null,
        success: false,
      });
    }

    const getArticleByIdSql = loadSqlFile(path.join(__dirname, '../sql/articles/getArticleById.sql'));
    const existingArticleResult = await db.query(getArticleByIdSql, [articleId]);

    if (existingArticleResult.rows.length === 0) {
      return res.status(404).json({
        message: t('article.delete.not_found'),
        data: null,
        success: false,
      });
    }

    const existingArticle = existingArticleResult.rows[0];

    await db.query('BEGIN');

    let mainImageUrl = existingArticle.mainImageUrl;
    if (req.files && req.files['image'] && req.files['image'][0]) {
      if (existingArticle.mainImageUrl) {
        await deleteImage(existingArticle.mainImageUrl);
      }
      mainImageUrl = await uploadImage(req.files['image'][0], `article-main-${userId}`);
    }

    await db.query(
      `UPDATE articles
       SET name = $1, description = $2, article_category_id = $3, main_image_url = $4
       WHERE id = $5`,
      [name, description, category, mainImageUrl, articleId]
    );

    const existingParagraphsResult = await db.query(
      'SELECT id, image_url FROM article_paragraphs WHERE article_id = $1 ORDER BY sort_order',
      [articleId]
    );
    const existingParagraphs = existingParagraphsResult.rows;

    const paragraphImageIndexes = req.body.paragraphImageIndexes
      ? (Array.isArray(req.body.paragraphImageIndexes)
        ? req.body.paragraphImageIndexes
        : [req.body.paragraphImageIndexes])
      : [];

    const paragraphImages = req.files && req.files['paragraphImages']
      ? req.files['paragraphImages']
      : [];

    // Create a set of image URLs that should be kept (from new paragraphs with http URLs)
    const imagesToKeep = new Set();
    parsedParagraphs.forEach(p => {
      if (p.imageUrl && typeof p.imageUrl === 'string' && p.imageUrl.startsWith('http')) {
        imagesToKeep.add(p.imageUrl);
      }
    });

    // Delete only images that are not being reused and will be replaced
    for (const existingParagraph of existingParagraphs) {
      if (existingParagraph.image_url && !imagesToKeep.has(existingParagraph.image_url)) {
        await deleteImage(existingParagraph.image_url);
      }
    }
    await db.query('DELETE FROM article_paragraphs WHERE article_id = $1', [articleId]);

    // Insert new paragraphs
    for (let i = 0; i < parsedParagraphs.length; i++) {
      const paragraph = parsedParagraphs[i];
      let imageUrl = null;

      // Check if paragraph has an existing image URL (starts with http)
      if (paragraph.imageUrl && typeof paragraph.imageUrl === 'string' && paragraph.imageUrl.startsWith('http')) {
        imageUrl = paragraph.imageUrl;
      } else {
        const imageIndex = paragraphImageIndexes.indexOf(i.toString());
        if (imageIndex !== -1 && paragraphImages[imageIndex]) {
          imageUrl = await uploadImage(paragraphImages[imageIndex], `article-${userId}`);
        }
      }

      await db.query(
        `INSERT INTO article_paragraphs (article_id, sort_order, title, description, image_url)
         VALUES ($1, $2, $3, $4, $5)`,
        [articleId, i + 1, paragraph.title || '', paragraph.text, imageUrl]
      );
    }

    await db.query('COMMIT');

    const updatedArticle = await db.query(getArticleByIdSql, [articleId]);

    res.status(200).json({
      message: t('article.update.success'),
      data: updatedArticle.rows[0],
      success: true,
    });
  } catch (err) {
    if (db) {
      await db.query('ROLLBACK').catch(rollbackErr => {
        console.error(t('article.update.rollback_error'), rollbackErr.message);
      });
    }

    console.error(t('article.update.error'), err.message);
    res.status(500).json({
      message: t('article.update.error'),
      data: null,
      success: false,
    });
  }
};