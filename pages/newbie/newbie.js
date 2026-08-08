const app = getApp()

Page({
  onShareAppMessage() { return require('../../utils/share.js').onShareAppMessage() },
  onShareTimeline() { return require('../../utils/share.js').onShareTimeline() },
  data: {
    filters: ['全部', '开局必看', '第一年春季', '第一年夏季', '第一年秋季', '第一年冬季', '第二年', '实用技巧'],
    currentFilter: '全部',
    list: [],
    filteredList: [],
    progress: {},
    wikiUrl: 'https://zh.stardewvalleywiki.com/新手指南'
  },

  onLoad() {
    const list = this.getNewbieData()
    const progress = app.getProgress('newbie') || {}
    this.setData({ list, progress })
    this.filterList('全部')
  },

  getNewbieData() {
    return [
      {
        phase: '开局必看',
        tasks: [
          { id: 'start1', title: '清理约15格空地，种下刘易斯送的防风草种子', priority: '必做', desc: '用斧、镐、镰刀清理 → 锄头耕地 → 种下 → 喷壶浇水。4天后收获' },
          { id: 'start2', title: '每天浇水（雨天可跳过）', priority: '必做', desc: '不浇水只会暂停生长，不会死。喷壶没水可去池塘装水' },
          { id: 'start3', title: '看电视（天气预报 + 运气占卜）', priority: '高', desc: '运气好优先下矿/钓鱼，雨天提前准备' },
          { id: 'start4', title: '探索镇子，认识NPC，看公告栏', priority: '中', desc: '完成简单任务可赚钱和提升好感' },
          { id: 'start5', title: '尽快做几个宝箱（50木头一个）', priority: '高', desc: '用来存放物品，避免背包满' }
        ]
      },
      {
        phase: '第一年春季',
        tasks: [
          { id: 'sp1', title: '春13花舞节尽量多买草莓种子', priority: '必做', desc: '春季最赚作物，多次收获' },
          { id: 'sp2', title: '钓鱼赚钱（雨天优先）', priority: '高', desc: '前期稳定收入来源' },
          { id: 'sp3', title: '收集春季采集包 + 春季作物包', priority: '高', desc: '为社区中心做准备' },
          { id: 'sp4', title: '冲矿井到40层左右（出铁）', priority: '中', desc: '升级工具需要铁锭' },
          { id: 'sp5', title: '升级喷壶（优先）', priority: '高', desc: '减少浇水时间，雨天或季末去升级' }
        ]
      },
      {
        phase: '第一年夏季',
        tasks: [
          { id: 'su1', title: '大量种植蓝莓', priority: '必做', desc: '夏季收益最高的多次收获作物' },
          { id: 'su2', title: '建鸡舍开始养鸡', priority: '高', desc: '动物产品可卖钱 + 完成收集包' },
          { id: 'su3', title: '冲矿井到80层（出金）', priority: '高', desc: '金锭用于升级工具和洒水器' },
          { id: 'su4', title: '夏3后地震，温泉开放，可去恢复体力', priority: '中', desc: '铁路也会开通' },
          { id: 'su5', title: '修海滩桥（300木头）', priority: '中', desc: '解锁潮汐池采集' }
        ]
      },
      {
        phase: '第一年秋季',
        tasks: [
          { id: 'fa1', title: '种植蔓越莓', priority: '必做', desc: '秋季最稳多次收获作物' },
          { id: 'fa2', title: '争取修好温室（完成茶水间收集包）', priority: '高', desc: '温室可全年种植，后期核心' },
          { id: 'fa3', title: '完成秋季相关收集包', priority: '高', desc: '作物、采集、鱼等' },
          { id: 'fa4', title: '开始种果树（苹果/石榴等）', priority: '中', desc: '果树28天成熟，可跨季' }
        ]
      },
      {
        phase: '第一年冬季',
        tasks: [
          { id: 'wi1', title: '大量下矿，争取到120层', priority: '必做', desc: '冬天没作物，专注采矿和升级' },
          { id: 'wi2', title: '工具尽量升到金级', priority: '高', desc: '水壶、镐优先' },
          { id: 'wi3', title: '建畜棚/马厩，开始养牛羊', priority: '中', desc: '为大牛奶、羊毛做准备' },
          { id: 'wi4', title: '补完能完成的收集包 + 刷NPC好感', priority: '中', desc: '冬天有更多时间社交' }
        ]
      },
      {
        phase: '第二年重点',
        tasks: [
          { id: 'y2_1', title: '温室种古代水果或杨桃', priority: '必做', desc: '温室核心收益来源' },
          { id: 'y2_2', title: '铺优质/铱制洒水器，实现自动化', priority: '高', desc: '解放双手' },
          { id: 'y2_3', title: '养齐动物，做工匠制品（酒、果酱、奶酪）', priority: '高', desc: '大幅提升收入' },
          { id: 'y2_4', title: '刷骷髅洞穴（铱矿）', priority: '高', desc: '带大量食物和炸弹' },
          { id: 'y2_5', title: '解锁姜岛后经营', priority: '高', desc: '新区域、核桃、火山矿井' }
        ]
      },
      {
        phase: '实用技巧',
        tasks: [
          { id: 'tip1', title: '每天起床先看天气和电视运势', priority: '建议', desc: '好运天优先下矿或钓鱼' },
          { id: 'tip2', title: '耕种5级选「耕种者」→10级选「工匠」', priority: '推荐', desc: '工匠让酒/果酱等价值+40%' },
          { id: 'tip3', title: '采矿5级选「矿工」', priority: '推荐', desc: '矿石产量提升' },
          { id: 'tip4', title: '体力不足就吃食物或去温泉', priority: '建议', desc: '避免凌晨2点累晕（只恢复一半）' },
          { id: 'tip5', title: '高级设置可保证第一年能拿到红叶卷心菜种子', priority: '可选', desc: '方便第一年完成社区中心' }
        ]
      }
    ]
  },

  filterList(filter) {
    let filtered = this.data.list
    if (filter !== '全部') {
      filtered = this.data.list.filter(item => item.phase === filter)
    }
    this.setData({ filteredList: filtered, currentFilter: filter })
  },

  onFilter(e) {
    this.filterList(e.currentTarget.dataset.filter)
  },

  toggleCheck(e) {
    const id = e.currentTarget.dataset.id
    const progress = { ...this.data.progress }
    progress[id] = !progress[id]
    this.setData({ progress })
    app.saveProgress('newbie', progress)
  },

  openWiki() {
    const url = this.data.wikiUrl
    wx.navigateTo({
      url: `/pages/webview/webview?url=${encodeURIComponent(url)}&title=${encodeURIComponent('新手指南')}`
    })
  },

  copyWiki() {
    wx.setClipboardData({
      data: this.data.wikiUrl,
      success() {
        wx.showToast({ title: '维基链接已复制', icon: 'none' })
      }
    })
  }
})
