/**
 * 星露谷品质售价
 * 普通 1.0 / 银 1.25 / 金 1.5 / 铱 2.0
 * professionMult：职业卖价乘数（1 = 无加成，1.25 = 渔夫等）
 */
const QUALITY = {
  normal: { key: 'normal', label: '普通', mult: 1.0 },
  silver: { key: 'silver', label: '银星', mult: 1.25 },
  gold: { key: 'gold', label: '金星', mult: 1.5 },
  iridium: { key: 'iridium', label: '铱星', mult: 2.0 }
}

/**
 * @param {number} base 基础价
 * @param {string} qualityKey
 * @param {boolean|number} professionBoost true=旧版固定1.1；number=乘数
 */
function calcPrice(base, qualityKey, professionBoost) {
  const q = QUALITY[qualityKey] || QUALITY.normal
  let p = Math.floor(Number(base || 0) * q.mult)
  if (professionBoost === true) {
    p = Math.floor(p * 1.1)
  } else if (typeof professionBoost === 'number' && professionBoost > 0 && professionBoost !== 1) {
    p = Math.floor(p * professionBoost)
  }
  return p
}

function allPrices(base, professionBoost) {
  return {
    normal: calcPrice(base, 'normal', professionBoost),
    silver: calcPrice(base, 'silver', professionBoost),
    gold: calcPrice(base, 'gold', professionBoost),
    iridium: calcPrice(base, 'iridium', professionBoost)
  }
}

module.exports = { QUALITY, calcPrice, allPrices }
