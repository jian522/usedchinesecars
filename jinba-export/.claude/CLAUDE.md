# CLAUDE.md — Jinbacars.com 工作交接文档

> 本文档用于将 jinbacars.com 网站（中国二手车出口平台）交接给 Workbuddy AI 全面接管。
> 接手后请先完整阅读本文档，再执行任何操作。

---

## 1. 项目概览

| 项目 | 说明 |
|------|------|
| 网站 | https://jinbacars.com |
| 类型 | 中国二手车出口静态展示站（BYD/MG/奇瑞等品牌） |
| 托管 | GitHub Pages（免费） |
| 自定义域名 | jinbacars.com（已配置 CNAME，HTTPS 有效期至 2026-08-13） |
| 搜索引擎 | 百度已提交（Token: c3j1BpqkL01wkOrn） |

## 2. Git 仓库

**远程仓库：** https://github.com/jian522/usedchinesecars.git
**本地路径：** `D:\谷歌下载\`
**两个分支：**

| 分支 | 作用 | 说明 |
|------|------|------|
| `main` | **GitHub Pages 静态页面** | 仓库根目录直接放 index.html、cars/*.html 等静态文件 |
| `master` | **Express 开发源码** | 包含完整的 Node.js Express 应用 + 数据库 + 静态生成工具 |

> ⚠️ **重要：** 不要混淆两个分支。main 只放静态文件，master 放源码。
> 更新网站流程：master 改代码 → 运行生成器 → 提交到 main → 推送上线。

## 3. 网站架构

```
┌──────────────────────────────┐
│    GitHub Pages (main分支)    │  ← 线上运行的是静态 HTML
│  jinbacars.com/index.html    │
│  jinbacars.com/cars/*.html   │  ← 160辆汽车详情页
│  jinbacars.com/cars/         │  ← 库存列表页（含搜索功能）
│  jinbacars.com/sitemap.xml   │  ← SEO sitemap（含160+ URLs）
│  jinbacars.com/cars-data.json│  ← 车辆数据 JSON
│  jinbacars.com/uploads/      │  ← 轮播图图片
└──────────┬───────────────────┘
           │ 静态生成
┌──────────▼───────────────────┐
│  Express 开发环境 (master分支) │  ← 本地运行的管理工具
│  tools/static-generator.js    │  ← 从数据库生成静态文件的脚本
│  database/jinba.db            │  ← SQLite 数据库（160辆车）
│  public/uploads/              │  ← 图片资源
└──────────────────────────────┘
```

## 4. 核心技术

### 4.1 静态生成器（核心文件）
**位置：** `jinba-export/tools/static-generator.js`（1051行）
**作用：** 从 SQLite 数据库读取车辆数据 → 生成完整的静态网站到 `dist/` 目录

生成内容包括：
- `index.html` — 首页（轮播图、精选车辆、统计、客户评价、信任条）
- `cars/*.html` — 160辆汽车详情页（SEO JSON-LD、OG标签、WhatsApp询价）
- `cars/index.html` — 库存列表页（客户端搜索过滤）
- `sitemap.xml` — 含全部车辆URL（SEO）
- `cars-data.json` — 车辆数据（前端搜索用）
- `uploads/carousel/` — 轮播图3张

### 4.2 部署脚本
**位置：** `jinba-export/tools/deploy-ghpages.js`
**流程：** 生成静态文件 → 切换到 main 分支 → 替换文件 → 提交 → 推送到 GitHub Pages

### 4.3 数据库
**位置：** `jinba-export/database/jinba.db`
**数据恢复：**
```bash
cd D:\谷歌下载\jinba-export
npm install
node database/seed.js          # 创建表结构
node tools/import-cars.js      # 导入160辆车
node tools/setup-db.js         # 设置轮播图URL和客户评价
```

### 4.4 NPM 命令
```bash
npm run static    # node tools/static-generator.js（生成静态文件）
npm run deploy    # node tools/deploy-ghpages.js（生成+部署到GitHub Pages）
npm run seed      # 初始化数据库
npm start         # 启动 Express 本地开发服务器
```

## 5. 网站功能清单

### 已实现功能
- ✅ 首页轮播图（3张AI生成图，自动轮播）
- ✅ 160辆二手车详情页（中/英/俄/阿拉伯四语）
- ✅ 库存搜索列表（按品牌/车型/年份搜索）
- ✅ SEO（JSON-LD结构化数据、OG标签、hreflang、Sitemap）
- ✅ 语言切换（中文/English/Русский/العربية）
- ✅ 车辆图片防盗链（referrerpolicy=no-referrer）
- ✅ 手机端适配（768px + 480px双断点）
- ✅ WhatsApp询价按钮
- ✅ 页面预加载（preload首张轮播图）
- ✅ 百度URL提交（Token: c3j1BpqkL01wkOrn）
- ✅ 客户评价模块（6条，带彩色头像）
- ✅ 统计数据（精选好车160+、出口国家50+等）
- ✅ 信任条（品质保证、交易安全、快速发运、专业团队）
- ✅ .nojekyll（确保GitHub Pages跳过Jekyll构建）

## 6. 更新网站流程

需要更新车辆数据或修改网站时，按以下步骤：

```bash
# 1. 切换到 master 分支
cd D:\谷歌下载
git checkout master

# 2. 更新数据库或修改代码
# 修改 tools/static-generator.js 或数据库

# 3. 安装依赖并恢复数据库
cd jinba-export
npm install
node database/seed.js
node tools/import-cars.js
node tools/setup-db.js

# 4. 生成静态文件
node tools/static-generator.js
# 输出在 dist/ 目录

# 5. 部署到 GitHub Pages
node tools/deploy-ghpages.js
# 或者手动: 复制 dist/* → 仓库根目录 → git add/commit/push 到 main
```

## 7. 部署注意事项

### 7.1 代理问题
当前网络（中国）访问 GitHub 需要代理（Clash，端口 7890）。
- 推送 main 分支时需要 `HTTP_PROXY=http://127.0.0.1:7890`
- 有时需要 `git -c http.sslBackend=openssl push origin main`（OpenSSL而非schannel）

### 7.2 关键配置
- `.nojekyll` 文件必须在 main 分支根目录（不加的话 GitHub Pages 会用 Jekyll 构建失败）
- `CNAME` 文件内容为 `jinbacars.com`（域名绑定）
- `robots.txt` 允许所有爬虫，指向 sitemap

### 7.3 图片资源
- **轮播图：** `public/uploads/carousel/slide_1/2/3.jpg`（AI生成的港口/汽车/全球图）
- **车辆图片：** 来自 汽车之家 CDN（`2sc2.autoimg.cn`），添加了 referrerpolicy 防盗链
- **客户评价头像：** 使用彩色首字母 Avatar（6种颜色），无需图片文件

## 8. 常见问题

### Q: 车辆图片不显示？
A: 检查 referrerpolicy="no-referrer" 是否在 img 标签上。汽车之家CDN会拦截带Referer的请求。

### Q: 部署后网站没更新？
A: GitHub Pages 构建需要 1-5 分钟。等构建完成后刷新。
检查状态：`https://api.github.com/repos/jian522/usedchinesecars/deployments`

### Q: 百度不收录？
A: 执行百度URL提交（Token 在本文档第5节）。提交接口：
```bash
curl -s -H 'Content-Type: text/plain' \
  --data-binary "https://jinbacars.com/\nhttps://jinbacars.com/cars" \
  "http://data.zz.baidu.com/urls?site=https://jinbacars.com&token=c3j1BpqkL01wkOrn"
```

### Q: 需要修改车辆数据？
A: 直接修改 SQLite 数据库（`database/jinba.db`），然后重新生成静态文件。

## 9. 项目文件索引

| 文件/目录 | 作用 |
|-----------|------|
| `tools/static-generator.js` | ⭐ 核心：静态网站生成器（1051行） |
| `tools/deploy-ghpages.js` | 部署脚本 |
| `tools/import-cars.js` | 从JSON批量导入车辆数据 |
| `tools/setup-db.js` | 初始化轮播图和评价数据 |
| `database/seed.js` | 数据库表结构创建 + 种子数据 |
| `database/connection.js` | SQLite数据库连接 |
| `models/carModel.js` | 车辆数据模型 |
| `models/testimonialModel.js` | 客户评价模型 |
| `models/carouselModel.js` | 轮播图模型 |
| `cars-data-fetched.json` | 160辆车的JSON数据来源 |
| `public/uploads/carousel/` | 轮播图图片 |
| `server.js` | Express开发服务器 |
| `app.js` | Express应用配置 |

## 10. 联系信息

- **网站：** https://jinbacars.com
- **GitHub：** https://github.com/jian522/usedchinesecars
- **域名管理：** 在 Godaddy 购买，CNAME 指向 `jian522.github.io`
- **百度站长：** https://ziyuan.baidu.com/site/index#/site-detail?site=https://jinbacars.com
