const db = require('../database/connection');

const contactModel = {
    findAll({ page = 1, limit = 20, unreadOnly } = {}) {
        let where = 'WHERE 1=1';
        const params = [];
        if (unreadOnly) { where += ' AND is_read = 0'; }

        const total = db.prepare(`SELECT COUNT(*) as total FROM contacts ${where}`).get(...params).total;
        const offset = (page - 1) * limit;

        const contacts = db.prepare(`
            SELECT * FROM contacts ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?
        `).all(...params, limit, offset);

        return { data: contacts, total, page, totalPages: Math.ceil(total / limit) };
    },

    create(data) {
        const { name, email, phone, message, preferred_lang, car_model } = data;
        const result = db.prepare(`
            INSERT INTO contacts (name, email, phone, message, preferred_lang, car_model)
            VALUES (?,?,?,?,?,?)
        `).run(name, email, phone, message, preferred_lang || 'zh', car_model || '');
        return result.lastInsertRowid;
    },

    delete(id) {
        db.prepare('DELETE FROM contacts WHERE id = ?').run(id);
    },

    markRead(id) {
        db.prepare('UPDATE contacts SET is_read = 1 WHERE id = ?').run(id);
    },

    getUnreadCount() {
        return db.prepare('SELECT COUNT(*) as count FROM contacts WHERE is_read = 0').get();
    }
};

module.exports = contactModel;
