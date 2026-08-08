/**
 * 微信小程序 miniprogram-ci 封装
 * 文档: https://developers.weixin.qq.com/miniprogram/dev/devtools/ci.html
 *
 * 用法:
 *   node scripts/ci.js preview
 *   node scripts/ci.js upload [version] [desc]
 *   node scripts/ci.js info
 *
 * 前置:
 *   1. 微信公众平台 → 管理 → 开发管理 → 开发设置 → 小程序代码上传
 *      生成「代码上传密钥」，保存为项目根目录:
 *        private.wx9e53905e3688c7b6.key
 *   2. 配置 IP 白名单（本机公网 IP，或关闭白名单仅本地慎用）
 *   3. npm install
 */
const fs = require('fs')
const path = require('path')

const ROOT = path.resolve(__dirname, '..')
const APPID = process.env.MP_APPID || 'wx9e53905e3688c7b6'
const KEY_CANDIDATES = [
  process.env.MP_PRIVATE_KEY_PATH,
  path.join(ROOT, `private.${APPID}.key`),
  path.join(ROOT, 'private.key'),
  path.join(ROOT, 'keys', `private.${APPID}.key`)
].filter(Boolean)

const COMPILE_SETTING = {
  es6: true,
  es7: true, // enhance
  minify: true,
  minifyJS: true,
  minifyWXML: true,
  minifyWXSS: true,
  autoPrefixWXSS: true,
  codeProtect: false
}

function resolveKeyPath() {
  for (const p of KEY_CANDIDATES) {
    if (p && fs.existsSync(p)) return path.resolve(p)
  }
  return null
}

function printKeyHelp() {
  console.error(`
❌ 未找到代码上传密钥。

请按文档配置后再试:
  https://developers.weixin.qq.com/miniprogram/dev/devtools/ci.html

1. 打开 https://mp.weixin.qq.com
2. 管理 → 开发管理 → 开发设置 → 小程序代码上传
3. 生成「代码上传密钥」，下载 private.${APPID}.key
4. 放到本项目根目录:
     ${path.join(ROOT, `private.${APPID}.key`)}
5. 配置 IP 白名单（加入当前公网 IP）

也可用环境变量:
  export MP_PRIVATE_KEY_PATH=/path/to/private.key
  export MP_APPID=${APPID}
`)
}

async function createProject() {
  const ci = require('miniprogram-ci')
  const privateKeyPath = resolveKeyPath()
  if (!privateKeyPath) {
    printKeyHelp()
    process.exit(1)
  }

  console.log('AppID:', APPID)
  console.log('Project:', ROOT)
  console.log('Key:', privateKeyPath)

  return new ci.Project({
    appid: APPID,
    type: 'miniProgram',
    projectPath: ROOT,
    privateKeyPath,
    ignores: [
      'node_modules/**/*',
      '.git/**/*',
      '.grok/**/*',
      '.venv-img/**/*',
      '_dev_unused/**/*',
      'scripts/**/*',
      'keys/**/*',
      'private*.key',
      '**/*.md',
      'package*.json',
      'preview-qrcode.*'
    ]
  })
}

async function cmdInfo() {
  const project = await createProject()
  const attr = await project.attr()
  console.log('项目属性:', JSON.stringify(attr, null, 2))
}

async function cmdPreview() {
  const ci = require('miniprogram-ci')
  const project = await createProject()
  const out = path.join(ROOT, 'preview-qrcode.jpg')
  console.log('开始预览编译…')
  const result = await ci.preview({
    project,
    desc: process.env.MP_DESC || `cli preview ${new Date().toISOString()}`,
    setting: COMPILE_SETTING,
    qrcodeFormat: 'image',
    qrcodeOutputDest: out,
    robot: Number(process.env.MP_ROBOT || 1),
    onProgressUpdate: (p) => {
      if (p && (p.status === 'done' || p._status === 'done' || typeof p === 'string')) {
        process.stdout.write('.')
      }
    }
  })
  console.log('\n✅ 预览完成')
  console.log('二维码:', out)
  if (result && result.subPackageInfo) {
    console.log('包信息:', result.subPackageInfo)
  }
  console.log(result)
}

async function cmdUpload() {
  const ci = require('miniprogram-ci')
  const project = await createProject()
  const version = process.argv[3] || process.env.MP_VERSION || '0.0.1'
  const desc = process.argv[4] || process.env.MP_DESC || `cli upload ${new Date().toISOString()}`
  console.log(`开始上传 version=${version}…`)
  const result = await ci.upload({
    project,
    version,
    desc,
    setting: COMPILE_SETTING,
    robot: Number(process.env.MP_ROBOT || 1),
    onProgressUpdate: () => process.stdout.write('.')
  })
  console.log('\n✅ 上传完成')
  if (result && result.subPackageInfo) {
    console.log('包信息:', result.subPackageInfo)
  }
  console.log(result)
}

async function main() {
  const cmd = (process.argv[2] || 'preview').toLowerCase()
  try {
    if (cmd === 'info') await cmdInfo()
    else if (cmd === 'preview') await cmdPreview()
    else if (cmd === 'upload') await cmdUpload()
    else {
      console.log(`用法:
  node scripts/ci.js info
  node scripts/ci.js preview
  node scripts/ci.js upload [version] [desc]
`)
      process.exit(1)
    }
  } catch (err) {
    console.error('\n❌ CI 失败:', err && err.message ? err.message : err)
    if (err && err.stack) console.error(err.stack)
    process.exit(1)
  }
}

main()
