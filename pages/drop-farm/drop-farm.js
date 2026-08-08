const {
  DROP_FARM_META,
  MONSTER_DROPS,
  MATERIAL_DROPS,
  FARM_RULES
} = require('../../data/drop_farm.js')

const gameTime = require('../../utils/gameTime.js')

Page({
  onShareAppMessage() { return require('../../utils/share.js').onShareAppMessage() },
  onShareTimeline() { return require('../../utils/share.js').onShareTimeline() },
  data: {
    meta: DROP_FARM_META,
    monsters: MONSTER_DROPS,
    materials: MATERIAL_DROPS,
    rules: FARM_RULES,
    tab: 'monster',
    darkMode: false,
    uiSeason: 'spring',
    expandedId: ''
  },

  onLoad() {
    const theme = gameTime.pageThemeData()
    gameTime.applySeasonChrome(theme.uiSeason)
    this.setData(theme)
  },

  onShow() {
    const theme = gameTime.pageThemeData()
    gameTime.applySeasonChrome(theme.uiSeason)
    this.setData(theme)
  },

  switchTab(e) {
    this.setData({ tab: e.currentTarget.dataset.tab })
  },

  toggleExpand(e) {
    const id = e.currentTarget.dataset.id
    this.setData({
      expandedId: this.data.expandedId === id ? '' : id
    })
  },

  copyFloor(e) {
    const text = e.currentTarget.dataset.text
    if (!text) return
    wx.setClipboardData({
      data: text,
      success: () => wx.showToast({ title: '已复制层数提示', icon: 'none' })
    })
  }
})
