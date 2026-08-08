# 数据目录 · 半开源说明

本仓库采用 **半开源 B**：

| 路径 | 是否进公开仓 | 说明 |
|------|----------------|------|
| `data/*.js` | ✅ 公开 | 薄加载器，自动选择 private / sample |
| `data/sample/` | ✅ 公开 | 精简示例数据，clone 后可启动、可演示结构 |
| `data/private/` | ❌ **不公开**（gitignore） | 完整图鉴 / NPC / 料理等，本地全量运行用 |
| `data/_load.js` | ✅ 公开 | 加载逻辑 |

## 本地全量运行（维护者）

完整数据应在：

```text
data/private/
  items.js
  wiki_*.js
  cooking_recipes.js
  cooking_sources.js
  heart_events.js
  npc_events.js
  npc_gifts.js
  relations.js
  ...（与原先 data 根目录模块一一对应）
```

若你从旧版本迁移：把原先的完整 `data/*.js` 内容复制到 `data/private/` 即可（不要覆盖根目录的加载器文件）。

当前开发机若已有 `data/private/`，小程序会**自动用完整包**；没有则用 `sample`。

## 公开克隆者

```bash
git clone <本仓库>
# 直接用微信开发者工具打开：仅含示例数据
```

示例数据只有少量物品/NPC，用于验证工程结构，**不是完整攻略库**。

## 请勿

- 将 `data/private/` 提交到公开远程
- 把完整数据包发到公开 Release（除非你另有授权与声明）

## 校验

```bash
# 有 private 时应为全量条数
node -e "console.log(require('./data/items.js').ITEMS.length)"

# 临时验证 sample：重命名 private 后再 require
```
