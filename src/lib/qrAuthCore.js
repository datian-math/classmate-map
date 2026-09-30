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
 * 两个必须遵守的点（都是踩过坑的）：
 *  1. token 只能放在 hash 里。放普通路径上（/classmate-map/qr?t=…）手机扫码会 404。
 *  2. base 必须是**站点根**（/classmate-map/），不能传 location.pathname。
 *     在登录页时 pathname 是 /classmate-map/login，那个路径在 GitHub Pages 上不存在，
 *     会命中 404.html，而 404.html 会 location.replace 回首页并**丢掉 hash**，
 *     结果扫码落在首页、确认页压根不渲染。
 *
 * base 传 Vite 的 import.meta.env.BASE_URL（与 vite.config 的 base 一致）。
 */
export function qrUrlFor(token, origin, base = '/') {
  const b = base.endsWith('/') ? base : base + '/'
  return `${origin}${b}#/qr?t=${token}`
}
