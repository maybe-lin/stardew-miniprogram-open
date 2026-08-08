/**
 * 全页面统一转发配置。
 * 微信只有在当前 Page 定义 onShareAppMessage 时才启用“转发给朋友”。
 * 所有分享统一落到新版首页，避免历史页面路径再次打开旧版界面。
 */
module.exports = {
  showShareMenu() {
    if (!wx.showShareMenu) return
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    })
  },

  onShareAppMessage() {
    return {
      title: '星露谷行之小助手｜图鉴、地图与农场规划',
      path: '/pages/home/home'
    }
  },

  onShareTimeline() {
    return {
      title: '星露谷行之小助手｜图鉴、地图与农场规划',
      query: ''
    }
  }
}
