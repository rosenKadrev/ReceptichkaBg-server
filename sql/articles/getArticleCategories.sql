SELECT
  ac.id,
  ac.name,
  ac.image_url AS "imageUrl",
  ac.sort_order AS "sortOrder",
  COUNT(a.id)::integer AS "articlesCount"
FROM article_categories AS ac
LEFT JOIN articles AS a ON a.article_category_id = ac.id
GROUP BY ac.id, ac.name, ac.image_url, ac.sort_order
ORDER BY ac.sort_order