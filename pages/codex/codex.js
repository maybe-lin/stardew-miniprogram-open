const {
  filterItems,
  getCategoryStats,
  CATEGORY_META,
  CODEX_QUICK
} = require('../../utils/items.js')
const storage = require('../../utils/storage.js')
const gameTime = require('../../utils/gameTime.js')

Page({
  onShareAppMessage() { return require('../../utils/share.js').onShareAppMessage() },
  onShareTimeline() { return require('../../utils/share.js').onShareTimeline() },
  data: {
    statsList: [],
    list: [],
    category: 'crop',
    sort: 'price_desc',
    season: '',
    tag: '',
    rainOnly: false,
    onlyFav: false,
    onlyUncollected: false,
    onlyMustCook: false,
    mustCount: 0,
    quickChips: [],
    quickKey: 'all',
    darkMode: false,
    uiSeason: 'spring'
  },

  onShow() {
    const app = getApp()
    const onlyFav = !!app.globalData.codexOnlyFav
    if (app.globalData.codexOnlyFav) {
      app.globalData.codexOnlyFav = false
    }
    const theme = gameTime.pageThemeData()
    gameTime.applySeasonChrome(theme.uiSeason)
    this.setData({
      ...theme,
      onlyFav: onlyFav || this.data.onlyFav
    })
    this._applyQuickChips()
    this.refresh()
  },

  _applyQuickChips() {
    const chips = CODEX_QUICK[this.data.category] || [{ key: 'all', label: '全部' }]
    this.setData({ quickChips: chips })
  },

  refresh() {
    const collected = storage.getCollected()
    const favorites = storage.getFavorites()
    const stats = getCategoryStats(collected)
    const statsList = Object.keys(CATEGORY_META).map(k => {
      const s = stats[k] || { key: k, total: 0 }
      const meta = CATEGORY_META[k] || {}
      return {
        key: k,
        name: meta.name,
        emoji: meta.emoji,
        icon: meta.icon || '',
        total: s.total || 0,
        collected: s.done || 0
      }
    })

    const isCooking = this.data.category === 'cooking'
    const opts = {
      category: this.data.category,
      sort: this.data.sort,
      useGameContext: false,
      onlyMustCook: isCooking && this.data.onlyMustCook
    }
    if (this.data.season) opts.season = this.data.season
    if (this.data.tag) opts.tag = this.data.tag
    if (this.data.rainOnly) opts.rainOnly = true
    if (opts.sort === 'must_first') opts.useGameContext = false

    let list = filterItems(opts)

    list = list.map(item => ({
      ...item,
      collected: !!collected[item.id],
      favorited: favorites.includes(item.id)
    }))

    if (this.data.onlyFav) list = list.filter(i => i.favorited)
    if (this.data.onlyUncollected) list = list.filter(i => !i.collected)

    const mustCount = list.filter(i => i.isMustCook).length
    this.setData({ statsList, list, mustCount })
  },

  selectCat(e) {
    const category = e.currentTarget.dataset.cat
    if (!category) return
    const sort = category === 'cooking' ? 'must_first' : (category === 'crop' || category === 'fish' ? 'price_desc' : 'name')
    this.setData({
      category,
      sort,
      season: '',
      tag: '',
      rainOnly: false,
      onlyMustCook: false,
      quickKey: 'all'
    })
    this._applyQuickChips()
    this.refresh()
  },

  onQuickChip(e) {
    const key = e.currentTarget.dataset.key
    const chip = (this.data.quickChips || []).find(c => c.key === key)
    if (!chip) return

    if (chip.key === 'all') {
      this.setData({
        quickKey: 'all',
        season: '',
        tag: '',
        rainOnly: false,
        onlyMustCook: false,
        sort: this.data.category === 'cooking' ? 'must_first' : this.data.sort
      })
      this.refresh()
      return
    }

    const patch = {
      quickKey: key,
      season: chip.season || '',
      tag: chip.tag || '',
      rainOnly: !!chip.rainOnly,
      onlyMustCook: !!chip.onlyMustCook
    }
    if (chip.sort) patch.sort = chip.sort
    this.setData(patch)
    this.refresh()
  },

  setSort(e) {
    this.setData({ sort: e.currentTarget.dataset.sort })
    this.refresh()
  },

  toggleFavFilter() {
    this.setData({ onlyFav: !this.data.onlyFav })
    this.refresh()
  },

  toggleUncollected() {
    this.setData({ onlyUncollected: !this.data.onlyUncollected })
    this.refresh()
  },

  toggleMustCook() {
    this.setData({ onlyMustCook: !this.data.onlyMustCook, quickKey: this.data.onlyMustCook ? 'all' : 'must' })
    this.refresh()
  },

  toggleCollect(e) {
    const id = e.currentTarget.dataset.id
    storage.toggleCollected(id)
    this.refresh()
  },

  toggleFav(e) {
    const id = e.currentTarget.dataset.id
    storage.toggleFavorite(id)
    this.refresh()
    wx.showToast({ title: storage.isFavorite(id) ? '已收藏' : '已取消', icon: 'none' })
  },

  goItem(e) {
    const id = e.currentTarget.dataset.id
    if (!id) return
    storage.pushHistory(id)
    wx.navigateTo({ url: `/pages/item/item?id=${id}` })
  },

  onLongPress(e) {
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
          this.refresh()
        } else if (res.tapIndex === 2) {
          storage.toggleFavorite(id)
          this.refresh()
        } else if (res.tapIndex === 3) {
          wx.navigateTo({ url: '/packages/map/pages/map/map' })
        }
      }
    })
  }
})
