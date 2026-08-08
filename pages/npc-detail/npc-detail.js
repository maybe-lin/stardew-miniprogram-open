const { getNpcProfile } = require('../../utils/npcs.js')
const gameTime = require('../../utils/gameTime.js')
const storage = require('../../utils/storage.js')

const SEASONS = ['spring', 'summer', 'fall', 'winter']

function relationFromHearts(h, marriageable) {
  h = h | 0
  if (h <= 0) return '陌生人'
  if (h <= 2) return '普通朋友'
  if (h <= 4) return '熟人'
  if (h <= 6) return '好朋友'
  if (h <= 8) return marriageable ? '暗恋中' : '挚友'
  if (h < 10) return marriageable ? '热恋中' : '挚友'
  return marriageable ? '可求婚' : '挚友'
}

function birthdayStatus(birthday, progress) {
  if (!birthday || !birthday.season || !birthday.day) return '生日资料待补'
  const currentSeason = SEASONS.indexOf(progress.season)
  const targetSeason = SEASONS.indexOf(birthday.season)
  if (currentSeason < 0 || targetSeason < 0) return birthday.text || '—'
  const current = currentSeason * 28 + progress.day
  const target = targetSeason * 28 + birthday.day
  const distance = (target - current + 112) % 112
  if (distance === 0) return '今天生日 · 送礼好感 ×8'
  if (distance <= 7) return `距离生日还有 ${distance} 天`
  return birthday.text || '—'
}

function normalizeNpc(raw) {
  if (!raw) return null
  return {
    id: raw.id,
    baseId: raw.baseId || String(raw.id || '').replace(/^npc_/, ''),
    name: raw.name || '未知',
    en: raw.en || '',
    emoji: raw.emoji || '👤',
    avatar: raw.avatar || '',
    color: raw.color || '#E8913A',
    birthday: raw.birthday || { season: 'spring', day: 1, text: '—' },
    home: raw.home || '未知',
    marriageable: !!raw.marriageable,
    groupLabel: raw.groupLabel || (raw.marriageable ? '可结婚' : '其他村民'),
    intro: raw.intro || '',
    tips: raw.tips || '',
    giftComplete: !!raw.giftComplete,
    isFallback: !!raw.isFallback,
    today: raw.today || { place: '镇上', weather: '任意', time: '全天' },
    loves: Array.isArray(raw.loves) ? raw.loves : [],
    likeGifts: Array.isArray(raw.likeGifts) ? raw.likeGifts : [],
    likes: raw.likes || '暂无记录',
    neutral: raw.neutral || '暂无记录',
    universalLoves: raw.universalLoves || '',
    universalNote: raw.universalNote || '',
    hates: raw.hates || '暂无记录',
    events: Array.isArray(raw.events) ? raw.events : [],
    eventCount: raw.eventCount || (raw.events || []).length,
    schedule: Array.isArray(raw.schedule) ? raw.schedule : []
  }
}

Page({
  onShareAppMessage() { return require('../../utils/share.js').onShareAppMessage() },
  onShareTimeline() { return require('../../utils/share.js').onShareTimeline() },
  data: {
    npc: null,
    loaded: false,
    tab: 'gift',
    hearts: 0,
    maxHearts: 10,
    relationText: '',
    birthdayStatus: '',
    eventList: [],
    showLikes: false,
    showHates: false,
    darkMode: false,
    uiSeason: 'spring'
  },

  onLoad(options) {
    let id = options && options.id ? options.id : ''
    try {
      id = decodeURIComponent(id)
    } catch (e) {}

    const raw = getNpcProfile(id)
    const npc = normalizeNpc(raw)

    if (!npc) {
      this.setData({ npc: null, loaded: true })
      return
    }

    wx.setNavigationBarTitle({ title: npc.name })
    const hearts = storage.getNpcHearts(npc.id || npc.baseId)
    const maxHearts = npc.marriageable || npc.baseId === 'krobus' ? 14 : 10
    const normalizedHearts = Math.max(0, Math.min(Number(hearts) || 0, maxHearts))
    this._npcId = storage.npcCanonicalId(npc.id || npc.baseId) || npc.id

    this.setData({
      npc,
      loaded: true,
      hearts: normalizedHearts,
      maxHearts,
      relationText: relationFromHearts(normalizedHearts, npc.marriageable),
      eventList: this.buildEvents(npc, normalizedHearts),
      birthdayStatus: birthdayStatus(npc.birthday, gameTime.getProgress()),
      ...gameTime.pageThemeData(),
      tab: 'gift',
      showLikes: false,
      showHates: false
    })
  },

  onShow() {
    const theme = gameTime.pageThemeData()
    gameTime.applySeasonChrome(theme.uiSeason)
    const patch = { ...theme }
    if (this.data.npc) patch.birthdayStatus = birthdayStatus(this.data.npc.birthday, gameTime.getProgress())
    this.setData(patch)
  },

  buildEvents(npc, hearts) {
    const list = (npc.events || []).slice()
    list.sort((a, b) => (a.heart || 0) - (b.heart || 0))
    return list.map((e, idx) => ({
      key: e.key || ((e.name || 'ev') + '_' + (e.heart || 0) + '_' + idx),
      name: e.name || (e.heart + '心事件'),
      heart: e.heart != null ? e.heart : 0,
      time: e.time || '任意',
      place: e.place || '—',
      weather: e.weather || '任意',
      desc: e.desc || '进入指定地点触发。',
      type: e.type || 'cutscene',
      typeLabel: e.typeLabel || (e.type === 'mail' ? '来信' : e.type === 'access' ? '解锁' : '过场'),
      unlocked: (e.heart || 0) <= hearts
    }))
  },

  switchTab(e) {
    const tab = e.currentTarget.dataset.tab
    if (!tab) return
    this.setData({ tab })
  },

  toggleLikes() {
    this.setData({ showLikes: !this.data.showLikes })
  },

  toggleHates() {
    this.setData({ showHates: !this.data.showHates })
  },

  incHeart() {
    let h = this.data.hearts + 1
    if (h > this.data.maxHearts) h = this.data.maxHearts
    this.applyHearts(h)
  },

  decHeart() {
    let h = this.data.hearts - 1
    if (h < 0) h = 0
    this.applyHearts(h)
  },

  applyHearts(h) {
    storage.setNpcHearts(this._npcId, h)
    const npc = this.data.npc
    this.setData({
      hearts: h,
      relationText: relationFromHearts(h, npc.marriageable),
      eventList: this.buildEvents(npc, h)
    })
  },

  goGift(e) {
    const id = e.currentTarget.dataset.id
    if (!id) return
    wx.navigateTo({ url: `/pages/item/item?id=${encodeURIComponent(id)}` })
  }
})
