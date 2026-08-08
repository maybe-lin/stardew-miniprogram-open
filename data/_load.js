/**
 * 半开源数据加载
 * - 优先 data/private/*.js（完整数据包，本地维护，不进公开仓）
 * - 否则 data/sample/*.js（示例，公开仓可运行）
 *
 * 维护者：把完整模块放进 data/private/ 即可恢复全量图鉴。
 */
function isMissingModuleError(e) {
  if (!e) return false
  if (e.code === 'MODULE_NOT_FOUND' || e.code === 'ENOENT') return true
  const msg = String(e.message || e)
  return /Cannot find module|ENOENT|no such file/i.test(msg)
}

function load(name) {
  try {
    return require('./private/' + name + '.js')
  } catch (e) {
    if (!isMissingModuleError(e)) throw e
    try {
      return require('./sample/' + name + '.js')
    } catch (e2) {
      const err = new Error(
        `[data] 缺少模块「${name}」。请将完整数据放入 data/private/${name}.js，或提供 data/sample/${name}.js（见 data/README.md）`
      )
      err.cause = e2
      throw err
    }
  }
}

module.exports = load
