/**
 * Static Site Generator - Generates static HTML from Express app database
 * for GitHub Pages deployment on main branch.
 *
 * Usage: node tools/static-generator.js
 * Output: ./dist/ directory with all static files
 */

const db = require('../database/connection');
const carModel = require('../models/carModel');
const testimonialModel = require('../models/testimonialModel');
const carouselModel = require('../models/carouselModel');

function getCarImage(car) {
  const primary = car.images && car.images.find(im => im.is_primary);
  if (primary) return primary.url;
  if (car.images && car.images.length > 0) return car.images[0].url;
  return '';
}
function fmtPrice(p) {
  return Number(p).toLocaleString();
}
function fmtMileage(m) {
  return Number(m).toLocaleString();
}

// ========== DATA ==========
const featuredResult = carModel.findAll({ limit: 6, page: 1 });
const newArrivalResult = carModel.findAll({ limit: 6, page: 1, newArrival: true });
const testimonials = testimonialModel.findAll(1);
const carousel = carouselModel.findAll(1);
const stats = { cars: carModel.getStats().total, countries: 59 };

// ========== INDEX.HTML ==========
function generateIndexHTML() {
  const carouselSlides = carousel.map((slide, i) => `
    <div class="carousel-slide${i === 0 ? ' active' : ''}" style="background-image: url('${slide.image_url}')">
      <div class="slide-overlay"></div>
      <div class="slide-content container">
        <h1>${escapeHtml(slide.title_zh || slide.title_en)}</h1>
        <p>${escapeHtml(slide.description_zh || slide.description_en || '')}</p>
        <a href="${slide.button_link || '/cars'}" class="btn btn-gold">${escapeHtml(slide.button_text_zh || slide.button_text_en || '立即选购')}</a>
      </div>
    </div>`).join('\n');

  function carCardHTML(car) {
    const img = getCarImage(car);
    const badges = [];
    if (car.is_featured) badges.push('<span class="badge badge-featured">精选</span>');
    if (car.is_new_arrival) badges.push('<span class="badge badge-new">新到</span>');
    return `
      <div class="car-card">
        <a href="/cars/${car.id}" class="car-card-image-link">
          ${img ? `<img class="car-card-image" src="${img}" alt="${escapeHtml(car.brand + ' ' + car.model)}" loading="lazy" width="400" height="300">`
                : `<div class="car-card-placeholder"><svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#ccc" stroke-width="1"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg></div>`}
          ${badges.join('')}
        </a>
        <div class="car-card-body">
          <a href="/cars/${car.id}" class="car-card-title">${escapeHtml(car.brand + ' ' + car.model)}</a>
          <div class="car-card-meta">
            <span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> ${car.year}年</span>
            <span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg> ${fmtMileage(car.mileage)} km</span>
            <span>${escapeHtml(car.fuel_type || '')}</span>
            <span>${escapeHtml(car.transmission || '')}</span>
          </div>
          <div class="car-card-price">¥${fmtPrice(car.price)}</div>
        </div>
      </div>`;
  }

  const featuredCards = featuredResult.data.map(carCardHTML).join('\n');
  const newArrivalCards = newArrivalResult.data.map(carCardHTML).join('\n');

  const testimonialCards = testimonials.map(t => {
    const quote = (t.quote_zh || t.quote_en || '').substring(0, 120);
    return `
      <div class="testimonial-card">
        <div class="testimonial-stars">★★★★★</div>
        <p class="testimonial-quote">"${escapeHtml(quote)}"</p>
        <div class="testimonial-author">
          ${t.image_url && !t.image_url.startsWith('data:')
            ? `<img src="${t.image_url}" alt="${escapeHtml(t.name)}" loading="lazy" width="48" height="48">`
            : `<div class="testimonial-avatar">${escapeHtml(t.name.charAt(0))}</div>`}
          <div>
            <strong>${escapeHtml(t.name)}</strong>
            <span>${escapeHtml(t.role || '')}</span>
          </div>
        </div>
      </div>`;
  }).join('\n');

  const year = new Date().getFullYear();

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="theme-color" content="#0d1117">
<title>中国二手车出口 | 中国新能源车出口 | BYD MG 比亚迪二手车 - 金霸二手车 Jinba Auto Export</title>
<meta name="description" content="金霸二手车，江西新余专业中国二手车出口平台。出口比亚迪BYD、MG名爵、问界AITO、理想Li Auto、小鹏Xpeng、蔚来NIO、奇瑞Chery、欧萌达Omoda、Jaecoo、吉利Geely、哈弗Haval、领克Lynk &amp; Co、极氪Zeekr等热门品牌。新能源电动车出口俄罗斯、中亚、中东、非洲、东南亚50+国家。Chinese used car export, China NEV/EV export.">
<meta name="keywords" content="中国二手车出口,中国新能源车出口,比亚迪出口,BYD export,BYD used cars,BYD Seal,BYD Atto 3,BYD Dolphin,BYD Song,BYD Han,MG出口,MG used cars,MG4 EV,MG ZS EV,名爵出口,问界,AITO,理想汽车,Li Auto,奇瑞出口,中国二手汽车出口,江西二手车,新余二手车,金霸二手车,China used cars,used car export China,Chinese EV export">
<meta name="author" content="Jinba Auto Export - 中国金霸二手车出口平台">
<meta name="robots" content="index, follow">
<meta name="revisit-after" content="7 days">
<link rel="canonical" href="https://jinbacars.com/">
<link rel="sitemap" type="application/xml" href="https://jinbacars.com/sitemap.xml">
<meta property="og:type" content="website">
<meta property="og:url" content="https://jinbacars.com/">
<meta property="og:title" content="中国二手车出口 | 中国新能源车出口 | BYD MG 比亚迪出口 - 金霸二手车 Jinba Auto">
<meta property="og:description" content="金霸二手车-江西新余专业中国二手车出口平台。出口比亚迪BYD、MG名爵、问界AITO、理想Li Auto、小鹏Xpeng、奇瑞Chery到全球50+国家。">
<meta property="og:locale" content="zh_CN">
<meta property="og:site_name" content="金霸二手车出口平台 - Jinba Used Cars Export">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="中国二手车出口 | 中国新能源车出口 | BYD MG 比亚迪出口 - 金霸二手车 Jinba Auto">
<meta name="twitter:description" content="金霸二手车-江西新余专业中国二手车出口。出口比亚迪BYD、MG名爵、问界AITO、理想Li Auto到50+国家。China used car & NEV export since 2016.">
<link rel="alternate" hreflang="zh" href="https://jinbacars.com/">
<link rel="alternate" hreflang="zh-CN" href="https://jinbacars.com/">
<link rel="alternate" hreflang="en" href="https://jinbacars.com/">
<link rel="alternate" hreflang="ru" href="https://jinbacars.com/">
<link rel="alternate" hreflang="ar" href="https://jinbacars.com/">
<link rel="alternate" hreflang="x-default" href="https://jinbacars.com/">
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "金霸二手车 Jinba Auto Export",
  "url": "https://jinbacars.com",
  "description": "中国专业二手车出口平台，出口中国二手车至全球50+国家"
}
</script>
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "AutoDealer",
  "name": "金霸二手车 Jinba Auto Export",
  "url": "https://jinbacars.com",
  "image": "https://jinbacars.com/images/og-image.jpg",
  "telephone": "+86-180-7908-9999",
  "address": {
    "@type": "PostalAddress",
    "addressRegion": "江西省",
    "addressLocality": "新余市"
  },
  "makesOffer": ["比亚迪 BYD", "MG 名爵", "奇瑞 Chery", "吉利 Geely", "哈弗 Haval"]
}
</script>
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "金霸二手车 - Jinba Auto Export",
  "url": "https://jinbacars.com"
}
</script>
<style>
:root {
  --color-navy: #1a1a2e;
  --color-gold: #b8860b;
  --color-gold-light: #d4a843;
  --color-dark-gray: #555;
  --color-light-gray: #e8e8e8;
  --color-white: #fff;
  --color-bg-light: #f8f7f4;
  --color-text: #333;
  --color-red: #c0392b;
  --color-green: #27ae60;
  --font-body: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans SC', sans-serif;
  --container-max: 1200px;
  --container-padding: 20px;
  --header-height: 70px;
  --radius-sm: 6px;
  --radius-lg: 12px;
  --transition-fast: 0.2s ease;
  --transition-base: 0.3s ease;
  --space-xs: 6px;
  --space-sm: 10px;
  --space-md: 16px;
  --space-lg: 24px;
  --space-xl: 32px;
}
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: var(--font-body); color: var(--color-text); background: var(--color-white); font-size: 16px; line-height: 1.6; overflow-x: hidden; }
.container { max-width: var(--container-max); margin: 0 auto; padding: 0 var(--container-padding); }
a { text-decoration: none; color: inherit; }
img { max-width: 100%; height: auto; }

/* Header */
.site-header { position: sticky; top: 0; z-index: 100; background: var(--color-white); border-bottom: 1px solid var(--color-light-gray); height: var(--header-height); }
.header-inner { display: flex; align-items: center; justify-content: space-between; height: 100%; }
.logo { display: flex; align-items: center; gap: var(--space-sm); font-weight: 700; font-size: 1.125rem; color: var(--color-navy); }
.logo svg { flex-shrink: 0; }
.main-nav { display: flex; gap: var(--space-xl); }
.main-nav a { font-size: 0.9375rem; font-weight: 500; color: var(--color-dark-gray); transition: color var(--transition-fast); position: relative; }
.main-nav a:hover, .main-nav a.active { color: var(--color-navy); }
.main-nav a::after { content: ''; position: absolute; bottom: -4px; left: 0; width: 0; height: 2px; background: var(--color-gold); transition: width var(--transition-base); }
.main-nav a:hover::after, .main-nav a.active::after { width: 100%; }
.lang-switcher { position: relative; display: inline-block; }
.lang-current { display: flex; align-items: center; gap: var(--space-xs); padding: var(--space-xs) var(--space-sm); font-size: 0.875rem; font-weight: 500; color: var(--color-dark-gray); border: 1px solid var(--color-light-gray); border-radius: var(--radius-sm); cursor: pointer; }
.lang-dropdown { display: none; position: absolute; top: 100%; right: 0; background: var(--color-white); border: 1px solid var(--color-light-gray); border-radius: var(--radius-sm); box-shadow: 0 4px 12px rgba(0,0,0,0.1); z-index: 10; min-width: 120px; }
.lang-switcher:hover .lang-dropdown { display: block; }
.lang-dropdown a { display: block; padding: 8px 16px; font-size: 0.875rem; color: var(--color-text); transition: background var(--transition-fast); }
.lang-dropdown a:hover { background: var(--color-bg-light); }
.hamburger { display: none; flex-direction: column; gap: 4px; cursor: pointer; background: none; border: none; padding: 4px; }
.hamburger span { display: block; width: 22px; height: 2px; background: var(--color-navy); transition: var(--transition-base); }

/* Hero Carousel */
.hero-carousel { position: relative; height: 600px; overflow: hidden; width: 100%; }
.carousel-track { position: relative; height: 100%; width: 100%; }
.carousel-slide { position: absolute; inset: 0; background-size: cover; background-position: center; opacity: 0; transition: opacity 0.8s ease; width: 100%; background-color: #1a1a2e; }
.carousel-slide.active { opacity: 1; z-index: 1; }
.carousel-slide:nth-child(1) { background-color: #1a1a2e; }
.carousel-slide:nth-child(2) { background-color: #16213e; }
.carousel-slide:nth-child(3) { background-color: #0f3460; }
.slide-overlay { position: absolute; inset: 0; background: linear-gradient(135deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.3) 100%); }
.slide-content { position: relative; z-index: 2; display: flex; flex-direction: column; justify-content: center; height: 100%; color: var(--color-white); padding-top: 80px; }
.slide-content h1 { font-size: 3.25rem; font-weight: 800; margin-bottom: var(--space-md); line-height: 1.2; letter-spacing: -0.02em; }
.slide-content p { font-size: 1.125rem; max-width: 600px; margin-bottom: var(--space-lg); opacity: 0.9; line-height: 1.6; }
.btn { display: inline-flex; align-items: center; gap: var(--space-sm); padding: 14px 32px; border-radius: var(--radius-sm); font-weight: 600; font-size: 0.9375rem; transition: all var(--transition-base); cursor: pointer; border: none; }
.btn-gold { background: linear-gradient(135deg, var(--color-gold), var(--color-gold-light)); color: var(--color-white); box-shadow: 0 4px 15px rgba(184,134,11,0.3); }
.btn-gold:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(184,134,11,0.4); }
.carousel-dots { position: absolute; bottom: 30px; left: 50%; transform: translateX(-50%); display: flex; gap: 10px; z-index: 3; }
.carousel-dot { width: 12px; height: 12px; border-radius: 50%; background: rgba(255,255,255,0.4); cursor: pointer; transition: all var(--transition-base); border: none; }
.carousel-dot.active { background: var(--color-gold); transform: scale(1.2); }
.carousel-arrow { position: absolute; top: 50%; transform: translateY(-50%); z-index: 3; background: rgba(0,0,0,0.5); color: var(--color-white); border: none; width: 50px; height: 50px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all var(--transition-base); }
.carousel-arrow:hover { background: rgba(184,134,11,0.8); }
.carousel-arrow.prev { left: 20px; }
.carousel-arrow.next { right: 20px; }

/* Stats Bar */
.stats-bar { background: linear-gradient(135deg, var(--color-navy) 0%, #16213e 100%); padding: 50px 0; border-top: 3px solid var(--color-gold); }
.stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: var(--space-lg); text-align: center; }
.stat-number { display: block; font-size: 2.75rem; font-weight: 800; color: var(--color-white); letter-spacing: -0.02em; }
.stat-plus { color: var(--color-gold); font-size: 2rem; }
.stat-label { display: block; font-size: 0.9375rem; color: rgba(255,255,255,0.7); margin-top: var(--space-xs); }

/* Sections */
.section { padding: 80px 0; }
.section.bg-light { background: var(--color-bg-light); }
.section-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 40px; }
.section-header h2 { font-size: 2rem; font-weight: 700; color: var(--color-navy); position: relative; padding-bottom: 12px; }
.section-header h2::after { content: ''; position: absolute; bottom: 0; left: 0; width: 40px; height: 3px; background: var(--color-gold); }
.section-header p { color: var(--color-dark-gray); margin-top: var(--space-sm); }
.link-more { display: inline-flex; align-items: center; gap: 6px; font-size: 0.9375rem; font-weight: 500; color: var(--color-gold); transition: gap var(--transition-fast); }
.link-more:hover { gap: 10px; }

/* Car Grid */
.car-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--space-lg); }
.car-card { background: var(--color-white); border-radius: var(--radius-lg); overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.06); transition: all var(--transition-base); border: 1px solid var(--color-light-gray); }
.car-card:hover { transform: translateY(-6px); box-shadow: 0 12px 30px rgba(0,0,0,0.1); border-color: var(--color-gold); }
.car-card-image-link { display: block; position: relative; width: 100%; height: 200px; overflow: hidden; }
.car-card-image { width: 100%; height: 100%; object-fit: cover; display: block; background: var(--color-bg-light); }
.car-card-placeholder { width: 100%; height: 200px; display: flex; align-items: center; justify-content: center; background: var(--color-bg-light); }
.badge { position: absolute; top: 10px; padding: 4px 12px; border-radius: 4px; font-size: 0.75rem; font-weight: 600; color: var(--color-white); z-index: 2; }
.badge-featured { left: 10px; background: var(--color-gold); }
.badge-new { right: 10px; background: var(--color-green); }
.car-card-body { padding: var(--space-md); }
.car-card-title { display: block; font-size: 1.0625rem; font-weight: 600; color: var(--color-navy); margin-bottom: var(--space-sm); line-height: 1.3; transition: color var(--transition-fast); }
.car-card-title:hover { color: var(--color-gold); }
.car-card-meta { display: flex; flex-wrap: wrap; gap: var(--space-sm); font-size: 0.8125rem; color: var(--color-dark-gray); margin-bottom: var(--space-sm); }
.car-card-meta span { display: inline-flex; align-items: center; gap: 3px; background: var(--color-bg-light); padding: 2px 8px; border-radius: 4px; }
.car-card-meta span svg { flex-shrink: 0; }
.car-card-price { font-size: 1.25rem; font-weight: 700; color: var(--color-red); }

/* Testimonials */
.testimonials-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--space-lg); }
.testimonial-card { background: var(--color-white); padding: var(--space-lg); border-radius: var(--radius-lg); border: 1px solid var(--color-light-gray); transition: all var(--transition-base); position: relative; }
.testimonial-card:hover { transform: translateY(-4px); box-shadow: 0 8px 25px rgba(0,0,0,0.08); }
.testimonial-card::before { content: '\\201C'; font-size: 4rem; color: var(--color-gold); opacity: 0.15; position: absolute; top: 10px; left: 20px; font-family: Georgia, serif; line-height: 1; }
.testimonial-stars { color: var(--color-gold); font-size: 1rem; margin-bottom: var(--space-sm); letter-spacing: 2px; }
.testimonial-quote { font-size: 0.9375rem; color: var(--color-dark-gray); margin-bottom: var(--space-md); line-height: 1.7; position: relative; z-index: 1; }
.testimonial-author { display: flex; align-items: center; gap: var(--space-sm); }
.testimonial-author img { width: 48px; height: 48px; border-radius: 50%; object-fit: cover; border: 2px solid var(--color-gold); flex-shrink: 0; }
.testimonial-avatar { width: 48px; height: 48px; border-radius: 50%; background: linear-gradient(135deg, var(--color-gold), var(--color-gold-light)); color: var(--color-white); display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 1.125rem; flex-shrink: 0; }
.testimonial-author strong { display: block; font-size: 0.9375rem; color: var(--color-navy); }
.testimonial-author span { font-size: 0.8125rem; color: var(--color-dark-gray); }

/* Trust Bar */
.trust-bar { background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #1a1a2e 100%); padding: 70px 0; }
.trust-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: var(--space-lg); }
.trust-item { text-align: center; color: var(--color-white); padding: var(--space-lg); transition: transform var(--transition-base); }
.trust-item:hover { transform: translateY(-4px); }
.trust-item svg { color: var(--color-gold); margin-bottom: var(--space-md); }
.trust-item h4 { font-size: 1.125rem; font-weight: 700; margin-bottom: var(--space-sm); }
.trust-item p { font-size: 0.875rem; color: rgba(255,255,255,0.6); line-height: 1.6; }

/* Country Grid */
.country-grid { display: grid; grid-template-columns: repeat(6, 1fr); gap: var(--space-md); }
.country-card { text-align: center; padding: var(--space-md); background: var(--color-white); border-radius: var(--radius-sm); border: 1px solid var(--color-light-gray); transition: all var(--transition-base); }
.country-card:hover { transform: translateY(-4px); box-shadow: 0 4px 15px rgba(0,0,0,0.08); }
.country-flag { display: flex; justify-content: center; }
.country-flag img { border-radius: 4px; width: 40px; height: 30px; object-fit: cover; }
.country-card h3 { font-size: 0.875rem; font-weight: 600; color: var(--color-navy); margin-top: var(--space-sm); }

/* Footer */
.site-footer { background: var(--color-navy); color: rgba(255,255,255,0.7); padding: 60px 0 30px; border-top: 3px solid var(--color-gold); }
.footer-grid { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 40px; margin-bottom: 40px; }
.footer-brand h3 { font-size: 1.25rem; font-weight: 700; color: var(--color-white); margin-bottom: var(--space-md); }
.footer-brand p { font-size: 0.875rem; line-height: 1.7; }
.footer-col h4 { font-size: 1rem; font-weight: 600; color: var(--color-white); margin-bottom: var(--space-md); padding-bottom: 8px; position: relative; }
.footer-col h4::after { content: ''; position: absolute; bottom: 0; left: 0; width: 24px; height: 2px; background: var(--color-gold); }
.footer-col a { display: block; font-size: 0.875rem; color: rgba(255,255,255,0.6); margin-bottom: var(--space-sm); transition: all var(--transition-fast); }
.footer-col a:hover { color: var(--color-gold); padding-left: 4px; }
.footer-bottom { border-top: 1px solid rgba(255,255,255,0.1); padding-top: var(--space-lg); text-align: center; font-size: 0.8125rem; color: rgba(255,255,255,0.4); }
.footer-contact { margin-top: var(--space-md); }
.footer-contact div { display: flex; align-items: center; gap: var(--space-sm); margin-bottom: var(--space-sm); font-size: 0.875rem; color: rgba(255,255,255,0.7); }
.footer-contact div svg { flex-shrink: 0; }

/* Responsive */
@media (max-width: 1024px) {
  .slide-content h1 { font-size: 2.5rem; }
  .hero-carousel { height: 480px; }
  .car-grid { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 768px) {
  .main-nav { display: none; }
  .hamburger { display: flex; }
  .stats-grid { grid-template-columns: repeat(2, 1fr); gap: var(--space-md); }
  .stat-number { font-size: 2rem; }
  .car-grid { grid-template-columns: 1fr; }
  .testimonials-grid { grid-template-columns: 1fr; }
  .trust-grid { grid-template-columns: repeat(2, 1fr); gap: var(--space-md); }
  .country-grid { grid-template-columns: repeat(3, 1fr); }
  .footer-grid { grid-template-columns: 1fr; gap: var(--space-lg); }
  .section { padding: 50px 0; }
  .section-header { flex-direction: column; align-items: flex-start; gap: var(--space-sm); }
  .hero-carousel { height: 400px; }
  .slide-content h1 { font-size: 1.75rem; }
  .slide-content p { font-size: 0.9375rem; }
  .slide-content { padding-top: 60px; }
  .carousel-arrow { width: 36px; height: 36px; }
  .carousel-arrow.prev { left: 10px; }
  .carousel-arrow.next { right: 10px; }
}
</style>
</head>
<body>

<!-- Header -->
<header class="site-header">
  <div class="container header-inner">
    <a href="/" class="logo">
      <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
        <rect width="36" height="36" rx="8" fill="#b8860b"/>
        <text x="18" y="24" text-anchor="middle" fill="white" font-weight="bold" font-size="18">J</text>
      </svg>
      金霸二手车
    </a>
    <nav class="main-nav">
      <a href="/" class="active">首页</a>
      <a href="/cars">库存车辆</a>
      <a href="/about">关于我们</a>
      <a href="/services">服务</a>
      <a href="/contact">联系我们</a>
    </nav>
    <button class="hamburger" aria-label="菜单">
      <span></span><span></span><span></span>
    </button>
    <div class="lang-switcher">
      <span class="lang-current">中文 ▾</span>
      <div class="lang-dropdown">
        <a href="/?lang=zh">中文</a>
        <a href="/?lang=en">English</a>
        <a href="/?lang=ru">Русский</a>
        <a href="/?lang=ar">العربية</a>
      </div>
    </div>
  </div>
</header>

<!-- Hero Carousel -->
<section class="hero-carousel">
  <div class="carousel-track" id="carouselTrack">
${carouselSlides}
  </div>
  <div class="carousel-dots" id="carouselDots"></div>
  <button class="carousel-arrow prev" id="carouselPrev" aria-label="上一张"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg></button>
  <button class="carousel-arrow next" id="carouselNext" aria-label="下一张"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg></button>
</section>

<!-- Stats Bar -->
<section class="stats-bar">
  <div class="container">
    <div class="stats-grid">
      <div class="stat-item"><span class="stat-number">${stats.cars}<span class="stat-plus">+</span></span><span class="stat-label">精选好车</span></div>
      <div class="stat-item"><span class="stat-number">${stats.countries}<span class="stat-plus">+</span></span><span class="stat-label">出口国家</span></div>
      <div class="stat-item"><span class="stat-number">10<span class="stat-plus">+</span></span><span class="stat-label">年行业经验</span></div>
      <div class="stat-item"><span class="stat-number">99<span class="stat-plus">%</span></span><span class="stat-label">客户满意度</span></div>
    </div>
  </div>
</section>

<!-- Featured Cars -->
<section class="section featured-cars">
  <div class="container">
    <div class="section-header">
      <h2>精选好车</h2>
      <a href="/cars" class="link-more">查看全部 →</a>
    </div>
    <div class="car-grid">
${featuredCards}
    </div>
  </div>
</section>

<!-- New Arrivals -->
<section class="section new-arrivals bg-light">
  <div class="container">
    <div class="section-header">
      <h2>最新到店</h2>
      <a href="/cars" class="link-more">查看全部 →</a>
    </div>
    <div class="car-grid">
${newArrivalCards}
    </div>
  </div>
</section>

<!-- Export Countries -->
<section class="section countries-preview">
  <div class="container">
    <div class="section-header">
      <h2>出口全球</h2>
      <p>业务覆盖50+国家和地区</p>
      <a href="/about" class="link-more">了解更多 →</a>
    </div>
    <div class="country-grid">
      <div class="country-card"><div class="country-flag"><img src="https://flagcdn.com/w80/ru.png" alt="Russia" loading="lazy" width="40" height="30"></div><h3>俄罗斯</h3></div>
      <div class="country-card"><div class="country-flag"><img src="https://flagcdn.com/w80/kz.png" alt="Kazakhstan" loading="lazy" width="40" height="30"></div><h3>哈萨克斯坦</h3></div>
      <div class="country-card"><div class="country-flag"><img src="https://flagcdn.com/w80/ae.png" alt="UAE" loading="lazy" width="40" height="30"></div><h3>阿联酋</h3></div>
      <div class="country-card"><div class="country-flag"><img src="https://flagcdn.com/w80/eg.png" alt="Egypt" loading="lazy" width="40" height="30"></div><h3>埃及</h3></div>
      <div class="country-card"><div class="country-flag"><img src="https://flagcdn.com/w80/ng.png" alt="Nigeria" loading="lazy" width="40" height="30"></div><h3>尼日利亚</h3></div>
      <div class="country-card"><div class="country-flag"><img src="https://flagcdn.com/w80/uz.png" alt="Uzbekistan" loading="lazy" width="40" height="30"></div><h3>乌兹别克斯坦</h3></div>
    </div>
  </div>
</section>

<!-- Testimonials -->
<section class="section testimonials-section bg-light">
  <div class="container">
    <div class="section-header">
      <div>
        <h2>客户评价</h2>
        <p>来自全球客户的真实反馈</p>
      </div>
    </div>
    <div class="testimonials-grid">
${testimonialCards}
    </div>
  </div>
</section>

<!-- Trust Bar -->
<section class="trust-bar">
  <div class="container">
    <div class="trust-grid">
      <div class="trust-item">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
        <h4>品质保证</h4>
        <p>每辆车经过严格检测，提供详细车况报告，确保品质无忧</p>
      </div>
      <div class="trust-item">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
        <h4>交易安全</h4>
        <p>正规合同、透明交易、专业报关清关，全程保障资金安全</p>
      </div>
      <div class="trust-item">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        <h4>快速发运</h4>
        <p>高效物流网络，覆盖中亚、中东、非洲、东南亚，快速直达</p>
      </div>
      <div class="trust-item">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
        <h4>专业团队</h4>
        <p>10+年行业经验，多语种服务团队，全程一对一无缝对接</p>
      </div>
    </div>
  </div>
</section>

<!-- Footer -->
<footer class="site-footer">
  <div class="container">
    <div class="footer-grid">
      <div class="footer-brand">
        <h3>金霸二手车 Jinba Auto Export</h3>
        <p>中国专业二手车出口平台，自2016年起为全球50+国家提供优质中国二手车及新能源车出口服务。主营比亚迪BYD、MG名爵、奇瑞Chery、吉利Geely、哈弗Haval等热门品牌。</p>
      </div>
      <div class="footer-col">
        <h4>快速链接</h4>
        <a href="/">首页</a>
        <a href="/cars">库存车辆</a>
        <a href="/about">关于我们</a>
        <a href="/services">服务</a>
        <a href="/contact">联系我们</a>
      </div>
      <div class="footer-col">
        <h4>热门品牌</h4>
        <a href="/cars?brand=比亚迪">比亚迪 BYD</a>
        <a href="/cars?brand=MG">MG 名爵</a>
        <a href="/cars?brand=奇瑞">奇瑞 Chery</a>
        <a href="/cars?brand=理想">理想 Li Auto</a>
        <a href="/cars?brand=问界">问界 AITO</a>
      </div>
      <div class="footer-col">
        <h4>联系方式</h4>
        <div class="footer-contact">
          <div><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg> +86-180-7908-9999</div>
          <div><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg> jian5222@gmail.com</div>
          <div><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg> 江西省新余市</div>
        </div>
      </div>
    </div>
    <div class="footer-bottom">
      <p>&copy; ${year} Jinba Auto Export. All rights reserved. 金霸二手车</p>
    </div>
  </div>
</footer>

<script>
(function(){
  var track = document.getElementById('carouselTrack');
  if (!track) return;
  var slides = track.querySelectorAll('.carousel-slide');
  if (slides.length === 0) return;
  var dotsContainer = document.getElementById('carouselDots');
  var prevBtn = document.getElementById('carouselPrev');
  var nextBtn = document.getElementById('carouselNext');
  var current = 0, autoTimer;

  slides.forEach(function(_, i){
    var dot = document.createElement('button');
    dot.className = 'carousel-dot' + (i === 0 ? ' active' : '');
    dot.setAttribute('aria-label', '切换到第' + (i+1) + '张');
    dot.addEventListener('click', function(){ goTo(i); });
    if (dotsContainer) dotsContainer.appendChild(dot);
  });

  function goTo(index){
    for (var s = 0; s < slides.length; s++) slides[s].classList.remove('active');
    var dots = dotsContainer ? dotsContainer.querySelectorAll('.carousel-dot') : [];
    for (var d = 0; d < dots.length; d++) dots[d].classList.remove('active');
    current = ((index % slides.length) + slides.length) % slides.length;
    slides[current].classList.add('active');
    if (dots[current]) dots[current].classList.add('active');
    resetTimer();
  }

  function nextSlide(){ goTo(current + 1); }
  function prevSlide(){ goTo(current - 1); }
  function resetTimer(){ clearInterval(autoTimer); autoTimer = setInterval(nextSlide, 5000); }

  if (prevBtn) prevBtn.addEventListener('click', prevSlide);
  if (nextBtn) nextBtn.addEventListener('click', nextSlide);
  resetTimer();
})();
</script>
</body>
</html>`;
}

function escapeHtml(str) {
  if (typeof str !== 'string') return String(str || '');
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ========== SITEMAP.XML ==========
function generateSitemap() {
  const today = new Date().toISOString().split('T')[0];
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
  <url>
    <loc>https://jinbacars.com/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
    <xhtml:link rel="alternate" hreflang="zh" href="https://jinbacars.com/"/>
    <xhtml:link rel="alternate" hreflang="en" href="https://jinbacars.com/"/>
    <xhtml:link rel="alternate" hreflang="ru" href="https://jinbacars.com/"/>
    <xhtml:link rel="alternate" hreflang="ar" href="https://jinbacars.com/"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="https://jinbacars.com/"/>
  </url>
</urlset>`;
}

// ========== CARS-DATA.JSON ==========
function generateCarsData() {
  const allCars = carModel.findAll({ limit: 200, page: 1 });
  return JSON.stringify(allCars.data.map(car => ({
    id: car.id,
    brand: car.brand,
    model: car.model,
    year: car.year,
    price: car.price,
    mileage: car.mileage,
    fuel_type: car.fuel_type,
    transmission: car.transmission,
    image: getCarImage(car),
    is_featured: car.is_featured,
    is_new_arrival: car.is_new_arrival
  })), null, 2);
}

// ========== ROBOTS.TXT ==========
function generateRobotsTxt() {
  return `User-agent: *
Allow: /
Sitemap: https://jinbacars.com/sitemap.xml

Disallow: /admin`;
}

// ========== MAIN ==========
const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, '..', 'dist');
if (!fs.existsSync(distDir)) fs.mkdirSync(distDir, { recursive: true });

const indexHTML = generateIndexHTML();
fs.writeFileSync(path.join(distDir, 'index.html'), indexHTML);
console.log('✓ index.html (' + (indexHTML.length / 1024).toFixed(0) + ' KB)');

const sitemap = generateSitemap();
fs.writeFileSync(path.join(distDir, 'sitemap.xml'), sitemap);
console.log('✓ sitemap.xml');

const carsData = generateCarsData();
fs.writeFileSync(path.join(distDir, 'cars-data.json'), carsData);
console.log('✓ cars-data.json (' + (carsData.length / 1024).toFixed(0) + ' KB)');

fs.writeFileSync(path.join(distDir, 'robots.txt'), generateRobotsTxt());
console.log('✓ robots.txt');

fs.writeFileSync(path.join(distDir, 'CNAME'), 'jinbacars.com');
console.log('✓ CNAME');

// Copy local image assets
const imageDirs = [
  { src: '../public/uploads/carousel', dst: 'uploads/carousel', ext: '.jpg' },
  { src: '../public/uploads/testimonials', dst: 'uploads/testimonials', ext: '.jpg' },
];
for (const dir of imageDirs) {
  const srcDir = path.resolve(__dirname, dir.src);
  const dstDir = path.join(distDir, dir.dst);
  if (fs.existsSync(srcDir)) {
    if (!fs.existsSync(dstDir)) fs.mkdirSync(dstDir, { recursive: true });
    const files = fs.readdirSync(srcDir).filter(f => f.endsWith(dir.ext));
    for (const file of files) {
      fs.copyFileSync(path.join(srcDir, file), path.join(dstDir, file));
    }
    console.log('✓ ' + dir.dst + '/ (' + files.length + ' files)');
  }
}

console.log('\nDone! All files generated in dist/');
