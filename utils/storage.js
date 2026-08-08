/**
 * 本地存储单一入口
 * - 所有 key 集中在 KEYS，禁止页面直接 wx.get/setStorageSync
 * - 读时做类型归一 + 脏数据修复，写时写回干净结构
 * - 好 id / 双 key（如 npc 好感）在此兼容迁移
 */

const KEYS = {
  history: 'sdv_search_history',
  favorites: 'sdv_favorites',
  collected: 'sdv_collected',
  darkMode: 'sdv_dark_mode',
  /** 社区中心 / 新手清单等「分模块勾选」大袋子（legacy 名 stardew_progress） */
  bagProgress: 'stardew_progress',
  /** 游戏内季节/日期/技能（与 bagProgress 分离，避免互相覆盖） */
  gameProgress: 'sdv_game_progress',
  profitHistory: 'sdv_profit_history',
  npcHearts: 'sdv_npc_hearts',
  achievements: 'sdv_achievements_done'
}

const HISTORY_LIMIT = 5
const PROFIT_HISTORY_LIMIT = 10

function get(key, fallback) {
  try {
    const v = wx.getStorageSync(key)
    return v === '' || v === undefined || v === null ? fallback : v
  } catch (e) {
    return fallback
  }
}

function set(key, value) {
  try {
    wx.setStorageSync(key, value)
    return true
  } catch (e) {
    return false
  }
}

function remove(key) {
  try {
    wx.removeStorageSync(key)
    return true
  } catch (e) {
    return false
  }
}

/** 保证是数组；坏数据回写为空数组 */
function getArray(key) {
  const raw = get(key, [])
  if (Array.isArray(raw)) return raw
  set(key, [])
  return []
}

/** 保证是普通对象（非 null / 非数组） */
function getObject(key) {
  const raw = get(key, {})
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) return raw
  set(key, {})
  return {}
}

function asStringId(id) {
  if (id == null || id === '') return ''
  return String(id)
}

// ───────── 搜索 / 最近查看 ─────────

function getHistory() {
  const raw = getArray(KEYS.history)
  const list = raw.map(asStringId).filter(Boolean).slice(0, HISTORY_LIMIT)
  if (list.length !== raw.length || raw.some((x, i) => x !== list[i])) {
    set(KEYS.history, list)
  }
  return list
}

function pushHistory(itemId) {
  itemId = asStringId(itemId)
  if (!itemId) return getHistory()
  let list = getHistory().filter((id) => id !== itemId)
  list.unshift(itemId)
  list = list.slice(0, HISTORY_LIMIT)
  set(KEYS.history, list)
  return list
}

function clearHistory() {
  set(KEYS.history, [])
}

// ───────── 收藏 ─────────

function getFavorites() {
  const raw = getArray(KEYS.favorites)
  const list = raw.map(asStringId).filter(Boolean)
  // 去重保序
  const seen = {}
  const uniq = []
  list.forEach((id) => {
    if (seen[id]) return
    seen[id] = true
    uniq.push(id)
  })
  if (uniq.length !== raw.length) set(KEYS.favorites, uniq)
  return uniq
}

function toggleFavorite(itemId) {
  itemId = asStringId(itemId)
  if (!itemId) return getFavorites()
  let list = getFavorites()
  if (list.indexOf(itemId) >= 0) {
    list = list.filter((id) => id !== itemId)
  } else {
    list = [itemId].concat(list)
  }
  set(KEYS.favorites, list)
  return list
}

function isFavorite(itemId) {
  itemId = asStringId(itemId)
  if (!itemId) return false
  return getFavorites().indexOf(itemId) >= 0
}

// ───────── 图鉴收集 ─────────

function getCollected() {
  return getObject(KEYS.collected)
}

function toggleCollected(itemId) {
  itemId = asStringId(itemId)
  if (!itemId) return getCollected()
  const map = Object.assign({}, getCollected())
  map[itemId] = !map[itemId]
  if (!map[itemId]) delete map[itemId]
  set(KEYS.collected, map)
  return map
}

function isCollected(itemId) {
  itemId = asStringId(itemId)
  if (!itemId) return false
  return !!getCollected()[itemId]
}

// ───────── 深色模式 ─────────

function getDarkMode() {
  return !!get(KEYS.darkMode, false)
}

function setDarkMode(on) {
  set(KEYS.darkMode, !!on)
}

// ───────── 游戏进度（季节/日/技能） ─────────

function getGameProgress() {
  const raw = get(KEYS.gameProgress, null)
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null
  return raw
}

function setGameProgress(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return false
  return set(KEYS.gameProgress, data)
}

// ───────── 模块勾选袋（bundles / newbie 等） ─────────

function getBagProgress() {
  return getObject(KEYS.bagProgress)
}

function setBagProgress(bag) {
  if (!bag || typeof bag !== 'object' || Array.isArray(bag)) {
    return set(KEYS.bagProgress, {})
  }
  return set(KEYS.bagProgress, bag)
}

function getBagProgressKey(moduleKey) {
  moduleKey = asStringId(moduleKey)
  if (!moduleKey) return {}
  const bag = getBagProgress()
  const slice = bag[moduleKey]
  if (slice && typeof slice === 'object' && !Array.isArray(slice)) return slice
  return {}
}

function setBagProgressKey(moduleKey, data) {
  moduleKey = asStringId(moduleKey)
  if (!moduleKey) return getBagProgress()
  const bag = Object.assign({}, getBagProgress())
  bag[moduleKey] =
    data && typeof data === 'object' && !Array.isArray(data) ? data : {}
  setBagProgress(bag)
  return bag
}

// ───────── 利润计算历史 ─────────

function getProfitHistory() {
  const raw = getArray(KEYS.profitHistory)
  return raw.filter((x) => x && typeof x === 'object')
}

function pushProfitHistory(entry) {
  if (!entry || typeof entry !== 'object') return getProfitHistory()
  let list = getProfitHistory().filter(
    (x) =>
      !(
        x.cropId === entry.cropId &&
        x.tiles === entry.tiles &&
        x.days === entry.days &&
        x.fertId === entry.fertId
      )
  )
  list.unshift(Object.assign({}, entry, { at: Date.now() }))
  list = list.slice(0, PROFIT_HISTORY_LIMIT)
  set(KEYS.profitHistory, list)
  return list
}

function clearProfitHistory() {
  set(KEYS.profitHistory, [])
}

// ───────── NPC 好感 ─────────
// 规范 key：npc_${baseId}；兼容旧数据 baseId 裸 key

function npcBaseId(id) {
  return asStringId(id).replace(/^npc_/, '')
}

function npcCanonicalId(id) {
  const base = npcBaseId(id)
  return base ? 'npc_' + base : ''
}

function normalizeHeartsMap(raw) {
  const src = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {}
  const out = {}
  let dirty = Array.isArray(raw) || !(raw && typeof raw === 'object')
  Object.keys(src).forEach((key) => {
    const base = npcBaseId(key)
    if (!base) {
      dirty = true
      return
    }
    const canon = 'npc_' + base
    const n = Math.max(0, Math.min(14, Number(src[key]) || 0))
    // 同人多 key 时取较大值（避免丢进度）
    if (out[canon] == null || n > out[canon]) out[canon] = n
    if (key !== canon) dirty = true
  })
  if (dirty || Object.keys(out).length !== Object.keys(src).length) {
    set(KEYS.npcHearts, out)
  }
  return out
}

function getNpcHeartsMap() {
  return normalizeHeartsMap(get(KEYS.npcHearts, {}))
}

function getNpcHearts(id) {
  const canon = npcCanonicalId(id)
  if (!canon) return 0
  const map = getNpcHeartsMap()
  return map[canon] != null ? map[canon] : 0
}

function setNpcHearts(id, hearts) {
  const canon = npcCanonicalId(id)
  if (!canon) return getNpcHeartsMap()
  const map = Object.assign({}, getNpcHeartsMap())
  const n = Math.max(0, Math.min(14, Number(hearts) || 0))
  if (n <= 0) delete map[canon]
  else map[canon] = n
  // 清掉可能残留的裸 baseId
  const base = npcBaseId(id)
  if (base && map[base] != null) delete map[base]
  set(KEYS.npcHearts, map)
  return map
}

// ───────── 成就勾选 ─────────
// 规范 key：成就 id；兼容旧 name key

function getAchievementsDone() {
  return getObject(KEYS.achievements)
}

function isAchievementDone(doneMap, achievement) {
  if (!achievement) return false
  const map = doneMap || getAchievementsDone()
  if (achievement.id && map[achievement.id]) return true
  if (achievement.name && map[achievement.name]) return true
  return false
}

function toggleAchievementDone(achievement) {
  if (!achievement || (!achievement.id && !achievement.name)) {
    return getAchievementsDone()
  }
  const map = Object.assign({}, getAchievementsDone())
  const currently = isAchievementDone(map, achievement)
  if (currently) {
    if (achievement.id) delete map[achievement.id]
    if (achievement.name) delete map[achievement.name]
  } else {
    if (achievement.id) map[achievement.id] = true
    // 仍写 name，兼容旧列表逻辑；读时优先 id
    if (achievement.name) map[achievement.name] = true
  }
  set(KEYS.achievements, map)
  return map
}

module.exports = {
  KEYS,
  HISTORY_LIMIT,
  // low-level（一般业务勿直接用）
  get,
  set,
  remove,
  // history
  getHistory,
  pushHistory,
  clearHistory,
  // favorites
  getFavorites,
  toggleFavorite,
  isFavorite,
  // collected
  getCollected,
  toggleCollected,
  isCollected,
  // theme
  getDarkMode,
  setDarkMode,
  // game / bag progress
  getGameProgress,
  setGameProgress,
  getBagProgress,
  setBagProgress,
  getBagProgressKey,
  setBagProgressKey,
  // profit
  getProfitHistory,
  pushProfitHistory,
  clearProfitHistory,
  // npc hearts
  getNpcHeartsMap,
  getNpcHearts,
  setNpcHearts,
  npcCanonicalId,
  npcBaseId,
  // achievements
  getAchievementsDone,
  isAchievementDone,
  toggleAchievementDone
}
