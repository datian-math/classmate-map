import { useState, useEffect } from 'react'

// 新浪科技/商业新闻 JSONP（无 CORS 问题，免费）
const SINA_URL = 'https://feed.mix.sina.com.cn/api/roll/get?pageid=153&lid=2515&num=30&callback='

// AI 相关关键词
const AI_KEYWORDS = [
  'AI', '人工智能', '大模型', '智能', 'GPT', 'OpenAI', '机器人', '芯片', '算法',
  '模型', '训练', '英伟达', '谷歌', '微软', '华为', '数据', '自动驾驶', '数字人',
  '生成式', '机器学习', '深度学习', '神经网络',
]

export default function NewsFeed() {
  const [news, setNews] = useState([])
  const [loading, setLoading] = useState(true)
  const [source, setSource] = useState('')

  useEffect(() => {
    let cancelled = false

    function loadSina() {
      return new Promise((resolve) => {
        const cbName = 'news_cb_' + Math.random().toString(36).slice(2, 10)
        const timer = setTimeout(() => { cleanup(); resolve([]) }, 10000)

        function cleanup() {
          clearTimeout(timer)
          if (window[cbName]) delete window[cbName]
          if (script.parentNode) script.parentNode.removeChild(script)
        }

        window[cbName] = (data) => {
          resolve(data?.result?.data || [])
          cleanup()
        }

        const script = document.createElement('script')
        script.src = SINA_URL + cbName
        script.onerror = () => { resolve([]); cleanup() }
        document.head.appendChild(script)
      })
    }

    async function fetchNews() {
      const items = await loadSina()
      if (cancelled) return

      const all = items
        .filter(i => i.title)
        .map(i => ({ title: i.title, link: i.url || '', time: i.intime || '' }))

      // 优先 AI 相关新闻
      const aiNews = all.filter(n =>
        AI_KEYWORDS.some(k => n.title.toUpperCase().includes(k))
      )
      const rest = all.filter(n =>
        !AI_KEYWORDS.some(k => n.title.toUpperCase().includes(k))
      )
      const final = [...aiNews, ...rest].slice(0, 20)

      if (final.length > 0) {
        setNews(final)
        setSource('新浪科技')
      }
      setLoading(false)
    }

    fetchNews()
    return () => { cancelled = true }
  }, [])

  const fmtTime = (t) => {
    if (!t) return ''
    try {
      const d = new Date(parseInt(t) * 1000)
      if (isNaN(d.getTime())) return ''
      const h = String(d.getHours()).padStart(2, '0')
      const m = String(d.getMinutes()).padStart(2, '0')
      return `${h}:${m}`
    } catch { return '' }
  }

  const isAi = (title) => AI_KEYWORDS.some(k => title.toUpperCase().includes(k))

  return (
    <div className="bg-white rounded-xl shadow-sm p-4">
      {/* 标题栏 */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-gray-700 flex items-center gap-1.5">
          <span>🤖</span> AI 前沿
        </h3>
        <span className="text-[10px] text-gray-300">
          {source ? `${source} · ${new Date().toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' })}` : ''}
        </span>
      </div>

      {/* 新闻列表（可滚动） */}
      <div className="overflow-y-auto pr-1" style={{ maxHeight: '220px' }}>
        {loading && news.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-4">资讯加载中...</p>
        ) : news.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-4">暂无资讯</p>
        ) : (
          <ul className="space-y-1.5">
            {news.map((n, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="mt-0.5 text-[10px] font-bold text-orange-400 shrink-0 w-4 text-right">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <a
                  href={n.link || '#'}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 text-xs text-gray-600 hover:text-orange-500 transition-colors leading-relaxed line-clamp-1 group"
                >
                  {n.title}
                  {isAi(n.title) && (
                    <span className="ml-1 text-[9px] bg-blue-50 text-blue-400 px-1 py-0.5 rounded">AI</span>
                  )}
                </a>
                {n.time && (
                  <span className="text-[10px] text-gray-300 shrink-0 mt-0.5">{fmtTime(n.time)}</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {news.length >= 20 && (
        <div className="mt-2 text-center text-[10px] text-gray-300">
          ↑ 可滚动查看全部
        </div>
      )}
    </div>
  )
}
