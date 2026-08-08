const {
  ITEMS,
  VILLAGERS,
  CATEGORY_META,
  SEASON_META,
  ACHIEVEMENTS,
  ACHIEVEMENT_CATS,
  ACHIEVEMENTS_WIKI
} = require('../data/items.js')
const {
  RECIPES,
  USES,
  NEEDED_BY_EXTRA,
  VIRTUAL_ITEMS,
  isRareMaterial
} = require('../data/relations.js')
const { allPrices } = require('./price.js')
const gameTime = require('./gameTime.js')
const { ITEM_ICONS } = require('../data/item_icons.js')
const { NPC_GIFTS } = require('../data/npc_gifts.js')
const { COOKING_SOURCES } = require('../data/cooking_sources.js')

function getAllItems() {
  return ITEMS.concat(Object.values(VIRTUAL_ITEMS))
}

function getItemById(id) {
  return ITEMS.find(i => i.id === id) || VIRTUAL_ITEMS[id] || null
}

function getItemIcon(id) {
  return (ITEM_ICONS && ITEM_ICONS[id]) || ''
}

function getVillager(id) {
  return VILLAGERS[id] || { id, name: id, emoji: '👤', avatar: '' }
}

/** 菜谱来源类型 → 角标文案（withLabel: 获取页完整 / 关联页仅 emoji） */
function badgeFor(type, withLabel) {
  const map = {
    tv: ['📺', '电视'],
    tv_rerun: ['🔁', '重播'],
    mail: ['💌', '邮件'],
    event: ['🎬', '事件'],
    shop: ['🛒', '商店'],
    skill: ['⭐', '技能'],
    starter: ['🏁', '初始'],
    special: ['✨', '特殊']
  }
  const pair = map[type] || ['✨', '特殊']
  return withLabel ? `${pair[0]} ${pair[1]}` : pair[0]
}

function mapCookingLearnSources(list, keyPrefix, withLabel) {
  return (list || []).map((s, index) => ({
    ...s,
    key: `${keyPrefix}${index}`,
    badge: badgeFor(s.type, withLabel)
  }))
}

function enrichItem(item, progress) {
  if (!item) return null
  const p = progress || gameTime.getProgress()
  const { getItemSellBoost } = require('../data/skills.js')
  const boostInfo = getItemSellBoost(item, p.skills)
  const prices = allPrices(item.basePrice || 0, false)
  // 职业加成后的价格（详情页「你的职业售价」）
  const pricesBoost = allPrices(item.basePrice || 0, boostInfo.mult > 1 ? boostInfo.mult : false)

  const annotated = gameTime.annotateItem(item, p)
  const rainOnly = annotated.rainOnly
  const icon = getItemIcon(item.id)

  const isMustCook = item.category === 'cooking' && (item.tags || []).includes('必做料理')

  // 料理：学会食谱的途径（电视/邮件/商店/技能…）
  let recipeLearn = []
  if (item.category === 'cooking' && COOKING_SOURCES[item.id]) {
    recipeLearn = mapCookingLearnSources(
      COOKING_SOURCES[item.id].sources,
      'learn_',
      true
    )
  }

  const baseSources = (item.sources || []).map((source, index) => ({
    ...source,
    key: `${source.label || ''}::${source.detail || ''}::${index}`,
    isRecipeLearn: false
  }))

  // 获取页：菜谱学习来源排在前面
  const learnSources = recipeLearn.map((s, index) => ({
    type: s.type,
    label: s.label,
    detail: s.detail,
    short: s.short || '',
    badge: s.badge,
    key: `rsrc_${index}`,
    isRecipeLearn: true,
    link: null
  }))

  return {
    ...annotated,
    icon,
    hasIcon: !!icon,
    isMustCook,
    isCooking: item.category === 'cooking',
    isAbilityBook: item.category === 'book' && (item.tags || []).includes('能力之书'),
    isExperienceBook: item.category === 'book' && (item.tags || []).includes('经验书'),
    categoryName: (CATEGORY_META[item.category] || {}).name || item.category,
    categoryEmoji: (CATEGORY_META[item.category] || {}).emoji || '📦',
    recipeLearn,
    sources: learnSources.concat(baseSources),
    seasonLabels: (item.seasons || []).map(s => SEASON_META[s] || { name: s, color: '#999' }),
    prices,
    pricesBoost,
    sellMult: boostInfo.mult,
    sellBoostLabels: boostInfo.labels,
    forceIridium: boostInfo.forceIridium,
    rainOnly,
    lovedVillagers: (item.lovedBy || []).map(getVillager),
    likedVillagers: (item.likedBy || []).map(getVillager),
    hatedVillagers: (item.hatedBy || []).map(getVillager)
  }
}

/** 链式：配方 / 用途 / 谁需要 */
function getItemRelations(itemId) {
  const item = getItemById(itemId)
  if (!item) return { recipe: null, uses: [], neededBy: [] }

  // 配方
  let recipe = RECIPES[itemId] || null
  if (recipe) {
    const learnSources = mapCookingLearnSources(
      (COOKING_SOURCES[itemId] && COOKING_SOURCES[itemId].sources) || [],
      'rlearn_',
      false
    )
    // 关联页只展示核心学习途径（不含重播说明、全书提示）
    const primaryLearn = learnSources.filter(s =>
      s.type === 'tv' || s.type === 'mail' || s.type === 'event' ||
      s.type === 'shop' || s.type === 'skill' || s.type === 'starter'
    )
    recipe = {
      ...recipe,
      learnSources,
      primaryLearn,
      materials: (recipe.materials || []).map(m => {
        let itemIdMat = m.itemId || ''
        if (!itemIdMat && m.name) {
          const hit = getAllItems().find(i => i.name === m.name)
          if (hit) itemIdMat = hit.id
        }
        return {
          ...m,
          itemId: itemIdMat || m.itemId,
          rare: isRareMaterial(m),
          linked: !!(itemIdMat || m.itemId)
        }
      })
    }
  }

  // 用途
  const uses = (USES[itemId] || []).slice()
  // 料理默认用途（无单独配置时）
  if (item.category === 'cooking' && !uses.length) {
    uses.push({ text: '恢复体力与生命值', type: 'food' })
    uses.push({ text: '可作为礼物送给村民', type: 'gift' })
    if ((item.tags || []).includes('必做料理')) {
      uses.push({ text: '增益/送礼常用推荐料理', type: 'buff' })
    }
  }

  // 谁需要：礼物（反向 lovedBy）+ 额外收集包等
  const neededBy = []
  // 反向：哪些村民最爱/喜欢这个物品
  ;(item.lovedBy || []).forEach(vid => {
    const v = getVillager(vid)
    neededBy.push({
      type: 'gift_love',
      name: v.name,
      detail: '最爱礼物',
      avatar: v.avatar,
      emoji: v.emoji,
      villagerId: vid
    })
  })
  ;(item.likedBy || []).forEach(vid => {
    const v = getVillager(vid)
    neededBy.push({
      type: 'gift_like',
      name: v.name,
      detail: '喜欢礼物',
      avatar: v.avatar,
      emoji: v.emoji,
      villagerId: vid
    })
  })

  // 作为材料出现在哪些配方里
  Object.keys(RECIPES).forEach(rid => {
    const r = RECIPES[rid]
    const hit = (r.materials || []).some(m => m.itemId === itemId || m.name === item.name)
    if (hit) {
      const outItem = getItemById(rid) || getItemById(r.itemId)
      neededBy.push({
        type: 'craft',
        name: r.output || (outItem && outItem.name) || rid,
        detail: '合成材料',
        relatedId: outItem ? outItem.id : rid
      })
    }
  })

  ;(NEEDED_BY_EXTRA[itemId] || []).forEach(n => {
    // 去重简单判断
    if (!neededBy.some(x => x.name === n.name && x.type === n.type)) {
      neededBy.push(n)
    }
  })

  return { recipe, uses, neededBy }
}

/** 万能搜索 + 游戏进度排序 */
function searchItems(query, progress) {
  const q = (query || '').trim().toLowerCase()
  if (!q) return []
  const p = progress || gameTime.getProgress()

  const seasonMap = {
    春: 'spring', 春季: 'spring', spring: 'spring',
    夏: 'summer', 夏季: 'summer', summer: 'summer',
    秋: 'fall', 秋季: 'fall', fall: 'fall', autumn: 'fall',
    冬: 'winter', 冬季: 'winter', winter: 'winter'
  }

  const catAlias = {
    鱼: 'fish', 鱼类: 'fish', fish: 'fish',
    作物: 'crop', 农作物: 'crop', crop: 'crop',
    矿产: 'mineral', 矿物: 'mineral', 矿石: 'mineral', 宝石: 'mineral', mineral: 'mineral',
    采集: 'forage', forage: 'forage',
    料理: 'cooking', 烹饪: 'cooking', 食物: 'cooking', cooking: 'cooking',
    礼物: 'special', 特殊: 'special',
    打造: 'crafting', 制造: 'crafting', crafting: 'crafting',
    炸弹: 'crafting', 动物: 'animal',
    书: 'book', 书籍: 'book', 技能书: 'book', 经验书: 'book', book: 'book', books: 'book'
  }

  // 包含虚拟物品（炸弹、橡树籽）
  const pool = getAllItems()

  // 精确分类词：只返回该类（如搜「鱼」）
  const exactCat = catAlias[q]
  let list
  if (exactCat && q.length <= 3) {
    list = pool.filter(item => item.category === exactCat)
  } else {
    list = pool.filter(item => {
      if (item.name.toLowerCase().includes(q)) return true
      if ((item.nameEn || '').toLowerCase().includes(q)) return true
      if ((item.desc || '').toLowerCase().includes(q)) return true
      if ((item.tags || []).some(t => t.toLowerCase().includes(q))) return true
      if ((item.locations || []).some(l => l.toLowerCase().includes(q))) return true
      if ((item.sources || []).some(s => (s.label + s.detail).toLowerCase().includes(q))) return true

      const sk = seasonMap[q]
      if (sk && (item.seasons || []).includes(sk)) return true

      const ck = catAlias[q]
      if (ck && item.category === ck) return true

      if ((q === '雨' || q === '雨天') && gameTime.isRainOnly(item)) return true

      return false
    })
  }

  list = gameTime.sortByGameContext(list, p, 'price_desc')
  return list.map(i => enrichItem(i, p))
}

function filterItems(opts = {}) {
  const p = opts.progress || gameTime.getProgress()
  let list = (opts.includeVirtual ? getAllItems() : ITEMS.slice())

  if (opts.category) list = list.filter(i => i.category === opts.category)
  if (opts.season && opts.season !== 'all') {
    list = list.filter(i => (i.seasons || []).includes(opts.season) || !(i.seasons || []).length)
  }
  if (opts.tag) list = list.filter(i => (i.tags || []).includes(opts.tag))
  if (opts.location) list = list.filter(i => (i.locations || []).includes(opts.location))
  if (opts.ids) list = list.filter(i => opts.ids.includes(i.id))
  if (opts.onlyInSeason) {
    list = list.filter(i => gameTime.isInSeason(i, p.season))
  }
  if (opts.rainOnly) {
    list = list.filter(i => gameTime.isRainOnly(i))
  }
  // 料理：只看必做（仍属于烹饪分类，不单独拆库）
  if (opts.onlyMustCook) {
    list = list.filter(i => (i.tags || []).includes('必做料理'))
  }

  const isMust = (i) => (i.tags || []).includes('必做料理')

  // 游戏进度优先排序（除非指定 name 等特殊）
  if (opts.sort === 'must_first') {
    // 必做优先，同组按售价降序 —— 首页「料理图鉴」与图鉴烹饪共用
    list.sort((a, b) => {
      const am = isMust(a) ? 0 : 1
      const bm = isMust(b) ? 0 : 1
      if (am !== bm) return am - bm
      return (b.basePrice || 0) - (a.basePrice || 0)
    })
  } else if (opts.useGameContext !== false) {
    list = gameTime.sortByGameContext(list, p, opts.sort)
  } else if (opts.sort === 'price_desc') {
    list.sort((a, b) => (b.basePrice || 0) - (a.basePrice || 0))
  } else if (opts.sort === 'price_asc') {
    list.sort((a, b) => (a.basePrice || 0) - (b.basePrice || 0))
  } else if (opts.sort === 'difficulty') {
    list.sort((a, b) => (b.difficulty || 0) - (a.difficulty || 0))
  } else if (opts.sort === 'name') {
    list.sort((a, b) => a.name.localeCompare(b.name, 'zh'))
  }

  return list.map(i => enrichItem(i, p))
}

function getCategoryStats(collectedMap = {}) {
  const stats = {}
  Object.keys(CATEGORY_META).forEach(cat => {
    const items = ITEMS.filter(i => i.category === cat)
    const done = items.filter(i => collectedMap[i.id]).length
    stats[cat] = {
      ...CATEGORY_META[cat],
      key: cat,
      total: items.length,
      done,
      percent: items.length ? Math.round((done / items.length) * 100) : 0
    }
  })
  return stats
}

// 兼容旧入口：扁平快捷列表（部分页面仍引用）
const QUICK_FILTERS = [
  { key: 'crops', title: '作物', emoji: '🌾', desc: '四季农作物', filter: { category: 'crop', sort: 'price_desc' } },
  { key: 'season_fish', title: '鱼类', emoji: '🎣', desc: '当季可钓鱼类', filter: { category: 'fish', sort: 'price_desc' } },
  { key: 'mines', title: '矿物', emoji: '💎', desc: '矿石与宝石', filter: { category: 'mineral', sort: 'difficulty' } },
  { key: 'books', title: '书籍', emoji: '📚', desc: '能力书与经验书', filter: { category: 'book', sort: 'name' } },
  { key: 'heart_events', title: 'NPC', emoji: '💕', desc: '爱心事件/喜好', page: '/pages/npcs/npcs' },
  { key: 'cooking', title: '料理图鉴', emoji: '🍳', desc: '全部菜谱·推荐优先', filter: { category: 'cooking', sort: 'must_first', title: '料理图鉴' } },
  { key: 'gifts', title: '通用最爱', emoji: '💝', desc: '送礼万金油', filter: { tag: '通用最爱' } },
  { key: 'special', title: '隐藏特殊', emoji: '✨', desc: '能力书/钥匙/精通', filter: { tag: '特色物品' } },
  { key: 'drop_farm', title: '掉落速刷', emoji: '⚡', desc: '五彩/幽灵/骷髅', page: '/pages/drop-farm/drop-farm' },
  { key: 'museum', title: '博物馆', emoji: '🏛️', desc: '捐赠奖励/进度', page: '/pages/museum/museum' },
  { key: 'achievements', title: '成就', emoji: '🏆', desc: '游戏成就列表', page: '/pages/achievements/achievements' },
  { key: 'map', title: '居民地图', emoji: '🗺️', desc: 'NPC住在哪', page: '/packages/map/pages/map/map' },
  { key: 'birthday', title: '季节日历', emoji: '📅', desc: '生日节日', page: '/pages/toolbox/toolbox?tab=calendar' },
  { key: 'settings', title: '游戏进度', emoji: '📅', desc: '设置当前季节', page: '/pages/settings/settings' }
]

const {
  HOME_MODULES,
  CODEX_QUICK,
  FESTIVAL_GUIDES,
  SEASON_PLANS,
  UNIVERSAL_GIFTS
} = require('../data/guides.js')

// 生日日期唯一表；推荐礼物从 npc_gifts.loves 派生，避免与送礼清单双写漂移
const BIRTHDAY_DATES = [
  { season: 'spring', day: 4, villager: 'kent' },
  { season: 'spring', day: 7, villager: 'lewis' },
  { season: 'spring', day: 10, villager: 'vincent' },
  { season: 'spring', day: 14, villager: 'haley' },
  { season: 'spring', day: 18, villager: 'pam' },
  { season: 'spring', day: 20, villager: 'shane' },
  { season: 'spring', day: 26, villager: 'pierre' },
  { season: 'spring', day: 27, villager: 'emily' },
  { season: 'summer', day: 4, villager: 'jas' },
  { season: 'summer', day: 8, villager: 'gus' },
  { season: 'summer', day: 10, villager: 'maru' },
  { season: 'summer', day: 13, villager: 'alex' },
  { season: 'summer', day: 17, villager: 'sam' },
  { season: 'summer', day: 19, villager: 'demetrius' },
  { season: 'summer', day: 22, villager: 'dwarf' },
  { season: 'summer', day: 24, villager: 'willy' },
  { season: 'summer', day: 26, villager: 'leo' },
  { season: 'fall', day: 2, villager: 'penny' },
  { season: 'fall', day: 5, villager: 'elliott' },
  { season: 'fall', day: 11, villager: 'jodi' },
  { season: 'fall', day: 13, villager: 'abigail' },
  { season: 'fall', day: 15, villager: 'sandy' },
  { season: 'fall', day: 18, villager: 'marnie' },
  { season: 'fall', day: 21, villager: 'robin' },
  { season: 'fall', day: 24, villager: 'george' },
  { season: 'winter', day: 1, villager: 'krobus' },
  { season: 'winter', day: 3, villager: 'linus' },
  { season: 'winter', day: 7, villager: 'caroline' },
  { season: 'winter', day: 10, villager: 'sebastian' },
  { season: 'winter', day: 14, villager: 'harvey' },
  { season: 'winter', day: 17, villager: 'wizard' },
  { season: 'winter', day: 20, villager: 'evelyn' },
  { season: 'winter', day: 23, villager: 'leah' },
  { season: 'winter', day: 26, villager: 'clint' }
]

const BIRTHDAYS = BIRTHDAY_DATES.map((row) => {
  const loves = (NPC_GIFTS[row.villager] && NPC_GIFTS[row.villager].loves) || []
  return {
    season: row.season,
    day: row.day,
    villager: row.villager,
    gift: loves.slice(0, 4).join(' / ') || '个人最爱礼物'
  }
})

const TOOL_UPGRADES = [
  {
    name: '镐 / 斧 / 锄 / 水壶',
    levels: [
      { tier: '铜', cost: '2,000g + 铜锭×5', days: 2 },
      { tier: '钢', cost: '5,000g + 铁锭×5', days: 2 },
      { tier: '金', cost: '10,000g + 金锭×5', days: 2 },
      { tier: '铱', cost: '25,000g + 铱锭×5', days: 2 }
    ]
  },
  {
    name: '垃圾桶',
    levels: [
      { tier: '铜', cost: '1,000g + 铜锭×5', days: 2 },
      { tier: '钢', cost: '2,500g + 铁锭×5', days: 2 },
      { tier: '金', cost: '5,000g + 金锭×5', days: 2 },
      { tier: '铱', cost: '12,500g + 铱锭×5', days: 2 }
    ]
  },
  {
    name: '淘金盘',
    levels: [
      { tier: '铜', cost: '初始为铜级', days: 0 },
      { tier: '钢', cost: '5,000g + 铁锭×5', days: 2 },
      { tier: '金', cost: '10,000g + 金锭×5', days: 2 },
      { tier: '铱', cost: '25,000g + 铱锭×5', days: 2 }
    ]
  }
]

const PROFIT_CROPS = [
  { id: 'strawberry', name: '草莓', season: 'spring', seedCost: 100, days: 8, regrow: 4, sell: 120, multi: 1, exp: 18 },
  { id: 'cauliflower', name: '花椰菜', season: 'spring', seedCost: 80, days: 12, regrow: 0, sell: 175, multi: 1, exp: 23 },
  { id: 'potato', name: '土豆', season: 'spring', seedCost: 50, days: 6, regrow: 0, sell: 80, multi: 1.2, exp: 14 },
  { id: 'blueberry', name: '蓝莓', season: 'summer', seedCost: 80, days: 13, regrow: 4, sell: 50, multi: 3, exp: 10 },
  { id: 'starfruit', name: '杨桃', season: 'summer', seedCost: 400, days: 13, regrow: 0, sell: 750, multi: 1, exp: 43 },
  { id: 'melon', name: '甜瓜', season: 'summer', seedCost: 80, days: 12, regrow: 0, sell: 250, multi: 1, exp: 27 },
  { id: 'hops', name: '啤酒花', season: 'summer', seedCost: 60, days: 11, regrow: 1, sell: 25, multi: 1, exp: 6 },
  { id: 'cranberry', name: '蔓越莓', season: 'fall', seedCost: 240, days: 7, regrow: 5, sell: 75, multi: 2, exp: 14 },
  { id: 'pumpkin', name: '南瓜', season: 'fall', seedCost: 100, days: 13, regrow: 0, sell: 320, multi: 1, exp: 31 },
  { id: 'grape', name: '葡萄', season: 'fall', seedCost: 60, days: 10, regrow: 3, sell: 80, multi: 1, exp: 14 },
  { id: 'ancient', name: '古代水果', season: 'greenhouse', seedCost: 0, days: 28, regrow: 7, sell: 550, multi: 1, exp: 38 }
]

/** 肥料：额外成本 + 生长天数缩短比例（简化估算） */
const FERTILIZERS = [
  { id: 'none', name: '无肥料', cost: 0, speed: 0, qualityBoost: 0 },
  { id: 'basic', name: '基础肥料', cost: 100, speed: 0, qualityBoost: 0.1 },
  { id: 'quality', name: '高级肥料', cost: 150, speed: 0, qualityBoost: 0.2 },
  { id: 'speed', name: '速度生长剂', cost: 100, speed: 0.1, qualityBoost: 0 },
  { id: 'deluxe_speed', name: '高级速度生长剂', cost: 150, speed: 0.25, qualityBoost: 0 }
]

function calcSeasonProfit(crop, tiles, seasonDays = 28, fertilizer = null) {
  const fert = fertilizer || FERTILIZERS[0]
  const speed = fert.speed || 0
  const growDays = Math.max(1, Math.ceil(crop.days * (1 - speed)))
  const sellMul = 1 + (fert.qualityBoost || 0)
  const fertCost = (fert.cost || 0) * tiles
  if (growDays > seasonDays) {
    const cost = tiles * crop.seedCost + fertCost
    return {
      harvests: 0,
      revenue: 0,
      cost,
      profit: -cost,
      exp: 0,
      growDays,
      perTileProfit: 0
    }
  }
  let harvests = 1
  if (crop.regrow > 0) {
    const remain = seasonDays - growDays
    harvests += Math.floor(remain / crop.regrow)
  } else {
    harvests = Math.floor(seasonDays / growDays)
  }
  const perHarvest = crop.sell * sellMul * crop.multi * tiles
  const revenue = Math.floor(perHarvest * harvests)
  const seedCost = tiles * crop.seedCost * (crop.regrow > 0 ? 1 : harvests)
  const cost = seedCost + fertCost
  const profit = revenue - cost
  const exp = Math.floor((crop.exp || 10) * harvests * tiles * crop.multi)
  return {
    harvests,
    revenue,
    cost,
    profit,
    exp,
    growDays,
    perTileProfit: tiles ? Math.floor(profit / tiles) : 0
  }
}

function compareCrops(cropIds, tiles, seasonDays, fertilizer) {
  return cropIds.map((id) => {
    const crop = PROFIT_CROPS.find((c) => c.id === id)
    if (!crop) return null
    const r = calcSeasonProfit(crop, tiles, seasonDays, fertilizer)
    return { crop, ...r }
  }).filter(Boolean).sort((a, b) => b.profit - a.profit)
}

const SEASON_CN_FULL = { spring: '春季', summer: '夏季', fall: '秋季', winter: '冬季' }

/**
 * 种植规划一句话建议（用于操作提示）
 * 例：建议：夏季种植蓝莓，收益比甜瓜高约 53%
 */
function getPlantPlanInsight(season = 'summer', tiles = 48, days = 28) {
  const pairs = {
    // 对比对象为游戏「甜瓜」；提示文案用「西瓜」更贴玩家口语（需求示例）
    summer: { topId: 'blueberry', vsId: 'melon', topName: '蓝莓', vsName: '西瓜' },
    spring: { topId: 'strawberry', vsId: 'cauliflower', topName: '草莓', vsName: '花椰菜' },
    fall: { topId: 'cranberry', vsId: 'pumpkin', topName: '蔓越莓', vsName: '南瓜' },
    winter: { topId: 'ancient', vsId: null, topName: '古代水果', vsName: '' }
  }
  const conf = pairs[season] || pairs.summer
  const seasonName = SEASON_CN_FULL[season] || '当季'
  const top = PROFIT_CROPS.find((c) => c.id === conf.topId)
  if (!top) {
    return { text: '建议：先设置游戏进度，再查看当季种植规划', short: '查看种植规划', pct: 0 }
  }
  const topR = calcSeasonProfit(top, tiles, days)
  if (!conf.vsId) {
    const text = `建议：${seasonName}室外难种，温室优先${conf.topName}（长期高收益）`
    return {
      text,
      short: text,
      topName: conf.topName,
      vsName: '',
      pct: 0,
      topProfit: topR.profit,
      vsProfit: 0
    }
  }
  const vs = PROFIT_CROPS.find((c) => c.id === conf.vsId)
  const vsR = calcSeasonProfit(vs, tiles, days)
  let pct = 0
  if (vsR.profit > 0) {
    pct = Math.round(((topR.profit - vsR.profit) / vsR.profit) * 100)
  }
  const vsLabel = conf.vsName
  let text
  if (pct > 0) {
    text = `建议：${seasonName}种植${conf.topName}，收益比${vsLabel}高约${pct}%`
  } else if (pct < 0) {
    text = `建议：${seasonName}${vsLabel}单季净利略高；${conf.topName}更适合多次收获节奏`
  } else {
    text = `建议：${seasonName}可优先考虑${conf.topName}（与${vsLabel}接近）`
  }
  return {
    text,
    short: text,
    topName: conf.topName,
    vsName: vsLabel,
    pct,
    topProfit: topR.profit,
    vsProfit: vsR.profit
  }
}

function getAchievements() {
  return ACHIEVEMENTS || []
}

function getAchievementCats() {
  return ACHIEVEMENT_CATS || []
}

module.exports = {
  getAllItems,
  getItemById,
  getVillager,
  searchItems,
  filterItems,
  enrichItem,
  getItemRelations,
  getCategoryStats,
  getAchievements,
  getAchievementCats,
  QUICK_FILTERS,
  HOME_MODULES,
  CODEX_QUICK,
  FESTIVAL_GUIDES,
  SEASON_PLANS,
  UNIVERSAL_GIFTS,
  BIRTHDAYS,
  TOOL_UPGRADES,
  PROFIT_CROPS,
  FERTILIZERS,
  calcSeasonProfit,
  compareCrops,
  getPlantPlanInsight,
  CATEGORY_META,
  SEASON_META,
  VILLAGERS,
  ACHIEVEMENTS,
  ACHIEVEMENT_CATS,
  ACHIEVEMENTS_WIKI
}
