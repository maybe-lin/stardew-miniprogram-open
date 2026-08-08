/**
 * 示例数据（公开仓）。完整图鉴请放 data/private/items.js
 */
const ITEMS = [
  { id: 'crop_007', name: '防风草', nameEn: 'Parsnip', category: 'crop', emoji: '🥕', desc: '春季作物（示例）。', basePrice: 35, seasons: ['spring'], locations: ['farm'], sources: [{ type: 'shop', label: '皮埃尔', detail: '春季种子' }], tags: ['作物'], lovedBy: [], likedBy: [], hatedBy: [] },
  { id: 'fish_tuna', name: '金枪鱼', nameEn: 'Tuna', category: 'fish', emoji: '🐟', desc: '夏季海鱼（示例）。', basePrice: 100, seasons: ['summer'], locations: ['ocean'], sources: [{ type: 'fishing', label: '钓鱼', detail: '海洋' }], tags: ['鱼'], lovedBy: [], likedBy: [], hatedBy: [] },
  { id: 'cook_000', name: '煎鸡蛋', nameEn: 'Fried Egg', category: 'cooking', emoji: '🍳', desc: '初始料理（示例）。', basePrice: 35, seasons: [], sources: [{ type: 'cooking', label: '烹饪', detail: '厨房' }], tags: ['料理'], lovedBy: [], likedBy: [], hatedBy: [] },
  { id: 'cook_029', name: '鱼肉卷', nameEn: 'Fish Taco', category: 'cooking', emoji: '🌮', desc: '示例料理。', basePrice: 500, seasons: [], sources: [{ type: 'cooking', label: '烹饪', detail: '厨房' }], tags: ['料理', '必做料理'], lovedBy: [], likedBy: [], hatedBy: [] },
  { id: 'forage_001', name: '野山葵', nameEn: 'Wild Horseradish', category: 'forage', emoji: '🌿', desc: '春季采集（示例）。', basePrice: 50, seasons: ['spring'], sources: [{ type: 'forage', label: '采集', detail: '春季' }], tags: ['采集'], lovedBy: [], likedBy: [], hatedBy: [] },
  { id: 'min_016', name: '钻石', nameEn: 'Diamond', category: 'mineral', emoji: '💎', desc: '示例矿物。', basePrice: 750, seasons: [], sources: [{ type: 'mines', label: '矿井', detail: '示例' }], tags: ['矿物'], lovedBy: [], likedBy: [], hatedBy: [] }
]

const VILLAGERS = {
  abigail: { id: 'abigail', name: '阿比盖尔', en: 'Abigail', emoji: '💜', avatar: '/images/villagers/Abigail.png' }
}

const CATEGORY_META = {
  crop: { name: '作物', emoji: '🌾', icon: '/images/items/crop_010.png', totalHint: '作物' },
  fish: { name: '鱼类', emoji: '🎣', icon: '/images/items/fish_salmon.png', totalHint: '鱼' },
  cooking: { name: '料理图鉴', emoji: '🍳', icon: '/images/items/cook_029.png', totalHint: '料理' },
  forage: { name: '采集', emoji: '🌿', icon: '/images/items/forage_001.png', totalHint: '采集' },
  mineral: { name: '矿物', emoji: '💎', icon: '/images/items/min_016.png', totalHint: '矿物' },
  animal: { name: '动物', emoji: '🐔', totalHint: '动物' },
  crafting: { name: '打造', emoji: '🔨', totalHint: '打造' },
  special: { name: '特殊', emoji: '✨', totalHint: '特殊' },
  artifact: { name: '古物', emoji: '🗿', totalHint: '古物' },
  book: { name: '书籍', emoji: '📚', totalHint: '书籍' }
}

const SEASON_META = {
  spring: { name: '春', color: '#5cb85c' },
  summer: { name: '夏', color: '#f0ad4e' },
  fall: { name: '秋', color: '#d9534f' },
  winter: { name: '冬', color: '#5bc0de' }
}

const MUST_COOK_NAMES = new Set(['鱼肉卷', '煎鸡蛋'])

const ACHIEVEMENTS = []
const ACHIEVEMENT_CATS = []
const ACHIEVEMENTS_WIKI = 'https://zh.stardewvalleywiki.com/成就'

module.exports = {
  ITEMS,
  VILLAGERS,
  CATEGORY_META,
  SEASON_META,
  ACHIEVEMENTS,
  ACHIEVEMENT_CATS,
  ACHIEVEMENTS_WIKI,
  MUST_COOK_NAMES
}
