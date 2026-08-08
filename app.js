const storage = require('./utils/storage.js')
const gameTime = require('./utils/gameTime.js')

App({
  onLaunch() {
    // bagProgress：社区中心/新手清单等模块勾选
    // gameProgress：季节日期技能（gameTime）— 两套 key 刻意分离
    this.globalData.progress = storage.getBagProgress()
    this.globalData.darkMode = storage.getDarkMode()
    // 读一次好感表，触发旧 key（裸 baseId）→ npc_* 归一
    try {
      storage.getNpcHeartsMap()
    } catch (e) {}
    try {
      gameTime.applySeasonChrome(gameTime.getProgress().season)
    } catch (e) {}
    this._setupUpdateManager()
  },

  _setupUpdateManager() {
    if (!wx.getUpdateManager) return
    const updateManager = wx.getUpdateManager()
    updateManager.onUpdateReady(() => {
      wx.showModal({
        title: '新版本已准备好',
        content: '重新启动后即可使用最新版页面和数据。',
        confirmText: '立即更新',
        cancelText: '稍后',
        success: (res) => {
          if (res.confirm) updateManager.applyUpdate()
        }
      })
    })
    updateManager.onUpdateFailed(() => {
      wx.showToast({ title: '更新下载失败，请稍后重试', icon: 'none' })
    })
  },

  globalData: {
    progress: {},
    darkMode: false,
    // switchTab 无法带参，用此传工具箱/图鉴初始状态
    toolboxTab: '',
    codexOnlyFav: false
  },

  /** 模块勾选袋：bundles / newbie 等 */
  saveProgress(key, data) {
    const bag = storage.setBagProgressKey(key, data)
    this.globalData.progress = bag
    return bag
  },

  getProgress(key) {
    return storage.getBagProgressKey(key)
  },

  toggleDarkMode() {
    const next = !this.globalData.darkMode
    this.globalData.darkMode = next
    storage.setDarkMode(next)
    try {
      gameTime.applySeasonChrome(gameTime.getProgress().season)
    } catch (e) {}
    return next
  }
})
