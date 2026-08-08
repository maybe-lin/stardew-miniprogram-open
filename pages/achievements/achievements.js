const {
  getAchievements,
  getAchievementCats,
  ACHIEVEMENTS_WIKI
} = require('../../utils/items.js')

const gameTime = require('../../utils/gameTime.js')
const storage = require('../../utils/storage.js')

Page({
  onShareAppMessage() { return require('../../utils/share.js').onShareAppMessage() },
  onShareTimeline() { return require('../../utils/share.js').onShareTimeline() },
  data: {
    cats: [],
    cat: 'all',
    list: [],
    done: 0,
    total: 0,
    percent: 0,
    darkMode: false,
    uiSeason: 'spring',
    wikiUrl: ACHIEVEMENTS_WIKI || 'https://zh.stardewvalleywiki.com/成就'
  },

  onShow() {
    const theme = gameTime.pageThemeData()
    gameTime.applySeasonChrome(theme.uiSeason)
    this.setData({
      ...theme,
      cats: getAchievementCats()
    })
    this.refresh()
  },

  refresh() {
    const doneMap = storage.getAchievementsDone()
    const raw = getAchievements()
    const cat = this.data.cat
    let list = raw.map(a => ({
      ...a,
      done: storage.isAchievementDone(doneMap, a)
    }))
    if (cat && cat !== 'all') {
      list = list.filter(a => a.cat === cat)
    }
    const all = raw.map(a => storage.isAchievementDone(doneMap, a))
    const done = all.filter(Boolean).length
    const total = raw.length
    const percent = total ? Math.round((done / total) * 100) : 0
    this.setData({ list, done, total, percent })
  },

  setCat(e) {
    const cat = e.currentTarget.dataset.cat
    if (!cat) return
    this.setData({ cat })
    this.refresh()
  },

  toggle(e) {
    const id = e.currentTarget.dataset.id
    const name = e.currentTarget.dataset.name
    if (!id && !name) return
    storage.toggleAchievementDone({ id, name })
    this.refresh()
  },

  openWiki() {
    const url = this.data.wikiUrl
    wx.setClipboardData({
      data: url,
      success: () => {
        wx.showModal({
          title: '维基链接已复制',
          content: '已复制成就维基地址，可在浏览器打开查看完整说明与提示。',
          showCancel: false
        })
      }
    })
  }
})
