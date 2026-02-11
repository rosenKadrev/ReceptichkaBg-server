/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = async (pgm) => {
    pgm.sql(`
        DROP TABLE IF EXISTS favorites CASCADE;
    `);

    pgm.sql(`
        CREATE TABLE favorites (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT unique_user_recipe_favorite UNIQUE(recipe_id, user_id)
        );
    `);

    pgm.sql(`
        CREATE INDEX idx_favorites_recipe_id ON favorites(recipe_id);
        CREATE INDEX idx_favorites_user_id ON favorites(user_id);
        CREATE INDEX idx_favorites_created_at ON favorites(created_at);
    `);
};

exports.down = (pgm) => {
    pgm.sql(`
        DROP INDEX IF EXISTS idx_favorites_recipe_id;
        DROP INDEX IF EXISTS idx_favorites_user_id;
        DROP INDEX IF EXISTS idx_favorites_created_at;
    `);

    pgm.sql(`
        DROP TABLE IF EXISTS favorites CASCADE;
    `);
};