/* eslint-disable camelcase */
const bcrypt = require('bcryptjs');

exports.shorthands = undefined;

exports.up = async (pgm) => {
    // Main schema creation
    await pgm.sql(`
    -- Enable pgcrypto extension for UUID generation
    CREATE EXTENSION IF NOT EXISTS "pgcrypto";

    DROP TABLE IF EXISTS degree_of_difficulty CASCADE;
    CREATE TABLE degree_of_difficulty (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(100) UNIQUE NOT NULL,
        sort_order INTEGER NOT NULL
    );

    INSERT INTO degree_of_difficulty (name, sort_order) VALUES
    ('Лесни рецепти', 1),
    ('Средно трудни рецепти', 2),
    ('Трудни рецепти', 3),
    ('Много трудни рецепти', 4);

    DROP TABLE IF EXISTS type_of_processing CASCADE;
    CREATE TABLE type_of_processing (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(100) UNIQUE NOT NULL,
        sort_order INTEGER NOT NULL
    );

    INSERT INTO type_of_processing (name, sort_order) VALUES
    ('Без термична обработка', 1), ('Рецепти в мултикукър', 2), ('Рецепти за crock-pot', 3),
    ('Рецепти за хлебопекарна', 4), ('Ястия за бланширане', 5), ('Ястия за варене', 6),
    ('Ястия за задушаване', 7), ('Ястия за паниране', 8), ('Ястия за сотиране', 9),
    ('Ястия на микровълнова', 10), ('Ястия на пара', 11), ('Ястия на скара', 12),
    ('Ястия на тиган', 13), ('Ястия на фурна', 14);

    DROP TABLE IF EXISTS categories CASCADE;
    CREATE TABLE categories (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(100) UNIQUE NOT NULL,
        sort_order INTEGER NOT NULL
    );

    INSERT INTO categories (name, sort_order) VALUES
    ('Десерти : Бутер тесто', 1),
    ('Десерти : Други десерти', 2),
    ('Десерти : Кремове', 3),
    ('Десерти : Мъфини', 4),
    ('Десерти : Сладки и бисквити', 5),
    ('Десерти : Сладкиши', 6),
    ('Десерти : Сладолед', 7),
    ('Десерти : Торти и глазури', 8),
    ('Други : Алкохол', 9),
    ('Други : Баница', 10),
    ('Други : Бебешки храни', 11),
    ('Други : Закуски и печива', 12),
    ('Други : Коктейли', 13),
    ('Други : Млечни продукти и заместители', 14),
    ('Други : Напитки', 15),
    ('Други : Палачинки', 16),
    ('Други : Подправки и заготовки', 17),
    ('Други : Рецепти за здраве', 18),
    ('Други : Сандвичи', 19),
    ('Други : Снакс', 20),
    ('Други : Солени печива', 21),
    ('Други : Сосове', 22),
    ('Други : Хляб', 23),
    ('Основни рецепти : Гарнитури', 24),
    ('Основни рецепти : Зеленчукови ястия', 25),
    ('Основни рецепти : Морски дарове', 26),
    ('Основни рецепти : Основни ястия', 27),
    ('Основни рецепти : Паста', 28),
    ('Основни рецепти : Пица', 29),
    ('Основни рецепти : Предястия', 30),
    ('Основни рецепти : Риба', 31),
    ('Основни рецепти : Салати', 32),
    ('Основни рецепти : Сладка', 33),
    ('Основни рецепти : Туршии и зимнина', 34),
    ('Основни рецепти : Ястия с яйца', 35),
    ('Супи : Крем супи', 36),
    ('Супи : Студени супи', 37),
    ('Супи : Чорби и супи', 38),
    ('Ястия с месо : Агнешко месо', 39),
    ('Ястия с месо : Гъше месо', 40),
    ('Ястия с месо : Дивеч', 41),
    ('Ястия с месо : Заешко месо', 42),
    ('Ястия с месо : Кайма', 43),
    ('Ястия с месо : Карантия', 44),
    ('Ястия с месо : Колбаси', 45),
    ('Ястия с месо : Патешко месо', 46),
    ('Ястия с месо : Пилешко месо', 47),
    ('Ястия с месо : Пуешко месо', 48),
    ('Ястия с месо : Свинско месо', 49),
    ('Ястия с месо : Телешко месо', 50);

    DROP TABLE IF EXISTS users CASCADE;
    CREATE TABLE users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        username VARCHAR(50) UNIQUE NOT NULL,
        name VARCHAR(100),
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        gender VARCHAR(50),
        date_of_birth DATE,
        avatar_url VARCHAR(255),
        date_created TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        last_active TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        role VARCHAR(50) DEFAULT 'user' NOT NULL CHECK (role IN ('user', 'admin', 'super_admin')),
        is_active BOOLEAN DEFAULT TRUE
    );

    DROP TABLE IF EXISTS recipes CASCADE;
    CREATE TABLE password_reset_tokens (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token VARCHAR(255) UNIQUE NOT NULL,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
    
    DROP TABLE IF EXISTS recipes CASCADE;
    CREATE TABLE recipes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        category_id UUID REFERENCES categories(id),
        type_of_processing_id UUID REFERENCES type_of_processing(id),
        degree_of_difficulty_id UUID REFERENCES degree_of_difficulty(id),
        prep_time INTEGER,
        cook_time INTEGER,
        servings INTEGER,
        date_approved TIMESTAMP WITH TIME ZONE DEFAULT NULL,
        approved_by UUID DEFAULT NULL REFERENCES users(id),
        status VARCHAR(50) DEFAULT 'pending' NOT NULL CHECK (status IN ('active', 'rejected', 'pending')),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    DROP TABLE IF EXISTS recipe_images CASCADE;
    CREATE TABLE recipe_images (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
        image_url VARCHAR(255) NOT NULL,
        is_primary BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    DROP TABLE IF EXISTS ingredients CASCADE;
    CREATE TABLE ingredients (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        quantity VARCHAR(255),
        unit VARCHAR(50),
        UNIQUE(recipe_id, name)
    );

    DROP TABLE IF EXISTS instructions CASCADE;
    CREATE TABLE instructions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
        sort_order INTEGER NOT NULL,
        description TEXT NOT NULL,
        UNIQUE(recipe_id, sort_order)
    );

    DROP TABLE IF EXISTS article_categories CASCADE;
    CREATE TABLE article_categories (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(100) UNIQUE NOT NULL,
        image_url VARCHAR(255) NOT NULL,
        sort_order INTEGER NOT NULL
    );

    DROP TABLE IF EXISTS articles CASCADE;
    CREATE TABLE articles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        description TEXT,
        article_category_id UUID REFERENCES article_categories(id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        main_image_url VARCHAR(255) NOT NULL
    );

    DROP TABLE IF EXISTS article_paragraphs CASCADE;
    CREATE TABLE article_paragraphs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
        sort_order INTEGER NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        image_url VARCHAR(255) DEFAULT NULL,
        UNIQUE(article_id, sort_order)
    );

    INSERT INTO article_categories (name, image_url, sort_order) VALUES
        ('Диети','https://vyywowzscsyjgtjwxznp.supabase.co/storage/v1/object/public/receptichka_bg/article_category_avatars/dieti.png', 1),
        ('Кулинарни Съвети', 'https://vyywowzscsyjgtjwxznp.supabase.co/storage/v1/object/public/receptichka_bg/article_category_avatars/kulinarni-suveti.png', 2),
        ('Какво да Сготвя', 'https://vyywowzscsyjgtjwxznp.supabase.co/storage/v1/object/public/receptichka_bg/article_category_avatars/kakvo-da-sgotvq.png', 3),
        ('Кулинарни Новини', 'https://vyywowzscsyjgtjwxznp.supabase.co/storage/v1/object/public/receptichka_bg/article_category_avatars/kulinarni-novini.png', 4),
        ('Хранене при Здравословни Проблеми', 'https://vyywowzscsyjgtjwxznp.supabase.co/storage/v1/object/public/receptichka_bg/article_category_avatars/hranene-pri-problemi.png', 5),
        ('Диета при здравословни проблеми', 'https://vyywowzscsyjgtjwxznp.supabase.co/storage/v1/object/public/receptichka_bg/article_category_avatars/dieta-pri-problemi.png', 6),
        ('Празнична Трапеза', 'https://vyywowzscsyjgtjwxznp.supabase.co/storage/v1/object/public/receptichka_bg/article_category_avatars/praznichna-trapeza.png', 7),
        ('Кое за какво е полезно', 'https://vyywowzscsyjgtjwxznp.supabase.co/storage/v1/object/public/receptichka_bg/article_category_avatars/koe-za-kakvo-e-polezno.png', 8),
        ('Подправки', 'https://vyywowzscsyjgtjwxznp.supabase.co/storage/v1/object/public/receptichka_bg/article_category_avatars/podpravki.png', 9),
        ('Билки', 'https://vyywowzscsyjgtjwxznp.supabase.co/storage/v1/object/public/receptichka_bg/article_category_avatars/bilki.png', 10),
        ('Витамини', 'https://vyywowzscsyjgtjwxznp.supabase.co/storage/v1/object/public/receptichka_bg/article_category_avatars/vitamini.png', 11),
        ('Минерали', 'https://vyywowzscsyjgtjwxznp.supabase.co/storage/v1/object/public/receptichka_bg/article_category_avatars/minerali.png', 12),
        ('Аминокиселини', 'https://vyywowzscsyjgtjwxznp.supabase.co/storage/v1/object/public/receptichka_bg/article_category_avatars/aminokiselini.png', 13),
        ('Хранителни Добавки', 'https://vyywowzscsyjgtjwxznp.supabase.co/storage/v1/object/public/receptichka_bg/article_category_avatars/hranitelni-dobavki.png', 14),
        ('Плодове', 'https://vyywowzscsyjgtjwxznp.supabase.co/storage/v1/object/public/receptichka_bg/article_category_avatars/plodove.png', 15),
        ('Зеленчуци', 'https://vyywowzscsyjgtjwxznp.supabase.co/storage/v1/object/public/receptichka_bg/article_category_avatars/zelenchuci.png', 16),
        ('Млечни Продукти', 'https://vyywowzscsyjgtjwxznp.supabase.co/storage/v1/object/public/receptichka_bg/article_category_avatars/mlechni-produkti.png', 17),
        ('Меса и Колбаси', 'https://vyywowzscsyjgtjwxznp.supabase.co/storage/v1/object/public/receptichka_bg/article_category_avatars/mesa-i-kolbasi.png', 18),
        ('Хранителни Продукти', 'https://vyywowzscsyjgtjwxznp.supabase.co/storage/v1/object/public/receptichka_bg/article_category_avatars/hranitelni-produkti.png', 19),
        ('Риба и Морски Дарове', 'https://vyywowzscsyjgtjwxznp.supabase.co/storage/v1/object/public/receptichka_bg/article_category_avatars/riba-i-morski-darove.png', 20),
        ('Бобови и Зърнени Продукти', 'https://vyywowzscsyjgtjwxznp.supabase.co/storage/v1/object/public/receptichka_bg/article_category_avatars/bobovi-i-zurneni.png', 21),
        ('Консерванти и Е-та', 'https://vyywowzscsyjgtjwxznp.supabase.co/storage/v1/object/public/receptichka_bg/article_category_avatars/konservanti-i-eta.png', 22),
        ('Ядки и Семена', 'https://vyywowzscsyjgtjwxznp.supabase.co/storage/v1/object/public/receptichka_bg/article_category_avatars/qdki-i-semena.png', 23),
        ('Любопитно', 'https://vyywowzscsyjgtjwxznp.supabase.co/storage/v1/object/public/receptichka_bg/article_category_avatars/lubopitno.png', 24),
        ('Хормоните', 'https://vyywowzscsyjgtjwxznp.supabase.co/storage/v1/object/public/receptichka_bg/article_category_avatars/hormoni.png', 25),
        ('Видове Алкохол', 'https://vyywowzscsyjgtjwxznp.supabase.co/storage/v1/object/public/receptichka_bg/article_category_avatars/vidove-alkohol.png', 26),
        ('Сортове Вина', 'https://vyywowzscsyjgtjwxznp.supabase.co/storage/v1/object/public/receptichka_bg/article_category_avatars/sortove-vina.png', 27),
        ('Видове Гъби', 'https://vyywowzscsyjgtjwxznp.supabase.co/storage/v1/object/public/receptichka_bg/article_category_avatars/vidove-gubi.png', 28);
    `);

    const hashedPassword = await bcrypt.hash('121212a', 12);
    await pgm.sql(`
        INSERT INTO users (username, name, email, password, gender, date_of_birth, role) 
        VALUES (
            'roro_901',
            'Rosen Kadrev',
            'roro.910102@gmail.com',
            '${hashedPassword}',
            'male',
            '1991-01-02',
            'super_admin'
        );
    `);
};

exports.down = (pgm) => {
    pgm.sql(`
    DROP TABLE IF EXISTS instructions CASCADE;
    DROP TABLE IF EXISTS ingredients CASCADE;
    DROP TABLE IF EXISTS recipe_images CASCADE;
    DROP TABLE IF EXISTS recipes CASCADE;
    DROP TABLE IF EXISTS users CASCADE;
    DROP TABLE IF EXISTS categories CASCADE;
    DROP TABLE IF EXISTS type_of_processing CASCADE;
    DROP TABLE IF EXISTS degree_of_difficulty CASCADE;
    DROP TABLE IF EXISTS articles CASCADE;
    DROP TABLE IF EXISTS article_paragraphs CASCADE;
    DROP TABLE IF EXISTS article_categories CASCADE;
    DROP TABLE IF EXISTS password_reset_tokens CASCADE;
  `);
};