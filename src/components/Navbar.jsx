import { Link } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'

export default function Navbar() {
  const { user, isAdmin, signOut } = useAuth()

  async function goToMathSite() {
    const { data: { session } } = await supabase.auth.getSession()
    const base = 'https://datian-math.github.io/mydeploy-web'
    const hash = session
      ? `access_token=${session.access_token}&refresh_token=${session.refresh_token || ''}`
      : ''
    window.open(`${base}#${hash}`, '_blank')
  }

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="text-xl font-bold text-orange-500 no-underline">
          同学蹭饭图
        </Link>
        <div className="flex items-center gap-4">
          {user ? (
            <>
              <button
                onClick={goToMathSite}
                className="text-sm text-purple-600 hover:text-purple-700 bg-purple-50 px-3 py-1 rounded-lg border border-purple-200 cursor-pointer"
              >
                题库
              </button>
              {isAdmin && (
                <Link to="/admin" className="text-gray-600 hover:text-orange-500 no-underline text-sm">
                  管理后台
                </Link>
              )}
              <span className="text-sm text-gray-500">{user.email}</span>
              <button
                onClick={signOut}
                className="text-sm text-gray-500 hover:text-orange-500 bg-transparent border-none cursor-pointer"
              >
                退出
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-gray-600 hover:text-orange-500 no-underline text-sm">
                登录
              </Link>
              <Link
                to="/register"
                className="bg-orange-500 text-white px-4 py-1.5 rounded-lg hover:bg-orange-600 no-underline text-sm"
              >
                注册
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
