const COOKING_RECIPES = require('./cooking_recipes.js').COOKING_RECIPES || {}
const RARE_MATERIALS = {}
const RECIPES = { ...COOKING_RECIPES }
const USES = {}
const NEEDED_BY_EXTRA = {}
const VIRTUAL_ITEMS = {}
function isRareMaterial() { return false }
module.exports = { RARE_MATERIALS, RECIPES, USES, NEEDED_BY_EXTRA, VIRTUAL_ITEMS, isRareMaterial }
