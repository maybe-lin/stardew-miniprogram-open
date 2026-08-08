/**
 * 旧版首页兼容入口。
 * 老分享卡片、收藏和历史记录仍可能携带 pages/index/index，统一导向新版首页。
 */
Page({
  onShareAppMessage() { return require('../../utils/share.js').onShareAppMessage() },
  onShareTimeline() { return require('../../utils/share.js').onShareTimeline() },
  data: { redirecting: true },

  onLoad() {
    this.redirectHome()
  },

  onShow() {
    if (!this._redirected) this.redirectHome()
  },

  redirectHome() {
    this._redirected = true
    wx.switchTab({
      url: '/pages/home/home',
      fail: () => {
        this._redirected = false
        wx.reLaunch({ url: '/pages/home/home' })
      }
    })
  }
})
