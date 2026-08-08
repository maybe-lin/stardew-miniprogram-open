const { filterItems, getItemById } = require('../../utils/items.js')
const storage = require('../../utils/storage.js')
const gameTime = require('../../utils/gameTime.js')

// 按页面 key 记忆滚动
const listScrollMap = {}

Page({
  onShareAppMessage() { return require('../../utils/share.js').onShareAppMessage() },
  onShareTimeline() { return require('../../utils/share.js').onShareTimeline() },
  data: {
    list: [],
    sort: 'default',
    season: '',
    baseFilter: {},
    title: '物品列表',
    darkMode: false,
    uiSeason: 'spring',
    progressText: '',
    scrollTop: 0,
    pageKey: 'default',
    isCooking: false,
    onlyMustCook: false,
    mustCount: 0
  },

  onLoad(options) {
    const baseFilter = {}
    if (options.category) baseFilter.category = options.category
    if (options.tag) baseFilter.tag = decodeURIComponent(options.tag)
    if (options.season) baseFilter.season = options.season
    if (options.location) baseFilter.location = options.location
    if (options.sort) baseFilter.sort = options.sort
    if (options.onlyMustCook === '1' || options.onlyMustCook === 'true') {
      baseFilter.onlyMustCook = true
    }
    if (options.rainOnly === '1' || options.rainOnly === 'true') {
      baseFilter.rainOnly = true
    }

    const title = options.title ? decodeURIComponent(options.title) : '物品列表'
    wx.setNavigationBarTitle({ title })

    const isCooking = baseFilter.category === 'cooking'
    // 料理无 seasons 数据：忽略季节筛选，避免无效过滤
    if (isCooking) {
      delete baseFilter.season
    }

    // 用 query 作 key，保证不同列表各自记滚动
    const pageKey = [
      baseFilter.category || '',
      baseFilter.tag || '',
      isCooking ? '' : (baseFilter.season || ''),
      baseFilter.location || '',
      baseFilter.sort || '',
      title
    ].join('|')

    this.setData({
      baseFilter,
      title,
      pageKey,
      sort: baseFilter.sort || (isCooking ? 'must_first' : 'default'),
      season: isCooking ? '' : (baseFilter.season || ''),
      isCooking,
      onlyMustCook: !!baseFilter.onlyMustCook,
      ...gameTime.pageThemeData()
    })
  },

  onShow() {
    const progress = gameTime.getProgress()
    const pageKey = this.data.pageKey
    const saved = listScrollMap[pageKey] || 0
    this._scrollTop = saved
    const theme = gameTime.pageThemeData()
    gameTime.applySeasonChrome(theme.uiSeason)
    this.setData({
      ...theme,
      progressText: gameTime.formatProgress(progress)
    })
    this.refresh()
    // 恢复滚动：先清零再设回，避免同值不触发
    this.setData({ scrollTop: 0 })
    setTimeout(() => {
      this.setData({ scrollTop: saved })
    }, 30)
  },

  onScroll(e) {
    const top = e.detail.scrollTop || 0
    this._scrollTop = top
    listScrollMap[this.data.pageKey] = top
  },

  refresh() {
    const opts = { ...this.data.baseFilter, useGameContext: true }
    if (this.data.sort && this.data.sort !== 'default') {
      opts.sort = this.data.sort
    } else {
      opts.sort = this.data.baseFilter.sort || 'price_desc'
    }
    // 料理：必做优先时不要被季节排序打乱
    if (opts.sort === 'must_first') {
      opts.useGameContext = false
    }
    if (this.data.season) {
      opts.season = this.data.season
    } else {
      delete opts.season
    }
    if (this.data.onlyMustCook) {
      opts.onlyMustCook = true
    } else {
      delete opts.onlyMustCook
    }
    const list = filterItems(opts)
    const mustCount = list.filter(i => i.isMustCook).length
    this.setData({ list, mustCount })
  },

  toggleMustCook() {
    const onlyMustCook = !this.data.onlyMustCook
    listScrollMap[this.data.pageKey] = 0
    this.setData({ onlyMustCook, scrollTop: 0 })
    this._scrollTop = 0
    this.refresh()
  },

  setSort(e) {
    const sort = e.currentTarget.dataset.sort
    listScrollMap[this.data.pageKey] = 0
    this.setData({ sort, scrollTop: 0 })
    this._scrollTop = 0
    this.refresh()
  },

  setSeason(e) {
    let season = e.currentTarget.dataset.season
    if (this.data.season === season) season = ''
    listScrollMap[this.data.pageKey] = 0
    this.setData({ season, scrollTop: 0 })
    this._scrollTop = 0
    this.refresh()
  },

  goSettings() {
    wx.navigateTo({ url: '/pages/settings/settings' })
  },

  goItem(e) {
    const id = e.currentTarget.dataset.id
    listScrollMap[this.data.pageKey] = this._scrollTop || 0
    storage.pushHistory(id)
    wx.navigateTo({ url: `/pages/item/item?id=${id}` })
  },

  onLongPress(e) {
    const id = e.currentTarget.dataset.id
    const name = e.currentTarget.dataset.name
    const collected = storage.isCollected(id)
    wx.showActionSheet({
      itemList: [
        '复制名字',
        collected ? '取消已收集' : '标记为已收集',
        '查看地图'
      ],
      success: (res) => {
        if (res.tapIndex === 0) {
          wx.setClipboardData({
            data: name,
            success: () => wx.showToast({ title: '已复制「' + name + '」', icon: 'none' })
          })
        } else if (res.tapIndex === 1) {
          storage.toggleCollected(id)
          this.refresh()
          wx.showToast({ title: collected ? '已取消收集' : '已标记收集', icon: 'none' })
        } else if (res.tapIndex === 2) {
          wx.navigateTo({ url: '/packages/map/pages/map/map' })
        }
      }
    })
  }
})
