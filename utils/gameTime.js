/**
 * 游戏进度（玩家设定）
 * season: spring|summer|fall|winter
 * year: 1+
 * day: 1-28
 * weatherPref: any|sunny|rain
 * skills: 五维技能等级 + 5/10 级职业
 */
const storage = require('./storage.js')
const { defaultSkills, normalizeSkills, summarizeSkills } = require('../data/skills.js')

const SEASONS = [
  { key: 'spring', name: '春季', emoji: '🌸' },
  { key: 'summer', name: '夏季', emoji: '☀️' },
  { key: 'fall', name: '秋季', emoji: '🍂' },
  { key: 'winter', name: '冬季', emoji: '❄️' }
]

const SEASON_NAME = {
  spring: '春季',
  summer: '夏季',
  fall: '秋季',
  winter: '冬季'
}

function defaultProgress() {
  // 用真实月份粗略映射一个默认季节（可选手动改）
  const m = new Date().getMonth() + 1
  let season = 'spring'
  if (m >= 3 && m <= 5) season = 'spring'
  else if (m >= 6 && m <= 8) season = 'summer'
  else if (m >= 9 && m <= 11) season = 'fall'
  else season = 'winter'
  return {
    season,
    year: 1,
    day: Math.min(28, new Date().getDate()),
    weatherPref: 'any',
    skills: defaultSkills()
  }
}

function getProgress() {
  const p = storage.getGameProgress()
  if (!p || !p.season) return defaultProgress()
  return {
    season: p.season || 'spring',
    year: Math.max(1, Number(p.year) || 1),
    day: Math.min(28, Math.max(1, Number(p.day) || 1)),
    weatherPref: p.weatherPref || 'any',
    skills: normalizeSkills(p.skills)
  }
}

function setProgress(partial) {
  const cur = getProgress()
  const next = { ...cur, ...partial }
  next.year = Math.max(1, Number(next.year) || 1)
  next.day = Math.min(28, Math.max(1, Number(next.day) || 1))
  if (!['spring', 'summer', 'fall', 'winter'].includes(next.season)) {
    next.season = 'spring'
  }
  if (!['any', 'sunny', 'rain'].includes(next.weatherPref)) {
    next.weatherPref = 'any'
  }
  if (partial && partial.skills) {
    next.skills = normalizeSkills({ ...cur.skills, ...partial.skills })
  } else {
    next.skills = normalizeSkills(next.skills)
  }
  storage.setGameProgress(next)
  return next
}

function setSkill(skillKey, patch) {
  const cur = getProgress()
  const skills = { ...cur.skills }
  skills[skillKey] = { ...(skills[skillKey] || {}), ...patch }
  return setProgress({ skills })
}

function formatProgress(p) {
  p = p || getProgress()
  return `${SEASON_NAME[p.season] || p.season} 第${p.day}天 · 第${p.year}年`
}

function formatSkillsShort(p) {
  p = p || getProgress()
  return summarizeSkills(p.skills).join(' / ')
}

function isInSeason(item, season) {
  const seasons = item.seasons || []
  if (!seasons.length) return true // 全年/无季节限制
  return seasons.includes(season)
}

function isRainOnly(item) {
  if (item.weather === 'rain' || item.rainOnly) return true
  if ((item.tags || []).includes('雨天') || (item.tags || []).includes('雨天限定')) return true
  const src = (item.sources || []).map(s => (s.detail || '') + (s.label || '')).join(' ')
  return src.includes('雨天')
}

function weatherMatch(item, weatherPref) {
  if (!weatherPref || weatherPref === 'any') return true
  const rain = isRainOnly(item)
  if (weatherPref === 'rain') return rain || !isWeatherRestricted(item)
  if (weatherPref === 'sunny') return !rain
  return true
}

function isWeatherRestricted(item) {
  return isRainOnly(item) || item.weather === 'sunny'
}

/**
 * 排序：当季优先 → 雨天匹配优先 → 非过季 → 原有难度/售价
 */
function sortByGameContext(list, progress, extraSort) {
  const season = progress.season
  const weather = progress.weatherPref
  return list.slice().sort((a, b) => {
    const aIn = isInSeason(a, season) ? 0 : 1
    const bIn = isInSeason(b, season) ? 0 : 1
    if (aIn !== bIn) return aIn - bIn

    if (weather === 'rain') {
      const ar = isRainOnly(a) ? 0 : 1
      const br = isRainOnly(b) ? 0 : 1
      if (ar !== br) return ar - br
    }

    if (extraSort === 'price_desc') return (b.basePrice || 0) - (a.basePrice || 0)
    if (extraSort === 'price_asc') return (a.basePrice || 0) - (b.basePrice || 0)
    if (extraSort === 'difficulty') return (b.difficulty || 0) - (a.difficulty || 0)
    if (extraSort === 'name') return (a.name || '').localeCompare(b.name || '', 'zh')
    return 0
  })
}

function annotateItem(item, progress) {
  if (!item) return item
  const p = progress || getProgress()
  const inSeason = isInSeason(item, p.season)
  const rainOnly = isRainOnly(item)
  return {
    ...item,
    inSeason,
    outOfSeason: !inSeason && (item.seasons || []).length > 0,
    rainOnly,
    seasonBadge: inSeason ? '当季' : ((item.seasons || []).length ? '过季' : '全年')
  }
}

/** 页面通用主题字段：深色 + 当前游戏季节（uiSeason 避免与筛选 season 冲突） */
function pageThemeData() {
  let darkMode = false
  try {
    const app = getApp()
    darkMode = !!(app && app.globalData && app.globalData.darkMode)
  } catch (e) {}
  const p = getProgress()
  return {
    darkMode,
    uiSeason: p.season || 'spring'
  }
}

/**
 * 导航栏 / 窗口底色 / TabBar 与页面季节主题统一
 * 色值对齐 app.wxss 里 .page.season-* 的 --bg，避免顶栏与内容区两截色
 */
const SEASON_CHROME = {
  spring: {
    bg: '#E5F2D8',
    tabBg: '#F4FAF0',
    selected: '#4A9A3C',
    front: '#000000'
  },
  summer: {
    bg: '#D4EEF8',
    tabBg: '#F0F8FC',
    selected: '#2A8BB8',
    front: '#000000'
  },
  fall: {
    bg: '#F5E0C0',
    tabBg: '#FFF8E7',
    selected: '#C26C1C',
    front: '#000000'
  },
  winter: {
    bg: '#E8F0F5',
    tabBg: '#F5F8FA',
    selected: '#5B8BA8',
    front: '#000000'
  }
}

const SEASON_CHROME_DARK = {
  spring: { bg: '#1a2018', tabBg: '#161c14', selected: '#7DCF6A', front: '#ffffff' },
  summer: { bg: '#141c24', tabBg: '#101820', selected: '#5BB8E0', front: '#ffffff' },
  fall: { bg: '#1c1610', tabBg: '#18140e', selected: '#E8913A', front: '#ffffff' },
  winter: { bg: '#121820', tabBg: '#0e141c', selected: '#E8A05A', front: '#ffffff' }
}

function applySeasonChrome(season) {
  const s = season || getProgress().season || 'spring'
  let dark = false
  try {
    const app = getApp()
    dark = !!(app && app.globalData && app.globalData.darkMode)
  } catch (e) {}
  const table = dark ? SEASON_CHROME_DARK : SEASON_CHROME
  const c = table[s] || table.spring

  try {
    wx.setNavigationBarColor({
      frontColor: c.front,
      backgroundColor: c.bg,
      animation: { duration: 200, timingFunc: 'easeIn' }
    })
  } catch (e) {}

  try {
    if (wx.setBackgroundColor) {
      wx.setBackgroundColor({
        backgroundColor: c.bg,
        backgroundColorTop: c.bg,
        backgroundColorBottom: c.bg
      })
    }
  } catch (e) {}

  try {
    if (wx.setTabBarStyle) {
      wx.setTabBarStyle({
        color: dark ? '#9a8a78' : '#8B7355',
        selectedColor: c.selected,
        backgroundColor: c.tabBg,
        borderStyle: dark ? 'black' : 'white'
      })
    }
  } catch (e) {}
}

module.exports = {
  SEASONS,
  SEASON_NAME,
  SEASON_CHROME,
  SEASON_CHROME_DARK,
  defaultProgress,
  getProgress,
  setProgress,
  setSkill,
  formatProgress,
  formatSkillsShort,
  isInSeason,
  isRainOnly,
  weatherMatch,
  sortByGameContext,
  annotateItem,
  pageThemeData,
  applySeasonChrome
}
