import { useCallback, useEffect, useRef, useState } from 'react'
import QRCode from 'qrcode'
import { createLoginRequest, pollStatus, claimLogin, qrUrlFor } from '../lib/qrAuth'

const TTL_MS = 5 * 60 * 1000
const POLL_MS = 2000

export default function QrLogin() {
  const [qr, setQr] = useState('')
  const [leftMs, setLeftMs] = useState(TTL_MS)
  const [err, setErr] = useState('')
  const [starting, setStarting] = useState(false)

  // token 是公开的（在二维码里），secret 只活在这个 ref 里
  const tokenRef = useRef(null)
  const secretRef = useRef(null)
  const pollRef = useRef(null)
  const tickRef = useRef(null)

  const stopTimers = useCallback(() => {
    clearInterval(pollRef.current)
    clearInterval(tickRef.current)
    pollRef.current = null
    tickRef.current = null
  }, [])

  const start = useCallback(async () => {
    stopTimers()
    setErr('')
    setQr('')
    setLeftMs(TTL_MS)
    setStarting(true)

    try {
      const { token, secret } = await createLoginRequest()
      tokenRef.current = token
      secretRef.current = secret

      // base 必须用站点根，不能用 location.pathname（登录页时是 /classmate-map/login，
      // 那个路径在 GitHub Pages 上会 404 并被兜底页丢掉 hash）
      const url = qrUrlFor(token, window.location.origin, import.meta.env.BASE_URL)
      setQr(await QRCode.toDataURL(url, { width: 240, margin: 1 }))

      pollRef.current = setInterval(async () => {
        const { status, error: pollErr } = await pollStatus(token)

        // 网络/权限错误要如实报出来，不能伪装成"二维码过期"
        if (pollErr) {
          stopTimers()
          setErr('查询登录状态失败：' + pollErr)
          return
        }
        if (status === 'expired') {
          stopTimers()
          setLeftMs(0)
          return
        }
        if (status !== 'approved') return

        // 已确认：用 secret 换回一次性登录链接，然后跳过去
        stopTimers()
        const { link, error: claimErr } = await claimLogin(token, secretRef.current)
        if (link) {
          window.location.href = link
        } else {
          setErr(
            claimErr
              ? `取回登录链接失败：${claimErr}`
              : '取回登录链接失败，请点下方按钮刷新二维码'
          )
        }
      }, POLL_MS)

      tickRef.current = setInterval(() => {
        setLeftMs((v) => {
          const next = v - 1000
          if (next <= 0) {
            stopTimers()
            return 0
          }
          return next
        })
      }, 1000)
    } catch (e) {
      setErr(e.message || '发起失败，请重试')
    } finally {
      setStarting(false)
    }
  }, [stopTimers])

  useEffect(() => {
    start()
    return stopTimers
  }, [start, stopTimers])

  const mm = Math.floor(leftMs / 60000)
  const ss = Math.floor((leftMs % 60000) / 1000)

  return (
    <div className="flex flex-col items-center gap-4 py-4">
      {err && (
        <div className="w-full rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{err}</div>
      )}

      {qr ? (
        <img
          src={qr}
          alt="登录二维码"
          className="h-60 w-60 rounded-lg border border-gray-200 bg-white p-2"
        />
      ) : (
        <div className="flex h-60 w-60 items-center justify-center rounded-lg border border-dashed border-gray-300 text-sm text-gray-400">
          {starting ? '正在生成…' : '二维码未生成'}
        </div>
      )}

      <p className="text-center text-sm text-gray-600">
        用手机相机扫码，确认后这台电脑会自动登录
      </p>
      <p className="text-center text-xs text-gray-400">
        微信扫码会打开微信内置浏览器，可能没有登录状态；用系统相机更省事
      </p>

      {leftMs > 0 ? (
        <p className="text-xs text-gray-500">
          二维码 {mm}:{String(ss).padStart(2, '0')} 后失效
        </p>
      ) : (
        <p className="text-xs text-amber-600">二维码已失效，请刷新</p>
      )}

      <button
        type="button"
        onClick={start}
        disabled={starting}
        className="rounded-lg border border-purple-200 bg-purple-50 px-4 py-1.5 text-sm text-purple-700 hover:bg-purple-100 disabled:opacity-50"
      >
        刷新二维码
      </button>
    </div>
  )
}
