const {
  MUSEUM_INFO,
  TOTAL_REWARDS,
  MINERAL_REWARDS,
  ARTIFACT_REWARDS,
  ACHIEVEMENT_TIPS,
  TIPS
} = require('../../data/museum.js')

const gameTime = require('../../utils/gameTime.js')

Page({
  onShareAppMessage() { return require('../../utils/share.js').onShareAppMessage() },
  onShareTimeline() { return require('../../utils/share.js').onShareTimeline() },
  data: {
    info: MUSEUM_INFO,
    totalRewards: TOTAL_REWARDS,
    mineralRewards: MINERAL_REWARDS,
    artifactRewards: ARTIFACT_REWARDS,
    achievements: ACHIEVEMENT_TIPS,
    tips: TIPS,
    tab: 'total',
    darkMode: false,
    uiSeason: 'spring',
  },

  onShow() {
    const theme = gameTime.pageThemeData()
    gameTime.applySeasonChrome(theme.uiSeason)
    this.setData(theme)
  },

  switchTab(e) {
    const tab = e.currentTarget.dataset.tab
    if (!tab) return
    this.setData({ tab })
  },

  goArtifacts() {
    wx.navigateTo({
      url: '/pages/list/list?category=artifact&sort=name&title=' + encodeURIComponent('古物图鉴')
    })
  },

  goMinerals() {
    wx.navigateTo({
      url: '/pages/list/list?category=mineral&sort=name&title=' + encodeURIComponent('矿物图鉴')
    })
  },

  copyWiki() {
    const url = this.data.info.wikiUrl
    wx.setClipboardData({
      data: url,
      success: () => {
        wx.showToast({ title: '维基链接已复制', icon: 'none' })
      }
    })
  }
})
