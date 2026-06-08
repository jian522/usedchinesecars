const db = require('../database/connection');

const carouselModel = {
    findAll(active = 1) {
        let where = active ? 'WHERE is_active = 1' : '';
        return db.prepare(`SELECT * FROM carousel_slides ${where} ORDER BY sort_order`).all();
    },

    findById(id) {
        return db.prepare('SELECT * FROM carousel_slides WHERE id = ?').get(id);
    },

    create(data) {
        const { title_zh, title_en, title_ru, title_ar,
                description_zh, description_en, description_ru, description_ar,
                image_url, button_text_zh, button_text_en, button_text_ru, button_text_ar,
                button_link, sort_order } = data;

        const maxOrder = db.prepare('SELECT MAX(sort_order) as m FROM carousel_slides').get();
        const order = sort_order !== undefined ? sort_order : (maxOrder?.m || 0) + 1;

        const result = db.prepare(`
            INSERT INTO carousel_slides (title_zh, title_en, title_ru, title_ar,
                description_zh, description_en, description_ru, description_ar,
                image_url, button_text_zh, button_text_en, button_text_ru, button_text_ar,
                button_link, sort_order)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
        `).run(title_zh, title_en, title_ru, title_ar,
               description_zh, description_en, description_ru, description_ar,
               image_url, button_text_zh, button_text_en, button_text_ru, button_text_ar,
               button_link, order);

        return result.lastInsertRowid;
    },

    update(id, data) {
        const { title_zh, title_en, title_ru, title_ar,
                description_zh, description_en, description_ru, description_ar,
                image_url, button_text_zh, button_text_en, button_text_ru, button_text_ar,
                button_link, sort_order, is_active } = data;

        db.prepare(`
            UPDATE carousel_slides SET
                title_zh=?, title_en=?, title_ru=?, title_ar=?,
                description_zh=?, description_en=?, description_ru=?, description_ar=?,
                image_url=?, button_text_zh=?, button_text_en=?, button_text_ru=?, button_text_ar=?,
                button_link=?, sort_order=?, is_active=?
            WHERE id=?
        `).run(title_zh, title_en, title_ru, title_ar,
               description_zh, description_en, description_ru, description_ar,
               image_url, button_text_zh, button_text_en, button_text_ru, button_text_ar,
               button_link, sort_order, is_active !== undefined ? is_active : 1, id);
    },

    delete(id) {
        db.prepare('DELETE FROM carousel_slides WHERE id = ?').run(id);
    },

    reorder(ids) {
        const stmt = db.prepare('UPDATE carousel_slides SET sort_order = ? WHERE id = ?');
        const update = db.transaction((idList) => {
            for (let i = 0; i < idList.length; i++) {
                stmt.run(i, idList[i]);
            }
        });
        update(ids);
    }
};

module.exports = carouselModel;
