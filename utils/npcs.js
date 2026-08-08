const { HEART_EVENTS } = require('../data/heart_events.js')
const { ITEMS, VILLAGERS } = require('../data/items.js')
const { ITEM_ICONS } = require('../data/item_icons.js')
const { NPC_GIFTS, UNIVERSAL_LOVES, UNIVERSAL_NOTE } = require('../data/npc_gifts.js')
const { groupOf, groupLabel, GROUP_META, FRIENDSHIP_TIPS } = require('../data/friendship.js')
const { NPC_EVENTS } = require('../data/npc_events.js')
const { BIRTHDAYS } = require('./items.js')

const SEASON_NAMES = {
  spring: '春',
  summer: '夏',
  fall: '秋',
  winter: '冬'
}

const FEMALE_IDS = new Set([
  'abigail', 'emily', 'haley', 'leah', 'maru', 'penny', 'marnie', 'robin',
  'caroline', 'jodi', 'pam', 'sandy', 'evelyn', 'jas'
])

const HOME_HINTS = {
  clint: '铁匠铺',
  robin: '木匠的商店',
  demetrius: '木匠的商店',
  caroline: '皮埃尔杂货店',
  pierre: '皮埃尔杂货店',
  jodi: '柳巷 1 号',
  kent: '柳巷 1 号',
  linus: '山区帐篷',
  pam: '拖车 / 巴士站',
  gus: '星之果实餐吧',
  willy: '鱼店',
  sandy: '沙漠绿洲',
  dwarf: '矿井东侧',
  leo: '姜岛 / 树屋',
  evelyn: '河间大道 1 号',
  george: '河间大道 1 号',
  jas: '玛妮的牧场',
  vincent: '柳巷 1 号'
}

const GIFT_NAME_ALIASES = {
  '完整早餐': '完美早餐',
  '罂粟籽松糕': '虞美人籽松糕'
}

const GIFT_ICON_BY_NAME = {
  '完整早餐': '/images/gifts/complete-breakfast.png',
  '石榴': '/images/gifts/pomegranate.png',
  '腌菜': '/images/gifts/pickles.png',
  '松露油': '/images/gifts/truffle-oil.png',
  '青蛙蛋': '/images/gifts/frog-egg.png',
  '虚空蛋': '/images/gifts/void-egg.png',
  '布料': '/images/gifts/cloth.png',
  '鹦鹉蛋': '/images/gifts/parrot-egg.png',
  '动物毛': '/images/gifts/wool.png',
  '罂粟籽松糕': '/images/gifts/poppyseed-muffin.png',
  '爆炒青菜': '/images/gifts/stir-fry.png',
  '松露': '/images/gifts/truffle.png',
  '电池组': '/images/gifts/battery-pack.png',
  '金锭': '/images/gifts/gold-bar.png',
  '铱锭': '/images/gifts/iridium-bar.png',
  '放射性锭': '/images/gifts/radioactive-bar.png',
  '绿茶': '/images/gifts/green-tea.png',
  '朝鲜蓟蘸酱': '/images/gifts/artichoke-dip.png',
  '橙子': '/images/gifts/orange.png',
  '仙女盒': '/images/gifts/fairy-box.png',
  '怪兽香水': '/images/gifts/monster-musk.png',
  '虚空蛋黄酱': '/images/gifts/void-mayonnaise.png',
  '蜂蜜酒': '/images/gifts/mead.png',
  '淡啤酒': '/images/gifts/pale-ale.png',
  '桃子': '/images/gifts/peach.png',
  '太阳精华': '/images/gifts/solar-essence.png',
  '虚空精华': '/images/gifts/void-essence.png',
  '蜥蜴的爪子': '/images/gifts/basilisk-paw.png',
  '战斗季刊': '/images/gifts/combat-quarterly.png',
  '田野小食': '/images/gifts/field-snack.png',
  '羊奶': '/images/gifts/goat-milk.png',
  '大瓶羊奶': '/images/gifts/large-goat-milk.png',
  '浮木': '/images/gifts/driftwood.png',
  '铜锭': '/images/gifts/copper-bar.png',
  '铁锭': '/images/gifts/iron-bar.png',
  'Joja 可乐': '/images/gifts/joja-cola.png',
  '采矿月刊': '/images/gifts/mining-monthly.png',
  '星露谷年历': '/images/gifts/stardew-almanac.png',
  '木匠月刊': '/images/gifts/woodcutters-weekly.png',
  '龙牙': '/images/gifts/dragon-tooth.png',
  '破损的眼镜': '/images/gifts/broken-glasses.png',
  '蜂蜜': '/images/gifts/honey.png',
  '鱼饵和浮漂': '/images/gifts/bait.png'
}

function baseId(id) {
  return String(id || '').replace(/^npc_/, '')
}

function birthdayText(birthday) {
  if (!birthday) return '—'
  return `${SEASON_NAMES[birthday.season] || birthday.season} ${birthday.day}`
}

function findGiftItem(name) {
  // 威利的“鱼饵和浮漂”指一类渔具，并非同名技能书。
  if (name === '鱼饵和浮漂') return null
  const lookupName = GIFT_NAME_ALIASES[name] || name
  const exact = ITEMS.find(item => item.name === lookupName)
  if (exact) return exact
  return ITEMS.find(item => item.name.includes(lookupName) || lookupName.includes(item.name)) || null
}

function giftEmoji(name) {
  if (/蛋/.test(name)) return '🥚'
  if (/鱼|虾|蟹|蛤|贝|螺|海参|鱿|章鱼/.test(name)) return '🐟'
  if (/花|玫瑰|郁金香|黄水仙|蒲公英|向日葵|甜豌豆/.test(name)) return '🌼'
  if (/奶|乳酪|奶酪/.test(name)) return '🥛'
  if (/石|晶|锭|矿|钻石|翡翠|宝石/.test(name)) return '💎'
  if (/酒|啤|茶|咖啡|可乐|汁/.test(name)) return '🥤'
  if (/书|季刊|月刊|图鉴|手册|目录|秘事/.test(name)) return '📖'
  if (/果|桃|橙|椰|葡萄|草莓|蓝莓|芒果/.test(name)) return '🍎'
  return '🎁'
}

function enrichGifts(gifts, source) {
  return (gifts || []).map((gift, index) => {
    const value = typeof gift === 'string' ? { name: gift, source } : gift
    const item = findGiftItem(value.name || '')
    return {
      ...value,
      key: `${value.name || 'gift'}_${index}`,
      itemId: item ? item.id : '',
      icon: GIFT_ICON_BY_NAME[value.name] || (item ? (ITEM_ICONS[item.id] || '') : ''),
      emoji: item ? item.emoji : giftEmoji(value.name || '')
    }
  })
}

function extractSpecificLikes(text) {
  return String(text || '')
    .split(/[、；;]/)
    .map(part => part
      .replace(/[（(].*?[）)]/g, '')
      .replace(/(?:及|和)?(?:多数|所有|常见).*$/, '')
      .trim())
    .filter(name => name && !/^(多数|所有|常见|暂无)/.test(name) && !/类$/.test(name))
}

function birthdayFromTable(id) {
  const row = (BIRTHDAYS || []).find(b => b.villager === id)
  if (!row) return null
  return { season: row.season, day: row.day, text: birthdayText(row) }
}

function giftsFromTable(id) {
  const guide = NPC_GIFTS[id]
  if (!guide) {
    return {
      loves: [],
      likes: '暂无完整记录，请以游戏内或维基为准',
      neutral: '暂无完整记录',
      hates: '暂无完整记录，请以游戏内或维基为准',
      giftComplete: false
    }
  }
  return {
    loves: (guide.loves || []).map(name => ({ name, source: '村民送礼清单' })),
    likes: guide.likes || '',
    neutral: guide.neutral || '',
    hates: guide.hates || '见通用厌恶（杂草、废料等）与个人例外',
    giftComplete: true,
    universalLoves: UNIVERSAL_LOVES,
    universalNote: UNIVERSAL_NOTE
  }
}

function makeFallbackProfile(id, villager) {
  const home = HOME_HINTS[id] || '星露谷区域'
  const gender = FEMALE_IDS.has(id) ? 'f' : 'm'
  return {
    id: `npc_${id}`,
    baseId: id,
    name: villager.name,
    en: villager.en || '',
    group: gender === 'f' ? 'female_other' : 'male_other',
    gender,
    marriageable: false,
    emoji: villager.emoji || '👤',
    avatar: villager.avatar || '',
    color: gender === 'f' ? '#C47BB0' : '#6F8F72',
    home,
    hearts: 0,
    relation: '普通朋友',
    today: { place: home, weather: '日程会随季节和天气变化', time: '建议查看游戏内当天位置' },
    intro: `${villager.name}是鹈鹕镇居民。点击下方送礼清单可查最爱礼物；详细行程与爱心事件会持续补充。`,
    tips: '优先送个人最爱；每周最多 2 次，生日当天可额外送 1 次（×8）。',
    schedule: [],
    isFallback: true
  }
}

function normalizeEvents(events) {
  return (events || []).map((event, index) => ({
    ...event,
    key: `ev_${event.heart || 0}_${index}`,
    type: event.type || 'cutscene',
    typeLabel:
      event.type === 'mail' ? '来信' :
      event.type === 'access' ? '解锁' :
      '过场',
    status: event.status || 'locked'
  }))
}

/**
 * 组装档案：各字段只认一个数据源，避免双写漂移
 * - 身份/简介/行程 → heart_events（或 fallback）
 * - 生日日期 → BIRTHDAYS
 * - 礼物 → npc_gifts
 * - 爱心事件 → npc_events
 */
function normalizeProfile(profile) {
  const id = baseId(profile.id)
  const gift = giftsFromTable(id)
  const events = NPC_EVENTS[id] || []
  const birthday = birthdayFromTable(id) || (profile.birthday
    ? { ...profile.birthday, text: profile.birthday.text || birthdayText(profile.birthday) }
    : { text: '—' })

  const merged = {
    ...profile,
    ...gift,
    events,
    birthday
  }
  const group = groupOf(merged)
  return {
    ...merged,
    id: `npc_${id}`,
    baseId: id,
    group,
    groupLabel: groupLabel(merged),
    groupColor: (GROUP_META[group] || GROUP_META.other).color,
    intro: merged.intro || '',
    tips: merged.tips || '',
    loves: enrichGifts(merged.loves, '村民最爱'),
    likeGifts: enrichGifts(extractSpecificLikes(merged.likes), '喜欢 +45'),
    events: normalizeEvents(merged.events),
    eventCount: events.length,
    schedule: (merged.schedule || []).map((row, index) => ({
      ...row,
      key: `${row.time || 'time'}_${index}`
    }))
  }
}

function getNpcProfiles() {
  const detailed = new Map(
    (HEART_EVENTS || []).map(profile => [baseId(profile.id), profile])
  )
  return Object.keys(VILLAGERS)
    .filter(id => !id.startsWith('almost') && !id.startsWith('all_'))
    .map(id => normalizeProfile(detailed.get(id) || makeFallbackProfile(id, VILLAGERS[id])))
}

function getNpcProfile(id) {
  const wanted = baseId(id)
  return getNpcProfiles().find(profile => profile.baseId === wanted) || null
}

module.exports = {
  baseId,
  getNpcProfile,
  getNpcProfiles,
  FRIENDSHIP_TIPS,
  GROUP_META,
  groupOf,
  groupLabel
}
