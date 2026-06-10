// Import 160 cars from fetched JSON into database
const db = require('../database/connection');
const cars = require('../cars-data-fetched.json');

// Clear existing cars and images
db.prepare('DELETE FROM car_images').run();
db.prepare('DELETE FROM cars').run();
db.prepare("DELETE FROM sqlite_sequence WHERE name='cars'").run();
db.prepare("DELETE FROM sqlite_sequence WHERE name='car_images'").run();

const insertCar = db.prepare(`INSERT INTO cars (brand, model, year, price, mileage, fuel_type, transmission, is_featured, is_new_arrival, description_zh, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`);
const insertImage = db.prepare(`INSERT INTO car_images (car_id, image_url, is_primary, sort_order) VALUES (?, ?, ?, ?)`);

const insertAll = db.transaction(() => {
  for (const c of cars) {
    const desc = `${c.brand} ${c.model} ${c.year}年，${(c.mileage||0).toLocaleString()}公里，${c.fuel_type||''}，${c.transmission||''}。车辆状况良好，欢迎看车试驾。金霸二手车专业出口全球50+国家，品质保障，值得信赖。`;
    const info = insertCar.run(c.brand, c.model, c.year, c.price, c.mileage, c.fuel_type, c.transmission, c.is_featured || 0, c.is_new_arrival || 0, desc);
    const carId = info.lastInsertRowid;
    if (c.image) {
      insertImage.run(carId, c.image, 1, 0);
    }
  }
});

insertAll();
console.log(`✅ Imported ${cars.length} cars with images`);
