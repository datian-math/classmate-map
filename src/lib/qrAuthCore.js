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
 * 必须用 hash 路由（#/qr?t=…）：GitHub Pages 是纯静态托管，没有 404 兜底，
 * 把 token 放在普通路径上（/classmate-map/qr?t=…）手机扫码会直接 404。
 */
export function qrUrlFor(token, origin, pathname) {
  return `${origin}${pathname}#/qr?t=${token}`
}
