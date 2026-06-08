const locales = {
    zh: require('../locales/zh.json'),
    en: require('../locales/en.json'),
    ru: require('../locales/ru.json'),
    ar: require('../locales/ar.json')
};

const fallback = 'zh';

function i18n(req, res, next) {
    // Detect language: query param > cookie > Accept-Language header > fallback
    let lang = req.query.lang || req.cookies.lang;

    if (!lang && req.headers['accept-language']) {
        const al = req.headers['accept-language'];
        if (al.includes('zh')) lang = 'zh';
        else if (al.includes('ru')) lang = 'ru';
        else if (al.includes('ar')) lang = 'ar';
        else if (al.includes('en')) lang = 'en';
    }

    lang = lang || fallback;
    if (!locales[lang]) lang = fallback;

    req.lang = lang;
    res.locals.lang = lang;
    res.locals.locale = locales[lang];

    // RTL for Arabic
    res.locals.dir = lang === 'ar' ? 'rtl' : 'ltr';
    res.locals.htmlLang = lang === 'ar' ? 'ar' : (lang === 'ru' ? 'ru' : (lang === 'en' ? 'en' : 'zh-CN'));

    // Translation helper for EJS: <%= __('key') %>
    res.locals.__ = function(key) {
        return (locales[lang] && locales[lang][key]) || (locales[fallback] && locales[fallback][key]) || key;
    };

    next();
}

module.exports = i18n;
