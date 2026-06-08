/**
 * Comprehensive migration script:
 * 1. Add testimonials table
 * 2. Import 160 real Chinese brand cars
 * 3. Import 59 countries
 * 4. Import carousel slides (save base64 images to disk)
 * 5. Import testimonials (save base64 images to disk)
 * 6. Fix locale files with missing keys
 * 7. Update settings
 */
const fs = require('fs');
const path = require('path');
const db = require('./connection');

const BACKUP_PATH = 'D:/jinbacars-backup-2026-05-20.json';
const UPLOAD_DIR = path.join(__dirname, '..', 'public', 'uploads');
const CAROUSEL_DIR = path.join(UPLOAD_DIR, 'carousel');
const TESTIMONIAL_DIR = path.join(UPLOAD_DIR, 'testimonials');

console.log('=== Starting Comprehensive Migration ===\n');

// ── Load backup data ──
const backup = JSON.parse(fs.readFileSync(BACKUP_PATH, 'utf8'));
console.log(`Loaded backup: ${backup.carOverrides ? Object.keys(backup.carOverrides).length : 0} cars, ${backup.countries ? backup.countries.length : 0} countries`);

// ── Ensure directories ──
[CAROUSEL_DIR, TESTIMONIAL_DIR].forEach(dir => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// ── Helper: save base64 image to disk ──
function saveBase64Image(base64Str, dir, name) {
    const matches = base64Str.match(/^data:image\/(\w+);base64,(.+)$/);
    if (!matches) return null;
    const ext = matches[1] === 'jpeg' ? 'jpg' : matches[1];
    const buffer = Buffer.from(matches[2], 'base64');
    const filename = `${name}.${ext}`;
    fs.writeFileSync(path.join(dir, filename), buffer);
    return `/uploads/${path.basename(dir)}/${filename}`;
}

// ═══════════════════════════════════════════════
// 1. Add testimonials table
// ═══════════════════════════════════════════════
console.log('\n--- Step 1: Add Testimonials Table ---');
db.exec(`
    CREATE TABLE IF NOT EXISTS testimonials (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        role TEXT,
        quote_zh TEXT,
        quote_en TEXT,
        quote_ru TEXT,
        quote_ar TEXT,
        image_url TEXT,
        sort_order INTEGER DEFAULT 0,
        is_active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
`);
console.log('✓ testimonials table ready');

// ═══════════════════════════════════════════════
// 2. Import 160 real Chinese brand cars
// ═══════════════════════════════════════════════
console.log('\n--- Step 2: Import 160 Cars ---');

// Clear existing
db.prepare('DELETE FROM car_images').run();
db.prepare('DELETE FROM cars').run();
console.log('  Cleared existing car data');

const insertCar = db.prepare(`
    INSERT INTO cars (id, brand, model, year, price, mileage, fuel_type, transmission,
        description_zh, description_en, description_ru, description_ar,
        is_featured, is_new_arrival)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);
const insertImage = db.prepare(`
    INSERT INTO car_images (car_id, image_url, is_primary, sort_order) VALUES (?, ?, ?, ?)
`);

const importCars = db.transaction(() => {
    const entries = Object.entries(backup.carOverrides);
    let imported = 0, imageCount = 0;

    for (const [key, car] of entries) {
        const id = parseInt(key);
        const isFeatured = key <= 7010 ? 1 : 0; // first 10 are featured
        const isNewArrival = car.newArrival ? 1 : 0;
        const ft = car.fuel_type || 'Petrol';
        const transmission = ft === 'EV' || ft === 'PHEV' ? '自动' : '手动';
        const mileage = car.mileage || 0;

        insertCar.run(
            id, car.brand, car.model, car.year, car.price, mileage,
            ft, transmission,
            (car.description && car.description.zh) || '',
            (car.description && car.description.en) || '',
            (car.description && car.description.ru) || '',
            (car.description && car.description.ar) || '',
            isFeatured, isNewArrival
        );

        // Import images
        const images = backup.carImages[key];
        if (images && Array.isArray(images)) {
            images.forEach((url, idx) => {
                insertImage.run(id, url, idx === 0 ? 1 : 0, idx);
                imageCount++;
            });
        }
        imported++;
    }

    return { imported, imageCount };
});

const carResult = importCars();
console.log(`✓ Imported ${carResult.imported} cars with ${carResult.imageCount} images`);

// Verify
const carCount = db.prepare('SELECT COUNT(*) as c FROM cars').get().c;
console.log(`  DB car count: ${carCount}`);

// ═══════════════════════════════════════════════
// 3. Import 59 countries
// ═══════════════════════════════════════════════
console.log('\n--- Step 3: Import 59 Countries ---');

db.prepare('DELETE FROM countries').run();
console.log('  Cleared existing countries');

const regionMap = {
    'centralasia': 'centralasia',
    'middleeast': 'middleeast',
    'africa': 'africa',
    'europe': 'europe',
    'asia': 'asia',
    'southeastasia': 'asia',
    'southasia': 'asia',
    'eastasia': 'asia',
    'americas': 'americas',
    'southamerica': 'americas',
    'oceania': 'asia'
};

const insertCountry = db.prepare(`
    INSERT INTO countries (name_zh, name_en, name_ru, name_ar, iso_code, region,
        description_zh, description_en, trade_volume, serving_ports, popular_models)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const importCountries = db.transaction(() => {
    backup.countries.forEach((c, idx) => {
        const region = regionMap[c.region] || 'asia';
        insertCountry.run(
            c.name || '',
            c.nameEn || '',
            '', '',
            c.code || '',
            region,
            c.desc || '',
            c.descEn || '',
            '', '', ''
        );
    });
});

importCountries();
const countryCount = db.prepare('SELECT COUNT(*) as c FROM countries').get().c;
console.log(`✓ Imported ${countryCount} countries`);

// ═══════════════════════════════════════════════
// 4. Import carousel slides
// ═══════════════════════════════════════════════
console.log('\n--- Step 4: Import Carousel Slides ---');

db.prepare('DELETE FROM carousel_slides').run();
console.log('  Cleared existing carousel slides');

const insertSlide = db.prepare(`
    INSERT INTO carousel_slides (title_zh, title_en, title_ru, title_ar,
        description_zh, description_en, description_ru, description_ar,
        image_url, button_text_zh, button_text_en, button_text_ru, button_text_ar,
        button_link, sort_order)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const slides = backup.carouselData || [];
slides.forEach((slide, idx) => {
    let imageUrl = slide.image || '';

    // Save base64 image if present
    if (imageUrl.startsWith('data:')) {
        const saved = saveBase64Image(imageUrl, CAROUSEL_DIR, `slide_${idx + 1}`);
        if (saved) imageUrl = saved;
    }

    insertSlide.run(
        slide.title || ['一流品质二手车出口专家', '全球物流直达', '专业团队全程服务'][idx],
        slide.title || ['World-Class Used Car Export', 'Global Logistics', 'Professional Service Team'][idx],
        slide.title || ['Эксперт по экспорту авто', 'Глобальная логистика', 'Профессиональная команда'][idx],
        slide.title || ['خبير تصدير السيارات', 'لوجستيات عالمية', 'فريق خدمة محترف'][idx],
        slide.desc || ['精选中国品牌二手车，品质保障，全球送达', '覆盖50+国家，安全高效物流网络', '从选车到报关，一站式出口服务'][idx],
        slide.desc || ['Premium Chinese used cars with guaranteed quality', 'Shipping to 50+ countries worldwide', 'One-stop export service from selection to customs'][idx],
        slide.desc || ['Качественные авто из Китая', 'Доставка в 50+ стран', 'Полный спектр услуг'][idx],
        slide.desc || ['سيارات صينية عالية الجودة', 'شحن إلى 50+ دولة', 'خدمات تصدير متكاملة'][idx],
        imageUrl,
        slide.btnText || '了解更多', slide.btnText || 'Learn More', slide.btnText || 'Подробнее', slide.btnText || 'اعرف أكثر',
        slide.btnLink || '/cars', idx
    );
    console.log(`  Slide ${idx + 1}: ${imageUrl.substring(0, 60)}`);
});
console.log(`✓ Imported ${slides.length} carousel slides`);

// ═══════════════════════════════════════════════
// 5. Import testimonials
// ═══════════════════════════════════════════════
console.log('\n--- Step 5: Import Testimonials ---');

db.prepare('DELETE FROM testimonials').run();

const insertTestimonial = db.prepare(`
    INSERT INTO testimonials (name, role, quote_zh, quote_en, quote_ru, quote_ar, image_url, sort_order)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);

const testimonials = backup.testimonialsData || [];
testimonials.forEach((t, idx) => {
    let imageUrl = t.image || '';
    if (imageUrl.startsWith('data:')) {
        const saved = saveBase64Image(imageUrl, TESTIMONIAL_DIR, `testimonial_${idx + 1}`);
        if (saved) imageUrl = saved;
    }

    insertTestimonial.run(
        t.name || '',
        t.role || '',
        t.qz || '',
        t.qe || '',
        t.qr || '',
        t.qa || '',
        imageUrl,
        idx
    );
    console.log(`  Testimonial ${idx + 1}: ${t.name}`);
});
console.log(`✓ Imported ${testimonials.length} testimonials`);

// ═══════════════════════════════════════════════
// 6. Fix locale files - add missing keys
// ═══════════════════════════════════════════════
console.log('\n--- Step 6: Fix Locale Files ---');

const LOCALE_DIR = path.join(__dirname, '..', 'locales');

// Keys that EJS templates use but are missing from locale files
const MISSING_KEYS = {
    zh: {
        // SEO
        'meta_description': '金霸二手车 - 专业中国品牌二手车出口平台。提供比亚迪、奇瑞、长城、吉利等品牌二手车，服务全球50+国家。FOB/CIF出口，质量保障。',
        'meta_keywords': '中国二手车出口, 二手车出口商, 中国品牌二手车, 比亚迪二手车, 奇瑞二手车, 二手车出口平台, Jinba Cars, 金霸二手车',
        'site_name': '中国金霸二手车出口平台',
        'home_title': '中国金霸二手车出口平台 - 专业中国品牌二手车出口',
        'home_subtitle': '专业中国品牌二手车出口商',
        'stat_cars': '在售车辆',
        'stat_countries': '服务国家',
        'stat_years': '行业经验',
        'stat_satisfaction': '客户满意',
        'home_featured': '精选车型',
        'home_new_arrivals': '新上架车型',
        'home_countries': '全球覆盖',
        'view_all': '查看全部',
        'view_more': '查看更多',
        // Trust bar
        'trust_quality': '品质保障',
        'trust_quality_desc': '每辆车经过专业检测，车况真实透明',
        'trust_secure': '安全支付',
        'trust_secure_desc': '支持T/T、LC等多种国际支付方式',
        'trust_fast': '高效物流',
        'trust_fast_desc': '完善的国际物流网络，安全快捷送达',
        'trust_support': '全程支持',
        'trust_support_desc': '专业团队从选车到报关全程服务',
        // About page (underscore keys for template)
        'about_title': '关于我们',
        'about_subtitle': '专业中国品牌二手车出口平台',
        'about_mission': '我们的使命',
        'about_mission_text': '让全球客户轻松买到优质的中国品牌二手车，推动中国汽车品牌走向世界。',
        'about_why_us': '为什么选择金霸',
        'about_point_1': '丰富的中国品牌车源，涵盖比亚迪、奇瑞、长城、吉利等主流品牌',
        'about_point_2': '专业出口服务团队，精通报关、物流、单证全流程',
        'about_point_3': '全球物流网络，出口50+国家和地区',
        'about_point_4': '灵活的付款方式，支持FOB/CIF等多种贸易条款',
        'contact_us': '联系我们',
        // Services page (underscore keys)
        'services_title': '服务项目',
        'services_subtitle': '专业出口，全程服务',
        'svc_export_title': '车辆采购与出口',
        'svc_export_desc': '专业团队精选中国品牌二手车，严格质检，提供FOB/CIF出口服务，品质保障。',
        'svc_logistics_title': '国际物流运输',
        'svc_logistics_desc': '完善的国际物流网络，提供海运、陆运、多式联运，实时跟踪货物状态，安全送达。',
        'svc_customs_title': '报关与单证',
        'svc_customs_desc': '专业办理出口报关、商检、产地证等全套出口单证，确保合规顺利通关。',
        'svc_inspection_title': '质检与验车',
        'svc_inspection_desc': '专业检测团队逐车检测，提供详细车况报告和视频验车服务，让您远程放心购车。',
        'svc_finance_title': '金融服务',
        'svc_finance_desc': '提供T/T电汇、信用证LC等多种国际支付方式，支持贸易融资，灵活结算。',
        'svc_aftersales_title': '售后服务',
        'svc_aftersales_desc': '提供完善的售后支持，包括技术咨询、配件供应和质量问题协助处理。'
    },
    en: {
        'meta_description': 'Jinba Cars - Professional Chinese brand used car export platform. BYD, Chery, Great Wall, Geely and more. FOB/CIF export, serving 50+ countries worldwide.',
        'meta_keywords': 'Chinese used car export, used car exporter, Chinese brand cars, BYD used car, Chery used car, Jinba Cars',
        'site_name': 'China Jinba Used Car Export Platform',
        'home_title': 'China Jinba - Professional Chinese Used Car Export',
        'home_subtitle': 'Professional Chinese Used Car Exporter',
        'stat_cars': 'Cars in Stock',
        'stat_countries': 'Countries Served',
        'stat_years': 'Years Experience',
        'stat_satisfaction': 'Client Satisfaction',
        'home_featured': 'Featured Vehicles',
        'home_new_arrivals': 'New Arrivals',
        'home_countries': 'Global Reach',
        'view_all': 'View All',
        'view_more': 'View More',
        'trust_quality': 'Quality Guaranteed',
        'trust_quality_desc': 'Every vehicle professionally inspected with transparent condition reports',
        'trust_secure': 'Secure Payment',
        'trust_secure_desc': 'T/T, LC and other international payment methods accepted',
        'trust_fast': 'Fast Logistics',
        'trust_fast_desc': 'Comprehensive global logistics network for safe and fast delivery',
        'trust_support': 'Full Support',
        'trust_support_desc': 'Professional team supports you from selection to customs clearance',
        'about_title': 'About Us',
        'about_subtitle': 'Professional Chinese Used Car Export Platform',
        'about_mission': 'Our Mission',
        'about_mission_text': 'Making quality Chinese used cars accessible to global buyers and promoting Chinese automotive brands worldwide.',
        'about_why_us': 'Why Choose Jinba',
        'about_point_1': 'Extensive Chinese brand inventory: BYD, Chery, Great Wall, Geely and more',
        'about_point_2': 'Professional export team experienced in customs, logistics and documentation',
        'about_point_3': 'Global logistics network serving 50+ countries and regions',
        'about_point_4': 'Flexible payment options supporting FOB/CIF trade terms',
        'contact_us': 'Contact Us',
        'services_title': 'Our Services',
        'services_subtitle': 'Professional Export, Full Service',
        'svc_export_title': 'Vehicle Sourcing & Export',
        'svc_export_desc': 'Professional team selects quality Chinese used cars with strict inspection. FOB/CIF export services with quality guarantee.',
        'svc_logistics_title': 'International Logistics',
        'svc_logistics_desc': 'Comprehensive logistics network offering sea, land and multimodal transport with real-time tracking.',
        'svc_customs_title': 'Customs & Documentation',
        'svc_customs_desc': 'Professional export customs clearance, inspection, and full documentation for smooth shipping.',
        'svc_inspection_title': 'Inspection & Vehicle Check',
        'svc_inspection_desc': 'Detailed vehicle inspection reports and video walkthrough service for remote buyers.',
        'svc_finance_title': 'Financial Services',
        'svc_finance_desc': 'T/T wire transfer, LC and other payment methods. Trade financing available.',
        'svc_aftersales_title': 'After-Sales Support',
        'svc_aftersales_desc': 'Complete after-sales support including technical consultation and parts supply.',
        'about_h3': 'China Jinba Used Car Export Platform',
        'about_p1': 'China Jinba is a professional used car export company dedicated to providing quality vehicles and services to global customers.',
        'about_p2': 'With extensive industry experience and a professional team, we partner with major automotive brands to offer diverse vehicle selections.',
        'about_p3': 'Our services cover 50+ countries including Russia, Middle East, Africa, Central Asia, Southeast Asia, and South America.',
        'about_stat1': 'Cars in Stock',
        'about_stat2': 'Countries Served',
        'about_stat3': 'Happy Clients',
        'about_stat4': 'Years Experience',
        'services_desc': 'Complete export solutions',
        'services_s1': 'Vehicle Sourcing',
        'services_s1d': 'Professional team selects quality used cars with guaranteed condition',
        'services_s2': 'Global Logistics',
        'services_s2d': 'Comprehensive international logistics network for safe and fast delivery',
        'services_s3': 'Documentation',
        'services_s3d': 'Professional export customs clearance, inspection and certification',
        'services_s4': 'Financial Services',
        'services_s4d': 'Flexible payment options and trade financing support'
    },
    ru: {
        'meta_description': 'Jinba Cars - Профессиональная платформа экспорта подержанных автомобилей китайских брендов. BYD, Chery, Great Wall, Geely. FOB/CIF экспорт, обслуживание 50+ стран.',
        'meta_keywords': 'экспорт китайских авто, экспорт подержанных авто, китайские бренды авто, BYD, Chery, Jinba Cars',
        'site_name': 'China Jinba Экспорт Авто',
        'home_title': 'China Jinba - Профессиональный экспорт китайских авто',
        'home_subtitle': 'Профессиональный экспортер китайских авто',
        'stat_cars': 'Авто в наличии',
        'stat_countries': 'Стран',
        'stat_years': 'Лет опыта',
        'stat_satisfaction': 'Довольных клиентов',
        'home_featured': 'Рекомендуемые',
        'home_new_arrivals': 'Новые поступления',
        'home_countries': 'Глобальный охват',
        'view_all': 'Все',
        'view_more': 'Смотреть еще',
        'trust_quality': 'Гарантия качества',
        'trust_quality_desc': 'Каждый автомобиль проходит профессиональную проверку',
        'trust_secure': 'Безопасная оплата',
        'trust_secure_desc': 'T/T, LC и другие международные способы оплаты',
        'trust_fast': 'Быстрая логистика',
        'trust_fast_desc': 'Глобальная логистическая сеть для быстрой доставки',
        'trust_support': 'Полная поддержка',
        'trust_support_desc': 'Профессиональная команда поддерживает от выбора до таможни',
        'about_title': 'О нас',
        'about_subtitle': 'Профессиональная платформа экспорта китайских авто',
        'about_mission': 'Наша миссия',
        'about_mission_text': 'Сделать качественные китайские автомобили доступными для покупателей по всему миру.',
        'about_why_us': 'Почему Jinba',
        'about_point_1': 'Широкий выбор китайских брендов: BYD, Chery, Great Wall, Geely',
        'about_point_2': 'Профессиональная команда с опытом экспорта',
        'about_point_3': 'Глобальная логистика в 50+ стран',
        'about_point_4': 'Гибкие условия оплаты FOB/CIF',
        'contact_us': 'Контакты',
        'services_title': 'Услуги',
        'services_subtitle': 'Профессиональный экспорт, полный сервис',
        'svc_export_title': 'Поиск и экспорт авто',
        'svc_export_desc': 'Профессиональный подбор китайских авто с проверкой качества. FOB/CIF экспорт.',
        'svc_logistics_title': 'Международная логистика',
        'svc_logistics_desc': 'Глобальная логистическая сеть с отслеживанием грузов в реальном времени.',
        'svc_customs_title': 'Таможня и документы',
        'svc_customs_desc': 'Профессиональное оформление экспортной документации.',
        'svc_inspection_title': 'Осмотр и проверка',
        'svc_inspection_desc': 'Подробные отчеты и видеоосмотр для удаленных покупателей.',
        'svc_finance_title': 'Финансовые услуги',
        'svc_finance_desc': 'T/T перевод, LC и другие способы оплаты.',
        'svc_aftersales_title': 'Послепродажная поддержка',
        'svc_aftersales_desc': 'Техническая поддержка и поставка запчастей.'
    },
    ar: {
        'meta_description': 'Jinba Cars - منصة احترافية لتصدير السيارات الصينية المستعملة. BYD، Chery، Great Wall، Geely. تصدير FOB/CIF، خدمة 50+ دولة حول العالم.',
        'meta_keywords': 'تصدير السيارات الصينية, سيارات صينية مستعملة, BYD, Chery, Jinba Cars',
        'site_name': 'China Jinba لتصدير السيارات',
        'home_title': 'China Jinba - تصدير السيارات الصينية المستعملة',
        'home_subtitle': 'مصدر سيارات صينية محترف',
        'stat_cars': 'سيارة متاحة',
        'stat_countries': 'دولة',
        'stat_years': 'سنوات خبرة',
        'stat_satisfaction': 'رضا العملاء',
        'home_featured': 'سيارات مميزة',
        'home_new_arrivals': 'وصل حديثاً',
        'home_countries': 'انتشار عالمي',
        'view_all': 'عرض الكل',
        'view_more': 'عرض المزيد',
        'trust_quality': 'جودة مضمونة',
        'trust_quality_desc': 'كل سيارة تخضع لفحص مهني مع تقارير شفافة',
        'trust_secure': 'دفع آمن',
        'trust_secure_desc': 'T/T، LC وطرق دفع دولية أخرى مقبولة',
        'trust_fast': 'لوجستيات سريعة',
        'trust_fast_desc': 'شبكة لوجستية عالمية لتوصيل آمن وسريع',
        'trust_support': 'دعم كامل',
        'trust_support_desc': 'فريق محترف يدعمك من الاختيار إلى التخليص الجمركي',
        'about_title': 'من نحن',
        'about_subtitle': 'منصة احترافية لتصدير السيارات الصينية المستعملة',
        'about_mission': 'مهمتنا',
        'about_mission_text': 'جعل السيارات الصينية عالية الجودة في متناول المشترين worldwide.',
        'about_why_us': 'لماذا Jinba',
        'about_point_1': 'مخزون واسع من العلامات التجارية الصينية: BYD، Chery، Great Wall، Geely',
        'about_point_2': 'فريق تصدير محترف ذو خبرة في الجمارك واللوجستيات',
        'about_point_3': 'شبكة لوجستية عالمية تخدم 50+ دولة',
        'about_point_4': 'خيارات دفع مرنة تدعم شروط التجارة FOB/CIF',
        'contact_us': 'اتصل بنا',
        'services_title': 'خدماتنا',
        'services_subtitle': 'تصدير احترافي، خدمة متكاملة',
        'svc_export_title': 'توفير وتصدير السيارات',
        'svc_export_desc': 'نختار السيارات الصينية عالية الجودة مع فحص دقيق. خدمات تصدير FOB/CIF مع ضمان الجودة.',
        'svc_logistics_title': 'اللوجستيات الدولية',
        'svc_logistics_desc': 'شبكة لوجستية شاملة مع تتبع الشحنات في الوقت الفعلي.',
        'svc_customs_title': 'الجمارك والتوثيق',
        'svc_customs_desc': 'تخليص جمركي احترافي ووثائق تصدير كاملة.',
        'svc_inspection_title': 'الفحص والتفتيش',
        'svc_inspection_desc': 'تقارير فحص مفصلة وجولات فيديو للمشترين عن بعد.',
        'svc_finance_title': 'الخدمات المالية',
        'svc_finance_desc': 'تحويل T/T، LC وطرق دفع أخرى. تمويل تجاري متاح.',
        'svc_aftersales_title': 'دعم ما بعد البيع',
        'svc_aftersales_desc': 'دعم كامل بعد البيع يشمل الاستشارات الفنية وتوريد قطع الغيار.'
    }
};

// Backup and update each locale file
const LANGUAGES = ['zh', 'en', 'ru', 'ar'];
for (const lang of LANGUAGES) {
    const filePath = path.join(LOCALE_DIR, `${lang}.json`);
    const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    // Backup
    fs.writeFileSync(filePath.replace('.json', '.backup.json'), JSON.stringify(content, null, 2), 'utf8');

    // Merge missing keys
    const additions = MISSING_KEYS[lang] || {};
    let added = 0;
    for (const [key, value] of Object.entries(additions)) {
        if (!content[key]) {
            content[key] = value;
            added++;
        }
    }

    fs.writeFileSync(filePath, JSON.stringify(content, null, 4) + '\n', 'utf8');
    console.log(`  ${lang}.json: +${added} keys (backup saved)`);
}

// ═══════════════════════════════════════════════
// 7. Update settings
// ═══════════════════════════════════════════════
console.log('\n--- Step 7: Update Settings ---');

const settingsData = {
    site_name: '中国金霸二手车出口平台',
    site_name_en: 'China Jinba Used Car Export Platform',
    phone: '+86 19079086055',
    whatsapp: '+86 19079086055',
    email: 'info@jinbacars.com',
    address_zh: '中国江西省新余市',
    address_en: 'Xinyu City, Jiangxi Province, China',
    address_ru: 'Синьюй, Цзянси, Китай',
    address_ar: 'مدينة شينيو، مقاطعة جيانغشي، الصين',
    working_hours: 'Monday - Saturday, 9:00 - 18:00 (CST)'
};

const setSetting = db.prepare(`
    INSERT INTO settings (key, value) VALUES (?, ?)
    ON CONFLICT(key) DO UPDATE SET value = ?, updated_at = CURRENT_TIMESTAMP
`);

for (const [key, value] of Object.entries(settingsData)) {
    setSetting.run(key, value, value);
}
console.log('✓ Settings updated');

// ═══════════════════════════════════════════════
// Summary
// ═══════════════════════════════════════════════
console.log('\n═══════════════════════════════════════');
console.log('  Migration Complete!');
console.log(`  Cars: ${carCount}`);
console.log(`  Countries: ${countryCount}`);
console.log(`  Carousel Slides: ${slides.length}`);
console.log(`  Testimonials: ${testimonials.length}`);
console.log('═══════════════════════════════════════\n');

// Close DB
db.close();
