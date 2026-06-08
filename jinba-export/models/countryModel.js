const db = require('../database/connection');

const countryModel = {
    findAll({ region, active = 1 } = {}) {
        let where = active !== undefined ? 'WHERE is_active = ?' : 'WHERE 1=1';
        const params = active !== undefined ? [active] : [];

        if (region && region !== 'all') { where += ' AND region = ?'; params.push(region); }

        return db.prepare(`SELECT * FROM countries ${where} ORDER BY sort_order, name_en`).all(...params);
    },

    findById(id) {
        return db.prepare('SELECT * FROM countries WHERE id = ?').get(id);
    },

    findByCode(isoCode) {
        return db.prepare('SELECT * FROM countries WHERE iso_code = ?').get(isoCode);
    },

    getRegions() {
        return db.prepare('SELECT DISTINCT region FROM countries WHERE is_active = 1 ORDER BY region').all();
    },

    create(data) {
        const { name_zh, name_en, name_ru, name_ar, iso_code, region,
                trade_volume, serving_ports, popular_models,
                description_zh, description_en, description_ru, description_ar,
                centroid_lat, centroid_lng } = data;

        const result = db.prepare(`
            INSERT INTO countries (name_zh, name_en, name_ru, name_ar, iso_code, region,
                trade_volume, serving_ports, popular_models,
                description_zh, description_en, description_ru, description_ar,
                centroid_lat, centroid_lng)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
        `).run(name_zh, name_en, name_ru, name_ar, iso_code.toUpperCase(), region,
               trade_volume, serving_ports, popular_models,
               description_zh, description_en, description_ru, description_ar,
               centroid_lat, centroid_lng);

        return result.lastInsertRowid;
    },

    update(id, data) {
        const { name_zh, name_en, name_ru, name_ar, iso_code, region,
                trade_volume, serving_ports, popular_models,
                description_zh, description_en, description_ru, description_ar,
                centroid_lat, centroid_lng, is_active } = data;

        db.prepare(`
            UPDATE countries SET name_zh=?, name_en=?, name_ru=?, name_ar=?, iso_code=?, region=?,
                trade_volume=?, serving_ports=?, popular_models=?,
                description_zh=?, description_en=?, description_ru=?, description_ar=?,
                centroid_lat=?, centroid_lng=?, is_active=?, updated_at=CURRENT_TIMESTAMP
            WHERE id=?
        `).run(name_zh, name_en, name_ru, name_ar, iso_code.toUpperCase(), region,
               trade_volume, serving_ports, popular_models,
               description_zh, description_en, description_ru, description_ar,
               centroid_lat, centroid_lng, is_active !== undefined ? is_active : 1, id);
    },

    delete(id) {
        db.prepare('DELETE FROM countries WHERE id = ?').run(id);
    },

    getStats() {
        return db.prepare('SELECT COUNT(*) as total FROM countries WHERE is_active = 1').get();
    }
};

module.exports = countryModel;
