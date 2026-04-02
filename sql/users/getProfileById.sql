SELECT
    u.id,
    u.name,
    u.email,
    u.gender,
    u.username,
    CASE WHEN u.role = 'super_admin' THEN 'superAdmin' ELSE u.role END AS "role",
    u.avatar_url AS "avatarUrl",
    u.date_created AS "dateCreated",
    u.last_active AS "lastActive",
    u.date_of_birth AS "dateOfBirth",
    u.is_active AS "isActive",
    (
        SELECT COUNT(*)
        FROM recipes r
        WHERE r.user_id = u.id AND r.status = 'active'
    ) AS "recipesCount",
    (
        SELECT json_build_object(
            'averageRating', COALESCE(ROUND(AVG(rt.rating)::numeric, 1), 0),
            'ratingCount', COUNT(rt.id)
        )
        FROM ratings rt
        INNER JOIN recipes r ON rt.recipe_id = r.id
        WHERE r.user_id = u.id
    ) AS "receivedRating"
FROM users u
WHERE u.id = $1;
