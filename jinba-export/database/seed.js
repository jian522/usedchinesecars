const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const db = require('./connection');
const bcrypt = require('bcryptjs');

// Run schema
const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
db.exec(schema);

console.log('Schema applied.');

// Check if already seeded
const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
if (userCount.count > 0) {
    console.log('Already seeded. Skipping.');
    process.exit(0);
}

// Seed admin user
const hash = bcrypt.hashSync('admin123', 10);
db.prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)').run('admin', hash);

// Seed cars
const cars = [
    {brand:'Toyota',model:'Camry',year:2019,price:18500,mileage:45000,fuel_type:'汽油',description_zh:'丰田凯美瑞，全球畅销中型轿车，动力充沛，油耗低，内饰精致。',description_en:'Toyota Camry, globally popular mid-size sedan, powerful and fuel-efficient.',description_ru:'Toyota Camry, популярный среднеразмерный седан, мощный, экономичный.',description_ar:'تويوتا كامري، سيارة سيدان متوسطة شائعة عالمياً، اقتصادية.',is_new_arrival:1},
    {brand:'Honda',model:'Accord',year:2018,price:17200,mileage:52000,fuel_type:'汽油',description_zh:'本田雅阁，日系中型轿车标杆，操控精准，空间宽敞。',description_en:'Honda Accord, benchmark mid-size sedan, precise handling, spacious.',description_ru:'Honda Accord, эталонный седан, точное управление, просторный.',description_ar:'هوندا أكورد، سيارة سيدان ممتازة، قيادة دقيقة، واسعة.',is_new_arrival:1},
    {brand:'Volkswagen',model:'Passat',year:2020,price:19800,mileage:38000,fuel_type:'汽油',description_zh:'大众帕萨特，德系品质代表，底盘扎实，高速稳定。',description_en:'VW Passat, German quality, solid chassis, stable at high speed.',description_ru:'VW Passat, немецкое качество, устойчивый, богатая комплектация.',description_ar:'فولكسفاغن باسات، جودة ألمانية، ثابتة، مجهزة جيداً.',is_new_arrival:1},
    {brand:'BMW',model:'5 Series',year:2017,price:28500,mileage:65000,fuel_type:'汽油',description_zh:'宝马5系，豪华商务轿车典范，驾驶乐趣与舒适并重。',description_en:'BMW 5 Series, luxury business sedan, driving pleasure meets comfort.',description_ru:'BMW 5 серии, роскошный бизнес-седан, удовольствие от вождения.',description_ar:'بي إم دبليو الفئة 5، سيدان فاخرة، متعة القيادة والراحة.',is_featured:1},
    {brand:'Mercedes-Benz',model:'E-Class',year:2019,price:32000,mileage:42000,fuel_type:'汽油',description_zh:'奔驰E级，豪华轿车标杆，内饰奢华，科技配置领先。',description_en:'Mercedes E-Class, luxury sedan benchmark, advanced tech.',description_ru:'Mercedes E-класс, эталон роскоши, передовые технологии.',description_ar:'مرسيدس الفئة E، سيدان فاخرة، تقنيات متقدمة.',is_featured:1},
    {brand:'Audi',model:'A6',year:2018,price:26800,mileage:48000,fuel_type:'汽油',description_zh:'奥迪A6，科技感十足的豪华轿车，quattro四驱系统。',description_en:'Audi A6, tech-focused luxury sedan, quattro AWD.',description_ru:'Audi A6, технологичный седан, quattro, отличный дизайн.',description_ar:'أودي A6، سيدان فاخرة بتقنيات متقدمة، نظام quattro.',is_featured:1},
    {brand:'Nissan',model:'X-Trail',year:2018,price:16500,mileage:55000,fuel_type:'汽油',description_zh:'日产奇骏，紧凑型SUV销量王，空间大，舒适性好。',description_en:'Nissan X-Trail, best-selling compact SUV, spacious and comfortable.',description_ru:'Nissan X-Trail, популярный SUV, просторный, комфортный.',description_ar:'نيسان إكس-تريل، SUV مبيعات عالية، واسعة ومريحة.',is_new_arrival:1},
    {brand:'Hyundai',model:'Tucson',year:2019,price:17800,mileage:41000,fuel_type:'汽油',description_zh:'现代途胜，高性价比SUV，配置丰富，外观时尚。',description_en:'Hyundai Tucson, high value SUV, well-equipped, stylish design.',description_ru:'Hyundai Tucson, отличный SUV, богатая комплектация.',description_ar:'هيونداي توسان، SUV قيمة عالية، مجهزة وأناقة.'},
    {brand:'Kia',model:'Sportage',year:2017,price:15200,mileage:68000,fuel_type:'汽油',description_zh:'起亚智跑，颜值与实力并存，设计获奖，性价比突出。',description_en:'Kia Sportage, award-winning design, great value.',description_ru:'Kia Sportage, дизайн-победитель, отличная комплектация.',description_ar:'كيا سبورتاج، تصميم حائز جوائز، قيمة ممتازة.'},
    {brand:'Ford',model:'Focus',year:2020,price:14200,mileage:35000,fuel_type:'汽油',description_zh:'福特福克斯，操控之王，驾驶乐趣十足。',description_en:'Ford Focus, king of handling, fun to drive.',description_ru:'Ford Focus, король управляемости, отличная настройка шасси.',description_ar:'فورد فوكوس، ملك التحكم، قيادة ممتعة.'},
    {brand:'Chevrolet',model:'Cruze',year:2018,price:12800,mileage:58000,fuel_type:'汽油',description_zh:'雪佛兰科鲁兹，美系紧凑轿车，动力强劲，安全性高。',description_en:'Chevrolet Cruze, American compact sedan, powerful and safe.',description_ru:'Chevrolet Cruze, американский седан, мощный, безопасный.',description_ar:'شيفروليه كروز، سيدان أمريكية، قوية وآمنة.',is_new_arrival:1},
    {brand:'Mazda',model:'6',year:2019,price:16800,mileage:44000,fuel_type:'汽油',description_zh:'马自达6，魂动设计美学，操控精准，创驰蓝天技术。',description_en:'Mazda 6, Kodo design, Skyactiv technology, fuel-efficient.',description_ru:'Mazda 6, дизайн Kodo, технология Skyactiv, экономичный.',description_ar:'مازدا 6، تصميم Kodo، تقنية Skyactiv، اقتصادية.',is_featured:1},
    {brand:'Lexus',model:'ES300h',year:2018,price:29800,mileage:39000,fuel_type:'混动',description_zh:'雷克萨斯ES300h，豪华混动轿车，静谧舒适，品质可靠。',description_en:'Lexus ES300h, luxury hybrid sedan, quiet and reliable.',description_ru:'Lexus ES300h, роскошный гибрид, тихий, комфортный.',description_ar:'لكزس ES300h، سيدان هجينة فاخرة، هادئة وموثوقة.',is_featured:1},
    {brand:'Subaru',model:'Forester',year:2019,price:19200,mileage:46000,fuel_type:'汽油',description_zh:'斯巴鲁森林人，全时四驱SUV，安全性能卓越。',description_en:'Subaru Forester, AWD SUV, excellent safety.',description_ru:'Subaru Forester, полный привод, оппозитный двигатель.',description_ar:'سوبارو فورستر، SUV بدفع رباعي، محرك بوكسر، آمنة.',is_new_arrival:1},
    {brand:'Volvo',model:'XC60',year:2017,price:24500,mileage:62000,fuel_type:'汽油',description_zh:'沃尔沃XC60，北欧豪华SUV，安全环保，简约设计。',description_en:'Volvo XC60, Nordic luxury SUV, safety leader.',description_ru:'Volvo XC60, скандинавский SUV, лидер безопасности.',description_ar:'فولفو XC60، SUV فاخرة، الأكثر أماناً، تصميم بسيط.'},
    {brand:'Tesla',model:'Model 3',year:2020,price:35800,mileage:28000,fuel_type:'电动',description_zh:'特斯拉Model 3，纯电动智能轿车，自动驾驶辅助。',description_en:'Tesla Model 3, pure electric smart sedan, autopilot.',description_ru:'Tesla Model 3, электромобиль, автопилот.',description_ar:'تيسلا موديل 3، سيارة كهربائية ذكية، مساعد ذاتي.',is_featured:1},
    {brand:'Land Rover',model:'Discovery Sport',year:2018,price:32500,mileage:54000,fuel_type:'汽油',description_zh:'路虎发现运动版，英伦豪华SUV，越野能力出众。',description_en:'Land Rover Discovery Sport, outstanding off-road capability.',description_ru:'Land Rover Discovery Sport, отличная проходимость.',description_ar:'لاند روفر ديسكفري سبورت، SUV بريطانية فاخرة.'},
    {brand:'Peugeot',model:'3008',year:2019,price:17500,mileage:43000,fuel_type:'汽油',description_zh:'标致3008，法式设计SUV，i-Cockpit座舱科技感强。',description_en:'Peugeot 3008, French design SUV, i-Cockpit tech-forward.',description_ru:'Peugeot 3008, французский SUV, i-Cockpit.',description_ar:'بيجو 3008، SUV فرنسي التصميم، i-Cockpit.'}
];

const insertCar = db.prepare(`INSERT INTO cars (brand,model,year,price,mileage,fuel_type,description_zh,description_en,description_ru,description_ar,is_featured,is_new_arrival) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`);
const insertImage = db.prepare(`INSERT INTO car_images (car_id, image_url, is_primary, sort_order) VALUES (?,?,?,?)`);

const carImages = [
    'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=600',
    'https://images.unsplash.com/photo-1606611013016-969c19ba27d5?w=600',
    'https://images.unsplash.com/photo-1609521263047-f8f205293f24?w=600',
    'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=600',
    'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=600',
    'https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?w=600',
    'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=600',
    'https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=600',
    'https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=600',
    'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=600',
    'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=600',
    'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=600',
    'https://images.unsplash.com/photo-1542362567-b07e54358753?w=600',
    'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=600',
    'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=600',
    'https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=600',
    'https://images.unsplash.com/photo-1619767886558-efdc259cde1a?w=600',
    'https://images.unsplash.com/photo-1606016159991-dfe4f2746ad5?w=600'
];

const insertMany = db.transaction(() => {
    for (let i = 0; i < cars.length; i++) {
        const c = cars[i];
        const result = insertCar.run(c.brand,c.model,c.year,c.price,c.mileage,c.fuel_type,c.description_zh,c.description_en,c.description_ru,c.description_ar,c.is_featured,c.is_new_arrival);
        insertImage.run(result.lastInsertRowid, carImages[i] || 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=600', 1, 0);
    }
});

insertMany();
console.log(`Seeded ${cars.length} cars.`);

// Seed countries with enhanced data
const countries = [
    {name_zh:'俄罗斯',name_en:'Russia',name_ru:'Россия',name_ar:'روسيا',iso_code:'RU',region:'europe',trade_volume:'1,200+ units/year',serving_ports:'Shanghai to Vladivostok, Tianjin to St. Petersburg',popular_models:'Toyota Camry, Honda CR-V, BMW X5',centroid_lat:61.5240,centroid_lng:105.3188,description_zh:'俄罗斯是中国二手车最大出口目的国，远东地区需求尤为旺盛。',description_en:'Russia is the largest destination for Chinese used car exports, especially Far East regions.'},
    {name_zh:'阿联酋',name_en:'UAE',name_ru:'ОАЭ',name_ar:'الإمارات',iso_code:'AE',region:'middleeast',trade_volume:'800+ units/year',serving_ports:'Shanghai to Dubai, Guangzhou to Abu Dhabi',popular_models:'Mercedes S-Class, BMW 7 Series, Lexus LX',centroid_lat:23.4241,centroid_lng:53.8478,description_zh:'迪拜是中东最大汽车转口中心，辐射海湾及东非市场。',description_en:'Dubai is the largest auto re-export hub in the Middle East.'},
    {name_zh:'沙特阿拉伯',name_en:'Saudi Arabia',name_ru:'Саудовская Аравия',name_ar:'السعودية',iso_code:'SA',region:'middleeast',trade_volume:'650+ units/year',serving_ports:'Shanghai to Jeddah, Guangzhou to Dammam',popular_models:'Toyota Land Cruiser, Nissan Patrol, Hyundai Tucson',centroid_lat:23.8859,centroid_lng:45.0792,description_zh:'海湾地区最大汽车消费市场，SUV和皮卡需求强劲。',description_en:'Largest auto consumer in the Gulf, strong SUV and pickup demand.'},
    {name_zh:'哈萨克斯坦',name_en:'Kazakhstan',name_ru:'Казахстан',name_ar:'كازاخستان',iso_code:'KZ',region:'centralasia',trade_volume:'500+ units/year',serving_ports:'Tianjin to Almaty (rail), Urumqi to Nur-Sultan (land)',popular_models:'Toyota Camry, Hyundai Elantra, VW Passat',centroid_lat:48.0196,centroid_lng:66.9237,description_zh:'中亚最大经济体，铁路和公路运输便捷，出口成本低。',description_en:'Largest Central Asian economy, convenient rail and road transport.'},
    {name_zh:'吉尔吉斯斯坦',name_en:'Kyrgyzstan',name_ru:'Кыргызстан',name_ar:'قيرغيزستان',iso_code:'KG',region:'centralasia',trade_volume:'400+ units/year',serving_ports:'Tianjin to Bishkek (rail), Kashgar to Osh (land)',popular_models:'Toyota Camry, Honda Fit, Kia Rio',centroid_lat:41.2044,centroid_lng:74.7661,description_zh:'中亚重要转口贸易枢纽，二手车关税政策优惠。',description_en:'Key Central Asian transit trade hub with favorable used car import policies.'},
    {name_zh:'尼日利亚',name_en:'Nigeria',name_ru:'Нигерия',name_ar:'نيجيريا',iso_code:'NG',region:'africa',trade_volume:'550+ units/year',serving_ports:'Shanghai to Lagos, Guangzhou to Port Harcourt',popular_models:'Toyota Corolla, Honda Accord, Lexus RX',centroid_lat:9.0820,centroid_lng:8.6753,description_zh:'非洲最大经济体和人口大国，二手车市场需求旺盛。',description_en:'Africa\'s largest economy and population, strong used car demand.'},
    {name_zh:'埃及',name_en:'Egypt',name_ru:'Египет',name_ar:'مصر',iso_code:'EG',region:'africa',trade_volume:'380+ units/year',serving_ports:'Shanghai to Alexandria, Guangzhou to Port Said',popular_models:'BYD F3, Geely Emgrand, Chery Tiggo',centroid_lat:26.8206,centroid_lng:30.8025,description_zh:'北非最大汽车市场，中国品牌认知度高。',description_en:'Largest North African auto market, high recognition of Chinese brands.'},
    {name_zh:'蒙古',name_en:'Mongolia',name_ru:'Монголия',name_ar:'منغوليا',iso_code:'MN',region:'asia',trade_volume:'300+ units/year',serving_ports:'Tianjin to Ulaanbaatar (rail), Erenhot to Zamyn-Uud (land)',popular_models:'Toyota Prius, Lexus RX, Mitsubishi Pajero',centroid_lat:46.8625,centroid_lng:103.8467,description_zh:'北方重要邻国，陆路运输便捷，二手车需求量稳定。',description_en:'Important northern neighbor, convenient land transport, stable demand.'},
    {name_zh:'越南',name_en:'Vietnam',name_ru:'Вьетнам',name_ar:'فيتنام',iso_code:'VN',region:'asia',trade_volume:'450+ units/year',serving_ports:'Guangzhou to Hai Phong, Shanghai to Ho Chi Minh',popular_models:'Toyota Vios, Honda City, Mazda CX-5',centroid_lat:14.0583,centroid_lng:108.2772,description_zh:'东南亚增长最快的汽车市场之一，与中国贸易往来密切。',description_en:'One of Southeast Asia\'s fastest growing auto markets.'},
    {name_zh:'菲律宾',name_en:'Philippines',name_ru:'Филиппины',name_ar:'الفلبين',iso_code:'PH',region:'asia',trade_volume:'280+ units/year',serving_ports:'Guangzhou to Manila, Xiamen to Cebu',popular_models:'Toyota Innova, Mitsubishi Montero, Ford Ranger',centroid_lat:12.8797,centroid_lng:121.7740,description_zh:'岛国市场，对SUV和皮卡需求较高。',description_en:'Island nation with high demand for SUVs and pickups.'},
    {name_zh:'巴西',name_en:'Brazil',name_ru:'Бразилия',name_ar:'البرازيل',iso_code:'BR',region:'americas',trade_volume:'200+ units/year',serving_ports:'Shanghai to Santos, Ningbo to Rio de Janeiro',popular_models:'Toyota Corolla, Honda Civic, VW Gol',centroid_lat:-14.2350,centroid_lng:-51.9253,description_zh:'南美最大汽车市场，中国电动汽车出口增长迅速。',description_en:'South America\'s largest auto market, rapid growth in Chinese EV exports.'}
];

const insertCountry = db.prepare(`INSERT INTO countries (name_zh,name_en,name_ru,name_ar,iso_code,region,trade_volume,serving_ports,popular_models,centroid_lat,centroid_lng,description_zh,description_en) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`);
const insertCountries = db.transaction(() => {
    for (const c of countries) {
        insertCountry.run(c.name_zh,c.name_en,c.name_ru,c.name_ar,c.iso_code,c.region,c.trade_volume,c.serving_ports,c.popular_models,c.centroid_lat,c.centroid_lng,c.description_zh,c.description_en);
    }
});
insertCountries();
console.log(`Seeded ${countries.length} countries.`);

// Seed carousel
const slides = [
    {title_zh:'专业二手车出口服务',title_en:'Professional Used Car Export',title_ru:'Профессиональный экспорт авто',title_ar:'تصدير سيارات محترف',description_zh:'覆盖全球50+国家和地区，一站式出口解决方案',description_en:'Covering 50+ countries worldwide, one-stop export solutions',image_url:'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=1600',button_text_zh:'浏览车辆',button_text_en:'Browse Cars',button_link:'cars',sort_order:0},
    {title_zh:'多品牌车型选择',title_en:'Multi-Brand Selection',title_ru:'Широкий выбор брендов',title_ar:'تشكيلة متعددة',description_zh:'丰田、本田、宝马、奔驰等热门品牌应有尽有',description_en:'Toyota, Honda, BMW, Mercedes and more popular brands',image_url:'https://images.unsplash.com/photo-1562141960-bfb0f57b?w=1600',button_text_zh:'查看详情',button_text_en:'View Details',button_link:'cars',sort_order:1},
    {title_zh:'一站式出口服务',title_en:'One-Stop Export Service',title_ru:'Полный комплекс услуг',title_ar:'خدمة متكاملة',description_zh:'采购、检测、物流、报关全程服务，让您省心省力',description_en:'Full service from procurement to customs clearance',image_url:'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=1600',button_text_zh:'联系我们',button_text_en:'Contact Us',button_link:'contact',sort_order:2},
    {title_zh:'品质保障 值得信赖',title_en:'Quality Assured',title_ru:'Гарантия качества',title_ar:'جودة مضمونة',description_zh:'严格车辆检测流程，确保每辆车达到出口标准',description_en:'Rigorous inspection ensures every vehicle meets export standards',image_url:'https://images.unsplash.com/photo-1549924231-f129b911e442?w=1600',button_text_zh:'了解更多',button_text_en:'Learn More',button_link:'about',sort_order:3}
];

const insertSlide = db.prepare(`INSERT INTO carousel_slides (title_zh,title_en,title_ru,title_ar,description_zh,description_en,description_ru,description_ar,image_url,button_text_zh,button_text_en,button_text_ru,button_text_ar,button_link,sort_order) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`);
const insertSlides = db.transaction(() => {
    for (const s of slides) {
        insertSlide.run(s.title_zh,s.title_en,s.title_ru,s.title_ar,s.description_zh,s.description_en,s.description_ru||'',s.description_ar||'',s.image_url,s.button_text_zh,s.button_text_en,s.button_text_ru||'',s.button_text_ar||'',s.button_link,s.sort_order);
    }
});
insertSlides();
console.log(`Seeded ${slides.length} carousel slides.`);

// Seed settings
const settings = [
    ['company_name_zh','中国金霸二手车出口平台'],
    ['company_name_en','China Jinba Used Car Export'],
    ['phone','+86 180 7908 9999'],
    ['whatsapp','+86 180 7908 9999'],
    ['email','jian5222@gmail.com'],
    ['address_zh','中国江西省新余市'],
    ['address_en','Xinyu City, Jiangxi Province, China'],
    ['meta_description_zh','中国金霸二手车出口平台，专业从事二手车出口贸易，服务俄罗斯、中东、非洲、中亚等50+国家。提供采购、物流、报关一站式服务。'],
    ['meta_description_en','China Jinba Used Car Export Platform - Professional used car exporter serving 50+ countries including Russia, Middle East, Africa, and Central Asia.'],
    ['meta_keywords','中国二手车出口,used car export China,二手车出口商,China used car,Jinba Auto'],
];

const insertSetting = db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)');
const insertSettings = db.transaction(() => {
    for (const [k, v] of settings) {
        insertSetting.run(k, v);
    }
});
insertSettings();
console.log(`Seeded ${settings.length} settings.`);

console.log('Seed complete!');
// Only exit if run directly (not required from server.js)
if (require.main === module) process.exit(0);
