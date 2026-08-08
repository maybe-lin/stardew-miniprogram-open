/**
 * NPC 数据一致性检查：单一数据源是否齐全、是否交叉污染
 * 用法：node scripts/check-npc-data.js
 */
const { HEART_EVENTS } = require('../data/heart_events.js')
const { NPC_EVENTS } = require('../data/npc_events.js')
const { NPC_GIFTS } = require('../data/npc_gifts.js')
const { VILLAGERS } = require('../data/items.js')
const { BIRTHDAYS } = require('../utils/items.js')
const { getNpcProfiles } = require('../utils/npcs.js')

function baseId(id) {
  return String(id || '').replace(/^npc_/, '')
}

const errors = []
const warn = []

const villagerIds = Object.keys(VILLAGERS).filter(
  (id) => !id.startsWith('almost') && !id.startsWith('all_')
)

// heart_events 不得再携带会与其它表冲突的字段
const FORBIDDEN = ['events', 'loves', 'likes', 'hates', 'neutral', 'birthday']
for (const p of HEART_EVENTS) {
  for (const key of FORBIDDEN) {
    if (p[key] != null) errors.push(`heart_events.${baseId(p.id)} 仍含 ${key}（应只写对应 SSOT）`)
  }
}

for (const id of villagerIds) {
  if (!NPC_GIFTS[id]) errors.push(`缺少 npc_gifts: ${id}`)
  if (!NPC_EVENTS[id]) errors.push(`缺少 npc_events: ${id}`)
  if (!BIRTHDAYS.find((b) => b.villager === id)) errors.push(`缺少生日: ${id}`)
  else {
    const b = BIRTHDAYS.find((x) => x.villager === id)
    const loves = (NPC_GIFTS[id] && NPC_GIFTS[id].loves) || []
    const expected = loves.slice(0, 4).join(' / ') || '个人最爱礼物'
    if (b.gift !== expected) {
      errors.push(`生日 gift 未从 loves 派生: ${id} ("${b.gift}" ≠ "${expected}")`)
    }
  }
}

// 档案组装
const profiles = getNpcProfiles()
if (profiles.length !== villagerIds.length) {
  errors.push(`档案数 ${profiles.length} ≠ 村民数 ${villagerIds.length}`)
}

for (const p of profiles) {
  if (!p.giftComplete) warn.push(`${p.baseId} 无完整礼物表`)
  if (!(p.eventCount > 0)) warn.push(`${p.baseId} 无爱心事件`)
  if (!p.birthday || !p.birthday.season) errors.push(`${p.baseId} 无生日`)
}

if (errors.length) {
  console.error('NPC 数据检查失败：')
  errors.forEach((e) => console.error('  ✗', e))
  process.exit(1)
}

console.log('NPC 数据检查通过')
console.log(`  村民 ${villagerIds.length} · 档案 ${profiles.length}`)
console.log(`  事件合计 ${profiles.reduce((s, p) => s + (p.eventCount || 0), 0)}`)
console.log(`  详细档案 heart_events ${HEART_EVENTS.length} · 礼物表 ${Object.keys(NPC_GIFTS).length}`)
if (warn.length) {
  console.log('提示：')
  warn.forEach((w) => console.log('  ·', w))
}
