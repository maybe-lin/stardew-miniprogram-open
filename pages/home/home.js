const {
  searchItems,
  getItemById,
  enrichItem,
  HOME_MODULES,
  getPlantPlanInsight
} = require('../../utils/items.js')
const storage = require('../../utils/storage.js')
const gameTime = require('../../utils/gameTime.js')
const share = require('../../utils/share.js')
const { buildDailyTips } = require('../../utils/dailyTips.js')
const { getNpcProfiles } = require('../../utils/npcs.js')
const {
  DISCLAIMER_FOOTER,
  DISCLAIMER_LINES,
  WIKI_URL
} = require('../../data/disclaimer.js')

const SEASON_PROFIT_META = {
  spring: { name: '春季', icon: '/images/items/crop_010.png' },
  summer: { name: '夏季', icon: '/images/items/crop_013.png' },
  fall: { name: '秋季', icon: '/images/items/crop_032.png' },
  winter: { name: '冬季', icon: '/images/items/crop_038.png' }
}

function buildHomeModules(season) {
  const currentSeason = SEASON_PROFIT_META[season] ? season : 'spring'
  const meta = SEASON_PROFIT_META[currentSeason]
  return HOME_MODULES.map(mod => ({
    ...mod,
    items: (mod.items || []).map(item => {
      if (item.key !== 'season_profit') return item
      return {
        ...item,
        icon: meta.icon,
        desc: `${meta.name}收益排行`,
        filter: {
          ...(item.filter || {}),
          season: currentSeason
        }
      }
    })
  }))
}

function searchHomeContent(keyword) {
  const q = (keyword || '').trim().toLowerCase()
  if (!q) return []
  const npcResults = getNpcProfiles()
    .filter(npc => npc.name.toLowerCase().includes(q) || (npc.en || '').toLowerCase().includes(q))
    .map(npc => ({
      id: npc.id,
      resultType: 'npc',
      name: npc.name,
      nameEn: npc.en,
      icon: npc.avatar,
      hasIcon: !!npc.avatar,
      emoji: npc.emoji,
      categoryName: npc.marriageable ? '可结婚居民' : '居民',
      seasons: [],
      sources: [{ label: '居民图鉴', detail: `${npc.home} · 生日 ${npc.birthday.text}` }],
      basePrice: 0
    }))
  const itemResults = searchItems(keyword).map(item => ({ ...item, resultType: 'item' }))
  return npcResults.concat(itemResults)
}

Page({
  onShareAppMessage() {
    return share.onShareAppMessage()
  },

  onShareTimeline() {
    return share.onShareTimeline()
  },
  data: {
    keyword: '',
    results: [],
    historyItems: [],
    modules: HOME_MODULES,
    dailyTips: [],
    progressText: '',
    loading: false,
    loadingText: '加载中…',
    disclaimerFooter: DISCLAIMER_FOOTER,
    disclaimerLines: DISCLAIMER_LINES,
    wikiUrl: WIKI_URL,
    darkMode: false,
    uiSeason: 'spring'
  },

  onShow() {
    share.showShareMenu()
    const progress = gameTime.getProgress()
    const theme = gameTime.pageThemeData()
    gameTime.applySeasonChrome(theme.uiSeason)
    this.setData({
      ...theme,
      progressText: gameTime.formatProgress(progress),
      modules: buildHomeModules(progress.season)
    })
    this.loadHistory()
    this.pickDaily()
    if (this.data.keyword) {
      this.setData({ results: searchHomeContent(this.data.keyword) })
    }
  },

  loadHistory() {
    // 只展示最后搜索/查看的 5 个（storage 内已裁剪）
    const ids = (storage.getHistory() || []).slice(0, 5)
    const historyItems = ids
      .map(id => enrichItem(getItemById(id)))
      .filter(Boolean)
      .slice(0, 5)
    this.setData({ historyItems })
  },

  pickDaily() {
    const progress = gameTime.getProgress()
    const { tips } = buildDailyTips(progress)
    this.setData({ dailyTips: tips || [] })
  },

  onInput(e) {
    const keyword = e.detail.value
    this.setData({ keyword })
    if (!keyword.trim()) {
      this.setData({ results: [] })
      return
    }
    this.setData({ results: searchHomeContent(keyword) })
  },

  onSearch(e) {
    const keyword = (e.detail.value || this.data.keyword || '').trim()
    this.setData({ keyword, results: searchHomeContent(keyword) })
  },

  goSettings() {
    wx.navigateTo({ url: '/pages/settings/settings' })
  },

  clearSearch() {
    this.setData({ keyword: '', results: [] })
  },

  goItem(e) {
    const id = e.currentTarget.dataset.id
    if (!id) return
    storage.pushHistory(id)
    wx.navigateTo({ url: `/pages/item/item?id=${id}` })
  },

  goSearchResult(e) {
    const id = e.currentTarget.dataset.id
    const type = e.currentTarget.dataset.type
    if (!id) return
    if (type === 'npc') {
      wx.navigateTo({ url: `/pages/npc-detail/npc-detail?id=${encodeURIComponent(id)}` })
      return
    }
    storage.pushHistory(id)
    wx.navigateTo({ url: `/pages/item/item?id=${encodeURIComponent(id)}` })
  },

  onLongPress(e) {
    if (e.currentTarget.dataset.type === 'npc') return
    const id = e.currentTarget.dataset.id
    const name = e.currentTarget.dataset.name
    const collected = storage.isCollected(id)
    const favorited = storage.isFavorite(id)
    wx.showActionSheet({
      itemList: [
        '复制名字',
        collected ? '取消已收集' : '标记为已收集',
        favorited ? '取消收藏' : '加入收藏',
        '查看地图'
      ],
      success: (res) => {
        if (res.tapIndex === 0) {
          wx.setClipboardData({
            data: name,
            success: () => wx.showToast({ title: '已复制', icon: 'none' })
          })
        } else if (res.tapIndex === 1) {
          storage.toggleCollected(id)
          wx.showToast({ title: collected ? '已取消' : '已标记', icon: 'none' })
        } else if (res.tapIndex === 2) {
          storage.toggleFavorite(id)
          wx.showToast({ title: favorited ? '已取消收藏' : '已收藏', icon: 'none' })
        } else if (res.tapIndex === 3) {
          wx.navigateTo({ url: '/packages/map/pages/map/map' })
        }
      }
    })
  },

  clearHistory() {
    storage.clearHistory()
    this.setData({ historyItems: [] })
  },

  /** 模块入口点击 */
  onModuleItem(e) {
    const mKey = e.currentTarget.dataset.mkey
    const iKey = e.currentTarget.dataset.ikey
    const mod = (this.data.modules || []).find(m => m.key === mKey)
    if (!mod) return
    const item = (mod.items || []).find(i => i.key === iKey)
    if (!item) return
    this._openEntry(item)
  },

  _showLoading(text) {
    this.setData({ loading: true, loadingText: text || '加载中…' })
  },

  _hideLoading() {
    this.setData({ loading: false })
  },

  _openEntry(q) {
    if (!q) return

    // 种植规划：先准备操作建议，再直接跳转
    const isPlan =
      q.key === 'plan' ||
      (q.page && q.page.indexOf('tab=plan') >= 0) ||
      q.title === '种植/钓鱼规划'

    if (isPlan) {
      const season = gameTime.getProgress().season || 'summer'
      const insight = getPlantPlanInsight(season)
      this._showLoading('加载中…')
      // 建议只在工具箱页面卡片展示，避免与 toast 叠两条
      getApp().globalData.toolboxTab = 'plan'
      getApp().globalData.planInsight = insight
      wx.switchTab({
        url: '/pages/toolbox/toolbox',
        complete: () => this._hideLoading()
      })
      return
    }

    this._showLoading('加载中…')
    const done = () => this._hideLoading()

    if (q.page) {
      if (q.page.indexOf('/pages/toolbox/toolbox') === 0) {
        const m = q.page.match(/[?&]tab=([^&]+)/)
        getApp().globalData.toolboxTab = m ? decodeURIComponent(m[1]) : 'calendar'
        wx.switchTab({ url: '/pages/toolbox/toolbox', complete: done })
        return
      }
      if (q.page.indexOf('/pages/codex/codex') === 0) {
        getApp().globalData.codexOnlyFav = /fav=1/.test(q.page)
        wx.switchTab({ url: '/pages/codex/codex', complete: done })
        return
      }
      wx.navigateTo({ url: q.page, complete: done })
      return
    }
    const f = q.filter || {}
    const params = []
    if (f.category) params.push('category=' + f.category)
    if (f.tag) params.push('tag=' + encodeURIComponent(f.tag))
    if (f.season) params.push('season=' + f.season)
    if (f.sort) params.push('sort=' + f.sort)
    if (f.rainOnly) params.push('rainOnly=1')
    if (f.onlyMustCook) params.push('onlyMustCook=1')
    params.push('title=' + encodeURIComponent(q.title))
    wx.navigateTo({ url: '/pages/list/list?' + params.join('&'), complete: done })
  },

  onDailyAction(e) {
    const idx = e.currentTarget.dataset.index
    const tip = (this.data.dailyTips || [])[idx]
    if (!tip) return
    const type = tip.action
    if (type === 'list') {
      const f = tip.filter || {}
      const params = []
      if (f.category) params.push('category=' + f.category)
      if (f.tag) params.push('tag=' + encodeURIComponent(f.tag))
      if (f.season) params.push('season=' + f.season)
      if (f.sort) params.push('sort=' + f.sort)
      params.push('title=' + encodeURIComponent(tip.actionText || tip.title || '列表'))
      wx.navigateTo({ url: '/pages/list/list?' + params.join('&') })
    } else if (type === 'toolbox') {
      getApp().globalData.toolboxTab = 'calendar'
      wx.switchTab({ url: '/pages/toolbox/toolbox' })
    } else if (type === 'bundles') {
      wx.navigateTo({ url: '/pages/bundles/bundles' })
    } else if (type === 'npcs') {
      wx.navigateTo({ url: '/pages/npcs/npcs' })
    } else if (type === 'npc' && tip.npcId) {
      wx.navigateTo({
        url: '/pages/npc-detail/npc-detail?id=' + encodeURIComponent(tip.npcId)
      })
    } else if (type === 'item' && tip.itemId) {
      wx.navigateTo({
        url: '/pages/item/item?id=' + encodeURIComponent(tip.itemId)
      })
    }
  },

  goToolbox() {
    getApp().globalData.toolboxTab = 'plan'
    wx.switchTab({ url: '/pages/toolbox/toolbox' })
  },

  copyWiki() {
    wx.setClipboardData({
      data: this.data.wikiUrl || 'https://zh.stardewvalleywiki.com/',
      success: () => wx.showToast({ title: '维基链接已复制', icon: 'none' })
    })
  },

  showDisclaimer() {
    const lines = this.data.disclaimerLines || []
    wx.showModal({
      title: '数据来源与声明',
      content: lines.join('\n\n'),
      showCancel: true,
      cancelText: '关闭',
      confirmText: '复制维基',
      success: (res) => {
        if (res.confirm) this.copyWiki()
      }
    })
  }
})
