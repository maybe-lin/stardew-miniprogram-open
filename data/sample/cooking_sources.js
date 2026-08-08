module.exports = {
  COOKING_SOURCES: {
    cook_000: { sources: [{ type: 'starter', label: '初始已知', detail: '开局即会', short: '初始' }] },
    cook_029: { sources: [{ type: 'mail', label: '村民邮件', detail: '莱纳斯 7 心+（示例）', short: '莱纳斯 7♥+', villager: 'linus', hearts: 7 }] }
  },
  QUEEN_OF_SAUCE_SCHEDULE: {
    odd: [{ season: 'spring', day: 7, id: 'cook_000', name: '煎鸡蛋' }],
    even: []
  }
}
