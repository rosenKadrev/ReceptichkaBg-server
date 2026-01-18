SELECT
  id,
  name,
  image_url AS "imageUrl", 
  sort_order AS "sortOrder"
FROM article_categories
WHERE id = $1;