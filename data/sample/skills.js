const SKILL_DEFS = [
  { key: 'farming', name: '耕种', emoji: '🌾' },
  { key: 'mining', name: '采矿', emoji: '⛏️' },
  { key: 'foraging', name: '采集', emoji: '🍄' },
  { key: 'fishing', name: '钓鱼', emoji: '🎣' },
  { key: 'combat', name: '战斗', emoji: '⚔️' }
]
const PROF_L5 = {}
const PROF_L10 = {}
const RECOMMENDS = {}
function defaultSkills() {
  const o = {}
  SKILL_DEFS.forEach(d => { o[d.key] = { level: 0, prof5: '', prof10: '' } })
  return o
}
function normalizeSkills(s) { return s || defaultSkills() }
function getProfById() { return null }
function getItemSellBoost() { return { mult: 1, labels: [], forceIridium: false } }
function summarizeSkills() { return [] }
module.exports = { SKILL_DEFS, PROF_L5, PROF_L10, RECOMMENDS, defaultSkills, normalizeSkills, getProfById, getItemSellBoost, summarizeSkills }
