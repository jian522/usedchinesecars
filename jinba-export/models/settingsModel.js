const db = require('../database/connection');

const settingsModel = {
    getAll() {
        const rows = db.prepare('SELECT key, value FROM settings').all();
        const settings = {};
        for (const row of rows) {
            settings[row.key] = row.value;
        }
        return settings;
    },

    get(key) {
        const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key);
        return row ? row.value : null;
    },

    // Public subset (no sensitive keys)
    getPublic() {
        const rows = db.prepare(`SELECT key, value FROM settings WHERE key NOT LIKE 'jwt_%' AND key NOT LIKE 'admin_%'`).all();
        const settings = {};
        for (const row of rows) {
            settings[row.key] = row.value;
        }
        return settings;
    },

    set(key, value) {
        db.prepare(`
            INSERT INTO settings (key, value) VALUES (?, ?)
            ON CONFLICT(key) DO UPDATE SET value = ?, updated_at = CURRENT_TIMESTAMP
        `).run(key, value, value);
    },

    updateMany(data) {
        const stmt = db.prepare(`
            INSERT INTO settings (key, value) VALUES (?, ?)
            ON CONFLICT(key) DO UPDATE SET value = ?, updated_at = CURRENT_TIMESTAMP
        `);
        const update = db.transaction((obj) => {
            for (const [key, value] of Object.entries(obj)) {
                stmt.run(key, String(value), String(value));
            }
        });
        update(data);
    }
};

module.exports = settingsModel;
