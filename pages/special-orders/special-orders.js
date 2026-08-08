const {
  SPECIAL_ORDER_META,
  TOWN_ORDERS
} = require('../../data/special_orders.js')

const gameTime = require('../../utils/gameTime.js')

Page({
  onShareAppMessage() { return require('../../utils/share.js').onShareAppMessage() },
  onShareTimeline() { return require('../../utils/share.js').onShareTimeline() },
  data: {
    meta: SPECIAL_ORDER_META,
    list: TOWN_ORDERS,
    filtered: TOWN_ORDERS,
    keyword: '',
    expandedId: '',
    darkMode: false,
    uiSeason: 'spring',
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

  onSearch(e) {
    const keyword = (e.detail.value || '').trim()
    let filtered = TOWN_ORDERS
    if (keyword) {
      const k = keyword.toLowerCase()
      filtered = TOWN_ORDERS.filter((o) => {
        const bag = [o.name, o.client, o.goal, o.farm, String(o.no), ...(o.tags || [])].join(' ')
        return bag.indexOf(keyword) >= 0 || bag.toLowerCase().indexOf(k) >= 0
      })
    }
    this.setData({ keyword, filtered })
  },

  clearSearch() {
    this.setData({ keyword: '', filtered: TOWN_ORDERS })
  },

  toggle(e) {
    const id = e.currentTarget.dataset.id
    this.setData({ expandedId: this.data.expandedId === id ? '' : id })
  },

  goDropFarm() {
    wx.navigateTo({ url: '/pages/drop-farm/drop-farm' })
  },

  copyTip(e) {
    const text = e.currentTarget.dataset.text
    if (!text) return
    wx.setClipboardData({
      data: text,
      success: () => wx.showToast({ title: '已复制速刷提示', icon: 'none' })
    })
  }
})
