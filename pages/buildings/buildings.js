const { BUILDING_GROUPS, FARM_BUILDINGS } = require('../../data/buildings.js')
const BUILDINGS = FARM_BUILDINGS.map(item => ({
  ...item,
  icon: `/images/buildings/${item.id.replace(/_/g, '-')}.png`
}))

const gameTime = require('../../utils/gameTime.js')

Page({
  onShareAppMessage() { return require('../../utils/share.js').onShareAppMessage() },
  onShareTimeline() { return require('../../utils/share.js').onShareTimeline() },
  data: {
    darkMode: false,
    uiSeason: 'spring',
    groups: BUILDING_GROUPS,
    group: 'all',
    keyword: '',
    list: BUILDINGS,
    count: BUILDINGS.length
  },

  onShow() {
    const theme = gameTime.pageThemeData()
    gameTime.applySeasonChrome(theme.uiSeason)
    this.setData(theme)
  },

  setGroup(e) {
    this.setData({ group: e.currentTarget.dataset.group || 'all' })
    this.refresh()
  },

  onSearch(e) {
    this.setData({ keyword: String(e.detail.value || '').trim() })
    this.refresh()
  },

  clearSearch() {
    this.setData({ keyword: '' })
    this.refresh()
  },

  refresh() {
    const { group, keyword } = this.data
    const list = BUILDINGS.filter(item => {
      const inGroup = group === 'all' || item.group === group
      const text = `${item.name}${item.desc}${item.materials}${item.unlocks}`
      return inGroup && (!keyword || text.includes(keyword))
    })
    this.setData({ list, count: list.length })
  }
})
