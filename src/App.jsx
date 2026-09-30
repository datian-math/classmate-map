import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './lib/auth'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Province from './pages/Province'
import StudentProfile from './pages/StudentProfile'
import Login from './pages/Login'
import Register from './pages/Register'
import Admin from './pages/Admin'
import QrConfirm from './pages/QrConfirm'
import { parseQrToken } from './lib/qrAuthCore'

// 手机扫码进来的确认页：网址形如 /classmate-map/?qr=xxx
//   · 用 query 而不是 hash —— hash 在手机/微信内置浏览器里会被丢掉
//   · 路径保持在站点根，避免命中 404.html（它会把用户跳回首页）
// QrConfirm 直接调 supabase，不依赖 AuthProvider，放最外层即可。
const hasQrToken =
  typeof window !== 'undefined' &&
  !!parseQrToken(window.location.search, window.location.hash)

function App() {
  if (hasQrToken) {
    return (
      <div className="min-h-screen bg-gray-50">
        <QrConfirm />
      </div>
    )
  }

  return (
    <AuthProvider>
      <BrowserRouter basename="/classmate-map">
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <main>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/province/:code" element={<Province />} />
              <Route path="/student/:id" element={<StudentProfile />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/admin" element={<Admin />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
