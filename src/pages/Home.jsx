import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import ChinaMap from '../components/ChinaMap'
import { fetchApprovedStudents } from '../lib/students'
import { fetchLatestPosts } from '../lib/posts'
import { fetchWeather } from '../lib/weather'
import { useAuth } from '../lib/auth'
import { mockStudents } from '../lib/mockData'

const isSupabaseConfigured = !!import.meta.env.VITE_SUPABASE_URL

export default function Home() {
  const [students, setStudents] = useState([])
  const [posts, setPosts] = useState([])
  const [weather, setWeather] = useState(null)
  const [currentTime, setCurrentTime] = useState(new Date())
  const { user } = useAuth()

  useEffect(() => {
    if (isSupabaseConfigured) {
      fetchApprovedStudents().then(setStudents)
    } else {
      setStudents(mockStudents)
    }
    fetchLatestPosts().then(setPosts)
  }, [])

  // Fetch weather for logged-in user's city
  useEffect(() => {
    async function loadWeather() {
      let city = '钦州' // default city
      if (isSupabaseConfigured && user) {
        // In Supabase mode, look up the student's city
        const { supabase } = await import('../lib/supabase')
        const { data } = await supabase
          .from('students')
          .select('city')
          .eq('user_id', user.id)
          .single()
        if (data?.city) city = data.city
      }
      const w = await fetchWeather(city)
      setWeather(w)
    }
    loadWeather()
  }, [user])

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  // Build student id -> name map
  const studentMap = {}
  students.forEach((s) => { studentMap[s.id] = s })

  const photoPosts = posts.filter((p) => p.photo_url)
  const textPosts = posts

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <h1 className="text-3xl font-bold text-center text-gray-800 mb-2">
        大田的学生们
      </h1>
      <p className="text-center text-gray-500 mb-6">
        点击省份，看看同学们在哪个城市
      </p>

      <div className="flex gap-4">
        {/* Left sidebar - Latest photos */}
        <div className="hidden lg:flex flex-col w-52 shrink-0">
          <h3 className="text-sm font-bold text-gray-600 mb-2 px-1">最新照片</h3>
          <div className="bg-white rounded-xl shadow-sm p-2 flex-1 overflow-hidden relative">
            <div className="animate-scroll-up space-y-2">
              {[...photoPosts, ...photoPosts].map((post, i) => {
                const student = studentMap[post.student_id]
                return (
                  <Link
                    key={`${post.id}-${i}`}
                    to={student ? `/student/${student.id}` : '#'}
                    className="block group"
                  >
                    <div className="rounded-lg overflow-hidden border border-gray-100 group-hover:border-orange-300 transition-colors">
                      <img
                        src={post.photo_url}
                        alt=""
                        className="w-full h-36 object-contain bg-gray-50"
                        loading="lazy"
                      />
                      <div className="p-1.5">
                        <p className="text-xs text-gray-500 truncate">
                          {student?.name || post.author_name}
                        </p>
                        <p className="text-xs text-gray-400 truncate">
                          {post.content ? post.content.substring(0, 15) + '...' : ''}
                        </p>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        </div>

        {/* Center column */}
        <div className="flex-1 flex flex-col gap-4">
          {/* Map */}
          <div className="bg-white rounded-xl shadow-sm p-4" style={{ height: '600px' }}>
            <ChinaMap students={students} />
          </div>

          {/* Weather & Info bar */}
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              {/* Clock */}
              <div className="flex items-center gap-3">
                <span className="text-2xl">🕐</span>
                <div>
                  <p className="text-lg font-bold text-gray-800 tabular-nums">
                    {currentTime.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </p>
                  <p className="text-xs text-gray-400">
                    {currentTime.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
                  </p>
                </div>
              </div>

              {/* Weather */}
              {weather && (
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="text-3xl">{weather.icon}</span>
                    <div>
                      <p className="text-sm font-bold text-gray-800">
                        {weather.city} · {weather.weatherDesc}
                      </p>
                      <p className="text-xs text-gray-400">
                        {weather.region}
                      </p>
                    </div>
                  </div>

                  <div className="h-8 w-px bg-gray-200" />

                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-orange-500">{weather.tempC}</span>
                    <span className="text-sm text-gray-400">°C</span>
                    <span className="text-xs text-gray-400 ml-1">体感 {weather.feelsLikeC}°C</span>
                  </div>

                  <div className="h-8 w-px bg-gray-200" />

                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-500">
                    <span>💧 湿度 {weather.humidity}%</span>
                    <span>🌬️ 风速 {weather.windSpeed}km/h {weather.windDir}</span>
                    <span>👁️ 能见度 {weather.visibility}km</span>
                    <span>☀️ UV {weather.uvIndex}</span>
                  </div>
                </div>
              )}

              {!weather && (
                <div className="text-sm text-gray-400">
                  天气加载中...
                </div>
              )}

              {/* Stats */}
              <div className="flex items-center gap-4 text-xs text-gray-400">
                <span>👨‍🎓 {students.length} 位同学</span>
                <span>📍 {new Set(students.map(s => s.province)).size} 个省份</span>
              </div>
            </div>

            {/* Quick guide */}
            <div className="mt-3 pt-3 border-t border-gray-100">
              <div className="flex items-center gap-6 flex-wrap text-xs text-gray-400">
                <span>🖱️ 点击省份查看同学分布</span>
                <span>📝 注册后可填写信息、发留言</span>
                <span>📸 个人页可上传照片</span>
                <span>🔐 新注册需管理员审核</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right sidebar - Latest messages */}
        <div className="hidden lg:flex flex-col w-52 shrink-0">
          <h3 className="text-sm font-bold text-gray-600 mb-2 px-1">最新留言</h3>
          <div className="bg-white rounded-xl shadow-sm p-2 flex-1 overflow-hidden relative">
            <div className="animate-scroll-up space-y-1.5">
              {[...textPosts, ...textPosts].map((post, i) => {
                const student = studentMap[post.student_id]
                return (
                  <Link
                    key={`${post.id}-${i}`}
                    to={student ? `/student/${student.id}` : '#'}
                    className="block group"
                  >
                    <div className="p-2 rounded-lg hover:bg-orange-50 transition-colors border border-transparent group-hover:border-orange-100">
                      <div className="flex items-center gap-1.5 mb-1">
                        <div className="w-5 h-5 bg-orange-200 rounded-full flex items-center justify-center text-[10px] font-bold text-orange-700 shrink-0">
                          {(student?.name || post.author_name)[0]}
                        </div>
                        <span className="text-xs font-medium text-gray-700 truncate">
                          {student?.name || post.author_name}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 line-clamp-2">
                        {post.content}
                      </p>
                      <p className="text-[10px] text-gray-300 mt-1">
                        {new Date(post.created_at).toLocaleDateString('zh-CN')}
                      </p>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {!isSupabaseConfigured && (
        <p className="text-center text-xs text-gray-400 mt-4">
          开发模式：使用模拟数据 | 配置 Supabase 后使用真实数据
        </p>
      )}
    </div>
  )
}
