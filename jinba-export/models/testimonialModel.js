const db = require('../database/connection');

const testimonialModel = {
    findAll(active = 1) {
        let where = active ? 'WHERE is_active = 1' : '';
        return db.prepare(`SELECT * FROM testimonials ${where} ORDER BY sort_order`).all();
    },

    findById(id) {
        return db.prepare('SELECT * FROM testimonials WHERE id = ?').get(id);
    },

    create(data) {
        const { name, role, quote_zh, quote_en, quote_ru, quote_ar, image_url } = data;
        const maxOrder = db.prepare('SELECT MAX(sort_order) as m FROM testimonials').get();
        const order = (maxOrder?.m || 0) + 1;
        const result = db.prepare(`
            INSERT INTO testimonials (name, role, quote_zh, quote_en, quote_ru, quote_ar, image_url, sort_order)
            VALUES (?,?,?,?,?,?,?,?)
        `).run(name, role, quote_zh, quote_en, quote_ru, quote_ar, image_url, order);
        return result.lastInsertRowid;
    },

    update(id, data) {
        const { name, role, quote_zh, quote_en, quote_ru, quote_ar, image_url, is_active } = data;
        db.prepare(`
            UPDATE testimonials SET name=?, role=?, quote_zh=?, quote_en=?, quote_ru=?, quote_ar=?,
                image_url=?, is_active=? WHERE id=?
        `).run(name, role, quote_zh, quote_en, quote_ru, quote_ar, image_url,
               is_active !== undefined ? is_active : 1, id);
    },

    delete(id) {
        db.prepare('DELETE FROM testimonials WHERE id = ?').run(id);
    }
};

module.exports = testimonialModel;
