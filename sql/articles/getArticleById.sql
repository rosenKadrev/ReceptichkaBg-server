SELECT 
  a.id,
  a.name,
  a.description,
  a.article_category_id AS "articleCategoryId",
  a.main_image_url AS "mainImageUrl",
  a.created_at AS "createdAt",
  ac.name AS "categoryName",
  COALESCE(
    json_agg(
      json_build_object(
        'id', ap.id,
        'sortOrder', ap.sort_order,
        'title', ap.title,
        'description', ap.description,
        'imageUrl', ap.image_url
      ) ORDER BY ap.sort_order
    ) FILTER (WHERE ap.id IS NOT NULL),
    '[]'
  ) AS paragraphs
FROM articles a
LEFT JOIN article_categories ac ON a.article_category_id = ac.id
LEFT JOIN article_paragraphs ap ON a.id = ap.article_id
WHERE a.id = $1
GROUP BY a.id, a.name, a.description, a.article_category_id, a.main_image_url, a.created_at, ac.name