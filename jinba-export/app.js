const express = require('express');
const path = require('path');
const helmet = require('helmet');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const i18n = require('./middleware/i18n');
const { auth } = require('./middleware/auth');

const app = express();

// Security & performance
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://d3js.org", "https://unpkg.com", "https://www.googletagmanager.com", "https://www.google-analytics.com"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            imgSrc: ["'self'", "https:", "data:"],
            connectSrc: ["'self'", "https://www.google-analytics.com", "https://analytics.google.com"],
        }
    },
    crossOriginEmbedderPolicy: false
}));
app.use(compression());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Static files
app.use(express.static(path.join(__dirname, 'public'), {
    maxAge: process.env.NODE_ENV === 'production' ? '7d' : 0
}));

// i18n middleware (before routes)
app.use(i18n);

// JWT auth (populates req.user)
app.use(auth);

// Make req and unreadContacts available in all views
app.use((req, res, next) => {
    res.locals.req = req;
    try {
        const contactModel = require('./models/contactModel');
        res.locals.unreadContacts = contactModel.getUnreadCount().count;
    } catch (err) {
        res.locals.unreadContacts = 0;
    }
    next();
});

// Load public settings into res.locals for all views
app.use((req, res, next) => {
    try {
        const settingsModel = require('./models/settingsModel');
        res.locals.settings = settingsModel.getPublic();
    } catch (err) {
        res.locals.settings = {};
    }
    next();
});

// View engine with layouts
const expressLayouts = require('express-ejs-layouts');
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);
app.set('layout', 'layouts/main');

// Health check for deployment platforms (Railway/Render)
app.get('/health', (req, res) => res.status(200).json({ status: 'ok' }));

// Routes
const pagesRouter = require('./routes/pages');
const adminRouter = require('./routes/admin');

app.use('/', pagesRouter);
app.use('/admin', adminRouter);

// 404
app.use((req, res) => {
    if (req.path.startsWith('/api/') || req.path.startsWith('/admin/api/')) {
        return res.status(404).json({ error: 'Not found' });
    }
    res.locals.title = '404';
    res.status(404).render('pages/404');
});

// Error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    if (req.path.startsWith('/api/') || req.path.startsWith('/admin/api/')) {
        return res.status(500).json({ error: 'Internal server error' });
    }
    res.locals.title = res.locals.__ ? res.locals.__('error_title') : 'Error';
    res.status(500).render('pages/error');
});

module.exports = app;
