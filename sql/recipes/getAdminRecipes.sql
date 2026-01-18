SELECT 
   r.id,
   r.user_id AS "userId",
   COALESCE(u.name, u.username) AS "createdBy",
   r.name,
   r.description,
   c.name AS "category",
   tp.name AS "typeOfProcessing",
   dd.name AS "degreeOfDifficulty",
   r.prep_time AS "prepTime",
   r.cook_time AS "cookTime",
   r.servings,
   r.date_approved AS "dateApproved",
   r.approved_by AS "approvedBy",
   r.status,
   r.created_at AS "createdAt",
   r.updated_at AS "updatedAt",
   (
     SELECT COALESCE(
       json_agg(
         json_build_object(
           'id', i.id,
           'name', i.name,
           'quantity', i.quantity,
           'unit', i.unit
         )
         ORDER BY i.name
       ),
       '[]'::json
     )
     FROM ingredients i
     WHERE i.recipe_id = r.id
   ) AS ingredients,
   (
     SELECT COALESCE(
       json_agg(
         json_build_object(
           'id', ins.id,
           'sortOrder', ins.sort_order,
           'description', ins.description
         )
         ORDER BY ins.sort_order
       ),
       '[]'::json
     )
     FROM instructions ins
     WHERE ins.recipe_id = r.id
   ) AS instructions,
   (
     SELECT COALESCE(
       json_agg(
         json_build_object(
           'id', img.id,
           'imageUrl', img.image_url,
           'isPrimary', img.is_primary,
           'createdAt', img.created_at
         )
         ORDER BY img.created_at
       ),
       '[]'::json
     )
     FROM recipe_images img
     WHERE img.recipe_id = r.id
   ) AS images
FROM recipes r
LEFT JOIN users u ON u.id = r.user_id
LEFT JOIN categories c ON c.id = r.category_id
LEFT JOIN type_of_processing tp ON tp.id = r.type_of_processing_id
LEFT JOIN degree_of_difficulty dd ON dd.id = r.degree_of_difficulty_id
{whereClause}
ORDER BY {orderBy}
LIMIT {limitParam} OFFSET {offsetParam}