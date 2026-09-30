import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { approveLogin, readQrTokenFromLocation } from '../lib/qrAuth'

export default function QrConfirm() {
  const [token] = useState(readQrTokenFromLocation)
  // loading | needLogin | ready | done | error
  const [state, setState] = useState('loading')
  const [msg, setMsg] = useState('')
  const [email, setEmail] = useState('')
  const [pwd, setPwd] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!token) {
      setState('error')
      setMsg('二维码链接无效，请重新扫码')
      return
    }
    supabase.auth.getSession().then(({ data }) => {
      setState(data.session ? 'ready' : 'needLogin')
    })
  }, [token])

  const confirm = useCallback(async () => {
    setBusy(true)
    setMsg('')

    // 必须先刷新：access_token 只有 1 小时有效期，而 getSession() 返回的
    // 是本地缓存（可能早已过期），直接拿去服务端验证会被判 invalid user。
    // 刷新失败（refresh_token 也失效）时再退回 getSession，拿不到就要求重新登录。
    const { data: refreshed } = await supabase.auth.refreshSession()
    const session = refreshed?.session || (await supabase.auth.getSession()).data.session

    if (!session) {
      setState('needLogin')
      setBusy(false)
      return
    }

    const res = await approveLogin(token, session.access_token)
    setBusy(false)

    if (res.ok) {
      setState('done')
    } else if (res.error === 'invalid user') {
      // 登录状态失效（refresh 也没救回来）—— 让用户重新登录，而不是显示一句看不懂的英文
      setState('needLogin')
      setMsg('你的登录状态已失效，请重新输入邮箱密码')
    } else {
      setState('error')
      setMsg(
        res.error === 'expired'
          ? '二维码已过期，请在电脑上刷新后重扫'
          : res.error === 'already used'
            ? '这个二维码已经用过了，请在电脑上刷新后重扫'
            : `确认失败：${res.error}`
      )
    }
  }, [token])

  async function handleLogin(e) {
    e.preventDefault()
    setBusy(true)
    setMsg('')

    const { error } = await supabase.auth.signInWithPassword({ email, password: pwd })
    if (error) {
      setBusy(false)
      setMsg('邮箱或密码不正确')
      return
    }
    // 输密码这个动作本身已经表明了意图，直接确认，
    // 不再让用户多点一次「确认登录」——实测很容易漏掉那一步。
    await confirm()
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-10">
      <h1 className="mb-6 text-center text-xl font-bold text-gray-800">同学蹭饭图</h1>

      {state === 'loading' && (
        <p className="text-center text-sm text-gray-500">正在检查登录状态…</p>
      )}

      {state === 'needLogin' && (
        <form onSubmit={handleLogin} className="flex flex-col gap-3">
          <p className="text-center text-sm text-gray-600">先登录你的账号</p>
          {msg && (
            <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{msg}</div>
          )}
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="邮箱"
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
          <input
            type="password"
            required
            value={pwd}
            onChange={(e) => setPwd(e.target.value)}
            placeholder="密码"
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
          <button
            type="submit"
            disabled={busy}
            className="rounded-lg bg-orange-500 px-4 py-2 text-sm text-white disabled:bg-gray-300"
          >
            {busy ? '登录中…' : '登录'}
          </button>
        </form>
      )}

      {state === 'ready' && (
        <div className="flex flex-col gap-4">
          <p className="text-center text-sm text-gray-600">允许这台电脑登录蹭饭图？</p>
          {msg && (
            <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{msg}</div>
          )}
          <button
            type="button"
            onClick={confirm}
            disabled={busy}
            className="rounded-lg bg-orange-500 px-4 py-3 text-sm text-white disabled:bg-gray-300"
          >
            {busy ? '确认中…' : '确认登录'}
          </button>
        </div>
      )}

      {state === 'done' && (
        <div className="text-center">
          <p className="text-lg text-green-600">✓ 已确认</p>
          <p className="mt-2 text-sm text-gray-600">
            电脑那边会自动登录，这个页面可以关掉了
          </p>
        </div>
      )}

      {state === 'error' && (
        <div className="text-center">
          <p className="text-sm text-red-600">{msg}</p>
        </div>
      )}
    </div>
  )
}
