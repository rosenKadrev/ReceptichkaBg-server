const db = require('../db');
const { uploadImage, deleteImage } = require('../utils/file-helpers');
const { t } = require('../utils/translations-errors');

exports.updateUser = async (req, res) => {
    const userId = req.userId;
    const { name, gender, dateOfBirth, email } = req.body;
    let oldAvatarUrl = null;

    try {
        const currentUser = await db.getDb().query('SELECT avatar_url FROM users WHERE id = $1', [userId]);
        if (currentUser.rows.length > 0) {
            oldAvatarUrl = currentUser.rows[0].avatar_url;
        }
    } catch (err) {
        console.error(err);
        return res.status(500).json({
            message: t('error.server'),
            data: null,
            success: false
        });
    }

    if (email) {
        try {
            const existingUser = await db.getDb().query(
                'SELECT id FROM users WHERE email = $1 AND id != $2',
                [email, userId]
            );
            if (existingUser.rows.length > 0) {
                return res.status(409).json({
                    message: t('user.update.email_exists'),
                    data: null,
                    success: false
                });
            }
        } catch (err) {
            console.error(err);
            return res.status(500).json({
                message: t('error.server'),
                data: null,
                success: false
            });
        }
    }

    const fieldsToUpdate = [];
    const values = [];
    let queryIndex = 1;
    let avatarUrl = null;

    if (req.file) {
        try {
            avatarUrl = await uploadImage(req.file, userId);
        } catch (error) {
            console.error(error);
            return res.status(500).json({
                message: t('user.update.avatar_upload_error'),
                data: null,
                success: false
            });
        }
    }

    if (name) {
        fieldsToUpdate.push(`name = $${queryIndex++}`);
        values.push(name);
    }
    if (email) {
        fieldsToUpdate.push(`email = $${queryIndex++}`);
        values.push(email);
    }
    if (gender) {
        fieldsToUpdate.push(`gender = $${queryIndex++}`);
        values.push(gender);
    }
    if (dateOfBirth) {
        fieldsToUpdate.push(`date_of_birth = $${queryIndex++}`);
        values.push(dateOfBirth);
    }
    if (avatarUrl) {
        fieldsToUpdate.push(`avatar_url = $${queryIndex++}`);
        values.push(avatarUrl);
    }

    // If no fields are being updated (e.g., only an avatar was uploaded but failed, or empty request)
    if (fieldsToUpdate.length === 0) {
        return res.status(400).json({
            message: t('validation.no_fields'),
            data: null,
            success: false
        });
    }

    values.push(userId);
    const queryString = `
        UPDATE users SET ${fieldsToUpdate.join(', ')} WHERE id = $${queryIndex} 
        RETURNING 
            id,
            name,
            email,
            gender,
            username,
            CASE WHEN role = 'super_admin' THEN 'superAdmin' ELSE role END AS "role",
            avatar_url AS "avatarUrl",
            date_created AS "dateCreated",
            last_active AS "lastActive",
            date_of_birth AS "dateOfBirth",
            is_active AS "isActive"
    `;

    try {
        const result = await db.getDb().query(queryString, values);

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: t('user.not_found'),
                data: null,
                success: false
            });
        }

        if (avatarUrl && oldAvatarUrl) {
            deleteImage(oldAvatarUrl);
        }

        const updatedUser = result.rows[0];
        const userResponse = { ...updatedUser };

        res.status(200).json({
            message: t('user.update.success'),
            data: userResponse,
            success: true
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            message: t('user.update.error'),
            data: null,
            success: false
        });
    }
};

exports.getAllUsers = async (req, res) => {
    const db = require('../db').getDb();
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
                message: t('access.admin_only'),
                data: null,
                success: false,
            });
        }

        const {
            page,
            pageSize,
            name,
            email,
            gender,
            role,
            sortBy,
            sortOrder,
            createdAtFrom,
            createdAtTo
        } = req.query;

        const pageNum = parseInt(page) || 1;
        const limitNum = parseInt(pageSize) || 10;
        const offset = (pageNum - 1) * limitNum;

        const sortMappings = {
            createdAt: 'u.date_created',
            name: 'u.name',
            email: 'u.email',
            gender: 'u.gender',
            role: 'u.role',
        };
        let orderBy = 'u.date_created DESC';
        if (sortBy && sortMappings[sortBy]) {
            const direction = sortOrder === 'asc' ? 'ASC' : 'DESC';
            orderBy = `${sortMappings[sortBy]} ${direction}`;
        }

        const whereConditions = [];
        const params = [];

        if (name) {
            whereConditions.push(`(u.name ILIKE $${params.length + 1} OR u.email ILIKE $${params.length + 1})`);
            params.push(`%${name}%`);
        }
        if (email) {
            whereConditions.push(`u.email ILIKE $${params.length + 1}`);
            params.push(`%${email}%`);
        }
        if (gender) {
            whereConditions.push(`u.gender = $${params.length + 1}`);
            params.push(gender);
        }
        if (role) {
            let roleValue = role === 'superAdmin' ? 'super_admin' : role;
            whereConditions.push(`u.role = $${params.length + 1}`);
            params.push(roleValue);
        }
        if (createdAtFrom) {
            whereConditions.push(`u.date_created >= $${params.length + 1}`);
            params.push(createdAtFrom);
        }
        if (createdAtTo) {
            whereConditions.push(`u.date_created <= $${params.length + 1}`);
            params.push(createdAtTo);
        }

        whereConditions.push(`u.id <> $${params.length + 1}`);
        params.push(userId);

        const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

        const totalResult = await db.query(
            `SELECT COUNT(*) FROM users u ${whereClause}`,
            params
        );
        const totalResults = parseInt(totalResult.rows[0].count);

        const queryString = `
            SELECT 
                u.id,
                u.name,
                u.email,
                u.gender,
                CASE WHEN u.role = 'super_admin' THEN 'superAdmin' ELSE u.role END AS "role",
                u.avatar_url AS "avatarUrl",
                u.date_created AS "dateCreated"
            FROM users u
            ${whereClause}
            ORDER BY ${orderBy}
            LIMIT $${params.length + 1} OFFSET $${params.length + 2}
        `;
        const result = await db.query(queryString, [...params, limitNum, offset]);

        res.status(200).json({
            message: t('user.fetch.success'),
            data: { users: result.rows, totalResults },
            success: true
        });
    } catch (err) {
        console.error('Error fetching users:', err.message);
        res.status(500).json({
            message: t('user.fetch.error'),
            data: null,
            success: false
        });
    }
};

exports.promoteUserToAdmin = async (req, res) => {
    const dbInstance = db.getDb();
    const targetUserId = req.params.id;
    const requesterId = req.userId;

    try {
        const requester = await dbInstance.query('SELECT role FROM users WHERE id = $1', [requesterId]);
        if (
            requester.rows.length === 0 ||
            requester.rows[0].role !== 'super_admin'
        ) {
            return res.status(403).json({
                message: t('access.denied'),
                data: null,
                success: false,
            });
        }

        const result = await dbInstance.query(
            `UPDATE users SET role = 'admin' WHERE id = $1 RETURNING 
                id, name, email, gender, role, avatar_url AS "avatarUrl", date_created AS "dateCreated"`,
            [targetUserId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: t('user.promote.not_found'),
                data: null,
                success: false
            });
        }

        const user = result.rows[0];
        res.status(200).json({
            message: t('user.promote.success'),
            data: user,
            success: true
        });
    } catch (err) {
        console.error('Error promoting user:', err);
        res.status(500).json({
            message: t('user.promote.error'),
            data: null,
            success: false
        });
    }
};

exports.demoteAdminToUser = async (req, res) => {
    const dbInstance = db.getDb();
    const targetUserId = req.params.id;
    const requesterId = req.userId;

    try {
        const requester = await dbInstance.query('SELECT role FROM users WHERE id = $1', [requesterId]);
        if (
            requester.rows.length === 0 ||
            requester.rows[0].role !== 'super_admin'
        ) {
            return res.status(403).json({
                message: t('access.denied'),
                data: null,
                success: false,
            });
        }

        const result = await dbInstance.query(
            `UPDATE users SET role = 'user' WHERE id = $1 AND role = 'admin' RETURNING 
                id, name, email, gender, role, avatar_url AS "avatarUrl", date_created AS "dateCreated"`,
            [targetUserId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: t('user.demote.not_found'),
                data: null,
                success: false
            });
        }

        const user = result.rows[0];
        res.status(200).json({
            message: t('user.demote.success'),
            data: user,
            success: true
        });
    } catch (err) {
        console.error('Error demoting admin:', err);
        res.status(500).json({
            message: t('user.demote.error'),
            data: null,
            success: false
        });
    }
};

exports.adminDeleteUser = async (req, res) => {
    const dbInstance = db.getDb();
    const targetUserId = req.params.id;
    const requesterId = req.userId;

    try {
        const requester = await dbInstance.query('SELECT role FROM users WHERE id = $1', [requesterId]);
        const targetUser = await dbInstance.query('SELECT role FROM users WHERE id = $1', [targetUserId]);

        if (requester.rows.length === 0 || targetUser.rows.length === 0) {
            return res.status(404).json({
                message: t('user.not_found'),
                data: null,
                success: false,
            });
        }

        const requesterRole = requester.rows[0].role;
        const targetRole = targetUser.rows[0].role;

        const canDelete =
            (requesterRole === 'super_admin' && targetRole !== 'super_admin') ||
            (requesterRole === 'admin' && targetRole === 'user');

        if (!canDelete) {
            return res.status(403).json({
                message: t('access.cannot_delete'),
                data: null,
                success: false,
            });
        }

        const recipeImagesResult = await dbInstance.query(
            `SELECT img.image_url
             FROM recipe_images img
             JOIN recipes r ON img.recipe_id = r.id
             WHERE r.user_id = $1`,
            [targetUserId]
        );

        for (const row of recipeImagesResult.rows) {
            if (row.image_url) {
                try {
                    await deleteImage(row.image_url);
                } catch (err) {
                    console.error(`Error deleting image: ${row.image_url}`, err);
                }
            }
        }

        const deleteResult = await dbInstance.query(
            'DELETE FROM users WHERE id = $1 RETURNING id',
            [targetUserId]
        );

        if (deleteResult.rows.length === 0) {
            return res.status(404).json({
                message: 'User not found.',
                data: null,
                success: false,
            });
        }

        res.status(200).json({
            message: t('user.delete.success'),
            data: null,
            success: true
        });
    } catch (err) {
        console.error('Error deleting user:', err);
        res.status(500).json({
            message: t('user.delete.error'),
            data: null,
            success: false
        });
    }
};