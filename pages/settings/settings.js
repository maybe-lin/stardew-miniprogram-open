const gameTime = require('../../utils/gameTime.js')
const {
  SKILL_DEFS,
  PROF_L5,
  PROF_L10,
  RECOMMENDS,
  getProfById
} = require('../../data/skills.js')
const {
  DISCLAIMER_LINES,
  DISCLAIMER_FOOTER,
  WIKI_URL
} = require('../../data/disclaimer.js')

Page({
  onShareAppMessage() { return require('../../utils/share.js').onShareAppMessage() },
  onShareTimeline() { return require('../../utils/share.js').onShareTimeline() },
  data: {
    progress: {},
    progressText: '',
    seasons: gameTime.SEASONS,
    darkMode: false,
    uiSeason: 'spring',
    skillDefs: SKILL_DEFS,
    skillCards: [],
    expandSkill: 'farming',
    disclaimerLines: DISCLAIMER_LINES,
    disclaimerFooter: DISCLAIMER_FOOTER,
    wikiUrl: WIKI_URL
  },

  onShow() {
    this.refresh()
    const theme = gameTime.pageThemeData()
    gameTime.applySeasonChrome(theme.uiSeason)
    this.setData(theme)
  },

  refresh() {
    const progress = gameTime.getProgress()
    const skillCards = SKILL_DEFS.map((def) => {
      const st = progress.skills[def.key] || { level: 0, prof5: '', prof10: '' }
      const l5List = (PROF_L5[def.key] || []).map((p) => ({
        ...p,
        on: st.prof5 === p.id
      }))
      const p5 = getProfById(def.key, st.prof5)
      const l10List = (PROF_L10[def.key] || [])
        .filter((p) => !st.prof5 || (p5 && p.parent === p5.path))
        .map((p) => ({
          ...p,
          on: st.prof10 === p.id
        }))
      const rec = RECOMMENDS[def.key] || []
      const sellNotes = []
      l5List.forEach((p) => {
        if (p.sellBoost) sellNotes.push(`${p.name}：售价 +${Math.round(p.sellBoost * 100)}%`)
      })
      ;(PROF_L10[def.key] || []).forEach((p) => {
        if (p.sellBoost) sellNotes.push(`${p.name}：售价 +${Math.round(p.sellBoost * 100)}%`)
      })
      return {
        ...def,
        level: st.level,
        prof5: st.prof5,
        prof10: st.prof10,
        prof5Name: p5 ? p5.name : '',
        prof10Name: (getProfById(def.key, st.prof10) || {}).name || '',
        canPick5: st.level >= 5,
        canPick10: st.level >= 10 && !!st.prof5,
        l5List,
        l10List,
        recommends: rec,
        sellNotes,
        open: this.data.expandSkill === def.key
      }
    })
    this.setData({
      progress,
      progressText: gameTime.formatProgress(progress),
      skillCards
    })
  },

  setSeason(e) {
    const season = e.currentTarget.dataset.season
    gameTime.setProgress({ season })
    gameTime.applySeasonChrome(season)
    this.setData({ uiSeason: season })
    this.refresh()
    wx.showToast({ title: '季节已更新', icon: 'none' })
  },

  setYear(e) {
    gameTime.setProgress({ year: Number(e.detail.value) })
    this.refresh()
  },

  setDay(e) {
    gameTime.setProgress({ day: Number(e.detail.value) })
    this.refresh()
  },

  setWeather(e) {
    gameTime.setProgress({ weatherPref: e.currentTarget.dataset.w })
    this.refresh()
    wx.showToast({ title: '天气偏好已更新', icon: 'none' })
  },

  toggleSkill(e) {
    const key = e.currentTarget.dataset.key
    this.setData({ expandSkill: this.data.expandSkill === key ? '' : key })
    this.refresh()
  },

  setSkillLevel(e) {
    const key = e.currentTarget.dataset.key
    const level = Number(e.detail.value)
    const patch = { level }
    if (level < 5) {
      patch.prof5 = ''
      patch.prof10 = ''
    } else if (level < 10) {
      patch.prof10 = ''
    }
    gameTime.setSkill(key, patch)
    this.refresh()
  },

  pickProf5(e) {
    const { skill, id } = e.currentTarget.dataset
    const st = gameTime.getProgress().skills[skill]
    if (!st || st.level < 5) {
      wx.showToast({ title: '需该技能 ≥5 级', icon: 'none' })
      return
    }
    const cur = st.prof5 === id ? '' : id
    gameTime.setSkill(skill, { prof5: cur, prof10: '' })
    this.refresh()
    const p = getProfById(skill, cur)
    wx.showToast({
      title: p ? `已选：${p.name}` : '已取消 5 级职业',
      icon: 'none'
    })
  },

  pickProf10(e) {
    const { skill, id } = e.currentTarget.dataset
    const st = gameTime.getProgress().skills[skill]
    if (!st || st.level < 10) {
      wx.showToast({ title: '需该技能 ≥10 级', icon: 'none' })
      return
    }
    if (!st.prof5) {
      wx.showToast({ title: '请先选 5 级职业', icon: 'none' })
      return
    }
    const cur = st.prof10 === id ? '' : id
    gameTime.setSkill(skill, { prof10: cur })
    this.refresh()
    const p = getProfById(skill, cur)
    wx.showToast({
      title: p ? `已选：${p.name}` : '已取消 10 级职业',
      icon: 'none'
    })
  },

  copyWiki() {
    wx.setClipboardData({
      data: this.data.wikiUrl || 'https://zh.stardewvalleywiki.com/',
      success: () => wx.showToast({ title: '维基链接已复制', icon: 'none' })
    })
  }
})
