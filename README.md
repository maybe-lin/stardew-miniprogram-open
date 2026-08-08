# 行之小助手 · 星露谷微信小程序

**微信小程序名称：行之小助手**

在微信中搜索 **「行之小助手」** 即可打开本小程序（星露谷物语实用查询工具）。

星露谷物语（Stardew Valley）实用查询小助手，数据主要参考 [星露谷中文维基](https://zh.stardewvalleywiki.com/)。

> 本地查物品、送礼、节日、社区中心、料理菜谱与人物事件；设置游戏进度后可按季节换肤、排序与「今日提示」。


> **本仓库为半开源公开版**（干净历史，不含完整图鉴数据包）。  
> 完整数据与日常开发请使用私有仓；clone 本仓仅含 `data/sample` 示例。

## 半开源说明（重要）

本仓库采用 **半开源**：

| 内容 | 公开仓 | 说明 |
|------|--------|------|
| 页面 / 工具 / 主题 / 脚本 | ✅ | 可阅读、可学习结构 |
| `data/sample/` | ✅ | 精简示例数据，clone 后能启动 |
| `data/private/` | ❌ | **完整图鉴数据包，不进 Git**（见 `.gitignore`） |
| 上传密钥 `private*.key` | ❌ | 切勿提交 |

- **维护者全量运行**：保证本机存在 `data/private/*.js`（与原先完整 data 模块对应）。有 private 时自动用全量数据。  
- **公开克隆**：仅含 sample，物品/NPC 为演示级，**不是完整攻略库**。  
- 细节见 [`data/README.md`](./data/README.md)。

## 功能概览

| 模块 | 说明 |
|------|------|
| **首页** | 进度条 + 搜索吸顶；三大入口（基础 / 工具 / 进阶）；今日提示（季节、节日、生日、酱料女皇电视） |
| **图鉴** | 作物、鱼、矿物、采集、料理、动物、打造、特殊、古物；推荐料理筛选 |
| **工具箱** | 季节日历、种植/钓鱼规划、利润计算、礼物推荐、工具升级 |
| **居民** | 四类筛选、好感本地记录、送礼清单、爱心事件、日程 |
| **社区中心** | 收集包展开勾选、分项进度、点「获取」跳转物品来源 |
| **料理** | 81 道完整配方；菜谱来源（电视奇/偶数年日期、邮件、商店、技能） |
| **博物馆 / 成就** | 捐赠奖励表、成就本地勾选 |
| **地图** | 居民区域示意（分包） |
| **游戏进度** | 季节 / 年 / 日 / 技能职业；导航栏与页面四季主题统一 |

### 数据规模（约）

- 物品合计 **~396** 条（鱼 77 / 料理 81 / 矿物 62 / 作物 46 / 古物 42 等）
- 全村民 **34** 人档案 · 爱心事件 **145** 条 · 礼物清单全覆盖
- 成就 **49** 条 · 社区中心 **30** 个收集包 · 博物馆捐赠奖励表

## 技术栈

- 微信原生小程序（WXML / WXSS / JS）
- 本地数据模块（`data/`），无需后端
- 本地存储统一入口：`utils/storage.js`（收藏、收集、历史、好感、成就、游戏进度、模块勾选）

## 目录结构

```
stardew-miniprogram/
├── app.js / app.json / app.wxss   # 全局入口、Tab、季节主题
├── data/
│   ├── _load.js                  # private 优先，否则 sample
│   ├── *.js                      # 薄加载器（公开）
│   ├── sample/                   # 示例数据（公开）
│   ├── private/                  # 完整数据（本地，gitignore）
│   └── README.md                 # 半开源数据说明
├── pages/
│   ├── home / codex / toolbox    # Tab 三页
│   ├── item / list               # 详情与列表
│   ├── npcs / npc-detail         # 居民
│   ├── bundles                   # 社区中心
│   ├── buildings / drop-farm / special-orders
│   ├── museum / achievements / settings
│   └── index                     # 旧分享兼容 → 首页
├── packages/map/                 # 地图分包
├── utils/                        # 搜索、进度、价格、存储、今日提示、NPC 组装
├── scripts/                      # 开发者工具 CLI / 数据检查
└── images/                       # 背景、Tab、村民、物品、建筑
```

## 本地运行

1. 安装 [微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)
2. 打开本仓库目录作为小程序项目
3. `appid` 可在 `project.config.json` 中替换成你的测试号
4. 编译预览

### 建议设置

- **设置 → 安全设置 → 服务端口**：CLI 清缓存 / 预览需要开启  
- 修改资源后：**清除缓存 → 重新编译**

### 命令行

```bash
npm run preview       # 清 compile 缓存 + 预览 → preview-qrcode.jpg
npm run dev:open      # 用工具打开本项目
npm run dev:cache     # 清编译缓存
npm run dev:login     # 检查登录状态

# 数据一致性（NPC 礼物/事件/生日）
node scripts/check-npc-data.js
```

miniprogram-ci 上传需密钥（见 `scripts/ci.js`，密钥已 gitignore）：

```bash
npm run ci:preview
npm run ci:upload -- 1.0.x "备注"
```

## 使用提示

- **今日提示**：按进度展示当季建议、临近节日/生日、酱料女皇周日菜谱与周三重播提醒  
- **料理「获取」**：电视奇数年/偶数年日期、村民邮件心数、酒吧/技能等  
- **社区中心**：展开收集包 → 勾选物品；点 **获取 ›** 进物品详情「获取」Tab  
- **四季主题**：导航栏 / 页面 / Tab 选中色随设置里的季节一致  

## 数据来源与声明

本项目「行之小助手」为**粉丝向学习/查询工具**，与 ConcernedApe、星露谷物语官方及 [星露谷中文维基](https://zh.stardewvalleywiki.com/) **无隶属、无授权关系**。

- 图鉴、任务、成就等文字数据主要**参考整理**自星露谷中文维基等公开资料，错漏以维基与游戏内为准  
- 游戏名称、角色、物品、图像等 **IP 归原权利人所有**  
- 使用维基内容请遵守维基许可协议；**请勿将本项目数据用于商业用途或完整搬运**  

小程序内：首页底部「数据来源与声明」、**改进度**页完整说明。

## 开发说明

- 图鉴分类：`data/items.js` → `CATEGORY_META`  
- 首页入口：`data/guides.js` → `HOME_MODULES`  
- 主题：`app.wxss` 季节变量 + `utils/gameTime.js` → `applySeasonChrome`  
- 存储：`utils/storage.js`（禁止页面直接 `wx.getStorageSync`）  
- NPC 单一数据源：生日 `BIRTHDAY_DATES` / 礼物 `npc_gifts` / 事件 `npc_events` / 档案 `heart_events`  
- 打包忽略：`node_modules/`、`_dev_unused/`、`scripts/` 等（见 `project.config.json` packOptions）  
- 旧页面（crops/fish/gifts…）已迁至 `_dev_unused/pages/`，不参与编译  
- **半开源**：完整数据只在 `data/private/`；公开仓用 `data/sample/` 演示  

## License

仅供个人学习与交流使用。转载数据请遵守维基协议；请勿用于商业用途。

**禁止**将本仓库完整数据用于商业小程序、广告变现或伪冒官方；**禁止**把 `data/private` 完整包再公开发布（除非你自担版权与平台风险）。
