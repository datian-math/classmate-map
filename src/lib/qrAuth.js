// 扫码登录里依赖网络的逻辑（纯函数在 qrAuthCore.js）
import { supabase } from './supabase'
import { randomHex, sha256Hex, qrUrlFor } from './qrAuthCore'

export { randomHex, sha256Hex, qrUrlFor }

/**
 * 发起一次登录请求。
 * 返回本次的 token / secret：
 *   - token 会放进二维码（公开，学生扫得到也没用）
 *   - secret 只留在调用方内存里，落库的是它的 SHA-256
 */
export async function createLoginRequest() {
  const token = randomHex(32)
  const secret = randomHex(32)
  const secretHash = await sha256Hex(secret)

  const { error } = await supabase
    .from('login_requests')
    .insert({ token, secret_hash: secretHash })

  if (error) throw new Error('发起登录请求失败：' + error.message)
  return { token, secret }
}

/** 轮询状态。行不存在或已过期都返回 'expired' */
export async function pollStatus(token) {
  const { data, error } = await supabase
    .from('login_requests')
    .select('status, expires_at')
    .eq('token', token)
    .maybeSingle()

  // 网络/权限错误不要伪装成"过期"，否则用户看到"二维码已失效"会被误导
  if (error) return { status: 'error', error: error.message }
  if (!data) return { status: 'expired' }
  if (new Date(data.expires_at) < new Date()) return { status: 'expired' }
  return { status: data.status === 'approved' ? 'approved' : 'pending' }
}

/**
 * 用 token + secret 换回一次性登录链接。
 * 返回 { link, error }：link 为 null 且有 error 时，错误信息会原样透出，
 * 不再像早先那样静默返回 null —— 排查 schema/权限类问题时那次很难定位。
 */
export async function claimLogin(token, secret) {
  const { data, error } = await supabase.rpc('claim_login', {
    p_token: token,
    p_secret: secret,
  })
  if (error) return { link: null, error: error.message }
  return { link: data || null, error: null }
}

/** 手机端：确认这台电脑登录 */
export async function approveLogin(token, userAccessToken) {
  const url = `${supabase.supabaseUrl}/functions/v1/qr-approve`
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${supabase.supabaseKey}`,
      },
      body: JSON.stringify({ token, userAccessToken }),
    })
    if (res.ok) return { ok: true }
    const body = await res.json().catch(() => ({}))
    return { ok: false, error: body.error || `HTTP ${res.status}` }
  } catch (e) {
    return { ok: false, error: e.message || '网络错误' }
  }
}
