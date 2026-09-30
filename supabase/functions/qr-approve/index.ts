// 蹭饭图扫码登录：手机确认后生成一次性登录链接
//
// 部署方式（不需要装任何工具）：
//   Supabase 控制台 → Edge Functions → Deploy a new function → Via Editor
//   函数名填 qr-approve，把本文件内容整段粘进去，点 Deploy
//
// 安全说明：SUPABASE_SERVICE_ROLE_KEY 由 Supabase 自动注入到 Edge Function 环境变量里，
// 代码里只读环境变量、不写明文，所以这份文件推到公开仓库也是安全的。
import { createClient } from 'jsr:@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type, apikey, x-client-info',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const REDIRECT_TO = 'https://datian-math.github.io/classmate-map/'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  if (req.method !== 'POST') {
    return Response.json({ error: 'method not allowed' }, { status: 405, headers: CORS })
  }

  let token: string | undefined
  let userAccessToken: string | undefined
  try {
    const body = await req.json()
    token = body.token
    userAccessToken = body.userAccessToken
  } catch {
    return Response.json({ error: 'invalid json' }, { status: 400, headers: CORS })
  }

  if (!token || !userAccessToken) {
    return Response.json({ error: 'missing params' }, { status: 400, headers: CORS })
  }

  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  // 1. 验证发起确认的用户身份
  const { data: { user }, error: authErr } = await admin.auth.getUser(userAccessToken)
  if (authErr || !user?.email) {
    return Response.json({ error: 'invalid user' }, { status: 401, headers: CORS })
  }

  // 2. 请求必须仍有效且未被使用
  const { data: row, error: rowErr } = await admin
    .from('login_requests')
    .select('token, status, expires_at')
    .eq('token', token)
    .maybeSingle()

  if (rowErr || !row) {
    return Response.json({ error: 'request not found' }, { status: 404, headers: CORS })
  }
  if (new Date(row.expires_at) < new Date()) {
    return Response.json({ error: 'expired' }, { status: 410, headers: CORS })
  }
  if (row.status !== 'pending') {
    return Response.json({ error: 'already used' }, { status: 409, headers: CORS })
  }

  // 3. 生成一次性登录链接（只生成，不会真的发邮件）
  const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
    type: 'magiclink',
    email: user.email,
    options: { redirectTo: REDIRECT_TO },
  })
  if (linkErr || !linkData?.properties?.action_link) {
    return Response.json(
      { error: linkErr?.message || 'generate link failed' },
      { status: 500, headers: CORS }
    )
  }

  // 4. 写回。条件里带 status='pending'，防止两个人同时确认时互相覆盖
  const { error: updErr } = await admin
    .from('login_requests')
    .update({
      status: 'approved',
      login_link: linkData.properties.action_link,
      user_id: user.id,
    })
    .eq('token', token)
    .eq('status', 'pending')

  if (updErr) {
    return Response.json({ error: updErr.message }, { status: 500, headers: CORS })
  }

  // 5. 顺手清掉过期记录（量极小，不做也没关系）
  await admin.from('login_requests').delete().lt('expires_at', new Date().toISOString())

  return Response.json({ ok: true }, { headers: CORS })
})
