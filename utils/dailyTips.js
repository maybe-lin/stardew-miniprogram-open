/**
 * 今日提示：结合游戏进度
 * - 当季重点
 * - 临近节日
 * - 临近生日
 */
const gameTime = require('./gameTime.js')
const { getNpcProfiles } = require('./npcs.js')
const { QUEEN_OF_SAUCE_SCHEDULE } = require('../data/cooking_sources.js')

const SEASON_ORDER = ['spring', 'summer', 'fall', 'winter']
const SEASON_CN = { spring: '春', summer: '夏', fall: '秋', winter: '冬' }
const SEASON_FULL = { spring: '春季', summer: '夏季', fall: '秋季', winter: '冬季' }

/** 节日日历（季节 day 1-28；跨天用 endDay） */
const FESTIVALS = [
  {
    id: 'egg_festival',
    season: 'spring',
    day: 13,
    name: '蛋节',
    emoji: '🥚',
    tip: '务必多买草莓种子，多次收获是春季利润核心。',
    action: 'list',
    actionText: '查看春季作物',
    filter: { season: 'spring', category: 'crop' }
  },
  {
    id: 'flower_dance',
    season: 'spring',
    day: 24,
    name: '花舞会',
    emoji: '💃',
    tip: '与心仪 NPC 跳舞可增加好感（需一定友谊）。',
    action: 'npcs',
    actionText: '打开村民图鉴'
  },
  {
    id: 'luau',
    season: 'summer',
    day: 11,
    name: '夏威夷宴会',
    emoji: '🍲',
    tip: '往汤锅加入高品质食材，争取金星评价。',
    action: 'list',
    actionText: '查看料理',
    filter: { category: 'cooking' }
  },
  {
    id: 'jelly',
    season: 'summer',
    day: 28,
    name: '月光水母之舞',
    emoji: '🪼',
    tip: '海边观赏水母，无实质奖励，别忘了去看看。',
    action: 'toolbox',
    actionText: '打开工具箱'
  },
  {
    id: 'fair',
    season: 'fall',
    day: 16,
    name: '星露谷展览会',
    emoji: '🎪',
    tip: '带高价值展示物换星之代币（可买稀有物）。',
    action: 'list',
    actionText: '高售价物品',
    filter: { sort: 'price_desc' }
  },
  {
    id: 'spirit_eve',
    season: 'fall',
    day: 27,
    name: '万灵节',
    emoji: '🎃',
    tip: '迷宫尽头拿金南瓜，是几乎人人最爱的通用礼物。',
    action: 'list',
    actionText: '通用最爱',
    filter: { tag: '通用最爱' }
  },
  {
    id: 'ice_festival',
    season: 'winter',
    day: 8,
    name: '冰雪节',
    emoji: '❄️',
    tip: '可参加钓鱼比赛赢取奖励，记得带鱼竿。',
    action: 'list',
    actionText: '查看鱼类',
    filter: { category: 'fish' }
  },
  {
    id: 'night_market',
    season: 'winter',
    day: 15,
    endDay: 17,
    name: '夜市',
    emoji: '🌃',
    tip: '冬15–17：潜水艇钓鱼、商人、烟花与稀有物品。',
    action: 'list',
    actionText: '查看鱼类',
    filter: { category: 'fish' }
  },
  {
    id: 'feast',
    season: 'winter',
    day: 25,
    name: '冬日盛宴',
    emoji: '🎁',
    tip: '提前把礼物放进神秘箱子，参与礼物交换。',
    action: 'npcs',
    actionText: '查看村民喜好'
  }
]

/** 当季常驻建议（按日期段挑 1 条） */
const SEASON_TIPS = {
  spring: [
    { from: 1, to: 12, title: '春季种植准备', desc: '优先种防风草/土豆攒钱，春13花舞节前留足买草莓的钱。', action: 'list', actionText: '春季作物', filter: { season: 'spring', category: 'crop' } },
    { from: 13, to: 13, title: '今天花舞节！', desc: '花舞节当天尽量把草莓种子买满，这是春季最赚的投入。', action: 'list', actionText: '春季作物', filter: { season: 'spring', category: 'crop' } },
    { from: 14, to: 23, title: '草莓生长期', desc: '草莓种下后约 8 天首收，之后每 4 天，记得浇水。', action: 'list', actionText: '春季作物', filter: { season: 'spring', category: 'crop' } },
    { from: 24, to: 24, title: '今天花舞会', desc: '与 NPC 跳舞提升好感；也可趁机社交送礼。', action: 'npcs', actionText: '村民图鉴' },
    { from: 25, to: 28, title: '春季收尾', desc: '清田准备夏季；雨天可钓鲶鱼/鳗鱼，山间湖有传说之鱼。', action: 'list', actionText: '查看鱼类', filter: { category: 'fish' } }
  ],
  summer: [
    { from: 1, to: 10, title: '夏季利润核心', desc: '蓝莓多次收获最稳；甜瓜、啤酒花也可规划。', action: 'list', actionText: '夏季作物', filter: { season: 'summer', category: 'crop' } },
    { from: 11, to: 11, title: '今天夏威夷宴会', desc: '往汤锅加铱星/金星食材，争取最好评价。', action: 'list', actionText: '查看料理', filter: { category: 'cooking' } },
    { from: 12, to: 20, title: '暑期冲矿', desc: '尽量冲矿井 80+ 层出金，升级水壶/镐与洒水器。', action: 'list', actionText: '查看矿物', filter: { category: 'mineral' } },
    { from: 21, to: 27, title: '夏季收尾种植', desc: '别种来不及收的作物；河豚（晴天 12–16 海洋）可送礼艾略特。', action: 'list', actionText: '查看鱼类', filter: { category: 'fish' } },
    { from: 28, to: 28, title: '今天月光水母', desc: '晚上到海滩看水母之舞，轻松一日。', action: 'toolbox', actionText: '工具箱' }
  ],
  fall: [
    { from: 1, to: 15, title: '秋季赚钱季', desc: '蔓越莓多次收获 + 南瓜高价，记得备秋季作物包材料。', action: 'list', actionText: '秋季作物', filter: { season: 'fall', category: 'crop' } },
    { from: 16, to: 16, title: '今天星露谷展览会', desc: '带高价值物品参展，星之代币能换稀有种子/帽子。', action: 'list', actionText: '高价物品', filter: { sort: 'price_desc' } },
    { from: 17, to: 26, title: '秋季中后期', desc: '鲑鱼季；准备万灵节。葡萄/玉米可加工酒和罐头。', action: 'list', actionText: '查看鱼类', filter: { category: 'fish' } },
    { from: 27, to: 27, title: '今天万灵节', desc: '走迷宫拿金南瓜——几乎所有人的最爱礼物。', action: 'list', actionText: '通用最爱', filter: { tag: '通用最爱' } },
    { from: 28, to: 28, title: '秋季最后一天', desc: '清空地块，准备过冬；矿物、鱼和社交是冬季主线。', action: 'list', actionText: '查看矿物', filter: { category: 'mineral' } }
  ],
  winter: [
    { from: 1, to: 7, title: '冬季开局', desc: '几乎无室外作物，重点：下矿、钓鱼、送礼升级关系。', action: 'list', actionText: '查看矿物', filter: { category: 'mineral' } },
    { from: 8, to: 8, title: '今天冰雪节', desc: '可参加钓鱼比赛，赢取装饰与奖励。', action: 'list', actionText: '查看鱼类', filter: { category: 'fish' } },
    { from: 9, to: 14, title: '夜市倒计时', desc: '冬15–17夜市别错过：潜水艇、商人、稀有货。', action: 'list', actionText: '查看鱼类', filter: { category: 'fish' } },
    { from: 15, to: 17, title: '夜市进行中', desc: '每天可潜水；关注神秘商人与限定商品。', action: 'list', actionText: '查看鱼类', filter: { category: 'fish' } },
    { from: 18, to: 24, title: '冬季社交与矿', desc: '冬日盛宴将至；冬根/水晶果用于冬季采集包。', action: 'list', actionText: '查看采集', filter: { category: 'forage' } },
    { from: 25, to: 25, title: '今天冬日盛宴', desc: '神秘礼物交换，提前把礼物放进箱子。', action: 'npcs', actionText: '村民喜好' },
    { from: 26, to: 28, title: '年底收尾', desc: '清仓、存种子，准备来年春季第一天开种。', action: 'list', actionText: '春季作物', filter: { season: 'spring', category: 'crop' } }
  ]
}

function dayIndex(season, day) {
  const si = SEASON_ORDER.indexOf(season)
  const s = si < 0 ? 0 : si
  const d = Math.min(28, Math.max(1, day | 0))
  return s * 28 + (d - 1)
}

/** 从 progress 到目标季节日，还要几天（0=今天；跨年正数） */
function daysUntil(progress, season, day) {
  const cur = dayIndex(progress.season, progress.day)
  let target = dayIndex(season, day)
  let delta = target - cur
  if (delta < 0) delta += 112 // 一年 4*28
  return delta
}

function festivalActiveDelta(progress, fest) {
  const start = daysUntil(progress, fest.season, fest.day)
  if (!fest.endDay || fest.endDay === fest.day) return start
  // 多日节日：若今天在区间内返回 0
  const end = daysUntil(progress, fest.season, fest.endDay)
  // 若 start 已过但 end 未过 → 进行中
  // daysUntil 对过去日期会 +112，所以用绝对日比较更稳
  const cur = dayIndex(progress.season, progress.day)
  const a = dayIndex(fest.season, fest.day)
  const b = dayIndex(fest.season, fest.endDay)
  if (cur >= a && cur <= b) return 0
  return start
}

function formatInDays(n) {
  if (n === 0) return '今天'
  if (n === 1) return '明天'
  if (n === 2) return '后天'
  return n + '天后'
}

function getSeasonTip(progress) {
  const list = SEASON_TIPS[progress.season] || SEASON_TIPS.spring
  const day = progress.day || 1
  const hit = list.find(t => day >= t.from && day <= t.to) || list[0]
  return {
    id: 'season_' + progress.season + '_' + day,
    kind: 'season',
    badge: SEASON_FULL[progress.season] || '当季',
    emoji: progress.season === 'spring' ? '🌸' : progress.season === 'summer' ? '☀️' : progress.season === 'fall' ? '🍂' : '❄️',
    title: hit.title,
    desc: hit.desc,
    action: hit.action,
    actionText: hit.actionText,
    filter: hit.filter || null
  }
}

function getFestivalTips(progress, withinDays) {
  withinDays = withinDays == null ? 7 : withinDays
  const out = []
  FESTIVALS.forEach(f => {
    const delta = festivalActiveDelta(progress, f)
    if (delta > withinDays) return
    const when = formatInDays(delta)
    const range =
      f.endDay && f.endDay !== f.day
        ? `${SEASON_CN[f.season]}${f.day}–${f.endDay}`
        : `${SEASON_CN[f.season]}${f.day}`
    out.push({
      id: 'fest_' + f.id,
      kind: 'festival',
      badge: delta === 0 ? '节日今天' : '临近节日',
      emoji: f.emoji,
      title: `${when} · ${f.name}`,
      desc: `📅 ${range}。${f.tip}`,
      action: f.action,
      actionText: f.actionText,
      filter: f.filter || null,
      delta
    })
  })
  out.sort((a, b) => a.delta - b.delta)
  return out
}

function getBirthdayTips(progress, withinDays) {
  withinDays = withinDays == null ? 5 : withinDays
  const out = []
  // 走 getNpcProfiles：生日/礼物已与 BIRTHDAYS + npc_gifts 对齐，覆盖全部村民
  getNpcProfiles().forEach(n => {
    if (!n.birthday || !n.birthday.season) return
    const delta = daysUntil(progress, n.birthday.season, n.birthday.day)
    if (delta > withinDays) return
    const loveNames = (n.loves || []).map(x => x.name || x).filter(Boolean)
    const giftHint = loveNames.length
      ? `最爱：${loveNames.slice(0, 3).join('、')}`
      : '记得带礼物！'
    const when = formatInDays(delta)
    out.push({
      id: 'bday_' + n.id,
      kind: 'birthday',
      badge: delta === 0 ? '今天生日' : '临近生日',
      emoji: '🎂',
      title: `${when} · ${n.name} 生日`,
      desc: `📅 ${n.birthday.text}。${giftHint}`,
      action: 'npc',
      actionText: '查看档案',
      npcId: n.id,
      delta,
      loves: loveNames
    })
  })
  out.sort((a, b) => a.delta - b.delta || a.title.localeCompare(b.title, 'zh'))
  return out
}

/** 酱料女皇：距下次周日放送（基于当前进度） */
function getQueenOfSauceTips(progress, withinDays) {
  withinDays = withinDays == null ? 3 : withinDays
  progress = progress || gameTime.getProgress()
  const year = Math.max(1, Number(progress.year) || 1)
  const parity = year % 2 === 1 ? 'odd' : 'even'
  const schedule = (QUEEN_OF_SAUCE_SCHEDULE && QUEEN_OF_SAUCE_SCHEDULE[parity]) || []
  const out = []
  schedule.forEach(ep => {
    const delta = daysUntil(progress, ep.season, ep.day)
    if (delta > withinDays) return
    const when = formatInDays(delta)
    const yearLabel = parity === 'odd' ? '奇数年' : '偶数年'
    out.push({
      id: 'qos_' + ep.id,
      kind: 'qos',
      badge: delta === 0 ? '今天电视' : '临近电视',
      emoji: '📺',
      title: `${when} · 酱料女皇《${ep.name}》`,
      desc: `${yearLabel} ${SEASON_CN[ep.season]}${ep.day} 周日放送。错过要等两年后同奇/偶数年；周三重播也可能补漏。`,
      action: 'item',
      actionText: '查看菜谱',
      itemId: ep.id,
      delta
    })
  })
  // 周三：提醒可能重播
  const day = Math.max(1, Math.min(28, Number(progress.day) || 1))
  if ([3, 10, 17, 24].indexOf(day) >= 0) {
    out.unshift({
      id: 'qos_rerun_today',
      kind: 'qos',
      badge: '今天重播',
      emoji: '🔁',
      title: '今天周三 · 酱料女皇可能重播',
      desc: '优先播放你还不会的菜谱。记得开电视补漏，别只盯周日。',
      action: 'list',
      actionText: '料理图鉴',
      filter: { category: 'cooking', sort: 'must_first' },
      delta: 0
    })
  }
  out.sort((a, b) => a.delta - b.delta)
  return out
}

/**
 * 生成首页「今日提示」列表（多条）
 * 顺序：进行中的节日/生日 → 当季建议 → 临近节日 → 临近生日
 */
function buildDailyTips(progress) {
  progress = progress || gameTime.getProgress()
  const seasonTip = getSeasonTip(progress)
  const festivals = getFestivalTips(progress, 7)
  const birthdays = getBirthdayTips(progress, 5)
  const qosTips = getQueenOfSauceTips(progress, 3)

  const todayFest = festivals.filter(f => f.delta === 0)
  const soonFest = festivals.filter(f => f.delta > 0)
  const todayBday = birthdays.filter(b => b.delta === 0)
  const soonBday = birthdays.filter(b => b.delta > 0)
  const todayQos = qosTips.filter(t => t.delta === 0)
  const soonQos = qosTips.filter(t => t.delta > 0)

  const tips = []
  // 今天优先
  todayFest.forEach(t => tips.push(t))
  todayBday.forEach(t => tips.push(t))
  todayQos.forEach(t => tips.push(t))
  // 当季
  tips.push(seasonTip)
  // 临近
  soonFest.forEach(t => tips.push(t))
  soonBday.forEach(t => tips.push(t))
  soonQos.forEach(t => tips.push(t))

  // 兜底：若只有当季一条，补一条通用社交
  if (tips.length < 2) {
    tips.push({
      id: 'common_gift',
      kind: 'common',
      badge: '小技巧',
      emoji: '🎁',
      title: '送礼小技巧',
      desc: '金南瓜、兔子的脚、珍珠是通用最爱，谈恋爱首选。',
      action: 'list',
      actionText: '通用最爱',
      filter: { tag: '通用最爱' }
    })
  }

  return {
    progressText: gameTime.formatProgress(progress),
    tips,
    // 兼容旧单卡字段：取第一条
    primary: tips[0] || seasonTip
  }
}

module.exports = {
  FESTIVALS,
  buildDailyTips,
  getSeasonTip,
  getFestivalTips,
  getBirthdayTips,
  getQueenOfSauceTips,
  daysUntil
}
