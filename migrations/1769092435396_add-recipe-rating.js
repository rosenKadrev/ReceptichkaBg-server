/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = async (pgm) => {
    pgm.sql(`
        ALTER TABLE recipes
        DROP COLUMN IF EXISTS average_rating,
        DROP COLUMN IF EXISTS rating_count;
    `);

    pgm.sql(`
        ALTER TABLE recipes
        ADD COLUMN average_rating DECIMAL(2,1) DEFAULT 0 CHECK (average_rating >= 0 AND average_rating <= 5),
        ADD COLUMN rating_count INTEGER DEFAULT 0 CHECK (rating_count >= 0);
    `);

    pgm.sql(`
        DROP TABLE IF EXISTS ratings CASCADE;
        CREATE TABLE ratings (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT unique_user_recipe_rating UNIQUE(recipe_id, user_id)
        );
    `);

    pgm.sql(`
        CREATE INDEX idx_ratings_recipe_id ON ratings(recipe_id);
        CREATE INDEX idx_ratings_user_id ON ratings(user_id);
    `);
};

exports.down = (pgm) => {
    pgm.sql(`
        DROP INDEX IF EXISTS idx_ratings_recipe_id;
        DROP INDEX IF EXISTS idx_ratings_user_id;
    `);

    pgm.sql(`
        DROP TABLE IF EXISTS ratings CASCADE;
    `);

    pgm.sql(`
        ALTER TABLE recipes
        DROP COLUMN IF EXISTS average_rating,
        DROP COLUMN IF EXISTS rating_count;
    `);
};