# CLAUDE.md — Jinbacars.com 工作交接文档

> 本文档用于将 jinbacars.com 网站全面交接给 Workbuddy AI 接管。
> **接手后请先完整阅读本文档，再执行任何操作。**

## 项目核心信息

- **网站：** https://jinbacars.com（中国二手车出口平台）
- **托管：** GitHub Pages（免费），域名 jinbacars.com
- **仓库：** https://github.com/jian522/usedchinesecars
- **本地路径：** `D:\谷歌下载\`

## 两个分支

| 分支 | 作用 | 本地路径 |
|------|------|---------|
| **`main`** | GitHub Pages 线上静态文件 | 仓库根目录，直接放 HTML |
| **`master`** | Express 源码 + 生成工具 | `jinba-export/` 子目录 |

> ⚠️ **不要混淆分支。** main = 线上文件，master = 开发源码。

## 更新网站最快路径

```bash
cd D:\谷歌下载
git checkout master
cd jinba-export

# 一步生成 + 部署
npm run deploy
```

或分步操作：
```bash
cd D:\谷歌下载\jinba-export
npm install                    # 安装依赖
node database/seed.js          # 初始化数据库
node tools/import-cars.js      # 导入160辆车
node tools/setup-db.js         # 设置轮播图/评价
node tools/static-generator.js # 生成静态文件到 dist/
node tools/deploy-ghpages.js   # 部署到 GitHub Pages
```

## 关键文件

| 文件 | 说明 |
|------|------|
| `jinba-export/tools/static-generator.js` | ⭐ 核心：生成全部静态页面（1051行） |
| `jinba-export/tools/deploy-ghpages.js` | 部署到 main 分支 |
| `jinba-export/database/jinba.db` | SQLite 数据库（160辆车） |

## 线上状态

- ✅ 160辆汽车详情页（中/英/俄/阿拉伯四语）
- ✅ AI生成轮播图（3张）
- ✅ SEO（JSON-LD、Sitemap、OG标签、hreflang）
- ✅ 百度已提交（Token: c3j1BpqkL01wkOrn）
- ✅ 手机适配
- ✅ HTTPS 证书有效至 2026-08-13

## 部署注意事项

1. **推送到 main 需要代理：** `HTTP_PROXY=http://127.0.0.1:7890` 或 `git -c http.sslBackend=openssl push`
2. **.nojekyll 文件必须存在**（否则 Jekyll 构建失败）
3. **CNAME 文件内容必须为 `jinbacars.com`**
