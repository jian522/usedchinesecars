const db = require('../database/connection');

function computeIsNew(car) {
    if (car && car.created_at) {
        const created = new Date(car.created_at.replace(' ', 'T'));
        const days = (Date.now() - created.getTime()) / (1000 * 60 * 60 * 24);
        car.is_new_arrival = days <= 14 ? 1 : 0;
    }
    return car;
}

const carModel = {
    findAll({ keyword, brand, fuel, transmission, maxPrice, minPrice, minYear, featured, newArrival, page = 1, limit = 20, active = 1 }) {
        let where = active !== undefined ? 'WHERE c.is_active = ?' : 'WHERE 1=1';
        const params = active !== undefined ? [active] : [];

        if (keyword) { where += ' AND (c.brand LIKE ? OR c.model LIKE ?)'; params.push(`%${keyword}%`, `%${keyword}%`); }
        if (brand) { where += ' AND c.brand = ?'; params.push(brand); }
        if (fuel) { where += ' AND c.fuel_type = ?'; params.push(fuel); }
        if (transmission) { where += ' AND c.transmission = ?'; params.push(transmission); }
        if (maxPrice) { where += ' AND c.price <= ?'; params.push(parseInt(maxPrice)); }
        if (minPrice) { where += ' AND c.price >= ?'; params.push(parseInt(minPrice)); }
        if (minYear) { where += ' AND c.year >= ?'; params.push(parseInt(minYear)); }
        if (featured) { where += ' AND c.is_featured = 1'; }
        if (newArrival) { where += ' AND c.is_new_arrival = 1'; }

        const countSql = `SELECT COUNT(*) as total FROM cars c ${where}`;
        const total = db.prepare(countSql).get(...params).total;

        const offset = (page - 1) * limit;
        const sql = `
            SELECT c.*,
                (SELECT json_group_array(json_object('id', ci.id, 'url', ci.image_url, 'is_primary', ci.is_primary))
                 FROM car_images ci WHERE ci.car_id = c.id ORDER BY ci.sort_order) as images
            FROM cars c ${where}
            ORDER BY c.updated_at DESC
            LIMIT ? OFFSET ?
        `;
        const cars = db.prepare(sql).all(...params, limit, offset);

        return {
            data: cars.map(c => computeIsNew({ ...c, images: JSON.parse(c.images || '[]') })),
            total,
            page,
            totalPages: Math.ceil(total / limit)
        };
    },

    findById(id) {
        const car = db.prepare(`
            SELECT c.*,
                (SELECT json_group_array(json_object('id', ci.id, 'url', ci.image_url, 'is_primary', ci.is_primary))
                 FROM car_images ci WHERE ci.car_id = c.id ORDER BY ci.sort_order) as images
            FROM cars c WHERE c.id = ?
        `).get(id);

        if (!car) return null;
        return computeIsNew({ ...car, images: JSON.parse(car.images || '[]') });
    },

    getBrands() {
        return db.prepare('SELECT DISTINCT brand FROM cars WHERE is_active = 1 ORDER BY brand').all();
    },

    create(data) {
        const { brand, model, year, price, mileage, fuel_type, transmission,
                description_zh, description_en, description_ru, description_ar,
                is_featured, is_new_arrival } = data;

        const result = db.prepare(`
            INSERT INTO cars (brand, model, year, price, mileage, fuel_type, transmission,
                description_zh, description_en, description_ru, description_ar,
                is_featured, is_new_arrival)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)
        `).run(brand, model, year, price, mileage || 0, fuel_type, transmission || '自动',
               description_zh, description_en, description_ru, description_ar,
               is_featured || 0, is_new_arrival || 0);

        return result.lastInsertRowid;
    },

    update(id, data) {
        const { brand, model, year, price, mileage, fuel_type, transmission,
                description_zh, description_en, description_ru, description_ar,
                is_featured, is_new_arrival, is_active } = data;

        db.prepare(`
            UPDATE cars SET brand=?, model=?, year=?, price=?, mileage=?, fuel_type=?, transmission=?,
                description_zh=?, description_en=?, description_ru=?, description_ar=?,
                is_featured=?, is_new_arrival=?, is_active=?, updated_at=CURRENT_TIMESTAMP
            WHERE id=?
        `).run(brand, model, year, price, mileage || 0, fuel_type, transmission || '自动',
               description_zh, description_en, description_ru, description_ar,
               is_featured || 0, is_new_arrival || 0, is_active !== undefined ? is_active : 1, id);
    },

    delete(id) {
        // Soft delete
        db.prepare('UPDATE cars SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(id);
    },

    addImage(carId, imageUrl, isPrimary = 0) {
        const maxOrder = db.prepare('SELECT MAX(sort_order) as m FROM car_images WHERE car_id = ?').get(carId);
        const order = (maxOrder?.m || 0) + 1;
        db.prepare('INSERT INTO car_images (car_id, image_url, is_primary, sort_order) VALUES (?,?,?,?)')
            .run(carId, imageUrl, isPrimary, order);
    },

    removeImages(carId) {
        db.prepare('DELETE FROM car_images WHERE car_id = ?').run(carId);
    },

    getStats() {
        return db.prepare('SELECT COUNT(*) as total FROM cars WHERE is_active = 1').get();
    }
};

module.exports = carModel;
