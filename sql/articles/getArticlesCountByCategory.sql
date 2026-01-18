SELECT COUNT(*) 
FROM articles 
WHERE article_category_id = $1;