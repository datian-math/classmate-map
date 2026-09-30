// 扫码登录的纯函数部分（不依赖 supabase，可单独用 node 跑测试）
// 依赖网络的逻辑在 qrAuth.js 里

/** 生成 n 字节的随机十六进制串（长度为 2n 个字符） */
export function randomHex(bytes) {
  const a = new Uint8Array(bytes)
  crypto.getRandomValues(a)
  return [...a].map((b) => b.toString(16).padStart(2, '0')).join('')
}

/** SHA-256 十六进制摘要（小写，64 字符） */
export async function sha256Hex(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

/**
 * 拼出二维码里要放的地址。
 *
 * 用 **query 参数**而不是 hash，这是踩过坑后的结论：
 *   hash（#/qr?t=…）在电脑浏览器上正常，但在手机/微信内置浏览器里会被丢掉
 *   （不发给服务器，跳转和安全检测环节都可能丢），症状是扫码后落在首页、
 *   确认页压根不渲染。query 是真实请求的一部分，任何环境都不丢。
 *
 * 路径必须是**站点根**（/classmate-map/），不能传 location.pathname：
 * 登录页时 pathname 是 /classmate-map/login，那个路径在 GitHub Pages 上不存在，
 * 会命中 404.html 然后被跳回首页。
 *
 * base 传 Vite 的 import.meta.env.BASE_URL（与 vite.config 的 base 一致）。
 */
export function qrUrlFor(token, origin, base = '/') {
  const b = base.endsWith('/') ? base : base + '/'
  return `${origin}${b}?qr=${token}`
}

/**
 * 从 URL 里解析扫码 token。优先 query（?qr=），同时兼容老的 hash 写法。
 * 参数直接给字符串，方便单测。
 */
export function parseQrToken(search, hash) {
  const fromQuery = new URLSearchParams(search || '').get('qr')
  if (fromQuery) return fromQuery

  const h = hash || ''
  if (h.startsWith('#/qr')) {
    const q = h.indexOf('?')
    if (q !== -1) return new URLSearchParams(h.slice(q + 1)).get('t') || ''
  }
  return ''
}
