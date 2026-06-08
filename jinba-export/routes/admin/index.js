const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { requireAuth } = require('../../middleware/auth');
const upload = require('../../middleware/upload');

// Admin routes bypass the main layout (they have their own full HTML structure)
router.use((req, res, next) => {
    const _render = res.render.bind(res);
    res.render = (view, options, callback) => {
        if (typeof options === 'object') {
            options = { ...options, layout: false };
        } else {
            options = { layout: false };
        }
        _render(view, options, callback);
    };
    next();
});

const carModel = require('../../models/carModel');
const countryModel = require('../../models/countryModel');
const carouselModel = require('../../models/carouselModel');
const testimonialModel = require('../../models/testimonialModel');
const contactModel = require('../../models/contactModel');
const settingsModel = require('../../models/settingsModel');
const userModel = require('../../models/userModel');
const statsModel = require('../../models/statsModel');

// ── Login ──────────────────────────────────────────

router.get('/login', (req, res) => {
    if (req.user) return res.redirect('/admin/dashboard');
    res.render('admin/login', { error: null });
});

router.post('/login', (req, res) => {
    const { username, password } = req.body;
    const user = userModel.findByUsername(username);
    if (!user || !userModel.verifyPassword(user, password)) {
        return res.render('admin/login', { error: 'Invalid credentials' });
    }
    const token = jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '24h' });
    res.cookie('token', token, { httpOnly: true, maxAge: 24 * 60 * 60 * 1000 });
    res.redirect('/admin/dashboard');
});

router.get('/logout', (req, res) => {
    res.clearCookie('token');
    res.redirect('/admin/login');
});

// ── Dashboard ──────────────────────────────────────

router.get('/', requireAuth, (req, res) => { res.redirect('/admin/dashboard'); });

router.get('/dashboard', requireAuth, (req, res) => {
    const carCount = carModel.getStats().total;
    const countryCount = countryModel.getStats().total;
    const unreadContacts = contactModel.getUnreadCount().count;
    const traffic = statsModel.getTraffic(7);
    const todayViews = statsModel.getTodayViews();
    const brandDistribution = statsModel.getBrandDistribution();
    const topModels = statsModel.getTopModels(10);
    const contactsTrend = statsModel.getContactsTrend(14);
    const contactsStats = statsModel.getContactsStats();

    res.render('admin/dashboard', { carCount, countryCount, unreadContacts, traffic, todayViews, brandDistribution, topModels, contactsTrend, contactsStats });
});

// ── Cars CRUD ──────────────────────────────────────

router.get('/cars', requireAuth, (req, res) => {
    const { page = 1 } = req.query;
    const cars = carModel.findAll({ active: undefined, page: parseInt(page), limit: 20 });
    res.render('admin/cars', { cars });
});

router.get('/cars/new', requireAuth, (req, res) => {
    res.render('admin/car_form', { car: null });
});

router.get('/cars/:id/edit', requireAuth, (req, res) => {
    const car = carModel.findById(req.params.id);
    if (!car) return res.redirect('/admin/cars');
    res.render('admin/car_form', { car });
});

// API
router.post('/api/cars', requireAuth, upload.array('images', 10), (req, res) => {
    const id = carModel.create(req.body);
    if (req.files) {
        req.files.forEach((f, i) => {
            carModel.addImage(id, '/uploads/' + f.filename, i === 0 ? 1 : 0);
        });
    }
    res.json({ success: true, id });
});

router.put('/api/cars/:id', requireAuth, (req, res) => {
    carModel.update(req.params.id, req.body);
    res.json({ success: true });
});

router.delete('/api/cars/:id', requireAuth, (req, res) => {
    carModel.delete(req.params.id);
    res.json({ success: true });
});

router.post('/api/cars/:id/images', requireAuth, upload.single('image'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file' });
    carModel.addImage(req.params.id, '/uploads/' + req.file.filename);
    res.json({ success: true, url: '/uploads/' + req.file.filename });
});

router.delete('/api/cars/:id/images', requireAuth, (req, res) => {
    carModel.removeImages(req.params.id);
    res.json({ success: true });
});

router.post('/api/cars/import', requireAuth, upload.single('csv'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No CSV file' });
    const fs = require('fs');
    const { parse } = require('csv-parse/sync');
    const content = fs.readFileSync(req.file.path, 'utf-8');
    const records = parse(content, { columns: true, skip_empty_lines: true });
    let imported = 0;
    for (const row of records) {
        if (row.brand && row.model) {
            carModel.create(row);
            imported++;
        }
    }
    fs.unlinkSync(req.file.path);
    res.json({ success: true, imported });
});

// ── Countries CRUD ─────────────────────────────────

router.get('/countries', requireAuth, (req, res) => {
    const countries = countryModel.findAll({ active: undefined });
    res.render('admin/countries', { countries });
});

router.get('/countries/new', requireAuth, (req, res) => {
    res.render('admin/country_form', { country: null });
});

router.get('/countries/:id/edit', requireAuth, (req, res) => {
    const country = countryModel.findById(req.params.id);
    if (!country) return res.redirect('/admin/countries');
    res.render('admin/country_form', { country });
});

router.post('/api/countries', requireAuth, (req, res) => {
    const id = countryModel.create(req.body);
    res.json({ success: true, id });
});

router.put('/api/countries/:id', requireAuth, (req, res) => {
    countryModel.update(req.params.id, req.body);
    res.json({ success: true });
});

router.delete('/api/countries/:id', requireAuth, (req, res) => {
    countryModel.delete(req.params.id);
    res.json({ success: true });
});

// ── Carousel CRUD ──────────────────────────────────

router.get('/carousel', requireAuth, (req, res) => {
    const slides = carouselModel.findAll(0);
    res.render('admin/carousel', { slides });
});

router.get('/carousel/new', requireAuth, (req, res) => {
    res.render('admin/carousel_form', { slide: null });
});

router.get('/carousel/:id/edit', requireAuth, (req, res) => {
    const slide = carouselModel.findById(req.params.id);
    if (!slide) return res.redirect('/admin/carousel');
    res.render('admin/carousel_form', { slide });
});

router.post('/api/carousel', requireAuth, upload.single('image'), (req, res) => {
    const data = { ...req.body };
    if (req.file) data.image_url = '/uploads/' + req.file.filename;
    const id = carouselModel.create(data);
    res.json({ success: true, id });
});

router.put('/api/carousel/:id', requireAuth, upload.single('image'), (req, res) => {
    const data = { ...req.body };
    if (req.file) data.image_url = '/uploads/' + req.file.filename;
    carouselModel.update(req.params.id, data);
    res.json({ success: true });
});

router.delete('/api/carousel/:id', requireAuth, (req, res) => {
    carouselModel.delete(req.params.id);
    res.json({ success: true });
});

router.post('/api/carousel/reorder', requireAuth, (req, res) => {
    carouselModel.reorder(req.body.ids);
    res.json({ success: true });
});

// ── Testimonials CRUD ────────────────────────────────

router.get('/testimonials', requireAuth, (req, res) => {
    const testimonials = testimonialModel.findAll(0);
    res.render('admin/testimonials', { testimonials });
});

router.get('/testimonials/new', requireAuth, (req, res) => {
    res.render('admin/testimonial_form', { testimonial: null });
});

router.get('/testimonials/:id/edit', requireAuth, (req, res) => {
    const testimonial = testimonialModel.findById(req.params.id);
    if (!testimonial) return res.redirect('/admin/testimonials');
    res.render('admin/testimonial_form', { testimonial });
});

router.post('/api/testimonials', requireAuth, upload.single('image'), (req, res) => {
    const data = { ...req.body };
    if (req.file) data.image_url = '/uploads/' + req.file.filename;
    const id = testimonialModel.create(data);
    res.json({ success: true, id });
});

router.put('/api/testimonials/:id', requireAuth, upload.single('image'), (req, res) => {
    const data = { ...req.body };
    if (req.file) data.image_url = '/uploads/' + req.file.filename;
    testimonialModel.update(req.params.id, data);
    res.json({ success: true });
});

router.delete('/api/testimonials/:id', requireAuth, (req, res) => {
    testimonialModel.delete(req.params.id);
    res.json({ success: true });
});

// ── Settings ───────────────────────────────────────

router.get('/settings', requireAuth, (req, res) => {
    const settings = settingsModel.getAll();
    res.render('admin/settings', { settings });
});

router.post('/api/settings', requireAuth, (req, res) => {
    settingsModel.updateMany(req.body);
    res.json({ success: true });
});

// ── Contacts ───────────────────────────────────────

router.get('/contacts', requireAuth, (req, res) => {
    const { page = 1, unread } = req.query;
    const result = contactModel.findAll({ page: parseInt(page), limit: 20, unreadOnly: unread === '1' });
    res.render('admin/contacts', result);
});

router.post('/api/contacts/:id/read', requireAuth, (req, res) => {
    contactModel.markRead(req.params.id);
    res.json({ success: true });
});

router.delete('/api/contacts/:id', requireAuth, (req, res) => {
    contactModel.delete(req.params.id);
    res.json({ success: true });
});

// ── Profile / Password ─────────────────────────────

router.post('/api/change-password', requireAuth, (req, res) => {
    const { oldPassword, newPassword } = req.body;
    const result = userModel.changePassword(req.user.username, oldPassword, newPassword);
    res.json(result);
});

module.exports = router;
