Page({
  onShareAppMessage() { return require('../../utils/share.js').onShareAppMessage() },
  onShareTimeline() { return require('../../utils/share.js').onShareTimeline() },
  data: {
    url: '',
    title: '',
    showFallback: false
  },

  onLoad(options) {
    const url = options.url ? decodeURIComponent(options.url) : ''
    const title = options.title ? decodeURIComponent(options.title) : '外部页面'

    if (!url) {
      this.setData({ showFallback: true, title: '无效链接' })
      wx.setNavigationBarTitle({ title: '无法打开' })
      return
    }

    wx.setNavigationBarTitle({ title })
    this.setData({ url, title })

    // 开发者工具/个人主体等环境 web-view 可能不可用，稍后展示兜底
    // 若 web-view 正常加载，用户看不到 fallback
  },

  onLoadWeb() {
    // 页面加载成功
  },

  onError() {
    this.setData({ showFallback: true, url: this.data.url })
    wx.showToast({ title: '页面打开失败', icon: 'none' })
  },

  onMessage() {},

  copyUrl() {
    const url = this.data.url
    if (!url) return
    wx.setClipboardData({
      data: url,
      success() {
        wx.showToast({ title: '链接已复制，请到浏览器打开', icon: 'none', duration: 2500 })
      }
    })
  }
})
