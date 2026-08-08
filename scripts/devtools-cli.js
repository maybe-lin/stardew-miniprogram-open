/**
 * 微信开发者工具 CLI 封装（用当前登录的 IDE，无需代码上传密钥）
 * 文档: https://developers.weixin.qq.com/miniprogram/dev/devtools/cli.html
 *
 * 前置: 开发者工具已启动，且 设置→安全设置→服务端口 已开启
 *
 * 用法:
 *   node scripts/devtools-cli.js open
 *   node scripts/devtools-cli.js cache [compile|file|all]
 *   node scripts/devtools-cli.js preview
 *   node scripts/devtools-cli.js islogin
 */
const { spawnSync } = require('child_process')
const fs = require('fs')
const path = require('path')
const os = require('os')

const ROOT = path.resolve(__dirname, '..')
const CLI = '/Applications/wechatwebdevtools.app/Contents/MacOS/cli'
const USER_DATA = path.join(
  os.homedir(),
  'Library/Application Support/微信开发者工具'
)

function findIdePort() {
  if (!fs.existsSync(USER_DATA)) return null
  const hashes = fs.readdirSync(USER_DATA).filter((n) => /^[a-f0-9]{32}$/i.test(n))
  for (const h of hashes) {
    const p = path.join(USER_DATA, h, 'Default', '.ide')
    if (fs.existsSync(p)) {
      const port = fs.readFileSync(p, 'utf8').trim()
      if (/^\d+$/.test(port)) return Number(port)
    }
  }
  return null
}

function ensureCli() {
  if (!fs.existsSync(CLI)) {
    console.error('❌ 未找到微信开发者工具 CLI:', CLI)
    process.exit(1)
  }
  const port = findIdePort()
  if (!port) {
    console.error(`❌ 读不到 IDE 服务端口（.ide）。

请先:
1. 打开微信开发者工具
2. 设置 → 安全设置 → 服务端口：开启
3. 用工具打开本项目后再试

或直接:
  open -a wechatwebdevtools "${ROOT}"
`)
    process.exit(1)
  }
  return port
}

function run(args, port) {
  const full = [...args, '--project', ROOT, '--port', String(port), '--lang', 'zh']
  console.log('>', path.basename(CLI), full.join(' '))
  const r = spawnSync(CLI, full, { stdio: 'inherit', encoding: 'utf8' })
  if (r.error) {
    console.error(r.error)
    process.exit(1)
  }
  process.exit(r.status || 0)
}

function main() {
  const cmd = (process.argv[2] || 'preview').toLowerCase()
  ensureCli()
  const port = findIdePort()

  if (cmd === 'islogin') {
    run(['islogin'], port)
  } else if (cmd === 'open') {
    run(['open'], port)
  } else if (cmd === 'cache') {
    const type = process.argv[3] || 'compile'
    run(['cache', '--clean', type], port)
  } else if (cmd === 'preview') {
    const out = path.join(ROOT, 'preview-qrcode.jpg')
    const info = path.join(ROOT, 'preview-info.json')
    // 先清编译缓存再预览，接近「重新编译」
    console.log('清理 compile 缓存…')
    spawnSync(
      CLI,
      ['cache', '--clean', 'compile', '--project', ROOT, '--port', String(port), '--lang', 'zh'],
      { stdio: 'inherit' }
    )
    run(
      [
        'preview',
        '--qr-format',
        'image',
        '--qr-output',
        out,
        '--info-output',
        info
      ],
      port
    )
  } else if (cmd === 'quit') {
    run(['quit'], port)
  } else {
    console.log(`用法:
  node scripts/devtools-cli.js islogin
  node scripts/devtools-cli.js open
  node scripts/devtools-cli.js cache [compile|file|all]
  node scripts/devtools-cli.js preview
`)
    process.exit(1)
  }
}

main()
