const jwt = require('jsonwebtoken');

function auth(req, res, next) {
    const token = req.cookies?.token || req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
        return next(); // set req.user to undefined, routes decide
    }

    try {
        req.user = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
        req.user = undefined;
    }
    next();
}

function requireAuth(req, res, next) {
    if (!req.user) {
        if (req.path.startsWith('/api/')) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        return res.redirect('/admin/login');
    }
    next();
}

module.exports = { auth, requireAuth };
