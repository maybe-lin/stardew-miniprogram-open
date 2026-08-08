const GROUP_META = {
  female_date: { label: '可婚女', color: '#C47BB0' },
  male_date: { label: '可婚男', color: '#6F8F72' },
  female_other: { label: '其他女', color: '#C47BB0' },
  male_other: { label: '其他男', color: '#6F8F72' },
  other: { label: '其他', color: '#8B7355' }
}
const FRIENDSHIP_TIPS = {
  title: '好感机制（示例）',
  summary: '完整说明见完整数据包',
  points: [{ title: '送礼', text: '每周最多 2 次，生日 ×8' }],
  giftTable: [{ level: '最爱', normal: '+80', feast: '×5', birthday: '×8' }],
  note: '示例数据'
}
function groupOf(npc) {
  if (npc.marriageable && npc.gender === 'f') return 'female_date'
  if (npc.marriageable && npc.gender === 'm') return 'male_date'
  return npc.gender === 'f' ? 'female_other' : 'male_other'
}
function groupLabel(npc) { return (GROUP_META[groupOf(npc)] || GROUP_META.other).label }
module.exports = { FRIENDSHIP_TIPS, GROUP_META, groupOf, groupLabel }
