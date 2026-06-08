const db = require('../database/connection');

const statsModel = {
    trackPageView() {
        const today = new Date().toISOString().split('T')[0];
        db.prepare(`
            INSERT INTO page_views (visit_date, visit_count) VALUES (?, 1)
            ON CONFLICT(visit_date) DO UPDATE SET visit_count = visit_count + 1
        `).run(today);
    },

    getTraffic(days = 7) {
        const dates = [];
        for (let i = days - 1; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            dates.push(d.toISOString().split('T')[0]);
        }

        const rows = db.prepare(`
            SELECT visit_date, visit_count FROM page_views
            WHERE visit_date >= ? ORDER BY visit_date
        `).all(dates[0]);

        const map = {};
        for (const row of rows) { map[row.visit_date] = row.visit_count; }

        return dates.map(date => ({
            date,
            count: map[date] || 0,
            label: new Date(date).toLocaleDateString('zh-CN', { weekday: 'short' })
        }));
    },

    getTodayViews() {
        const today = new Date().toISOString().split('T')[0];
        const row = db.prepare('SELECT visit_count FROM page_views WHERE visit_date = ?').get(today);
        return row ? row.visit_count : 0;
    },

    getBrandDistribution() {
        return db.prepare(`
            SELECT brand, COUNT(*) as count FROM cars
            WHERE is_active = 1
            GROUP BY brand ORDER BY count DESC
        `).all();
    },

    getTopModels(limit = 10) {
        const rows = db.prepare(`
            SELECT brand, model, COUNT(*) as count FROM cars
            WHERE is_active = 1
            GROUP BY brand, model ORDER BY count DESC LIMIT ?
        `).all(limit);
        return rows.map(r => ({ label: r.brand + ' ' + r.model, count: r.count }));
    },

    getContactsTrend(days = 14) {
        const dates = [];
        for (let i = days - 1; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            dates.push(d.toISOString().split('T')[0]);
        }

        const rows = db.prepare(`
            SELECT DATE(created_at) as date, COUNT(*) as count FROM contacts
            WHERE DATE(created_at) >= ?
            GROUP BY DATE(created_at) ORDER BY date
        `).all(dates[0]);

        const map = {};
        for (const row of rows) { map[row.date] = row.count; }

        return dates.map(date => ({
            date,
            count: map[date] || 0,
            label: new Date(date).toLocaleDateString('zh-CN', { weekday: 'short' })
        }));
    },

    getContactsStats() {
        const total = db.prepare('SELECT COUNT(*) as count FROM contacts').get().count;
        const firstOfMonth = new Date();
        firstOfMonth.setDate(1);
        const rows = db.prepare(
            'SELECT COUNT(*) as count FROM contacts WHERE DATE(created_at) >= ?'
        ).get(firstOfMonth.toISOString().split('T')[0]);
        return { total, thisMonth: rows.count };
    }
};

module.exports = statsModel;
