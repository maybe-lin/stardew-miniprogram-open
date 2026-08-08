/**
 * 地图页
 * 注意：movable-view 的 scale-value / x / y 是受控属性。
 * 双指缩放过程中禁止 setData 回写，否则会与原生手势打架导致闪烁。
 */
const MAP_RATIO = 916 / 1632 // 地图原图高/宽
const MAP_MAX_SCALE = 4
const MAP_URL = '/images/map-residence.jpg'
/** 视口高度上下限（px）；始终保持原图宽高比，不强制拉伸 */
const MAP_MIN_HEIGHT = 160
const MAP_MAX_HEIGHT = 480

const MAP_AREAS = [
  {
    id: 'overview',
    name: '全图',
    icon: '🗺️',
    mapImage: MAP_URL,
    mapRatio: MAP_RATIO,
    subtitle: '区域示意 · 先看清方位与连接（非精确坐标）',
    residents: '地图覆盖星露谷本岛主要居民住处，不含姜岛',
    points: [
      '北侧是铁路、温泉、深山和矿井，东南侧通往沙滩',
      '鹈鹕镇位于地图中央，商店和公共设施最集中',
      '煤矿森林与秘密森林位于西南方向，沙漠在西北角单独标出',
      '选择上方任一区域，地图会自动放大并定位到对应位置',
      '以下各区域图均为示意，具体路径与建筑位置以游戏内为准'
    ]
  },
  {
    id: 'town',
    name: '鹈鹕镇',
    icon: '🏘️',
    mapImage: '/packages/map/images/maps/pelican-town.jpg',
    mapRatio: 879 / 960,
    subtitle: '商店与公共设施最集中的区域',
    residents: '阿比盖尔、哈维、海莉、艾米丽、刘易斯、克林特、乔迪一家、乔治一家',
    points: [
      '皮埃尔杂货店：9:00 开门，通常 17:00 停止售货；社区中心修复前周三休息',
      '诊所：9:00—15:00；星之果实餐吧：12:00—次日 2:00',
      '铁匠铺可升级工具、敲开晶球；博物馆累计捐赠 60 件可获得生锈的钥匙',
      '特别任务板从第一年秋 2 日起开放，每周一刷新'
    ]
  },
  {
    id: 'bus',
    name: '巴士站',
    icon: '🚌',
    mapImage: '/packages/map/images/maps/bus-station.jpg',
    mapRatio: 720 / 840,
    subtitle: '前往沙漠与快速交通的入口',
    residents: '潘姆通常 10:10 到达巴士旁，17:00 离开',
    points: [
      '巴士：完成金库收集包，或通过 Joja 花费 40,000g 修复',
      '沙漠车票 500g，需在潘姆值班期间购买',
      '矿车：完成锅炉房收集包，或通过 Joja 花费 15,000g 修复',
      '矿车可快速前往城镇、矿井和采石场'
    ]
  },
  {
    id: 'mountain',
    name: '深山',
    icon: '⛰️',
    mapImage: '/packages/map/images/maps/mountain.jpg',
    mapRatio: 291 / 960,
    subtitle: '木匠店、矿井与冒险家公会',
    residents: '罗宾、德米特里厄斯、玛鲁、塞巴斯蒂安、莱纳斯；后期还有雷欧',
    points: [
      '木匠商店可建造农场建筑、升级农舍和移动建筑',
      '矿井在第一年春 5 日解锁；到达矿井 5 层后可推进冒险家公会任务',
      '采石场通过工艺室收集包，或 Joja 25,000g 项目解锁',
      '铁路区域会在第一年夏 3 日地震后开放'
    ]
  },
  {
    id: 'railroad',
    name: '铁路',
    icon: '🚂',
    mapImage: '/packages/map/images/maps/railroad.jpg',
    mapRatio: 528 / 960,
    subtitle: '温泉、火车与后期任务入口',
    residents: '无常住居民；莱纳斯偶尔会来到温泉附近',
    points: [
      '第一年夏 3 日自动开放，火车经过时可能掉落物品',
      '温泉可免费恢复体力与生命值',
      '完成社区中心或 Joja 项目后，可在此推进黑暗护符任务线',
      '山顶需达成 100% 完美度后才能进入'
    ]
  },
  {
    id: 'witch',
    name: '巫婆沼泽',
    icon: '🧙',
    mapImage: '/packages/map/images/maps/witch-swamp.jpg',
    mapRatio: 1350 / 1080,
    subtitle: '女巫小屋与虚空鲑鱼水域',
    residents: '无常住居民；哥布林会在任务期间挡住女巫小屋入口',
    points: [
      '完成社区中心或 Joja 项目后，在铁路区域开启黑暗护符任务线',
      '取得黑暗护符并通过铁路洞穴，可进入巫婆沼泽',
      '向哥布林守卫赠送虚空蛋黄酱后，可进入女巫小屋',
      '沼泽是虚空鲑鱼的主要垂钓地点'
    ]
  },
  {
    id: 'beach',
    name: '沙滩',
    icon: '🏖️',
    mapImage: '/packages/map/images/maps/beach.jpg',
    mapRatio: 436 / 960,
    subtitle: '钓鱼、求婚与姜岛航线',
    residents: '威利、艾利欧特',
    points: [
      '鱼店出售鱼竿、鱼饵和渔具，也能处理部分钓鱼事务',
      '右侧断桥花费 300 木材修复，可进入潮池区域',
      '老水手仅在雨天出现；满足条件后可用 5,000g 购买美人鱼吊坠',
      '完成社区中心或 Joja 项目后，修好威利的船即可前往姜岛'
    ]
  },
  {
    id: 'forest',
    name: '煤矿森林',
    icon: '🌲',
    mapImage: '/packages/map/images/maps/cindersap-forest.jpg',
    mapRatio: 960 / 960,
    subtitle: '牧场、法师塔与旅行货车',
    residents: '玛妮、谢恩、贾斯、莉亚、法师',
    points: [
      '玛妮牧场可购买动物与畜牧用品；法师塔位于区域西侧',
      '旅行货车通常在周五、周日出现，可补购非当季物品',
      '帽子店在取得第一个成就后开放',
      '下水道入口位于南部；精通山洞需五项技能全部达到 10 级'
    ]
  },
  {
    id: 'secret',
    name: '秘密森林',
    icon: '🌳',
    mapImage: '/packages/map/images/maps/secret-woods.jpg',
    mapRatio: 512 / 960,
    subtitle: '硬木与星之果实',
    residents: '无常住居民',
    points: [
      '使用钢斧或更高级斧头劈开煤矿森林西北角的圆木后进入',
      '树桩每日刷新，是稳定获取硬木的地点',
      '向老坎诺利大师献上宝石甜莓，可获得一个星之果实',
      '雨天与特定季节可在这里发现不同鱼类和采集物'
    ]
  },
  {
    id: 'sewer',
    name: '下水道',
    icon: '🕳️',
    mapImage: '/packages/map/images/maps/sewer.jpg',
    mapRatio: 1350 / 1080,
    subtitle: '科罗布斯与职业重置',
    residents: '科罗布斯',
    points: [
      '向博物馆捐赠 60 件物品后，冈瑟会送来生锈的钥匙',
      '科罗布斯出售稀有商品，关系足够后也可成为室友',
      '不确定雕像可花费 10,000g 重选技能职业',
      '突变虫穴会在黑暗护符任务线中开放'
    ]
  },
  {
    id: 'bugLair',
    name: '突变虫穴',
    icon: '🪲',
    mapImage: '/packages/map/images/maps/mutant-bug-lair.jpg',
    mapRatio: 1080 / 1080,
    subtitle: '黑暗护符任务中的地下区域',
    residents: '无常住居民，区域内会刷新突变昆虫',
    points: [
      '在黑暗护符任务期间，从下水道左侧通道进入',
      '宝箱中可以取得推进任务所需的黑暗护符',
      '区域内可获得虫肉、藻类等资源',
      '史莱姆鱼只能在这里的水域钓到'
    ]
  },
  {
    id: 'desert',
    name: '沙漠',
    icon: '🏜️',
    mapImage: '/packages/map/images/maps/desert.jpg',
    mapRatio: 960 / 800, // 800x960
    subtitle: '骷髅洞穴、绿洲与赌场',
    residents: '桑迪',
    points: [
      '巴士修复后，花费 500g 车票前往',
      '普通矿井 120 层取得头骨钥匙后，才能进入骷髅洞穴',
      '手持五彩碎片站到三根柱子中央，可获得银河剑',
      '赌场位于绿洲内部，完成“神秘的齐”任务线后开放'
    ]
  },
  {
    id: 'backwoods',
    name: '边远森林',
    icon: '🛣️',
    mapImage: '/packages/map/images/maps/backwoods.jpg',
    mapRatio: 1080 / 1350,
    subtitle: '农场北侧通道与隧道',
    residents: '无常住居民',
    points: [
      '连接农场、巴士站与深山，是早期常用近路',
      '巴士站西侧隧道可以放置部分可制造物品',
      '向隧道内的供电箱放入电池组，可开启“神秘的齐”任务线',
      '该区域容易被忽略，做赌场前置任务时记得回来检查'
    ]
  }
]

const gameTime = require('../../../../utils/gameTime.js')

Page({
  onShareAppMessage() { return require('../../../../utils/share.js').onShareAppMessage() },
  onShareTimeline() { return require('../../../../utils/share.js').onShareTimeline() },
  data: {
    darkMode: false,
    uiSeason: 'spring',
    scale: 1,
    scaleLabel: '1.0',
    x: 0,
    y: 0,
    viewW: 300,
    viewH: 168,
    viewOffsetX: 0,
    areas: MAP_AREAS,
    areaCount: MAP_AREAS.length - 1,
    selectedAreaId: MAP_AREAS[0].id,
    selectedArea: MAP_AREAS[0]
  },

  _scale: 1,
  _x: 0,
  _y: 0,
  _touching: false,
  _syncTimer: null,

  onShow() {
    const theme = gameTime.pageThemeData()
    gameTime.applySeasonChrome(theme.uiSeason)
    this.setData(theme)
  },

  onReady() {
    this._measureView()
  },

  onResize() {
    this._measureView()
  },

  onUnload() {
    if (this._syncTimer) {
      clearTimeout(this._syncTimer)
      this._syncTimer = null
    }
  },

  _measureView() {
    wx.createSelectorQuery()
      .in(this)
      .select('.map-wrap')
      .boundingClientRect((rect) => {
        if (!rect || !rect.width) return
        const containerW = Math.floor(rect.width)
        this._containerW = containerW
        const area = this.data.selectedArea || MAP_AREAS[0]
        const layout = this._mapLayout(containerW, area.mapRatio)
        this.setData({
          viewW: layout.viewW,
          viewH: layout.viewH,
          viewOffsetX: layout.viewOffsetX
        })
      })
      .exec()
  },

  onScale(e) {
    // 只记本地值，绝不 setData —— 回写 scale-value 会闪
    this._scale = e.detail.scale || 1
  },

  onMove(e) {
    const src = e.detail.source
    // touch / 惯性滑动都更新缓存；空 source 多为受控赋值引起的回调，忽略
    if (src === 'touch' || src === 'touch-out-of-bounds' || src === 'friction') {
      this._x = e.detail.x
      this._y = e.detail.y
    }
  },

  onTouchStart() {
    this._touching = true
    if (this._syncTimer) {
      clearTimeout(this._syncTimer)
      this._syncTimer = null
    }
  },

  onTouchEnd(e) {
    // 多指时仍有触点，等全部抬起再同步
    if (e.touches && e.touches.length > 0) return
    this._touching = false
    // 略延迟，避开最后一次 scale/change 回调
    if (this._syncTimer) clearTimeout(this._syncTimer)
    this._syncTimer = setTimeout(() => {
      this._syncTimer = null
      if (this._touching) return
      this._syncControlled()
    }, 50)
  },

  /** 手势结束后把真实 scale/x/y 写回，避免下次 setData 被重置 */
  _syncControlled() {
    const scale = Math.max(1, Math.min(MAP_MAX_SCALE, this._scale || 1))
    const rounded = Math.round(scale * 10) / 10
    const x = this._x || 0
    const y = this._y || 0
    this._scale = rounded
    const { scale: ds, x: dx, y: dy } = this.data
    // 值未变则跳过，减少无意义重绘
    if (ds === rounded && dx === x && dy === y) return
    this.setData({
      scale: rounded,
      scaleLabel: rounded.toFixed(1),
      x,
      y
    })
  },

  selectArea(e) {
    const id = e.currentTarget.dataset.id
    const selectedArea = MAP_AREAS.find((item) => item.id === id)
    if (!selectedArea) return
    this._focusArea(selectedArea)
  },

  /**
   * 按原图比例算显示尺寸；过高时等比缩小宽度并水平居中，
   * 保证 movable-view 与图片同比例（配合 scaleToFill 无绿边、不变形）。
   */
  _mapLayout(containerW, ratio) {
    ratio = ratio || MAP_RATIO
    const cw = Math.max(1, Math.floor(containerW || this._containerW || this.data.viewW || 300))
    let w = cw
    let h = Math.round(w * ratio)
    let offsetX = 0
    if (h > MAP_MAX_HEIGHT) {
      h = MAP_MAX_HEIGHT
      w = Math.max(1, Math.round(h / ratio))
      offsetX = Math.max(0, Math.floor((cw - w) / 2))
    } else if (h < MAP_MIN_HEIGHT) {
      // 极扁图：抬高到最小高度，宽度可超出容器，由拖动手势查看
      h = MAP_MIN_HEIGHT
      w = Math.max(1, Math.round(h / ratio))
      offsetX = 0
    }
    return { viewW: w, viewH: h, viewOffsetX: offsetX }
  },

  _mapHeight(viewW, ratio) {
    return this._mapLayout(viewW, ratio).viewH
  },

  _focusArea(area) {
    const scale = 1
    const x = 0
    const y = 0
    const containerW = this._containerW || this.data.viewW || 300
    const layout = this._mapLayout(containerW, area.mapRatio)

    this._scale = 1
    this._x = 0
    this._y = 0
    this.setData({
      selectedAreaId: area.id,
      selectedArea: area,
      scale,
      scaleLabel: scale.toFixed(1),
      x,
      y,
      viewW: layout.viewW,
      viewH: layout.viewH,
      viewOffsetX: layout.viewOffsetX
    })
  },

  resetMap() {
    this._focusArea(MAP_AREAS[0])
  },

  /** 使用微信原生图片查看器，直接按原图解码，避免 movable-view 图层放大变糊。 */
  openPreview() {
    const current = this.data.selectedArea.mapImage || MAP_URL
    wx.previewImage({
      current,
      urls: [current],
      showmenu: true
    })
  },

})
