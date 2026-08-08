const { getItemById, enrichItem, getItemRelations } = require('../../utils/items.js')
const { calcPrice } = require('../../utils/price.js')
const storage = require('../../utils/storage.js')
const gameTime = require('../../utils/gameTime.js')

const Q_KEYS = ['normal', 'silver', 'gold', 'iridium']

Page({
  onShareAppMessage() { return require('../../utils/share.js').onShareAppMessage() },
  onShareTimeline() { return require('../../utils/share.js').onShareTimeline() },
  data: {
    item: null,
    tab: 'base',
    quality: 'normal',
    qualityIndex: 0,
    currentPrice: 0,
    boostPrice: 0,
    professionOn: false,
    favorited: false,
    collected: false,
    darkMode: false,
    uiSeason: 'spring',
    relations: { recipe: null, uses: [], neededBy: [] },
    progressText: ''
  },

  onLoad(options) {
    const id = options.id
    const raw = getItemById(id)
    if (!raw) {
      this.setData({ item: null })
      return
    }
    const item = enrichItem(raw)
    const relations = getItemRelations(id)
    wx.setNavigationBarTitle({ title: item.name })
    storage.pushHistory(id)

    // 支持 ?tab=source|base|chain|social 直达（如从社区中心「查看获取」跳入）
    const tab = ['base', 'source', 'chain', 'social'].indexOf(options.tab) >= 0
      ? options.tab
      : 'base'

    this.setData({
      item,
      relations,
      tab,
      favorited: storage.isFavorite(id),
      collected: storage.isCollected(id),
      ...gameTime.pageThemeData(),
      progressText: gameTime.formatProgress(),
      professionOn: !!(item.sellMult > 1 || item.forceIridium)
    })
    this.recalc()
  },


  onShow() {
    const theme = gameTime.pageThemeData()
    gameTime.applySeasonChrome(theme.uiSeason)
    this.setData(theme)
  },
  switchTab(e) {
    this.setData({ tab: e.currentTarget.dataset.tab })
  },

  goSourceTab() {
    this.setData({ tab: 'source' })
  },

  setQuality(e) {
    const quality = e.currentTarget.dataset.q
    const qualityIndex = Q_KEYS.indexOf(quality)
    this.setData({ quality, qualityIndex })
    this.recalc()
  },

  onSlider(e) {
    const qualityIndex = Number(e.detail.value)
    this.setData({ qualityIndex, quality: Q_KEYS[qualityIndex] })
    this.recalc()
  },

  onProfession(e) {
    this.setData({ professionOn: e.detail.value })
    this.recalc()
  },

  recalc() {
    const item = this.data.item
    if (!item) return
    const base = item.basePrice || 0
    const q = this.data.quality
    const normal = calcPrice(base, q, false)
    // 植物学家启用时，采集物无论手动选择什么品质都按铱星出售。
    const professionQuality = item.forceIridium ? 'iridium' : q
    const mult = item.sellMult > 1 ? item.sellMult : 1
    const boostPrice = calcPrice(base, professionQuality, mult)
    const hasBoost = mult > 1 || !!item.forceIridium
    const currentPrice = this.data.professionOn && hasBoost ? boostPrice : normal
    this.setData({
      currentPrice,
      boostPrice,
      hasProfBoost: hasBoost,
      profBoostLabel: (item.sellBoostLabels && item.sellBoostLabels.length)
        ? item.sellBoostLabels.join(' · ')
        : '',
      profMultText: mult > 1 ? `×${mult.toFixed(2)}` : ''
    })
  },

  toggleFav() {
    const id = this.data.item.id
    storage.toggleFavorite(id)
    this.setData({ favorited: storage.isFavorite(id) })
    wx.showToast({
      title: this.data.favorited ? '已收藏' : '已取消收藏',
      icon: 'none'
    })
  },

  toggleCollect() {
    const id = this.data.item.id
    storage.toggleCollected(id)
    this.setData({ collected: storage.isCollected(id) })
  },

  goRelated(e) {
    const id = e.currentTarget.dataset.id
    if (!id) return
    wx.navigateTo({ url: `/pages/item/item?id=${id}` })
  },

  onSourceTap(e) {
    const link = e.currentTarget.dataset.link
    const type = e.currentTarget.dataset.type
    if (!link && !type) return

    const map = {
      fish: { category: 'fish', title: '鱼类' },
      mines: { category: 'mineral', title: '矿井矿物' },
      skullcavern: { category: 'mineral', title: '矿物 / 骷髅洞穴' },
      crops: { category: 'crop', title: '作物' },
      foraging: { category: 'forage', title: '采集' },
      cooking: { category: 'cooking', title: '料理' },
      crafting: { category: 'crafting', title: '打造' },
      festival: { tag: '季节限定', title: '节日相关' },
      desert: { location: 'desert', title: '沙漠' },
      secretwoods: { location: 'secretwoods', title: '秘密森林' },
      pierre: { tag: '作物', title: '皮埃尔相关' },
      animals: { category: 'animal', title: '动物' },
      artisan: { category: 'crafting', title: '工匠设备' },
      blacksmith: { category: 'mineral', title: '铁匠相关' },
      artifacts: { category: 'special', title: '特殊 / 古物' }
    }

    const conf = map[link] || (type === 'fishing' ? map.fish : type === 'mines' ? map.mines : type === 'crafting' ? map.crafting : null)
    if (!conf) {
      wx.showToast({ title: e.currentTarget.dataset.type || '获取途径', icon: 'none' })
      return
    }
    const params = ['title=' + encodeURIComponent(conf.title)]
    if (conf.category) params.push('category=' + conf.category)
    if (conf.tag) params.push('tag=' + encodeURIComponent(conf.tag))
    if (conf.location) params.push('location=' + conf.location)
    wx.navigateTo({ url: '/pages/list/list?' + params.join('&') })
  }
})
