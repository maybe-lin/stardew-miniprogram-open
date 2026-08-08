const app = getApp()
const gameTime = require('../../utils/gameTime.js')
const { getItemById, getAllItems } = require('../../utils/items.js')

/** 解析「物品A、物品B（选5）」→ { slots, pick } */
function parseItems(raw) {
  let text = String(raw || '').trim()
  let pick = 0
  const pickMatch = text.match(/[（(]选\s*(\d+)\s*[）)]/)
  if (pickMatch) pick = Number(pickMatch[1]) || 0
  // 金库：整段当作一项，避免「2,500」被英文逗号拆开
  if (/金币|提交\s*[\d,.\s]*g?|^\d[\d,]*\s*(金|g)/i.test(text)) {
    const one = text.replace(/[（(]选\s*\d+\s*[）)]/g, '').trim()
    return {
      slots: one ? [one] : [],
      pick: 1,
      pickNote: '提交对应金额即可'
    }
  }
  const cleaned = text.replace(/[（(]选\s*\d+\s*[）)]/g, '').trim()
  // 仅用顿号/中文逗号分割；不用英文逗号（会拆坏 2,500）
  const slots = cleaned
    .split(/[、，]/)
    .map(s => s.trim())
    .filter(Boolean)
  return {
    slots,
    pick: pick || slots.length,
    pickNote: pick ? `任选 ${pick} / ${slots.length}` : `需全部 ${slots.length} 项`
  }
}

/** 收集包物品名 → 图鉴 id（去掉数量/品质前缀） */
const BUNDLE_NAME_ALIAS = {
  木材: 'mat_wood',
  石头: 'mat_stone',
  硬木: 'mat_hardwood',
  干草: 'mat_hay',
  史莱姆泥: 'mat_slime',
  蝙蝠翅膀: 'mat_bat_wing',
  太阳精华: 'mat_solar_essence',
  虚空精华: 'mat_void_essence',
  藤壶: 'mat_barnacle',
  大白蛋: 'prod_large_egg',
  大棕蛋: 'prod_large_egg',
  大鸡蛋: 'prod_large_egg',
  大羊奶: 'prod_large_goat_milk',
  大瓶羊奶: 'prod_large_goat_milk',
  山羊奶: 'prod_goat_milk',
  苹果: 'fruit_apple',
  杏: 'fruit_apricot',
  杏子: 'fruit_apricot',
  樱桃: 'fruit_cherry',
  石榴: 'fruit_pomegranate',
  桃子: 'fruit_peach',
  橙子: 'fruit_orange',
  金币: null
}

let _nameIndex = null
function buildNameIndex() {
  if (_nameIndex) return _nameIndex
  _nameIndex = Object.create(null)
  getAllItems().forEach(it => {
    if (it && it.name && it.id && !_nameIndex[it.name]) _nameIndex[it.name] = it.id
  })
  return _nameIndex
}

function normalizeSlotName(raw) {
  let s = String(raw || '').trim()
  // 去掉数量后缀：×99、x10、×5
  s = s.replace(/[×xX]\s*\d+\s*$/g, '').trim()
  // 金币 / 提交金额：无图鉴，不提供「获取」
  if (
    /^金币/.test(s) ||
    /^金\s*币/.test(s) ||
    /^提交/.test(s) ||
    /^\d[\d,]*\s*g$/i.test(s) ||
    /^\d[\d,]*\s*金/.test(s)
  ) {
    return { label: raw, key: '', isMoney: true }
  }
  // 金星品质前缀
  s = s.replace(/^金星/, '').trim()
  // 铱星等
  s = s.replace(/^(银|金|铱)星/, '').trim()
  return { label: raw, key: s, isMoney: false }
}

function resolveItemId(slotLabel) {
  const { key, isMoney } = normalizeSlotName(slotLabel)
  if (isMoney || !key) return ''
  if (BUNDLE_NAME_ALIAS[key] !== undefined) return BUNDLE_NAME_ALIAS[key] || ''
  const idx = buildNameIndex()
  if (idx[key]) return idx[key]
  // 模糊：全等失败时找包含关系（短名优先）
  const all = getAllItems()
  const exactish = all.find(i => i.name === key)
  if (exactish) return exactish.id
  const hit = all
    .filter(i => i.name && (key.indexOf(i.name) >= 0 || i.name.indexOf(key) >= 0))
    .sort((a, b) => a.name.length - b.name.length)[0]
  return hit ? hit.id : ''
}

/** 奖励展示：按奖励名匹配 emoji + 可选物品图标 */
const REWARD_META = {
  '春季种子×30': { emoji: '🌱', icon: '/images/items/crop_007.png' },
  '夏季种子×30': { emoji: '🌿', icon: '/images/items/crop_013.png' },
  '秋季种子×30': { emoji: '🍂', icon: '/images/items/crop_032.png' },
  '冬季种子×30': { emoji: '❄️', icon: '/images/items/crop_038.png' },
  '炭窑': { emoji: '🔥', icon: '/images/items/craft_charcoal_kiln.png' },
  '秋日恩赐×5': { emoji: '🍲', icon: '/images/items/cook_051.png' },
  '生长激素×20': { emoji: '💚', icon: '/images/items/crop_005.png' },
  '优质洒水器': { emoji: '💦', icon: '/images/items/craft_quality_sprinkler.png' },
  '蜂房': { emoji: '🐝', icon: '/images/items/craft_bee_house.png' },
  '罐头瓶': { emoji: '🫙', icon: '/images/items/craft_preserves.png' },
  '压酪机': { emoji: '🧀', icon: '/images/items/craft_cheese_press.png' },
  '小桶': { emoji: '🍷', icon: '/images/items/craft_keg.png' },
  '鱼饵×30': { emoji: '🪱', icon: '/images/items/fish_sardine.png' },
  '精装旋式鱼饵': { emoji: '🎣', icon: '/images/items/fish_tuna.png' },
  '海滩传送图腾×5': { emoji: '🏖️', icon: '/images/items/special_treasure_totem.png' },
  '小型光辉戒指': { emoji: '💍', icon: '/images/items/min_016.png' },
  '蟹笼×3': { emoji: '🦀', icon: '/images/items/fish_crab.png' },
  '海之菜肴×5': { emoji: '🐟', icon: '/images/items/cook_058.png' },
  '熔炉': { emoji: '⚒️', icon: '/images/items/craft_furnace.png' },
  '万象晶球×5': { emoji: '🔮', icon: '/images/items/craft_crystalarium.png' },
  '小型磁铁戒指': { emoji: '🧲', icon: '/images/items/min_003.png' },
  '粉红蛋糕×3（全村好感）': { emoji: '🎂', icon: '/images/items/cook_037.png' },
  '种子生产器': { emoji: '🪴', icon: '/images/items/craft_seed_maker.png' },
  '回收机': { emoji: '♻️', icon: '/images/items/min_006.png' },
  '加热器': { emoji: '🌡️', icon: '/images/buildings/coop.png' },
  '树液采集器': { emoji: '🌳', icon: '/images/items/craft_tapper.png' },
  '巧克力蛋糕×3': { emoji: '🍫', icon: '/images/items/cook_036.png' },
  '品质肥料×30': { emoji: '🪴', icon: '/images/items/crop_008.png' },
  '金库奖励': { emoji: '💰', icon: '/images/items/gift_golden_pumpkin.png' },
  '巴士修复（沙漠）': { emoji: '🚌', icon: '/images/items/forage_033.png' }
}

function rewardMeta(reward) {
  const m = REWARD_META[reward]
  if (m) return { rewardEmoji: m.emoji || '🏅', rewardIcon: m.icon || '', hasRewardIcon: !!m.icon }
  // 兜底：按关键词猜
  if (/种子/.test(reward)) return { rewardEmoji: '🌱', rewardIcon: '', hasRewardIcon: false }
  if (/蛋糕|料理|菜肴/.test(reward)) return { rewardEmoji: '🍰', rewardIcon: '', hasRewardIcon: false }
  if (/戒指/.test(reward)) return { rewardEmoji: '💍', rewardIcon: '', hasRewardIcon: false }
  if (/鱼饵|蟹笼/.test(reward)) return { rewardEmoji: '🎣', rewardIcon: '', hasRewardIcon: false }
  if (/机|窑|炉|桶|瓶|器/.test(reward)) return { rewardEmoji: '⚙️', rewardIcon: '', hasRewardIcon: false }
  return { rewardEmoji: '🏅', rewardIcon: '', hasRewardIcon: false }
}

function buildBundles() {
  const raw = [
    { id: 'b1', room: '工艺室', name: '春季采集', items: '野山葵、黄水仙、韭葱、蒲公英', reward: '春季种子×30' },
    { id: 'b2', room: '工艺室', name: '夏季采集', items: '葡萄、香味浆果、甜豌豆', reward: '夏季种子×30' },
    { id: 'b3', room: '工艺室', name: '秋季采集', items: '普通蘑菇、野梅、榛子、黑莓', reward: '秋季种子×30' },
    { id: 'b4', room: '工艺室', name: '冬季采集', items: '冬根、水晶果、雪山药、番红花', reward: '冬季种子×30' },
    { id: 'b5', room: '工艺室', name: '建筑', items: '木材×99、木材×99、石头×99、硬木×10', reward: '炭窑' },
    { id: 'b6', room: '工艺室', name: '异国采集', items: '椰子、仙人掌果、山洞萝卜、红蘑菇、紫蘑菇、枫糖浆、橡树树脂、松焦油（选5）', reward: '秋日恩赐×5' },
    { id: 'b7', room: '茶水间', name: '春季作物', items: '防风草、青豆、花椰菜、土豆', reward: '生长激素×20' },
    { id: 'b8', room: '茶水间', name: '夏季作物', items: '西红柿、辣椒、蓝莓、甜瓜', reward: '优质洒水器' },
    { id: 'b9', room: '茶水间', name: '秋季作物', items: '玉米、茄子、南瓜、山药', reward: '蜂房' },
    { id: 'b10', room: '茶水间', name: '优质作物', items: '金星防风草×5、金星甜瓜×5、金星南瓜×5、金星玉米×5', reward: '罐头瓶' },
    { id: 'b11', room: '茶水间', name: '动物', items: '大牛奶、大白蛋、大棕蛋、大羊奶、羊毛、鸭蛋（选5）', reward: '压酪机' },
    { id: 'b12', room: '茶水间', name: '工匠', items: '松露油、布料、山羊奶酪、奶酪、蜂蜜、果酱、樱桃、石榴、桃子、苹果、杏、橙子（选6）', reward: '小桶' },
    { id: 'b13', room: '鱼缸', name: '河鱼', items: '太阳鱼、鲶鱼、西鲱、虎纹鳟鱼', reward: '鱼饵×30' },
    { id: 'b14', room: '鱼缸', name: '湖鱼', items: '大嘴鲈鱼、鲤鱼、大头鱼、鲟鱼', reward: '精装旋式鱼饵' },
    { id: 'b15', room: '鱼缸', name: '海鱼', items: '沙丁鱼、金枪鱼、红鲷鱼、罗非鱼', reward: '海滩传送图腾×5' },
    { id: 'b16', room: '鱼缸', name: '夜间垂钓', items: '大眼鱼、鲷鱼、鳗鱼', reward: '小型光辉戒指' },
    { id: 'b17', room: '鱼缸', name: '蟹笼', items: '龙虾、小龙虾、螃蟹、鸟蛤、蚌、牡蛎、虾、蜗牛、玉黍螺、蛤、藤壶（选5）', reward: '蟹笼×3' },
    { id: 'b18', room: '鱼缸', name: '特色鱼类', items: '河豚、鬼鱼、沙鱼、木跃鱼', reward: '海之菜肴×5' },
    { id: 'b19', room: '锅炉房', name: '铁匠', items: '铜锭、铁锭、金锭', reward: '熔炉' },
    { id: 'b20', room: '锅炉房', name: '地理学家', items: '石英、地晶、泪晶、火石英', reward: '万象晶球×5' },
    { id: 'b21', room: '锅炉房', name: '冒险家', items: '史莱姆泥×99、蝙蝠翅膀×10、太阳精华、虚空精华（选2）', reward: '小型磁铁戒指' },
    { id: 'b22', room: '布告栏', name: '厨师', items: '枫糖浆、羊肚菌、炸鱿鱼、辣椒、茄子', reward: '粉红蛋糕×3（全村好感）' },
    { id: 'b23', room: '布告栏', name: '染料', items: '红蘑菇、海胆、向日葵、鸭毛、海蓝宝石、红叶卷心菜', reward: '种子生产器' },
    { id: 'b24', room: '布告栏', name: '田野研究', items: '紫蘑菇、鹦鹉螺、红鲷鱼、冰封晶球', reward: '回收机' },
    { id: 'b25', room: '布告栏', name: '饲料', items: '小麦×10、干草×10、苹果×3', reward: '加热器' },
    { id: 'b26', room: '布告栏', name: '附魔师', items: '橡树树脂、葡萄酒、兔子的脚、石榴', reward: '树液采集器' },
    { id: 'b27', room: '金库', name: '2,500 金', items: '提交 2,500g', reward: '巧克力蛋糕×3' },
    { id: 'b28', room: '金库', name: '5,000 金', items: '提交 5,000g', reward: '品质肥料×30' },
    { id: 'b29', room: '金库', name: '10,000 金', items: '提交 10,000g', reward: '金库奖励' },
    { id: 'b30', room: '金库', name: '25,000 金', items: '提交 25,000g', reward: '巴士修复（沙漠）' }
  ]
  return raw.map(b => {
    const parsed = parseItems(b.items)
    const meta = rewardMeta(b.reward)
    return {
      ...b,
      slots: parsed.slots,
      pick: parsed.pick,
      pickNote: parsed.pickNote,
      slotCount: parsed.slots.length,
      open: false,
      ...meta
    }
  })
}

Page({
  onShareAppMessage() { return require('../../utils/share.js').onShareAppMessage() },
  onShareTimeline() { return require('../../utils/share.js').onShareTimeline() },
  data: {
    rooms: ['全部', '工艺室', '茶水间', '鱼缸', '锅炉房', '布告栏', '金库'],
    currentRoom: '全部',
    list: [],
    filteredList: [],
    progress: {},
    slots: {},
    doneCount: 0,
    totalCount: 0,
    darkMode: false,
    uiSeason: 'spring'
  },

  onLoad() {
    const list = buildBundles()
    const bag = app.getProgress('bundles') || {}
    // 兼容旧版：progress[id]=true；新版 slots 分项勾选
    const progress = bag.done && typeof bag.done === 'object' ? bag.done : bag
    const slots = bag.slots && typeof bag.slots === 'object' ? bag.slots : {}
    this._allList = list
    this.setData({ list, progress, slots, totalCount: list.length })
    this.applyFilter('全部')
  },

  onShow() {
    const theme = gameTime.pageThemeData()
    gameTime.applySeasonChrome(theme.uiSeason)
    this.setData(theme)
  },

  applyFilter(room) {
    const list = this._allList || this.data.list
    let filtered = list
    if (room && room !== '全部') {
      filtered = list.filter(item => item.room === room)
    }
    // 保留展开状态
    const openMap = {}
    ;(this.data.filteredList || []).forEach(b => { if (b.open) openMap[b.id] = true })
    filtered = filtered.map(b => ({
      ...b,
      open: !!openMap[b.id],
      ...this._bundleView(b)
    }))
    const doneCount = list.filter(b => this._isBundleDone(b)).length
    this.setData({
      filteredList: filtered,
      currentRoom: room || '全部',
      doneCount,
      totalCount: list.length
    })
  },

  _slotMap(bundleId) {
    const slots = this.data.slots || {}
    const m = slots[bundleId]
    return m && typeof m === 'object' ? m : {}
  },

  _checkedCount(bundle) {
    const m = this._slotMap(bundle.id)
    return (bundle.slots || []).reduce((n, _, i) => n + (m[i] ? 1 : 0), 0)
  },

  _isBundleDone(bundle) {
    if (this.data.progress && this.data.progress[bundle.id]) return true
    const need = bundle.pick || (bundle.slots || []).length
    return this._checkedCount(bundle) >= need && need > 0
  },

  _bundleView(bundle) {
    const checked = this._checkedCount(bundle)
    const need = bundle.pick || bundle.slotCount || 0
    const done = this._isBundleDone(bundle)
    const slotMap = this._slotMap(bundle.id)
    const slotRows = (bundle.slots || []).map((name, index) => {
      const itemId = resolveItemId(name)
      return {
        index,
        name,
        on: !!slotMap[index],
        itemId,
        canOpen: !!itemId && !!getItemById(itemId)
      }
    })
    return {
      checked,
      need,
      done,
      progressText: `${checked}/${need}`,
      slotRows
    }
  },

  _persist() {
    app.saveProgress('bundles', {
      done: this.data.progress,
      slots: this.data.slots
    })
  },

  onRoomFilter(e) {
    const room = e.currentTarget.dataset.room
    this.applyFilter(room)
  },

  toggleExpand(e) {
    const id = e.currentTarget.dataset.id
    if (!id) return
    const filteredList = (this.data.filteredList || []).map(b => {
      if (b.id !== id) return b
      return { ...b, open: !b.open }
    })
    this.setData({ filteredList })
  },

  /** 整包完成 / 取消（保留分项勾选） */
  toggleBundle(e) {
    const id = e.currentTarget.dataset.id
    if (!id) return
    const progress = { ...(this.data.progress || {}) }
    if (progress[id]) delete progress[id]
    else progress[id] = true
    this.data.progress = progress
    this.setData({ progress })
    this._persist()
    this.applyFilter(this.data.currentRoom)
  },

  /** 展开后勾选某一项 */
  toggleSlot(e) {
    const id = e.currentTarget.dataset.id
    const index = Number(e.currentTarget.dataset.index)
    if (!id || Number.isNaN(index)) return
    const slots = { ...(this.data.slots || {}) }
    const map = { ...(slots[id] || {}) }
    if (map[index]) delete map[index]
    else map[index] = true
    slots[id] = map
    // 若分项已达要求，自动标整包完成
    const bundle = (this._allList || []).find(b => b.id === id)
    const progress = { ...(this.data.progress || {}) }
    if (bundle) {
      const checked = (bundle.slots || []).reduce((n, _, i) => n + (map[i] ? 1 : 0), 0)
      const need = bundle.pick || bundle.slots.length
      if (checked >= need) progress[id] = true
      else if (progress[id] && checked < need) delete progress[id]
    }
    this.data.slots = slots
    this.data.progress = progress
    this.setData({ slots, progress })
    this._persist()
    this.applyFilter(this.data.currentRoom)
  },

  /** 查看该物品如何获取（进详情「获取」Tab） */
  openItem(e) {
    const itemId = e.currentTarget.dataset.itemId
    const name = e.currentTarget.dataset.name || ''
    if (!itemId) {
      wx.showToast({
        title: name ? `「${name}」暂无图鉴条目` : '暂无获取说明',
        icon: 'none'
      })
      return
    }
    if (!getItemById(itemId)) {
      wx.showToast({ title: '物品数据未收录', icon: 'none' })
      return
    }
    wx.navigateTo({
      url: `/pages/item/item?id=${encodeURIComponent(itemId)}&tab=source`
    })
  }
})
