const {
  BIRTHDAYS,
  TOOL_UPGRADES,
  PROFIT_CROPS,
  FERTILIZERS,
  calcSeasonProfit,
  compareCrops,
  getVillager,
  FESTIVAL_GUIDES,
  SEASON_PLANS,
  UNIVERSAL_GIFTS,
  VILLAGERS,
  getPlantPlanInsight
} = require('../../utils/items.js')
const { getNpcProfile } = require('../../utils/npcs.js')
const storage = require('../../utils/storage.js')
const gameTime = require('../../utils/gameTime.js')

const SEASON_NAMES = {
  spring: '春季',
  summer: '夏季',
  fall: '秋季',
  winter: '冬季'
}

function buildVillagerGiftRow(k) {
  const v = VILLAGERS[k] || {}
  const profile = getNpcProfile(k) || getNpcProfile('npc_' + k) || null
  const loves = (profile && profile.loves) || []
  const loveIcons = loves.slice(0, 6).map((g, i) => ({
    key: (g.key || g.name || i) + '',
    name: g.name || '',
    icon: g.icon || ''
  }))
  const lovesText = loves
    .slice(0, 4)
    .map((g) => g.name)
    .filter(Boolean)
    .join('、')
  return {
    id: k,
    name: v.name || (profile && profile.name) || k,
    en: (v.en || (profile && profile.en) || '').toString(),
    emoji: v.emoji || '👤',
    avatar: v.avatar || (profile && profile.avatar) || '',
    loveIcons,
    lovesText: lovesText || ''
  }
}

const VILLAGER_LIST = Object.keys(VILLAGERS)
  .filter((k) => !k.startsWith('almost') && !k.startsWith('all_'))
  .map(buildVillagerGiftRow)
  .sort((a, b) => a.name.localeCompare(b.name, 'zh'))

function filterVillagers(keyword) {
  const q = (keyword || '').trim().toLowerCase()
  if (!q) return VILLAGER_LIST
  return VILLAGER_LIST.filter((v) => {
    const name = (v.name || '').toLowerCase()
    const en = (v.en || '').toLowerCase()
    const id = (v.id || '').toLowerCase()
    return name.indexOf(q) >= 0 || en.indexOf(q) >= 0 || id.indexOf(q) >= 0
  })
}

Page({
  onShareAppMessage() { return require('../../utils/share.js').onShareAppMessage() },
  onShareTimeline() { return require('../../utils/share.js').onShareTimeline() },
  data: {
    tab: 'calendar',
    season: 'spring',
    seasonName: '春季',
    progressText: '',
    birthdays: [],
    festivals: [],
    upgrades: TOOL_UPGRADES,
    crops: PROFIT_CROPS,
    cropNames: PROFIT_CROPS.map((c) => c.name),
    cropIndex: 0,
    fertList: FERTILIZERS,
    fertNames: FERTILIZERS.map((f) => f.name),
    fertIndex: 0,
    tiles: 48,
    days: 28,
    result: { harvests: 0, revenue: 0, cost: 0, profit: 0, exp: 0, growDays: 0, perTileProfit: 0 },
    compareOn: false,
    compareIds: ['blueberry', 'melon', 'starfruit'],
    compareResults: [],
    profitHistory: [],
    planPlant: [],
    planFish: [],
    planInsight: '',
    planInsightDetail: '',
    giftKeyword: '',
    villagerList: VILLAGER_LIST,
    giftFiltered: VILLAGER_LIST,
    universalGifts: UNIVERSAL_GIFTS,
    darkMode: false,
    uiSeason: 'spring',
    loading: false,
    loadingText: '加载中…'
  },

  onLoad(options) {
    if (options.tab) this.setData({ tab: options.tab })
  },

  onShow() {
    const app = getApp()
    if (app.globalData.toolboxTab) {
      this.setData({ tab: app.globalData.toolboxTab })
      app.globalData.toolboxTab = ''
    }
    const progress = gameTime.getProgress()
    const season = progress.season || this.data.season
    const theme = gameTime.pageThemeData()
    gameTime.applySeasonChrome(theme.uiSeason)
    this.setData({
      ...theme,
      season,
      seasonName: SEASON_NAMES[season] || '春季',
      progressText: gameTime.formatProgress(progress)
    })
    this._reloadAll()
  },

  _setLoading(on, text) {
    this.setData({
      loading: !!on,
      loadingText: text || '加载中…'
    })
  },

  /** 刷新全部本地数据 */
  _reloadAll() {
    this.loadBirthdays()
    this.loadFestivals()
    this.loadPlan()
    this.calcProfit()
    this.loadProfitHistory()
  },

  switchTab(e) {
    const tab = e.currentTarget.dataset.tab
    this.setData({ tab })
    // 进入种植规划：刷新建议卡片（不再 toast，避免与卡片重复）
    if (tab === 'plan') {
      this.loadPlan()
    }
  },

  setSeason(e) {
    const season = e.currentTarget.dataset.s
    this.setData({ season, seasonName: SEASON_NAMES[season] })
    this.loadBirthdays()
    this.loadFestivals()
    if (this.data.tab === 'plan') this.loadPlan()
    if (this.data.compareOn) this.runCompare()
  },

  loadBirthdays() {
    const season = this.data.season
    const birthdays = BIRTHDAYS.filter((b) => b.season === season).map((b) => {
      const v = getVillager(b.villager) || {}
      return {
        day: b.day,
        name: v.name || b.villager,
        emoji: v.emoji || '👤',
        avatar: v.avatar || '',
        gift: b.gift,
        villagerId: b.villager
      }
    })
    this.setData({ birthdays })
  },

  loadFestivals() {
    const season = this.data.season
    const progress = gameTime.getProgress()
    const festivals = FESTIVAL_GUIDES.filter((f) => f.season === season).map((f) => {
      let countdown = ''
      if (progress.season === f.season) {
        const end = f.endDay || f.day
        if (progress.day < f.day) countdown = `还有 ${f.day - progress.day} 天`
        else if (progress.day >= f.day && progress.day <= end) countdown = '进行中'
        else countdown = '本季已过'
      } else {
        countdown = '非当前季'
      }
      return { ...f, countdown }
    })
    this.setData({ festivals })
  },

  /** 刷新当季种植/钓鱼建议（仅写入卡片，不弹 toast） */
  loadPlan() {
    const season = this.data.season
    const plan = SEASON_PLANS[season] || SEASON_PLANS.spring
    const insight = getPlantPlanInsight(season)
    // 首页传入的 insight 优先展示一次
    const app = getApp()
    let planInsight = insight.text
    let planInsightDetail = ''
    if (insight.vsName && insight.pct) {
      planInsightDetail = `按 48 格 / 28 天估算：${insight.topName} 约 ${insight.topProfit}g，${insight.vsName} 约 ${insight.vsProfit}g`
    } else if (insight.topProfit) {
      planInsightDetail = `按 48 格 / 28 天估算净利约 ${insight.topProfit}g`
    }
    if (app.globalData.planInsight && app.globalData.planInsight.text) {
      planInsight = app.globalData.planInsight.text
      // 若首页只传了 text，补上估算明细
      if (app.globalData.planInsight.topProfit && !planInsightDetail) {
        if (app.globalData.planInsight.vsName && app.globalData.planInsight.pct) {
          planInsightDetail = `按 48 格 / 28 天估算：${app.globalData.planInsight.topName} 约 ${app.globalData.planInsight.topProfit}g，${app.globalData.planInsight.vsName} 约 ${app.globalData.planInsight.vsProfit}g`
        } else {
          planInsightDetail = `按 48 格 / 28 天估算净利约 ${app.globalData.planInsight.topProfit}g`
        }
      }
      app.globalData.planInsight = null
    }
    this.setData({
      planPlant: plan.plant || [],
      planFish: plan.fish || [],
      planInsight,
      planInsightDetail
    })
  },

  loadProfitHistory() {
    this.setData({ profitHistory: storage.getProfitHistory() })
  },

  goNpc(e) {
    const id = e.currentTarget.dataset.id
    if (!id) return
    this._setLoading(true, '加载中…')
    wx.navigateTo({
      url: `/pages/npc-detail/npc-detail?id=${encodeURIComponent(id)}`,
      complete: () => this._setLoading(false)
    })
  },

  onCropChange(e) {
    this.setData({ cropIndex: Number(e.detail.value) })
    this.calcProfit()
  },

  onFertChange(e) {
    this.setData({ fertIndex: Number(e.detail.value) })
    this.calcProfit()
  },

  onTiles(e) {
    this.setData({ tiles: Number(e.detail.value) })
    this.calcProfit()
  },

  onDays(e) {
    this.setData({ days: Number(e.detail.value) })
    this.calcProfit()
  },

  calcProfit() {
    const crop = this.data.crops[this.data.cropIndex]
    const fert = this.data.fertList[this.data.fertIndex]
    const result = calcSeasonProfit(crop, this.data.tiles, this.data.days, fert)
    this.setData({ result })
    if (this.data.compareOn) this.runCompare()
  },

  saveProfit() {
    const crop = this.data.crops[this.data.cropIndex]
    const fert = this.data.fertList[this.data.fertIndex]
    const r = this.data.result
    storage.pushProfitHistory({
      cropId: crop.id,
      cropName: crop.name,
      fertId: fert.id,
      fertName: fert.name,
      tiles: this.data.tiles,
      days: this.data.days,
      profit: r.profit,
      revenue: r.revenue,
      cost: r.cost
    })
    this.loadProfitHistory()
    wx.showToast({ title: '已保存记录', icon: 'none' })
  },

  clearProfitHistory() {
    storage.clearProfitHistory()
    this.setData({ profitHistory: [] })
  },

  toggleCompare() {
    const compareOn = !this.data.compareOn
    this.setData({ compareOn })
    if (compareOn) {
      this.runCompare()
    }
  },

  runCompare() {
    const fert = this.data.fertList[this.data.fertIndex]
    const season = this.data.season
    let ids = this.data.compareIds
    const seasonal = PROFIT_CROPS.filter(
      (c) => c.season === season || c.season === 'greenhouse'
    ).map((c) => c.id)
    if (seasonal.length >= 2) ids = seasonal.slice(0, 3)
    const compareResults = compareCrops(ids, this.data.tiles, this.data.days, fert).map((row, idx) => ({
      rank: idx + 1,
      name: row.crop.name,
      season: row.crop.season,
      profit: row.profit,
      harvests: row.harvests,
      perTile: row.perTileProfit,
      exp: row.exp,
      note: idx === 0 ? '本季对比最高利润' : ''
    }))
    this.setData({ compareResults, compareIds: ids })
  },

  onGiftInput(e) {
    const giftKeyword = (e.detail.value || '').trim()
    this.setData({
      giftKeyword,
      giftFiltered: filterVillagers(giftKeyword)
    })
  },

  clearGiftSearch() {
    this.setData({
      giftKeyword: '',
      giftFiltered: VILLAGER_LIST
    })
  }
})
