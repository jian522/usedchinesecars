-- Users (admin accounts)
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Cars
CREATE TABLE IF NOT EXISTS cars (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    brand TEXT NOT NULL,
    model TEXT NOT NULL,
    year INTEGER NOT NULL CHECK(year >= 1990 AND year <= 2030),
    price INTEGER NOT NULL,
    mileage INTEGER DEFAULT 0,
    fuel_type TEXT NOT NULL DEFAULT '汽油',
    transmission TEXT DEFAULT '自动',
    description_zh TEXT,
    description_en TEXT,
    description_ru TEXT,
    description_ar TEXT,
    is_featured INTEGER DEFAULT 0,
    is_new_arrival INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS car_images (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    car_id INTEGER NOT NULL REFERENCES cars(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    is_primary INTEGER DEFAULT 0,
    sort_order INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_cars_brand ON cars(brand);
CREATE INDEX IF NOT EXISTS idx_cars_year ON cars(year);
CREATE INDEX IF NOT EXISTS idx_cars_price ON cars(price);
CREATE INDEX IF NOT EXISTS idx_cars_fuel ON cars(fuel_type);
CREATE INDEX IF NOT EXISTS idx_cars_featured ON cars(is_featured);
CREATE INDEX IF NOT EXISTS idx_car_images_car_id ON car_images(car_id);

-- Countries (service countries)
CREATE TABLE IF NOT EXISTS countries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name_zh TEXT NOT NULL,
    name_en TEXT NOT NULL,
    name_ru TEXT,
    name_ar TEXT,
    iso_code TEXT UNIQUE NOT NULL,
    region TEXT NOT NULL DEFAULT 'asia',
    flag_svg TEXT,
    trade_volume TEXT,
    serving_ports TEXT,
    popular_models TEXT,
    description_zh TEXT,
    description_en TEXT,
    description_ru TEXT,
    description_ar TEXT,
    centroid_lat REAL,
    centroid_lng REAL,
    is_active INTEGER DEFAULT 1,
    sort_order INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Carousel Slides
CREATE TABLE IF NOT EXISTS carousel_slides (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title_zh TEXT,
    title_en TEXT,
    title_ru TEXT,
    title_ar TEXT,
    description_zh TEXT,
    description_en TEXT,
    description_ru TEXT,
    description_ar TEXT,
    image_url TEXT NOT NULL,
    button_text_zh TEXT,
    button_text_en TEXT,
    button_text_ru TEXT,
    button_text_ar TEXT,
    button_link TEXT DEFAULT 'cars',
    sort_order INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Settings key-value store
CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key TEXT UNIQUE NOT NULL,
    value TEXT NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Contact form submissions
CREATE TABLE IF NOT EXISTS contacts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    message TEXT NOT NULL,
    preferred_lang TEXT DEFAULT 'zh',
    car_model TEXT DEFAULT '',
    is_read INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Page views tracking
CREATE TABLE IF NOT EXISTS page_views (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    visit_date TEXT NOT NULL,
    visit_count INTEGER DEFAULT 0,
    UNIQUE(visit_date)
);
