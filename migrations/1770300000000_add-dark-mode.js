/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
    pgm.sql(`
        ALTER TABLE users ADD COLUMN IF NOT EXISTS dark_mode BOOLEAN NOT NULL DEFAULT FALSE;
    `);
};

exports.down = (pgm) => {
    pgm.sql(`
        ALTER TABLE users DROP COLUMN IF EXISTS dark_mode;
    `);
};
