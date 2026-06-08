const express = require('express');
const router = express.Router();
const db = require('../database/connection');
const carModel = require('../models/carModel');
const countryModel = require('../models/countryModel');
const carouselModel = require('../models/carouselModel');
const testimonialModel = require('../models/testimonialModel');
const contactModel = require('../models/contactModel');
const settingsModel = require('../models/settingsModel');
const statsModel = require('../models/statsModel');
const rateLimit = require('express-rate-limit');

// ── Pages ──────────────────────────────────────────

router.get('/', (req, res) => {
    const featured = carModel.findAll({ featured: true, limit: 6, page: 1 });
    const newArrivals = carModel.findAll({ newArrival: true, limit: 6, page: 1 });
    const carousel = carouselModel.findAll(1);
    const testimonials = testimonialModel.findAll(1);
    const countries = countryModel.findAll({ active: 1 });
    const settings = settingsModel.getPublic();
    const stats = { totalCars: carModel.getStats().total, totalCountries: countryModel.getStats().total };
    res.locals.title = res.locals.__('home_title');
    res.locals.extraJS = '<script src="/js/carousel.js"></script>';

    res.render('pages/home', { featured: featured.data, newArrivals: newArrivals.data, carousel, testimonials, countries, settings, stats });
});

router.get('/cars', (req, res) => {
    const { keyword, brand, fuel, transmission, maxPrice, minPrice, minYear, page = 1 } = req.query;
    const result = carModel.findAll({ keyword, brand, fuel, transmission, maxPrice, minPrice, minYear, page: parseInt(page), limit: 12 });
    const brands = carModel.getBrands();
    const transmissions = db.prepare('SELECT DISTINCT transmission FROM cars WHERE is_active = 1 ORDER BY transmission').all();
    res.locals.title = res.locals.__('cars_title');

    res.render('pages/cars', { cars: result, brands, transmissions, filters: req.query });
});

router.get('/cars/:id', (req, res) => {
    const car = carModel.findById(req.params.id);
    if (!car || !car.is_active) return res.redirect('/cars');
    const title = car.brand + ' ' + car.model;
    res.locals.title = title;

    // Meta description — concat Chinese and English descriptions as fallback
    const desc = (car.description_en || car.description_zh || '').replace(/<[^>]*>/g, '').substring(0, 160);
    const priceText = car.price ? (res.locals.__('currency_symbol') + Number(car.price).toLocaleString()) : '';
    res.locals.metaDescription = `${title} - ${priceText} | ${res.locals.__('cars_subtitle')}`;
    res.locals.ogTitle = title;
    res.locals.ogDescription = desc || `${title} - ${priceText}`;
    res.locals.ogImage = car.images?.[0]?.url || '';
    res.locals.ogUrl = `https://jinbacars.com/cars/${car.id}`;
    res.locals.canonicalUrl = `https://jinbacars.com/cars/${car.id}`;
    res.locals.extraCSS = '<link rel="stylesheet" href="/css/lightbox.css">';
    res.locals.extraJS = '<script src="/js/inquiry.js"></script><script src="/js/lightbox.js"></script>';

    const related = carModel.findAll({ brand: car.brand, limit: 4, page: 1 }).data.filter(c => c.id !== car.id);

    res.render('pages/car_detail', { car, related });
});

router.get('/about', (req, res) => {
    const settings = settingsModel.getPublic();
    const testimonials = testimonialModel.findAll(1);
    const stats = { totalCars: carModel.getStats().total, totalCountries: countryModel.getStats().total };
    res.locals.title = res.locals.__('about_title');
    res.render('pages/about', { settings, testimonials, stats });
});

router.get('/services', (req, res) => {
    res.locals.title = res.locals.__('services_title');
    res.render('pages/services');
});

router.get('/contact', (req, res) => {
    res.locals.title = res.locals.__('contact_title');
    res.render('pages/contact');
});

// ── SEO Routes ─────────────────────────────────────

router.get('/robots.txt', (req, res) => {
    res.type('text/plain');
    res.send('User-agent: *\nAllow: /\nSitemap: https://jinbacars.com/sitemap.xml\n');
});

router.get('/sitemap.xml', (req, res) => {
    const baseUrl = 'https://jinbacars.com';
    const staticPages = ['/', '/cars', '/about', '/services', '/contact'];
    const cars = db.prepare('SELECT id, brand, model, updated_at FROM cars WHERE is_active = 1 ORDER BY id').all();

    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    staticPages.forEach(path => {
        xml += `  <url><loc>${baseUrl}${path}</loc><changefreq>weekly</changefreq><priority>${path === '/' ? '1.0' : '0.8'}</priority></url>\n`;
    });

    cars.forEach(car => {
        xml += `  <url><loc>${baseUrl}/cars/${car.id}</loc><lastmod>${car.updated_at ? car.updated_at.substring(0, 10) : ''}</lastmod><changefreq>weekly</changefreq><priority>0.6</priority></url>\n`;
    });

    xml += '</urlset>';
    res.header('Content-Type', 'application/xml');
    res.send(xml);
});

// ── Public API ─────────────────────────────────────

router.get('/api/cars', (req, res) => {
    const { brand, fuel, maxPrice, minYear, featured, newArrival, page = 1, limit = 12 } = req.query;
    const result = carModel.findAll({ brand, fuel, maxPrice, minYear, featured, newArrival, page: parseInt(page), limit: parseInt(limit) });
    res.json(result);
});

router.get('/api/cars/:id', (req, res) => {
    const car = carModel.findById(req.params.id);
    if (!car) return res.status(404).json({ error: 'Not found' });
    res.json(car);
});

router.get('/api/countries', (req, res) => {
    const { region } = req.query;
    const countries = countryModel.findAll({ region });
    res.json(countries);
});

router.get('/api/carousel', (req, res) => {
    const slides = carouselModel.findAll(1);
    res.json(slides);
});

router.get('/api/testimonials', (req, res) => {
    const testimonials = testimonialModel.findAll(1);
    res.json(testimonials);
});

router.get('/api/settings/public', (req, res) => {
    res.json(settingsModel.getPublic());
});

const contactLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: { error: 'Too many requests. Please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
});

router.post('/api/contacts', contactLimiter, (req, res) => {
    // Honeypot check — if bot filled the hidden field, silently accept
    if (req.body.website) {
        return res.json({ success: true });
    }
    const { name, email, phone, message, preferred_lang, car_model } = req.body;
    if (!name || !email || !message) {
        return res.status(400).json({ error: 'Name, email and message are required' });
    }
    contactModel.create({ name, email, phone, message, preferred_lang, car_model });
    res.json({ success: true });
});

router.post('/api/pageview', (req, res) => {
    statsModel.trackPageView();
    res.json({ success: true });
});

module.exports = router;
