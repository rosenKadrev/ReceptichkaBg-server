SELECT
  a.id,
  a.name,
  a.description,
  a.created_at AS "createdAt",
  a.main_image_url AS "mainImageUrl",
  (
    SELECT json_build_object(
      'id', ac.id,
      'name', ac.name
    )
    FROM article_categories ac 
    WHERE ac.id = a.article_category_id
  ) AS "articleCategory",
  (
    SELECT json_agg(
      json_build_object(
        'title', ap.title,
        'description', ap.description,
        'imageUrl', ap.image_url,
        'sortOrder', ap.sort_order
      )
      ORDER BY ap.sort_order
    )
    FROM article_paragraphs ap
    WHERE ap.article_id = a.id
  ) AS "paragraphs"
FROM articles a
WHERE a.article_category_id = $1
ORDER BY a.created_at DESC
LIMIT $2 OFFSET $3