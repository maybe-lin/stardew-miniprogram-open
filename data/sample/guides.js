const HOME_MODULES = [
  {
    key: 'codex', title: '基础信息查询', subtitle: '示例入口', emoji: '📖', color: '#5cb85c',
    items: [
      { key: 'crops', title: '作物图鉴', emoji: '🌾', desc: '示例', filter: { category: 'crop' } },
      { key: 'cooking', title: '料理图鉴', emoji: '🍳', desc: '示例', filter: { category: 'cooking', sort: 'must_first', title: '料理图鉴' } }
    ]
  },
  {
    key: 'tools', title: '实用工具', subtitle: '示例', emoji: '🛠️', color: '#E8913A',
    items: [
      { key: 'calendar', title: '季节日历', emoji: '📅', desc: '示例', page: '/pages/toolbox/toolbox?tab=calendar' }
    ]
  },
  {
    key: 'guide', title: '进阶攻略', subtitle: '示例', emoji: '🏆', color: '#7B68EE',
    items: [
      { key: 'special', title: '隐藏/特殊', emoji: '✨', desc: '示例', filter: { tag: '特色物品' } }
    ]
  }
]
const CODEX_QUICK = { crop: [{ key: 'all', label: '全部' }], cooking: [{ key: 'all', label: '全部' }, { key: 'must', label: '只看推荐', onlyMustCook: true }] }
const FESTIVAL_GUIDES = []
const SEASON_PLANS = {
  spring: { plant: [{ name: '防风草', tip: '示例' }], fish: [] },
  summer: { plant: [], fish: [{ name: '金枪鱼', tip: '示例' }] },
  fall: { plant: [], fish: [] },
  winter: { plant: [], fish: [] }
}
const UNIVERSAL_GIFTS = []
module.exports = { HOME_MODULES, CODEX_QUICK, FESTIVAL_GUIDES, SEASON_PLANS, UNIVERSAL_GIFTS }
