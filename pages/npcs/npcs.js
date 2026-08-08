const { getNpcProfiles, FRIENDSHIP_TIPS } = require('../../utils/npcs.js')
const gameTime = require('../../utils/gameTime.js')
const storage = require('../../utils/storage.js')

const SEASONS = ['spring', 'summer', 'fall', 'winter']
/** 与攻略分类一致：可婚女 / 可婚男 / 其他女 / 其他男 */
const FILTERS = [
  { key: 'all', label: '全部' },
  { key: 'female_date', label: '可婚女' },
  { key: 'male_date', label: '可婚男' },
  { key: 'female_other', label: '其他女' },
  { key: 'male_other', label: '其他男' },
  { key: 'season', label: '本季生日' }
]

function birthdayDistance(birthday, progress) {
  if (!birthday || !birthday.season || !birthday.day) return 999
  const currentSeason = SEASONS.indexOf(progress.season)
  const targetSeason = SEASONS.indexOf(birthday.season)
  if (currentSeason < 0 || targetSeason < 0) return 999
  const current = currentSeason * 28 + progress.day
  const target = targetSeason * 28 + birthday.day
  return (target - current + 112) % 112
}

function maxHearts(npc) {
  return npc.marriageable || npc.baseId === 'krobus' ? 14 : 10
}

Page({
  onShareAppMessage() { return require('../../utils/share.js').onShareAppMessage() },
  onShareTimeline() { return require('../../utils/share.js').onShareTimeline() },
  data: {
    filters: FILTERS,
    filter: 'all',
    keyword: '',
    list: [],
    total: 0,
    progressText: '',
    darkMode: false,
    uiSeason: 'spring',
    showFriendTip: false,
    friendTip: FRIENDSHIP_TIPS
  },

  onShow() {
    const theme = gameTime.pageThemeData()
    gameTime.applySeasonChrome(theme.uiSeason)
    this.setData(theme)
    this.refresh()
  },

  refresh() {
    const progress = gameTime.getProgress()
    const filter = this.data.filter
    const keyword = (this.data.keyword || '').trim().toLowerCase()
    const allProfiles = getNpcProfiles()

    let profiles = allProfiles.slice()
    if (filter === 'female_date') profiles = profiles.filter(npc => npc.group === 'female_date' || (npc.marriageable && npc.gender === 'f'))
    if (filter === 'male_date') profiles = profiles.filter(npc => npc.group === 'male_date' || (npc.marriageable && npc.gender === 'm'))
    if (filter === 'female_other') profiles = profiles.filter(npc => !npc.marriageable && npc.gender === 'f')
    if (filter === 'male_other') profiles = profiles.filter(npc => !npc.marriageable && npc.gender === 'm')
    if (filter === 'season') profiles = profiles.filter(npc => npc.birthday && npc.birthday.season === progress.season)

    if (keyword) {
      profiles = profiles.filter(npc => {
        const giftNames = (npc.loves || []).map(gift => gift.name).join(' ')
        const bag = [npc.name, npc.en, npc.home, giftNames].join(' ').toLowerCase()
        return bag.includes(keyword)
      })
    }

    const list = profiles.map(npc => {
      // 统一从 storage 读，兼容旧裸 id / npc_id
      const hearts = storage.getNpcHearts(npc.id || npc.baseId)
      const distance = birthdayDistance(npc.birthday, progress)
      const heartMax = maxHearts(npc)
      const readyEvents = (npc.events || []).filter(event => (event.heart || 0) > 0 && (event.heart || 0) <= hearts).length
      return {
        id: npc.id,
        name: npc.name,
        en: npc.en,
        emoji: npc.emoji,
        avatar: npc.avatar,
        color: npc.color || '#E8D4B0',
        home: npc.home || '',
        birthday: npc.birthday || { text: '—' },
        birthdayDistance: distance,
        birthdayHint: distance === 0 ? '今天生日' : (distance <= 7 ? `${distance} 天后生日` : npc.birthday.text),
        hearts,
        heartMax,
        heartPercent: Math.round((Math.min(hearts, heartMax) / heartMax) * 100),
        isBirthday: distance === 0,
        readyEvents,
        marriageable: npc.marriageable,
        groupLabel: npc.groupLabel || (npc.marriageable ? '可结婚' : '其他'),
        groupColor: npc.groupColor || '#6F8F72',
        intro: npc.intro || '',
        lovesPreview: (npc.loves || []).slice(0, 3).map(g => g.name).filter(Boolean).join('、'),
        eventCount: npc.eventCount || (npc.events || []).length,
        giftComplete: !!npc.giftComplete,
        isFallback: !!npc.isFallback
      }
    }).sort((a, b) => {
      if (a.isBirthday !== b.isBirthday) return a.isBirthday ? -1 : 1
      if (a.birthdayDistance !== b.birthdayDistance) return a.birthdayDistance - b.birthdayDistance
      return a.name.localeCompare(b.name, 'zh')
    })

    this.setData({
      list,
      total: allProfiles.length,
      progressText: gameTime.formatProgress(progress)
    })
  },

  onKeyword(e) {
    this.setData({ keyword: e.detail.value || '' })
    this.refresh()
  },

  clearKeyword() {
    this.setData({ keyword: '' })
    this.refresh()
  },

  setFilter(e) {
    const key = e.currentTarget.dataset.key
    if (!key) return
    this.setData({ filter: key })
    this.refresh()
  },

  toggleFriendTip() {
    this.setData({ showFriendTip: !this.data.showFriendTip })
  },

  goDetail(e) {
    const id = e.currentTarget.dataset.id
    if (!id) {
      wx.showToast({ title: '无法打开档案', icon: 'none' })
      return
    }
    wx.navigateTo({
      url: '/pages/npc-detail/npc-detail?id=' + encodeURIComponent(id)
    })
  }
})
