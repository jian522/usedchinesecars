require('dotenv').config();
const app = require('./app');
const db = require('./database/connection');
const fs = require('fs');
const path = require('path');

// Auto-run schema on startup
const schemaPath = path.join(__dirname, 'database', 'schema.sql');
const schema = fs.readFileSync(schemaPath, 'utf-8');
db.exec(schema);

// One-time migration: add car_model column for databases created before schema was updated
try { db.exec("ALTER TABLE contacts ADD COLUMN car_model TEXT DEFAULT ''"); } catch(e) { /* column already exists */ }

// Auto-seed if no users exist
const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
if (userCount.count === 0) {
    console.log('No users found. Running seed...');
    require('./database/seed');
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Jinba Export running at http://localhost:${PORT}`);
});
